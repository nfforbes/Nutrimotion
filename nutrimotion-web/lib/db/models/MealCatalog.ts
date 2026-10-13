/**
 * MealCatalog Model
 * Saved meals the admin places into weeks; placing one creates its daily MealPackage records.
 */

import mongoose, { Schema, Model } from 'mongoose';
import { MealSlot } from '@/types/catalog';

export interface IMealCatalog {
  name: string;
  description: string;
  price: number;
  /** Slot the meal is usually served in; it can still be placed in any slot. */
  slot: MealSlot;
  imageUrl?: string;
  soldIndividually: boolean;
  instagramLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MealCatalogSchema = new Schema<IMealCatalog>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0, default: 0 },
    slot: { type: String, enum: Object.values(MealSlot), required: true },
    imageUrl: { type: String },
    soldIndividually: { type: Boolean, default: true },
    instagramLink: { type: String },
  },
  { timestamps: true }
);

export const MealCatalog: Model<IMealCatalog> =
  mongoose.models.MealCatalog || mongoose.model<IMealCatalog>('MealCatalog', MealCatalogSchema);
