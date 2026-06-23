import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUserId, getMyTenantWelcome, type TenantWelcome } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from '../components/Wordmark';

/** localStorage key for resume-orientation position, scoped per user. */
function orientationPositionKey(): string {
  const uid = getCurrentUserId();
  return uid ? `mok.orientation.position.${uid}` : 'mok.orientation.position.anon';
}

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
 *   9. Companion (your always-close support)
 *  10. How to be here (gentle agreements)
 *  11. Privacy and support
 *  12. The six sections at a glance
 *  13. Ready → Learn
 *
 * Reachable manually from Preferences too. The final card lands the
 * practitioner in /learn.
 */

interface Card {
  eyebrow: string;
  title: string;
  body: string | ReactNode;
  detail?: string | ReactNode;
  bullets?: ReactNode[];
  /** Optional signature block — used for "From your HR head" / "From your CEO". */
  signature?: { name: string; title: string | null };
  kind?: 'standard' | 'letter';
}

const CARDS: Card[] = [
  {
    eyebrow: 'Hello, from Mokshly',
    title: 'Why we built this.',
    body:
      "You're here because life moves fast — and somewhere in that pace, the " +
      "steadier you is easy to lose. YouSourceful is about getting that you back. " +
      "Not through more striving. Through quiet, daily Awareness — the steady " +
      "ground that doesn't move when everything else does.",
    detail:
      "Think of us as a calm friend who's walked this before. We bring the " +
      "tools. You bring the showing up.",
  },
  {
    eyebrow: 'What changes (slowly)',
    title: 'Small shifts that add up.',
    body:
      "Most people notice it sideways at first. A reaction that softens before " +
      "it lands. A clearer head on a Monday morning. A pause where there used " +
      "to be a snap. Nothing dramatic — just the kind of inner shift that " +
      "quietly makes the work, the people, and the day easier to meet.",
    detail:
      "These aren't promises. They're patterns others have noticed. Your " +
      "version will be yours.",
  },
  {
    eyebrow: "How it's built",
    title: 'Two parts, working together.',
    body:
      "First, you'll learn about the practices — what they are, why they " +
      "matter, and how they work. Then you'll do them, a little each day.",
    detail: 'Breathing is where everyone begins. The rest follows from there.',
  },
  {
    eyebrow: 'First, the framework',
    title: 'The 5S Framework.',
    body:
      "Five short modules. Five lenses for understanding how your experience " +
      "takes shape — from the steady ground beneath you, all the way to the " +
      "cycles that move through your days. Nothing here is heavy reading. " +
      "Promise.",
    detail: <>You'll meet it slide by slide in <span className="mok-ui-label">Learn</span>.</>,
  },
  {
    eyebrow: 'Then, the practices',
    title: 'The 7 Practices.',
    body:
      "Seven small daily things — meeting your breath, your mind, your voice, " +
      "your body, your day. Each has a short reading (the what), a short reading " +
      "(the how), and a guided session. None of it is long. All of it adds up.",
    detail: "You'll meet them one at a time. No rush.",
  },
  {
    eyebrow: 'The daily landing',
    title: 'Your Today screen, your way.',
    body: (
      <>
        <span className="mok-ui-label">Today</span> is the page you'll
        open most. It shows what's gently suggested, what you've already
        done, and what's quietly waiting. Begin a practice, log one you
        did off-screen, or just notice the day and close the tab. All
        of it counts.
      </>
    ),
    detail:
      "Six days a week is the sweet spot. Rest is part of practice — and " +
      "consistency wins over intensity, every single time.",
  },
  {
    eyebrow: 'Your rhythm at a glance',
    title: 'A quiet way to see your progress.',
    body:
      "You'll see a small number — your Consistency Index. It quietly " +
      "tracks your progress over time and helps you stay aligned with " +
      "the practice, celebrating each return and supporting your rhythm.",
    detail:
      "Days off the app still count, if you practiced. And only you can see " +
      "this number — it isn't on display anywhere.",
  },
  {
    eyebrow: 'Your private corner',
    title: 'Journal, History, and Me.',
    body: (
      <>
        <span className="mok-ui-label">Journal</span> is where you write —
        expressively, reflectively, or in gratitude.{' '}
        <span className="mok-ui-label">History</span> is your trail of
        returning. <span className="mok-ui-label">Me</span> is your
        private sanctuary — dashboard, patterns, preferences. Everything
        inside <span className="mok-ui-label">Me</span> stays inside{' '}
        <span className="mok-ui-label">Me</span>.
      </>
    ),
    detail: "Privacy isn't a setting here. It's built in.",
  },
  {
    eyebrow: 'Your circle',
    title: 'Connect — a small weekly circle.',
    body:
      "When cohorts are open in your space, you'll meet a small group of " +
      "fellow practitioners once a week. Everyone speaks from their own " +
      "experience. Everyone listens. Nothing more, nothing less.",
    detail: (
      <>
        If <em>Connect</em> isn't open yet, your practice is whole on its
        own. You'll see it here when it opens.
      </>
    ),
  },
  {
    eyebrow: 'Your sounding board',
    title: 'Meet Buddy — your quiet helper.',
    body: (
      <>
        Stuck? Curious? Need to talk something through?{' '}
        <span className="mok-ui-label">Buddy</span> is a small, supportive
        presence inside the app. Ask about a practice, talk through
        what's coming up, or just check in.{' '}
        <span className="mok-ui-label">Buddy</span> stays close, day to day.
      </>
    ),
    detail: (
      <>
        <span className="mok-ui-label">Buddy</span> is yours alone. Your
        journal is never shared with it — that part stays just yours.
      </>
    ),
  },
  {
    eyebrow: 'How we walk together',
    title: 'A few quiet promises.',
    body:
      "Your pace is the right pace. Showing up matters more than intensity. " +
      "Rest belongs in the rhythm, not outside it. Be honest when you write — " +
      "these pages are only yours. And when your cohort gathers, listen the " +
      "way you'd want to be heard.",
    detail: 'Every step counts. Even the small ones.',
  },
  {
    eyebrow: 'Privacy, in one breath',
    title: 'Yours, full stop.',
    body:
      "Anything you share or record here is yours alone. Always. " +
      "Nothing leaves this space unless you choose to share it.",
    detail: (
      <>
        Anything hard? <span className="mok-ui-label">Buddy</span>,
        your cohort, and your journal are all here. Any choice is
        changeable — anytime, in Preferences.
      </>
    ),
  },
  {
    eyebrow: 'A little map for the road',
    title: 'Six places that will start to feel like home.',
    body: "Along the bottom of the screen you'll find six tabs — the six places you'll come back to most.",
    bullets: [
      <>
        <span className="mok-ui-label">Today</span> — what's suggested for
        the day, and what you've already done.
      </>,
      <>
        <span className="mok-ui-label">Practice</span> — pick one of the
        seven and begin.
      </>,
      <>
        <em>Connect</em> — your small weekly circle, when it opens.
      </>,
      <>
        <span className="mok-ui-label">Learn</span> — the framework and
        short readings behind the practice.
      </>,
      <>
        <span className="mok-ui-label">Buddy</span> — a quiet companion
        you can ask anything.
      </>,
      <>
        <span className="mok-ui-label">Me</span> — your private corner:
        journal, history, your own rhythm.
      </>,
    ],
    detail:
      "You can come back to this walk anytime from Preferences. " +
      "We'll be right here.",
  },
];

