/**
 * Admin Dashboard API — live stats and meal breakdown from orders.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { Order, User } from '@/lib/db/models';
import { OrderStatus } from '@/types/commerce';
import { MealSlot } from '@/types/catalog';
import { MEAL_SLOT_ORDER } from '@/lib/meals/slots';
import {
  ACTIVE_ORDER_STATUSES,
  aggregateMealsFromItems,
  totalMealsInBreakdown,
  type SlotMealBreakdown,
} from '@/lib/orders/aggregateMealBreakdown';

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function serializeBreakdown(breakdown: SlotMealBreakdown) {
  const result: Record<string, { name: string; count: number }[]> = {};
  for (const slot of MEAL_SLOT_ORDER) {
    const entries = Object.entries(breakdown[slot])
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    result[slot] = entries;
  }
  return result;
}

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.ADMIN_DASHBOARD]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || todayDateKey();

    const activeOrders = await Order.find({
      status: { $in: ACTIVE_ORDER_STATUSES },
    }).lean();

    const allItems = activeOrders.flatMap((order) =>
      (order.items || []).map((item) => ({
        itemType: item.itemType,
        name: item.name,
        quantity: item.quantity,
        mealSlot: item.mealSlot,
        scheduledDate: item.scheduledDate,
        packageDetails: item.packageDetails,
      }))
    );

    const mealBreakdown = aggregateMealsFromItems(allItems, date);
    const mealsOrderedToday = totalMealsInBreakdown(mealBreakdown);

    const activeOrderCount = activeOrders.length;
    const inDeliveryCount = await Order.countDocuments({
      status: OrderStatus.OUT_FOR_DELIVERY,
    });
    const totalUsers = await User.countDocuments({});

    return NextResponse.json({
      date,
      stats: {
        mealsOrdered: mealsOrderedToday,
        activeOrders: activeOrderCount,
        inDelivery: inDeliveryCount,
        totalUsers,
      },
      mealBreakdown: serializeBreakdown(mealBreakdown),
      slotOrder: MEAL_SLOT_ORDER,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
