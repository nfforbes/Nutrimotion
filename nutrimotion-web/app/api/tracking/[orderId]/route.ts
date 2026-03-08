/**
 * Client Order Tracking API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { Order, DeliveryAssignment, DeliveryTracking, User } from '@/lib/db/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { session } = authResult as any;

    // Get user from DB to get their _id
    const user = await User.findOne({ auth0Sub: session.user.sub });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find order by ID (which is what dashboard passes)
    // Fallback to orderNumber just in case, or if passed directly
    let order;
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(orderId).populate('assignedDriverId', 'name phone');
    } else {
      order = await Order.findOne({ orderNumber: orderId }).populate('assignedDriverId', 'name phone');
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Authorization check: User can only track their own orders
    // Unless they have admin/driver permissions (optional improvement)
    if (order.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized to track this order' },
        { status: 403 }
      );
    }

    const assignment = await DeliveryAssignment.findOne({
      orderId: order._id,
    });

    let trackingPoints: any[] = [];
    let currentLocation = null;

    if (assignment && order.status === 'out_for_delivery') {
      // Get last 50 tracking points
      trackingPoints = await DeliveryTracking.find({
        assignmentId: assignment._id,
      })
        .sort({ timestamp: -1 })
        .limit(50);

      if (trackingPoints.length > 0) {
        currentLocation = {
          lat: trackingPoints[0].coordinates.lat,
          lng: trackingPoints[0].coordinates.lng,
          timestamp: trackingPoints[0].timestamp,
        };
      }
    }

    return NextResponse.json({
      order: {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
      },
      driver: order.assignedDriverId
        ? {
          name: (order.assignedDriverId as any).name,
          phone: (order.assignedDriverId as any).phone,
        }
        : null,
      assignment: assignment
        ? {
          id: assignment._id.toString(),
          status: assignment.status,
          estimatedDeliveryTime: assignment.estimatedDeliveryTime,
          startedAt: assignment.startedAt,
          arrivedAt: assignment.arrivedAt,
        }
        : null,
      currentLocation,
      trackingPoints: trackingPoints.map((point) => ({
        lat: point.coordinates.lat,
        lng: point.coordinates.lng,
        timestamp: point.timestamp,
      })),
    });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}
