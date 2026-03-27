import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IMedia extends Document {
  filename: string
  url: string
  mimeType: string
  size: number
  alt?: string
  uploadedBy?: Types.ObjectId
  createdAt: Date
}

const MediaSchema = new Schema<IMedia>(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    alt: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'cms_media',
  }
)

const Media: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema)

export default Media
