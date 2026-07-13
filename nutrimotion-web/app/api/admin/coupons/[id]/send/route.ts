/**
 * Send a coupon to one or more clients.
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { CouponDelivery, DiscountCode, User } from '@/lib/db/models';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_COUPONS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid coupon id' }, { status: 400 });
    }

    const body = await request.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one client' }, { status: 400 });
    }

    const validUserIds = userIds.filter((uid: unknown) => mongoose.Types.ObjectId.isValid(String(uid)));
    if (validUserIds.length === 0) {
      return NextResponse.json({ error: 'No valid client ids provided' }, { status: 400 });
    }

    const coupon = await DiscountCode.findById(id);
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const admin = await User.findOne({ auth0Sub: authResult.session.user.sub });
    const clients = await User.find({ _id: { $in: validUserIds } }).select('_id name email');
    if (clients.length === 0) {
      return NextResponse.json({ error: 'No matching clients found' }, { status: 404 });
    }

    const now = new Date();
    let sent = 0;
    let alreadySent = 0;

    for (const client of clients) {
      const result = await CouponDelivery.updateOne(
        { userId: client._id, discountCodeId: coupon._id },
        {
          $set: { sentAt: now, sentByUserId: admin?._id },
          $setOnInsert: { userId: client._id, discountCodeId: coupon._id },
        },
        { upsert: true }
      );
      if (result.upsertedCount > 0) {
        sent++;
      } else {
        alreadySent++;
      }
    }

    return NextResponse.json({
      ok: true,
      couponCode: coupon.code,
      sent,
      alreadySent,
      clients: clients.map((c) => ({ id: String(c._id), name: c.name, email: c.email })),
    });
  } catch (error) {
    console.error('Send coupon error:', error);
    return NextResponse.json({ error: 'Failed to send coupon' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_COUPONS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid coupon id' }, { status: 400 });
    }

    const deliveries = await CouponDelivery.find({ discountCodeId: id })
      .populate('userId', 'name email')
      .sort({ sentAt: -1 })
      .lean();

    return NextResponse.json(
      deliveries.map((d) => ({
        id: String(d._id),
        sentAt: d.sentAt,
        user: d.userId && typeof d.userId === 'object' && '_id' in d.userId
          ? {
              id: String((d.userId as { _id: unknown })._id),
              name: (d.userId as { name?: string }).name,
              email: (d.userId as { email?: string }).email,
            }
          : null,
      }))
    );
  } catch (error) {
    console.error('List coupon deliveries error:', error);
    return NextResponse.json({ error: 'Failed to list deliveries' }, { status: 500 });
  }
}
