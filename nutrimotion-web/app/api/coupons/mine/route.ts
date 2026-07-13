/**
 * Client's sent coupons that are still valid.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { User } from '@/lib/db/models';
import { getValidSentCouponsForUser } from '@/lib/discount/couponDelivery';

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

    const coupons = await getValidSentCouponsForUser(user._id);
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Client coupons error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}
