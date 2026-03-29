/**
 * App-level settings (file storage: Microsoft 365 / SharePoint or Google Drive).
 * Single document id `app`.
 */

import mongoose, { Schema, Model } from 'mongoose';

export type FileStorageProvider = 'microsoft365' | 'google_drive';

export interface IMs365Settings {
  MS365_CLIENT_ID: string;
  MS365_CLIENT_SECRET: string;
  MS365_TENANT_ID: string;
  MS365_SHAREPOINT_SITE_ID: string;
  MS365_VIDEOS_FOLDER_PATH: string;
  MS365_EMAIL_FROM: string;
}

/** OAuth2 + Drive folder (Workspace). See google-drive-automation skill for token setup. */
export interface IGoogleDriveSettings {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  /** Long-lived refresh token from OAuth consent (Drive file scope). */
  GOOGLE_REFRESH_TOKEN: string;
  /** Parent folder ID for uploads (from Drive URL or API). */
  GOOGLE_DRIVE_FOLDER_ID: string;
}

export interface IAppSettingDoc extends Omit<mongoose.Document, '_id'> {
  _id: string;
  /** Which backend upload integrations should use. Defaults to microsoft365 when unset. */
  fileStorageProvider?: FileStorageProvider;
  ms365?: IMs365Settings;
  googleDrive?: IGoogleDriveSettings;
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

const GoogleDriveSettingsSchema = new Schema(
  {
    GOOGLE_CLIENT_ID: { type: String, default: '' },
    GOOGLE_CLIENT_SECRET: { type: String, default: '' },
    GOOGLE_REFRESH_TOKEN: { type: String, default: '' },
    GOOGLE_DRIVE_FOLDER_ID: { type: String, default: '' },
  },
  { _id: false }
);

const AppSettingSchema = new Schema(
  {
    _id: { type: String, required: true },
    fileStorageProvider: {
      type: String,
      enum: ['microsoft365', 'google_drive'],
      default: 'microsoft365',
    },
    ms365: { type: Ms365SettingsSchema, default: () => ({}) },
    googleDrive: { type: GoogleDriveSettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const AppSetting: Model<IAppSettingDoc> =
  mongoose.models.AppSetting ||
  mongoose.model<IAppSettingDoc>('AppSetting', AppSettingSchema);
