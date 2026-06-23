/**
 * Renders a block of text line-by-line and — when narrating — fades each
 * line to indicate where the spoken voice currently is. Prior lines dim a
 * little (already read), the active line stays bright, upcoming lines sit
 * lower in the visual hierarchy. Blank lines in the source become small
 * vertical breaks so stanza spacing is preserved.
 */
import type { ReactNode } from 'react';

interface Props {
  body: string;
  progress: number;
  narrating: boolean;
  className?: string;
}

/** Parse a line for inline markdown bold (`**word**`) and italic
 *  (`*word*`) and return it as a JSX fragment. Bold is matched first
 *  (longer marker), then italic on the remaining text. Anything else
 *  renders as plain text so the existing tone is preserved. */
function renderInline(line: string): ReactNode {
  if (!line.includes('*')) return line;
  const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
  return boldParts.flatMap((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return [<strong key={`b${i}`}>{part.slice(2, -2)}</strong>];
    }
    if (!part.includes('*')) return [<span key={`p${i}`}>{part}</span>];
    const italicParts = part.split(/(\*[^*]+\*)/g);
    return italicParts.map((sub, j) => {
      if (sub.startsWith('*') && sub.endsWith('*') && sub.length > 2) {
        return <em key={`i${i}-${j}`}>{sub.slice(1, -1)}</em>;
      }
      return <span key={`s${i}-${j}`}>{sub}</span>;
    });
  });
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
            {renderInline(trimmed)}
          </span>
        );
      })}
    </div>
  );
}
