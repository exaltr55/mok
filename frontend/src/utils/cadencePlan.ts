/**
 * Per-device storage for the user's planned alignment cadence —
 * the daily check-in, weekly review, monthly review, and seasonal
 * recalibration introduced in I M Aligning Part B.
 *
 * Plans are stored per-user (namespaced by getCurrentUserId) so two
 * accounts on the same browser don't share schedules. All fields are
 * optional — a fresh user has no plan until they set one up.
 */

import { getCurrentUserId } from '../api/client';

const KEY_BASE = 'mok.cadencePlan.v1';

function storageKey(): string {
  const uid = getCurrentUserId();
  return uid ? `${KEY_BASE}.${uid}` : `${KEY_BASE}.anon`;
}

export interface CadencePlan {
  /** "HH:MM" 24-hour clock time the user wants their daily 2–3 minute
   *  check-in. Null when not configured. */
  dailyTime: string | null;
  /** Day of week (0=Sunday, 6=Saturday) for the weekly 10–15 min review. */
  weeklyDay: number | null;
  /** Day of month (1–28) the user wants the monthly 30–45 min review.
   *  Capped at 28 so it always exists in every month. */
  monthlyDay: number | null;
  /** Months (0=Jan, 11=Dec) when the seasonal 1–2 hour recalibration happens.
   *  Typically four entries — one per quarter. */
  seasonalMonths: number[];
}

const DEFAULT_PLAN: CadencePlan = {
  dailyTime: null,
  weeklyDay: null,
  monthlyDay: null,
  seasonalMonths: [],
};

export function getCadencePlan(): CadencePlan {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { ...DEFAULT_PLAN };
    const parsed = JSON.parse(raw);
    return {
      dailyTime: typeof parsed.dailyTime === 'string' ? parsed.dailyTime : null,
      weeklyDay: typeof parsed.weeklyDay === 'number' ? parsed.weeklyDay : null,
      monthlyDay:
        typeof parsed.monthlyDay === 'number' && parsed.monthlyDay >= 1 && parsed.monthlyDay <= 28
          ? parsed.monthlyDay
          : null,
      seasonalMonths: Array.isArray(parsed.seasonalMonths)
        ? parsed.seasonalMonths.filter((n: unknown): n is number => typeof n === 'number' && n >= 0 && n <= 11)
        : [],
    };
  } catch {
    return { ...DEFAULT_PLAN };
  }
}

export function setCadencePlan(plan: CadencePlan): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(plan));
  } catch {
    // silent no-op
  }
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
