import mongoose, { Schema, Document, Model } from 'mongoose'

export interface INewsletterSubscriber extends Document {
  email: string
  name?: string
  status: 'active' | 'unsubscribed'
  subscribedAt: Date
  unsubscribedAt?: Date
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    status: { type: String, enum: ['active', 'unsubscribed'], default: 'active' },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date },
  },
  {
    collection: 'newsletter_subscribers',
  }
)

const NewsletterSubscriber: Model<INewsletterSubscriber> =
  mongoose.models.NewsletterSubscriber ||
  mongoose.model<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberSchema)

export default NewsletterSubscriber
