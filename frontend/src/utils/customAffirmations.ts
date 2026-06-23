/**
 * Per-device storage for the user's personal affirmations in I M Talking.
 *
 * The practice ships with seven core "I am…" affirmations. On top of those
 * a practitioner can add up to two of their own — words that already
 * carry meaning for them. They cycle right after the seven core lines
 * and before the closing "I am." beat.
 */

const KEY = 'mok.customAffirmations.v1';
export const MAX_CUSTOM_AFFIRMATIONS = 2;

export function getCustomAffirmations(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .slice(0, MAX_CUSTOM_AFFIRMATIONS);
  } catch {
    return [];
  }
}

export function setCustomAffirmations(values: string[]): void {
  const cleaned = values
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, MAX_CUSTOM_AFFIRMATIONS);
  try {
    localStorage.setItem(KEY, JSON.stringify(cleaned));
  } catch {
    // localStorage disabled / full — silent no-op
  }
}
