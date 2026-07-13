/**
 * Cart Items API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { Cart, User } from '@/lib/db/models';
import mongoose from 'mongoose';
import { cartToResponse, refreshDiscountsIfNeeded } from '@/lib/discount/cartDiscounts';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { session } = authResult;
    const body = await request.json();

    const { itemType, itemId, name, price, quantity, imageUrl, packageDetails, mealSlot, scheduledDate } = body;

    if (!itemType || !itemId || !name || price === undefined || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    let cart = await Cart.findOne({ userId: user._id });

    if (!cart) {
      cart = await Cart.create({
        userId: user._id,
        items: [],
      });
    }

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.itemType === itemType &&
        item.itemId.toString() === itemId
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        itemType,
        itemId: new mongoose.Types.ObjectId(itemId),
        name,
        price,
        quantity,
        imageUrl,
        packageDetails,
        mealSlot,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      } as any);
    }

    await cart.save();
    await refreshDiscountsIfNeeded(cart._id);

    const fresh = await Cart.findById(cart._id);
    if (!fresh) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    return NextResponse.json(cartToResponse(fresh as never));
  } catch (error: any) {
    console.error('Add to cart error:', error);
    require('fs').appendFileSync('api_error.log', 'Error adding to cart: ' + (error.message || error) + '\nStack: ' + error.stack + '\n');
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}
