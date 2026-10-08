/**
 * Google Drive OAuth "connect" flow: send the admin to Google, then store the refresh token.
 * Server-only.
 */

import type { NextRequest } from 'next/server';
import { google } from 'googleapis';
import connectDB from '@/lib/db/connection';
import { AppSetting } from '@/lib/db/models';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
export const OAUTH_STATE_COOKIE = 'nm_google_oauth_state';
export const CALLBACK_PATH = '/api/admin/settings/app/google/callback';

/** The browser's origin (sent by the Configure page), accepted only if it matches the request host. */
export function resolveOrigin(request: NextRequest): string {
  const claimed = request.nextUrl.searchParams.get('origin');
  const hosts = [request.headers.get('x-forwarded-host'), request.headers.get('host')].filter(Boolean);
  if (claimed) {
    try {
      const url = new URL(claimed);
      if ((url.protocol === 'https:' || url.protocol === 'http:') && hosts.includes(url.host)) {
        return url.origin;
      }
    } catch {
      // fall through
    }
  }
  return request.nextUrl.origin;
}

export function encodeState(state: string, origin: string): string {
  return JSON.stringify({ state, origin });
}

export function decodeState(value: string | undefined): { state: string; origin: string } | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed?.state === 'string' && typeof parsed?.origin === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function callbackUrl(origin: string): string {
  return `${origin}${CALLBACK_PATH}`;
}

export async function savedGoogleClient(): Promise<{ clientId: string; clientSecret: string } | null> {
  await connectDB();
  const doc = await AppSetting.findById('app').select('googleDrive').lean();
  const clientId = doc?.googleDrive?.GOOGLE_CLIENT_ID?.trim() ?? '';
  const clientSecret = doc?.googleDrive?.GOOGLE_CLIENT_SECRET?.trim() ?? '';
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function oauthClient(clientId: string, clientSecret: string, origin: string) {
  return new google.auth.OAuth2(clientId, clientSecret, callbackUrl(origin));
}

export async function saveRefreshToken(refreshToken: string): Promise<void> {
  await connectDB();
  await AppSetting.updateOne(
    { _id: 'app' },
    { $set: { 'googleDrive.GOOGLE_REFRESH_TOKEN': refreshToken } },
    { upsert: true }
  );
}

export function configureRedirect(origin: string, params: Record<string, string>): string {
  return `${origin}/admin/configure?${new URLSearchParams(params).toString()}`;
}
