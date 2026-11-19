// ============================================
// System Clock / Date Navigator
// --------------------------------------------
// Lets the panel/demo move the system date forward or backward so that
// franchise expiration, renewal eligibility, and SMS expiry reminders
// can be shown without changing the computer's clock.
// The offset is stored per browser in localStorage.
// ============================================

const OFFSET_KEY = 'bfs_system_date_offset_ms';
export const CLOCK_CHANGED_EVENT = 'bfs-clock-changed';

function readOffset(): number {
  try {
    const raw = localStorage.getItem(OFFSET_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

/** Current system time in ms (real time + navigator offset). */
export function nowMs(): number {
  return Date.now() + readOffset();
}

/** Current system Date (real time + navigator offset). */
export function now(): Date {
  return new Date(nowMs());
}

/** Current system time as ISO string. */
export function nowISO(): string {
  return now().toISOString();
}

/** Current system date as YYYY-MM-DD (local time). */
export function todayStr(): string {
  return toDateInput(now());
}

/** Formats a Date as YYYY-MM-DD in local time (for <input type="date">). */
export function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Adds days to the current system date and returns YYYY-MM-DD. */
export function daysFromToday(days: number): string {
  return toDateInput(new Date(nowMs() + days * 24 * 60 * 60 * 1000));
}

/** True when the date navigator is moved away from the real date. */
export function isSimulated(): boolean {
  return Math.abs(readOffset()) >= 60 * 1000;
}

/**
 * Moves the system date to the given YYYY-MM-DD (keeps the real time of day).
 * Pass null to go back to the real date.
 */
export function setSystemDate(dateStr: string | null): void {
  try {
    if (!dateStr) {
      localStorage.removeItem(OFFSET_KEY);
    } else {
      const real = new Date();
      const [y, m, d] = dateStr.split('-').map(Number);
      const target = new Date(real);
      target.setFullYear(y, m - 1, d);
      localStorage.setItem(OFFSET_KEY, String(target.getTime() - real.getTime()));
    }
  } catch {
    // localStorage unavailable — ignore
  }
  window.dispatchEvent(new Event(CLOCK_CHANGED_EVENT));
}

/** Whole days from the current system date until the given date (negative = past). */
export function daysUntil(dateValue: string | Date): number {
  const target = new Date(dateValue);
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now());
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTarget = new Date(target);
  startOfTarget.setHours(0, 0, 0, 0);
  return Math.round((startOfTarget.getTime() - startOfToday.getTime()) / dayMs);
}
