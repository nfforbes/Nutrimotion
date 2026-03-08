/**
 * Package Model
 * Defines meal packages (e.g. 5 breakfasts, 5 lunches, 5 dinners per week).
 * daysOption: 'any' = any days; 'specific' = only on specificDays (0=Sun .. 6=Sat).
 */

import mongoose, { Schema, Model } from 'mongoose';

export type DaysOption = 'any' | 'specific';

export interface IPackage {
  name: string;
  description?: string;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  cost: number;
  daysOption: DaysOption;
  specificDays: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    name: { type: String, required: true },
    description: { type: String },
    breakfastCount: { type: Number, required: true, min: 0, default: 0 },
    lunchCount: { type: Number, required: true, min: 0, default: 0 },
    dinnerCount: { type: Number, required: true, min: 0, default: 0 },
    cost: { type: Number, min: 0, default: 0 },
    daysOption: {
      type: String,
      enum: ['any', 'specific'],
      required: true,
      default: 'any',
    },
    specificDays: {
      type: [Number],
      default: [],
      validate: {
        validator: (v: number[]) =>
          v.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
        message: 'Each day must be 0–6 (Sun–Sat)',
      },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Avoid overwriting mongoose.model('Package') if it exists (e.g. hot reload)
export const Package: Model<IPackage> =
  mongoose.models.Package || mongoose.model<IPackage>('Package', PackageSchema);
