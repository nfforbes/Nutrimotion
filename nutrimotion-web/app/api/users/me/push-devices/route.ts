/**
 * Register / unregister this phone for push notifications.
 * POST { token, platform: 'android' | 'ios' }   DELETE { token }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { PushDevice, User } from '@/lib/db/models';

function parseToken(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length >= 20 && value.length <= 4096
    ? value.trim()
    : null;
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const token = parseToken(body?.token);
    const platform = body?.platform;
    if (!token || (platform !== 'android' && platform !== 'ios')) {
      return NextResponse.json(
        { error: 'Invalid device', message: 'A push token and platform (android or ios) are required.' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ auth0Sub: authResult.session.user.sub }).select('_id');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // A phone that switches accounts keeps its token, so the token moves to the signed-in user.
    await PushDevice.updateOne(
      { token },
      { $set: { userId: user._id, platform, lastSeenAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to register device' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const token = parseToken(body?.token);
    if (!token) {
      return NextResponse.json({ error: 'A push token is required.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ auth0Sub: authResult.session.user.sub }).select('_id');
    if (user) {
      await PushDevice.deleteOne({ token, userId: user._id });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove device' }, { status: 500 });
  }
}
