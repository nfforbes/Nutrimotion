/**
 * Phone push tokens (FCM on Android, APNs device token on iOS).
 */

import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type PushPlatform = 'android' | 'ios';

export interface IPushDevice extends Document {
  userId: Types.ObjectId;
  token: string;
  platform: PushPlatform;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PushDeviceSchema = new Schema<IPushDevice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ['android', 'ios'], required: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PushDevice: Model<IPushDevice> =
  (mongoose.models.PushDevice as Model<IPushDevice>) ||
  mongoose.model<IPushDevice>('PushDevice', PushDeviceSchema);
