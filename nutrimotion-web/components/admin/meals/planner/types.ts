import type { CatalogMeal, PlacedMeal, WeekPlan } from '@/lib/meals/weekPlan';
import type { MealSlot } from '@/types/catalog';

export type { CatalogMeal, PlacedMeal, WeekPlan };

export type DragData =
  | { kind: 'catalog'; meal: CatalogMeal }
  | { kind: 'placed'; meal: PlacedMeal; weekStart: string; slot: MealSlot };

export interface DropData {
  weekStart: string;
  slot: MealSlot;
}

export type PlacedFlag = 'available' | 'soldIndividually';

/** What a slot's chips can ask the page to do. */
export interface PlacedMealActions {
  onToggle: (weekStart: string, slot: MealSlot, meal: PlacedMeal, flag: PlacedFlag) => void;
  onFill: (weekStart: string, slot: MealSlot, meal: PlacedMeal) => void;
  onRemove: (weekStart: string, slot: MealSlot, meal: PlacedMeal) => void;
}

export function zoneId(weekStart: string, slot: MealSlot): string {
  return `zone:${weekStart}:${slot}`;
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}
