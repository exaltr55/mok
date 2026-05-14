import { useEffect, useState } from 'react';

interface Props {
  running: boolean;
  /** Practice colour from PRACTICE_COLORS (used to tint the ring). */
  colorVar?: string;
}

/**
 * The 4-4-4 breathing ring. A pulsing ring/fill ticks through inhale → hold →
 * exhale → … in a 12-second loop. The phase label updates each beat.
 */
export default function BreathingAccompaniment({ running, colorVar }: Props) {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
    if (!running) return;
    const order: Array<'Inhale' | 'Hold' | 'Exhale'> = ['Inhale', 'Hold', 'Exhale'];
    let idx = 0;
    setPhase(order[idx]);
    const id = setInterval(() => {
      idx = (idx + 1) % 3;
      setPhase(order[idx]);
    }, 4000);
    return () => clearInterval(id);
  }, [running]);

  const cssVar = colorVar ? { ['--practice-color' as string]: colorVar } : undefined;

  return (
    <div className="mok-breath-stage" style={cssVar}>
      <div className="mok-breath-ring-wrap">
        <div className={`mok-breath-ring ${running ? 'mok-breath-anim' : ''}`} />
        <div className={`mok-breath-fill ${running ? 'mok-breath-anim' : ''}`} />
        <div className="mok-breath-label">{running ? phase : 'paused'}</div>
      </div>
    </div>
  );
}
