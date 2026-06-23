import { useCallback, useMemo, useState } from 'react';
import CrossfadeText from '../CrossfadeText';
import {
  DEFAULT_ANCHOR,
  getAnchorPace,
  PACE_CYCLE_MS,
  parseAnchorParts,
} from '../../utils/anchorThought';

interface Props {
  running: boolean;
  /** Anchor thought to repeat. Parsed via parseAnchorParts:
   *   - Single line → words alternate across the breath (So Hum, Om).
   *   - Multi-line  → each line shows whole on one cycle, with a
   *                   brief held silence between lines. The cycle
   *                   speed comes from the user's pace preference. */
  anchor?: string;
}

/** User's chosen anchor thought crossfading with the breath rhythm. */
export default function ThinkingAccompaniment({ running, anchor = DEFAULT_ANCHOR }: Props) {
  const parts = useMemo(() => parseAnchorParts(anchor), [anchor]);
  const safeParts = parts.length > 0 ? parts : [DEFAULT_ANCHOR];
  const cycleMs = useMemo(() => PACE_CYCLE_MS[getAnchorPace()], []);
  const [idx, setIdx] = useState(0);
  const value = safeParts[idx % safeParts.length];
  const handleCycle = useCallback((i: number) => setIdx(i + 1), []);

  // Show the "anchor thought" label only through the first full round.
  const showLabel = idx < safeParts.length;

  // Multi-line / long-phrase anchors get a slightly larger display
  // container so the full sentence has room without crowding.
  const isLong = safeParts.some((p) => p.length > 30);

  return (
    <div
      style={{
        minHeight: isLong ? 240 : 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '0 12px',
      }}
    >
      <CrossfadeText
        value={value}
        cycleMs={cycleMs}
        running={running}
        onCycle={handleCycle}
        className={`mok-crossfade mok-crossfade--mantra${isLong ? ' mok-crossfade--mantra-long' : ''}`}
      />
      {showLabel && <p className="mok-anchor-label">anchor thought</p>}
    </div>
  );
}
