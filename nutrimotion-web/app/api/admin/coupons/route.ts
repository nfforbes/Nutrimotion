/**
 * Admin: coupon / discount codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { DiscountCode } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_COUPONS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const list = await DiscountCode.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(list);
  } catch (error) {
    console.error('Coupons list error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_COUPONS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const body = await request.json();

    const {
      code,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      stackable,
      oneTimePerUser,
      active,
    } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (type !== 'percentage' && type !== 'fixed') {
      return NextResponse.json({ error: 'Type must be percentage or fixed' }, { status: 400 });
    }
    const numVal = Number(value);
    if (!Number.isFinite(numVal) || numVal < 0) {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
    }
    if (type === 'percentage' && numVal > 100) {
      return NextResponse.json({ error: 'Percentage cannot exceed 100' }, { status: 400 });
    }
    if (!validFrom || !validUntil) {
      return NextResponse.json({ error: 'Valid from and until dates are required' }, { status: 400 });
    }

    const from = new Date(validFrom);
    const until = new Date(validUntil);
    if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime())) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
    }
    if (until <= from) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const doc = await DiscountCode.create({
      code: String(code).trim().toUpperCase(),
      description: String(description).trim(),
      type,
      value: numVal,
      minOrderAmount:
        minOrderAmount != null && minOrderAmount !== '' ? Math.max(0, Number(minOrderAmount)) : undefined,
      maxDiscount:
        maxDiscount != null && maxDiscount !== '' ? Math.max(0, Number(maxDiscount)) : undefined,
      validFrom: from,
      validUntil: until,
      usageLimit:
        usageLimit != null && usageLimit !== ''
          ? Math.max(0, Math.floor(Number(usageLimit)))
          : undefined,
      stackable: Boolean(stackable),
      oneTimePerUser: Boolean(oneTimePerUser),
      active: active !== false,
      usageCount: 0,
    });

    return NextResponse.json(doc);
  } catch (error: unknown) {
    console.error('Create coupon error:', error);
    const msg =
      error && typeof error === 'object' && 'code' in error && (error as { code?: number }).code === 11000
        ? 'A coupon with this code already exists'
        : 'Failed to create coupon';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
