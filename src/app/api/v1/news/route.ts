import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import News from '@/lib/db/models/News'

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://www.asigurari.ro'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 1000)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const slug = searchParams.get('slug')

    if (slug) {
      const newsItem = await News.findOne({ slug, status: 'published' }).lean()

      if (!newsItem) {
        return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() })
      }

      await News.findByIdAndUpdate(newsItem._id, { $inc: { 'stats.views': 1 } })

      return NextResponse.json({ data: newsItem }, { headers: corsHeaders() })
    }

    const filter: Record<string, unknown> = { status: 'published' }
    if (category) filter.category = category

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      News.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      News.countDocuments(filter),
    ])

    return NextResponse.json(
      {
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers: corsHeaders() }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders() })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const slug = body.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const newsItem = await News.create({
      title: body.title,
      slug,
      category: body.category || 'general',
      content: body.content,
      authorName: body.authorName || 'Echipa asigurari.ro',
      sourceUrl: body.sourceUrl || '',
      sourceName: body.sourceName || '',
      status: 'pending_review',
    })

    return NextResponse.json(newsItem, { status: 201, headers: corsHeaders() })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders() })
  }
}
