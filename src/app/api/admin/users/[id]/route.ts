import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import User from '@/lib/db/models/User'
import bcrypt from 'bcryptjs'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    const body = await req.json()

    const updateData: Record<string, unknown> = {
      email: body.email,
      name: body.name,
      role: body.role,
    }

    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 12)
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password')
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
