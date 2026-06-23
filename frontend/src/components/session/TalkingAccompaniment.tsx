import { useCallback, useMemo, useRef, useState } from 'react';
import CrossfadeText from '../CrossfadeText';
import { getCustomAffirmations, MAX_CUSTOM_AFFIRMATIONS } from '../../utils/customAffirmations';

// The seven core affirmations. Displayed as two lines each (split at
// the comma). The \n is preserved at render time via `white-space:
// pre-line`.
export const CORE_AFFIRMATIONS = [
  'I am caring for my health,\nin body and mind.',
  'I am welcoming abundance,\nas it flows to me.',
  "I am noticing what I'm grateful for,\nappreciating what is here.",
  'I am expressing my gifts and talents,\nin service of others.',
  'I am staying open,\ntrusting how life unfolds.',
  'I am giving my full attention,\nto what is in front of me.',
  'I am choosing freely,\nin ways that honor everyone.',
];

/** The distilled final affirmation that closes the spoken set. */
export const FINAL_I_AM = 'I am.';

/** A gentle closing nudge shown after the final "I am." — points the
 *  practitioner toward I M Writing, the evening companion practice,
 *  so the daily rhythm completes. */
export const CLOSING_NUDGE = 'Tonight, before sleep,\nlet I M Writing close the day.';

export const CYCLE_MS = 4500;
export const SETTLE_MS = 8000;

/** Each affirmation is shown in TWO beats — the first half (before the
 *  comma) on its own to land, then the complete phrase with the second
 *  line revealed below. "I am." and the closing nudge each run as a
 *  single beat. */
const BEATS_PER_AFFIRMATION = 2;

/** Total seconds the accompaniment runs end-to-end, given the user's
 *  current set of custom affirmations (up to 2). Computed dynamically
 *  so the timer always matches what's actually being played. */
export function getTalkingTotalSeconds(): number {
  const custom = getCustomAffirmations();
  const beats =
    (CORE_AFFIRMATIONS.length + custom.length) * BEATS_PER_AFFIRMATION
    + 1 // FINAL_I_AM
    + 1; // CLOSING_NUDGE
  return Math.round((beats * CYCLE_MS + SETTLE_MS) / 1000);
}

/** Static upper-bound used where a fixed value is needed at module
 *  load time (e.g. PracticeSession's DURATIONS map). Assumes the
 *  maximum number of custom affirmations are enabled. */
export const TALKING_TOTAL_SECONDS = Math.round(
  ((CORE_AFFIRMATIONS.length + MAX_CUSTOM_AFFIRMATIONS) * BEATS_PER_AFFIRMATION + 2)
    * CYCLE_MS / 1000
  + SETTLE_MS / 1000,
);

/** Back-compat alias — other files reference AFFIRMATIONS for the
 *  "how many beats" question. Returns core + final "I am." (8 lines). */
export const AFFIRMATIONS = [...CORE_AFFIRMATIONS, FINAL_I_AM];

interface Props {
  running: boolean;
  onComplete?: () => void;
}

/** Affirmations cycling on a long crossfade, followed by a closing
 *  nudge about the evening practice. Self-completing. */
export default function TalkingAccompaniment({ running, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  // Build the sequence once per mount. Each affirmation contributes
  // TWO beats — the first half (before the comma) lands on its own,
  // then the full phrase (both lines) so the second part arrives like
  // a quiet response. "I am." and the closing nudge each run as a
  // single beat at the end. Affirmation count = total affirmations
  // (not beats) so the displayed counter stays meaningful.
  const { sequence, affirmationBeatCount, totalAffirmations } = useMemo(() => {
    const custom = getCustomAffirmations();
    const affirmations = [...CORE_AFFIRMATIONS, ...custom, FINAL_I_AM];
    const seq: string[] = [];
    for (const a of affirmations) {
      const newlineIdx = a.indexOf('\n');
      if (newlineIdx === -1) {
        // Single-line affirmation (e.g. "I am.") — one beat only.
        seq.push(a);
      } else {
        // Two-line affirmation — first half alone, then the full phrase.
        const firstLine = a.slice(0, newlineIdx);
        seq.push(firstLine);
        seq.push(a);
      }
    }
    seq.push(CLOSING_NUDGE);
    return {
      sequence: seq,
      affirmationBeatCount: seq.length - 1, // everything except the closing nudge
      totalAffirmations: affirmations.length,
    };
  }, []);

  const handleCycle = useCallback(() => {
    setIdx((prev) => {
      const next = prev + 1;
      if (next >= sequence.length) {
        if (!completedRef.current) {
          completedRef.current = true;
          setDone(true);
          if (onComplete) setTimeout(onComplete, SETTLE_MS);
        }
        return prev;
      }
      return next;
    });
  }, [onComplete, sequence.length]);

  const value = sequence[Math.min(idx, sequence.length - 1)];
  const inClosingPhase = idx >= affirmationBeatCount;

  // Map the current beat back to which affirmation we're on, for the
  // counter label. Each two-line affirmation occupies 2 beats; the
  // single-line "I am." occupies 1.
  const currentAffirmationNumber = useMemo(() => {
    if (inClosingPhase) return totalAffirmations;
    let beatsSoFar = 0;
    const custom = getCustomAffirmations();
    const affirmations = [...CORE_AFFIRMATIONS, ...custom, FINAL_I_AM];
    for (let i = 0; i < affirmations.length; i++) {
      const beats = affirmations[i].indexOf('\n') === -1 ? 1 : 2;
      beatsSoFar += beats;
      if (idx < beatsSoFar) return i + 1;
    }
    return totalAffirmations;
  }, [idx, inClosingPhase, totalAffirmations]);

  return (
    <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
      <CrossfadeText
        value={value}
        cycleMs={CYCLE_MS}
        running={running && !done}
        onCycle={handleCycle}
        className={`mok-crossfade mok-crossfade--affirmation${inClosingPhase ? ' mok-crossfade--closing' : ''}`}
      />
      <p className="mok-anchor-label">
        {done
          ? 'complete'
          : inClosingPhase
            ? 'before sleep'
            : `${currentAffirmationNumber} of ${totalAffirmations}`}
      </p>
    </div>
  );
}
