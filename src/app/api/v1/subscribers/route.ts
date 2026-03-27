import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import NewsletterSubscriber from '@/lib/db/models/NewsletterSubscriber'

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://www.asigurari.ro'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email, name } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400, headers: corsHeaders() })
    }

    const existing = await NewsletterSubscriber.findOne({ email: email.toLowerCase() })
    if (existing) {
      if (existing.status === 'unsubscribed') {
        existing.status = 'active'
        existing.subscribedAt = new Date()
        await existing.save()
      }
      return NextResponse.json({ success: true }, { headers: corsHeaders() })
    }

    await NewsletterSubscriber.create({
      email: email.toLowerCase(),
      name: name || undefined,
    })

    return NextResponse.json({ success: true }, { status: 201, headers: corsHeaders() })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders() })
  }
}
