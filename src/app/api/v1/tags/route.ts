import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import BlogTag from '@/lib/db/models/BlogTag'

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://www.asigurari.ro'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET() {
  try {
    await connectDB()
    const tags = await BlogTag.find().sort({ name: 1 }).lean()
    return NextResponse.json({ data: tags }, { headers: corsHeaders() })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders() })
  }
}
