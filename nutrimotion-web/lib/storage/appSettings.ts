/**
 * Resolved file storage configuration from AppSetting document `app`.
 */

import connectDB from '@/lib/db/connection';
import { AppSetting } from '@/lib/db/models';
import type { FileStorageProvider, IGoogleDriveSettings, IMs365Settings } from '@/lib/db/models';

const CONFIG_ID = 'app';

export interface AppStorageConfig {
  fileStorageProvider: FileStorageProvider;
  ms365: IMs365Settings | null;
  googleDrive: IGoogleDriveSettings | null;
}

export async function getAppStorageConfig(): Promise<AppStorageConfig> {
  try {
    await connectDB();
    const doc = await AppSetting.findById(CONFIG_ID).lean();
    const provider: FileStorageProvider =
      (doc?.fileStorageProvider as FileStorageProvider) || 'microsoft365';

    const ms = doc?.ms365 as IMs365Settings | undefined;
    const gd = doc?.googleDrive as IGoogleDriveSettings | undefined;

    const ms365 =
      ms && ms.MS365_CLIENT_ID
        ? ms
        : null;

    const googleDrive =
      gd && gd.GOOGLE_CLIENT_ID && gd.GOOGLE_REFRESH_TOKEN
        ? gd
        : null;

    return {
      fileStorageProvider: provider,
      ms365,
      googleDrive,
    };
  } catch {
    return {
      fileStorageProvider: 'microsoft365',
      ms365: null,
      googleDrive: null,
    };
  }
}

/** Google Drive credentials when that provider is selected and configured. */
export async function getGoogleDriveSettingsIfActive(): Promise<IGoogleDriveSettings | null> {
  const cfg = await getAppStorageConfig();
  if (cfg.fileStorageProvider !== 'google_drive') return null;
  return cfg.googleDrive;
}
