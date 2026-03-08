/**
 * Order Model
 */

import mongoose, { Schema, Model, Document } from 'mongoose';
import { OrderStatus } from '@/types/commerce';

export interface IOrderItem {
  _id?: mongoose.Types.ObjectId;
  itemType: 'meal' | 'training' | 'book' | 'subscription' | 'package';
  itemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  packageDetails?: any;
}

export interface IOrderStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  updatedBy?: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  discountCode?: string;
  status: OrderStatus;
  deliveryAddress?: {
    street: string;
    parish: string;
  };
  deliveryInstructions?: string;
  assignedDriverId?: mongoose.Types.ObjectId;
  statusHistory: IOrderStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  itemType: {
    type: String,
    enum: ['meal', 'training', 'book', 'subscription', 'package'],
    required: true,
  },
  itemId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  imageUrl: { type: String },
  packageDetails: { type: Schema.Types.Mixed },
});

const OrderStatusHistorySchema = new Schema<IOrderStatusHistory>({
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
  updatedBy: { type: String },
});

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    discountCode: { type: String },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true,
    },
    deliveryAddress: {
      street: String,
      parish: String,
    },
    deliveryInstructions: { type: String },
    assignedDriverId: { type: Schema.Types.ObjectId, ref: 'User' },
    statusHistory: [OrderStatusHistorySchema],
  },
  {
    timestamps: true,
  }
);


// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ assignedDriverId: 1, status: 1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
