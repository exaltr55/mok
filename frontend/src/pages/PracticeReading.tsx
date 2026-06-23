import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getPractice, type PracticeDetail as PracticeDetailT } from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';
import PathIndex, { buildSevenPItems } from '../components/PathIndex';
import { parsePractice } from '../utils/practiceContent';
import { useSlideNarration } from '../hooks/useSlideNarration';
import NarratedLines from '../components/NarratedLines';
import {
  getReadPracticeLearn,
  markPracticeDailyRead,
  markPracticeLearnRead,
} from '../utils/learnProgress';
import { getQuizPendingFor, markQuizCompleted, setQuizPending } from '../utils/quizProgress';
import { PracticeQuiz } from '../components/PracticeQuiz';

const PRACTICE_NAMES: Record<string, string> = {
  breathing: 'I M Breathing',
  thinking: 'I M Thinking',
  talking: 'I M Talking',
  writing: 'I M Writing',
  moving: 'I M Moving',
  resetting: 'I M Resetting',
  aligning: 'I M Aligning',
};

/**
 * Reads ONE part of a practice as its own slideshow:
 *   - /practices/:key/learn  → Part 1 — Learning the practice
 *   - /practices/:key/daily  → Part 2 — The daily practice
 *
 * The final slide leads to the next step in the natural sequence:
 *   - learn  →  Read Part 2 (the daily practice)
 *   - daily  →  Begin the guided session
 */

type Part = 'learn' | 'daily';
type SlideKind = 'h1' | 'h2' | 'h3' | 'quote' | 'prose' | 'cta';

interface Slide {
  kind: SlideKind;
  body: string;
  eyebrow?: string;
}

