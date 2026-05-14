import { useCallback, useState } from 'react';
import CrossfadeText from '../CrossfadeText';

interface Props {
  running: boolean;
}

const CYCLE_MS = 5000; // ~one breath's worth

/** "So Hum" mantra crossfading with the breath rhythm. */
export default function ThinkingAccompaniment({ running }: Props) {
  const [idx, setIdx] = useState(0);
  const word = idx % 2 === 0 ? 'So' : 'Hum';
  const handleCycle = useCallback((i: number) => setIdx(i + 1), []);

  return (
    <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <CrossfadeText
        value={word}
        cycleMs={CYCLE_MS}
        running={running}
        onCycle={handleCycle}
        className="mok-crossfade mok-crossfade--mantra"
      />
      <p className="mok-anchor-label">anchor thought</p>
    </div>
  );
}
