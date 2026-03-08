/**
 * Apply Discount Code API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { Cart, User, DiscountCode } from '@/lib/db/models';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    const { session } = authResult;
    const body = await request.json();
    
    const { code } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }
    
    const user = await User.findOne({ auth0Sub: session.user.sub });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }
    
    const discountCode = await DiscountCode.findOne({
      code: code.toUpperCase(),
      active: true,
    });
    
    if (!discountCode) {
      return NextResponse.json(
        { error: 'Invalid discount code' },
        { status: 400 }
      );
    }
    
    if (!(discountCode as any).isValid()) {
      return NextResponse.json(
        { error: 'Discount code has expired or reached usage limit' },
        { status: 400 }
      );
    }
    
    const discountAmount = (discountCode as any).calculateDiscount(cart.subtotal);
    
    cart.discountCode = discountCode.code;
    cart.discount = discountAmount;
    await cart.save();
    
    return NextResponse.json({
      id: cart._id.toString(),
      userId: cart.userId.toString(),
      items: cart.items.map((item) => ({
        id: item._id?.toString(),
        itemType: item.itemType,
        itemId: item.itemId.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      })),
      subtotal: cart.subtotal,
      discount: cart.discount,
      total: cart.total,
      discountCode: cart.discountCode,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to apply discount' },
      { status: 500 }
    );
  }
}
