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

export function extractTocFromHtml(html: string): TocItem[] {
  if (!html) return []

  const items: TocItem[] = []
  // Match <h2> and <h3> tags (with optional attributes including id)
  const headingRegex = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10)
    const attrs = match[2]
    const innerHtml = match[3]
    const text = stripTags(innerHtml)

    if (!text) continue

    // Try to extract existing id attribute
    const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/)
    const id = idMatch ? idMatch[1] : slugify(text)

    items.push({ id, text, level })
  }

  return items
}
