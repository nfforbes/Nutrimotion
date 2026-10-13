/**
 * Calendar day key YYYY-MM-DD in the user's local timezone.
 * Using toISOString().slice(0, 10) is UTC and can shift the date vs local week tabs,
 * which broke per-day package meal quotas (selections merged or mis-keyed).
 */
export function getLocalCalendarDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local-noon Date for a YYYY-MM-DD key, so local date helpers return that same day. */
export function dayKeyToLocalDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
