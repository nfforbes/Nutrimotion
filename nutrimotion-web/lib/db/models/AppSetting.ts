/**
 * App-level settings (e.g. MS365 integration).
 * Single document per config namespace; id 'ms365' for Microsoft 365 upload config.
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface IMs365Settings {
  MS365_CLIENT_ID: string;
  MS365_CLIENT_SECRET: string;
  MS365_TENANT_ID: string;
  MS365_SHAREPOINT_SITE_ID: string;
  MS365_VIDEOS_FOLDER_PATH: string;
  MS365_EMAIL_FROM: string;
}

export interface IAppSettingDoc extends mongoose.Document {
  _id: string;
  ms365?: IMs365Settings;
  updatedAt: Date;
}

const Ms365SettingsSchema = new Schema(
  {
    MS365_CLIENT_ID: { type: String, default: '' },
    MS365_CLIENT_SECRET: { type: String, default: '' },
    MS365_TENANT_ID: { type: String, default: '' },
    MS365_SHAREPOINT_SITE_ID: { type: String, default: '' },
    MS365_VIDEOS_FOLDER_PATH: { type: String, default: '' },
    MS365_EMAIL_FROM: { type: String, default: '' },
  },
  { _id: false }
);

const AppSettingSchema = new Schema(
  {
    _id: { type: String, required: true },
    ms365: { type: Ms365SettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const AppSetting: Model<IAppSettingDoc> =
  mongoose.models.AppSetting ||
  mongoose.model<IAppSettingDoc>('AppSetting', AppSettingSchema);
