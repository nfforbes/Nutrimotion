/**
 * Google redirects here after consent; exchanges the code and stores the refresh token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import {
  CALLBACK_PATH,
  OAUTH_STATE_COOKIE,
  configureRedirect,
  decodeState,
  oauthClient,
  resolveOrigin,
  saveRefreshToken,
  savedGoogleClient,
} from '@/lib/google/driveOAuth';

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.ADMIN_DASHBOARD]);
  if (authResult instanceof NextResponse) return authResult;

  const saved = decodeState(request.cookies.get(OAUTH_STATE_COOKIE)?.value);
  const origin = saved?.origin ?? resolveOrigin(request);
  const params = request.nextUrl.searchParams;
  const fail = (reason: string) => {
    const response = NextResponse.redirect(configureRedirect(origin, { google: 'error', reason }));
    response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: CALLBACK_PATH });
    return response;
  };

  const googleError = params.get('error');
  if (googleError) {
    return fail(
      googleError === 'access_denied'
        ? 'Google access was not allowed.'
        : `Google returned an error: ${googleError}`
    );
  }

  const state = params.get('state');
  if (!state || !saved || state !== saved.state) {
    return fail('The sign-in link expired or was opened in another browser. Press Connect Google Drive again.');
  }

  const code = params.get('code');
  if (!code) return fail('Google did not return an authorization code.');

  const client = await savedGoogleClient();
  if (!client) return fail('Save the Google OAuth Client ID and Client Secret first, then connect.');

  try {
    const { tokens } = await oauthClient(client.clientId, client.clientSecret, origin).getToken(code);
    if (!tokens.refresh_token) {
      return fail(
        'Google did not issue a refresh token. Remove the app at myaccount.google.com/permissions and connect again.'
      );
    }
    await saveRefreshToken(tokens.refresh_token);
  } catch (error) {
    const data = (error as { response?: { data?: { error?: string; error_description?: string } } }).response?.data;
    console.error('Google OAuth token exchange failed:', data?.error ?? error);
    return fail(
      data?.error === 'invalid_client'
        ? 'Google rejected the Client ID or Client Secret.'
        : data?.error_description || 'Could not get a token from Google.'
    );
  }

  const response = NextResponse.redirect(configureRedirect(origin, { google: 'connected' }));
  response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: CALLBACK_PATH });
  return response;
}
