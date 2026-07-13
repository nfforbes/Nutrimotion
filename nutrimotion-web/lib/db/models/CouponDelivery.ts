/**
 * CouponDelivery — tracks coupons sent from admin to specific clients.
 */

import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ICouponDelivery {
  userId: Types.ObjectId;
  discountCodeId: Types.ObjectId;
  sentByUserId?: Types.ObjectId;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CouponDeliverySchema = new Schema<ICouponDelivery>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    discountCodeId: { type: Schema.Types.ObjectId, ref: 'DiscountCode', required: true, index: true },
    sentByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CouponDeliverySchema.index({ userId: 1, discountCodeId: 1 }, { unique: true });

export const CouponDelivery: Model<ICouponDelivery> =
  mongoose.models.CouponDelivery ||
  mongoose.model<ICouponDelivery>('CouponDelivery', CouponDeliverySchema);
