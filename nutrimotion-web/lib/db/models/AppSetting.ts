/**
 * App-level settings. Single document id `app`.
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface IAppSettingDoc extends Omit<mongoose.Document, '_id'> {
  _id: string;
  /** WhatsApp number customers message, digits only with country code. */
  contactWhatsApp?: string;
  /** Weekdays the kitchen cooks, 0 = Sunday … 6 = Saturday. */
  cookDays?: number[];
  updatedAt: Date;
}

const AppSettingSchema = new Schema(
  {
    _id: { type: String, required: true },
    contactWhatsApp: { type: String, default: '' },
    cookDays: { type: [Number], default: [] },
  },
  { timestamps: true }
);

export const AppSetting: Model<IAppSettingDoc> =
  mongoose.models.AppSetting ||
  mongoose.model<IAppSettingDoc>('AppSetting', AppSettingSchema);
