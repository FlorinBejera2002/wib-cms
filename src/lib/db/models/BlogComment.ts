import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export const COMMENT_STATUSES = ['pending', 'approved', 'spam', 'deleted'] as const
export type CommentStatus = typeof COMMENT_STATUSES[number]

export interface IBlogComment extends Document {
  post: Types.ObjectId
  author: {
    name: string
    email: string
  }
  content: string
  status: CommentStatus
  parentComment?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const BlogCommentSchema = new Schema<IBlogComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'BlogPost', required: true },
    author: {
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    content: { type: String, required: true },
    status: { type: String, enum: COMMENT_STATUSES, default: 'pending' },
    parentComment: { type: Schema.Types.ObjectId, ref: 'BlogComment' },
  },
  {
    timestamps: true,
    collection: 'blog_comments',
  }
)

BlogCommentSchema.index({ post: 1, status: 1 })

const BlogComment: Model<IBlogComment> =
  mongoose.models.BlogComment || mongoose.model<IBlogComment>('BlogComment', BlogCommentSchema)

export default BlogComment
