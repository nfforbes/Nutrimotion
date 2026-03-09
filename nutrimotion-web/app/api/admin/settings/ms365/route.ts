/**
 * Admin MS365 settings API
 * GET: return current MS365 config (client secret masked)
 * PUT: update MS365 config (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { AppSetting } from '@/lib/db/models';

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
    const ms365 = doc?.ms365 ?? {};

    return NextResponse.json({
      MS365_CLIENT_ID: ms365.MS365_CLIENT_ID ?? '',
      MS365_CLIENT_SECRET: ms365.MS365_CLIENT_SECRET ? maskSecret(ms365.MS365_CLIENT_SECRET) : '',
      MS365_TENANT_ID: ms365.MS365_TENANT_ID ?? '',
      MS365_SHAREPOINT_SITE_ID: ms365.MS365_SHAREPOINT_SITE_ID ?? '',
      MS365_VIDEOS_FOLDER_PATH: ms365.MS365_VIDEOS_FOLDER_PATH ?? '',
      MS365_EMAIL_FROM: ms365.MS365_EMAIL_FROM ?? '',
    });
  } catch (error) {
    console.error('MS365 settings GET error:', error);
    return NextResponse.json({ error: 'Failed to load MS365 settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.ADMIN_DASHBOARD]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const body = await request.json();

    const MS365_CLIENT_ID = typeof body.MS365_CLIENT_ID === 'string' ? body.MS365_CLIENT_ID.trim() : '';
    const MS365_CLIENT_SECRET = typeof body.MS365_CLIENT_SECRET === 'string' ? body.MS365_CLIENT_SECRET.trim() : '';
    const MS365_TENANT_ID = typeof body.MS365_TENANT_ID === 'string' ? body.MS365_TENANT_ID.trim() : '';
    const MS365_SHAREPOINT_SITE_ID = typeof body.MS365_SHAREPOINT_SITE_ID === 'string' ? body.MS365_SHAREPOINT_SITE_ID.trim() : '';
    const MS365_VIDEOS_FOLDER_PATH = typeof body.MS365_VIDEOS_FOLDER_PATH === 'string' ? body.MS365_VIDEOS_FOLDER_PATH.trim() : '';
    const MS365_EMAIL_FROM = typeof body.MS365_EMAIL_FROM === 'string' ? body.MS365_EMAIL_FROM.trim() : '';

    let doc = await AppSetting.findById(CONFIG_ID);
    if (!doc) {
      doc = await AppSetting.create({
        _id: CONFIG_ID,
        ms365: {
          MS365_CLIENT_ID,
          MS365_CLIENT_SECRET,
          MS365_TENANT_ID,
          MS365_SHAREPOINT_SITE_ID,
          MS365_VIDEOS_FOLDER_PATH,
          MS365_EMAIL_FROM,
        },
      });
    } else {
      doc.ms365 = doc.ms365 ?? {};
      doc.ms365.MS365_CLIENT_ID = MS365_CLIENT_ID;
      if (MS365_CLIENT_SECRET) doc.ms365.MS365_CLIENT_SECRET = MS365_CLIENT_SECRET;
      doc.ms365.MS365_TENANT_ID = MS365_TENANT_ID;
      doc.ms365.MS365_SHAREPOINT_SITE_ID = MS365_SHAREPOINT_SITE_ID;
      doc.ms365.MS365_VIDEOS_FOLDER_PATH = MS365_VIDEOS_FOLDER_PATH;
      doc.ms365.MS365_EMAIL_FROM = MS365_EMAIL_FROM;
      await doc.save();
    }

    return NextResponse.json({
      MS365_CLIENT_ID: doc.ms365?.MS365_CLIENT_ID ?? '',
      MS365_CLIENT_SECRET: doc.ms365?.MS365_CLIENT_SECRET ? maskSecret(doc.ms365.MS365_CLIENT_SECRET) : '',
      MS365_TENANT_ID: doc.ms365?.MS365_TENANT_ID ?? '',
      MS365_SHAREPOINT_SITE_ID: doc.ms365?.MS365_SHAREPOINT_SITE_ID ?? '',
      MS365_VIDEOS_FOLDER_PATH: doc.ms365?.MS365_VIDEOS_FOLDER_PATH ?? '',
      MS365_EMAIL_FROM: doc.ms365?.MS365_EMAIL_FROM ?? '',
    });
  } catch (error) {
    console.error('MS365 settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to save MS365 settings' }, { status: 500 });
  }
}
