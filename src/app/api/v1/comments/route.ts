import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import BlogComment from '@/lib/db/models/BlogComment'

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
    const postId = searchParams.get('post')
    const status = searchParams.get('status') || 'approved'

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400, headers: corsHeaders() })
    }

    const comments = await BlogComment.find({ post: postId, status })
      .sort({ createdAt: 1 })
      .lean()

    return NextResponse.json({ data: comments }, { headers: corsHeaders() })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders() })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    if (!body.post || !body.author?.name || !body.content) {
      return NextResponse.json(
        { error: 'Post, author name, and content are required' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const comment = await BlogComment.create({
      post: body.post,
      author: {
        name: body.author.name,
        email: body.author.email || '',
      },
      content: body.content,
      status: 'pending',
      parentComment: body.parentComment || null,
    })

    return NextResponse.json(comment, { status: 201, headers: corsHeaders() })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders() })
  }
}
