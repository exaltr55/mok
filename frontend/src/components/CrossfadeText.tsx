import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

interface Props {
  /** The currently-displayed string. Changes are swapped in at the
   *  iteration boundary, where the CSS animation has opacity 0 — so
   *  the swap is invisible to the eye. */
  value: string;
  /** Full cycle duration (rise + hold + fall) in ms. */
  cycleMs: number;
  /** When false, the animation is removed; opacity glides to the
   *  rest state via CSS transition. */
  running: boolean;
  /** Called once per full cycle, with the zero-based cycle index. */
  onCycle?: (cycleIndex: number) => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * A smooth crossfade text element used in the meditative practices
 * (So Hum mantra, affirmations, anchor questions).
 *
 * The opacity envelope is driven entirely by a CSS animation — the
 * browser compositor runs it, not React. This eliminates the per-frame
 * `setState` thrash the previous RAF-based implementation had, and
 * avoids StrictMode's dev double-mount duplicating an RAF loop.
 *
 * The value swap is timed by the `animationiteration` event, which
 * fires exactly when the cycle wraps (opacity at 0) — so the text
 * change is invisible.
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
  const elRef = useRef<HTMLDivElement>(null);
  const cycleIndexRef = useRef(0);
  const onCycleRef = useRef(onCycle);

  // Keep the latest onCycle without rebinding the event listener.
  useEffect(() => {
    onCycleRef.current = onCycle;
  }, [onCycle]);

  // Wire the `animationiteration` event whenever the animation is
  // active. Each iteration ends at opacity 0 — the safe moment to
  // notify the parent and let it queue a new value.
  useEffect(() => {
    if (!running) return;
    const el = elRef.current;
    if (!el) return;
    cycleIndexRef.current = 0;

    const handle = () => {
      onCycleRef.current?.(cycleIndexRef.current);
      cycleIndexRef.current += 1;
    };

    el.addEventListener('animationiteration', handle);
    return () => el.removeEventListener('animationiteration', handle);
  }, [running, cycleMs]);

  // Sync the displayed text with the incoming value. The CSS animation
  // guarantees we're at opacity 0 when this happens (the parent sets
  // the new value from onCycle, which fires at the iteration boundary),
  // so the swap is invisible.
  useEffect(() => {
    setDisplayed(value);
  }, [value]);

  // Inline CSS variable so each instance can run its own cycleMs.
  const inlineStyle: CSSProperties = {
    ...style,
    // CSS custom property — TS doesn't recognise it on CSSProperties.
    ['--cycle-ms' as string]: `${cycleMs}ms`,
  };

  const cls = `${className}${running ? ' mok-crossfade--anim' : ''}`;

  return (
    <div ref={elRef} className={cls} style={inlineStyle}>
      {displayed}
    </div>
  );
}
