/**
 * Admin Assignments API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { DeliveryAssignment, Order } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.ASSIGN_DRIVERS]);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    
    const assignments = await DeliveryAssignment.find()
      .populate('orderId', 'orderNumber deliveryAddress')
      .populate('driverId', 'name phone')
      .sort({ assignedAt: -1 });
    
    return NextResponse.json(assignments.map((assignment) => {
      const order = assignment.orderId as any;
      const driver = assignment.driverId as any;
      
      return {
        id: assignment._id.toString(),
        orderId: assignment.orderId.toString(),
        orderNumber: order?.orderNumber,
        driverId: assignment.driverId.toString(),
        driverName: driver?.name,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        startedAt: assignment.startedAt,
        arrivedAt: assignment.arrivedAt,
        deliveredAt: assignment.deliveredAt,
      };
    }));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
