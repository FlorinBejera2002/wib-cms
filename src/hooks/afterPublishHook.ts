import type { CollectionAfterChangeHook } from 'payload'

export const afterPublishHook: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
}) => {
  // Trigger n8n webhook only when status changes to 'published'
  const justPublished =
    doc.status === 'published' &&
    (operation === 'create' || previousDoc?.status !== 'published')

  if (!justPublished) return doc

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('[afterPublishHook] N8N_WEBHOOK_URL not set, skipping webhook')
    return doc
  }

  const payload = {
    title: doc.title,
    slug: doc.slug,
    system: doc.system,
    excerpt: doc.excerpt,
    featured_image_url:
      doc.featured_image_url ||
      (typeof doc.featured_image === 'object' ? doc.featured_image?.url : null),
    tags: Array.isArray(doc.tags)
      ? doc.tags.map((t: any) => (typeof t === 'object' ? t.name : t))
      : [],
    url: `${process.env.SITE_URL || 'https://www.asigurari.ro'}/blog/${doc.slug}`,
  }

  try {
    const res = await fetch(`${webhookUrl}/webhook/blog-published`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      console.error(`[afterPublishHook] n8n responded with ${res.status}`)
    } else {
      console.log(`[afterPublishHook] n8n webhook triggered for "${doc.title}"`)
    }
  } catch (err) {
    // Don't throw — hook failure must not block the save
    console.error('[afterPublishHook] Failed to call n8n webhook:', err)
  }

  return doc
}
