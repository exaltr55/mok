import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getLearnModule,
  listLearnModules,
  listPractices,
  type LearnModule,
  type LearnModuleSummary,
  type PracticeSummary,
} from '../api/client';
import { useSlideNarration } from '../hooks/useSlideNarration';
import NarratedLines from '../components/NarratedLines';
// [visual: key] markers in module markdown render inline via SLIDE_VISUALS
// — the registry can be repopulated with bespoke illustrations later.
import { SLIDE_VISUALS } from '../components/SlideVisual';
import PathIndex, { buildFiveSItems } from '../components/PathIndex';
import { renderEmphasis } from '../utils/inlineEmphasis';
import {
  clearModulePosition,
  getModulePosition,
  getReadModules,
  markModuleRead,
  saveModulePosition,
} from '../utils/learnProgress';

/** Engineer-facing meta we strip even if it slips back into canonical content. */
function isMetaLine(line: string): boolean {
  const s = line.trim();
  if (!s) return false;
  if (s.includes('Surface:')) return true;
  if (/^>?\s*Module\s+\d/i.test(s)) return true;
  if (/preserve the breath/i.test(s)) return true;
  if (/two trailing spaces/i.test(s)) return true;
  if (/soft line breaks within/i.test(s)) return true;
  if (/^\(.*docs\//.test(s)) return true;
  if (/^\[.*\]$/.test(s)) return true;
  if (/^Full Script\b/i.test(s)) return true;
  return false;
}

interface Slide {
  kind: 'h1' | 'h2' | 'h3' | 'quote' | 'prose' | 'visual';
  /** For visual slides this is the visual key from SLIDE_VISUALS. */
  body: string;
}

const VISUAL_MARKER = /^\[visual:\s*([a-z0-9-]+)\s*\]$/i;

/** Flatten a slide to a single line of speech. Visual slides have no
 *  spoken text — they are a contemplative pause. */
function slideToText(slide: Slide): string {
  if (slide.kind === 'visual') return '';
  return slide.body
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Affirmation prose stanzas — first non-empty line starts with "I am". */
function isAffirmation(body: string): boolean {
  const first = body.split('\n').map((l) => l.trim()).find(Boolean);
  return !!first && /^I am\b/.test(first);
}

/** Group breath-paced stanzas into slide-sized beats so each card holds one
 *  thought without becoming a wall of text. Headings and blockquotes always
 *  begin a fresh slide. */
/** Split a multi-line stanza into chunks no taller than the cap. */
function splitToMaxLines(stanza: string, cap: number): string[] {
  const lines = stanza.split('\n').filter((l) => l.trim());
  if (lines.length <= cap) return [stanza];
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += cap) {
    chunks.push(lines.slice(i, i + cap).join('\n'));
  }
  return chunks;
}

/** Combines short consecutive stanzas into one slide up to MAX_LINES,
 *  then flushes. Long stanzas get their own slide. Headings, quotes,
 *  visuals always separate. Affirmations never combine with prose so
 *  their editorial styling stays clean. */
function buildSlides(content: string, MAX_LINES = 4): Slide[] {
  const stanzas = content
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => {
      if (!s) return false;
      if (/^-{3,}$/.test(s)) return false;
      if (s.split('\n').every(isMetaLine)) return false;
      return true;
    });

  const slides: Slide[] = [];
  let buffer: string[] = [];
  let bufferLines = 0;

  const countLines = (s: string) =>
    s.split('\n').filter((l) => l.trim()).length;

  const flush = () => {
    if (!buffer.length) return;
    slides.push({ kind: 'prose', body: buffer.join('\n\n') });
    buffer = [];
    bufferLines = 0;
  };

  for (const stanza of stanzas) {
    // [visual: key] becomes its own slide that renders an SVG metaphor.
    const visualMatch = stanza.match(VISUAL_MARKER);
    if (visualMatch) {
      flush();
      const key = visualMatch[1].toLowerCase();
      if (SLIDE_VISUALS[key]) slides.push({ kind: 'visual', body: key });
      continue;
    }
    if (stanza.startsWith('# ') && !stanza.startsWith('## ')) {
      flush();
      slides.push({ kind: 'h1', body: stanza.slice(2).trim() });
      continue;
    }
    if (stanza.startsWith('## ')) {
      flush();
      slides.push({ kind: 'h2', body: stanza.slice(3).trim() });
      continue;
    }
    if (stanza.startsWith('### ')) {
      flush();
      slides.push({ kind: 'h3', body: stanza.slice(4).trim() });
      continue;
    }
    if (stanza.startsWith('> ')) {
      flush();
      const kept = stanza
        .split('\n')
        .map((l) => l.replace(/^>\s?/, ''))
        .filter((l) => !isMetaLine(l));
      if (kept.length) slides.push({ kind: 'quote', body: kept.join('\n') });
      continue;
    }
    // Affirmations always get their own slide so the editorial
    // styling carries full emphasis. Long affirmations are split.
    if (/^I am\b/.test(stanza.split('\n')[0].trim())) {
      flush();
      for (const chunk of splitToMaxLines(stanza, MAX_LINES)) {
        slides.push({ kind: 'prose', body: chunk });
      }
      continue;
    }
    const stanzaLines = countLines(stanza);
    // Single stanza exceeds the cap → split it across multiple slides.
    if (stanzaLines > MAX_LINES) {
      flush();
      for (const chunk of splitToMaxLines(stanza, MAX_LINES)) {
        slides.push({ kind: 'prose', body: chunk });
      }
      continue;
    }
    if (buffer.length > 0 && bufferLines + stanzaLines > MAX_LINES) {
      flush();
    }
    buffer.push(stanza);
    bufferLines += stanzaLines;
  }
  flush();
  return slides;
}

export default function LearnModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<LearnModule | null>(null);
  const [siblings, setSiblings] = useState<LearnModuleSummary[]>([]);
  const [firstPractice, setFirstPractice] = useState<PracticeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  /** If there's a saved position for this module, we ask the user
   *  whether to resume or start over before showing slides. */
  const [showResume, setShowResume] = useState<{ idx: number; total: number } | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setIdx(0);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, left: 0 });
    // Check for a saved position to offer a "continue" prompt.
    const saved = getModulePosition(slug);
    setShowResume(saved && saved.idx > 0 ? { idx: saved.idx, total: saved.total } : null);
    Promise.all([getLearnModule(slug), listLearnModules(), listPractices()])
      .then(([m, list, practices]) => {
        setModule(m);
        const ordered = [...list].sort((a, b) => a.order - b.order);
        setSiblings(ordered);
        setFirstPractice(practices[0] ?? null);
        // First-time gate — if the requested module isn't the next
        // unread one in canonical order, redirect back to Learn so
        // the user can't bypass the sequence via URL bar.
        const read = getReadModules();
        const nextUnread = ordered.find((mm) => !read.includes(mm.slug));
        const allDone = !nextUnread;
        if (!allDone && nextUnread && nextUnread.slug !== slug && !read.includes(slug)) {
          navigate('/learn', { replace: true });
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load module'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  // Cap each slide at 4 lines, combining short consecutive stanzas
  // up to that line cap. Long stanzas get their own slide.
  const slides = useMemo(() => (module ? buildSlides(module.content, 4) : []), [module]);
  const total = slides.length;

  // Chapter map — each H2 slide opens a chapter. For any slide index
  // we can look up which chapter it belongs to so the deck header can
  // show "Chapter 2 of 4 · The Observer" — locates the reader in long
  // modules without forcing them to count slides.
  const { chapters, slideChapterIdx } = useMemo(() => {
    const chs: Array<{ title: string; firstSlide: number }> = [];
    const map: number[] = new Array(slides.length).fill(-1);
    let currentCh = -1;
    slides.forEach((s, i) => {
      if (s.kind === 'h2') {
        currentCh = chs.length;
        chs.push({ title: s.body, firstSlide: i });
      }
      map[i] = currentCh;
    });
    return { chapters: chs, slideChapterIdx: map };
  }, [slides]);

  const slideTexts = useMemo(() => slides.map(slideToText), [slides]);
  const audio = useSlideNarration(slideTexts, idx, setIdx);

  const next = siblings.findIndex((s) => s.slug === slug);
  const nextModule = next >= 0 && next < siblings.length - 1 ? siblings[next + 1] : null;

  // Persist the user's slide position so they can resume on return.
  // Clear once they reach the final slide — they finished it.
  useEffect(() => {
    if (!slug || total === 0) return;
    if (idx === total - 1) {
      clearModulePosition(slug);
    } else if (idx > 0) {
      saveModulePosition(slug, idx, total);
    }
  }, [slug, idx, total]);

  // Mark this module as read once the user reaches the final slide.
  // No nextModule + final slide = Part 1 is complete on this device.
  useEffect(() => {
    if (slug && total > 0 && idx === total - 1) markModuleRead(slug);
  }, [slug, idx, total]);

  // Keyboard navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, total - 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

  // Touch swipe.
  const touchStartX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const THRESHOLD = 40;
    if (dx <= -THRESHOLD) setIdx((i) => Math.min(i + 1, total - 1));
    else if (dx >= THRESHOLD) setIdx((i) => Math.max(i - 1, 0));
  }

  if (loading) return <div className="mok-loading">Opening…</div>;
  if (error) return <div className="mok-banner mok-banner--error">{error}</div>;
  if (!module) return null;
  if (total === 0) {
    return (
      <article className="mok-prose">
        <Link to="/learn" className="mok-nav-link">← All modules</Link>
        <p className="mok-muted">Module content is being prepared.</p>
      </article>
    );
  }

  // Resume prompt — shown when the user has a saved position. Snapped
  // to total in case the module was edited (more/fewer slides) since
  // they were last here.
  if (showResume) {
    const resumeIdx = Math.min(showResume.idx, total - 1);
    return (
      <section className="mok-rise" style={{ maxWidth: 580, margin: '0 auto', display: 'grid', gap: 20, padding: '32px 16px' }}>
        <header>
          <Link to="/learn" className="mok-nav-link">← All modules</Link>
          <p className="mok-eyebrow" style={{ marginTop: 16 }}>{module.subtitle}</p>
          <h1 className="mok-learn-deck-title" style={{ marginTop: 8 }}>{renderEmphasis(module.title)}</h1>
        </header>
        <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 12, borderLeft: '3px solid var(--accent)' }}>
          <p className="mok-eyebrow" style={{ margin: 0 }}>Pick up where you left off</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, margin: 0 }}>
            Slide {resumeIdx + 1} of {total}
          </p>
          <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', margin: 0 }}>
            Or start fresh from the beginning — either is fine.
          </p>
          <div className="mok-row" style={{ gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="mok-btn mok-btn--primary"
              onClick={() => { setIdx(resumeIdx); setShowResume(null); }}
            >
              Continue →
            </button>
            <button
              type="button"
              className="mok-btn"
              onClick={() => { setIdx(0); setShowResume(null); }}
            >
              Start from the beginning
            </button>
          </div>
        </article>
      </section>
    );
  }

  const slide = slides[idx];
  const onFirst = idx === 0;
  const onLast = idx === total - 1;

  return (
    <section className="mok-learn-deck" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Header */}
      <header className="mok-learn-deck-head">
        <div className="mok-learn-deck-toprow">
          <Link to="/learn" className="mok-nav-link">← All modules</Link>
          {audio.supported && (
            <button
              type="button"
              className={`mok-listen-toggle ${audio.enabled ? 'mok-listen-toggle--on' : ''}`}
              onClick={audio.toggle}
              aria-pressed={audio.enabled}
              aria-label={audio.enabled ? 'Mute narration' : 'Listen to this module'}
            >
              <span aria-hidden="true">{audio.enabled ? '🔊' : '🔈'}</span>
              {audio.enabled ? 'Mute' : 'Listen'}
            </button>
          )}
        </div>
        <div className="mok-learn-deck-titleblock">
          <p className="mok-eyebrow" style={{ marginTop: 10 }}>{module.subtitle}</p>
          <h1 className="mok-learn-deck-title">{renderEmphasis(module.title)}</h1>
          {/* Chapter locator — shown only when the module is divided into
              multiple H2 chapters. Helps the reader feel where they are.
              A hidden placeholder reserves the row when no chapter is
              active, so the slide stage doesn't visibly shift between
              slides inside the same module. */}
          {chapters.length > 1 && (
            slideChapterIdx[idx] >= 0 ? (
              <p className="mok-learn-deck-chapter">
                Chapter {slideChapterIdx[idx] + 1} of {chapters.length}
                <span className="mok-subtle"> · </span>
                <em>{chapters[slideChapterIdx[idx]].title}</em>
              </p>
            ) : (
              <p
                className="mok-learn-deck-chapter"
                aria-hidden="true"
                style={{ visibility: 'hidden' }}
              >
                &nbsp;
              </p>
            )
          )}
        </div>
      </header>

      {/* 5S step index — shown only on the five framework modules.
          An empty placeholder is rendered on non-5S modules so the
          slide stage stays at a consistent vertical position when
          navigating across the Learn track. */}
      {slug && ['source', 'seed', 'soil', 'seasons', 'sowing'].includes(slug) ? (
        <PathIndex
          items={buildFiveSItems(slug, new Set(getReadModules()))}
          srLabel="The 5S framework"
        />
      ) : (
        <div className="mok-path-index" aria-hidden="true" />
      )}

      {/* Progress bar */}
      <div className="mok-learn-progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={idx + 1}>
        <div className="mok-learn-progress-fill" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      {/* Slide stage — clickable left/right halves */}
      <div className="mok-learn-stage">
        <button
          type="button"
          className="mok-learn-stage-zone mok-learn-stage-zone--prev"
          aria-label="Previous"
          onClick={() => setIdx((i) => Math.max(i - 1, 0))}
          disabled={onFirst}
        />
        <button
          type="button"
          className="mok-learn-stage-zone mok-learn-stage-zone--next"
          aria-label="Next"
          onClick={() => setIdx((i) => Math.min(i + 1, total - 1))}
          disabled={onLast}
        />

        <article key={idx} className="mok-learn-slide mok-slide-fade-in">
          <SlideBody
            slide={slide}
            narrating={audio.narratingIdx === idx}
            progress={audio.progress}
          />
        </article>
      </div>

      {/* Footer controls */}
      <footer className="mok-learn-deck-foot">
        <div className="mok-learn-counter">
          {idx + 1} <span className="mok-subtle">of {total}</span>
        </div>

        <div className="mok-learn-controls">
          <button
            type="button"
            className="mok-btn mok-btn--ghost"
            onClick={() => setIdx((i) => Math.max(i - 1, 0))}
            disabled={onFirst}
            aria-label="Previous slide"
          >
            ← Back
          </button>

          {onLast ? (
            nextModule ? (
              <Link to={`/learn/${nextModule.slug}`} className="mok-btn mok-btn--primary">
                Next: {nextModule.title} →
              </Link>
            ) : firstPractice ? (
              <Link
                to={`/practices/${firstPractice.key}/learn`}
                className="mok-btn mok-btn--primary"
              >
                Begin Part 2 — {firstPractice.name} →
              </Link>
            ) : (
              <Link to="/learn" className="mok-btn mok-btn--primary">
                Finish — back to all modules
              </Link>
            )
          ) : (
            <button
              type="button"
              className="mok-btn mok-btn--primary"
              onClick={() => setIdx((i) => Math.min(i + 1, total - 1))}
              aria-label="Next slide"
            >
              Next →
            </button>
          )}
        </div>
      </footer>

      <p className="mok-subtle mok-learn-hint">
        Swipe, click the slide, or use ← → keys to move through.
      </p>
    </section>
  );
}

