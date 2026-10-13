/**
 * Clients, weeks, packages and meals an admin can use to add an order.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import { getAdminOrderOptions } from '@/lib/orders/adminOrder';

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_ORDERS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    return NextResponse.json(await getAdminOrderOptions());
  } catch (error) {
    console.error('Admin order options error:', error);
    return NextResponse.json({ error: 'Failed to load order options' }, { status: 500 });
  }
}
