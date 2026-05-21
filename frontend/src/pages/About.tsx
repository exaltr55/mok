import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  IconAwareness,
  IconCohort,
  IconLeaf,
  IconMirror,
  IconReturn,
  IconShield,
} from '../components/PrincipleIcon';

interface IconProps {
  size?: number;
  from: string;
  to: string;
  id: string;
}

interface Principle {
  Icon: FC<IconProps>;
  /** Gradient stop colours for the icon. */
  from: string;
  to: string;
  /** Theme accent (CSS variable name without --) for the title. */
  accent:
    | 'cyan' | 'indigo' | 'magenta' | 'violet'
    | 'mint-deep' | 'amber' | 'coral';
  /** Matching pastel surface variant. */
  surface: 'ocean' | 'sky' | 'magenta' | 'violet' | 'fresh' | 'butter' | 'warm';
  title: string;
  body: string;
}

const PRINCIPLES: Principle[] = [
  {
    Icon: IconAwareness,
    from: 'cyan',
    to: 'indigo',
    accent: 'cyan',
    surface: 'ocean',
    title: 'Awareness-first',
    body:
      'We honour consistency and intention. The practices are doorways through ' +
      'which Awareness becomes available — gently, repeatedly.',
  },
  {
    Icon: IconLeaf,
    from: 'indigo',
    to: 'violet',
    accent: 'indigo',
    surface: 'sky',
    title: 'Gentle by design',
    body:
      'Every feature has a quiet ceiling. The app supports your day, then ' +
      'returns you to it — fully present.',
  },
  {
    Icon: IconMirror,
    from: 'violet',
    to: 'magenta',
    accent: 'violet',
    surface: 'violet',
    title: 'Self-relating only',
    body:
      'Your private numbers are your own quiet mirror — a reflection of rhythm, ' +
      'measured only against yourself.',
  },
  {
    Icon: IconCohort,
    from: 'magenta',
    to: 'coral',
    accent: 'magenta',
    surface: 'magenta',
    title: 'Intimate cohorts',
    body:
      'Five practitioners, fifteen minutes a week. Small enough to be real, ' +
      'large enough to hold each other well.',
  },
  {
    Icon: IconShield,
    from: 'mint-deep',
    to: 'cyan',
    accent: 'mint-deep',
    surface: 'fresh',
    title: 'Privacy as the product',
    body:
      'Your journal, reflections, and consistency score stay with you. Your ' +
      'employer sees only anonymous, group-level signals you have agreed to.',
  },
  {
    Icon: IconReturn,
    from: 'amber',
    to: 'coral',
    accent: 'amber',
    surface: 'butter',
    title: 'Return-friendly',
    body:
      'A rest day is part of the rhythm. The practice is here, waiting, ' +
      'whenever you come back.',
  },
];

export default function About() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="mok-about">
      {/* ── Hero ───────────────────────────────────────────── */}
      <header className="mok-about-hero mok-rise">
        <p className="mok-eyebrow">About Mokshly</p>
        <h1 className="mok-about-title">
          Technology in service of{' '}
          <span className="mok-gradient-text">human flourishing</span>.
        </h1>
        <p className="mok-about-lede">
          Mokshly creates a new category — <strong>Human Elevation</strong> —
          the work of developing the foundational human capacities that
          determine how a person operates in the world.
        </p>
      </header>

      {/* ── Belief card (brand gradient) ───────────────────── */}
      <article className="mok-card mok-card--brand mok-card-rise" style={{ ['--d' as string]: '0ms' }}>
        <p className="mok-eyebrow">What we believe</p>
        <h2 className="mok-belief-title">
          The new scarcity is human clarity, energy, and balance.
        </h2>
        <p className="mok-belief-body">
          Companies are investing heavily in AI tools. The humans who work
          alongside those tools deserve the same investment — care for the
          mind, the body, and the rhythm of a life.
        </p>
      </article>

      {/* ── Two pillars ────────────────────────────────────── */}
      <div className="mok-pillar-grid">
        <article className="mok-pillar mok-pillar--cyan mok-card-rise" style={{ ['--d' as string]: '80ms' }}>
          <p className="mok-eyebrow mok-pillar-eyebrow">Pillar one</p>
          <h2 className="mok-pillar-title">The 5S Framework</h2>
          <p className="mok-pillar-lede">
            Five lenses for seeing how experience arises and unfolds —{' '}
            <em>Source · Seed · Soil · Seasons · Sowing</em>. The conceptual
            ground that holds everything else.
          </p>
        </article>
        <article className="mok-pillar mok-pillar--magenta mok-card-rise" style={{ ['--d' as string]: '160ms' }}>
          <p className="mok-eyebrow mok-pillar-eyebrow">Pillar two</p>
          <h2 className="mok-pillar-title">The 7 Practices</h2>
          <p className="mok-pillar-lede">
            Daily living translated: <em>Breathing · Thinking · Talking ·
            Writing · Moving · Resetting · Aligning</em>. Small, repeatable
            acts that compound over time.
          </p>
        </article>
      </div>

      {/* ── Six principles ─────────────────────────────────── */}
      <section className="mok-principles">
        <header className="mok-principles-head mok-rise">
          <p className="mok-eyebrow">What makes it different</p>
          <h2 className="mok-principles-title">
            Six principles that shape every decision.
          </h2>
        </header>
        <div className="mok-principle-grid">
          {PRINCIPLES.map((p, i) => (
            <article
              key={p.title}
              className={`mok-principle mok-surface-${p.surface} mok-card-rise`}
              style={{ ['--d' as string]: `${240 + i * 70}ms` }}
            >
              <span className={`mok-principle-icon mok-principle-icon--${p.accent}`}>
                <p.Icon size={36} from={p.from} to={p.to} id={`princ-${i}`} />
              </span>
              <h3 className={`mok-principle-title mok-text--${p.accent}`}>{p.title}</h3>
              <p className="mok-principle-body">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────── */}
      <article className="mok-about-cta mok-card-rise" style={{ ['--d' as string]: '700ms' }}>
        <p className="mok-eyebrow">Begin gently</p>
        <h2 className="mok-about-cta-title">
          A short practice today is enough.
        </h2>
        <p className="mok-about-cta-lede">
          Nine quiet questions, a brief orientation, and your first practice.
          Take five minutes — that is the whole ask.
        </p>
        <div className="mok-row" style={{ gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <Link to="/today" className="mok-btn mok-btn--primary mok-btn--lg">
              Open today's practice →
            </Link>
          ) : (
            <>
              <Link to="/signup" className="mok-btn mok-btn--primary mok-btn--lg">
                Begin your practice
              </Link>
              <Link to="/employer/signup" className="mok-btn mok-btn--lg">
                Bring it to your team
              </Link>
            </>
          )}
        </div>
      </article>
    </section>
  );
}
