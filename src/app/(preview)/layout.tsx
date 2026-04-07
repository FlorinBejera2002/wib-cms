import '../globals.css'

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .prose-article { font-size: 1.0625rem; line-height: 1.7; color: #374151; }
              .prose-article p { margin-bottom: 0.75em; }
              .prose-article h2 { font-size: 1.5rem; font-weight: 800; color: #111827; margin-top: 1.5em; margin-bottom: 0.5em; line-height: 1.3; }
              .prose-article h3 { font-size: 1.25rem; font-weight: 700; color: #1f2937; margin-top: 1.25em; margin-bottom: 0.4em; line-height: 1.4; }
              .prose-article h4 { font-size: 1.1rem; font-weight: 600; color: #374151; margin-top: 1em; margin-bottom: 0.35em; }
              .prose-article a { color: #15803d; text-decoration: underline; text-underline-offset: 2px; }
              .prose-article a:hover { color: #166534; }
              .prose-article ul, .prose-article ol { margin-bottom: 0.75em; padding-left: 1.5em; }
              .prose-article ul { list-style-type: disc; }
              .prose-article ol { list-style-type: decimal; }
              .prose-article li { margin-bottom: 0.125em; }
              .prose-article li p { margin: 0; }
              .prose-article li::marker { color: #9ca3af; }
              .prose-article blockquote { border-left: 4px solid #22c55e; background: #f0fdf4; padding: 1em 1.25em; margin: 1em 0; border-radius: 0 0.5rem 0.5rem 0; color: #15803d; font-style: italic; }
              .prose-article blockquote p:last-child { margin-bottom: 0; }
              .prose-article img { border-radius: 0.75rem; margin: 1em 0; max-width: 100%; height: auto; }
              .prose-article table { width: 100% !important; border-collapse: collapse !important; margin: 1em 0; font-size: 0.9375rem; border: 1px solid #d1fae5 !important; }
              .prose-article th { background: #dcfce7 !important; font-weight: 700 !important; text-align: left; padding: 0.6em 1em !important; border: 1px solid #bbf7d0 !important; color: #166534 !important; }
              .prose-article td { padding: 0.5em 1em !important; border: 1px solid #d1fae5 !important; }
              .prose-article td p, .prose-article th p { margin: 0 !important; }
              .prose-article tr:hover td { background: #f0fdf4 !important; }
              .prose-article code { background: #f3f4f6; padding: 0.15em 0.4em; border-radius: 0.25rem; font-size: 0.875em; color: #dc2626; }
              .prose-article pre { background: #1f2937; color: #e5e7eb; padding: 1.25em; border-radius: 0.75rem; overflow-x: auto; margin: 1em 0; }
              .prose-article pre code { background: none; color: inherit; padding: 0; }
              .prose-article strong { font-weight: 700; color: #111827; }
              .prose-article hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.25em 0; }
              .prose-article > *:first-child { margin-top: 0; }
              .toc-link.active { border-color: #3b82f6; background-color: #eff6ff; }
              .progress-fill { transition: width 0.15s linear; }
            `,
          }}
        />
        {children}
      </body>
    </html>
  )
}