export default function Orientation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [welcome, setWelcome] = useState<TenantWelcome | null>(null);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [resumeIdx, setResumeIdx] = useState(0);

  useEffect(() => {
    getMyTenantWelcome().then(setWelcome).catch(() => setWelcome(null));
    // Offer "resume where you left off" if the user dropped out earlier.
    try {
      const raw = localStorage.getItem(orientationPositionKey());
      if (raw) {
        const saved = parseInt(raw, 10);
        if (Number.isFinite(saved) && saved > 0) {
          setResumeIdx(saved);
          setResumeAvailable(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist progress so a returning user can pick up where they were.
  useEffect(() => {
    try {
      localStorage.setItem(orientationPositionKey(), String(idx));
    } catch {
      // ignore
    }
  }, [idx]);

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
  // After the last card we land on a warm celebration screen before
  // handing the user into Learn — so the transition feels held, not
  // abrupt.
  const [celebrating, setCelebrating] = useState(false);

  function next() {
    if (onLast) {
      setCelebrating(true);
      return;
    }
    setIdx(idx + 1);
  }

  function beginLearning() {
    try { localStorage.removeItem(orientationPositionKey()); } catch { /* ignore */ }
    navigate('/learn', { replace: true });
  }

  function back() {
    if (idx > 0) setIdx(idx - 1);
  }

  const firstName = user?.name?.split(' ')[0];

  if (celebrating) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Wordmark size="md" />
        </div>
        <article
          className="mok-card mok-card--padded mok-fade-in"
          style={{ textAlign: 'center', display: 'grid', gap: 18, padding: '36px 24px' }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto',
              background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
              color: 'var(--accent)',
              display: 'grid', placeItems: 'center', fontSize: 32, lineHeight: 1,
            }}
          >
            ✓
          </div>
          <p className="mok-eyebrow" style={{ margin: 0 }}>Orientation complete</p>
          <h1
            className="mok-section-title"
            style={{ fontSize: 32, lineHeight: 1.2, margin: 0 }}
          >
            {firstName ?? 'You'} — you're in. Welcome aboard.
          </h1>
          <p
            className="mok-section-lede"
            style={{ margin: 0, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}
          >
            You've got the map. Now the actual fun begins. Next stop: Learn —
            where the ideas land, and the practices start to make sense in your
            body, not just your head.
          </p>
          <p
            className="mok-muted"
            style={{ margin: 0, fontStyle: 'italic', fontSize: 14, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}
          >
            We'll open with a short welcome chapter. Easy on, easy off. You'll
            feel the rhythm in a few minutes.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
            <button
              type="button"
              className="mok-btn mok-btn--primary mok-btn--lg"
              onClick={beginLearning}
            >
              Open Learn →
            </button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <Wordmark size="md" />
      </div>

      {resumeAvailable && (
        <div
          className="mok-card mok-card--padded"
          style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Welcome back</p>
            <p className="mok-muted" style={{ margin: '4px 0 0', fontSize: 14, fontStyle: 'italic' }}>
              You left off at Step {resumeIdx + 1} of {cards.length}. Pick up where you were?
            </p>
          </div>
          <div className="mok-row" style={{ gap: 8 }}>
            <button type="button" className="mok-btn" onClick={() => { setResumeAvailable(false); setIdx(0); }}>
              Start over
            </button>
            <button type="button" className="mok-btn mok-btn--primary" onClick={() => { setIdx(resumeIdx); setResumeAvailable(false); }}>
              Resume →
            </button>
          </div>
        </div>
      )}

      <article className={`mok-card mok-card--padded mok-fade-in ${card.kind === 'letter' ? 'mok-letter' : ''}`} key={idx}>
        {/* Single, clear surface label — no broader-journey breadcrumb
            and no skip option, since orientation isn't optional in the
            first-time flow. */}
        <div className="mok-row" style={{ marginBottom: 18, fontSize: 12, color: 'var(--text-subtle)' }}>
          <span className="mok-chip">Orientation · Step {idx + 1} of {cards.length}</span>
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
          <LetterBody body={card.body as string} />
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
