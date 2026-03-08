/**
 * Driver Assignments API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { DeliveryAssignment, User, Order } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.VIEW_ASSIGNMENTS]);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    const { session } = authResult;
    
    const driver = await User.findOne({ auth0Sub: session.user.sub });
    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }
    
    const assignments = await DeliveryAssignment.find({
      driverId: driver._id,
      status: { $in: ['preparing', 'out_for_delivery'] },
    })
      .populate({
        path: 'orderId',
        populate: { path: 'userId', select: 'name phone address' },
      })
      .sort({ assignedAt: -1 });
    
    const formattedAssignments = assignments.map((assignment) => {
      const order = assignment.orderId as any;
      const customer = order?.userId as any;
      
      return {
        id: assignment._id.toString(),
        orderId: assignment.orderId.toString(),
        orderNumber: order?.orderNumber,
        driverId: assignment.driverId.toString(),
        status: assignment.status,
        customerName: customer?.name || 'Unknown',
        customerPhone: customer?.phone || '',
        customerAddress: order?.deliveryAddress || customer?.address,
        estimatedDeliveryTime: assignment.estimatedDeliveryTime,
        assignedAt: assignment.assignedAt,
        startedAt: assignment.startedAt,
        arrivedAt: assignment.arrivedAt,
        deliveredAt: assignment.deliveredAt,
      };
    });
    
    return NextResponse.json(formattedAssignments);
  } catch (error) {
    console.error('Fetch assignments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
