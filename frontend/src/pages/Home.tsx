import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from '../components/Wordmark';
import {
  IconFramework,
  IconLoop,
  IconPractices,
  IconPrivacy,
} from '../components/FeatureIcon';

interface Feature {
  Icon: FC<{ size?: number; from: string; to: string; id: string }>;
  /** Theme accent key — drives the title colour and icon gradient stops. */
  from: string;
  to: string;
  accent: 'cyan' | 'indigo' | 'magenta' | 'violet' | 'mint-deep' | 'amber';
  surface: 'ocean' | 'sky' | 'magenta' | 'violet' | 'fresh' | 'butter';
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    Icon: IconFramework,
    from: 'cyan',
    to: 'indigo',
    accent: 'cyan',
    surface: 'ocean',
    title: 'A framework for Awareness',
    body:
      'Source, Seed, Soil, Seasons, Sowing — five lenses for seeing how ' +
      'experience arises, takes form, and unfolds.',
  },
  {
    Icon: IconPractices,
    from: 'violet',
    to: 'magenta',
    accent: 'magenta',
    surface: 'magenta',
    title: 'Seven gentle practices',
    body:
      'Breathing, Thinking, Talking, Writing, Moving, Resetting, Aligning — ' +
      'small daily acts that compound over time.',
  },
  {
    Icon: IconPrivacy,
    from: 'mint-deep',
    to: 'cyan',
    accent: 'mint-deep',
    surface: 'fresh',
    title: 'Yours, alone',
    body:
      'Your journal, your reflections, and your Consistency Index belong to ' +
      'you. Privacy is the foundation we hold to.',
  },
  {
    Icon: IconLoop,
    from: 'amber',
    to: 'coral',
    accent: 'amber',
    surface: 'butter',
    title: 'Sustainable by design',
    body:
      'A short return, repeated over time, develops capacities that endure. ' +
      'The app succeeds when you spend less time in it.',
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="mok-rise">
      <section className="mok-hero">
        <p className="mok-eyebrow">Human Sustainability for the AI era</p>
        <h1 className="mok-hero-title">
          Stay grounded, clear, and{' '}
          <span className="mok-gradient-text">fully human</span>{' '}
          through change.
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
        {FEATURES.map((f, i) => (
          <article
            key={f.title}
            className={`mok-feature mok-surface-${f.surface} mok-card-rise`}
            style={{ ['--d' as string]: `${120 + i * 90}ms` }}
          >
            <span className={`mok-feature-badge mok-feature-badge--${f.accent}`}>
              <f.Icon
                size={48}
                from={f.from}
                to={f.to}
                id={`feat-${i}`}
              />
            </span>
            <h3 className={`mok-feature-title mok-text--${f.accent}`}>{f.title}</h3>
            <p className="mok-feature-body">{f.body}</p>
          </article>
        ))}
      </section>

      <section className="mok-home-cta mok-card-rise" style={{ ['--d' as string]: '600ms' }}>
        <div className="mok-home-cta-wordmark">
          <Wordmark size="lg" />
        </div>
        <p className="mok-home-cta-quote">
          "The practice is a <span className="mok-gradient-text">doorway</span>.
          Some days you walk through one. Some days three.
          Some days you simply notice the day — and still the Awareness is with you."
        </p>
        {!isAuthenticated && (
          <div className="mok-row" style={{ gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="mok-btn mok-btn--primary mok-btn--lg">
              Start a 30-day trial
            </Link>
            <Link to="/about" className="mok-btn mok-btn--lg">
              Learn more
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
