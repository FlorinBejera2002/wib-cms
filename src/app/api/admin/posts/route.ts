import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import BlogPost from '@/lib/db/models/BlogPost'
import { calculateReadingTime } from '@/lib/utils/reading-time'
import { firePostPublished } from '@/lib/utils/webhook'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    const readingTime = body.contentHtml
      ? calculateReadingTime(body.contentHtml)
      : undefined

    const post = await BlogPost.create({
      ...body,
      authorDisplayName: body.authorDisplayName || 'Admin',
      readingTime,
      publishedAt: body.status === 'published' ? new Date() : undefined,
    })

    if (body.status === 'published') {
      await firePostPublished({
        id: post._id.toString(),
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        system: post.system,
        publishedAt: post.publishedAt,
      })
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
