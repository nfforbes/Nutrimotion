import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { MealPackage } from '@/lib/db/models';
import { MealSlot } from '@/types/catalog';
import { MENU_PRICES, weekStartSundayUtc } from '@/lib/meals/weeklyMenus';

const SLOTS = new Set(Object.values(MealSlot));

function addUtcDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const meals = await MealPackage.find({}).sort({ scheduledDate: 1, name: 1 }).lean();
    const groups = new Map<
      string,
      {
        label: string;
        weekStart: string;
        meals: Map<string, { name: string; slot: string; price: number; description: string }>;
      }
    >();

    for (const meal of meals) {
      const scheduled = new Date(meal.scheduledDate);
      const start = weekStartSundayUtc(scheduled);
      const weekStart = start.toISOString().slice(0, 10);
      const label = meal.menuLabel?.trim() || `Week of ${weekStart}`;
      const groupKey = `${label}|${weekStart}`;
      let group = groups.get(groupKey);
      if (!group) {
        group = { label, weekStart, meals: new Map() };
        groups.set(groupKey, group);
      }
      const itemKey = `${meal.slot}|${meal.name}`;
      if (!group.meals.has(itemKey)) {
        group.meals.set(itemKey, {
          name: meal.name,
          slot: meal.slot,
          price: meal.price,
          description: meal.description,
        });
      }
    }

    return NextResponse.json({
      menus: [...groups.values()]
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart) || a.label.localeCompare(b.label))
        .map((group) => ({
          label: group.label,
          weekStart: group.weekStart,
          meals: [...group.meals.values()].sort((a, b) => a.slot.localeCompare(b.slot) || a.name.localeCompare(b.name)),
        })),
    });
  } catch (error) {
    console.error('Meal library list error:', error);
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const slot = typeof body.slot === 'string' ? body.slot.trim() : '';
    const menuLabel = typeof body.menuLabel === 'string' ? body.menuLabel.trim() : '';
    const weekStartRaw = typeof body.weekStart === 'string' ? body.weekStart.trim() : '';
    const description =
      typeof body.description === 'string' && body.description.trim()
        ? body.description.trim()
        : name;
    const priceNum =
      body.price === undefined || body.price === null || body.price === ''
        ? MENU_PRICES[slot] ?? 0
        : Number(body.price);

    if (!name || !menuLabel || !weekStartRaw || !SLOTS.has(slot as MealSlot)) {
      return NextResponse.json(
        { error: 'Name, menu, week start, and slot are required' },
        { status: 400 }
      );
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json({ error: 'Price must be zero or more' }, { status: 400 });
    }

    const weekStart = weekStartSundayUtc(new Date(`${weekStartRaw}T00:00:00.000Z`));
    const docs = [];
    for (let day = 0; day < 7; day++) {
      const scheduledDate = addUtcDays(weekStart, day);
      scheduledDate.setUTCHours(12, 0, 0, 0);
      docs.push({
        name,
        description,
        slot,
        price: priceNum,
        menuLabel,
        scheduledDate,
        available: true,
      });
    }
    await MealPackage.insertMany(docs);
    return NextResponse.json({ ok: true, created: docs.length }, { status: 201 });
  } catch (error) {
    console.error('Meal library create error:', error);
    return NextResponse.json({ error: 'Failed to add meal' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const slot = typeof body.slot === 'string' ? body.slot.trim() : '';
    const menuLabel = typeof body.menuLabel === 'string' ? body.menuLabel.trim() : '';
    const weekStartRaw = typeof body.weekStart === 'string' ? body.weekStart.trim() : '';

    if (!name || !slot) {
      return NextResponse.json({ error: 'Name and slot are required' }, { status: 400 });
    }

    const filter: Record<string, unknown> = { name, slot };
    if (menuLabel && !menuLabel.startsWith('Week of ')) {
      filter.menuLabel = menuLabel;
    } else if (weekStartRaw) {
      const start = weekStartSundayUtc(new Date(`${weekStartRaw}T00:00:00.000Z`));
      const end = addUtcDays(start, 7);
      filter.scheduledDate = { $gte: start, $lt: end };
    }

    const result = await MealPackage.deleteMany(filter);
    return NextResponse.json({ ok: true, deleted: result.deletedCount });
  } catch (error) {
    console.error('Meal library delete error:', error);
    return NextResponse.json({ error: 'Failed to remove meal' }, { status: 500 });
  }
}
