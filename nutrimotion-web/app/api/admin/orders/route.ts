/**
 * Admin Orders API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { Order } from '@/lib/db/models';

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
