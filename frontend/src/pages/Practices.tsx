import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTodaySummary, listPractices, type PracticeSummary } from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';

export default function Practices() {
  const [practices, setPractices] = useState<PracticeSummary[]>([]);
  const [practicedToday, setPracticedToday] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listPractices(), getTodaySummary().catch(() => null)])
      .then(([p, t]) => {
        setPractices(p);
        setPracticedToday(t?.practiced_today ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load practices'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mok-loading">Loading…</div>;
  if (error) return <div className="mok-banner mok-banner--error">{error}</div>;

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
        {practices.map((p) => {
          const key = p.key as PracticeKey;
          const Art = PracticeArt[key];
          const color = PRACTICE_COLORS[key];
          const done = practicedToday.includes(p.key);
          return (
            <article key={p.key} className="mok-practice-tile">
              {done && <span className="mok-practice-tile-badge">✓ today</span>}
              <div className="mok-practice-tile-art">
                <Art color={color} size={88} />
              </div>
              <h3 className="mok-practice-tile-name">{p.name}</h3>
              <p className="mok-practice-tile-desc">{p.description}</p>
              <p className="mok-practice-tile-meta">
                {p.session_min === p.session_max ? `${p.session_min} min` : `${p.session_min}–${p.session_max} min`}
              </p>
              <div className="mok-practice-tile-actions">
                <Link to={`/practices/${p.key}`} className="mok-btn">Read</Link>
                <Link
                  to={p.key === 'writing' ? '/journal' : `/practices/${p.key}/session`}
                  className="mok-btn mok-btn--primary"
                >
                  Begin
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
