/**
 * Apply or clear coupon codes on the cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { Cart, User } from '@/lib/db/models';
import { applyCouponCodeToCart, cartToResponse, clearCartDiscounts } from '@/lib/discount/cartDiscounts';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { session } = authResult;
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const user = await User.findOne({ auth0Sub: session.user.sub });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    await applyCouponCodeToCart(cart as never, user._id, code);
    await cart.save();

    return NextResponse.json(cartToResponse(cart as never));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to apply coupon';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { session } = authResult;

    const user = await User.findOne({ auth0Sub: session.user.sub });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    await clearCartDiscounts(cart as never);
    await cart.save();

    return NextResponse.json(cartToResponse(cart as never));
  } catch {
    return NextResponse.json({ error: 'Failed to remove coupons' }, { status: 500 });
  }
}
