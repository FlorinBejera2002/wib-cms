import { NextRequest, NextResponse } from 'next/server'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

// gfm: true is the default in marked, no config needed

const SEO_API_URL = process.env.SEO_TOOL_API_URL
const SEO_API_KEY = process.env.SEO_TOOL_STATIC_KEY

export async function POST(request: NextRequest) {
  if (!SEO_API_URL || !SEO_API_KEY) {
    return NextResponse.json(
      { error: 'SEO tool not configured' },
      { status: 503 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { title, description, keywords } = body as {
    title?: string
    description?: string
    keywords?: string[]
  }

  if (!title && !description) {
    return NextResponse.json(
      { error: 'Title or description is required' },
      { status: 400 }
    )
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000)

  try {
    const apiPayload: Record<string, unknown> = {}
    if (title) apiPayload.title = title
    if (description) apiPayload.description = description
    if (keywords && keywords.length > 0) apiPayload.keywords = keywords

    const res = await fetch(SEO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SEO-Tool-Key': SEO_API_KEY,
      },
      body: JSON.stringify(apiPayload),
      signal: controller.signal,
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown upstream error' }))
      return NextResponse.json(errorData, { status: res.status })
    }

    const data = await res.json()

    const contentMarkdown: string = data.article?.content_markdown || ''
    const contentHtmlRaw = marked.parse(contentMarkdown) as string
    const contentHtml = DOMPurify.sanitize(contentHtmlRaw)

    return NextResponse.json({
      article: {
        title: data.article?.title || '',
        summary: data.article?.summary || '',
        meta_description: data.article?.meta_description || '',
        content_html: contentHtml,
      },
      keywords: data.keywords || [],
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to connect to SEO service' },
      { status: 500 }
    )
  } finally {
    clearTimeout(timeoutId)
  }
}
