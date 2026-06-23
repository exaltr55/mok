/**
 * Per-device storage for the user's preferred anchor thought in the
 * I M Thinking practice. Default is "So Hum"; users can pick any
 * short syllable / phrase, or a multi-line chant.
 *
 * The accompaniment splits the value into "beats" using `parseAnchorParts`
 * and cycles one beat at the user's chosen pace (slow or fast):
 *   - "So Hum"          → ["So", "Hum"]               (whitespace split)
 *   - "Om"              → ["Om"]                       (single repeat)
 *   - line1 \n line2    → ["line1", "line2"]           (line per beat)
 *   - "line1 + line2"   → ["line1", "line2"]           (line per beat)
 *
 * A multi-line anchor is detected by the presence of either a newline
 * or a "+" — useful for longer phrases the user wants to land as a
 * whole on each cycle.
 */

const KEY = 'mok.anchorThought.v1';
const SEEN_KEY = 'mok.anchorThoughtSeen.v1';

export const DEFAULT_ANCHOR = 'So Hum';

export function getAnchorThought(): string {
  try {
    const v = localStorage.getItem(KEY);
    return v && v.trim() ? v : DEFAULT_ANCHOR;
  } catch {
    return DEFAULT_ANCHOR;
  }
}

export function setAnchorThought(value: string): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  try {
    localStorage.setItem(KEY, trimmed);
  } catch {
    // localStorage disabled / full — silent no-op
  }
}

/** Split an anchor string into the line(s) the user wrote — used by
 *  the settings UI to preview each line and by the storage layer. A
 *  single-line anchor returns one element; a multi-line / +-separated
 *  anchor returns one element per line. */
export function parseAnchorLines(anchor: string): string[] {
  const trimmed = anchor.trim();
  if (!trimmed) return [];
  if (/[\n+]/.test(trimmed)) {
    return trimmed
      .split(/[\n+]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [trimmed];
}

/** Expand an anchor into the sequence of beats the accompaniment will
 *  cycle through, one beat per cycle. The rule depends on shape:
 *
 *    - Multi-line / "+"-separated anchor → each LINE is one beat,
 *      shown as a complete phrase on a single cycle. A brief empty
 *      beat is inserted between lines so the phrase has a moment of
 *      held silence before the next line begins.
 *    - Single-line anchor → split on whitespace, so traditional
 *      short anchors like "So Hum" continue to alternate
 *      word-by-word (So on the inhale, Hum on the exhale). */
export function parseAnchorParts(anchor: string): string[] {
  const lines = parseAnchorLines(anchor);
  if (lines.length === 0) return [];
  if (lines.length === 1) {
    return lines[0].split(/\s+/).filter(Boolean);
  }
  const beats: string[] = [];
  lines.forEach((line, lineIdx) => {
    beats.push(line);
    if (lineIdx < lines.length - 1) beats.push(''); // pause between lines
  });
  return beats;
}

// ── Pace ───────────────────────────────────────────────────────────

const PACE_KEY = 'mok.anchorPace.v1';
export type AnchorPace = 'slow' | 'fast';

/** Cycle duration in milliseconds for each pace setting.
 *  Slow gives longer phrases time to land. Fast keeps short
 *  one-syllable anchors moving at a livelier rhythm — tuned 20%
 *  quicker than the prior fast value (4000 → 3200ms) so the
 *  difference between slow and fast is more strongly felt. */
export const PACE_CYCLE_MS: Record<AnchorPace, number> = {
  slow: 6500,
  fast: 3200,
};

export function getAnchorPace(): AnchorPace {
  try {
    const v = localStorage.getItem(PACE_KEY);
    if (v === 'fast' || v === 'slow') return v;
    return 'slow';
  } catch {
    return 'slow';
  }
}

export function setAnchorPace(pace: AnchorPace): void {
  try {
    localStorage.setItem(PACE_KEY, pace);
  } catch {
    // silent no-op
  }
}

/** True once the user has been shown the anchor-thought primer at
 *  least once — used to gate the first-time redirect. */
export function hasSeenAnchorPrimer(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

export function markAnchorPrimerSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // no-op
  }
}
