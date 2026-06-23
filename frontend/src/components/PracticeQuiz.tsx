import { useEffect, useMemo, useState } from 'react';
import { getPracticeQuiz, type QuizDetail } from '../api/client';

interface Props {
  /** Practice key whose quiz to render (e.g. "breathing"). */
  practiceKey: string;
  /** Friendly name of the practice the quiz reviews (e.g. "I M Breathing"). */
  practiceName: string;
  /** Called once the user works through all questions. */
  onComplete: () => void;
  /** Called if the user chooses to skip the quiz. */
  onSkip?: () => void;
}

const REVEAL_DELAY_MS = 5000;

/** Closing celebration lines shown after the last question — one is
 *  picked at random so the experience feels alive, not canned. The
 *  voice is warm and a little playful: we mean business, but we have
 *  fun on the way. */
const CELEBRATION_LINES = [
  'Beautiful. The thread is yours again.',
  'Look at that — review done. Off we go.',
  'Three carried forward. Nicely done.',
  'You showed up. That counts for everything.',
  'Memory refreshed. The practice continues.',
];

function pickCelebration(): string {
  return CELEBRATION_LINES[Math.floor(Math.random() * CELEBRATION_LINES.length)];
}

export function PracticeQuiz({ practiceKey, practiceName, onComplete, onSkip }: Props) {
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  // Pick a closing line once per quiz run.
  const celebrationLine = useMemo(() => pickCelebration(), [practiceKey]);

  useEffect(() => {
    let cancelled = false;
    setQuiz(null);
    setError(null);
    setIdx(0);
    setRevealed(false);
    setCelebrating(false);
    getPracticeQuiz(practiceKey)
      .then((d) => {
        if (!cancelled) setQuiz(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Quiz unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [practiceKey]);

  useEffect(() => {
    if (!quiz) return;
    setRevealed(false);
    const t = window.setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [quiz, idx]);

  if (error) {
    return (
      <section className="mok-rise" style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <p className="mok-muted" style={{ fontStyle: 'italic' }}>
          The quiz couldn't load right now. {onSkip && 'Continuing to the lesson.'}
        </p>
        {onSkip && (
          <button type="button" className="mok-btn mok-btn--primary" onClick={onSkip}>
            Continue →
          </button>
        )}
      </section>
    );
  }

  if (!quiz) {
    return <div className="mok-loading">Preparing a short review…</div>;
  }

  if (quiz.questions.length === 0) {
    onComplete();
    return null;
  }

  const total = quiz.questions.length;
  const q = quiz.questions[idx];
  const isLast = idx === total - 1;

  function handleNext() {
    if (!revealed) return;
    if (isLast) {
      // Pause on a warm closing screen so the user feels celebrated
      // before being handed back into the lesson.
      setCelebrating(true);
      return;
    }
    setIdx((i) => i + 1);
  }

  if (celebrating) {
    return (
      <section
        className="mok-rise"
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '32px 16px',
          display: 'grid',
          gap: 22,
          textAlign: 'center',
        }}
      >
        <header style={{ display: 'grid', gap: 6 }}>
          <p className="mok-eyebrow" style={{ margin: 0 }}>
            Nice review · {practiceName}
          </p>
        </header>

        <div
          className="mok-card mok-card--padded"
          style={{ display: 'grid', gap: 16, justifyItems: 'center' }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
              color: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 28,
              lineHeight: 1,
            }}
          >
            ✓
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-editorial)',
              fontStyle: 'italic',
              fontSize: 24,
              fontWeight: 400,
              lineHeight: 1.35,
              letterSpacing: '-0.005em',
              margin: 0,
              color: 'var(--text)',
              maxWidth: '24em',
            }}
          >
            {celebrationLine}
          </h2>
          <p
            className="mok-muted"
            style={{ fontSize: 14, fontStyle: 'italic', margin: 0, maxWidth: '28em' }}
          >
            Showing up matters more than getting it perfect. That's the practice.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            className="mok-btn mok-btn--primary mok-btn--lg"
            onClick={onComplete}
          >
            On to the lesson →
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="mok-rise"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '24px 16px',
        display: 'grid',
        gap: 22,
      }}
    >
      <header style={{ display: 'grid', gap: 8, textAlign: 'center' }}>
        <p className="mok-eyebrow" style={{ margin: 0 }}>
          Quick review · {practiceName}
        </p>
        <p
          className="mok-muted"
          style={{ margin: 0, fontStyle: 'italic', fontSize: 13 }}
        >
          {idx + 1} of {total} · answer drops in a few seconds
        </p>
      </header>

      <div
        className="mok-card mok-card--padded"
        style={{ display: 'grid', gap: 20, textAlign: 'center' }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 400,
            lineHeight: 1.35,
            letterSpacing: '-0.005em',
            margin: 0,
            color: 'var(--text)',
          }}
        >
          {q.question}
        </h2>

        <div
          aria-live="polite"
          style={{
            minHeight: 96,
            display: 'grid',
            placeItems: 'center',
            transition: 'opacity 0.6s ease-out',
            opacity: revealed ? 1 : 0,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-editorial)',
              fontStyle: 'italic',
              fontSize: 18,
              lineHeight: 1.5,
              margin: 0,
              color: 'var(--text-muted)',
              maxWidth: '32em',
            }}
          >
            {q.answer}
          </p>
        </div>

        {!revealed && (
          <div
            aria-hidden="true"
            style={{
              height: 3,
              background: 'var(--border)',
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              key={idx}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--accent)',
                transformOrigin: 'left center',
                animation: `mok-quiz-reveal-bar ${REVEAL_DELAY_MS}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>

      <div
        className="mok-row"
        style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
      >
        {onSkip ? (
          <button type="button" className="mok-btn mok-btn--ghost" onClick={onSkip}>
            Skip review
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="mok-btn mok-btn--primary"
          onClick={handleNext}
          disabled={!revealed}
        >
          {isLast ? 'Wrap up →' : 'Next →'}
        </button>
      </div>

      <style>{`
        @keyframes mok-quiz-reveal-bar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </section>
  );
}
