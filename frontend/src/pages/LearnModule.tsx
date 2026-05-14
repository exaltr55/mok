import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLearnModule, type LearnModule } from '../api/client';

/** Match anything that looks like an internal/engineer-facing meta note we may
 *  have accidentally left in canonical content (cross-references to docs/,
 *  formatting hints, "Module XX —" headers, etc.). The renderer strips these
 *  even if they slip back in. */
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

  const stanzas = content
    .split(/\n\s*\n/)
    // Drop horizontal rules, the leading H1 (we already show the title), and
    // any blockquote / line that looks like engineer-facing metadata.
    .filter((s) => {
      const trimmed = s.trim();
      if (!trimmed) return false;
      if (/^-{3,}$/.test(trimmed)) return false;
      if (trimmed.startsWith('# ')) return false;
      if (trimmed.split('\n').every(isMetaLine)) return false;
      return true;
    });

  return (
    <>
      {stanzas.map((s, i) => {
        if (s.startsWith('## ')) return <h2 key={i} style={{ fontFamily: 'var(--font-display)' }}>{s.slice(3)}</h2>;
        if (s.startsWith('### ')) return <h3 key={i}>{s.slice(4)}</h3>;
        if (s.startsWith('> ')) {
          // Strip any meta-lines from the blockquote body; only render what remains.
          const kept = s
            .split('\n')
            .map((l) => l.replace(/^>\s?/, ''))
            .filter((l) => !isMetaLine(l));
          if (kept.length === 0) return null;
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
              {kept.join('\n')}
            </blockquote>
          );
        }
        return (
          <p key={i} style={{ whiteSpace: 'pre-wrap', margin: '0 0 18px' }}>
            {s.split('\n').map((l) => l.replace(/  $/, '')).join('\n')}
          </p>
        );
      })}
    </>
  );
}
