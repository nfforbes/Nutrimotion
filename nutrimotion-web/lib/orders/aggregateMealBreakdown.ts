/**
 * Aggregate ordered meals by slot and name from cart/order items.
 */

import { OrderStatus } from '@/types/commerce';
import { MealSlot } from '@/types/catalog';
import {
  MEAL_SLOT_ORDER,
  normalizeSlotKey,
  PACKAGE_DETAIL_SLOT_KEYS,
  type PackageDetailSlotKey,
} from '@/lib/meals/slots';

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PURCHASED,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
];

export type MealCountMap = Record<string, number>;

export type SlotMealBreakdown = Record<MealSlot, MealCountMap>;

export function emptySlotBreakdown(): SlotMealBreakdown {
  return {
    [MealSlot.BREAKFAST]: {},
    [MealSlot.LUNCH]: {},
    [MealSlot.SMOOTHIES]: {},
    [MealSlot.JUICE_SHOT]: {},
  };
}

function addCount(map: MealCountMap, name: string, count: number) {
  const trimmed = name.trim();
  if (!trimmed || count <= 0) return;
  map[trimmed] = (map[trimmed] ?? 0) + count;
}

function mealNamesFromList(meals: unknown): string[] {
  if (!Array.isArray(meals)) return [];
  return meals
    .map((m) =>
      typeof m === 'string'
        ? m
        : m && typeof m === 'object' && m !== null && 'name' in m
          ? String((m as { name: string }).name)
          : ''
    )
    .filter(Boolean);
}

function slotKeyToMealSlot(key: string): MealSlot | null {
  const normalized = normalizeSlotKey(key);
  if (MEAL_SLOT_ORDER.includes(normalized as MealSlot)) {
    return normalized as MealSlot;
  }
  return null;
}

function addPackageDetailsForDate(
  breakdown: SlotMealBreakdown,
  dayDetails: Record<string, unknown> | undefined,
  quantity: number,
  dateFilter?: string
) {
  if (!dayDetails) return;

  for (const [rawSlotKey, meals] of Object.entries(dayDetails)) {
  const slot = slotKeyToMealSlot(rawSlotKey);
    if (!slot) continue;

    for (const name of mealNamesFromList(meals)) {
      addCount(breakdown[slot], name, quantity);
    }
  }
}

export interface OrderItemLike {
  itemType: string;
  name: string;
  quantity: number;
  mealSlot?: string;
  scheduledDate?: string | Date;
  packageDetails?: Record<string, Record<string, unknown>>;
}

/**
 * Build per-slot meal counts from order line items.
 * When `dateFilter` is set (YYYY-MM-DD), only package selections for that day
 * and individual meals scheduled on that day are included.
 */
export function aggregateMealsFromItems(
  items: OrderItemLike[],
  dateFilter?: string
): SlotMealBreakdown {
  const breakdown = emptySlotBreakdown();

  for (const item of items) {
    const qty = item.quantity ?? 1;

    if (item.itemType === 'package' && item.packageDetails) {
      if (dateFilter) {
        addPackageDetailsForDate(breakdown, item.packageDetails[dateFilter], qty, dateFilter);
      } else {
        for (const dayDetails of Object.values(item.packageDetails)) {
          addPackageDetailsForDate(breakdown, dayDetails, qty);
        }
      }
      continue;
    }

    if (item.itemType !== 'meal') continue;

    if (dateFilter && item.scheduledDate) {
      const d = new Date(item.scheduledDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (key !== dateFilter) continue;
    } else if (dateFilter && !item.scheduledDate) {
      continue;
    }

    const slot = item.mealSlot ? slotKeyToMealSlot(item.mealSlot) : null;
    if (slot) {
      addCount(breakdown[slot], item.name, qty);
    }
  }

  return breakdown;
}

export function totalMealsInBreakdown(breakdown: SlotMealBreakdown): number {
  return MEAL_SLOT_ORDER.reduce((sum, slot) => {
    const slotTotal = Object.values(breakdown[slot]).reduce((a, b) => a + b, 0);
    return sum + slotTotal;
  }, 0);
}

export function packageDetailKeys(): readonly PackageDetailSlotKey[] {
  return PACKAGE_DETAIL_SLOT_KEYS;
}
