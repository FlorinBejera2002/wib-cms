/**
 * Migration script: Clean up all blog posts in the database.
 *
 * For each document:
 * 1. Regenerates tocItems from H2/H3 headings in contentHtml
 * 2. Unsets introText, conclusion, contentBlocks, contentSections
 * 3. Fills in seo.canonicalUrl if missing
 * 4. Fills in social.ogTitle / social.ogDescription if missing
 * 5. Recalculates readingTime
 *
 * Usage:
 *   npx tsx src/scripts/clean-blog-posts.ts           # execute
 *   npx tsx src/scripts/clean-blog-posts.ts --dry-run  # preview only
 */

import mongoose from 'mongoose'
import { extractTocFromHtml } from '../lib/utils/extract-toc'
import { inlineContentStyles } from '../lib/utils/inline-styles'
import { calculateReadingTime } from '../lib/utils/reading-time'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://192.168.0.31:27017/wib_test'
const SITE_URL = 'https://www.asigurari.ro'
const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  console.log(`Connecting to ${MONGODB_URI}...`)
  await mongoose.connect(MONGODB_URI)
  console.log('Connected.\n')

  if (DRY_RUN) {
    console.log('=== DRY RUN MODE (no writes) ===\n')
  }

  const db = mongoose.connection.db!
  const collection = db.collection('blog_posts')

  const posts = await collection.find({}).toArray()
  console.log(`Found ${posts.length} posts to process.\n`)

  let updated = 0
  let skipped = 0

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    const slug = post.slug || '(no slug)'
    const prefix = `[${i + 1}/${posts.length}] ${slug}`

    const html = post.contentHtml || ''
    if (!html) {
      console.log(`${prefix} — SKIPPED (no contentHtml)`)
      skipped++
      continue
    }

    // Generate tocItems, inject heading ids, strip inline TOC
    const toc = extractTocFromHtml(html)
    const tocItems = toc.items
    const cleanedHtml = inlineContentStyles(toc.html)

    // Calculate reading time
    const readingTime = calculateReadingTime(html)

    // SEO defaults
    const seo = post.seo || {}
    const seoUpdate: Record<string, string> = {}
    if (!seo.canonicalUrl && post.system && post.slug) {
      seoUpdate['seo.canonicalUrl'] = `${SITE_URL}/blog/${post.system}/${post.slug}`
    }
    if (!seo.metaTitle && post.title) {
      seoUpdate['seo.metaTitle'] = post.title
    }

    // Social defaults
    const social = post.social || {}
    const socialUpdate: Record<string, string> = {}
    if (!social.ogTitle && post.title) {
      socialUpdate['social.ogTitle'] = post.title
    }
    if (!social.ogDescription && post.excerpt) {
      socialUpdate['social.ogDescription'] = post.excerpt
    }

    // Track what we're removing
    const removing: string[] = []
    if (post.introText !== undefined) removing.push('introText')
    if (post.conclusion !== undefined) removing.push('conclusion')
    if (post.contentBlocks !== undefined) removing.push('contentBlocks')
    if (post.contentSections !== undefined) removing.push('contentSections')

    console.log(
      `${prefix} — tocItems: ${tocItems.length}, readingTime: ${readingTime}min` +
      (removing.length > 0 ? `, removing: ${removing.join(', ')}` : '') +
      (Object.keys(seoUpdate).length > 0 ? `, seo: ${Object.keys(seoUpdate).join(', ')}` : '') +
      (Object.keys(socialUpdate).length > 0 ? `, social: ${Object.keys(socialUpdate).join(', ')}` : '')
    )

    if (!DRY_RUN) {
      await collection.updateOne(
        { _id: post._id },
        {
          $set: {
            tocItems,
            contentHtml: cleanedHtml,
            readingTime,
            ...seoUpdate,
            ...socialUpdate,
          },
          $unset: {
            introText: '',
            conclusion: '',
            contentBlocks: '',
            contentSections: '',
          },
        }
      )
    }

    updated++
  }

  console.log(`\nDone. ${updated} updated, ${skipped} skipped.`)
  if (DRY_RUN) {
    console.log('(Dry run — no changes were written)')
  }

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
