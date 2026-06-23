import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from '../components/Wordmark';
import {
  IconBuddy,
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
    title: 'The 5S Framework',
    body:
      'Five lenses on the patterns shaping your day — and how to shift them.',
  },
  {
    Icon: IconPractices,
    from: 'violet',
    to: 'magenta',
    accent: 'magenta',
    surface: 'magenta',
    title: 'The 7 Practices',
    body:
      'Daily reps that compound into awareness, steadiness, and capability.',
  },
  {
    Icon: IconLoop,
    from: 'amber',
    to: 'coral',
    accent: 'amber',
    surface: 'butter',
    title: 'The Fivesome Peer Structure',
    body:
      'Practice with four peers. A shared rhythm carries you through ' +
      'the days motivation doesn\'t.',
  },
  {
    Icon: IconBuddy,
    from: 'indigo',
    to: 'cyan',
    accent: 'indigo',
    surface: 'sky',
    title: 'Your Buddy',
    body:
      'An always-on companion to ask, reflect with, and lean on — ' +
      'quietly, on your terms.',
  },
  {
    Icon: IconPrivacy,
    from: 'mint-deep',
    to: 'cyan',
    accent: 'mint-deep',
    surface: 'fresh',
    title: 'Yours, alone',
    body:
      'Your journal, reflections, and Consistency Index belong to you. Always.',
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="mok-rise">
      <section className="mok-hero">
        <p className="mok-eyebrow">AI is rewriting humanity's relationship with work.</p>
        <h1 className="mok-hero-title">
          Stay strong, clear, and{' '}
          <span className="mok-gradient-text">fully human</span>{' '}
          through it.
        </h1>
        <p className="mok-hero-lede">
          YouSourceful is a system for developing the human capabilities
          AI can't replace — delivered through daily practice.
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
            <header className="mok-feature-head">
              <span className={`mok-feature-badge mok-feature-badge--${f.accent}`}>
                <f.Icon
                  size={32}
                  from={f.from}
                  to={f.to}
                  id={`feat-${i}`}
                />
              </span>
              <h3 className={`mok-feature-title mok-text--${f.accent}`}>{f.title}</h3>
            </header>
            <p className="mok-feature-body">{f.body}</p>
          </article>
        ))}
      </section>

      {!isAuthenticated && (
        <section className="mok-home-cta mok-card-rise" style={{ ['--d' as string]: '600ms' }}>
          <div className="mok-home-cta-wordmark">
            <Wordmark size="lg" />
          </div>
          <p className="mok-home-cta-quote">
            Begin where you are. A few minutes a day, done consistently, is enough.
          </p>
          <div className="mok-row" style={{ gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="mok-btn mok-btn--primary mok-btn--lg">
              Start Now
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
