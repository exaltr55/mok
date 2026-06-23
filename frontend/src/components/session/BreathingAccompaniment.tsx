import { useEffect, useState } from 'react';

interface Props {
  running: boolean;
  /** Practice colour from PRACTICE_COLORS (used to tint the ring). */
  colorVar?: string;
}

/**
 * The 4-4-4 breathing ring. A pulsing ring/fill ticks through inhale → hold →
 * exhale → … in a 12-second loop. The phase label updates each beat, and a
 * 1 → 2 → 3 → 4 count ticks beneath it so the user can follow each phase
 * to the breath.
 */
export default function BreathingAccompaniment({ running, colorVar }: Props) {
  // Single 1-second tick drives both phase and count.
  // tick 0..3 = Inhale, 4..7 = Hold, 8..11 = Exhale.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    setTick(0);
    const id = setInterval(() => {
      setTick((t) => (t + 1) % 12);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const phase: 'Inhale' | 'Hold' | 'Exhale' =
    tick < 4 ? 'Inhale' : tick < 8 ? 'Hold' : 'Exhale';
  const count = (tick % 4) + 1;

  const cssVar = colorVar ? { ['--practice-color' as string]: colorVar } : undefined;

  return (
    <div className="mok-breath-stage" style={cssVar}>
      <div className="mok-breath-ring-wrap">
        <div className={`mok-breath-glow ${running ? 'mok-breath-anim' : ''}`} aria-hidden="true" />
        <div className={`mok-breath-ring ${running ? 'mok-breath-anim' : ''}`} />
        <div className={`mok-breath-fill ${running ? 'mok-breath-anim' : ''}`} />
        <div className="mok-breath-label">
          {running ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {/* `key={phase}` remounts the span on every phase change so
                  the CSS animation re-runs — giving the word a soft
                  "arising" feel instead of an instant swap. */}
              <span key={phase} className="mok-breath-phase">{phase}</span>
              <span key={`${phase}-${count}`} className="mok-breath-count">{count}</span>
            </div>
          ) : (
            'paused'
          )}
        </div>
      </div>
    </div>
  );
}
