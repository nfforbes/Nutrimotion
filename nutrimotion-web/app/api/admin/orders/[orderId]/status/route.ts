/**
 * Admin Update Order Status API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { Order } from '@/lib/db/models';
import { OrderStatus } from '@/types/commerce';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const authResult = await requirePermissions(request, [Permission.UPDATE_DELIVERY_STATUS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const body = await request.json();
    const { status, note, driverId } = body;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Require driver assignment for OUT_FOR_DELIVERY
    if (status === OrderStatus.OUT_FOR_DELIVERY && !driverId) {
      return NextResponse.json(
        { error: 'Driver assignment is required for this status' },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Handle driver assignment
    if (driverId) {
      const { DeliveryAssignment } = await import('@/lib/db/models');
      const mongoose = (await import('mongoose')).default;

      order.assignedDriverId = new mongoose.Types.ObjectId(driverId);

      // Update or create delivery assignment
      await DeliveryAssignment.findOneAndUpdate(
        { orderId: new mongoose.Types.ObjectId(orderId) },
        {
          driverId: new mongoose.Types.ObjectId(driverId),
          status: status as OrderStatus,
          assignedAt: new Date(),
          startedAt: status === OrderStatus.OUT_FOR_DELIVERY ? new Date() : undefined,
        },
        { upsert: true, new: true }
      );
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || (driverId ? 'Status updated with driver assignment' : undefined),
      updatedBy: authResult.session.user.email,
    });

    await order.save();

    return NextResponse.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
