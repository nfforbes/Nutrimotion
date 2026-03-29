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
