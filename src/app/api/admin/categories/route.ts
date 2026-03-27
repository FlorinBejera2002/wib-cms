import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import BlogCategory from '@/lib/db/models/BlogCategory'

export async function GET() {
  await connectDB()
  const categories = await BlogCategory.find().sort({ order: 1, name: 1 }).lean()
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const category = await BlogCategory.create(body)
    return NextResponse.json(category, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
