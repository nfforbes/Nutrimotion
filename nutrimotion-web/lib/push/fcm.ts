/**
 * Firebase Cloud Messaging HTTP v1 sender (Android).
 * Env: FIREBASE_SERVICE_ACCOUNT — the service account JSON, raw or base64.
 */

import { signRs256 } from './jwt';
import type { PushMessage, PushResult } from './types';

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as ServiceAccount;
    return parsed.project_id && parsed.client_email && parsed.private_key ? parsed : null;
  } catch {
    return null;
  }
}

export function isFcmConfigured(): boolean {
  return readServiceAccount() !== null;
}

async function accessToken(account: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const assertion = signRs256(
    {
      iss: account.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    account.private_key
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`Firebase auth failed (${res.status})`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export async function sendFcm(token: string, message: PushMessage): Promise<PushResult> {
  const account = readServiceAccount();
  if (!account) return { ok: false, invalidToken: false, error: 'Firebase is not configured' };

  try {
    const bearer = await accessToken(account);
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: message.title, body: message.body },
            android: {
              priority: 'high',
              notification: { channel_id: 'messages', sound: 'default' },
            },
          },
        }),
      }
    );
    if (res.ok) return { ok: true, invalidToken: false };

    const text = await res.text();
    const invalidToken =
      res.status === 404 ||
      text.includes('UNREGISTERED') ||
      (res.status === 400 && /registration token/i.test(text));
    return { ok: false, invalidToken, error: `FCM ${res.status}` };
  } catch (err) {
    return { ok: false, invalidToken: false, error: err instanceof Error ? err.message : 'FCM error' };
  }
}
