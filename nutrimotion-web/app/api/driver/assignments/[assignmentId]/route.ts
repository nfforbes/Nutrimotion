/**
 * Driver Assignment Update API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { DeliveryAssignment, Order } from '@/lib/db/models';
import { OrderStatus } from '@/types/commerce';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const { assignmentId } = await params;
  const authResult = await requirePermissions(request, [Permission.UPDATE_DELIVERY]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const body = await request.json();
    const { status } = body;

    const assignment = await DeliveryAssignment.findById(assignmentId);

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    assignment.status = status;

    if (status === OrderStatus.OUT_FOR_DELIVERY && !assignment.startedAt) {
      assignment.startedAt = new Date();
    } else if (status === OrderStatus.DELIVERED) {
      assignment.arrivedAt = assignment.arrivedAt || new Date();
      assignment.deliveredAt = new Date();
      assignment.actualDeliveryTime = new Date();
    }

    await assignment.save();

    // Update order status
    await Order.findByIdAndUpdate(
      assignment.orderId,
      {
        status,
        $push: {
          statusHistory: {
            status,
            timestamp: new Date(),
            note: `Updated by driver`,
          },
        },
      }
    );

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Update assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}
