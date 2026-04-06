import { extractTocFromHtml } from './extract-toc'
import { inlineContentStyles } from './inline-styles'

const SITE_URL = 'https://www.asigurari.ro'

/**
 * Processes a blog post body before saving to DB.
 * - Auto-generates tocItems from contentHtml headings
 * - Fills in SEO/social defaults
 * - Strips redundant legacy fields
 * - Calculates reading time
 */
export function preparePostForSave(
  body: Record<string, unknown>,
  existingReadingTime?: number
): Record<string, unknown> {
  const data = { ...body }

  // --- Strip empty ObjectId fields (prevent BSON cast errors) ---
  if (!data.category) delete data.category

  // --- Strip redundant legacy fields ---
  delete data.introText
  delete data.conclusion
  delete data.contentBlocks
  delete data.contentSections

  // --- Auto-generate tocItems from contentHtml ---
  const html = data.contentHtml as string | undefined
  if (html) {
    data.tocItems = extractTocFromHtml(html)
    data.contentHtml = inlineContentStyles(html)
  }

  // --- Auto-fill SEO defaults ---
  const seo = (data.seo as Record<string, unknown>) || {}
  const title = data.title as string | undefined
  const slug = data.slug as string | undefined
  const system = data.system as string | undefined
  const excerpt = data.excerpt as string | undefined

  if (!seo.metaTitle && title) {
    seo.metaTitle = title
  }
  if (!seo.canonicalUrl && system && slug) {
    seo.canonicalUrl = `${SITE_URL}/blog/${system}/${slug}`
  }
  data.seo = seo

  // --- Auto-fill social defaults ---
  const social = (data.social as Record<string, unknown>) || {}
  if (!social.ogTitle && title) {
    social.ogTitle = title
  }
  if (!social.ogDescription && excerpt) {
    social.ogDescription = excerpt
  }
  data.social = social

  return data
}
