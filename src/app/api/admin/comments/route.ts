import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import BlogComment from '@/lib/db/models/BlogComment'

export async function GET(req: NextRequest) {
  await connectDB()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'

  const comments = await BlogComment.find({ status })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('post', 'title slug')
    .lean()

  return NextResponse.json(comments)
}
