/**
 * Shared meal slot configuration (breakfast, lunch, smoothies, juice shots).
 */

import { MealSlot } from '@/types/catalog';

export const MEAL_SLOT_ORDER: MealSlot[] = [
  MealSlot.BREAKFAST,
  MealSlot.LUNCH,
  MealSlot.SMOOTHIES,
  MealSlot.JUICE_SHOT,
];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  [MealSlot.BREAKFAST]: 'Breakfast',
  [MealSlot.LUNCH]: 'Lunch',
  [MealSlot.SMOOTHIES]: 'Smoothies',
  [MealSlot.JUICE_SHOT]: 'Juice Shots',
};

/** Keys used in packageDetails JSON stored on cart/order items. */
export const PACKAGE_DETAIL_SLOT_KEYS = [
  'breakfast',
  'lunch',
  'smoothies',
  'juice_shot',
] as const;

export type PackageDetailSlotKey = (typeof PACKAGE_DETAIL_SLOT_KEYS)[number];

/** Map legacy `dinner` slot to smoothies for older orders and meals. */
export function normalizeSlotKey(slot: string): MealSlot | string {
  if (slot === 'dinner') return MealSlot.SMOOTHIES;
  if (Object.values(MealSlot).includes(slot as MealSlot)) return slot as MealSlot;
  return slot;
}

export function slotLabel(slot: string): string {
  const normalized = normalizeSlotKey(slot);
  if (normalized in MEAL_SLOT_LABELS) {
    return MEAL_SLOT_LABELS[normalized as MealSlot];
  }
  return String(slot)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isMealSlot(slot: string): slot is MealSlot {
  return Object.values(MealSlot).includes(slot as MealSlot);
}
