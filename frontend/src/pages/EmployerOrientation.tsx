import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from '../components/Wordmark';

/**
 * Employer orientation — the HR-side walkthrough of the program. Different
 * from the practitioner orientation: emphasises how teams are supported,
 * what HR sees vs what stays private, how to invite people, and how to turn
 * features on. Eight cards.
 */

interface Card {
  eyebrow: string;
  title: string;
  body: string;
  detail?: string;
}

const CARDS: Card[] = [
  {
    eyebrow: 'Welcome',
    title: 'A quiet system for steady people.',
    body:
      'YouSourceful is a daily practice for knowledge workers under stress. It ' +
      'helps people build a steady inner space — the kind that holds through ' +
      'change, deadlines, and uncertainty.',
    detail:
      'It is not productivity software. It is not crisis support. It is a small, ' +
      'durable practice that compounds.',
  },
  {
    eyebrow: 'How the program is built',
    title: 'Two parts hold the program.',
    body:
      'A short conceptual ground that explains how experience arises, and seven ' +
      'small daily practices that translate it into living. Practitioners read ' +
      'and listen at their own pace.',
    detail:
      'Sessions are short — usually under five minutes. Practice is meant to ' +
      'live inside the workday, not on top of it.',
  },
  {
    eyebrow: 'How practitioners settle in',
    title: 'A gentle on-ramp.',
    body:
      'Each new member of your team begins with a short personal onboarding — ' +
      'about four minutes — followed by their own orientation. From day one, ' +
      'they have a daily landing that suggests one practice tuned to them.',
    detail:
      'Consistency over intensity. A rest day is part of the practice — not a ' +
      'gap in it.',
  },
  {
    eyebrow: 'What you can see',
    title: 'Anonymous group patterns only.',
    body:
      "Your dashboard shows how your team is engaging — at a group level, " +
      'anonymously, and only when ten or more people have shared the same way. ' +
      'Every individual journal, reflection, and score stays with the ' +
      'practitioner alone.',
    detail:
      'Privacy is the foundation we hold to — it is what keeps the practice ' +
      'safe enough to be real.',
  },
  {
    eyebrow: 'How people join',
    title: 'Invitations or open self-signup.',
    body:
      'You can invite specific people, or share a sign-up link with your team. ' +
      'Each person creates their own private account — their practice always ' +
      'belongs to them.',
    detail:
      'Invitation tools live on your dashboard. We will help you draft the ' +
      'first message if you would like.',
  },
  {
    eyebrow: 'A circle that holds them',
    title: 'Connect — your call to turn on.',
    body:
      'Connect is a weekly fifteen-minute circle: five practitioners meeting to ' +
      'share honestly and listen with full attention — speaking from their own ' +
      'experience, holding space for one another. By default, members come from ' +
      'outside the same company.',
    detail:
      'Many teams begin with private practice only and add Connect later. The ' +
      'toggle lives on your dashboard.',
  },
  {
    eyebrow: 'Where to find help',
    title: 'We are here when you need us.',
    body:
      'Reach out via Contact from any page — we read every message. We can help ' +
      'with rollout planning, drafting team communications, or thinking through ' +
      'a particular situation. There is no ticket queue; just a person.',
    detail:
      'For matters that affect a practitioner directly, your team members can ' +
      'reach out to us privately from their own account.',
  },
  {
    eyebrow: "You're ready",
    title: 'Welcome to YouSourceful.',
    body:
      'Open your dashboard to invite your first practitioners, adjust settings, ' +
      'or simply look around. You can return to this orientation any time from ' +
      'the dashboard menu.',
  },
];

export default function EmployerOrientation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);

  const onLast = idx === CARDS.length - 1;
  const card = CARDS[idx];

  function next() {
    if (onLast) {
      navigate('/employer', { replace: true });
      return;
    }
    setIdx(idx + 1);
  }

  function back() {
    if (idx > 0) setIdx(idx - 1);
  }

  function skip() {
    navigate('/employer', { replace: true });
  }

  const firstName = user?.name?.split(' ')[0];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
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
            Skip orientation
          </button>
        </div>

        <p className="mok-eyebrow" style={{ margin: '0 0 12px' }}>{card.eyebrow}</p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 30,
            fontWeight: 400,
            letterSpacing: '-0.015em',
            lineHeight: 1.18,
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
          <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
            {card.detail}
          </p>
        )}

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
            <button type="button" className="mok-btn mok-btn--ghost" onClick={back}>← Back</button>
          ) : <span />}
          <button type="button" className="mok-btn mok-btn--primary" onClick={next}>
            {onLast ? `Open dashboard${firstName ? ', ' + firstName : ''} →` : 'Continue →'}
          </button>
        </div>
      </article>

      {!onLast && (
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13 }}>
          <Link to="/employer" className="mok-subtle">Or go straight to the dashboard ›</Link>
        </p>
      )}
    </div>
  );
}
