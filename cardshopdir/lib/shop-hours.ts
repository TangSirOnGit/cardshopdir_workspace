/**
 * Shop opening-hours helpers.
 *
 * `shopHours` rows store a `days` jsonb array of full weekday names
 * (e.g. ["Monday","Tuesday"]) plus `opens`/`closes` as "HH:MM" 24h strings.
 * These helpers resolve the row matching "today" and compute open/closed
 * status against the current server time (pages are force-dynamic).
 */

export interface ShopHoursRow {
  days: string[] | unknown;
  opens: string | null;
  closes: string | null;
}

export interface TodayHours {
  opens: string | null;
  closes: string | null;
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Current weekday name in server local time, e.g. "Monday". */
function currentWeekday(d = new Date()): string {
  return WEEKDAYS[d.getDay()];
}

/** "HH:MM" -> minutes since midnight, or null if empty/invalid. */
function toMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Current time in minutes since midnight (server local). */
function nowMinutes(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Find the hours row matching today's weekday. */
export function getTodayHours<T extends ShopHoursRow>(
  rows: T[],
  d = new Date()
): TodayHours | null {
  const today = currentWeekday(d);
  const match = rows.find((r) => Array.isArray(r.days) && r.days.includes(today));
  if (!match) return null;
  return { opens: match.opens, closes: match.closes };
}

/** Whether the shop is currently open, based on today's hours row. */
export function isOpenNow<T extends ShopHoursRow>(
  rows: T[],
  d = new Date()
): boolean {
  const today = getTodayHours(rows, d);
  if (!today || !today.opens || !today.closes) return false;
  const open = toMinutes(today.opens);
  const close = toMinutes(today.closes);
  if (open === null || close === null) return false;
  const now = nowMinutes(d);
  return now >= open && now < close;
}

/** "18:00" -> "6PM"; "09:00" -> "9AM". */
function formatClock(t: string): string {
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h)) return t;
  const ampm = h < 12 ? "AM" : "PM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, "0")}${ampm}`;
}

/** "11:00"-"18:00" -> "11AM–6PM"; null/null -> "Closed". */
export function formatHoursRange(today: TodayHours | null): string {
  if (!today || !today.opens || !today.closes) return "Closed today";
  return `${formatClock(today.opens)}–${formatClock(today.closes)}`;
}

/** One-line summary: "11AM–6PM · Open" / "Closed today · Closed". */
export function formatTodaySummary<T extends ShopHoursRow>(
  rows: T[],
  d = new Date()
): { hours: string; status: "Open" | "Closed"; open: boolean } {
  const today = getTodayHours(rows, d);
  const open = isOpenNow(rows, d);
  return {
    hours: formatHoursRange(today),
    status: open ? "Open" : "Closed",
    open,
  };
}
