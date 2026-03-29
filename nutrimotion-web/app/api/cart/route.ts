/**
 * Cart API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { Cart, User } from '@/lib/db/models';
import { cartToResponse } from '@/lib/discount/cartDiscounts';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { session } = authResult;

    // Get user ID from database
    const user = await User.findOne({ auth0Sub: session.user.sub });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let cart = await Cart.findOne({ userId: user._id });

    if (!cart) {
      cart = await Cart.create({
        userId: user._id,
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
      });
    }

    return NextResponse.json(cartToResponse(cart as never));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}
