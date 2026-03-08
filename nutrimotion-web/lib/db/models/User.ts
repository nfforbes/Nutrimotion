/**
 * User Model
 */

import mongoose, { Schema, Model } from 'mongoose';
import { UserRole } from '@/types/auth';

export interface IUser {
  auth0Sub: string;
  email: string;
  name: string;
  phone?: string;
  address?: {
    street: string;
    parish: string;
  };
  roles: UserRole[];
  deviceFingerprints?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    auth0Sub: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String },
    address: {
      street: String,
      parish: String,
    },
    roles: {
      type: [String],
      enum: Object.values(UserRole),
      default: [UserRole.CLIENT],
      required: true,
    },
    deviceFingerprints: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes (unique: true already creates indexes, so we only add non-unique ones if needed)
UserSchema.index({ email: 1 });
UserSchema.index({ auth0Sub: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
