import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db/connection'
import News, { type INews, type NewsCategory } from '@/lib/db/models/News'
import BlogTag from '@/lib/db/models/BlogTag'

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */

const CATEGORY_MAP: Record<
  NewsCategory,
  { label: string; color: string }
> = {
  rca: { label: 'RCA', color: 'green' },
  casco: { label: 'CASCO', color: 'emerald' },
  legislatie: { label: 'Legislatie', color: 'purple' },
  piata: { label: 'Piata', color: 'teal' },
  sfaturi: { label: 'Sfaturi', color: 'amber' },
  travel: { label: 'Calatorie', color: 'sky' },
  home: { label: 'Locuinta', color: 'orange' },
  health: { label: 'Sanatate', color: 'rose' },
  general: { label: 'General', color: 'gray' },
}

const COLOR_CSS: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  purple: 'bg-purple-100 text-purple-700',
  teal: 'bg-teal-100 text-teal-700',
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
  orange: 'bg-orange-100 text-orange-700',
  rose: 'bg-rose-100 text-rose-700',
  gray: 'bg-gray-100 text-gray-700',
}

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'In Review',
  published: 'Publicat',
  archived: 'Arhivat',
}

/* ------------------------------------------------------------------ */
/*  Date formatter (Romanian months)                                   */
/* ------------------------------------------------------------------ */

