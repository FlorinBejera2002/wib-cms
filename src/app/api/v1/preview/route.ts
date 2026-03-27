import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import BlogPost from '@/lib/db/models/BlogPost'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const token = searchParams.get('token')

  const previewSecret = process.env.PREVIEW_SECRET
  if (!previewSecret || token !== previewSecret) {
    return NextResponse.json({ error: 'Invalid preview token' }, { status: 401 })
  }

  if (!slug) {
    return NextResponse.json({ error: 'Slug required' }, { status: 400 })
  }

  try {
    await connectDB()
    const post = await BlogPost.findOne({ slug })
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .lean()

    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ data: post })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
