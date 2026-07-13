/**
 * Client list for coupon send dialog.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import { UserRole } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { User } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_COUPONS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const clients = await User.find({ roles: UserRole.CLIENT })
      .select('name email')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(
      clients.map((c) => ({
        id: String(c._id),
        name: c.name,
        email: c.email,
      }))
    );
  } catch (error) {
    console.error('Coupon clients list error:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
