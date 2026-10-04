/**
 * Apple Push Notification service sender (iOS), token-based auth over HTTP/2.
 * Env: APNS_KEY_P8 (the .p8 contents), APNS_KEY_ID, APNS_TEAM_ID,
 * optional APNS_BUNDLE_ID (default com.nutrimotion.cmp) and APNS_SANDBOX=true for dev builds.
 */

import http2 from 'http2';
import { signEs256 } from './jwt';
import type { PushMessage, PushResult } from './types';

let cachedJwt: { value: string; issuedAt: number } | null = null;

function config() {
  const key = process.env.APNS_KEY_P8?.trim();
  const keyId = process.env.APNS_KEY_ID?.trim();
  const teamId = process.env.APNS_TEAM_ID?.trim();
  if (!key || !keyId || !teamId) return null;
  return {
    key,
    keyId,
    teamId,
    bundleId: process.env.APNS_BUNDLE_ID?.trim() || 'com.nutrimotion.cmp',
    host:
      process.env.APNS_SANDBOX === 'true'
        ? 'https://api.sandbox.push.apple.com'
        : 'https://api.push.apple.com',
  };
}

export function isApnsConfigured(): boolean {
  return config() !== null;
}

/** Apple rejects tokens older than an hour and throttles refreshing more than every 20 minutes. */
function providerToken(cfg: NonNullable<ReturnType<typeof config>>): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && now - cachedJwt.issuedAt < 45 * 60) return cachedJwt.value;
  const value = signEs256({ iss: cfg.teamId, iat: now }, cfg.key, cfg.keyId);
  cachedJwt = { value, issuedAt: now };
  return value;
}

export async function sendApnsBatch(
  tokens: string[],
  message: PushMessage
): Promise<Map<string, PushResult>> {
  const results = new Map<string, PushResult>();
  const cfg = config();
  if (!cfg) {
    tokens.forEach((t) => results.set(t, { ok: false, invalidToken: false, error: 'APNs is not configured' }));
    return results;
  }
  if (tokens.length === 0) return results;

  const jwt = providerToken(cfg);
  const payload = JSON.stringify({
    aps: { alert: { title: message.title, body: message.body }, sound: 'default' },
  });

  const client = http2.connect(cfg.host);
  client.on('error', () => {});
  try {
    await Promise.all(
      tokens.map(
        (token) =>
          new Promise<void>((resolve) => {
            const req = client.request({
              ':method': 'POST',
              ':path': `/3/device/${token}`,
              authorization: `bearer ${jwt}`,
              'apns-topic': cfg.bundleId,
              'apns-push-type': 'alert',
              'apns-priority': '10',
              'content-type': 'application/json',
            });
            let status = 0;
            let body = '';
            req.setEncoding('utf8');
            req.on('response', (headers) => {
              status = Number(headers[':status']);
            });
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              if (status === 200) {
                results.set(token, { ok: true, invalidToken: false });
              } else {
                const invalidToken =
                  status === 410 || /BadDeviceToken|Unregistered|DeviceTokenNotForTopic/.test(body);
                results.set(token, { ok: false, invalidToken, error: `APNs ${status} ${body}`.trim() });
              }
              resolve();
            });
            req.on('error', (err) => {
              results.set(token, { ok: false, invalidToken: false, error: err.message });
              resolve();
            });
            req.on('close', () => {
              if (!results.has(token)) {
                results.set(token, { ok: false, invalidToken: false, error: 'APNs request closed' });
              }
              resolve();
            });
            req.setTimeout(15_000, () => {
              req.close();
            });
            req.end(payload);
          })
      )
    );
  } finally {
    client.close();
  }
  return results;
}
