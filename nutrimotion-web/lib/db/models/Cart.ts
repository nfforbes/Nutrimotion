/**
 * Cart Model
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface ICartItem {
  _id?: mongoose.Types.ObjectId;
  itemType: 'meal' | 'training' | 'book' | 'subscription' | 'package';
  itemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  packageDetails?: any;
}

export interface ICart {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  subtotal: number;
  discount: number;
  total: number;
  /** @deprecated Use appliedDiscountCodes; kept for older carts */
  discountCode?: string;
  appliedDiscountCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  itemType: {
    type: String,
    enum: ['meal', 'training', 'book', 'subscription', 'package'],
    required: true,
  },
  itemId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  imageUrl: { type: String },
  packageDetails: { type: Schema.Types.Mixed },
});

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [CartItemSchema],
    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    discountCode: { type: String },
    appliedDiscountCodes: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

// Calculate totals before saving
CartSchema.pre('save', function (this: ICart) {
  this.subtotal = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  this.total = Math.max(0, this.subtotal - this.discount);
});

export const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
