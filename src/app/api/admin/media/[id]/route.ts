import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import Media from '@/lib/db/models/Media'
import { unlink } from 'fs/promises'
import path from 'path'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    const media = await Media.findById(id)
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    try {
      const filepath = path.join(process.cwd(), media.url)
      await unlink(filepath)
    } catch {
      // File may not exist on disk, continue with DB deletion
    }

    await Media.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
