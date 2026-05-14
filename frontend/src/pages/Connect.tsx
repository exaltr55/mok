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

const COHORT_PROMPTS = [
  'What did you not practice this week, and why?',
  'Where did you bring Awareness into your day, even without a formal practice?',
  'What does consistency look like in your life right now?',
  'When was a practice not needed because Awareness was already present?',
  'What is one thing this week showed you about how you respond to friction?',
  'Where in your week did you feel most yourself?',
  'What is the smallest version of the practice that still counts as practice?',
] as const;

const COHORT_RULES = [
  'We speak from our own experience. We don\'t give advice.',
  'We listen without fixing or responding.',
  'We keep what\'s shared here confidential.',
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
  // useState so a date-rollover doesn't desync — but stable across renders.
  const [prompt] = useState(currentPrompt);

  // Hide the bottom-nav-overlap padding while this hero section is at the top.
  useEffect(() => {
    document.title = 'Connect · YouSourceful';
    return () => { document.title = 'YouSourceful · Mokshly'; };
  }, []);

  return (
    <div className="mok-rise" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <header style={{ padding: '24px 0 16px' }}>
        <p className="mok-eyebrow">Connect</p>
        <h1 className="mok-section-title">Four others, walking the same path.</h1>
        <p className="mok-section-lede">
          A cohort is a small group of practitioners — five of you, drawn from outside your
          company by default. You meet for fifteen minutes a week. You don't give advice.
          You listen. You leave a little lighter.
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
            Fifteen minutes. Five practitioners. The app keeps time so you don't have to.
            Nothing said in cohort is recorded, transcribed, or stored.
          </p>
        </section>
      </div>
    </div>
  );
}
