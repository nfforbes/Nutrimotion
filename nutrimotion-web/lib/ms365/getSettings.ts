/**
 * Read MS365 settings from the database for use in upload APIs.
 * Returns null if not configured or DB error.
 */

import connectDB from '@/lib/db/connection';
import { AppSetting } from '@/lib/db/models';
import type { IMs365Settings } from '@/lib/db/models';

const CONFIG_ID = 'app';

export async function getMs365Settings(): Promise<IMs365Settings | null> {
  try {
    await connectDB();
    const doc = await AppSetting.findById(CONFIG_ID).lean();
    const ms365 = doc?.ms365;
    if (!ms365 || !ms365.MS365_CLIENT_ID) return null;
    return ms365 as IMs365Settings;
  } catch {
    return null;
  }
}
