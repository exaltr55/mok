/**
 * Renders a block of text line-by-line and — when narrating — fades each
 * line to indicate where the spoken voice currently is. Prior lines dim a
 * little (already read), the active line stays bright, upcoming lines sit
 * lower in the visual hierarchy. Blank lines in the source become small
 * vertical breaks so stanza spacing is preserved.
 */
interface Props {
  body: string;
  progress: number;
  narrating: boolean;
  className?: string;
}

export default function NarratedLines({ body, progress, narrating, className = '' }: Props) {
  const raw = body.split('\n').map((l) => l.replace(/  $/, ''));
  const lineLens = raw
    .map((l) => l.trim())
    .map((l) => (l.length ? l.length : 0));
  const totalChars = lineLens.reduce((s, n) => s + n, 0) || 1;

  // Find the active line — the one currently being spoken.
  let activeLineIdx = -1;
  if (narrating) {
    const cutoff = Math.max(0, Math.min(1, progress)) * totalChars;
    let walked = 0;
    for (let i = 0; i < raw.length; i++) {
      const len = lineLens[i];
      if (len === 0) continue;
      walked += len;
      if (walked >= cutoff) {
        activeLineIdx = i;
        break;
      }
    }
    if (activeLineIdx === -1) {
      // Pick the last non-empty line.
      for (let i = raw.length - 1; i >= 0; i--) {
        if (lineLens[i] > 0) { activeLineIdx = i; break; }
      }
    }
  }

  return (
    <div className={`mok-narrated ${narrating ? 'mok-narrated--on' : ''} ${className}`}>
      {raw.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <span key={i} className="mok-narrated-break" aria-hidden="true" />;
        let state: 'plain' | 'read' | 'active' | 'unread' = 'plain';
        if (narrating) {
          state = i < activeLineIdx ? 'read' : i === activeLineIdx ? 'active' : 'unread';
        }
        return (
          <span key={i} className={`mok-narrated-line mok-narrated-line--${state}`}>
            {trimmed}
          </span>
        );
      })}
    </div>
  );
}
