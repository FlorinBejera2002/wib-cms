import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IBlogCategory extends Document {
  name: string
  slug: string
  description?: string
  parent?: Types.ObjectId
  order: number
  createdAt: Date
  updatedAt: Date
}

const BlogCategorySchema = new Schema<IBlogCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: 'BlogCategory' },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'blog_categories',
  }
)

const BlogCategory: Model<IBlogCategory> =
  mongoose.models.BlogCategory || mongoose.model<IBlogCategory>('BlogCategory', BlogCategorySchema)

export default BlogCategory
