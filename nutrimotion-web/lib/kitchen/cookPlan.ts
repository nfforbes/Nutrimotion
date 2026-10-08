/**
 * Cook days and the cooking list for each upcoming cook day.
 * A cook day covers meals eaten from that day up to the day before the next cook day.
 * Dates are YYYY-MM-DD in Jamaica time, matching the day keys stored on orders.
 */

import connectDB from '@/lib/db/connection';
import { AppSetting, Order } from '@/lib/db/models';
import { OrderStatus } from '@/types/commerce';
import { slotLabel } from '@/lib/meals/slots';

const CONFIG_ID = 'app';
const TIME_ZONE = 'America/Jamaica';
const SLOT_ORDER = ['breakfast', 'lunch', 'dinner', 'smoothies', 'juice_shot'];
const SLOT_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  smoothies: 'Smoothies',
  juice_shot: 'Juice Shots',
};
/** Package orders are placed at most a few weeks before their meal days. */
const ORDER_LOOKBACK_DAYS = 60;

export interface CookSlot {
  slot: string;
  label: string;
  total: number;
  items: { name: string; count: number }[];
}

export interface CookPlan {
  cookDate: string;
  coversFrom: string;
  coversTo: string;
  totalMeals: number;
  orderCount: number;
  slots: CookSlot[];
  days: { date: string; total: number }[];
}

export interface CookingResponse {
  today: string;
  cookDays: number[];
  plans: CookPlan[];
}

export function normalizeCookDays(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const days = value.map(Number);
  if (days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return null;
  return [...new Set(days)].sort((a, b) => a - b);
}

export async function getCookDays(): Promise<number[]> {
  await connectDB();
  const doc = await AppSetting.findById(CONFIG_ID).select('cookDays').lean();
  return normalizeCookDays(doc?.cookDays) ?? [];
}

export async function setCookDays(days: number[]): Promise<void> {
  await connectDB();
  await AppSetting.updateOne({ _id: CONFIG_ID }, { $set: { cookDays: days } }, { upsert: true });
}

function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekday(key: string): number {
  return new Date(`${key}T00:00:00Z`).getUTCDay();
}

function upcomingCookDates(from: string, cookDays: number[], count: number): string[] {
  const dates: string[] = [];
  for (let i = 0; dates.length < count && i < 7 * (count + 1); i++) {
    const key = addDays(from, i);
    if (cookDays.includes(weekday(key))) dates.push(key);
  }
  return dates;
}

function nextCookDate(after: string, cookDays: number[]): string {
  for (let i = 1; i <= 7; i++) {
    const key = addDays(after, i);
    if (cookDays.includes(weekday(key))) return key;
  }
  return addDays(after, 7);
}

function mealNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((m) => (typeof m === 'string' ? m : m && typeof m === 'object' && 'name' in m ? String(m.name) : ''))
    .map((n) => n.trim())
    .filter(Boolean);
}

function dayKeyOf(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(value as string | Date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

type Counts = Map<string, Map<string, number>>;

function add(counts: Counts, slot: string, name: string, qty: number) {
  const bySlot = counts.get(slot) ?? new Map<string, number>();
  bySlot.set(name, (bySlot.get(name) ?? 0) + qty);
  counts.set(slot, bySlot);
}

function toSlots(counts: Counts): CookSlot[] {
  const known = SLOT_ORDER.filter((s) => counts.has(s));
  const other = [...counts.keys()].filter((s) => !SLOT_ORDER.includes(s)).sort();
  return [...known, ...other].map((slot) => {
    const items = [...counts.get(slot)!.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return {
      slot,
      label: SLOT_LABELS[slot] ?? slotLabel(slot),
      total: items.reduce((sum, i) => sum + i.count, 0),
      items,
    };
  });
}

interface OrderLike {
  items?: {
    itemType: string;
    name: string;
    quantity?: number;
    mealSlot?: string;
    scheduledDate?: Date | string;
    packageDetails?: Record<string, Record<string, unknown>>;
  }[];
}

export function buildCookPlan(orders: OrderLike[], cookDate: string, coversTo: string): CookPlan {
  const inRange = (key: string | null): key is string => !!key && key >= cookDate && key <= coversTo;
  const counts: Counts = new Map();
  const perDay = new Map<string, number>();
  let orderCount = 0;

  const count = (day: string, slot: string, name: string, qty: number) => {
    add(counts, slot, name, qty);
    perDay.set(day, (perDay.get(day) ?? 0) + qty);
  };

  for (const order of orders) {
    let contributed = false;
    for (const item of order.items ?? []) {
      const qty = item.quantity ?? 1;
      if (item.itemType === 'package' && item.packageDetails && typeof item.packageDetails === 'object') {
        for (const [day, slots] of Object.entries(item.packageDetails)) {
          if (!inRange(day) || !slots || typeof slots !== 'object') continue;
          for (const [slot, names] of Object.entries(slots)) {
            for (const name of mealNames(names)) {
              count(day, slot, name, qty);
              contributed = true;
            }
          }
        }
      } else if (item.itemType === 'meal' && item.mealSlot) {
        const day = dayKeyOf(item.scheduledDate);
        if (!inRange(day)) continue;
        count(day, item.mealSlot, item.name.trim(), qty);
        contributed = true;
      }
    }
    if (contributed) orderCount++;
  }

  const days: { date: string; total: number }[] = [];
  for (let day = cookDate; day <= coversTo; day = addDays(day, 1)) {
    days.push({ date: day, total: perDay.get(day) ?? 0 });
  }
  const slots = toSlots(counts);

  return {
    cookDate,
    coversFrom: cookDate,
    coversTo,
    totalMeals: slots.reduce((sum, s) => sum + s.total, 0),
    orderCount,
    slots,
    days,
  };
}

export async function getCookingPlans(count = 2): Promise<CookingResponse> {
  const cookDays = await getCookDays();
  const today = todayKey();
  if (cookDays.length === 0) return { today, cookDays, plans: [] };

  const since = new Date(`${addDays(today, -ORDER_LOOKBACK_DAYS)}T00:00:00Z`);
  const orders = await Order.find({
    status: { $nin: [OrderStatus.PENDING, OrderStatus.CANCELLED] },
    createdAt: { $gte: since },
  })
    .select('items')
    .lean<OrderLike[]>();

  const plans = upcomingCookDates(today, cookDays, count).map((cookDate) =>
    buildCookPlan(orders, cookDate, addDays(nextCookDate(cookDate, cookDays), -1))
  );
  return { today, cookDays, plans };
}
