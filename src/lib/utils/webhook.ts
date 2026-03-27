export interface WebhookPayload {
  event: string
  data: Record<string, unknown>
  timestamp: string
}

export async function fireWebhook(payload: WebhookPayload): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('Webhook delivery failed:', error)
  }
}

export async function firePostPublished(post: {
  id: string
  title: string
  slug: string
  excerpt?: string
  system?: string
  publishedAt?: Date
}): Promise<void> {
  const siteUrl = process.env.SITE_URL || 'https://www.asigurari.ro'
  await fireWebhook({
    event: 'post.published',
    data: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      url: `${siteUrl}/blog/${post.slug}`,
      excerpt: post.excerpt || '',
      system: post.system || 'common',
      publishedAt: post.publishedAt?.toISOString() || new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  })
}
