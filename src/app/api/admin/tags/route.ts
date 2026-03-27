import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import BlogTag from '@/lib/db/models/BlogTag'

export async function GET() {
  await connectDB()
  const tags = await BlogTag.find().sort({ name: 1 }).lean()
  return NextResponse.json(tags)
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const tag = await BlogTag.create(body)
    return NextResponse.json(tag, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
