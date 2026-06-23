import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getHistory,
  getProfile,
  getTodaySummary,
  getTodaysJournal,
  listPractices,
  type HistoryDay,
  type JournalEntry,
  type PracticeSummary,
  type Profile,
  type TodayScreen,
} from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const TONE_LEDE: Record<NonNullable<Profile['tone_preference']>, string> = {
  quiet: 'A small space, just for you.',
  encouraging: 'You came back. That already counts.',
  reflective: 'Notice what is here, just as it is.',
};

const AREA_NOTE: Record<NonNullable<Profile['stretched_area']>, string> = {
  mind: 'A few breaths to soften the mental load.',
  body: 'A moment to ease what your body has been holding.',
  heart: 'A small opening for warmth and care.',
  time: 'A pause amid the press of the day.',
};

function personalizedLede(profile: Profile | null): string | null {
  if (!profile) return null;
  if (profile.tone_preference) return TONE_LEDE[profile.tone_preference];
  if (profile.stretched_area) return AREA_NOTE[profile.stretched_area];
  return null;
}

export default function Today() {
  const [data, setData] = useState<TodayScreen | null>(null);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [recentJournal, setRecentJournal] = useState<JournalEntry | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [practices, setPractices] = useState<PracticeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getTodaySummary(),
      getHistory(7),
      getTodaysJournal(),
      getProfile(),
      listPractices(),
    ])
      .then(([t, h, j, p, list]) => {
        if (cancelled) return;
        setData(t);
        setHistory(h.days);
        setRecentJournal(j);
        setProfile(p);
        setPractices(list);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load today'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Daily set — every practice the user has unlocked today, with its
  // done/not-done status. The first undone one becomes the spotlight.
  const dailySet = useMemo(() => {
    if (!data) return [];
    const byKey = new Map(practices.map((p) => [p.key, p]));
    return data.available_today
      .map((k) => byKey.get(k))
      .filter((p): p is PracticeSummary => !!p)
      .map((p) => ({
        practice: p,
        done: data.practiced_today.includes(p.key),
      }));
  }, [data, practices]);

  const nextPractice = dailySet.find((d) => !d.done)?.practice ?? null;
  const doneCount = dailySet.filter((d) => d.done).length;
  const allDone = dailySet.length > 0 && doneCount === dailySet.length;

  const spotlightKey = nextPractice?.key as PracticeKey | undefined;
  const Art = spotlightKey ? PracticeArt[spotlightKey] : null;
  const accent = spotlightKey ? PRACTICE_COLORS[spotlightKey] : 'var(--accent)';

  const podStyle = useMemo(
    () => ({ ['--practice-color' as string]: accent } as React.CSSProperties),
    [accent],
  );

  if (loading) return <div className="mok-loading">Drawing a breath…</div>;
  if (error) return <div className="mok-banner mok-banner--error">{error}</div>;
  if (!data) return null;

  const today = new Date(data.today + 'T00:00:00');
  const firstName = data.user_name.split(' ')[0] || data.user_name;
  const lede = personalizedLede(profile);

  return (
    <div className="mok-today mok-rise">
      <section className="mok-today-section" style={{ paddingTop: 40, paddingBottom: 28 }}>
        <p className="mok-today-meta">
          {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="mok-today-greeting">
          {greeting()}, {firstName}.
        </h1>
        {lede && (
          <p className="mok-today-lede" style={{ marginTop: 8, fontStyle: 'italic', color: 'var(--text-muted)' }}>
            {lede}
          </p>
        )}
      </section>

      {allDone ? (
        <section className="mok-today-section" style={{ paddingBottom: 28 }}>
          <article className="mok-pod">
            <div className="mok-pod-body">
              <p className="mok-eyebrow" style={{ margin: '0 0 4px' }}>
                All for today
              </p>
              <h2 className="mok-pod-name">All {dailySet.length} done. Beautiful.</h2>
              <p className="mok-pod-meta" style={{ fontStyle: 'italic' }}>
                Rest is part of the rhythm.
              </p>
            </div>
          </article>
        </section>
      ) : nextPractice && (
        <section className="mok-today-section" style={{ paddingBottom: 28 }}>
          <article className="mok-pod" style={podStyle}>
            {Art && (
              <div className="mok-pod-art">
                <Art color={accent} size={64} />
              </div>
            )}
            <div className="mok-pod-body">
              <p className="mok-eyebrow" style={{ margin: '0 0 4px' }}>
                Next · {doneCount} of {dailySet.length} done
              </p>
              <h2 className="mok-pod-name">{nextPractice.name}</h2>
              <p className="mok-pod-meta">
                {nextPractice.format} · {nextPractice.session_min}–{nextPractice.session_max} min
              </p>

              <div className="mok-pod-actions">
                {data.mci.practice_days === 0 ? (
                  /* First-time practitioner — guide them to read first.
                     The "Begin guided session" CTA lives inside the slideshow's
                     final card, so the read-then-practice order is preserved. */
                  <>
                    <Link
                      to={`/practices/${nextPractice.key}`}
                      className="mok-btn mok-btn--primary mok-btn--lg"
                    >
                      Read the practice →
                    </Link>
                    <span
                      className="mok-muted"
                      style={{ fontSize: 13, fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}
                    >
                      Read it through — the guided session opens at the end.
                    </span>
                  </>
                ) : (
                  <>
                    <Link
                      to={nextPractice.key === 'writing' ? '/journal' : `/practices/${nextPractice.key}/session`}
                      className="mok-btn mok-btn--primary mok-btn--lg"
                    >
                      Begin →
                    </Link>
                    <Link to={`/practices/${nextPractice.key}`} className="mok-btn">
                      Read first
                    </Link>
                  </>
                )}
              </div>
            </div>
          </article>
        </section>
      )}

      {/* Daily set — always shown, lets the user see all of today's
          practices at a glance and tap straight into any of them. */}
      {dailySet.length > 1 && (
        <section className="mok-today-section" style={{ paddingBottom: 24 }}>
          <p className="mok-section-h3" style={{ marginBottom: 12 }}>
            Today's set
            <span className="mok-muted" style={{ marginLeft: 10, fontSize: 13, fontStyle: 'italic', fontWeight: 400 }}>
              {doneCount} of {dailySet.length} done
            </span>
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 10,
            }}
          >
            {dailySet.map(({ practice, done }) => {
              const k = practice.key as PracticeKey;
              const Icon = PracticeArt[k];
              const c = PRACTICE_COLORS[k];
              const href = practice.key === 'writing'
                ? '/journal'
                : `/practices/${practice.key}`;
              return (
                <Link
                  key={practice.key}
                  to={href}
                  className="mok-card"
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    opacity: done ? 0.65 : 1,
                    borderLeft: `3px solid ${done ? 'var(--border)' : c}`,
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      display: 'inline-flex',
                      justifyContent: 'center',
                      color: done ? 'var(--accent)' : 'var(--text-subtle)',
                    }}
                  >
                    {done ? '✓' : '○'}
                  </span>
                  <Icon color={c} size={20} />
                  <span style={{ fontSize: 14, fontFamily: 'var(--font-display)' }}>
                    {practice.short_name}
                  </span>
                </Link>
              );
            })}
          </div>
          {data.day_index < 7 && !allDone && (
            <p
              className="mok-muted"
              style={{ fontSize: 13, fontStyle: 'italic', marginTop: 14, maxWidth: 540 }}
            >
              {data.day_index === 0
                ? 'The first day. Begin with what feels easiest. One short practice is enough to start.'
                : `Day ${data.day_index + 1}. Just one at a time — the four are companions, not a checklist to rush.`}
            </p>
          )}
        </section>
      )}

      <section className="mok-today-section">
        <p className="mok-section-h3">The week, so far</p>
        <WeekTrail history={history} />
        {data.mci.activated ? (
          <Link to="/me/history" className="mok-mci-inline" style={{ textDecoration: 'none' }}>
            <span className="mok-mci-inline-number">{data.mci.mci}</span>
            <span className="mok-subtle">· {data.mci.milestone.toLowerCase()}</span>
            <span className="mok-subtle">›</span>
          </Link>
        ) : (
          <p
            className="mok-muted"
            style={{ fontSize: 13, fontStyle: 'italic', marginTop: 12, maxWidth: 580 }}
          >
            Your steady rhythm begins once you've practiced all seven.
          </p>
        )}
        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', marginTop: 12, maxWidth: 580 }}>
          A dot for each day you returned. The week takes shape as you do.
        </p>
      </section>

      {/* Weekly review prompt — appears once the practitioner has moved
          past the seven-week introduction (phase is no longer Arriving). */}
      {data.phase !== 'arriving' && (
        <section className="mok-today-section">
          <article className="mok-card mok-card--brand" style={{ padding: '22px 24px' }}>
            <p className="mok-eyebrow">Weekly review</p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: '-0.005em',
                margin: '6px 0 8px',
              }}
            >
              Take a few minutes to look back.
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.55, margin: '0 0 14px' }}>
              You've moved through the full introduction — all seven practices
              are open to you now. A short weekly reflection is a quiet way to
              notice what your practice is shaping.
            </p>
            <Link
              to="/me/journal?style=reflective&prompt=weekly-review"
              className="mok-btn mok-btn--lg"
              style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--accent-strong)' }}
            >
              Open this week's review →
            </Link>
          </article>
        </section>
      )}

      {recentJournal && (
        <section className="mok-today-section">
          <article className="mok-reflection">
            <div className="mok-reflection-meta">Today · {recentJournal.style}</div>
            <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
              {recentJournal.body.length > 200
                ? recentJournal.body.slice(0, 200).trim() + '…'
                : recentJournal.body}
            </p>
          </article>
          <Link
            to="/me/journal"
            className="mok-nav-link"
            style={{ padding: '12px 0 0', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Open journal ›
          </Link>
        </section>
      )}
    </div>
  );
}

function WeekTrail({ history }: { history: HistoryDay[] }) {
  const last7 = history.slice(-7);
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="mok-trail">
      {last7.map((d) => {
        const date = new Date(d.day + 'T00:00:00');
        const isToday = d.day === todayStr;
        const letter = 'SMTWTFS'.charAt(date.getDay());
        return (
          <div key={d.day} className={`mok-trail-cell ${isToday ? 'mok-trail-cell--today' : ''}`}>
            <span className="mok-trail-letter">{letter}</span>
            <span className="mok-trail-date">{date.getDate()}</span>
            <span className="mok-trail-dots">
              {d.practiced ? <span className="mok-trail-dot" /> : <span className="mok-trail-dot mok-trail-dot--empty" />}
            </span>
          </div>
        );
      })}
    </div>
  );
}
