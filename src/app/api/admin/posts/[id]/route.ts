import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import BlogPost from '@/lib/db/models/BlogPost'
import { preparePostForSave } from '@/lib/utils/prepare-post'
import { firePostPublished } from '@/lib/utils/webhook'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    const body = await req.json()

    const existing = await BlogPost.findById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const data = preparePostForSave(body, existing.readingTime)

    const wasPublished = existing.status === 'published'
    const isNowPublished = data.status === 'published'

    const updateData = {
      ...data,
      publishedAt:
        !wasPublished && isNowPublished
          ? new Date()
          : existing.publishedAt,
    }

    const updated = await BlogPost.findByIdAndUpdate(id, updateData, { new: true })

    // Clean up legacy fields directly via MongoDB driver (not in Mongoose schema)
    const db = BlogPost.collection
    await db.updateOne({ _id: existing._id }, {
      $unset: { introText: '', conclusion: '', contentBlocks: '', contentSections: '' },
    })

    if (!wasPublished && isNowPublished && updated) {
      await firePostPublished({
        id: updated._id.toString(),
        title: updated.title,
        slug: updated.slug,
        excerpt: updated.excerpt,
        system: updated.system,
        publishedAt: updated.publishedAt,
      })
    }

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
    await BlogPost.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
