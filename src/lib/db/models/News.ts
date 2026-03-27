import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export const NEWS_CATEGORIES = [
  'rca',
  'casco',
  'legislatie',
  'piata',
  'sfaturi',
  'travel',
  'home',
  'health',
  'general',
] as const

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

export const NEWS_STATUSES = [
  'draft',
  'pending_review',
  'published',
  'archived',
] as const

export type NewsStatus = (typeof NEWS_STATUSES)[number]

export interface INews extends Document {
  title: string
  slug: string
  category: NewsCategory
  status: NewsStatus
  content?: Record<string, unknown>
  contentHtml?: string
  excerpt?: string
  authorName?: string
  featuredImageUrl?: string
  isBreaking: boolean
  sourceUrl?: string
  sourceName?: string
  tags?: Types.ObjectId[]
  commentsEnabled: boolean
  readingTime?: number
  stats?: {
    views: number
    likes: number
    shares: number
    comments: number
  }
  seo?: {
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string
  }
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const newsSchema = new Schema<INews>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, enum: NEWS_CATEGORIES, default: 'general' },
    status: { type: String, enum: NEWS_STATUSES, default: 'draft' },
    content: { type: Schema.Types.Mixed },
    contentHtml: { type: String },
    excerpt: { type: String },
    authorName: { type: String, default: 'Echipa asigurari.ro' },
    featuredImageUrl: { type: String },
    isBreaking: { type: Boolean, default: false },
    sourceUrl: { type: String },
    sourceName: { type: String },
    tags: [{ type: Schema.Types.ObjectId, ref: 'BlogTag' }],
    commentsEnabled: { type: Boolean, default: true },
    readingTime: { type: Number },
    stats: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: String,
    },
    publishedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'news',
  }
)

newsSchema.index({ slug: 1 })
newsSchema.index({ status: 1, publishedAt: -1 })
newsSchema.index({ category: 1, status: 1 })

const News: Model<INews> =
  mongoose.models.News || mongoose.model<INews>('News', newsSchema, 'news')

export default News
