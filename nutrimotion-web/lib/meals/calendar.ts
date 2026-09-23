/**
 * UTC calendar helpers for meal scheduling.
 * Meals store scheduledDate as UTC midnight for the chosen calendar day.
 */

import { MEAL_SLOT_ORDER, normalizeSlotKey } from '@/lib/meals/slots';
import { MealSlot } from '@/types/catalog';

export type CalendarView = 'day' | 'week' | 'month';

export interface MealCalendarDoc {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  slot: string;
  scheduledDate: string;
  available?: boolean;
  instagramLink?: string;
}

export interface VisibleRange {
  startDate: string;
  endDate: string;
}

/** Calendar day key YYYY-MM-DD using UTC date parts. */
export function getUtcCalendarKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today as a UTC calendar key (based on current UTC date). */
export function getTodayUtcKey(): string {
  return getUtcCalendarKey(new Date());
}

/** Parse YYYY-MM-DD into a Date at UTC noon (stable for formatting). */
export function parseUtcDayKey(dayKey: string): Date {
  const [y, mo, d] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
}

/** Sunday 00:00 UTC of the week containing the given instant. */
export function getWeekStartUtc(d: Date): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const dow = d.getUTCDay();
  return new Date(Date.UTC(y, m, day - dow, 0, 0, 0, 0));
}

export function addUtcDays(dayKey: string, deltaDays: number): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return getUtcCalendarKey(new Date(Date.UTC(y, m - 1, d + deltaDays)));
}

export function utcDaysBetween(fromKey: string, toKey: string): number {
  const [y1, m1, d1] = fromKey.split('-').map(Number);
  const [y2, m2, d2] = toKey.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

/** Seven day keys for the Sunday-start week containing dayKey. */
export function getWeekDayKeys(dayKey: string): string[] {
  const weekStart = getWeekStartUtc(parseUtcDayKey(dayKey));
  const sundayKey = getUtcCalendarKey(weekStart);
  return Array.from({ length: 7 }, (_, i) => addUtcDays(sundayKey, i));
}

/** Day keys for the month grid (Sunday-start weeks covering the month). */
export function getMonthGridDayKeys(dayKey: string): string[] {
  const [y, mo] = dayKey.split('-').map(Number);
  const firstOfMonth = new Date(Date.UTC(y, mo - 1, 1, 12, 0, 0));
  const gridStart = getWeekStartUtc(firstOfMonth);
  const startKey = getUtcCalendarKey(gridStart);
  return Array.from({ length: 42 }, (_, i) => addUtcDays(startKey, i));
}

export function getVisibleRange(anchorDayKey: string, view: CalendarView): VisibleRange {
  if (view === 'day') {
    return {
      startDate: `${anchorDayKey}T00:00:00.000Z`,
      endDate: `${anchorDayKey}T23:59:59.999Z`,
    };
  }

  if (view === 'week') {
    const days = getWeekDayKeys(anchorDayKey);
    return {
      startDate: `${days[0]}T00:00:00.000Z`,
      endDate: `${days[6]}T23:59:59.999Z`,
    };
  }

  const days = getMonthGridDayKeys(anchorDayKey);
  return {
    startDate: `${days[0]}T00:00:00.000Z`,
    endDate: `${days[41]}T23:59:59.999Z`,
  };
}

export function shiftAnchor(anchorDayKey: string, view: CalendarView, direction: -1 | 1): string {
  if (view === 'day') return addUtcDays(anchorDayKey, direction);
  if (view === 'week') return addUtcDays(anchorDayKey, direction * 7);

  const [y, mo, d] = anchorDayKey.split('-').map(Number);
  const next = new Date(Date.UTC(y, mo - 1 + direction, d, 12, 0, 0));
  // Clamp to last day of target month if day overflows
  if (next.getUTCMonth() !== ((mo - 1 + direction + 12) % 12)) {
    const lastDay = new Date(Date.UTC(y, mo - 1 + direction + 1, 0, 12, 0, 0));
    return getUtcCalendarKey(lastDay);
  }
  return getUtcCalendarKey(next);
}

export function formatDayHeading(dayKey: string): string {
  return parseUtcDayKey(dayKey).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDayShort(dayKey: string): string {
  return parseUtcDayKey(dayKey).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatWeekLabel(sundayKey: string): string {
  return parseUtcDayKey(sundayKey).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatMonthLabel(dayKey: string): string {
  return parseUtcDayKey(dayKey).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function buildSlotMap(): Map<string, MealCalendarDoc[]> {
  const m = new Map<string, MealCalendarDoc[]>();
  MEAL_SLOT_ORDER.forEach((slot) => m.set(slot, []));
  return m;
}

/** dayKey → slot → meals */
export function groupMealsByDayAndSlot(
  meals: MealCalendarDoc[]
): Map<string, Map<string, MealCalendarDoc[]>> {
  const map = new Map<string, Map<string, MealCalendarDoc[]>>();
  for (const meal of meals) {
    const dayKey = getUtcCalendarKey(new Date(meal.scheduledDate));
    if (!map.has(dayKey)) {
      map.set(dayKey, buildSlotMap());
    }
    const slot = normalizeSlotKey(meal.slot) as MealSlot;
    const slotMap = map.get(dayKey)!;
    if (slotMap.has(slot)) {
      slotMap.get(slot)!.push(meal);
    }
  }
  map.forEach((slotMap) => {
    slotMap.forEach((arr) => arr.sort((a, b) => a.name.localeCompare(b.name)));
  });
  return map;
}

export function getMealsForCell(
  byDay: Map<string, Map<string, MealCalendarDoc[]>>,
  dayKey: string,
  slot: MealSlot
): MealCalendarDoc[] {
  return byDay.get(dayKey)?.get(slot) ?? [];
}
