/**
 * Subscriptions API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { Subscription, User } from '@/lib/db/models';
import { getAccessSetting } from '@/lib/content/access';

function toResponse(sub: InstanceType<typeof Subscription>) {
  return {
    id: sub._id.toString(),
    type: sub.type,
    status: sub.status,
    startDate: sub.startDate,
    endDate: sub.endDate,
    autoRenew: sub.autoRenew,
    price: sub.price,
    billingInterval: sub.billingInterval,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { session } = authResult;

    const user = await User.findOne({ auth0Sub: session.user.sub });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscriptions = await Subscription.find({ userId: user._id }).sort({ createdAt: -1 });
    return NextResponse.json(subscriptions.map(toResponse));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

/** Subscribe to recipes or videos at the admin-set monthly price. */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { session } = authResult;
    const body = await request.json();

    const user = await User.findOne({ auth0Sub: session.user.sub });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const type = body?.type;
    if (type !== 'recipes' && type !== 'videos') {
      return NextResponse.json(
        { error: 'Invalid subscription', message: 'Choose recipes or videos.' },
        { status: 400 }
      );
    }

    const setting = await getAccessSetting(type);
    const price = setting.monthlyPrice ?? 0;
    if (price <= 0) {
      return NextResponse.json(
        { error: 'Not available', message: 'This subscription is not available yet.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const existing = await Subscription.findOne({
      userId: user._id,
      type,
      status: 'active',
      endDate: { $gt: now },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Already subscribed', message: `You already have an active ${type} subscription.` },
        { status: 409 }
      );
    }

    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = await Subscription.create({
      userId: user._id,
      type,
      billingInterval: 'monthly',
      price,
      endDate,
      status: 'active',
    });

    return NextResponse.json(toResponse(subscription), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
