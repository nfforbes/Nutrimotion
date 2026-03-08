/**
 * DeliveryAssignment Model
 */

import mongoose, { Schema, Model } from 'mongoose';
import { OrderStatus } from '@/types/commerce';

export interface IDeliveryAssignment {
  batchId?: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  status: OrderStatus;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  assignedAt: Date;
  startedAt?: Date;
  arrivedAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryAssignmentSchema = new Schema<IDeliveryAssignment>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'DeliveryBatch' },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PREPARING,
    },
    estimatedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date },
    assignedAt: { type: Date, default: Date.now },
    startedAt: { type: Date },
    arrivedAt: { type: Date },
    deliveredAt: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
DeliveryAssignmentSchema.index({ driverId: 1, status: 1, createdAt: -1 });
DeliveryAssignmentSchema.index({ orderId: 1 });

export const DeliveryAssignment: Model<IDeliveryAssignment> =
  mongoose.models.DeliveryAssignment ||
  mongoose.model<IDeliveryAssignment>('DeliveryAssignment', DeliveryAssignmentSchema);
