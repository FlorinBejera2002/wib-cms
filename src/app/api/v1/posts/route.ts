import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import BlogPost from '@/lib/db/models/BlogPost'
import BlogTag from '@/lib/db/models/BlogTag'

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://www.asigurari.ro'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 1000)
    const system = searchParams.get('system')
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'publishedAt'
    const slug = searchParams.get('slug')

    if (slug) {
      const post = await BlogPost.findOne({ slug, status: 'published' })
        .select('-introText -conclusion -contentBlocks -contentSections -content')
        .populate('category', 'name slug')
        .populate('tags', 'name slug')
        .lean()

      if (!post) {
        return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() })
      }

      await BlogPost.findByIdAndUpdate(post._id, { $inc: { 'stats.views': 1 } })

      return NextResponse.json({ data: post }, { headers: corsHeaders() })
    }

    const filter: Record<string, unknown> = { status: 'published' }
    if (system) filter.system = system
    if (category) filter.category = category

    // Tag filter: find tag by slug first, then filter posts
    if (tag) {
      const tagDoc = await BlogTag.findOne({ slug: tag }).lean()
      if (tagDoc) {
        filter.tags = tagDoc._id
      } else {
        // No matching tag — return empty results
        return NextResponse.json(
          { data: [], pagination: { page, limit, total: 0, totalPages: 0 } },
          { headers: corsHeaders() }
        )
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit
    const sortField = sort === 'views' ? 'stats.views' : 'publishedAt'
    const sortOrder = -1

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('title slug system excerpt featuredImageUrl featuredImageAlt readingTime publishedAt stats category tags seo social status commentsEnabled version createdAt updatedAt')
        .populate('category', 'name slug')
        .populate('tags', 'name slug')
        .lean(),
      BlogPost.countDocuments(filter),
    ])

    return NextResponse.json(
      {
        data: posts,
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
