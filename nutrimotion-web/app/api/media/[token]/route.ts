/**
 * Secure Media Delivery API
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySignedToken } from '@/lib/services/media-security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const verification = verifySignedToken(token);

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Invalid token' },
        { status: 403 }
      );
    }

    const { mediaPath, userId, deviceId } = verification.payload;

    // In production, you would:
    // 1. Verify user has access to this content
    // 2. Check device binding if required
    // 3. Stream the file from cloud storage
    // 4. Add watermark if needed

    // For now, return metadata about the media
    return NextResponse.json({
      message: 'Media access granted',
      mediaPath,
      userId,
      deviceId,
      expiresAt: new Date(verification.payload.expiresAt),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to deliver media' },
      { status: 500 }
    );
  }
}
