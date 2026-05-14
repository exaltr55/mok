import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLearnModule, type LearnModule } from '../api/client';

export default function LearnModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const [module, setModule] = useState<LearnModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getLearnModule(slug)
      .then(setModule)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load module'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="mok-loading">Opening…</div>;
  if (error) return <div className="mok-banner mok-banner--error">{error}</div>;
  if (!module) return null;

  return (
    <article className="mok-prose">
      <Link to="/learn" className="mok-nav-link">← All modules</Link>
      <p className="mok-hero-eyebrow" style={{ marginTop: 14 }}>{module.subtitle}</p>
      <h1 className="mok-section-title" style={{ fontSize: 40 }}>{module.title}</h1>
      <ModuleBody content={module.content} />
    </article>
  );
}

function ModuleBody({ content }: { content: string }) {
  if (!content) return <p className="mok-muted">Module content is being prepared.</p>;
  const stanzas = content.split(/\n\s*\n/);
  return (
    <>
      {stanzas.map((s, i) => {
        if (s.startsWith('# ')) return <h2 key={i} style={{ fontFamily: 'var(--font-display)' }}>{s.slice(2)}</h2>;
        if (s.startsWith('## ')) return <h3 key={i}>{s.slice(3)}</h3>;
        if (s.startsWith('> ')) {
          return (
            <blockquote
              key={i}
              style={{
                borderLeft: '3px solid var(--accent)',
                paddingLeft: 16,
                margin: '14px 0',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              {s.slice(2)}
            </blockquote>
          );
        }
        if (/^-{3,}$/.test(s.trim())) return null;
        return (
          <p key={i} style={{ whiteSpace: 'pre-wrap', margin: '0 0 18px' }}>
            {s.split('\n').map((l) => l.replace(/  $/, '')).join('\n')}
          </p>
        );
      })}
    </>
  );
}
