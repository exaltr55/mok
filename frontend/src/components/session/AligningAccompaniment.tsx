import { useCallback, useState } from 'react';
import CrossfadeText from '../CrossfadeText';

const QUESTIONS = [
  'What is true right now?',
  'Where is the body asking for ease?',
  'What does this season ask of me?',
  'Am I in balance right now?',
];

interface Props {
  running: boolean;
}

/** Anchor questions cycling slowly to invite reflection. */
export default function AligningAccompaniment({ running }: Props) {
  const [idx, setIdx] = useState(0);
  const handleCycle = useCallback(() => setIdx((i) => (i + 1) % QUESTIONS.length), []);
  return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
      <CrossfadeText
        value={`"${QUESTIONS[idx]}"`}
        cycleMs={22000}
        running={running}
        onCycle={handleCycle}
        className="mok-crossfade mok-crossfade--question"
      />
    </div>
  );
}
