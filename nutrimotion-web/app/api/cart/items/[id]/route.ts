/**
 * Update or remove a single cart line.
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { Cart, User } from '@/lib/db/models';
import { cartToResponse, refreshDiscountsIfNeeded } from '@/lib/discount/cartDiscounts';

async function cartForSession(auth0Sub: string) {
  const user = await User.findOne({ auth0Sub });
  if (!user) return { error: NextResponse.json({ error: 'User not found', message: 'User not found' }, { status: 404 }) };

  const cart = await Cart.findOne({ userId: user._id });
  if (!cart) {
    return { error: NextResponse.json({ error: 'Cart not found', message: 'Cart not found' }, { status: 404 }) };
  }
  return { cart };
}

function savedCartResponse(cart: { _id: unknown }) {
  return Cart.findById(cart._id).then((fresh) => {
    if (!fresh) {
      return NextResponse.json({ error: 'Cart not found', message: 'Cart not found' }, { status: 404 });
    }
    return NextResponse.json(cartToResponse(fresh as never));
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid cart item', message: 'Invalid cart item' }, { status: 400 });
    }

    const body = await request.json();
    const quantity = Number(body?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1', message: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    const found = await cartForSession(authResult.session.user.sub);
    if ('error' in found) return found.error;

    const item = found.cart.items.find((line) => line._id?.toString() === id);
    if (!item) {
      return NextResponse.json({ error: 'Cart item not found', message: 'Cart item not found' }, { status: 404 });
    }

    item.quantity = quantity;
    found.cart.markModified('items');
    await found.cart.save();
    await refreshDiscountsIfNeeded(found.cart._id);
    return savedCartResponse(found.cart);
  } catch (error) {
    console.error('Update cart item error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item', message: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid cart item', message: 'Invalid cart item' }, { status: 400 });
    }

    const found = await cartForSession(authResult.session.user.sub);
    if ('error' in found) return found.error;

    const index = found.cart.items.findIndex((line) => line._id?.toString() === id);
    if (index < 0) {
      return NextResponse.json({ error: 'Cart item not found', message: 'Cart item not found' }, { status: 404 });
    }

    found.cart.items.splice(index, 1);
    found.cart.markModified('items');
    await found.cart.save();
    await refreshDiscountsIfNeeded(found.cart._id);
    return savedCartResponse(found.cart);
  } catch (error) {
    console.error('Remove cart item error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from cart', message: 'Failed to remove from cart' },
      { status: 500 }
    );
  }
}
