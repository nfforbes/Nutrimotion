/**
 * Admin: single coupon
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { DiscountCode } from '@/lib/db/models';
import mongoose from 'mongoose';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_COUPONS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.type !== undefined) {
      if (body.type !== 'percentage' && body.type !== 'fixed') {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
      updates.type = body.type;
    }
    if (body.value !== undefined) {
      const v = Number(body.value);
      if (!Number.isFinite(v) || v < 0) {
        return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
      }
      updates.value = v;
    }
    if (body.minOrderAmount !== undefined) {
      updates.minOrderAmount =
        body.minOrderAmount === '' || body.minOrderAmount == null
          ? undefined
          : Math.max(0, Number(body.minOrderAmount));
    }
    if (body.maxDiscount !== undefined) {
      updates.maxDiscount =
        body.maxDiscount === '' || body.maxDiscount == null
          ? undefined
          : Math.max(0, Number(body.maxDiscount));
    }
    if (body.validFrom !== undefined) updates.validFrom = new Date(body.validFrom);
    if (body.validUntil !== undefined) updates.validUntil = new Date(body.validUntil);
    if (body.usageLimit !== undefined) {
      updates.usageLimit =
        body.usageLimit === '' || body.usageLimit == null
          ? undefined
          : Math.max(0, Math.floor(Number(body.usageLimit)));
    }
    if (body.stackable !== undefined) updates.stackable = Boolean(body.stackable);
    if (body.oneTimePerUser !== undefined) updates.oneTimePerUser = Boolean(body.oneTimePerUser);
    if (body.active !== undefined) updates.active = Boolean(body.active);

    const doc = await DiscountCode.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!doc) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error('Patch coupon error:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_COUPONS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const doc = await DiscountCode.findByIdAndUpdate(id, { $set: { active: false } }, { new: true });
    if (!doc) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Failed to deactivate coupon' }, { status: 500 });
  }
}
