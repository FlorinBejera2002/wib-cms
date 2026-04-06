import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import News from '@/lib/db/models/News'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()

    const newsItem = await News.findById(id).lean()
    if (!newsItem) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(newsItem)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    const body = await req.json()

    const existing = await News.findById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const wasPublished = existing.status === 'published'
    const isNowPublished = body.status === 'published'

    const updateData = {
      ...body,
      publishedAt:
        !wasPublished && isNowPublished
          ? new Date()
          : existing.publishedAt,
    }

    const updated = await News.findByIdAndUpdate(id, updateData, { new: true })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    await News.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
