/**
 * Subscriptions API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { User } from '@/lib/db/models';
import mongoose from 'mongoose';

// Subscription model (simplified - you may want to create a separate model)
const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['recipes', 'videos', 'training'], required: true },
  status: { type: String, enum: ['active', 'inactive', 'cancelled', 'expired'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  autoRenew: { type: Boolean, default: true },
  price: { type: Number, required: true },
  billingInterval: { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
}, { timestamps: true });

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);

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
    
    const subscriptions = await Subscription.find({ userId: user._id })
      .sort({ createdAt: -1 });
    
    return NextResponse.json(subscriptions.map((sub) => ({
      id: sub._id.toString(),
      type: sub.type,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      autoRenew: sub.autoRenew,
      price: sub.price,
      billingInterval: sub.billingInterval,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    })));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    const { session } = authResult;
    const body = await request.json();
    
    const user = await User.findOne({ auth0Sub: session.user.sub });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const { type, billingInterval, price } = body;
    
    if (!type || !billingInterval || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Calculate end date based on billing interval
    const endDate = new Date();
    if (billingInterval === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingInterval === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (billingInterval === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    const subscription = await Subscription.create({
      userId: user._id,
      type,
      billingInterval,
      price,
      endDate,
      status: 'active',
    });
    
    return NextResponse.json({
      id: subscription._id.toString(),
      type: subscription.type,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenew: subscription.autoRenew,
      price: subscription.price,
      billingInterval: subscription.billingInterval,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
