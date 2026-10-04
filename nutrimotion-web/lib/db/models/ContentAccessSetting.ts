/**
 * Per-library access settings: subscription price and this week's picks.
 * One document per library, `_id` is `recipes` or `videos`.
 */

import mongoose, { Schema, Model } from 'mongoose';

export type ContentLibrary = 'recipes' | 'videos';
export type SpotlightMode = 'preferred' | 'random';

export interface IContentAccessSetting {
  _id: ContentLibrary;
  /** Monthly subscription price. Subscribing is disabled while this is 0. */
  monthlyPrice: number;
  spotlightMode: SpotlightMode;
  /** Item ids the admin picked when mode is `preferred`. */
  preferredIds: string[];
  /** How many items to pick when mode is `random`. */
  randomCount: number;
  /** Week start (YYYY-MM-DD, Sunday) the random picks were generated for. */
  randomWeekKey: string;
  randomIds: string[];
  updatedAt?: Date;
}

const ContentAccessSettingSchema = new Schema<IContentAccessSetting>(
  {
    _id: { type: String, enum: ['recipes', 'videos'], required: true },
    monthlyPrice: { type: Number, default: 0, min: 0 },
    spotlightMode: { type: String, enum: ['preferred', 'random'], default: 'preferred' },
    preferredIds: { type: [String], default: [] },
    randomCount: { type: Number, default: 3, min: 0 },
    randomWeekKey: { type: String, default: '' },
    randomIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const ContentAccessSetting: Model<IContentAccessSetting> =
  (mongoose.models.ContentAccessSetting as Model<IContentAccessSetting>) ||
  mongoose.model<IContentAccessSetting>('ContentAccessSetting', ContentAccessSettingSchema);
