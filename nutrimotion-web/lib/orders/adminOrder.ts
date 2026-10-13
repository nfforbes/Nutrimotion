/**
 * Orders an admin adds for a client, for any week that is not over.
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/db/connection';
import { MealPackage, Order, Package, User } from '@/lib/db/models';
import { OrderStatus } from '@/types/commerce';
import { UserRole } from '@/types/auth';
import {
  addDays,
  adminOrderWeeks,
  clientOrderingWeek,
  dayKeyOfDate,
  isInWeek,
  isWeekOver,
  isWeekStart,
  orderWeek,
  OrderWeek,
} from '@/lib/orders/orderWeek';

const PACKAGE_SLOTS = ['breakfast', 'lunch', 'dinner', 'smoothies', 'juice_shot'] as const;
type PackageSlot = (typeof PACKAGE_SLOTS)[number];
const WEEKS_AHEAD = 8;

export class AdminOrderError extends Error {}

export interface AdminOrderWeek extends OrderWeek {
  /** Client ordering for this week has closed (or not opened yet for later weeks this is false). */
  clientCutoffPassed: boolean;
}

export async function getAdminOrderOptions() {
  await connectDB();
  const clientWeek = clientOrderingWeek();
  const weeks: AdminOrderWeek[] = adminOrderWeeks(WEEKS_AHEAD).map((w) => ({
    ...w,
    clientCutoffPassed: w.weekStart < clientWeek.weekStart,
  }));
  const from = new Date(`${weeks[0].weekStart}T00:00:00Z`);
  const to = new Date(`${addDays(weeks[weeks.length - 1].weekEnd, 1)}T00:00:00Z`);

  const [clients, packages, meals] = await Promise.all([
    User.find({ roles: UserRole.CLIENT }).select('name email phone address').sort({ name: 1 }).lean(),
    Package.find({ active: { $ne: false } }).sort({ cost: 1, name: 1 }).lean(),
    MealPackage.find({ available: { $ne: false }, scheduledDate: { $gte: from, $lt: to } })
      .select('name slot price scheduledDate imageUrl soldIndividually description')
      .sort({ scheduledDate: 1, slot: 1, name: 1 })
      .lean(),
  ]);

  return {
    clientWeek,
    weeks,
    clients: clients.map((c) => ({
      _id: String(c._id),
      name: c.name ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      address: c.address ?? null,
    })),
    packages: packages.map((p) => ({ ...p, _id: String(p._id) })),
    meals: meals.map((m) => ({ ...m, _id: String(m._id), id: String(m._id) })),
  };
}

export interface AdminOrderInput {
  userId?: string;
  weekStart?: string;
  items?: {
    itemType?: string;
    itemId?: string;
    quantity?: number;
    packageDetails?: Record<string, Record<string, unknown>>;
  }[];
  deliveryAddress?: { street?: string; parish?: string };
  deliveryInstructions?: string;
  note?: string;
}

function slotLimits(pkg: {
  breakfastCount?: number;
  lunchCount?: number;
  smoothieCount?: number;
  juiceShotCount?: number;
  dinnerCount?: number;
}): Record<PackageSlot, number> {
  return {
    breakfast: pkg.breakfastCount ?? 0,
    lunch: pkg.lunchCount ?? 0,
    smoothies: pkg.smoothieCount ?? pkg.dinnerCount ?? 0,
    juice_shot: pkg.juiceShotCount ?? 0,
    dinner: pkg.smoothieCount == null ? 0 : (pkg.dinnerCount ?? 0),
  };
}

