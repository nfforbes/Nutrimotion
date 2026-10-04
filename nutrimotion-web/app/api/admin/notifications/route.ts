/**
 * Admin push notifications.
 * GET  → { configured, totalDevices, recipients, history }
 * POST { target: 'user' | 'all', userId?, title, message } → { devices, reached, failed, removed }
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { PushDevice, PushNotificationLog, User } from '@/lib/db/models';
import { pushConfiguration, sendPush } from '@/lib/push';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_USERS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const [byUser, history] = await Promise.all([
      PushDevice.aggregate<{ _id: Types.ObjectId; devices: number; platforms: string[] }>([
        { $group: { _id: '$userId', devices: { $sum: 1 }, platforms: { $addToSet: '$platform' } } },
      ]),
      PushNotificationLog.find({}).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const users = await User.find({ _id: { $in: byUser.map((u) => u._id) } })
      .select('name email')
      .lean();
    const userById = new Map(users.map((u) => [String(u._id), u]));

    const recipients = byUser
      .map((row) => {
        const user = userById.get(String(row._id));
        return user
          ? {
              id: String(row._id),
              name: user.name,
              email: user.email,
              devices: row.devices,
              platforms: row.platforms,
            }
          : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      configured: pushConfiguration(),
      totalDevices: byUser.reduce((sum, row) => sum + row.devices, 0),
      recipients,
      history: history.map((h) => ({
        id: String(h._id),
        target: h.target,
        userLabel: h.userLabel ?? null,
        title: h.title,
        message: h.message,
        devices: h.devices,
        reached: h.reached,
        failed: h.failed,
        sentBy: h.sentBy ?? null,
        createdAt: h.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_USERS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const target = body?.target;
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (target !== 'user' && target !== 'all') {
      return NextResponse.json({ error: 'Choose one customer or everyone.' }, { status: 400 });
    }
    if (!title || title.length > 100) {
      return NextResponse.json({ error: 'Title is required (up to 100 characters).' }, { status: 400 });
    }
    if (!message || message.length > 1000) {
      return NextResponse.json({ error: 'Message is required (up to 1000 characters).' }, { status: 400 });
    }

    await connectDB();

    let userLabel: string | undefined;
    let userId: Types.ObjectId | undefined;
    if (target === 'user') {
      if (typeof body?.userId !== 'string' || !Types.ObjectId.isValid(body.userId)) {
        return NextResponse.json({ error: 'Choose a customer.' }, { status: 400 });
      }
      const user = await User.findById(body.userId).select('name email').lean();
      if (!user) {
        return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
      }
      userId = user._id as Types.ObjectId;
      userLabel = user.name || user.email;
    }

    const devices = await PushDevice.find(userId ? { userId } : {})
      .select('token platform')
      .lean();
    if (devices.length === 0) {
      return NextResponse.json(
        {
          error:
            target === 'user'
              ? 'This customer has not enabled notifications in the app yet.'
              : 'No phones have enabled notifications yet.',
        },
        { status: 400 }
      );
    }

    const summary = await sendPush(
      devices.map((d) => ({ token: d.token, platform: d.platform })),
      { title, body: message }
    );

    await PushNotificationLog.create({
      target,
      userId,
      userLabel,
      title,
      message,
      devices: summary.devices,
      reached: summary.reached,
      failed: summary.failed,
      sentBy: authResult.session.user.email || authResult.session.user.name,
    });

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
