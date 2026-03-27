import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import User from '@/lib/db/models/User'
import bcrypt from 'bcryptjs'

export async function GET() {
  await connectDB()
  const users = await User.find().select('-password').sort({ createdAt: -1 }).lean()
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    if (!body.password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    const hash = await bcrypt.hash(body.password, 12)
    const user = await User.create({
      ...body,
      password: hash,
    })

    const { password: _, ...userObj } = user.toObject()
    return NextResponse.json(userObj, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
