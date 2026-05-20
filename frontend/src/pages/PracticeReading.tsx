import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPractice, type PracticeDetail as PracticeDetailT } from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';
import { parsePractice } from '../utils/practiceContent';
import { useSlideNarration } from '../hooks/useSlideNarration';
import NarratedLines from '../components/NarratedLines';

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
type SlideKind = 'h2' | 'h3' | 'quote' | 'prose' | 'cta';

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
  return false;
}

function stanzasToSlides(content: string, TARGET = 200): Slide[] {
  if (!content) return [];
  const stanzas = content
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => {
      if (!s) return false;
      if (/^-{3,}$/.test(s)) return false;
      if (s.startsWith('# ')) return false;
      if (/^Part\s*[AB]\b/i.test(s)) return false;
      if (s.split('\n').every(isMetaLine)) return false;
      return true;
    });

  const slides: Slide[] = [];
  let buffer: string[] = [];
  let bufferLen = 0;

  const flush = () => {
    if (!buffer.length) return;
    slides.push({ kind: 'prose', body: buffer.join('\n\n') });
    buffer = [];
    bufferLen = 0;
  };

  for (const stanza of stanzas) {
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
    buffer.push(stanza);
    bufferLen += stanza.length;
    if (bufferLen >= TARGET) flush();
  }
  flush();
  return slides;
}

function slideToText(slide: Slide): string {
  if (slide.kind === 'cta') return slide.body;
  return slide.body.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

interface Props {
  part: Part;
}

export default function PracticeReading({ part }: Props) {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PracticeDetailT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!key) return;
    setLoading(true);
    setIdx(0);
    getPractice(key)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load practice'))
      .finally(() => setLoading(false));
  }, [key, part]);

  const parsed = useMemo(() => (data ? parsePractice(data.content) : null), [data]);

  const slides = useMemo<Slide[]>(() => {
    if (!parsed || !data) return [];

    const sectionSource =
      part === 'learn'
        ? [parsed.intro, parsed.learn].filter(Boolean).join('\n\n')
        : parsed.session;

    const bodySlides = stanzasToSlides(sectionSource);
    const deck: Slide[] = [...bodySlides];

    // Final CTA slide tailored to which part this is.
    if (part === 'learn') {
      deck.push({
        kind: 'cta',
        body:
          "Now, the daily practice — what to do, breath by breath.",
        eyebrow: 'Read next',
      });
    } else {
      deck.push({
        kind: 'cta',
        body:
          "You've read the daily practice. The guided session walks you through.",
        eyebrow: 'Ready',
      });
    }
    return deck;
  }, [parsed, data, part]);

  const total = slides.length;
  const slideTexts = useMemo(() => slides.map(slideToText), [slides]);
  const audio = useSlideNarration(slideTexts, idx, setIdx);

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

  const slide = slides[idx];
  const onFirst = idx === 0;
  const onLast = idx === total - 1;
  const sessionHref = data.key === 'writing' ? '/journal' : `/practices/${data.key}/session`;
  const nextPartHref = `/practices/${data.key}/daily`;

  const partLabel = part === 'learn' ? 'Part 1 — Learning the practice' : 'Part 2 — The daily practice';

  // What does the final CTA button do?
  const finalCta =
    part === 'learn'
      ? { label: 'Read the daily practice →', to: nextPartHref }
      : { label: 'Begin guided session →', to: sessionHref };

  return (
    <section className="mok-learn-deck" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Header */}
      <header className="mok-learn-deck-head">
        <div className="mok-learn-deck-toprow">
          <Link to={`/practices/${data.key}`} className="mok-nav-link">← Practice overview</Link>
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
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <Art color={color} size={40} />
        </div>
        <p className="mok-eyebrow" style={{ marginTop: 8 }}>{partLabel}</p>
        <h1 className="mok-learn-deck-title">{data.name}</h1>
      </header>

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

        <article key={idx} className="mok-learn-slide mok-rise">
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
        <h2 className={`mok-learn-slide-h2 ${narrating ? 'mok-narrated--pulse' : ''}`} style={{ marginBottom: 18 }}>
          {slide.body}
        </h2>
        <Link to={finalCta.to} className="mok-btn mok-btn--primary mok-btn--lg">
          {finalCta.label}
        </Link>
      </div>
    );
  }
  return (
    <div className="mok-learn-slide-prose">
      <NarratedLines body={slide.body} narrating={narrating} progress={progress} />
    </div>
  );
}
