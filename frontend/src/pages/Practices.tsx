import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getDashboard,
  getTodaySummary,
  listPractices,
  type DashboardData,
  type PracticeSummary,
} from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';
import { getReadPracticeDaily, getReadPracticeLearn } from '../utils/learnProgress';

export default function Practices() {
  const [practices, setPractices] = useState<PracticeSummary[]>([]);
  const [practicedToday, setPracticedToday] = useState<string[]>([]);
  const [history, setHistory] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      listPractices(),
      getTodaySummary().catch(() => null),
      getDashboard().catch(() => null as DashboardData | null),
    ])
      .then(([p, t, d]) => {
        setPractices(p);
        setPracticedToday(t?.practiced_today ?? []);
        if (d) {
          const map: Record<string, string | null> = {};
          for (const b of d.by_practice) map[b.key] = b.last_practiced;
          setHistory(map);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load practices'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mok-loading">Loading…</div>;
  if (error) return <div className="mok-banner mok-banner--error">{error}</div>;

  // Read-state is localStorage-backed; reading here at render time picks
  // up any progress made elsewhere in the session.
  const readLearn = getReadPracticeLearn();
  const readDaily = getReadPracticeDaily();

  return (
    <section className="mok-rise">
      <header style={{ padding: '32px 0 28px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
        <p className="mok-eyebrow">Practices</p>
        <h1 className="mok-section-title">Seven doorways.</h1>
        <p className="mok-section-lede">
          Walk through one. Walk through three. Walk through none — and still the practice is
          with you. One log per practice per day.
        </p>
      </header>

      <div className="mok-practice-grid">
        {practices.map((p, idx) => {
          const key = p.key as PracticeKey;
          const Art = PracticeArt[key];
          const color = PRACTICE_COLORS[key];
          const done = practicedToday.includes(p.key);
          const everPracticed = !!history[p.key];
          const partARead = readLearn.includes(p.key);
          const partBRead = readDaily.includes(p.key);
          const bothRead = partARead && partBRead;
          // CTA flow follows reading + practice state:
          //   - Never read Part A → "Read the practice"
          //   - Part A read, Part B not → "Continue with Part B"
          //   - Both read or ever practiced → "Read" + "Begin"
          const sessionHref = p.key === 'writing' ? '/journal' : `/practices/${p.key}/session`;
          const showBeginPair = bothRead || everPracticed;
          return (
            <article key={p.key} className="mok-practice-tile">
              {done ? (
                <span className="mok-practice-tile-badge">✓ today</span>
              ) : bothRead && !everPracticed ? (
                <span className="mok-practice-tile-badge mok-practice-tile-badge--read">✓ read</span>
              ) : partARead && !partBRead ? (
                <span className="mok-practice-tile-badge mok-practice-tile-badge--read">Part A read</span>
              ) : null}
              <header className="mok-practice-tile-head">
                <div className="mok-practice-tile-art">
                  <Art color={color} size={48} />
                </div>
                <h3 className="mok-practice-tile-name">
                  <span className="mok-practice-tile-num">P{idx + 1}</span>
                  {p.name}
                </h3>
              </header>
              <p className="mok-practice-tile-desc">{p.description}</p>
              <p className="mok-practice-tile-meta">
                {p.session_min === p.session_max ? `${p.session_min} min` : `${p.session_min}–${p.session_max} min`}
              </p>
              <div className="mok-practice-tile-actions">
                {showBeginPair ? (
                  <>
                    <Link to={`/practices/${p.key}`} className="mok-btn">Read</Link>
                    <Link to={sessionHref} className="mok-btn mok-btn--primary">Begin</Link>
                  </>
                ) : partARead ? (
                  <Link to={`/practices/${p.key}/daily`} className="mok-btn mok-btn--primary">
                    Continue with Part B
                  </Link>
                ) : (
                  <Link to={`/practices/${p.key}`} className="mok-btn mok-btn--primary">
                    Read the practice
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
