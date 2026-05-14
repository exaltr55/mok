import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getProfile,
  listLearnModules,
  listPractices,
  type LearnModuleSummary,
  type PracticeSummary,
  type Profile,
} from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';

/**
 * Learn — the conceptual foundation of YouSourceful.
 *
 * Two ordered parts, presented in the same order a new practitioner moves
 * through them: first the 5S Framework (Source → Seed → Soil → Seasons →
 * Sowing → bridge), then the 7 Practice teachings (Part A of each practice).
 *
 * The first unread 5S module is highlighted at the top as a clear "start
 * here" so practitioners coming from the tour know exactly where to begin.
 */
export default function Learn() {
  const [modules, setModules] = useState<LearnModuleSummary[]>([]);
  const [practices, setPractices] = useState<PracticeSummary[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listLearnModules(), listPractices(), getProfile().catch(() => null)])
      .then(([m, p, pr]) => {
        setModules([...m].sort((a, b) => a.order - b.order));
        setPractices(p);
        setProfile(pr);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mok-loading">Loading…</div>;

  const firstModule = modules[0];
  const firstName = profile?.name?.split(' ')[0];

  return (
    <section className="mok-rise" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Hero */}
      <header style={{ padding: '24px 0 0' }}>
        <p className="mok-eyebrow">Learn</p>
        <h1 className="mok-section-title">Start here{firstName ? `, ${firstName}` : ''}.</h1>
        <p className="mok-section-lede">
          The conceptual ground, in two ordered parts. First the 5S Framework — five
          lenses for seeing how experience arises and unfolds. Then the 7 Practice
          teachings, which translate the framework into daily living.
        </p>
      </header>

      {/* Begin-here pointer */}
      {firstModule && (
        <article
          className="mok-card"
          style={{
            borderLeft: '3px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <p className="mok-eyebrow" style={{ margin: 0 }}>
              Begin with
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 400,
                margin: '6px 0 4px',
                letterSpacing: '-0.005em',
              }}
            >
              {firstModule.title}
            </h2>
            <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', margin: 0 }}>
              {firstModule.subtitle}
            </p>
          </div>
          <Link to={`/learn/${firstModule.slug}`} className="mok-btn mok-btn--primary">
            Open →
          </Link>
        </article>
      )}

      {/* Part 1 — 5S Framework */}
      <section>
        <div
          className="mok-row"
          style={{ alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}
        >
          <div>
            <p className="mok-eyebrow" style={{ margin: 0 }}>
              Part 1 of 2
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                fontWeight: 400,
                margin: '6px 0 0',
                letterSpacing: '-0.005em',
              }}
            >
              The 5S Framework
            </h2>
          </div>
          <span className="mok-subtle" style={{ fontSize: 12, fontFamily: 'var(--font-sans)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {modules.length} modules
          </span>
        </div>

        <div className="mok-stack-sm">
          {modules.map((m, i) => (
            <Link key={m.slug} to={`/learn/${m.slug}`} className="mok-learn-row">
              <span className="mok-learn-num">{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1 }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-display)',
                    fontSize: 17,
                    fontWeight: 500,
                    letterSpacing: '-0.005em',
                    color: 'var(--text)',
                  }}
                >
                  {m.title}
                </span>
                <span className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic' }}>
                  {m.subtitle}
                </span>
              </span>
              <span className="mok-subtle" style={{ fontSize: 14 }}>›</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Part 2 — 7 Practice teachings */}
      <section>
        <div
          className="mok-row"
          style={{ alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}
        >
          <div>
            <p className="mok-eyebrow" style={{ margin: 0 }}>
              Part 2 of 2
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                fontWeight: 400,
                margin: '6px 0 0',
                letterSpacing: '-0.005em',
              }}
            >
              The 7 Practices
            </h2>
            <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', marginTop: 6 }}>
              Each practice has a reading (Part A) and a guided session (Part B).
              Read first, then begin.
            </p>
          </div>
          <span className="mok-subtle" style={{ fontSize: 12, fontFamily: 'var(--font-sans)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {practices.length} practices
          </span>
        </div>

        <div className="mok-stack-sm">
          {practices.map((p, i) => {
            const key = p.key as PracticeKey;
            const Art = PracticeArt[key];
            const color = PRACTICE_COLORS[key];
            return (
              <Link key={p.key} to={`/practices/${p.key}`} className="mok-learn-row">
                <span className="mok-learn-num">{String(i + 1).padStart(2, '0')}</span>
                <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Art color={color} size={28} />
                  <span>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-display)',
                        fontSize: 17,
                        fontWeight: 500,
                        letterSpacing: '-0.005em',
                        color: 'var(--text)',
                      }}
                    >
                      {p.name}
                    </span>
                    <span className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic' }}>
                      {p.description}
                    </span>
                  </span>
                </span>
                <span className="mok-subtle" style={{ fontSize: 14 }}>›</span>
              </Link>
            );
          })}
        </div>
      </section>
    </section>
  );
}
