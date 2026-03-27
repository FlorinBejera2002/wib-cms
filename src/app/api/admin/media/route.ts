import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import Media from '@/lib/db/models/Media'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET() {
  await connectDB()
  const media = await Media.find().sort({ createdAt: -1 }).lean()
  return NextResponse.json(media)
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const results = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filename = `${timestamp}-${safeName}`
      const filepath = path.join(uploadDir, filename)

      await writeFile(filepath, buffer)

      const mediaDoc = await Media.create({
        filename: file.name,
        url: `/uploads/${filename}`,
        mimeType: file.type,
        size: file.size,
        uploadedBy: null,
      })

      results.push(mediaDoc)
    }

    return NextResponse.json(results, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
