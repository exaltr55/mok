import { useCallback, useRef, useState } from 'react';
import CrossfadeText from '../CrossfadeText';

export const AFFIRMATIONS = [
  'I am becoming more aware of my health, gently caring for my body and mind.',
  'I am welcoming abundance, in all the ways it flows to me.',
  "I am noticing what I'm grateful for, appreciating what is already here.",
  'I am expressing my gifts and talent, to serve and support others.',
  'I am staying open, trusting that all things unfold for the greater good.',
  'I am choosing freely, in ways that honor myself and others.',
  'I am.',
];

export const CYCLE_MS = 14000;
export const SETTLE_MS = 10000;

export const TALKING_TOTAL_SECONDS = Math.round(
  (AFFIRMATIONS.length * CYCLE_MS + SETTLE_MS) / 1000,
);

interface Props {
  running: boolean;
  onComplete?: () => void;
}

/** Affirmations cycling on a long crossfade. Self-completing. */
export default function TalkingAccompaniment({ running, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  const handleCycle = useCallback(() => {
    setIdx((prev) => {
      const next = prev + 1;
      if (next >= AFFIRMATIONS.length) {
        if (!completedRef.current) {
          completedRef.current = true;
          setDone(true);
          if (onComplete) setTimeout(onComplete, SETTLE_MS);
        }
        return prev;
      }
      return next;
    });
  }, [onComplete]);

  const value = AFFIRMATIONS[Math.min(idx, AFFIRMATIONS.length - 1)];

  return (
    <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
      <CrossfadeText
        value={value}
        cycleMs={CYCLE_MS}
        running={running && !done}
        onCycle={handleCycle}
        className="mok-crossfade mok-crossfade--affirmation"
      />
      <p className="mok-anchor-label">
        {done ? 'complete' : `${Math.min(idx + 1, AFFIRMATIONS.length)} of ${AFFIRMATIONS.length}`}
      </p>
    </div>
  );
}
