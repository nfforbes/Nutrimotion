/**
 * Read MS365 settings when Microsoft 365 is the active file storage provider.
 */

import { getAppStorageConfig } from '@/lib/storage/appSettings';
import type { IMs365Settings } from '@/lib/db/models';

export async function getMs365Settings(): Promise<IMs365Settings | null> {
  const cfg = await getAppStorageConfig();
  if (cfg.fileStorageProvider !== 'microsoft365') return null;
  return cfg.ms365;
}
