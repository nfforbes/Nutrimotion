/**
 * History of push notifications admins sent.
 */

import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IPushNotificationLog extends Document {
  target: 'user' | 'all';
  userId?: Types.ObjectId;
  userLabel?: string;
  title: string;
  message: string;
  devices: number;
  reached: number;
  failed: number;
  sentBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PushNotificationLogSchema = new Schema<IPushNotificationLog>(
  {
    target: { type: String, enum: ['user', 'all'], required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userLabel: { type: String },
    title: { type: String, required: true },
    message: { type: String, required: true },
    devices: { type: Number, default: 0 },
    reached: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    sentBy: { type: String },
  },
  { timestamps: true }
);

export const PushNotificationLog: Model<IPushNotificationLog> =
  (mongoose.models.PushNotificationLog as Model<IPushNotificationLog>) ||
  mongoose.model<IPushNotificationLog>('PushNotificationLog', PushNotificationLogSchema);
