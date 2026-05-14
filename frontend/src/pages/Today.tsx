import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getHistory,
  getTodaySummary,
  getTodaysJournal,
  type HistoryDay,
  type JournalEntry,
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

export default function Today() {
  const [data, setData] = useState<TodayScreen | null>(null);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [recentJournal, setRecentJournal] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTodaySummary(), getHistory(7), getTodaysJournal()])
      .then(([t, h, j]) => {
        if (cancelled) return;
        setData(t);
        setHistory(h.days);
        setRecentJournal(j);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load today'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const recommended = data?.recommended_practice;
  const recommendedKey = recommended?.key as PracticeKey | undefined;
  const Art = recommendedKey ? PracticeArt[recommendedKey] : null;
  const accent = recommendedKey ? PRACTICE_COLORS[recommendedKey] : 'var(--accent)';

  const podStyle = useMemo(
    () => ({ ['--practice-color' as string]: accent } as React.CSSProperties),
    [accent],
  );

  const recPracticed = !!data && recommendedKey ? data.practiced_today.includes(recommendedKey) : false;

  if (loading) return <div className="mok-loading">Drawing a breath…</div>;
  if (error) return <div className="mok-banner mok-banner--error">{error}</div>;
  if (!data) return null;

  const today = new Date(data.today + 'T00:00:00');
  const firstName = data.user_name.split(' ')[0] || data.user_name;

  return (
    <div className="mok-today mok-rise">
      <section className="mok-today-section" style={{ paddingTop: 40, paddingBottom: 28 }}>
        <p className="mok-today-meta">
          {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="mok-today-greeting">
          {greeting()}, {firstName}.
        </h1>
      </section>

      {recommended && (
        <section className="mok-today-section" style={{ paddingBottom: 28 }}>
          <article className="mok-pod" style={podStyle}>
            {Art && (
              <div className="mok-pod-art">
                <Art color={accent} size={64} />
              </div>
            )}
            <div className="mok-pod-body">
              <p className="mok-eyebrow" style={{ margin: '0 0 4px' }}>
                {data.phase === 'arriving' ? "Today's practice" : 'For today'}
              </p>
              <h2 className="mok-pod-name">{recommended.name}</h2>
              <p className="mok-pod-meta">
                {recommended.format} · {recommended.session_min}–{recommended.session_max} min
              </p>

              <div className="mok-pod-actions">
                {recPracticed ? (
                  <span className="mok-muted" style={{ fontSize: 13, fontFamily: 'var(--font-sans)' }}>
                    ✓ Practiced today.
                  </span>
                ) : (
                  <>
                    <Link
                      to={recommendedKey === 'writing' ? '/journal' : `/practices/${recommended.key}/session`}
                      className="mok-btn mok-btn--primary mok-btn--lg"
                    >
                      Begin →
                    </Link>
                    <Link to={`/practices/${recommended.key}`} className="mok-btn">
                      Read first
                    </Link>
                  </>
                )}
              </div>
            </div>
          </article>
        </section>
      )}

      <section className="mok-today-section">
        <p className="mok-section-h3">The week, so far</p>
        <WeekTrail history={history} />
        <Link to="/history" className="mok-mci-inline" style={{ textDecoration: 'none' }}>
          <span className="mok-mci-inline-number">{data.mci.mci}</span>
          <span className="mok-subtle">· {data.mci.milestone.toLowerCase()}</span>
          <span className="mok-subtle">›</span>
        </Link>
        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', marginTop: 12, maxWidth: 580 }}>
          A dot for each day you returned. The week takes shape as you do.
        </p>
      </section>

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
            to="/journal"
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
