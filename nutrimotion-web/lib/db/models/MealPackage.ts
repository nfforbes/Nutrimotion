/**
 * MealPackage Model
 */

import mongoose, { Schema, Model } from 'mongoose';
import { MealSlot } from '@/types/catalog';

export interface IMealPackage {
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  instagramLink?: string;
  slot: MealSlot;
  scheduledDate: Date;
  available: boolean;
  ingredients?: string[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MealPackageSchema = new Schema<IMealPackage>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    price: { type: Number, required: true, min: 0 },
    instagramLink: { type: String },
    slot: {
      type: String,
      enum: Object.values(MealSlot),
      required: true,
    },
    scheduledDate: { type: Date, required: true, index: true },
    available: { type: Boolean, default: true },
    ingredients: [String],
    nutritionInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MealPackageSchema.index({ scheduledDate: 1, slot: 1 });
MealPackageSchema.index({ available: 1 });

export const MealPackage: Model<IMealPackage> =
  mongoose.models.MealPackage ||
  mongoose.model<IMealPackage>('MealPackage', MealPackageSchema);
