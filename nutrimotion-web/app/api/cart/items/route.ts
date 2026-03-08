/**
 * Cart Items API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { Cart, User } from '@/lib/db/models';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { session } = authResult;
    const body = await request.json();

    const { itemType, itemId, name, price, quantity, imageUrl, packageDetails } = body;

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
      } as any);
    }

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
        packageDetails: item.packageDetails,
      })),
      subtotal: cart.subtotal,
      discount: cart.discount,
      total: cart.total,
      discountCode: cart.discountCode,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    });
  } catch (error: any) {
    console.error('Add to cart error:', error);
    require('fs').appendFileSync('api_error.log', 'Error adding to cart: ' + (error.message || error) + '\nStack: ' + error.stack + '\n');
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}
