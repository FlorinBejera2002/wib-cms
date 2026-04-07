/**
 * Extracts a table-of-contents from HTML by finding H2 and H3 headings.
 * For each heading it returns { id, text, level }.
 *
 * If the heading already has an `id` attribute it is reused;
 * otherwise a slug is generated from the text content.
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/<[^>]*>/g, '')       // strip any nested HTML tags
    .replace(/&[^;]+;/g, '')       // strip HTML entities
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
}

export interface TocItem {
  id: string
  text: string
  level: number
}

/** Heading texts that indicate an inline TOC — should be excluded from tocItems */
const TOC_HEADING_RE = /^cuprins:?$/i

/**
 * Strips manually-written inline TOC blocks from HTML.
 * Matches patterns like:
 *   <p><strong>Cuprins:</strong></p> followed by <ol>...</ol>
 *   <h2>Cuprins</h2> followed by <ol>...</ol>
 * The <ol> must contain at least one <a href="#..."> to be considered a TOC list.
 */
function stripInlineToc(html: string): string {
  // Pattern 1: <p> containing "Cuprins" (possibly wrapped in <strong>) + <ol> with anchor links
  html = html.replace(
    /<p[^>]*>\s*(?:<strong[^>]*>)?\s*Cuprins:?\s*(?:<\/strong>)?\s*<\/p>\s*<ol[^>]*>([\s\S]*?)<\/ol>/gi,
    (full, olContent) => olContent.match(/<a\s[^>]*href\s*=\s*["']#/) ? '' : full
  )

  // Pattern 2: <h2>/<h3> containing "Cuprins" + <ol> with anchor links
  html = html.replace(
    /<h[23][^>]*>\s*(?:<strong[^>]*>)?\s*Cuprins:?\s*(?:<\/strong>)?\s*<\/h[23]>\s*<ol[^>]*>([\s\S]*?)<\/ol>/gi,
    (full, olContent) => olContent.match(/<a\s[^>]*href\s*=\s*["']#/) ? '' : full
  )

  return html
}

/**
 * Extracts TOC items AND injects id attributes into headings that lack them.
 * Also strips inline TOC blocks from the HTML to avoid duplication.
 * Returns { items, html } where html has id attributes on all H2/H3 tags.
 */
export function extractTocFromHtml(html: string): { items: TocItem[]; html: string } {
  if (!html) return { items: [], html }

  // Strip inline TOC blocks first
  let cleaned = stripInlineToc(html)

  const items: TocItem[] = []
  const headingRegex = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi

  cleaned = cleaned.replace(headingRegex, (fullMatch, level, attrs, innerHtml) => {
    const text = stripTags(innerHtml)
    if (!text) return fullMatch

    // Skip "Cuprins" headings
    if (TOC_HEADING_RE.test(text)) return fullMatch

    const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/)
    const id = idMatch ? idMatch[1] : slugify(text)

    items.push({ id, text, level: parseInt(level, 10) })

    // Inject id if not present
    if (idMatch) return fullMatch
    return `<h${level}${attrs} id="${id}">${innerHtml}</h${level}>`
  })

  return { items, html: cleaned }
}
