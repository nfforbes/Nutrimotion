/**
 * Content subscriptions (recipes, videos, training).
 */

import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type SubscriptionType = 'recipes' | 'videos' | 'training';

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  type: SubscriptionType;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  price: number;
  billingInterval: 'monthly' | 'quarterly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['recipes', 'videos', 'training'], required: true },
    status: { type: String, enum: ['active', 'inactive', 'cancelled', 'expired'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
    price: { type: Number, required: true },
    billingInterval: { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
  },
  { timestamps: true }
);

export const Subscription: Model<ISubscription> =
  (mongoose.models.Subscription as Model<ISubscription>) ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
