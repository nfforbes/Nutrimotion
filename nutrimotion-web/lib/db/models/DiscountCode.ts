/**
 * DiscountCode Model
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface IDiscountCode {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usageCount: number;
  /** If true, may be combined with other stackable coupons on the same order. */
  stackable: boolean;
  /** If true, each user may redeem at most once (checked against past orders). */
  oneTimePerUser: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountCodeSchema = new Schema<IDiscountCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    usageLimit: { type: Number, min: 0 },
    usageCount: { type: Number, default: 0, min: 0 },
    stackable: { type: Boolean, default: false },
    oneTimePerUser: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
DiscountCodeSchema.index({ code: 1, active: 1 });
DiscountCodeSchema.index({ validFrom: 1, validUntil: 1 });

// Method to check if discount is valid
DiscountCodeSchema.methods.isValid = function (): boolean {
  const now = new Date();
  return (
    this.active &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.usageLimit === undefined || this.usageCount < this.usageLimit)
  );
};

// Method to calculate discount amount
DiscountCodeSchema.methods.calculateDiscount = function (
  subtotal: number
): number {
  if (!this.isValid()) return 0;
  
  if (this.minOrderAmount && subtotal < this.minOrderAmount) return 0;
  
  let discount = 0;
  if (this.type === 'percentage') {
    discount = subtotal * (this.value / 100);
  } else {
    discount = this.value;
  }
  
  if (this.maxDiscount) {
    discount = Math.min(discount, this.maxDiscount);
  }
  
  return Math.min(discount, subtotal);
};

export const DiscountCode: Model<IDiscountCode> =
  mongoose.models.DiscountCode ||
  mongoose.model<IDiscountCode>('DiscountCode', DiscountCodeSchema);
