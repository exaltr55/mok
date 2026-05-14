import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

interface Props {
  /** The currently-displayed string. Changes are swapped in only at low opacity. */
  value: string;
  /** Full cycle duration (rise + hold + fall) in ms. */
  cycleMs: number;
  /** When false, fade gently to a low-opacity rest and stop the loop. */
  running: boolean;
  /** Called once per full cycle, with the zero-based cycle index. */
  onCycle?: (cycleIndex: number) => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * A smooth crossfade text element used in the meditative practices
 * (So Hum mantra, affirmations, anchor questions). A single element holds the
 * value and animates its opacity through a sinusoidal envelope. New values
 * are swapped in only during the low-opacity window so the eye does not catch
 * the change.
 */
export default function CrossfadeText({
  value,
  cycleMs,
  running,
  onCycle,
  className = 'mok-crossfade',
  style,
}: Props) {
  const [displayed, setDisplayed] = useState(value);
  const [opacity, setOpacity] = useState(0);
  const opacityRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const lastSwapRef = useRef(-1);
  const onCycleRef = useRef(onCycle);

  // Keep latest callback without re-binding the loop.
  useEffect(() => { onCycleRef.current = onCycle; }, [onCycle]);

  useEffect(() => {
    if (!running) {
      setOpacity(0.25);
      opacityRef.current = 0.25;
      startRef.current = null;
      lastSwapRef.current = -1;
      return;
    }
    let active = true;
    const tick = (t: number) => {
      if (!active) return;
      if (startRef.current === null) startRef.current = t;
      const elapsed = (t - startRef.current) % cycleMs;
      const progress = elapsed / cycleMs;
      // Envelope: 0→0.95 over first 25%, hold to 70%, fall back to 0 by end.
      let o: number;
      if (progress < 0.25) o = (progress / 0.25) * 0.95;
      else if (progress < 0.7) o = 0.95;
      else o = 0.95 * (1 - (progress - 0.7) / 0.3);

      setOpacity(o);
      opacityRef.current = o;

      const cycleIndex = Math.floor((t - startRef.current) / cycleMs);
      if (cycleIndex !== lastSwapRef.current && progress > 0.9) {
        lastSwapRef.current = cycleIndex;
        onCycleRef.current?.(cycleIndex);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, cycleMs]);

  // Swap displayed value only while at low opacity (so the change is invisible).
  useEffect(() => {
    if (value === displayed) return;
    if (opacityRef.current < 0.12 || !running) {
      setDisplayed(value);
      return;
    }
    const poll = setInterval(() => {
      if (opacityRef.current < 0.12) {
        setDisplayed(value);
        clearInterval(poll);
      }
    }, 50);
    const fallback = setTimeout(() => {
      setDisplayed(value);
      clearInterval(poll);
    }, 2000);
    return () => { clearInterval(poll); clearTimeout(fallback); };
  }, [value, running, displayed]);

  // Memoize the inline opacity object so React doesn't churn it.
  const inline = useCallback(
    (op: number): CSSProperties => ({
      ...style,
      opacity: op,
      transition: running ? 'none' : 'opacity 1.4s ease-out',
    }),
    [running, style],
  );

  return (
    <div className={className} style={inline(opacity)}>
      {displayed}
    </div>
  );
}