function SlideBody({
  slide,
  narrating,
  progress,
}: {
  slide: Slide;
  narrating: boolean;
  progress: number;
}) {
  if (slide.kind === 'visual') {
    const Visual = SLIDE_VISUALS[slide.body];
    if (!Visual) return null;
    return (
      <div className="mok-learn-slide-visual">
        <Visual />
      </div>
    );
  }
  if (slide.kind === 'h1') {
    return <CoverHeading body={slide.body} narrating={narrating} />;
  }
  if (slide.kind === 'h2') {
    return <h2 className={`mok-learn-slide-h2 ${narrating ? 'mok-narrated--pulse' : ''}`}>{slide.body}</h2>;
  }
  if (slide.kind === 'h3') {
    return <h3 className={`mok-learn-slide-h3 ${narrating ? 'mok-narrated--pulse' : ''}`}>{slide.body}</h3>;
  }
  if (slide.kind === 'quote') {
    return (
      <blockquote className="mok-learn-slide-quote">
        <NarratedLines body={slide.body} narrating={narrating} progress={progress} />
      </blockquote>
    );
  }
  // prose — multiple stanzas joined with blank lines so NarratedLines
  // can render breath-paced breaks faithfully.
  const proseClass = isAffirmation(slide.body)
    ? 'mok-learn-slide-affirmation'
    : 'mok-learn-slide-prose';
  return (
    <div className={proseClass}>
      <NarratedLines body={slide.body} narrating={narrating} progress={progress} />
    </div>
  );
}

