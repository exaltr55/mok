/**
 * Connect — cohort + community.
 *
 * Cohort matching, the weekly 15-minute Connect, and the daily 3-minute view
 * are detailed in `docs/02-pillars/connect.md`. They depend on cohort matching
 * batches and a Live Audio room provider, which are scoped after this build.
 *
 * For now Connect is a thoughtful stub: it shows the user what cohorts are,
 * the rules they operate under, this week's prompt, and a gentle promise of
 * placement in the next formation wave. No fake people, no fake activity.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const COHORT_PROMPTS = [
  'Where did your practice meet you most clearly this week?',
  'Where did you bring Awareness into your day, even in the moments between formal practice?',
  'What does consistency look like in your life right now?',
  'When was a practice not needed because Awareness was already present?',
  'What is one thing this week showed you about how you respond to friction?',
  'Where in your week did you feel most yourself?',
  'What is the smallest version of the practice that still counts as practice?',
] as const;

const COHORT_RULES = [
  'We speak from our own experience.',
  'We listen with full attention, holding space for what is shared.',
  'We keep what\'s shared here in confidence.',
  'We honor the timer. Our time is a gift to each other.',
  'We show up as we are.',
] as const;

function currentPrompt(): string {
  // Stable across the day: prompt for the current week of the year.
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor((now.getTime() - yearStart.getTime()) / (7 * 86400000));
  return COHORT_PROMPTS[week % COHORT_PROMPTS.length];
}

export default function Connect() {
  const { user } = useAuth();
  // useState so a date-rollover doesn't desync — but stable across renders.
  const [prompt] = useState(currentPrompt);

  useEffect(() => {
    document.title = 'Connect · YouSourceful';
    return () => { document.title = 'YouSourceful · Mokshly'; };
  }, []);

  // Employer has not enabled Connect for this user yet.
  if (user && !user.cohort_enabled) {
    return (
      <div className="mok-rise" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <header style={{ padding: '24px 0 8px' }}>
          <p className="mok-eyebrow">Connect</p>
          <h1 className="mok-section-title">Coming when your team is ready.</h1>
          <p className="mok-section-lede">
            Connect is a small weekly circle — five fellow practitioners meeting
            for fifteen minutes a week. Your employer decides when to turn it on
            for their team.
          </p>
        </header>

        <section className="mok-card" style={{ borderLeft: '3px solid var(--accent)' }}>
          <p className="mok-eyebrow" style={{ margin: 0 }}>What it will be</p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 400,
              margin: '6px 0 8px',
            }}
          >
            A space to share honestly and listen with full attention.
          </h2>
          <p className="mok-muted" style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
            When your team turns Connect on, you'll be placed in a cohort with
            four other practitioners, drawn from outside your company by default.
            You'll meet for fifteen minutes a week. You speak from your own
            experience. You listen. You leave a little lighter.
          </p>
        </section>

        <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', textAlign: 'center' }}>
          In the meantime, your practice is whole on its own.
        </p>
      </div>
    );
  }

  return (
    <div className="mok-rise" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <header style={{ padding: '24px 0 16px' }}>
        <p className="mok-eyebrow">Connect</p>
        <h1 className="mok-section-title">Four others, walking the same path.</h1>
        <p className="mok-section-lede">
          A cohort is a small group of practitioners — five of you, drawn from outside your
          company by default. You meet for fifteen minutes a week. You speak from your own
          experience. You listen. You leave a little lighter.
        </p>
      </header>

      {/* Placement promise — the design-doc commitment we made at onboarding. */}
      <section
        className="mok-card"
        style={{
          borderLeft: '3px solid var(--accent)',
          display: 'flex',
          gap: 20,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <p className="mok-eyebrow" style={{ margin: 0 }}>
            You're on the list
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: '-0.005em',
              margin: '6px 0 8px',
            }}
          >
            Your cohort will form in the next two-week wave.
          </h2>
          <p className="mok-muted" style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
            Cohorts form in batches every two weeks, matched on time-zone and meeting
            preference. Your practice doesn't have to wait — your cohort is the part
            that joins later.
          </p>
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 20,
        }}
      >
        {/* This week's prompt */}
        <section className="mok-card">
          <p className="mok-section-h3">This week's cohort prompt</p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontStyle: 'italic',
              lineHeight: 1.4,
              margin: '0 0 12px',
              color: 'var(--text)',
            }}
          >
            "{prompt}"
          </p>
          <p className="mok-muted" style={{ fontSize: 13, margin: 0 }}>
            When your cohort meets, this is what you'll sit with. Take a moment with it now
            if you'd like.
          </p>
        </section>

        {/* Cohort rules */}
        <section className="mok-card">
          <p className="mok-section-h3">How a Connect works</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {COHORT_RULES.map((rule, i) => (
              <li
                key={i}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-subtle)',
                  borderLeft: '2px solid var(--accent)',
                  fontSize: 15,
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                }}
              >
                {rule}
              </li>
            ))}
          </ul>

          <p className="mok-muted" style={{ fontSize: 13, marginTop: 16, lineHeight: 1.55 }}>
            Fifteen minutes. Five practitioners. The app keeps time so you can stay fully
            present. Everything said in cohort stays in the circle — held in confidence,
            and lives only in the moment it is spoken.
          </p>
        </section>
      </div>
    </div>
  );
}
