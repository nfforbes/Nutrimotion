/**
 * Video content (subscription-gated unless free, a free short, or in this week's picks).
 */

import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IVideoAsset extends Document {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  category: 'cooking' | 'training';
  tags: string[];
  isFree: boolean;
  /** Non-subscribers may watch this clip; the full video stays locked. */
  freeShortUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VideoAssetSchema = new Schema<IVideoAsset>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    videoUrl: { type: String, required: true },
    duration: { type: Number, required: true },
    category: { type: String, enum: ['cooking', 'training'], required: true },
    tags: [String],
    isFree: { type: Boolean, default: false },
    freeShortUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const VideoAsset: Model<IVideoAsset> =
  (mongoose.models.VideoAsset as Model<IVideoAsset>) ||
  mongoose.model<IVideoAsset>('VideoAsset', VideoAssetSchema);
