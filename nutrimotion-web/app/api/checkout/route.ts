/**
 * Checkout API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { Cart, User, Order, DiscountCode } from '@/lib/db/models';
import { OrderStatus } from '@/types/commerce';
import { getAppliedCodesFromCart, recalculateCartDiscounts } from '@/lib/discount/cartDiscounts';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { session } = authResult;
    const body = await request.json();

    const { deliveryAddress, deliveryInstructions } = body;

    const user = await User.findOne({ auth0Sub: session.user.sub });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const cart = await Cart.findOne({ userId: user._id });
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    try {
      await recalculateCartDiscounts(cart as never, user._id);
      await cart.save();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Coupons could not be applied';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const discountCodes = getAppliedCodesFromCart(cart as never);

    // Generate order number
    const count = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${count + 1}`;

    // Create order payload for logging
    const orderPayload = {
      userId: user._id,
      orderNumber,
      items: cart.items.map((item) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        mealSlot: item.mealSlot,
        scheduledDate: item.scheduledDate,
        packageDetails: item.packageDetails,
      })),
      subtotal: cart.subtotal,
      discount: cart.discount,
      total: cart.total,
      discountCode: discountCodes[0],
      discountCodes,
      status: OrderStatus.PURCHASED,
      deliveryAddress: deliveryAddress || user.address,
      deliveryInstructions,
      statusHistory: [
        {
          status: OrderStatus.PURCHASED,
          timestamp: new Date(),
          note: 'Order placed successfully',
        },
      ],
    };

    console.log('Attempting to create order with payload:', JSON.stringify(orderPayload, null, 2));

    const order = await Order.create(orderPayload);

    for (const code of discountCodes) {
      await DiscountCode.findOneAndUpdate({ code }, { $inc: { usageCount: 1 } });
    }

    // Clear cart
    cart.items = [];
    cart.subtotal = 0;
    cart.discount = 0;
    cart.total = 0;
    cart.discountCode = undefined;
    await cart.save();

    return NextResponse.json({
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
      deliveryInstructions: order.deliveryInstructions,
      statusHistory: order.statusHistory,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);

    // Log to file for debugging
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'api_error.log');
    const errorMessage = `Error processing checkout: ${error.message}\nStack: ${error.stack}\nDetails: ${JSON.stringify(error)}\n`;
    fs.appendFileSync(logPath, errorMessage);

    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    );
  }
}
