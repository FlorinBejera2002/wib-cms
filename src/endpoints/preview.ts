import type { Endpoint } from 'payload'

export const previewEndpoint: Endpoint = {
  path: '/preview/:id',
  method: 'get',
  handler: async (req) => {
    const { id } = req.routeParams as { id: string }
    const token = (req.query as Record<string, string>).token

    const expectedSecret = process.env.PREVIEW_SECRET || 'ee4016c8434b8bfac95a92cb7cc44bb9'
    if (token !== expectedSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!id) {
      return Response.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    let post: any = null
    try {
      post = await req.payload.findByID({
        collection: 'blog-posts',
        id,
        depth: 2,
      })
    } catch {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    const siteUrl = process.env.SITE_URL || 'https://www.asigurari.ro'
    const featuredImageUrl =
      post.featured_image_url ||
      (typeof post.featured_image === 'object' && post.featured_image?.url
        ? `${siteUrl}${post.featured_image.url}`
        : null)

    const tags = Array.isArray(post.tags)
      ? post.tags.map((t: any) => (typeof t === 'object' ? t.name : t)).join(', ')
      : ''

    const categoryName =
      typeof post.category === 'object' ? post.category?.name : post.category || ''

    const authorName =
      post.author_display_name ||
      (typeof post.author === 'object'
        ? `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim()
        : '')

    const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview: ${escapeHtml(post.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      color: #333;
    }
    .preview-bar {
      background: #1a1a2e;
      color: white;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .preview-bar strong { color: #e94560; }
    .preview-bar .status {
      background: ${post.status === 'published' ? '#27ae60' : post.status === 'draft' ? '#e67e22' : '#95a5a6'};
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11px;
    }
    .devices {
      display: flex;
      gap: 16px;
      padding: 24px;
      overflow-x: auto;
    }
    .device-wrap {
      flex: 0 0 auto;
    }
    .device-label {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .device {
      background: white;
      border: 2px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .device.desktop { width: 1024px; }
    .device.mobile { width: 375px; }
    .article {
      padding: 32px;
    }
    .article.mobile { padding: 16px; }
    .article-meta {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .badge {
      background: #e8f4fd;
      color: #2980b9;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge.system {
      background: #fef9e7;
      color: #d4a017;
    }
    h1 {
      font-size: 2rem;
      line-height: 1.2;
      color: #1a1a2e;
      margin-bottom: 16px;
    }
    .mobile h1 { font-size: 1.4rem; }
    .excerpt {
      font-size: 1.1rem;
      color: #555;
      line-height: 1.6;
      margin-bottom: 24px;
      border-left: 4px solid #e94560;
      padding-left: 16px;
    }
    .featured-img {
      width: 100%;
      max-height: 400px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .content {
      font-size: 1rem;
      line-height: 1.8;
      color: #444;
    }
    .meta-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #eee;
      font-size: 13px;
      color: #888;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    .tag {
      background: #f0f0f0;
      color: #555;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="preview-bar">
    <div>
      <strong>Payload CMS</strong> — Preview
      <span style="margin-left:16px; color: #aaa;">ID: ${id}</span>
    </div>
    <div class="status">${post.status}</div>
  </div>

  <div class="devices">
    <!-- Desktop Preview -->
    <div class="device-wrap">
      <div class="device-label">Desktop (1024px)</div>
      <div class="device desktop">
        <div class="article">
          ${renderArticle(post, featuredImageUrl, authorName, categoryName, tags, false)}
        </div>
      </div>
    </div>

    <!-- Mobile Preview -->
    <div class="device-wrap">
      <div class="device-label">Mobile (375px)</div>
      <div class="device mobile">
        <div class="article mobile">
          ${renderArticle(post, featuredImageUrl, authorName, categoryName, tags, true)}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  },
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderArticle(
  post: any,
  featuredImageUrl: string | null,
  authorName: string,
  categoryName: string,
  tags: string,
  isMobile: boolean,
): string {
  const imgHtml = featuredImageUrl
    ? `<img src="${escapeHtml(featuredImageUrl)}" alt="${escapeHtml(post.featured_image_alt || post.title)}" class="featured-img">`
    : ''

  const tagsHtml = tags
    ? `<div class="tags">${tags
        .split(', ')
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join('')}</div>`
    : ''

  const readingTime = post.reading_time ? `${post.reading_time} min citit` : ''
  const publishedAt = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return `
    <div class="article-meta">
      ${categoryName ? `<span class="badge">${escapeHtml(categoryName)}</span>` : ''}
      ${post.system ? `<span class="badge system">${escapeHtml(post.system.toUpperCase())}</span>` : ''}
    </div>
    <h1>${escapeHtml(post.title)}</h1>
    ${post.excerpt ? `<div class="excerpt">${escapeHtml(post.excerpt)}</div>` : ''}
    ${imgHtml}
    <div class="content">
      ${post.intro_text ? `<p>${escapeHtml(post.intro_text)}</p>` : ''}
      <p><em>[Conținut articol — ${isMobile ? 'Mobile' : 'Desktop'} View]</em></p>
    </div>
    ${tagsHtml}
    <div class="meta-footer">
      ${authorName ? `<span>Autor: ${escapeHtml(authorName)}</span>` : ''}
      ${publishedAt ? `<span>Publicat: ${publishedAt}</span>` : ''}
      ${readingTime ? `<span>${readingTime}</span>` : ''}
    </div>
  `
}
