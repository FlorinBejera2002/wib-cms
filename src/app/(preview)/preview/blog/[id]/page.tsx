import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import connectDB from '@/lib/db/connection'
import BlogPost from '@/lib/db/models/BlogPost'
import '@/lib/db/models/BlogCategory'
import '@/lib/db/models/BlogTag'

/* ------------------------------------------------------------------ */
/*  System colour & label maps (mirrors the Twig template)            */
/* ------------------------------------------------------------------ */
const SYSTEM_COLORS: Record<string, string> = {
  rca: 'bg-green-100 text-green-700',
  casco: 'bg-emerald-100 text-emerald-700',
  travel: 'bg-amber-100 text-amber-700',
  home: 'bg-orange-100 text-orange-700',
  health: 'bg-rose-100 text-rose-700',
  life: 'bg-purple-100 text-purple-700',
  common: 'bg-gray-100 text-gray-700',
  accidents: 'bg-red-100 text-red-700',
  breakdown: 'bg-yellow-100 text-yellow-700',
  cmr: 'bg-teal-100 text-teal-700',
  rcp: 'bg-pink-100 text-pink-700',
  malpraxis: 'bg-pink-100 text-pink-700',
}

const SYSTEM_LABELS: Record<string, string> = {
  rca: 'RCA',
  casco: 'CASCO',
  travel: 'Calatorie',
  home: 'Locuinta',
  health: 'Sanatate',
  life: 'Viata',
  common: 'General',
  accidents: 'Accidente',
  breakdown: 'Avarii',
  cmr: 'CMR',
  rcp: 'RCP',
  malpraxis: 'Malpraxis',
}

/* ------------------------------------------------------------------ */
/*  Status badge colours for preview banner                           */
/* ------------------------------------------------------------------ */
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-600',
  pending_review: 'bg-orange-600',
  published: 'bg-green-600',
  archived: 'bg-gray-600',
}

