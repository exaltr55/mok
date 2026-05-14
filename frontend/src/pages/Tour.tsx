import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from '../components/Wordmark';

/**
 * The ~90-second post-onboarding tour. Six cards: the approach + the five
 * primary sections. Reachable manually from Preferences too. The final card
 * lands the practitioner in /learn, which sequences 5S → 7 Practice teachings.
 */

interface Card {
  eyebrow: string;
  title: string;
  body: string;
  detail?: string;
}

const CARDS: Card[] = [
  {
    eyebrow: 'The approach',
    title: 'YouSourceful develops Awareness.',
    body:
      'Awareness is the steady inner space within which thoughts, emotions, and ' +
      'reactions arise. The practices are doorways through which Awareness ' +
      'becomes available — in how you breathe, think, move, and respond.',
    detail:
      'We honor consistency and intention. Some days you walk through one ' +
      'doorway. Some days three. Each is enough.',
  },
  {
    eyebrow: 'Section 1',
    title: 'Today — your daily landing.',
    body:
      'Each day, the app gently suggests one practice. You can begin it now, ' +
      'log a practice you did outside the app, or simply notice the day. Your ' +
      'phase, your rhythm, your suggestion.',
    detail:
      'A quiet week-trail of dots shows where you returned. Your MCI lives ' +
      'here too — a single number, only ever yours.',
  },
  {
    eyebrow: 'Section 2',
    title: 'Practice — seven doorways.',
    body:
      'Breathing, Thinking, Talking, Writing, Moving, Resetting, Aligning. ' +
      'Each has a calm reading and a guided session. Walk through what calls ' +
      'to you.',
    detail:
      'Sessions are short, between two and fifteen minutes. Self-logged ' +
      'practice counts as much as a guided one.',
  },
  {
    eyebrow: 'Section 3',
    title: 'Connect — your cohort.',
    body:
      'Five practitioners across companies, meeting for fifteen minutes a ' +
      'week. You speak from your own experience. You listen. You honor the ' +
      'timer. You leave a little lighter.',
    detail:
      'Cohorts form in two-week waves. While you wait, your practice is ' +
      'already underway.',
  },
  {
    eyebrow: 'Section 4',
    title: 'Learn — the conceptual ground.',
    body:
      'The 5S Framework first — five lenses for seeing how experience arises ' +
      'and unfolds. Then the 7 Practice teachings, which translate the ' +
      'framework into daily living. Read at your own pace.',
    detail: 'This is where we begin together.',
  },
  {
    eyebrow: 'Section 5',
    title: 'Me — your private sanctuary.',
    body:
      'An overview of your patterns, your journal, your history, and your ' +
      'preferences. Everything inside Me stays with you — visible only to you.',
    detail: 'Privacy is built into the product itself.',
  },
];

export default function Tour() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);

  const onLast = idx === CARDS.length - 1;
  const card = CARDS[idx];

  function next() {
    if (onLast) {
      navigate('/learn', { replace: true });
      return;
    }
    setIdx(idx + 1);
  }

  function back() {
    if (idx > 0) setIdx(idx - 1);
  }

  function skip() {
    navigate('/learn', { replace: true });
  }

  const firstName = user?.name?.split(' ')[0];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <Wordmark size="md" />
      </div>

      <article className="mok-card mok-card--padded mok-fade-in" key={idx}>
        <div className="mok-row" style={{ marginBottom: 18, fontSize: 12, color: 'var(--text-subtle)' }}>
          <span className="mok-chip">{idx + 1} of {CARDS.length}</span>
          <span className="mok-spacer" />
          <button
            type="button"
            className="mok-btn mok-btn--ghost"
            style={{ padding: '4px 10px', minHeight: 0, fontSize: 12 }}
            onClick={skip}
          >
            Skip tour
          </button>
        </div>

        <p className="mok-eyebrow" style={{ margin: '0 0 12px' }}>
          {card.eyebrow}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 400,
            letterSpacing: '-0.015em',
            lineHeight: 1.15,
            margin: '0 0 18px',
            color: 'var(--text)',
          }}
        >
          {card.title}
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 16px' }}>
          {card.body}
        </p>
        {card.detail && (
          <p
            className="mok-muted"
            style={{ fontSize: 14, fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}
          >
            {card.detail}
          </p>
        )}

        {/* Progress dots */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginTop: 32,
            marginBottom: 24,
          }}
        >
          {CARDS.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === idx ? 18 : 5,
                height: 5,
                borderRadius: 3,
                background: i <= idx ? 'var(--accent)' : 'var(--border)',
                transition: 'all var(--motion-base) var(--easing)',
              }}
            />
          ))}
        </div>

        <div className="mok-row" style={{ justifyContent: 'space-between' }}>
          {idx > 0 ? (
            <button type="button" className="mok-btn mok-btn--ghost" onClick={back}>
              ← Back
            </button>
          ) : <span />}
          <button type="button" className="mok-btn mok-btn--primary" onClick={next}>
            {onLast ? `Begin with Learn${firstName ? ', ' + firstName : ''} →` : 'Continue →'}
          </button>
        </div>
      </article>
    </div>
  );
}
