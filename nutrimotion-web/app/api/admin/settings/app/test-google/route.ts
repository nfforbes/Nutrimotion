/**
 * Test the Google Drive connection.
 * POST { googleDrive?: { GOOGLE_* } } → { ok, steps }. Blank fields fall back to the saved values.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { AppSetting } from '@/lib/db/models';
import type { IGoogleDriveSettings } from '@/lib/db/models';
import { testGoogleDrive } from '@/lib/google/driveTest';

export const maxDuration = 60;

const KEYS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_DRIVE_FOLDER_ID'] as const;

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.ADMIN_DASHBOARD]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    await connectDB();
    const doc = await AppSetting.findById('app').select('googleDrive').lean();
    const saved = (doc?.googleDrive ?? {}) as Partial<IGoogleDriveSettings>;

    const settings = {} as IGoogleDriveSettings;
    for (const key of KEYS) {
      const typed = body?.googleDrive?.[key];
      settings[key] = typeof typed === 'string' && typed.trim() ? typed.trim() : (saved[key] ?? '');
    }

    return NextResponse.json(await testGoogleDrive(settings));
  } catch (error) {
    console.error('Google Drive test error:', error);
    return NextResponse.json({ error: 'Could not run the Google Drive test' }, { status: 500 });
  }
}
