import mongoose from 'mongoose'

export interface IDownload extends mongoose.Document {
  platform: string
  version: string
  userAgent?: string
  ipAddress?: string
  downloadedAt: Date
  createdAt: Date
  updatedAt: Date
}

const DownloadSchema = new mongoose.Schema<IDownload>(
  {
    platform: {
      type: String,
      required: true,
      enum: ['Windows', 'macOS', 'Linux'],
    },
    version: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes for better query performance
DownloadSchema.index({ platform: 1, downloadedAt: -1 })
DownloadSchema.index({ downloadedAt: -1 })

export default mongoose.models.Download || mongoose.model<IDownload>('Download', DownloadSchema)
