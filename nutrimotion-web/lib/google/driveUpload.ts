/**
 * Upload files to Google Drive using OAuth2 refresh token (Workspace / OAuth client).
 * Aligns with the flow described in antigravity google-drive-automation skill (OAuth + Drive API).
 * Server-only — do not import from client components.
 */

import { Readable } from 'stream';
import { google } from 'googleapis';
import type { IGoogleDriveSettings } from '@/lib/db/models';

/** OAuth2 redirect is unused when only refreshing tokens; Google accepts a placeholder. */
const OAUTH_REDIRECT_PLACEHOLDER = 'urn:ietf:wg:oauth:2.0:oob';

export async function uploadBufferToGoogleDrive(
  settings: IGoogleDriveSettings,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ id: string; webViewLink?: string | null; webContentLink?: string | null }> {
  const oauth2Client = new google.auth.OAuth2(
    settings.GOOGLE_CLIENT_ID,
    settings.GOOGLE_CLIENT_SECRET,
    OAUTH_REDIRECT_PLACEHOLDER
  );
  oauth2Client.setCredentials({ refresh_token: settings.GOOGLE_REFRESH_TOKEN });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: settings.GOOGLE_DRIVE_FOLDER_ID ? [settings.GOOGLE_DRIVE_FOLDER_ID] : undefined,
    },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id, webViewLink, webContentLink',
    supportsAllDrives: true,
  });

  return {
    id: res.data.id ?? '',
    webViewLink: res.data.webViewLink,
    webContentLink: res.data.webContentLink,
  };
}
