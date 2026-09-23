/**
 * Admin analytics aggregations from Mongo orders, users, and deliveries.
 */

import { OrderStatus } from '@/types/commerce';

export const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PURCHASED,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

export type DayPoint = { date: string; value: number };

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function buildDateRange(days: number, end: Date = new Date()): string[] {
  const endDay = startOfDay(end);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(toDateKey(addDays(endDay, -i)));
  }
  return keys;
}

export function fillSeries(
  keys: string[],
  map: Map<string, number>
): DayPoint[] {
  return keys.map((date) => ({ date, value: map.get(date) ?? 0 }));
}

/** Simple moving-average forecast for the next `horizon` days. */
export function forecastFromSeries(
  series: DayPoint[],
  horizon: number,
  window = 7
): DayPoint[] {
  if (series.length === 0 || horizon <= 0) return [];
  const values = series.map((p) => p.value);
  const w = Math.min(window, values.length);
  const avg =
    values.slice(-w).reduce((sum, v) => sum + v, 0) / Math.max(w, 1);
  const last = series[series.length - 1];
  const lastDate = new Date(`${last.date}T12:00:00`);
  const out: DayPoint[] = [];
  for (let i = 1; i <= horizon; i++) {
    out.push({
      date: toDateKey(addDays(lastDate, i)),
      value: Math.round(avg * 100) / 100,
    });
  }
  return out;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function formatMoney(n: number): string {
  return `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
