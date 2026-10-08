/**
 * Step-by-step Google Drive connection check: token refresh, folder access, upload + delete.
 * Server-only.
 */

import { Readable } from 'stream';
import { google } from 'googleapis';
import type { IGoogleDriveSettings } from '@/lib/db/models';

const OAUTH_REDIRECT_PLACEHOLDER = 'urn:ietf:wg:oauth:2.0:oob';

export interface DriveTestStep {
  label: string;
  ok: boolean;
  detail: string;
}

export interface DriveTestResult {
  ok: boolean;
  steps: DriveTestStep[];
}

function googleError(error: unknown): { code: string; text: string; status?: number } {
  const e = error as {
    message?: string;
    code?: number | string;
    response?: { status?: number; data?: { error?: string | { message?: string }; error_description?: string } };
  };
  const data = e.response?.data;
  const code = typeof data?.error === 'string' ? data.error : '';
  const text =
    data?.error_description ||
    (typeof data?.error === 'object' ? data.error?.message : undefined) ||
    e.message ||
    'Unknown error';
  return { code, text, status: e.response?.status ?? (typeof e.code === 'number' ? e.code : undefined) };
}

function explainTokenError(error: unknown): string {
  const { code, text } = googleError(error);
  if (code === 'invalid_client' || code === 'unauthorized_client') {
    return `Google rejected the client ID or secret (${code}). Check they come from the same OAuth client.`;
  }
  if (code === 'invalid_grant') {
    return (
      'Google rejected the refresh token (invalid_grant). It may have expired, been revoked, or been created ' +
      'with a different client ID. Apps in "Testing" mode issue tokens that expire after 7 days.'
    );
  }
  return text;
}

export async function testGoogleDrive(settings: IGoogleDriveSettings): Promise<DriveTestResult> {
  const steps: DriveTestStep[] = [];
  const finish = () => ({ ok: steps.every((s) => s.ok), steps });

  const missing = [
    ['Client ID', settings.GOOGLE_CLIENT_ID],
    ['Client secret', settings.GOOGLE_CLIENT_SECRET],
    ['Refresh token', settings.GOOGLE_REFRESH_TOKEN],
  ]
    .filter(([, v]) => !v)
    .map(([label]) => label);
  if (missing.length > 0) {
    steps.push({ label: 'Settings', ok: false, detail: `Missing: ${missing.join(', ')}.` });
    return finish();
  }

  const auth = new google.auth.OAuth2(
    settings.GOOGLE_CLIENT_ID,
    settings.GOOGLE_CLIENT_SECRET,
    OAUTH_REDIRECT_PLACEHOLDER
  );
  auth.setCredentials({ refresh_token: settings.GOOGLE_REFRESH_TOKEN });

  try {
    await auth.getAccessToken();
  } catch (error) {
    steps.push({ label: 'Sign in to Google', ok: false, detail: explainTokenError(error) });
    return finish();
  }

  const drive = google.drive({ version: 'v3', auth });
  try {
    const about = await drive.about.get({ fields: 'user(emailAddress,displayName)' });
    const user = about.data.user;
    steps.push({
      label: 'Sign in to Google',
      ok: true,
      detail: `Connected as ${user?.emailAddress ?? user?.displayName ?? 'the authorized account'}.`,
    });
  } catch (error) {
    const { text, status } = googleError(error);
    const hint = status === 403 ? ' Make sure the Google Drive API is enabled for this Cloud project.' : '';
    steps.push({ label: 'Sign in to Google', ok: false, detail: `${text}${hint}` });
    return finish();
  }

  const folderId = settings.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (folderId) {
    try {
      const folder = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType, trashed, capabilities(canAddChildren)',
        supportsAllDrives: true,
      });
      const f = folder.data;
      if (f.mimeType !== 'application/vnd.google-apps.folder') {
        steps.push({ label: 'Upload folder', ok: false, detail: `"${f.name}" is a file, not a folder.` });
        return finish();
      }
      if (f.trashed) {
        steps.push({ label: 'Upload folder', ok: false, detail: `Folder "${f.name}" is in the trash.` });
        return finish();
      }
      if (f.capabilities?.canAddChildren === false) {
        steps.push({
          label: 'Upload folder',
          ok: false,
          detail: `Found "${f.name}", but this account can only view it. Share it with edit access.`,
        });
        return finish();
      }
      steps.push({ label: 'Upload folder', ok: true, detail: `Found folder "${f.name}".` });
    } catch (error) {
      const { text, status } = googleError(error);
      const detail =
        status === 404
          ? 'Folder not found. Check the folder ID, that the signed-in account can open it, and — if the token ' +
            'uses the drive.file scope — that the app created the folder or the token uses the full drive scope.'
          : text;
      steps.push({ label: 'Upload folder', ok: false, detail });
      return finish();
    }
  } else {
    steps.push({
      label: 'Upload folder',
      ok: true,
      detail: 'No folder ID set, so uploads go to the top of My Drive.',
    });
  }

  try {
    const created = await drive.files.create({
      requestBody: {
        name: `nutrimotion-connection-test-${Date.now()}.txt`,
        parents: folderId ? [folderId] : undefined,
      },
      media: { mimeType: 'text/plain', body: Readable.from(Buffer.from('Nutrimotion connection test')) },
      fields: 'id',
      supportsAllDrives: true,
    });
    const id = created.data.id;
    let cleanup = '';
    if (id) {
      try {
        await drive.files.delete({ fileId: id, supportsAllDrives: true });
      } catch {
        cleanup = ' The test file could not be deleted; you can remove it from Drive.';
      }
    }
    steps.push({ label: 'Upload a test file', ok: true, detail: `Uploaded and removed a small test file.${cleanup}` });
  } catch (error) {
    const { text, status } = googleError(error);
    const hint =
      status === 403 ? ' The token may lack a Drive write scope (drive.file or drive).' : '';
    steps.push({ label: 'Upload a test file', ok: false, detail: `${text}${hint}` });
  }

  return finish();
}