/* ------------------------------------------------------------------ */
/*  Helper: format a date as "dd.MM.YYYY" in Romanian                 */
/* ------------------------------------------------------------------ */
const RO_MONTHS = [
  'Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun',
  'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const mon = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${mon}.${year}`
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                          */
/* ------------------------------------------------------------------ */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  await connectDB()
  const post = await BlogPost.findById(id).lean()
  if (!post) return { title: 'Articol negasit' }

  return {
    title: `${(post as any).seo?.metaTitle || (post as any).title} | Preview`,
    description: (post as any).seo?.metaDescription || (post as any).excerpt || '',
    robots: { index: false, follow: false },
  }
}

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */
export default async function BlogPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await connectDB()

  const doc = await BlogPost.findById(id)
    .populate('category')
    .populate('tags')
    .lean()

  if (!doc) {
    notFound()
  }

  // Safely serialise Mongo documents (ObjectId, Date, etc.)
  const post = JSON.parse(JSON.stringify(doc)) as any

  const systemLabel =
    SYSTEM_LABELS[post.system] || (post.system ? post.system.toUpperCase() : '')
  const systemColor =
    SYSTEM_COLORS[post.system] || 'bg-green-100 text-green-700'
  const authorName = 'Asigurari.ro'
  const dateFormatted = formatDate(post.publishedAt || post.createdAt)
  const views = post.stats?.views ?? 0
  const readingTime = post.readingTime ?? 0

  // Tags can be populated objects or plain strings
  const tags: { name: string; slug: string }[] = (post.tags || []).map(
    (t: any) =>
      typeof t === 'string'
        ? { name: t, slug: t }
        : { name: t.name || t, slug: t.slug || t }
  )

  const articleUrl = `https://www.asigurari.ro/blog/${post.system}/${post.slug}`
  const encodedTitle = encodeURIComponent(post.title)

  return (
    <>
      {/* ===== Preview Banner ===== */}
      <div className="bg-amber-500 text-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="fas fa-eye text-xl" />
              <div>
                <span className="font-bold">MOD PREVIEW</span>
                <span className="text-amber-100 text-sm ml-2">
                  Status:{' '}
                  <span
                    className={`${STATUS_COLORS[post.status] || 'bg-amber-600'} px-2 py-0.5 rounded text-xs font-mono`}
                  >
                    {post.status}
                  </span>
                </span>
              </div>
            </div>
            <a
              href={`/admin/posts/${post._id}/edit`}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-semibold transition-colors text-white no-underline"
            >
              <i className="fas fa-arrow-left mr-1" />
              Inapoi la editor
            </a>
          </div>
        </div>

        {/* ===== Article Content ===== */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <div className="bg-white shadow-sm rounded-2xl p-6 md:p-10 mb-8">
            {/* ===== Breadcrumb ===== */}
            <nav className="mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
                <li>
                  <a href="https://www.asigurari.ro/" className="hover:text-green-700 transition-colors">
                    Acasa
                  </a>
                </li>
                <li className="text-gray-300">/</li>
                <li>
                  <a href="https://www.asigurari.ro/blog" className="hover:text-green-700 transition-colors">
                    Blog
                  </a>
                </li>
                {post.system && (
                  <>
                    <li className="text-gray-300">/</li>
                    <li>
                      <a
                        href={`https://www.asigurari.ro/blog?system=${post.system}`}
                        className="hover:text-green-700 transition-colors"
                      >
                        {systemLabel}
                      </a>
                    </li>
                  </>
                )}
                <li className="text-gray-300">/</li>
                <li className="text-gray-400 truncate max-w-[250px] font-medium">
                  {post.title}
                </li>
              </ol>
            </nav>

            {/* ===== Main Article ===== */}
            <article id="article-content">
              {/* ===== Article Header ===== */}
              <header className="mb-6">
                {post.system && (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${systemColor} mb-3`}
                  >
                    {systemLabel}
                  </span>
                )}

                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                  {post.title}
                </h1>

                <div className="flex items-center gap-2.5 text-sm text-gray-500 mb-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="w-5 h-5 object-contain" src="/icon.svg" alt="asigurari.ro" />
                  <span className="font-semibold text-gray-800">{authorName}</span>
                  {dateFormatted && (
                    <>
                      <i className="far fa-calendar-alt text-gray-400 text-xs" />
                      <span className="text-gray-400 text-sm">{dateFormatted}</span>
                    </>
                  )}
                  {readingTime > 0 && (
                    <>
                      <span className="text-gray-300">·</span>
                      <i className="far fa-clock text-gray-400 text-xs" />
                      <span className="text-gray-400 text-sm">{readingTime} min lectura</span>
                    </>
                  )}
                  {views > 0 && (
                    <>
                      <span className="text-gray-300">·</span>
                      <i className="far fa-eye text-gray-400 text-xs" />
                      <span className="text-gray-400 text-sm">{views} vizualizari</span>
                    </>
                  )}
                </div>
              </header>

              {/* ===== Featured Image ===== */}
              {post.featuredImageUrl && (
                <div className="mb-8 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.featuredImageUrl}
                    alt={post.featuredImageAlt || post.title}
                    className="w-full h-auto object-cover"
                    loading="eager"
                  />
                </div>
              )}

              {/* ===== Table of Contents ===== */}
              {Array.isArray(post.tocItems) && post.tocItems.length >= 2 && (
                <nav aria-label="Cuprins" className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <i className="fas fa-list text-green-700" />
                    <span className="text-base font-bold text-gray-800">Cuprins</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {post.tocItems
                      .filter((item: { level: number }) => item.level === 2)
                      .map((item: { id: string; text: string; level: number }) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="toc-link flex items-start gap-2.5 p-3 rounded-lg border-2 border-gray-100 bg-white hover:border-green-400 hover:bg-green-50 transition-colors no-underline"
                      >
                        <i className="fas fa-chevron-right mt-0.5 shrink-0 text-sm text-green-500" />
                        <span className="font-semibold text-gray-800 leading-snug">
                          {item.text}
                        </span>
                      </a>
                    ))}
                  </div>
                </nav>
              )}

              {/* ===== Article Body ===== */}
              <div
                className="prose-article"
                dangerouslySetInnerHTML={{
                  __html: (post.contentHtml || '') + '',
                }}
              />

              {/* ===== Share Buttons ===== */}
              <div className="flex items-center gap-3 pt-6 border-t border-gray-200 mt-8">
                <span className="text-sm font-semibold text-gray-700 mr-1">
                  Distribuie:
                </span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${articleUrl}`}
                  target="_blank"
                  rel="noopener"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 hover:scale-110 transition-all duration-200 shadow-sm"
                  title="Facebook"
                >
                  <i className="fab fa-facebook-f text-sm text-white no-underline" />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${articleUrl}&text=${encodedTitle}`}
                  target="_blank"
                  rel="noopener"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 text-white hover:bg-black hover:scale-110 transition-all duration-200 shadow-sm"
                  title="Twitter / X"
                >
                  <i className="fab fa-twitter text-sm text-white no-underline" />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${articleUrl}`}
                  target="_blank"
                  rel="noopener"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-green-700 text-white hover:bg-green-800 hover:scale-110 transition-all duration-200 shadow-sm"
                  title="LinkedIn"
                >
                  <i className="fab fa-linkedin-in text-sm text-white no-underline" />
                </a>
                <a
                  href={`https://wa.me/?text=${encodedTitle}%20${articleUrl}`}
                  target="_blank"
                  rel="noopener"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 hover:scale-110 transition-all duration-200 shadow-sm"
                  title="WhatsApp"
                >
                  <i className="fab fa-whatsapp text-sm text-white no-underline" />
                </a>
              </div>

              {/* ===== Tags ===== */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 mb-6">
                  {tags.map((tag) => (
                    <span
                      key={tag.slug}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-gray-50 text-gray-600 border border-gray-200 font-medium"
                    >
                      <i className="fas fa-hashtag text-[9px] mr-1 text-gray-400" />
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </article>
          </div>
      </div>
    </>
  )
}
