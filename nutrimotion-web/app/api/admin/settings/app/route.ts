/**
 * Admin app storage settings: provider (Microsoft 365 / Google Drive) + credentials.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { AppSetting } from '@/lib/db/models';
import type { FileStorageProvider, IGoogleDriveSettings, IMs365Settings } from '@/lib/db/models';

const CONFIG_ID = 'app';

function maskSecret(value: string): string {
  if (!value || value.length === 0) return '';
  if (value.length <= 4) return '****';
  return value.slice(0, 2) + '****' + value.slice(-2);
}

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.ADMIN_DASHBOARD]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const doc = await AppSetting.findById(CONFIG_ID).lean();

    const ms365: IMs365Settings = doc?.ms365
      ? (doc.ms365 as IMs365Settings)
      : {
          MS365_CLIENT_ID: '',
          MS365_CLIENT_SECRET: '',
          MS365_TENANT_ID: '',
          MS365_SHAREPOINT_SITE_ID: '',
          MS365_VIDEOS_FOLDER_PATH: '',
          MS365_EMAIL_FROM: '',
        };

    const googleDrive: IGoogleDriveSettings = doc?.googleDrive
      ? (doc.googleDrive as IGoogleDriveSettings)
      : {
          GOOGLE_CLIENT_ID: '',
          GOOGLE_CLIENT_SECRET: '',
          GOOGLE_REFRESH_TOKEN: '',
          GOOGLE_DRIVE_FOLDER_ID: '',
        };

    const provider = (doc?.fileStorageProvider as FileStorageProvider) || 'microsoft365';

    return NextResponse.json({
      fileStorageProvider: provider,
      ms365: {
        MS365_CLIENT_ID: ms365.MS365_CLIENT_ID ?? '',
        MS365_CLIENT_SECRET: ms365.MS365_CLIENT_SECRET ? maskSecret(ms365.MS365_CLIENT_SECRET) : '',
        MS365_TENANT_ID: ms365.MS365_TENANT_ID ?? '',
        MS365_SHAREPOINT_SITE_ID: ms365.MS365_SHAREPOINT_SITE_ID ?? '',
        MS365_VIDEOS_FOLDER_PATH: ms365.MS365_VIDEOS_FOLDER_PATH ?? '',
        MS365_EMAIL_FROM: ms365.MS365_EMAIL_FROM ?? '',
      },
      googleDrive: {
        GOOGLE_CLIENT_ID: googleDrive.GOOGLE_CLIENT_ID ?? '',
        GOOGLE_CLIENT_SECRET: googleDrive.GOOGLE_CLIENT_SECRET ? maskSecret(googleDrive.GOOGLE_CLIENT_SECRET) : '',
        GOOGLE_REFRESH_TOKEN: googleDrive.GOOGLE_REFRESH_TOKEN ? maskSecret(googleDrive.GOOGLE_REFRESH_TOKEN) : '',
        GOOGLE_DRIVE_FOLDER_ID: googleDrive.GOOGLE_DRIVE_FOLDER_ID ?? '',
      },
    });
  } catch (error) {
    console.error('App settings GET error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.ADMIN_DASHBOARD]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const body = await request.json();

    const fileStorageProvider: FileStorageProvider =
      body.fileStorageProvider === 'google_drive' ? 'google_drive' : 'microsoft365';

    const MS365_CLIENT_ID =
      typeof body.ms365?.MS365_CLIENT_ID === 'string' ? body.ms365.MS365_CLIENT_ID.trim() : '';
    const MS365_CLIENT_SECRET =
      typeof body.ms365?.MS365_CLIENT_SECRET === 'string' ? body.ms365.MS365_CLIENT_SECRET.trim() : '';
    const MS365_TENANT_ID =
      typeof body.ms365?.MS365_TENANT_ID === 'string' ? body.ms365.MS365_TENANT_ID.trim() : '';
    const MS365_SHAREPOINT_SITE_ID =
      typeof body.ms365?.MS365_SHAREPOINT_SITE_ID === 'string'
        ? body.ms365.MS365_SHAREPOINT_SITE_ID.trim()
        : '';
    const MS365_VIDEOS_FOLDER_PATH =
      typeof body.ms365?.MS365_VIDEOS_FOLDER_PATH === 'string'
        ? body.ms365.MS365_VIDEOS_FOLDER_PATH.trim()
        : '';
    const MS365_EMAIL_FROM =
      typeof body.ms365?.MS365_EMAIL_FROM === 'string' ? body.ms365.MS365_EMAIL_FROM.trim() : '';

    const GOOGLE_CLIENT_ID =
      typeof body.googleDrive?.GOOGLE_CLIENT_ID === 'string' ? body.googleDrive.GOOGLE_CLIENT_ID.trim() : '';
    const GOOGLE_CLIENT_SECRET =
      typeof body.googleDrive?.GOOGLE_CLIENT_SECRET === 'string'
        ? body.googleDrive.GOOGLE_CLIENT_SECRET.trim()
        : '';
    const GOOGLE_REFRESH_TOKEN =
      typeof body.googleDrive?.GOOGLE_REFRESH_TOKEN === 'string'
        ? body.googleDrive.GOOGLE_REFRESH_TOKEN.trim()
        : '';
    const GOOGLE_DRIVE_FOLDER_ID =
      typeof body.googleDrive?.GOOGLE_DRIVE_FOLDER_ID === 'string'
        ? body.googleDrive.GOOGLE_DRIVE_FOLDER_ID.trim()
        : '';

    let doc = await AppSetting.findById(CONFIG_ID);
    if (!doc) {
      doc = await AppSetting.create({
        _id: CONFIG_ID,
        fileStorageProvider,
        ms365: {
          MS365_CLIENT_ID,
          MS365_CLIENT_SECRET,
          MS365_TENANT_ID,
          MS365_SHAREPOINT_SITE_ID,
          MS365_VIDEOS_FOLDER_PATH,
          MS365_EMAIL_FROM,
        },
        googleDrive: {
          GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET,
          GOOGLE_REFRESH_TOKEN,
          GOOGLE_DRIVE_FOLDER_ID,
        },
      });
    } else {
      const existingMs = doc.ms365 as IMs365Settings | undefined;
      const existingGd = doc.googleDrive as IGoogleDriveSettings | undefined;

      doc.fileStorageProvider = fileStorageProvider;
      doc.ms365 = {
        MS365_CLIENT_ID,
        MS365_CLIENT_SECRET: MS365_CLIENT_SECRET || (existingMs?.MS365_CLIENT_SECRET ?? ''),
        MS365_TENANT_ID,
        MS365_SHAREPOINT_SITE_ID,
        MS365_VIDEOS_FOLDER_PATH,
        MS365_EMAIL_FROM,
      };
      doc.googleDrive = {
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: GOOGLE_CLIENT_SECRET || (existingGd?.GOOGLE_CLIENT_SECRET ?? ''),
        GOOGLE_REFRESH_TOKEN: GOOGLE_REFRESH_TOKEN || (existingGd?.GOOGLE_REFRESH_TOKEN ?? ''),
        GOOGLE_DRIVE_FOLDER_ID,
      };
      await doc.save();
    }

    const ms365Out = doc.ms365 as IMs365Settings;
    const googleOut = doc.googleDrive as IGoogleDriveSettings;

    return NextResponse.json({
      fileStorageProvider: doc.fileStorageProvider || 'microsoft365',
      ms365: {
        MS365_CLIENT_ID: ms365Out?.MS365_CLIENT_ID ?? '',
        MS365_CLIENT_SECRET: ms365Out?.MS365_CLIENT_SECRET ? maskSecret(ms365Out.MS365_CLIENT_SECRET) : '',
        MS365_TENANT_ID: ms365Out?.MS365_TENANT_ID ?? '',
        MS365_SHAREPOINT_SITE_ID: ms365Out?.MS365_SHAREPOINT_SITE_ID ?? '',
        MS365_VIDEOS_FOLDER_PATH: ms365Out?.MS365_VIDEOS_FOLDER_PATH ?? '',
        MS365_EMAIL_FROM: ms365Out?.MS365_EMAIL_FROM ?? '',
      },
      googleDrive: {
        GOOGLE_CLIENT_ID: googleOut?.GOOGLE_CLIENT_ID ?? '',
        GOOGLE_CLIENT_SECRET: googleOut?.GOOGLE_CLIENT_SECRET ? maskSecret(googleOut.GOOGLE_CLIENT_SECRET) : '',
        GOOGLE_REFRESH_TOKEN: googleOut?.GOOGLE_REFRESH_TOKEN ? maskSecret(googleOut.GOOGLE_REFRESH_TOKEN) : '',
        GOOGLE_DRIVE_FOLDER_ID: googleOut?.GOOGLE_DRIVE_FOLDER_ID ?? '',
      },
    });
  } catch (error) {
    console.error('App settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
