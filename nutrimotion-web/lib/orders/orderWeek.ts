/**
 * Order weeks run Monday to Sunday in Jamaica time, matching the meal calendar.
 * Clients order for the following week; orders for it close the Friday before at midnight,
 * after which (Saturday and Sunday) clients order for the week after.
 * Dates are YYYY-MM-DD day keys, matching meal scheduledDate (UTC midnight) and package day keys.
 */

export const ORDER_TIME_ZONE = 'America/Jamaica';
/** Jamaica does not observe daylight saving, so midnight there is always 05:00 UTC. */
const JAMAICA_MIDNIGHT_UTC_HOUR = 5;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface OrderWeek {
  weekStart: string;
  weekEnd: string;
  days: string[];
  /** When client ordering for this week closes (Saturday 00:00 Jamaica time). */
  cutoff: string;
  /** The Friday client ordering closes at midnight, e.g. "Fri Oct 16". */
  closesOn: string;
  label: string;
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function isDayKey(value: unknown): value is string {
  return typeof value === 'string' && DAY_KEY.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function addDays(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(key: string): number {
  return new Date(`${key}T00:00:00Z`).getUTCDay();
}

export function jamaicaTodayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ORDER_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Monday of the week containing the day. */
export function weekStartOf(key: string): string {
  return addDays(key, -((weekdayOf(key) + 6) % 7));
}

export function isWeekStart(value: unknown): value is string {
  return isDayKey(value) && weekdayOf(value) === 1;
}

export function formatDayKey(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function orderWeek(weekStart: string): OrderWeek {
  const weekEnd = addDays(weekStart, 6);
  const cutoff = new Date(`${addDays(weekStart, -2)}T00:00:00Z`);
  cutoff.setUTCHours(JAMAICA_MIDNIGHT_UTC_HOUR);
  const short = (key: string) => formatDayKey(key).slice(4);
  return {
    weekStart,
    weekEnd,
    days: Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    cutoff: cutoff.toISOString(),
    closesOn: formatDayKey(addDays(weekStart, -3)),
    label: `${short(weekStart)} – ${short(weekEnd)}`,
  };
}

/** The week clients can order for right now. */
export function clientOrderingWeek(now: Date = new Date()): OrderWeek {
  const today = jamaicaTodayKey(now);
  const weekday = weekdayOf(today);
  const pastCutoff = weekday === 6 || weekday === 0;
  return orderWeek(addDays(weekStartOf(today), pastCutoff ? 14 : 7));
}

/** Weeks an admin can add orders for: the current week (until it ends) and the next `ahead` weeks. */
export function adminOrderWeeks(ahead = 8, now: Date = new Date()): OrderWeek[] {
  const current = weekStartOf(jamaicaTodayKey(now));
  return Array.from({ length: ahead + 1 }, (_, i) => orderWeek(addDays(current, i * 7)));
}

export function isWeekOver(weekStart: string, now: Date = new Date()): boolean {
  return addDays(weekStart, 6) < jamaicaTodayKey(now);
}

export function isInWeek(day: string, weekStart: string): boolean {
  return day >= weekStart && day <= addDays(weekStart, 6);
}

/** Day key of a meal or order line's scheduledDate. */
export function dayKeyOfDate(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(value as string | Date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** The meal days a cart or order line covers. */
export function itemDayKeys(item: { itemType: string; scheduledDate?: unknown; packageDetails?: unknown }): string[] {
  if (item.itemType === 'package' && item.packageDetails && typeof item.packageDetails === 'object') {
    return Object.keys(item.packageDetails as Record<string, unknown>);
  }
  if (item.itemType === 'meal') {
    const key = dayKeyOfDate(item.scheduledDate);
    return key ? [key] : [];
  }
  return [];
}

/** Error message when a client's line falls outside the week they can order for, else null. */
export function clientWeekError(
  item: { itemType: string; name: string; scheduledDate?: unknown; packageDetails?: unknown },
  now: Date = new Date()
): string | null {
  if (item.itemType !== 'meal' && item.itemType !== 'package') return null;
  const week = clientOrderingWeek(now);
  const days = itemDayKeys(item);
  if (days.length === 0) return `${item.name} has no meal days. Remove it and choose it again.`;
  if (days.every((d) => isInWeek(d, week.weekStart))) return null;
  const closes = `${week.closesOn} at midnight`;
  if (days.some((d) => d < week.weekStart)) {
    return `Ordering for ${item.name} has closed. Orders are now for ${week.label} and close ${closes}.`;
  }
  return `${item.name} is for a later week. Orders are currently for ${week.label} until ${closes}.`;
}
