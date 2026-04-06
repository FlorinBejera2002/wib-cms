import { NextRequest, NextResponse } from 'next/server'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

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

  const delivery = (body.delivery as string) || 'json'
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 90000)

  try {
    const res = await fetch(SEO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SEO-Tool-Key': SEO_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown upstream error' }))
      return NextResponse.json(errorData, { status: res.status })
    }

    // SSE path: stream through directly
    if (delivery === 'sse') {
      const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })
      return new Response(res.body, { status: 200, headers })
    }

    // JSON path: augment article with content_html
    const data = await res.json()

    if (data.article?.content_markdown) {
      const htmlRaw = marked.parse(data.article.content_markdown) as string
      data.article.content_html = DOMPurify.sanitize(htmlRaw)
    }

    return NextResponse.json(data)
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
