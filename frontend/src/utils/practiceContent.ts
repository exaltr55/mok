/**
 * Parse the canonical practice markdown into three sections:
 *   - intro (anything before "Part A" / first heading)
 *   - learn (Part A — Learning the Practice)
 *   - session (Part B — Daily Practice — what the guided player walks the user through)
 *
 * The content files in `content/do/*.md` use markdown soft-line-breaks (two
 * trailing spaces) within stanzas and blank lines between stanzas. The parser
 * preserves that rhythm by returning stanzas as-typed.
 */

export interface ParsedPractice {
  intro: string;
  learn: string;
  session: string;
  sessionScenes: Scene[];
}

export interface Scene {
  text: string;
  /** Suggested seconds the scene should hold before auto-advancing. */
  holdSeconds: number;
}

const PART_B_MARKERS = [
  /^Part\s*B\b.*$/im,
  /^PART\s*B\b.*$/im,
];

const PART_A_MARKERS = [
  /^Part\s*A\b.*$/im,
  /^PART\s*A\b.*$/im,
];

function findIndex(content: string, patterns: RegExp[]): number {
  for (const re of patterns) {
    const m = re.exec(content);
    if (m) return m.index;
  }
  return -1;
}

export function parsePractice(content: string): ParsedPractice {
  if (!content) {
    return { intro: '', learn: '', session: '', sessionScenes: [] };
  }
  const partBIdx = findIndex(content, PART_B_MARKERS);
  const partAIdx = findIndex(content, PART_A_MARKERS);

  let intro = '';
  let learn = '';
  let session = '';

  if (partAIdx >= 0 && partBIdx >= 0 && partBIdx > partAIdx) {
    intro = content.slice(0, partAIdx).trim();
    learn = content.slice(partAIdx, partBIdx).trim();
    session = content.slice(partBIdx).trim();
  } else if (partBIdx >= 0) {
    intro = content.slice(0, partBIdx).trim();
    session = content.slice(partBIdx).trim();
  } else if (partAIdx >= 0) {
    intro = content.slice(0, partAIdx).trim();
    learn = content.slice(partAIdx).trim();
  } else {
    intro = content.trim();
  }

  return {
    intro,
    learn,
    session,
    sessionScenes: toScenes(session),
  };
}

/**
 * Turn a Part B body into paced scenes the guided player can walk through.
 *
 * Strategy:
 *   - Drop the heading line.
 *   - Split on blank lines (stanza boundaries).
 *   - Strip markdown decorations (--- separators, > blockquotes, # headings).
 *   - Estimate hold time from word count + presence of count markers.
 */
function toScenes(partB: string): Scene[] {
  if (!partB) return [];
  // Drop the heading line(s).
  const body = partB
    .replace(/^.*Part\s*B[^\n]*\n+/im, '')
    .replace(/^\s*PART\s*B[^\n]*\n+/im, '')
    .replace(/^>[^\n]*\n+/m, '')
    .replace(/^-{3,}$/gm, '')
    .trim();

  const stanzas = body
    .split(/\n\s*\n/)
    .map((s) =>
      s
        .split('\n')
        .map((l) => l.replace(/  $/, '').trim())
        .filter(Boolean)
        .join('\n')
        .trim(),
    )
    .filter((s) => s.length > 0 && !/^#{1,6}\s/.test(s));

  return stanzas.map((text) => ({
    text,
    holdSeconds: estimateHold(text),
  }));
}

function estimateHold(text: string): number {
  // Lines that are just count markers ("One…", "two…") hold ~1.2s each.
  const isCount = /^([Oo]ne|[Tt]wo|[Tt]hree|[Ff]our|1|2|3|4)\W?$/m.test(text);
  if (isCount) return 1.2;

  const words = text.split(/\s+/).filter(Boolean).length;
  // ~340ms per word with a minimum hold for any phrase.
  const base = Math.max(2.5, Math.min(14, words * 0.34));
  // Slow down on pause invitations and breath instructions.
  const hasBreathCue = /(inhale|hold|exhale|pause|breath|notice|rest)/i.test(text);
  return Math.round((hasBreathCue ? base * 1.15 : base) * 10) / 10;
}
