/**
 * Orders API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { Order, User } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    const { session } = authResult;
    
    const user = await User.findOne({ auth0Sub: session.user.sub });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const orders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    return NextResponse.json(
      orders.map((order) => ({
        id: order._id.toString(),
        userId: order.userId.toString(),
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          id: item._id?.toString(),
          itemType: item.itemType,
          itemId: item.itemId.toString(),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        discountCode: order.discountCode,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        assignedDriverId: order.assignedDriverId?.toString(),
        statusHistory: order.statusHistory,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }))
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
