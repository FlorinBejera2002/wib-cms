import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import News from '@/lib/db/models/News'
import { slugify } from '@/lib/utils/slugify'
import { calculateReadingTime } from '@/lib/utils/reading-time'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    const filter: Record<string, unknown> = {}
    if (status) filter.status = status
    if (category) filter.category = category

    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      News.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('tags')
        .lean(),
      News.countDocuments(filter),
    ])

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    const slug = body.slug || slugify(body.title)

    const readingTime = body.contentHtml
      ? calculateReadingTime(body.contentHtml)
      : undefined

    const newsItem = await News.create({
      ...body,
      slug,
      readingTime,
      publishedAt: body.status === 'published' ? new Date() : undefined,
    })

    return NextResponse.json(newsItem, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
