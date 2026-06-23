import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  type AnchorPace,
  DEFAULT_ANCHOR,
  getAnchorPace,
  getAnchorThought,
  markAnchorPrimerSeen,
  parseAnchorLines,
  setAnchorPace,
  setAnchorThought,
} from '../utils/anchorThought';

const MAX_LINES = 4;

/**
 * Dedicated settings page for the I M Thinking anchor thought.
 *
 * The user starts with a single input. They can add more lines with
 * "+ Add another line" — useful for longer phrases the user wants to
 * land as a whole on each cycle. Saved value is the lines joined with
 * "+" (a separator the parser understands). The pace selector lets
 * the user choose how quickly the rhythm moves.
 */
export default function ThinkingAnchorSettings() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get('return') || '/practices/thinking/session';

  // Current saved anchor for display.
  const [anchor, setAnchor] = useState<string>(() => getAnchorThought());

  // Drafts the user is editing. Starts with the saved anchor's lines
  // (parsed) so they can refine — or with one empty line if none.
  const [lines, setLines] = useState<string[]>(() => {
    const saved = getAnchorThought();
    if (!saved || saved === DEFAULT_ANCHOR) return [''];
    const parts = saved.split(/[\n+]/).map((s) => s.trim()).filter(Boolean);
    return parts.length > 0 ? parts : [''];
  });
  const [pace, setPace] = useState<AnchorPace>(() => getAnchorPace());

  function choosePace(p: AnchorPace) {
    setPace(p);
    setAnchorPace(p);
  }

  function updateLine(i: number, v: string) {
    setLines((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  function addLine() {
    if (lines.length >= MAX_LINES) return;
    setLines((prev) => [...prev, '']);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function applyAndSave() {
    const cleaned = lines.map((l) => l.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    // Single line → store as-is so "So Hum"-style whitespace anchors
    // continue to alternate word-by-word across breaths. Multi-line →
    // join with "+" so the parser treats each line as one beat.
    const value = cleaned.length === 1 ? cleaned[0] : cleaned.join('+');
    setAnchor(value);
    setAnchorThought(value);
  }

  function saveAndReturn() {
    applyAndSave();
    markAnchorPrimerSeen();
    navigate(returnTo);
  }

  function useDefault() {
    setLines([DEFAULT_ANCHOR]);
    setAnchor(DEFAULT_ANCHOR);
    setAnchorThought(DEFAULT_ANCHOR);
  }

  const previewLines = parseAnchorLines(
    lines
      .map((l) => l.trim())
      .filter(Boolean)
      .join('+'),
  );

  return (
    <section className="mok-rise" style={{ maxWidth: 640, margin: '0 auto', display: 'grid', gap: 24 }}>
      <header style={{ paddingTop: 8 }}>
        <Link to={returnTo} className="mok-nav-link">← Back</Link>
        <p className="mok-eyebrow" style={{ marginTop: 16 }}>I M Thinking · Setting</p>
        <h1 className="mok-section-title">Your anchor thought</h1>
      </header>

      {/* Commentary */}
      <article
        className="mok-card mok-card--padded"
        style={{ display: 'grid', gap: 14, fontSize: 16, lineHeight: 1.65 }}
      >
        <h2 className="mok-section-h3" style={{ margin: 0 }}>Using an anchor thought</h2>
        <p>
          When the mind is busy, a single, gentle thought becomes a place
          for attention to return. We call this your <em>anchor thought</em>.
        </p>
        <p>
          The default we offer is <strong>{DEFAULT_ANCHOR}</strong> — a
          soft mental sound that aligns with the rhythm of the breath.
          <em> So</em> on the inhale, <em>Hum</em> on the exhale. No
          meaning to interpret, just a quiet pattern the mind can rest on.
        </p>
        <p>
          But <strong>the anchor is yours to choose.</strong> Many people
          prefer a word or phrase that already carries meaning,
          steadiness, or familiarity for them.
        </p>
        <p>
          For a longer phrase, add a second line. Each line you add
          lands as a whole on one cycle — and you can choose how slowly
          or quickly the rhythm moves, just below.
        </p>
      </article>

      {/* Current saved anchor */}
      <article className="mok-card mok-card--padded" style={{ textAlign: 'center' }}>
        <p className="mok-eyebrow">Current anchor</p>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 400,
            margin: '10px 0 4px',
            lineHeight: 1.4,
            whiteSpace: 'pre-line',
          }}
        >
          {anchor.split(/[\n+]/).map((l) => l.trim()).filter(Boolean).join('\n')}
        </p>
        {anchor === DEFAULT_ANCHOR && (
          <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic' }}>
            Default
          </p>
        )}
      </article>

      {/* Edit — line by line. Each input is one breath. */}
      <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 12 }}>
        <p className="mok-section-h3" style={{ margin: 0 }}>Edit</p>
        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: 0 }}>
          Each line below becomes one beat in the rhythm.
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          {lines.map((line, i) => (
            <div key={i} style={{ display: 'grid', gap: 4 }}>
              <label
                htmlFor={`line-${i}`}
                className="mok-eyebrow"
                style={{ margin: 0, fontSize: 10, color: 'var(--text-subtle)' }}
              >
                Line {i + 1}
              </label>
              <div className="mok-row" style={{ gap: 8 }}>
                <input
                  id={`line-${i}`}
                  type="text"
                  value={line}
                  onChange={(e) => updateLine(i, e.target.value)}
                  placeholder={i === 0 ? 'Your anchor (e.g. So Hum, Om, or a phrase you love)' : 'Next line'}
                  maxLength={200}
                  style={{ flex: 1, fontSize: 15, padding: '8px 12px' }}
                />
                {lines.length > 1 && (
                  <button
                    type="button"
                    className="mok-btn mok-btn--ghost"
                    onClick={() => removeLine(i)}
                    aria-label={`Remove line ${i + 1}`}
                    style={{ padding: '6px 10px', minHeight: 0 }}
                    title="Remove this line"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mok-row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="mok-btn mok-btn--ghost"
            onClick={addLine}
            disabled={lines.length >= MAX_LINES}
            style={{ fontSize: 14 }}
          >
            + Add another line
          </button>
          <button type="button" className="mok-btn mok-btn--ghost" onClick={useDefault}>
            Reset to default
          </button>
        </div>

        {previewLines.length >= 1 && (
          <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: '8px 0 0' }}>
            {previewLines.length === 1
              ? 'Each word above lands on one beat of the rhythm.'
              : 'Each line above lands as a whole; a quiet pause sits between lines.'}
          </p>
        )}
      </article>

      {/* Pace selector — slow is the default; fast suits short anchors
          like Om where the breath naturally moves quicker. */}
      <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 10 }}>
        <p className="mok-section-h3" style={{ margin: 0 }}>Pace</p>
        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: 0 }}>
          How quickly each beat moves to the next.
        </p>
        <div className="mok-row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {(['slow', 'fast'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => choosePace(p)}
              className={`mok-btn ${pace === p ? 'mok-btn--primary' : ''}`}
              style={{ minWidth: 120 }}
            >
              {p === 'slow' ? 'Slow' : 'Fast'}
              {p === 'slow' && (
                <span className="mok-subtle" style={{ fontSize: 11, marginLeft: 6 }}>
                  default
                </span>
              )}
            </button>
          ))}
        </div>
      </article>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, paddingBottom: 24 }}>
        <button
          type="button"
          className="mok-btn mok-btn--primary mok-btn--lg"
          onClick={saveAndReturn}
        >
          Save — back to practice →
        </button>
      </div>
    </section>
  );
}
