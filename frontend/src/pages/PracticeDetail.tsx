import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getDashboard,
  getPractice,
  logPractice,
  type PracticeDetail as PracticeDetailT,
} from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';
import { getReadPracticeLearn } from '../utils/learnProgress';
// note: route children (Reading) live in App.tsx; this page is the TOC.

/**
 * Practice overview — a small "table of contents" page.
 *
 *   Part 1 — Learning the practice   →  /practices/:key/learn  (slideshow)
 *   Part 2 — The daily practice      →  /practices/:key/daily  (slideshow)
 *   Begin guided session             →  /practices/:key/session
 *
 * For first-time readers of a practice, only Part 1 is offered as the
 * primary action so they read before practicing. For practitioners who
 * have already logged this practice at least once, Part 2 and the guided
 * session are surfaced equally — they can revisit either at any time.
 */
export default function PracticeDetail() {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PracticeDetailT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [everPracticed, setEverPracticed] = useState<boolean | null>(null);
  const [logState, setLogState] = useState<'idle' | 'submitting' | 'logged'>('idle');
  const [logError, setLogError] = useState('');

  useEffect(() => {
    if (!key) return;
    setLoading(true);
    Promise.all([
      getPractice(key),
      getDashboard().catch(() => null),
    ])
      .then(([d, dash]) => {
        setData(d);
        const entry = dash?.by_practice.find((b) => b.key === key);
        setEverPracticed(!!entry?.last_practiced);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load practice'))
      .finally(() => setLoading(false));
  }, [key]);

  async function recordSelfPractice() {
    if (!key) return;
    setLogState('submitting');
    setLogError('');
    try {
      await logPractice(key, { source: 'self_log' });
      setLogState('logged');
      setTimeout(() => navigate('/today'), 1200);
    } catch (err) {
      setLogError(err instanceof Error ? err.message : 'Could not log practice');
      setLogState('idle');
    }
  }

  const sessionHref = useMemo(
    () => (data?.key === 'writing' ? '/journal' : `/practices/${data?.key}/session`),
    [data?.key],
  );

  if (loading) return <div className="mok-loading">Opening the practice…</div>;
  if (error || !data) return <div className="mok-banner mok-banner--error">{error || 'Not found'}</div>;

  const k = data.key as PracticeKey;
  const Art = PracticeArt[k];
  const color = PRACTICE_COLORS[k];
  const isNewToPractice = everPracticed === false;
  // Part B stays locked until Part A has been read at least once.
  // After that, both parts are freely navigable.
  const partARead = getReadPracticeLearn().includes(data.key);

  return (
    <section className="mok-practice-toc mok-rise">
      {/* Header */}
      <header className="mok-practice-toc-head">
        <Link to="/practices" className="mok-nav-link">← All practices</Link>
        <div className="mok-practice-toc-art" style={{ color }}>
          <Art color={color} size={56} />
        </div>
        <p className="mok-eyebrow" style={{ marginTop: 6 }}>Practice</p>
        <h1 className="mok-practice-toc-title">{data.name}</h1>
        <p className="mok-practice-toc-desc">{data.description}</p>
        <p className="mok-subtle" style={{ fontSize: 12, marginTop: 8 }}>
          {data.format} · {data.session_min}–{data.session_max} min
        </p>
      </header>

      {/* Guidance lede for first-time readers */}
      {isNewToPractice && (
        <p className="mok-muted" style={{ fontStyle: 'italic', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
          Two short readings before the guided session — first the what,
          then the how. The session opens after.
        </p>
      )}

      {/* The two parts as separate cards */}
      <div className="mok-practice-toc-grid">
        <PartCard
          eyebrow="Part A"
          title="Learning the practice (what)"
          lede="The teaching behind it — what it is, and why it works."
          to={`/practices/${data.key}/learn`}
          primary={isNewToPractice}
          accent={color}
          step={1}
        />
        <PartCard
          eyebrow="Part B"
          title="Doing the practice (how)"
          lede={
            partARead
              ? 'How to do it, breath by breath — the rhythm the session walks you through.'
              : 'Read Part A first — Part B opens once you have.'
          }
          to={`/practices/${data.key}/daily`}
          primary={!isNewToPractice && partARead}
          accent={color}
          step={2}
          locked={!partARead}
        />
      </div>

      {/* Guided session — always present, emphasis varies */}
      <div className="mok-practice-toc-session">
        <p className="mok-eyebrow">Guided session</p>
        <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', margin: '6px 0 14px' }}>
          {isNewToPractice
            ? 'Read both parts above first — the session opens when you have.'
            : `${data.session_min}–${data.session_max} minutes. Begin whenever you're ready.`}
        </p>
        {isNewToPractice ? (
          <button type="button" className="mok-btn" disabled aria-disabled="true">
            Begin guided session
          </button>
        ) : (
          <Link to={sessionHref} className="mok-btn mok-btn--primary mok-btn--lg">
            Begin guided session →
          </Link>
        )}
      </div>

      {/* Quiet "I practiced outside the app" */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          className="mok-btn mok-btn--ghost"
          onClick={recordSelfPractice}
          disabled={logState !== 'idle'}
        >
          {logState === 'submitting'
            ? 'Recording…'
            : logState === 'logged'
              ? 'Recorded ✓'
              : 'I practiced outside the app'}
        </button>
        {logError && (
          <p className="mok-banner mok-banner--error" style={{ marginTop: 10 }}>{logError}</p>
        )}
      </div>
    </section>
  );
}

function PartCard({
  eyebrow,
  title,
  lede,
  to,
  primary,
  accent,
  step,
  locked = false,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  to: string;
  primary: boolean;
  accent: string;
  step: number;
  locked?: boolean;
}) {
  return (
    <article
      className={`mok-toc-card ${primary ? 'mok-toc-card--primary' : ''} ${locked ? 'mok-toc-card--locked' : ''}`}
    >
      <span className="mok-toc-card-step" style={{ color: accent }}>{step}</span>
      <p className="mok-eyebrow" style={{ margin: 0 }}>{eyebrow}</p>
      <h3 className="mok-toc-card-title">{title}</h3>
      <p className="mok-toc-card-lede">{lede}</p>
      {locked ? (
        <button type="button" className="mok-btn" disabled aria-disabled="true">
          Locked
        </button>
      ) : (
        <Link to={to} className={`mok-btn ${primary ? 'mok-btn--primary' : ''}`}>
          Read →
        </Link>
      )}
    </article>
  );
}
