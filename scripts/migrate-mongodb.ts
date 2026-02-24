#!/usr/bin/env tsx
/**
 * migrate-mongodb.ts
 *
 * Migrates existing blog_posts documents from the Directus mongo-sync format
 * (camelCase fields) to the Payload CMS format (snake_case fields).
 *
 * Usage:
 *   npx tsx scripts/migrate-mongodb.ts
 *   # Or with custom URI:
 *   MONGODB_URI=mongodb://... npx tsx scripts/migrate-mongodb.ts
 *
 * What it does:
 *   1. Reads all docs from `blog_posts` collection
 *   2. Converts camelCase field names to snake_case (Payload format)
 *   3. Upserts documents back — Payload will recognise them on startup
 *   4. Prints migration report
 */

import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://192.168.0.31:27017/wib_test'
const DB_NAME = MONGODB_URI.split('/').pop()?.split('?')[0] || 'wib_test'

// ── Field mapping: old camelCase → new snake_case ──────────────────────────
const FIELD_MAP: Record<string, string> = {
  contentHtml: 'content',
  featuredImageUrl: 'featured_image_url',
  authorDisplayName: 'author_display_name',
  introText: 'intro_text',
  readingTime: 'reading_time',
  publishedAt: 'published_at',
  tocItems: 'toc_items',
  contentSections: 'content_sections',
  featuredImageAlt: 'featured_image_alt',
  socialPosted: 'social_posted',
  statsViews: 'stats_views',
  statsLikes: 'stats_likes',
  statsShares: 'stats_shares',
  statsComments: 'stats_comments',
  mongoId: 'mongo_id',
  ogTitle: 'og_title',
  ogDescription: 'og_description',
}

// Status mapping (Directus → Payload)
const STATUS_MAP: Record<string, string> = {
  published: 'published',
  draft: 'draft',
  archived: 'archived',
  pending_review: 'pending_review',
}

function convertDocument(doc: Record<string, any>): Record<string, any> {
  const converted: Record<string, any> = {
    // Preserve MongoDB _id
    _id: doc._id,
    // Tag as migrated
    mongo_id: String(doc._id),
  }

  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id') continue

    const newKey = FIELD_MAP[key] || key
    converted[newKey] = value
  }

  // Normalize status
  if (converted.status) {
    converted.status = STATUS_MAP[converted.status] || converted.status
  }

  // Ensure required Payload fields exist
  if (!converted.status) converted.status = 'draft'
  if (!converted.system) converted.system = 'common'
  if (!converted.version) converted.version = 1

  // Stats defaults
  if (converted.stats_views === undefined) converted.stats_views = 0
  if (converted.stats_likes === undefined) converted.stats_likes = 0
  if (converted.stats_shares === undefined) converted.stats_shares = 0
  if (converted.stats_comments === undefined) converted.stats_comments = 0

  return converted
}

async function main() {
  console.log(`\nConnecting to MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`)
  console.log(`Database: ${DB_NAME}\n`)

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db(DB_NAME)
    const collection = db.collection('blog_posts')

    // Count documents
    const total = await collection.countDocuments()
    console.log(`Found ${total} documents in blog_posts\n`)

    if (total === 0) {
      console.log('No documents to migrate. Exiting.')
      return
    }

    const cursor = collection.find({})

    let migrated = 0
    let skipped = 0
    let errors = 0

    while (await cursor.hasNext()) {
      const doc = await cursor.next()
      if (!doc) continue

      try {
        // Skip if already migrated (has mongo_id field)
        if (doc.mongo_id && doc.mongo_id === String(doc._id)) {
          skipped++
          process.stdout.write('.')
          continue
        }

        const converted = convertDocument(doc as Record<string, any>)

        await collection.replaceOne({ _id: doc._id }, converted, { upsert: true })

        migrated++
        process.stdout.write('+')
      } catch (err) {
        errors++
        process.stdout.write('E')
        console.error(`\nError migrating doc ${doc._id}:`, err)
      }
    }

    await cursor.close()

    console.log('\n\n── Migration Report ──────────────────────────────────')
    console.log(`Total documents:  ${total}`)
    console.log(`Migrated:         ${migrated}`)
    console.log(`Skipped (already migrated): ${skipped}`)
    console.log(`Errors:           ${errors}`)
    console.log('─────────────────────────────────────────────────────\n')

    if (errors > 0) {
      console.error(`⚠ Migration completed with ${errors} errors. Check logs above.`)
      process.exit(1)
    } else {
      console.log('✓ Migration completed successfully!')
      console.log('\nNext steps:')
      console.log('  1. Start Payload CMS: npm run dev')
      console.log('  2. Verify at http://localhost:3000/admin')
      console.log('  3. Check blog posts at /api/blog-posts')
    }
  } finally {
    await client.close()
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
