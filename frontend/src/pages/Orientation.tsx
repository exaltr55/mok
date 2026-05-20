import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyTenantWelcome, type TenantWelcome } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from '../components/Wordmark';

/**
 * Post-onboarding orientation. Lays out the YouSourceful program:
 *
 *   1. The approach (Awareness, the doorway image)
 *   2. The two pillars (overview)
 *   3. Pillar 1 — 5S Framework
 *   4. Pillar 2 — 7 Practices
 *   5. How to manage your practice (Today screen, daily rhythm)
 *   6. The Consistency Index (MCI)
 *   7. Your private tools (Journal, History, Me)
 *   8. Your cohort (Connect)
 *   9. The five sections at a glance
 *   10. Ready → Learn
 *
 * Reachable manually from Preferences too. The final card lands the
 * practitioner in /learn.
 */

interface Card {
  eyebrow: string;
  title: string;
  body: string;
  detail?: string;
  bullets?: string[];
  /** Optional signature block — used for "From your HR head" / "From your CEO". */
  signature?: { name: string; title: string | null };
  kind?: 'standard' | 'letter';
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
      'practice. Some days three. Each is enough.',
  },
  {
    eyebrow: 'What may emerge',
    title: 'What you might find here.',
    body:
      'Over time, practitioners often notice their reactions softening before ' +
      'they form. A steadier baseline returning on hard days. Small habits ' +
      'compounding into a clearer way of meeting the work, the people, and the ' +
      'moments that ask the most of you.',
    detail:
      'These are not promises — they are what others have described noticing ' +
      'as practice settles in. Your version will be your own.',
  },
  {
    eyebrow: 'How it works',
    title: 'Two pillars hold the program.',
    body:
      'The 5S Framework is the conceptual ground — five lenses for seeing how ' +
      'experience arises and unfolds. The 7 Practices translate the framework ' +
      'into daily living — small, repeatable acts that meet you where you are.',
    detail:
      'Read the framework first, then the practices. Walk through them at your ' +
      'own rhythm — Breathing is a beautiful place to begin, and the rest unfold ' +
      'as they call to you.',
  },
  {
    eyebrow: 'Pillar 1',
    title: 'The 5S Framework.',
    body:
      'Five lenses for seeing how experience arises and unfolds — from the ' +
      'steady ground beneath you, to the cycles that move through your days. ' +
      'The full teaching waits for you in Learn.',
    detail: 'A short read. Begin when you arrive there.',
  },
  {
    eyebrow: 'Pillar 2',
    title: 'The 7 Practices.',
    body:
      'Seven small, daily practices — calm ways to meet your breath, your ' +
      'thinking, your body, your day. Each has a teaching, a daily practice, ' +
      'and a short guided session.',
    detail: 'You will discover them one at a time, in your own rhythm.',
  },
  {
    eyebrow: 'The daily rhythm',
    title: 'How to manage your practice.',
    body:
      'Your Today screen is the daily landing. Each day, one practice is gently ' +
      'suggested based on your phase and rhythm. Begin it, log a practice you ' +
      'did outside the app, or simply notice the day.',
    detail:
      'Aim for five of seven days. Rest is part of practice — and consistency ' +
      'beats intensity, every time.',
  },
  {
    eyebrow: 'Your steady rhythm',
    title: 'A kind mirror, not a score.',
    body:
      "You'll see a small number we call your Consistency Index — simply the " +
      'share of days in the last month that you returned to practice. Think of ' +
      'it as a kind mirror that gently reflects your rhythm back to you, here ' +
      'to encourage your steady return.',
    detail:
      'Any day you practiced counts — whether you used the app or simply did it ' +
      'on your own. Only you can see this number.',
  },
  {
    eyebrow: 'Your private tools',
    title: 'Journal, History, and Me.',
    body:
      'A daily Journal — expressive, reflective, or gratitude. A History view that ' +
      'shows your trail of returning. A Me sanctuary that holds your dashboard, ' +
      'patterns, and preferences. Everything inside Me stays with you.',
    detail: 'Privacy is built into the product itself.',
  },
  {
    eyebrow: 'Your cohort',
    title: 'Connect — a circle that holds you.',
    body:
      'Five fellow practitioners, meeting for fifteen minutes a week. A space ' +
      'where each person speaks from their own experience, listens with full ' +
      'attention, and holds room for one another — gently, openly, and with ' +
      'shared respect.',
    detail:
      'Connect is offered by your employer. If it is already on, you will see ' +
      'it ready in the Connect section. If not, your team will turn it on when ' +
      'they are ready — your practice is whole on its own in the meantime.',
  },
  {
    eyebrow: 'How to be here',
    title: 'A few gentle agreements.',
    body:
      'Practice is yours alone — your own measure, your own pace. Consistency ' +
      'over intensity. A rest day is part of the path. Bring honesty to your ' +
      'journal and to your cohort, and meet others the way you would want to ' +
      'be met — with kindness and full presence.',
    detail:
      'Every step counts here. The path is yours to walk, at your own pace.',
  },
  {
    eyebrow: 'Privacy and support',
    title: 'Your practice is yours alone.',
    body:
      'Your journal, your reflections, and your private numbers belong to you — ' +
      'always. They live with you, and only you. If you ever choose to share ' +
      'patterns to help your company better support its people, that sharing ' +
      'is anonymous — and it only appears when ten or more colleagues have ' +
      'shared the same way, keeping each person fully unrecognisable.',
    detail:
      'If something is hard, you are not alone. Reach out any time through ' +
      'Contact in the menu — we read every message. Your cohort and your ' +
      'journal are also here to hold what arises. You can change any of your ' +
      'choices, any time, in Preferences.',
  },
  {
    eyebrow: 'At a glance',
    title: 'Five sections, one rhythm.',
    body:
      'Today is your daily landing. Practice holds the seven. Connect is your ' +
      'cohort. Learn is the framework and teachings. Me is your private ' +
      'sanctuary.',
    detail: 'You can return to this orientation any time from Preferences.',
  },
];

