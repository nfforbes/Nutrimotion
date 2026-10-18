/**
 * Issues short-lived Vercel Blob tokens so the admin's browser can upload training photos directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_TRAINING]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = (await request.json()) as HandleUploadBody;
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('training/')) throw new Error('Invalid upload path');
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        };
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    console.error('Training photo upload token error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 }
    );
  }
}
