/**
 * DeliveryTracking Model
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface IDeliveryTracking {
  assignmentId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  speed?: number;
  heading?: number;
}

const DeliveryTrackingSchema = new Schema<IDeliveryTracking>({
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: 'DeliveryAssignment',
    required: true,
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  timestamp: { type: Date, default: Date.now },
  speed: { type: Number },
  heading: { type: Number },
});

// Indexes - compound indexes for better query performance
DeliveryTrackingSchema.index({ assignmentId: 1, timestamp: -1 });
DeliveryTrackingSchema.index({ driverId: 1, timestamp: -1 });

// TTL index - remove tracking points older than 7 days
DeliveryTrackingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

export const DeliveryTracking: Model<IDeliveryTracking> =
  mongoose.models.DeliveryTracking ||
  mongoose.model<IDeliveryTracking>('DeliveryTracking', DeliveryTrackingSchema);
