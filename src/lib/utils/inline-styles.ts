import juice from 'juice'

/**
 * Prose-article CSS ? single source of truth.
 * Matches the compact preview styles used in the CMS.
 */
const PROSE_CSS = `
  p { margin-bottom: 0.75em; }
  h2 { font-size: 1.5rem; font-weight: 800; color: #111827; margin-top: 1.5em; margin-bottom: 0.5em; line-height: 1.3; }
  h3 { font-size: 1.25rem; font-weight: 700; color: #1f2937; margin-top: 1.25em; margin-bottom: 0.4em; line-height: 1.4; }
  h4 { font-size: 1.1rem; font-weight: 600; color: #374151; margin-top: 1em; margin-bottom: 0.35em; }
  a { color: #15803d; text-decoration: underline; text-underline-offset: 2px; }
  ul, ol { margin-bottom: 0.75em; padding-left: 1.5em; }
  ul { list-style-type: disc; }
  ol { list-style-type: decimal; }
  li { margin-bottom: 0.125em; }
  li p { margin: 0; }
  blockquote { border-left: 4px solid #22c55e; background: #f0fdf4; padding: 1em 1.25em; margin: 1em 0; border-radius: 0 0.5rem 0.5rem 0; color: #15803d; font-style: italic; }
  blockquote p:last-child { margin-bottom: 0; }
  img { border-radius: 0.75rem; margin: 1em 0; max-width: 100%; height: auto; }
  table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.9375rem; border: 1px solid #d1fae5; }
  th { background: #dcfce7; font-weight: 700; text-align: left; padding: 0.6em 1em; border: 1px solid #bbf7d0; color: #166534; }
  td { padding: 0.5em 1em; border: 1px solid #d1fae5; }
  td p, th p { margin: 0; }
  code { background: #f3f4f6; padding: 0.15em 0.4em; border-radius: 0.25rem; font-size: 0.875em; color: #dc2626; }
  pre { background: #1f2937; color: #e5e7eb; padding: 1.25em; border-radius: 0.75rem; overflow-x: auto; margin: 1em 0; }
  pre code { background: none; color: inherit; padding: 0; }
  strong { font-weight: 700; color: #111827; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.25em 0; }
`

/**
 * Takes raw editor HTML and returns HTML with inline styles on every tag.
 * The result is self-contained ? no external CSS needed.
 */
export function inlineContentStyles(html: string): string {
  if (!html) return html
  return juice.inlineContent(html, PROSE_CSS, {
    removeStyleTags: false,
    preserveImportant: true,
  })
}
