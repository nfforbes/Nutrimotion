/**
 * Admin Orders API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { Order } from '@/lib/db/models';
import { AdminOrderError, createAdminOrder } from '@/lib/orders/adminOrder';

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_ORDERS]);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let query: any = {};
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .populate('assignedDriverId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(100);
    
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/** Add an order for a client for any week that is not over. */
export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_ORDERS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const order = await createAdminOrder(body, authResult.session.user.email);
    const populated = await Order.findById(order._id)
      .populate('userId', 'name email phone')
      .populate('assignedDriverId', 'name phone');
    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    if (error instanceof AdminOrderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Admin create order error:', error);
    return NextResponse.json({ error: 'Failed to add the order' }, { status: 500 });
  }
}
