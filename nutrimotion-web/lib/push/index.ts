/**
 * Send a push notification to registered phones; dead tokens are removed.
 */

import { PushDevice } from '@/lib/db/models';
import type { PushPlatform } from '@/lib/db/models';
import { isFcmConfigured, sendFcm } from './fcm';
import { isApnsConfigured, sendApnsBatch } from './apns';
import type { PushMessage, PushResult } from './types';

export type { PushMessage } from './types';

export interface PushSummary {
  devices: number;
  reached: number;
  failed: number;
  removed: number;
  errors: string[];
}

export function pushConfiguration(): Record<PushPlatform, boolean> {
  return { android: isFcmConfigured(), ios: isApnsConfigured() };
}

export async function sendPush(
  devices: { token: string; platform: PushPlatform }[],
  message: PushMessage
): Promise<PushSummary> {
  const results = new Map<string, PushResult>();

  const android = devices.filter((d) => d.platform === 'android').map((d) => d.token);
  const ios = devices.filter((d) => d.platform === 'ios').map((d) => d.token);

  for (let i = 0; i < android.length; i += 50) {
    const chunk = android.slice(i, i + 50);
    const sent = await Promise.all(chunk.map((token) => sendFcm(token, message)));
    chunk.forEach((token, idx) => results.set(token, sent[idx]));
  }
  (await sendApnsBatch(ios, message)).forEach((result, token) => results.set(token, result));

  const dead = [...results].filter(([, r]) => r.invalidToken).map(([token]) => token);
  if (dead.length) await PushDevice.deleteMany({ token: { $in: dead } });

  const values = [...results.values()];
  return {
    devices: devices.length,
    reached: values.filter((r) => r.ok).length,
    failed: values.filter((r) => !r.ok).length,
    removed: dead.length,
    errors: [...new Set(values.filter((r) => !r.ok && r.error).map((r) => r.error as string))].slice(0, 5),
  };
}