function cleanPackageDetails(
  details: unknown,
  weekStart: string,
  limits: Record<PackageSlot, number>,
  packageName: string
) {
  if (!details || typeof details !== 'object') {
    throw new AdminOrderError(`Choose the meals for ${packageName}.`);
  }
  const cleaned: Record<string, Partial<Record<PackageSlot, string[]>>> = {};
  const used: Record<PackageSlot, number> = { breakfast: 0, lunch: 0, dinner: 0, smoothies: 0, juice_shot: 0 };
  for (const [day, slots] of Object.entries(details as Record<string, unknown>)) {
    if (!isInWeek(day, weekStart)) {
      throw new AdminOrderError(`${packageName} has meals outside the chosen week.`);
    }
    if (!slots || typeof slots !== 'object') continue;
    const dayOut: Partial<Record<PackageSlot, string[]>> = {};
    for (const slot of PACKAGE_SLOTS) {
      const names = (slots as Record<string, unknown>)[slot];
      if (!Array.isArray(names)) continue;
      const list = names.map((n) => String(n ?? '').trim()).filter(Boolean);
      if (list.length === 0) continue;
      dayOut[slot] = list;
      used[slot] += list.length;
    }
    if (Object.keys(dayOut).length > 0) cleaned[day] = dayOut;
  }
  const over = PACKAGE_SLOTS.find((s) => used[s] > limits[s]);
  if (over) {
    throw new AdminOrderError(`${packageName} allows ${limits[over]} ${over.replace('_', ' ')}, but ${used[over]} were chosen.`);
  }
  if (Object.keys(cleaned).length === 0) {
    throw new AdminOrderError(`Choose the meals for ${packageName}.`);
  }
  return cleaned;
}

export async function createAdminOrder(input: AdminOrderInput, adminEmail?: string) {
  await connectDB();
  const { userId, weekStart, items, deliveryAddress, deliveryInstructions, note } = input;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) throw new AdminOrderError('Choose a client.');
  if (!isWeekStart(weekStart)) throw new AdminOrderError('Choose the week the order is for.');
  if (isWeekOver(weekStart)) throw new AdminOrderError('That week has already passed.');
  if (!Array.isArray(items) || items.length === 0) throw new AdminOrderError('Add at least one package or meal.');

  const user = await User.findById(userId).select('address').lean();
  if (!user) throw new AdminOrderError('Client not found.');

  const lines = [];
  for (const item of items) {
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    if (!item.itemId || !mongoose.Types.ObjectId.isValid(item.itemId)) {
      throw new AdminOrderError('An item in the order is invalid.');
    }
    if (item.itemType === 'package') {
      const pkg = await Package.findById(item.itemId).lean();
      if (!pkg) throw new AdminOrderError('A package in the order no longer exists.');
      lines.push({
        itemType: 'package' as const,
        itemId: pkg._id,
        name: pkg.name,
        price: pkg.cost ?? 0,
        quantity,
        packageDetails: cleanPackageDetails(item.packageDetails, weekStart, slotLimits(pkg), pkg.name),
      });
    } else if (item.itemType === 'meal') {
      const meal = await MealPackage.findById(item.itemId).lean();
      if (!meal) throw new AdminOrderError('A meal in the order no longer exists.');
      const day = dayKeyOfDate(meal.scheduledDate);
      if (!day || !isInWeek(day, weekStart)) {
        throw new AdminOrderError(`${meal.name} is not on the menu for the chosen week.`);
      }
      lines.push({
        itemType: 'meal' as const,
        itemId: meal._id,
        name: meal.name,
        price: meal.price ?? 0,
        quantity,
        imageUrl: meal.imageUrl,
        mealSlot: meal.slot,
        scheduledDate: meal.scheduledDate,
      });
    } else {
      throw new AdminOrderError('Orders can only contain packages and meals.');
    }
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const street = deliveryAddress?.street?.trim();
  const parish = deliveryAddress?.parish?.trim();
  const count = await Order.countDocuments();
  const week = orderWeek(weekStart);

  const order = await Order.create({
    userId: user._id,
    orderNumber: `ORD-${Date.now()}-${count + 1}`,
    items: lines,
    subtotal,
    discount: 0,
    total: subtotal,
    status: OrderStatus.PURCHASED,
    deliveryAddress: street || parish ? { street: street ?? '', parish: parish ?? '' } : user.address,
    deliveryInstructions: deliveryInstructions?.trim() || undefined,
    weekStart,
    placedBy: adminEmail,
    statusHistory: [
      {
        status: OrderStatus.PURCHASED,
        timestamp: new Date(),
        note: note?.trim() || `Order added by an admin for the week of ${week.label}`,
        updatedBy: adminEmail,
      },
    ],
  });

  return order;
}
