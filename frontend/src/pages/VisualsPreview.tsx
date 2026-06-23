import { Link } from 'react-router-dom';
import { SLIDE_VISUALS } from '../components/SlideVisual';

/**
 * Reviewer-only gallery of every registered slide illustration. Drops
 * you into one page so you can see the whole visual library without
 * walking each Learn module.
 */

const META: Record<string, { caption: string; impact: string }> = {
  'circle-dot':      { caption: 'circle-dot',      impact: 'Awareness with a centre point — anchors Source.' },
  'rings':           { caption: 'rings',           impact: 'Layers, depth — Soil, sediment, history.' },
  'wave':            { caption: 'wave',            impact: 'Breath, flow, ocean — perfect for "like waves in a single ocean".' },
  'sprout':          { caption: 'sprout',          impact: 'Seed becoming — early growth, the Seed metaphor.' },
  'cycle':           { caption: 'cycle',           impact: 'Time, season, return — Seasons.' },
  'path':            { caption: 'path',            impact: 'Journey, unfolding — bridge passages.' },
  'ground':          { caption: 'ground',          impact: 'Soil line — conditions that hold a Seed.' },
  'tree':            { caption: 'tree',            impact: 'Manifestation, the unfolded form — closing beats.' },
  'apple-seed-tree': { caption: 'apple-seed-tree', impact: 'Apple seed → apple tree, time arrow — chapter-anchor for Seed.' },
  'drama-script':    { caption: 'drama-script',    impact: '"The script we are writing through our thinking is the Seed" — Seed.' },
  'mind-ripples':    { caption: 'mind-ripples',    impact: 'Awareness widening — Source chapter anchor.' },
  'sowing-hands':    { caption: 'sowing-hands',    impact: 'Hand releasing seeds — Sowing chapter anchor.' },
};

export default function VisualsPreview() {
  const keys = Object.keys(SLIDE_VISUALS);
  return (
    <section className="mok-rise" style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px', display: 'grid', gap: 24 }}>
      <header>
        <Link to="/learn" className="mok-nav-link">← Back to Learn</Link>
        <p className="mok-eyebrow" style={{ marginTop: 16 }}>Reviewer · Visual library</p>
        <h1 className="mok-section-title">Slide illustrations</h1>
        <p className="mok-section-lede">
          Every visual registered in the slide library. Drop a
          <code style={{ padding: '0 6px' }}>[visual: key]</code>
          marker on its own stanza in any Learn module to insert one.
        </p>
        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic' }}>
          Cap at ~20 % coverage. Use only where the surrounding text
          describes a vivid image.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {keys.map((key) => {
          const Visual = SLIDE_VISUALS[key];
          const m = META[key] ?? { caption: key, impact: '' };
          return (
            <article
              key={key}
              className="mok-card mok-card--padded"
              style={{ display: 'grid', gap: 10, alignItems: 'start' }}
            >
              <div
                style={{
                  background: 'var(--bg-raised)',
                  borderRadius: 8,
                  padding: 18,
                  minHeight: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Visual />
              </div>
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    margin: 0,
                  }}
                >
                  [visual: <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}>{m.caption}</span>]
                </p>
                <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: '6px 0 0' }}>
                  {m.impact}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <p
        className="mok-muted"
        style={{ fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 8 }}
      >
        Visuals inherit the theme accent — switch themes in Me → Preferences to preview each.
      </p>
    </section>
  );
}
