import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connection'
import NewsletterSubscriber from '@/lib/db/models/NewsletterSubscriber'

export async function GET() {
  await connectDB()
  const subscribers = await NewsletterSubscriber.find()
    .sort({ subscribedAt: -1 })
    .lean()

  return NextResponse.json(subscribers)
}