/** Structured cover slide. Parses the H1 body into eyebrow + name +
 *  (optional) descriptor and renders each in its own typographic
 *  register, so "S1 — Source · Who You Truly Are" reads as:
 *
 *       S1                ← eyebrow (small caps, accent)
 *       Source            ← name   (big display)
 *       Who You Truly Are ← descriptor (serif italic, muted)
 *
 *  Same shape for "Practice 1 — I M Breathing".
 */
function CoverHeading({ body, narrating }: { body: string; narrating: boolean }) {
  // Split on the first em-dash (or hyphen with surrounding spaces).
  const dashSplit = body.split(/\s+—\s+|\s+-\s+/);
  const hasPrefix = dashSplit.length > 1;
  const prefix = hasPrefix ? dashSplit[0].trim() : '';
  const rest = hasPrefix ? dashSplit.slice(1).join(' — ').trim() : body.trim();

  // Within the rest, split on the middle dot to separate name from
  // descriptor (e.g. "Source · Who You Truly Are").
  const dotSplit = rest.split(/\s+·\s+/);
  const name = dotSplit[0].trim();
  const descriptor = dotSplit.length > 1 ? dotSplit.slice(1).join(' · ').trim() : '';

  return (
    <h1 className={`mok-learn-slide-h1 ${narrating ? 'mok-narrated--pulse' : ''}`}>
      {prefix && <span className="mok-learn-slide-h1-prefix">{prefix}</span>}
      <span className="mok-learn-slide-h1-name">{name}</span>
      {descriptor && <span className="mok-learn-slide-h1-descriptor">{descriptor}</span>}
    </h1>
  );
}
