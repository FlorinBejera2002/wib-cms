import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IBlogTag extends Document {
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
}

const BlogTagSchema = new Schema<IBlogTag>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  {
    timestamps: true,
    collection: 'blog_tags',
  }
)

const BlogTag: Model<IBlogTag> =
  mongoose.models.BlogTag || mongoose.model<IBlogTag>('BlogTag', BlogTagSchema)

export default BlogTag
