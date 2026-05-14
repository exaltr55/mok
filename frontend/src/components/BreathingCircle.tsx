import { useEffect, useState } from 'react';

type Phase = 'inhale' | 'hold' | 'exhale';

interface Props {
  /** Duration in seconds for each of inhale, hold, exhale. */
  beat?: number;
  /** When the parent pauses (e.g., user navigates away), stop animating. */
  active?: boolean;
}

/**
 * 4-4-4 breathing circle. Expands during inhale, holds, contracts during exhale.
 * Purely visual — the actual practice timing is driven by the parent session
 * which advances through the practice text at its own cadence.
 */
export default function BreathingCircle({ beat = 4, active = true }: Props) {
  const [phase, setPhase] = useState<Phase>('inhale');
  const [tick, setTick] = useState(beat);

  useEffect(() => {
    if (!active) return;
    let elapsed = 0;
    const id = setInterval(() => {
      elapsed += 1;
      setTick((t) => Math.max(1, t - 1));
      if (elapsed >= beat) {
        elapsed = 0;
        setPhase((p) => (p === 'inhale' ? 'hold' : p === 'hold' ? 'exhale' : 'inhale'));
        setTick(beat);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [beat, active]);

  // Scale: inhale grows 1 → 1.6 over `beat` seconds, hold stays 1.6, exhale shrinks back.
  const scale = phase === 'inhale' ? 1.6 : phase === 'hold' ? 1.6 : 1.0;
  const label = phase === 'inhale' ? 'Breathe in' : phase === 'hold' ? 'Hold' : 'Breathe out';

  return (
    <div className="mok-breath-stage" aria-live="polite">
      <div
        className="mok-breath-circle"
        style={{
          transform: `scale(${scale})`,
          transition: `transform ${beat}s cubic-bezier(0.5, 0.0, 0.5, 1.0)`,
        }}
      />
      <div className="mok-breath-label">
        <div className="mok-breath-phase">{label}</div>
        <div className="mok-breath-count">{tick}</div>
      </div>
    </div>
  );
}
