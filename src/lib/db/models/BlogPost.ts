import mongoose, { Schema, Document, Model, Types } from 'mongoose'
import { SYSTEMS, POST_STATUSES } from '@/lib/constants'
import type { BlogSystem, PostStatus } from '@/lib/constants'

export { SYSTEMS, POST_STATUSES }
export type { BlogSystem, PostStatus }

export interface IBlogPost extends Document {
  title: string
  slug: string
  system: BlogSystem
  status: PostStatus
  content?: Record<string, unknown>
  contentHtml?: string
  excerpt?: string
  tocItems?: Array<{ id: string; text: string; level: number }>
  featuredImageUrl?: string
  featuredImageAlt?: string
  author?: Types.ObjectId
  authorDisplayName?: string
  category?: Types.ObjectId
  tags?: Types.ObjectId[]
  readingTime?: number
  seo?: {
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string
    canonicalUrl?: string
  }
  social?: {
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
    socialPosted?: Record<string, unknown>
  }
  stats?: {
    views: number
    likes: number
    shares: number
    comments: number
  }
  commentsEnabled: boolean
  version: number
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    system: { type: String, enum: SYSTEMS, default: 'common' },
    status: { type: String, enum: POST_STATUSES, default: 'draft' },
    content: { type: Schema.Types.Mixed },
    contentHtml: { type: String },
    excerpt: { type: String },
    tocItems: [
      {
        id: String,
        text: String,
        level: Number,
      },
    ],
    featuredImageUrl: { type: String },
    featuredImageAlt: { type: String },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    authorDisplayName: { type: String },
    category: { type: Schema.Types.ObjectId, ref: 'BlogCategory' },
    tags: [{ type: Schema.Types.ObjectId, ref: 'BlogTag' }],
    readingTime: { type: Number },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: String,
      canonicalUrl: String,
    },
    social: {
      ogTitle: String,
      ogDescription: String,
      ogImage: String,
      socialPosted: { type: Schema.Types.Mixed },
    },
    stats: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
    },
    commentsEnabled: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
    publishedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'blog_posts',
  }
)

BlogPostSchema.index({ slug: 1 })
BlogPostSchema.index({ status: 1, publishedAt: -1 })
BlogPostSchema.index({ system: 1, status: 1 })

const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema)

export default BlogPost