const RO_MONTHS = [
  'Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun',
  'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatDateRo(date: Date | string | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  return `${String(d.getDate()).padStart(2, '0')} ${RO_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/* ------------------------------------------------------------------ */
/*  Server Component                                                   */
/* ------------------------------------------------------------------ */

export default async function NewsPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await connectDB()

  let doc: INews | null = null
  try {
    doc = await News.findById(id).lean<INews>()
  } catch {
    notFound()
  }

  if (!doc) notFound()

  // Serialize MongoDB document (handles ObjectId, Date, etc.)
  const item = JSON.parse(JSON.stringify(doc)) as INews & { _id: string }

  // Resolve tags
  let tagNames: string[] = []
  if (item.tags && item.tags.length > 0) {
    try {
      const tagDocs = await BlogTag.find({ _id: { $in: item.tags } }).lean()
      tagNames = JSON.parse(JSON.stringify(tagDocs)).map(
        (t: { name: string }) => t.name,
      )
    } catch {
      // silently ignore tag resolution errors
    }
  }

  // Derive helpers
  const cat = CATEGORY_MAP[item.category] ?? { label: item.category, color: 'green' }
  const catCss = COLOR_CSS[cat.color] ?? COLOR_CSS.green
  const authorName = item.authorName || 'Echipa asigurari.ro'
  const authorInitial = (authorName.charAt(0) || 'E').toUpperCase()
  const shareUrl = `https://www.asigurari.ro/news/${item.slug}`
  const shareTitle = encodeURIComponent(item.title)
  const sourceDomain = item.sourceUrl
    ? item.sourceUrl.replace(/^https?:\/\//, '').split('/')[0]
    : ''

  return (
    <html lang="ro">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, nofollow" />
        <title>{item.title} | Preview | WIB CMS</title>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
        {/* Tailwind CDN for standalone preview */}
        <script src="https://cdn.tailwindcss.com" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* ?? Prose Article Typography (mirrors WIB production) ?? */
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
          .prose-article blockquote {
            border-left: 4px solid #22c55e;
            background: #f0fdf4;
            padding: 1em 1.25em;
            margin: 1em 0;
            border-radius: 0 0.5rem 0.5rem 0;
            color: #15803d;
            font-style: italic;
          }
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

          .progress-fill { transition: width 0.15s linear; }
        `,
          }}
        />
      </head>
      <body className="bg-gray-50 min-h-screen">
        {/* ================================================================ */}
        {/*  PREVIEW BANNER                                                  */}
        {/* ================================================================ */}
        <div className="bg-amber-500 text-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="fas fa-eye text-xl" />
              <div>
                <span className="font-bold">MOD PREVIEW</span>
                <span className="text-amber-100 text-sm ml-2">
                  Status:{' '}
                  <span className="bg-amber-600 px-2 py-0.5 rounded text-xs font-mono">
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </span>
              </div>
            </div>
            <a
              href={`/admin/news/${id}/edit`}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-semibold transition-colors no-underline text-white"
            >
              <i className="fas fa-arrow-left mr-1" />
              Inapoi la editor
            </a>
          </div>
        </div>

        {/* ================================================================ */}
        {/*  MAIN CONTENT AREA                                               */}
        {/* ================================================================ */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {/* Featured image */}
          {item.featuredImageUrl && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.featuredImageUrl}
                alt={item.title}
                className="w-full h-auto object-cover aspect-[16/7] md:aspect-[16/6]"
                loading="eager"
              />
            </div>
          )}

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ?????????????????????????????????????????????? */}
            {/*  ARTICLE COLUMN                                */}
            {/* ?????????????????????????????????????????????? */}
            <article className="flex-1 min-w-0" id="article-content">
              <div className="bg-white shadow-sm rounded-2xl p-6 md:p-8">
                {/* Breadcrumb */}
                <nav className="mb-6" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                    <li>
                      <span className="hover:text-green-700 transition-colors cursor-default">
                        Acasa
                      </span>
                    </li>
                    <li>
                      <i className="fas fa-chevron-right text-[10px] text-gray-300" />
                    </li>
                    <li>
                      <span className="hover:text-green-700 transition-colors cursor-default">
                        Stiri
                      </span>
                    </li>
                    {item.category && (
                      <>
                        <li>
                          <i className="fas fa-chevron-right text-[10px] text-gray-300" />
                        </li>
                        <li>
                          <span className="hover:text-green-700 transition-colors cursor-default">
                            {cat.label}
                          </span>
                        </li>
                      </>
                    )}
                    <li>
                      <i className="fas fa-chevron-right text-[10px] text-gray-300" />
                    </li>
                    <li className="text-gray-400 truncate max-w-[200px]">
                      {item.title}
                    </li>
                  </ol>
                </nav>

                {/* Article header */}
                <header className="mb-8">
                  {/* Category badge */}
                  {item.category && (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${catCss} mb-4`}
                    >
                      {cat.label}
                    </span>
                  )}

                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-5">
                    {item.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {authorInitial}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 text-sm leading-tight">
                          {authorName}
                        </span>
                        {item.publishedAt && (
                          <span className="text-xs text-gray-400">
                            {formatDateRo(item.publishedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                      {item.readingTime && item.readingTime > 0 && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <i className="far fa-clock text-gray-400" />
                          {item.readingTime} min
                        </span>
                      )}
                      {item.stats?.views && item.stats.views > 0 && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <i className="far fa-eye text-gray-400" />
                          {item.stats.views}
                        </span>
                      )}
                    </div>
                  </div>
                </header>

                {/* Article body */}
                <div
                  className="prose-article"
                  dangerouslySetInnerHTML={{
                    __html: item.contentHtml || '<p class="text-gray-400 italic">Continut indisponibil.</p>',
                  }}
                />

                {/* Share buttons */}
                <div className="flex items-center gap-3 pt-6 border-t border-gray-200 mt-8">
                  <span className="text-sm font-semibold text-gray-700 mr-1">
                    Distribuie:
                  </span>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 hover:scale-110 transition-all duration-200 shadow-sm"
                  >
                    <i className="fab fa-facebook-f" />
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 text-white hover:bg-black hover:scale-110 transition-all duration-200 shadow-sm"
                  >
                    <i className="fab fa-twitter" />
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-green-700 text-white hover:bg-green-800 hover:scale-110 transition-all duration-200 shadow-sm"
                  >
                    <i className="fab fa-linkedin-in" />
                  </a>
                </div>

                {/* Source link */}
                {(item.sourceName || item.sourceUrl) && (
                  <p className="text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200">
                    <i className="fas fa-link mr-1.5" />
                    Sursa:{' '}
                    {item.sourceUrl ? (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        {item.sourceName || sourceDomain}
                      </a>
                    ) : (
                      <span>{item.sourceName}</span>
                    )}
                  </p>
                )}
              </div>

              {/* Tags */}
              {tagNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 mb-8">
                  {tagNames.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-gray-50 text-gray-600 border border-gray-200"
                    >
                      <i className="fas fa-hashtag text-[9px] mr-1 text-gray-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>

            {/* ?????????????????????????????????????????????? */}
            {/*  SIDEBAR                                       */}
            {/* ?????????????????????????????????????????????? */}
            <aside className="w-full lg:w-72 flex-shrink-0 space-y-6 lg:pt-0">
              {/* Share widget */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
                  <i className="fas fa-share-alt text-green-600" />
                  Distribuie stirea
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 py-2 bg-green-50 hover:bg-green-100 rounded-xl text-green-700 text-xs font-medium transition-colors no-underline"
                  >
                    <i className="fab fa-facebook-f text-lg" />
                    Facebook
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 py-2 bg-sky-50 hover:bg-sky-100 rounded-xl text-sky-700 text-xs font-medium transition-colors no-underline"
                  >
                    <i className="fab fa-twitter text-lg" />
                    Twitter
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 py-2 bg-green-50 hover:bg-green-100 rounded-xl text-green-700 text-xs font-medium transition-colors no-underline"
                  >
                    <i className="fab fa-linkedin-in text-lg" />
                    LinkedIn
                  </a>
                </div>
              </div>

              {/* CTA: Trimite o stire */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <i className="fas fa-bullhorn text-yellow-400" />
                  Trimite o stire
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Ai aflat ceva important?
                </p>
                <span className="block text-center py-2.5 bg-green-600 hover:bg-green-500 rounded-xl font-semibold transition-colors cursor-default">
                  Trimite stire &rarr;
                </span>
              </div>

              {/* Back to news */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                <span className="text-green-600 hover:text-green-800 font-medium flex items-center justify-center gap-2 group cursor-default">
                  <i className="fas fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform" />
                  Inapoi la stiri
                </span>
              </div>
            </aside>
          </div>
        </div>

        {/* ================================================================ */}
        {/*  READING PROGRESS BAR                                            */}
        {/* ================================================================ */}
        <div
          id="reading-progress"
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-gray-700 to-green-600 z-50 w-0"
          style={{ transition: 'width 0.15s linear' }}
        />

        {/* Client-side reading progress script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              var progress = document.getElementById('reading-progress');
              var content  = document.getElementById('article-content');
              if (!progress || !content) return;

              function update() {
                var rect     = content.getBoundingClientRect();
                var top      = rect.top + window.pageYOffset;
                var height   = content.offsetHeight;
                var scrolled = window.pageYOffset - top + window.innerHeight;
                var pct      = Math.min(100, Math.max(0, (scrolled / height) * 100));
                progress.style.width = pct + '%';
              }

              window.addEventListener('scroll', update, { passive: true });
              update();
            })();
          `,
          }}
        />
      </body>
    </html>
  )
}