function isMetaLine(line: string): boolean {
  const s = line.trim();
  if (!s) return false;
  if (s.includes('Surface:')) return true;
  if (/^>?\s*Module\s+\d/i.test(s)) return true;
  if (/preserve the breath/i.test(s)) return true;
  if (/two trailing spaces/i.test(s)) return true;
  if (/soft line breaks within/i.test(s)) return true;
  if (/^\(.*docs\//.test(s)) return true;
  // Bracketed stage directions like "[Narrator voiceover. Tone shifts ...]"
  if (/^\[.*\]$/.test(s)) return true;
  // "Full Script — Narrator Voiceover" engineer header
  if (/^Full Script\b/i.test(s)) return true;
  return false;
}

/** Split a multi-line stanza into chunks no taller than the cap.
 *  Used when a single source stanza exceeds MAX_LINES so the slide
 *  still respects the visual rhythm. */
function splitToMaxLines(stanza: string, cap: number): string[] {
  const lines = stanza.split('\n').filter((l) => l.trim());
  if (lines.length <= cap) return [stanza];
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += cap) {
    chunks.push(lines.slice(i, i + cap).join('\n'));
  }
  return chunks;
}

/** Slide-builder for practice content. Combines short consecutive
 *  stanzas into one slide up to MAX_LINES, then flushes. Long stanzas
 *  (≥ MAX_LINES on their own) get their own slide. This balances
 *  breath-cadence with reasonable total slide counts. */
function stanzasToSlides(content: string, MAX_LINES = 4): Slide[] {
  if (!content) return [];
  const stanzas = content
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => {
      if (!s) return false;
      if (/^-{3,}$/.test(s)) return false;
      if (/^Part\s*[AB]\b/i.test(s)) return false;
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

function slideToText(slide: Slide): string {
  if (slide.kind === 'cta') return slide.body;
  return slide.body.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Detect affirmation stanzas (any prose stanza whose first non-empty
 *  line starts with "I am") so we can render them in the editorial
 *  serif as a visual cue that this is something to repeat or absorb. */
function isAffirmation(body: string): boolean {
  const first = body.split('\n').map((l) => l.trim()).find(Boolean);
  return !!first && /^I am\b/.test(first);
}

interface Props {
  part: Part;
}

/** Sub-modules for I M Moving — Part B is split into focused
 *  modules so the user can pick one without being overwhelmed. */
const MOVING_SUBMODULES: Array<{
  key: string;
  label: string;
  blurb: string;
  duration: string;
}> = [
  { key: 'prep',    label: 'Before You Begin',  blurb: 'A few simple things to set up the practice well.', duration: '2 min' },
  { key: 'yoga',    label: 'Yoga Postures',     blurb: 'Ten gentle postures to open and steady the body.', duration: '15–20 min' },
  { key: 'walking', label: 'Mindful Walking',   blurb: 'Slow and natural-pace walking with full attention.', duration: '5–10 min' },
  { key: 'squats',  label: 'Squats',            blurb: 'A short, foundational sequence to rebuild ground connection.', duration: '5 min' },
];

const MOVING_SUBMODULE_TITLES: Record<string, string> = {
  prep:    'Before You Begin',
  yoga:    'Yoga Postures',
  walking: 'Mindful Walking',
  squats:  'Squats',
};

/** Extract just one ## H2 section from the Part B markdown by title. */
function extractMovingSection(session: string, title: string): string {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^## ${escaped}\\s*$`, 'm');
  const m = session.match(re);
  if (!m || m.index === undefined) return session;
  const after = session.slice(m.index + m[0].length);
  const nextH2 = after.match(/^## /m);
  const end = nextH2 && nextH2.index !== undefined
    ? m.index + m[0].length + nextH2.index
    : session.length;
  return session.slice(m.index, end);
}

export default function PracticeReading({ part }: Props) {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const movingSection = searchParams.get('section') || '';
  const [data, setData] = useState<PracticeDetailT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);

  // Quiz gate: if a quiz is queued for a *different* practice, show
  // it first when the user opens Part A. The pending key is captured
  // once per mount so completing or skipping the quiz immediately
  // falls through to the lesson without re-triggering.
  const [pendingQuizKey, setPendingQuizKey] = useState<string | null>(null);
  const [quizDismissed, setQuizDismissed] = useState(false);

  // First-time gate: prevent direct navigation to Part B until Part A
  // has been read at least once. After Part A is read, both parts are
  // freely navigable.
  useEffect(() => {
    if (!key || part !== 'daily') return;
    if (!getReadPracticeLearn().includes(key)) {
      navigate(`/practices/${key}/learn`, { replace: true });
    }
  }, [key, part, navigate]);

  useEffect(() => {
    if (!key) return;
    setLoading(true);
    setIdx(0);
    setQuizDismissed(false);
    setPendingQuizKey(part === 'learn' ? getQuizPendingFor(key) : null);
    getPractice(key)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load practice'))
      .finally(() => setLoading(false));
  }, [key, part]);

  const parsed = useMemo(() => (data ? parsePractice(data.content) : null), [data]);

  const slides = useMemo<Slide[]>(() => {
    if (!parsed || !data) return [];

    let sectionSource =
      part === 'learn'
        ? [parsed.intro, parsed.learn].filter(Boolean).join('\n\n')
        : parsed.session;

    // For I M Moving's Part B, when a sub-module is requested via
    // ?section=…, narrow the slide content to just that sub-module so
    // the user can focus on one thing at a time.
    if (key === 'moving' && part === 'daily' && movingSection) {
      const title = MOVING_SUBMODULE_TITLES[movingSection];
      if (title) sectionSource = extractMovingSection(sectionSource, title);
    }

    // Cap each slide at 4 lines, combining short consecutive stanzas
    // up to that line cap. Long stanzas get their own slide.
    const bodySlides = stanzasToSlides(sectionSource, 4);
    const deck: Slide[] = [...bodySlides];

    // Final CTA slide tailored to which part this is. Kept short and
    // softer-weight (see mok-learn-slide-cta-body) so it reads as a
    // gentle bridge into the next step rather than a heading.
    const practiceName = data.name;
    if (part === 'learn') {
      deck.push({
        kind: 'cta',
        body: `You have learned about ${practiceName} — now let's do it.`,
        eyebrow: 'Part B',
      });
    } else {
      deck.push({
        kind: 'cta',
        body: `You have learned how to do ${practiceName} — now let's begin.`,
        eyebrow: 'Ready',
      });
    }
    return deck;
  }, [parsed, data, part]);

  const total = slides.length;
  const slideTexts = useMemo(() => slides.map(slideToText), [slides]);
  const audio = useSlideNarration(slideTexts, idx, setIdx);

  // Mark this part read once the user reaches the final (CTA) slide —
  // lets the Learn page's "Begin with" pointer walk Part 1 → Part 2 →
  // next practice in order. Also queues this practice's review quiz
  // so it fires when the user opens a different practice's Part A.
  useEffect(() => {
    if (!key || total === 0 || idx !== total - 1) return;
    if (part === 'learn') {
      markPracticeLearnRead(key);
      setQuizPending(key);
    } else {
      markPracticeDailyRead(key);
    }
  }, [part, key, idx, total]);

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

  if (loading) return <div className="mok-loading">Opening the practice…</div>;
  if (error || !data) return <div className="mok-banner mok-banner--error">{error || 'Not found'}</div>;

  // Review quiz gate: if a previous practice's quiz is queued, run it
  // before the lesson loads. Only fires on Part A, only the first time
  // (markQuizCompleted clears the pending slot).
  if (pendingQuizKey && !quizDismissed) {
    return (
      <PracticeQuiz
        practiceKey={pendingQuizKey}
        practiceName={PRACTICE_NAMES[pendingQuizKey] ?? pendingQuizKey}
        onComplete={() => {
          markQuizCompleted(pendingQuizKey);
          setQuizDismissed(true);
        }}
        onSkip={() => {
          markQuizCompleted(pendingQuizKey);
          setQuizDismissed(true);
        }}
      />
    );
  }

  // Sub-module chooser for I M Moving's Part B. Renders before any
  // slideshow logic — three focused modules plus prep — so the user
  // can pick one without facing the whole sequence at once.
  if (key === 'moving' && part === 'daily' && !movingSection) {
    const c = PRACTICE_COLORS['moving' as PracticeKey];
    return (
      <section className="mok-rise" style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 22, padding: '24px 16px' }}>
        <header>
          <Link to={`/practices/${data.key}`} className="mok-nav-link">← Practice overview</Link>
          <p className="mok-eyebrow" style={{ marginTop: 16 }}>Part B — Doing the Practice</p>
          <h1 className="mok-section-title">{data.name}</h1>
          <p className="mok-section-lede" style={{ fontStyle: 'italic' }}>
            Walk the three forms in sequence — postures, then walking,
            then squatting. Begin with the prep below.
          </p>
        </header>

        <div style={{ display: 'grid', gap: 12 }}>
          {MOVING_SUBMODULES.map((sub, i) => {
            // Prep is setup, not a step in the sequence — show "Prep"
            // instead of a step number so the three forms (1·2·3) line
            // up as the canonical learning order.
            const stepLabel = sub.key === 'prep' ? 'Prep' : `Step ${i}`;
            return (
              <Link
                key={sub.key}
                to={`/practices/moving/daily?section=${sub.key}`}
                className="mok-card mok-card--padded"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  borderLeft: `3px solid ${c}`,
                }}
              >
                <div className="mok-row" style={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span
                      className="mok-eyebrow"
                      style={{ color: c, fontSize: 11, letterSpacing: '0.22em' }}
                    >
                      {stepLabel}
                    </span>
                    <h2
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 20,
                        fontWeight: 500,
                        letterSpacing: '-0.005em',
                        margin: 0,
                      }}
                    >
                      {sub.label}
                    </h2>
                  </div>
                  <span className="mok-subtle" style={{ fontSize: 12, fontFamily: 'var(--font-sans)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                    {sub.duration}
                  </span>
                </div>
                <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', margin: '6px 0 0' }}>
                  {sub.blurb}
                </p>
              </Link>
            );
          })}
        </div>

        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
          Each module ends by pointing to the next — read them in order the first time.
        </p>
      </section>
    );
  }

  if (total <= 1) {
    // Only the CTA slide — no body content found.
    return (
      <article className="mok-prose">
        <Link to={`/practices/${data.key}`} className="mok-nav-link">← Practice overview</Link>
        <p className="mok-muted">This section is being prepared. Try the other part for now.</p>
      </article>
    );
  }

  const k = data.key as PracticeKey;
  const Art = PracticeArt[k];
  const color = PRACTICE_COLORS[k];

  // Clamp idx to a valid index. When the user navigates between
  // practices or between Part A and Part B, the slides array changes
  // before the useEffect that resets idx fires — so for one render
  // idx can be larger than the new slides.length, which previously
  // crashed with "Cannot read properties of undefined (reading 'kind')".
  const safeIdx = Math.max(0, Math.min(idx, total - 1));
  const slide = slides[safeIdx];
  if (!slide) {
    return <div className="mok-loading">Opening the practice…</div>;
  }
  const onFirst = safeIdx === 0;
  const onLast = safeIdx === total - 1;
  const sessionHref = data.key === 'writing' ? '/journal' : `/practices/${data.key}/session`;
  const nextPartHref = `/practices/${data.key}/daily`;

  let partLabel = part === 'learn'
    ? 'Part A — Learning the practice (what)'
    : 'Part B — Doing the practice (how)';
  // When reading one of Moving's sub-modules, surface which one in
  // the header so the user knows where they are.
  if (key === 'moving' && part === 'daily' && movingSection) {
    const t = MOVING_SUBMODULE_TITLES[movingSection];
    if (t) partLabel = `Part B · ${t}`;
  }

  // Back link — Moving sub-modules go back to the chooser; everything
  // else goes back to the practice overview.
  const backHref = (key === 'moving' && part === 'daily' && movingSection)
    ? '/practices/moving/daily'
    : `/practices/${data.key}`;
  const backLabel = (key === 'moving' && part === 'daily' && movingSection)
    ? '← All modules'
    : '← Practice overview';

  // What does the final CTA button do?
  // For Moving Part B, after a sub-module is read the CTA points to
  // the NEXT sub-module in canonical sequence (prep → yoga postures →
  // walking → squats → guided session) — so first-time learners walk
  // the modules in order without having to navigate back to a chooser.
  let movingNextCta: { label: string; to: string } | null = null;
  if (key === 'moving' && movingSection) {
    const seqIdx = MOVING_SUBMODULES.findIndex((m) => m.key === movingSection);
    const next = seqIdx >= 0 ? MOVING_SUBMODULES[seqIdx + 1] : undefined;
    movingNextCta = next
      ? { label: `Next: ${next.label} →`, to: `/practices/moving/daily?section=${next.key}` }
      : { label: 'Begin guided session →', to: sessionHref };
  }

  const finalCta =
    part === 'learn'
      ? { label: 'Doing the practice →', to: nextPartHref }
      : movingNextCta
        ?? { label: 'Begin guided session →', to: sessionHref };

  return (
    <section className="mok-learn-deck" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Header */}
      <header className="mok-learn-deck-head">
        <div className="mok-learn-deck-toprow">
          <Link to={backHref} className="mok-nav-link">{backLabel}</Link>
          {audio.supported && (
            <button
              type="button"
              className={`mok-listen-toggle ${audio.enabled ? 'mok-listen-toggle--on' : ''}`}
              onClick={audio.toggle}
              aria-pressed={audio.enabled}
              aria-label={audio.enabled ? 'Mute narration' : 'Listen to this section'}
            >
              <span aria-hidden="true">{audio.enabled ? '🔊' : '🔈'}</span>
              {audio.enabled ? 'Mute' : 'Listen'}
            </button>
          )}
        </div>
        <div className="mok-learn-deck-titleblock">
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <Art color={color} size={40} />
          </div>
          <p className="mok-eyebrow" style={{ marginTop: 8 }}>{partLabel}</p>
          <h1 className="mok-learn-deck-title">{data.name}</h1>
        </div>
      </header>

      {/* 7-Practice step index — anchors the user in the sequence. Each
          pill links to that practice's Part 1 teaching; locked until
          the previous practice's Part 1 has been read. */}
      {key && (
        <PathIndex
          items={buildSevenPItems(key, new Set(getReadPracticeLearn()))}
          srLabel="The 7 practices"
        />
      )}

      {/* Progress */}
      <div className="mok-learn-progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={idx + 1}>
        <div className="mok-learn-progress-fill" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      {/* Stage */}
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
            finalCta={finalCta}
          />
        </article>
      </div>

      {/* Footer */}
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

          {/* On the CTA slide, the slide itself carries the action button. */}
          {!onLast && (
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
        Swipe, click the page, or use ← → keys to move through.
      </p>

      {/* Quiet bottom escape: back to overview. */}
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button
          type="button"
          className="mok-btn mok-btn--ghost"
          onClick={() => navigate(`/practices/${data.key}`)}
        >
          Practice overview
        </button>
      </div>
    </section>
  );
}

function SlideBody({
  slide,
  narrating,
  progress,
  finalCta,
}: {
  slide: Slide;
  narrating: boolean;
  progress: number;
  finalCta: { label: string; to: string };
}) {
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
  if (slide.kind === 'cta') {
    return (
      <div style={{ textAlign: 'center' }}>
        {slide.eyebrow && (
          <p className="mok-eyebrow" style={{ marginBottom: 14, letterSpacing: '0.22em' }}>
            {slide.eyebrow}
          </p>
        )}
        <p className={`mok-learn-slide-cta-body ${narrating ? 'mok-narrated--pulse' : ''}`}>
          {slide.body}
        </p>
        <Link to={finalCta.to} className="mok-btn mok-btn--primary mok-btn--lg">
          {finalCta.label}
        </Link>
      </div>
    );
  }
  const proseClass = isAffirmation(slide.body)
    ? 'mok-learn-slide-affirmation'
    : 'mok-learn-slide-prose';
  return (
    <div className={proseClass}>
      <NarratedLines body={slide.body} narrating={narrating} progress={progress} />
    </div>
  );
}

/** Structured cover slide. Same shape used in LearnModule — parses
 *  "Prefix — Name · Descriptor" and renders three typographic levels. */
function CoverHeading({ body, narrating }: { body: string; narrating: boolean }) {
  const dashSplit = body.split(/\s+—\s+|\s+-\s+/);
  const hasPrefix = dashSplit.length > 1;
  const prefix = hasPrefix ? dashSplit[0].trim() : '';
  const rest = hasPrefix ? dashSplit.slice(1).join(' — ').trim() : body.trim();
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
