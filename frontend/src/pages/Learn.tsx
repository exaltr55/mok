import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listLearnModules, type LearnModuleSummary } from '../api/client';

export default function Learn() {
  const [modules, setModules] = useState<LearnModuleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listLearnModules()
      .then(setModules)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mok-loading">Loading…</div>;

  return (
    <section>
      <p className="mok-hero-eyebrow">The 5S Framework</p>
      <h1 className="mok-section-title">Understanding before practice.</h1>
      <p className="mok-section-lede">
        Five lenses for seeing how experience arises, takes form, and unfolds —
        plus a welcome and a bridge into the 7 Practices.
      </p>

      <div className="mok-stack-sm" style={{ marginTop: 32 }}>
        {modules.map((m) => (
          <Link key={m.slug} to={`/learn/${m.slug}`} className="mok-practice-tile">
            <div className="mok-row">
              <span className="mok-chip mok-chip--accent">{m.order === 0 ? 'Welcome' : `Module ${m.order}`}</span>
              <span className="mok-spacer" />
            </div>
            <h3 className="mok-practice-tile-name" style={{ marginTop: 12 }}>{m.title}</h3>
            <p className="mok-muted" style={{ fontSize: 14, margin: 0 }}>{m.subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
