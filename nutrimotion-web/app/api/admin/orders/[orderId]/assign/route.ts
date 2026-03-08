/**
 * Admin Assign Driver API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { Order, DeliveryAssignment } from '@/lib/db/models';
import { OrderStatus } from '@/types/commerce';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const authResult = await requirePermissions(request, [Permission.ASSIGN_DRIVERS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const body = await request.json();
    const { driverId } = body;

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
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

    order.assignedDriverId = new mongoose.Types.ObjectId(driverId);
    order.status = OrderStatus.PREPARING;
    order.statusHistory.push({
      status: OrderStatus.PREPARING,
      timestamp: new Date(),
      note: 'Driver assigned',
      updatedBy: authResult.session.user.email,
    });

    await order.save();

    // Create delivery assignment
    const assignment = await DeliveryAssignment.create({
      orderId: new mongoose.Types.ObjectId(orderId),
      driverId: new mongoose.Types.ObjectId(driverId),
      status: OrderStatus.PREPARING,
      assignedAt: new Date(),
    });

    return NextResponse.json({
      order,
      assignment,
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    return NextResponse.json(
      { error: 'Failed to assign driver' },
      { status: 500 }
    );
  }
}
