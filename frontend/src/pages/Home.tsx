import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from '../components/Wordmark';

const FEATURES = [
  {
    marker: '5S',
    title: 'A framework for awareness',
    body:
      'Source, Seed, Soil, Seasons, Sowing — five lenses for seeing how experience ' +
      'arises, takes form, and unfolds. The conceptual ground.',
  },
  {
    marker: '7',
    title: 'Seven gentle practices',
    body:
      'Breathing, Thinking, Talking, Writing, Moving, Resetting, Aligning. ' +
      'Doorways through which Awareness becomes available.',
  },
  {
    marker: '◯',
    title: 'Honors your nature',
    body:
      'Your practice is yours alone. Your journal, your reflections, and your MCI ' +
      'stay private to you — always.',
  },
  {
    marker: '·',
    title: 'Built for sustainable depth',
    body:
      'A short return, repeated over time, develops capacities that endure. The app ' +
      "succeeds when you spend less time in it and more in your life.",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="mok-rise">
      <section className="mok-hero">
        <p className="mok-eyebrow">Human Sustainability for the AI era</p>
        <h1 className="mok-hero-title">
          Stay grounded, clear, and fully human <em>through</em> change.
        </h1>
        <p className="mok-hero-lede">
          YouSourceful is Mokshly's foundational system for human sustainability. Two pillars —
          the 5S Framework and the 7 Practices — refined for the modern knowledge worker.
        </p>
        <div className="mok-hero-actions">
          {isAuthenticated ? (
            <Link to="/today" className="mok-btn mok-btn--primary mok-btn--lg">Open today's practice →</Link>
          ) : (
            <>
              <Link to="/signup" className="mok-btn mok-btn--primary mok-btn--lg">Begin</Link>
              <Link to="/about" className="mok-btn mok-btn--lg">Learn more</Link>
            </>
          )}
        </div>
      </section>

      <section className="mok-feature-grid">
        {FEATURES.map((f) => (
          <article key={f.title} className="mok-feature">
            <span className="mok-feature-marker">{f.marker}</span>
            <h3 className="mok-feature-title">{f.title}</h3>
            <p className="mok-feature-body">{f.body}</p>
          </article>
        ))}
      </section>

      <section
        style={{
          marginTop: 88,
          padding: '56px 36px',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-raised)',
          border: '1px solid var(--border)',
          display: 'grid',
          gap: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Wordmark size="lg" />
        </div>
        <p className="mok-muted" style={{ maxWidth: '56ch', margin: '0 auto', fontSize: 17, fontStyle: 'italic' }}>
          "The practice is a doorway. Some days you walk through one. Some days three.
          Some days you simply notice the day — and still the Awareness is with you."
        </p>
        {!isAuthenticated && (
          <div>
            <Link to="/signup" className="mok-btn mok-btn--primary">Start a 30-day trial</Link>
          </div>
        )}
      </section>
    </div>
  );
}
