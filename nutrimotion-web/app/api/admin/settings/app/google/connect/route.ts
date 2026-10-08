/**
 * Start "Connect Google Drive": redirects the admin to Google's consent screen.
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import {
  CALLBACK_PATH,
  DRIVE_SCOPE,
  OAUTH_STATE_COOKIE,
  configureRedirect,
  encodeState,
  oauthClient,
  resolveOrigin,
  savedGoogleClient,
} from '@/lib/google/driveOAuth';

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.ADMIN_DASHBOARD]);
  if (authResult instanceof NextResponse) return authResult;

  const origin = resolveOrigin(request);
  const client = await savedGoogleClient();
  if (!client) {
    return NextResponse.redirect(
      configureRedirect(origin, {
        google: 'error',
        reason: 'Save the Google OAuth Client ID and Client Secret first, then connect.',
      })
    );
  }

  const state = randomUUID();
  const url = oauthClient(client.clientId, client.clientSecret, origin).generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [DRIVE_SCOPE],
    include_granted_scopes: true,
    state,
  });

  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_STATE_COOKIE, encodeState(state, origin), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: CALLBACK_PATH,
  });
  return response;
}