export default function Orientation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [welcome, setWelcome] = useState<TenantWelcome | null>(null);

  useEffect(() => {
    getMyTenantWelcome().then(setWelcome).catch(() => setWelcome(null));
  }, []);

  // Inject HR + CEO letters right after the "Welcome / approach" card if
  // the employer has written them.
  const cards = useMemo<Card[]>(() => {
    const letters: Card[] = [];
    if (welcome?.hr_head_message?.trim()) {
      letters.push({
        eyebrow:
          welcome.organisation_name
            ? `A note from ${welcome.organisation_name}`
            : 'A note from your HR team',
        title: 'Welcome from your people team.',
        body: welcome.hr_head_message,
        kind: 'letter',
        signature: {
          name: welcome.hr_head_name ?? 'Your HR team',
          title: welcome.hr_head_title ?? null,
        },
      });
    }
    if (welcome?.ceo_message?.trim()) {
      letters.push({
        eyebrow:
          welcome.organisation_name
            ? `A note from ${welcome.organisation_name}`
            : "A note from your CEO",
        title: 'Welcome from leadership.',
        body: welcome.ceo_message,
        kind: 'letter',
        signature: {
          name: welcome.ceo_name ?? 'Your CEO',
          title: welcome.ceo_title ?? null,
        },
      });
    }
    if (!letters.length) return CARDS;
    // Insert after the first card (The approach) so users see Mokshly's
    // framing first, then their employer's warm note.
    return [CARDS[0], ...letters, ...CARDS.slice(1)];
  }, [welcome]);

  const onLast = idx === cards.length - 1;
  const card = cards[idx];

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
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <Wordmark size="md" />
      </div>

      <article className={`mok-card mok-card--padded mok-fade-in ${card.kind === 'letter' ? 'mok-letter' : ''}`} key={idx}>
        <div className="mok-row" style={{ marginBottom: 18, fontSize: 12, color: 'var(--text-subtle)' }}>
          <span className="mok-chip">{idx + 1} of {cards.length}</span>
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
        {card.kind === 'letter' ? (
          <LetterBody body={card.body} />
        ) : (
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 16px' }}>
            {card.body}
          </p>
        )}

        {card.bullets && (
          <ul className="mok-orientation-bullets">
            {card.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}

        {card.detail && (
          <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', margin: card.bullets ? '14px 0 0' : 0, lineHeight: 1.6 }}>
            {card.detail}
          </p>
        )}

        {card.signature && (
          <div className="mok-letter-signature">
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18 }}>
              {card.signature.name}
            </span>
            {card.signature.title && (
              <span className="mok-subtle" style={{ fontSize: 12 }}>{card.signature.title}</span>
            )}
          </div>
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
          {cards.map((_, i) => (
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
            {onLast ? `Begin with Learn${firstName ? ', ' + firstName : ''} →` : 'Continue →'}
          </button>
        </div>
      </article>

      {/* Quiet anchor link to jump straight to Learn from any card. */}
      {!onLast && (
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13 }}>
          <Link to="/learn" className="mok-subtle">Or open Learn directly ›</Link>
        </p>
      )}
    </div>
  );
}

/** HR / CEO letter body: each non-empty line in the source becomes its own
 *  bullet item for easy scanning. If the leader wrote a single flowing
 *  paragraph (no line breaks), it falls back to a normal paragraph so the
 *  prose reads as intended. Lines starting with "- " or "• " have the
 *  marker stripped (we render our own). */
function LetterBody({ body }: { body: string }) {
  const items = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-•]\s+/, ''));

  if (items.length <= 1) {
    return (
      <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 16px' }}>
        {body}
      </p>
    );
  }

  return (
    <ul className="mok-letter-bullets">
      {items.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}
