import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  type CompanionHistory,
  getCompanionHistory,
  getDashboard,
  getMci,
  getMyTenantWelcome,
  getProfile,
  type DashboardData,
  type MciOut,
  type PracticeUnlock,
  type Profile,
  type TenantWelcome,
} from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';
import AskCompanionLink from '../components/AskCompanionLink';
import MciExplainer from '../components/MciExplainer';
import MeCalendar from '../components/MeCalendar';

/**
 * Me → Overview — the program journey view.
 *
 * Shows the user where they are in the 13+ week arc, which phase
 * they're currently in, which practices have unlocked, which Learn
 * modules they've finished, and the rhythm of the current week.
 *
 * Tone is encouraging without ever being competitive — counts and
 * checkmarks, never streaks or scores. The community pulse card at
 * the bottom is a placeholder until the aggregate endpoint lands.
 */

const PHASES = [
  { key: 'arriving',    label: 'Arriving',    weeks: 7, tag: 'Quiet steadiness begins.' },
  { key: 'steadying',   label: 'Steadying',   weeks: 3, tag: 'The practice begins to hold.' },
  { key: 'integrating', label: 'Integrating', weeks: 2, tag: 'It starts to live in your day.' },
  { key: 'living',      label: 'Living',      weeks: 4, tag: 'Practice is no longer separate.' },
] as const;

const TOTAL_WEEKS = PHASES.reduce((sum, p) => sum + p.weeks, 0); // 16
const TOTAL_DAYS = TOTAL_WEEKS * 7; // 112

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<TenantWelcome | null>(null);
  const [buddyHistory, setBuddyHistory] = useState<CompanionHistory | null>(null);
  const [mci, setMci] = useState<MciOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getDashboard(),
      getProfile().catch(() => null),
      getMyTenantWelcome().catch(() => null),
      getCompanionHistory(3).catch(() => null),
      getMci().catch(() => null),
    ])
      .then(([d, p, t, h, m]) => {
        setData(d);
        setProfile(p);
        setTenant(t);
        setBuddyHistory(h);
        setMci(m);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your program'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mok-loading">Opening your program…</div>;
  if (error) return <div className="mok-banner mok-banner--error">{error}</div>;
  if (!data) return null;

  const phaseInfo = PHASES.find((p) => p.key === data.phase) ?? PHASES[0];

  return (
    <section className="mok-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Vibrant identity hero — name, intention, phase, who I'm part of */}
      <YouCard
        profile={profile}
        tenant={tenant}
        phaseLabel={phaseInfo.label}
        dayNumber={data.day_index + 1}
        data={data}
      />

      {/* Calendar — at the top, the most actionable surface.
          Tracks past activity, plans upcoming cadence check-ins. */}
      <MeCalendar
        last30Days={data.last_30_days}
        byPractice={data.by_practice}
        cohortMeetingDay={profile?.cohort_meeting_day ?? null}
        cohortMeetingWindow={profile?.cohort_meeting_window ?? null}
      />

      {/* Consistency Index — appears after Arriving (week 7+), explained
          plainly so the number never feels like a score to chase. */}
      <IndexCard mci={mci} weekIndex={data.week_index} />

      {/* Where you could use a hand — tips for practices that have
          slipped, with a learning link for each. */}
      <ConsistencyHelp data={data} />

      {/* Phase strip — your place in the program journey */}
      <PhaseStrip data={data} />

      {/* Cohort + Buddy — the relational surfaces */}
      <CohortCard profile={profile} />
      <BuddyCard history={buddyHistory} />

      {/* Practices unfolding */}
      <PracticesUnfolding data={data} />

      {/* Learn progress */}
      <LearnProgress />

      {/* This week */}
      <WeekGrid data={data} />

      {/* Community pulse (placeholder until aggregate endpoint lands) */}
      <CommunityPulsePlaceholder />

      {/* Buddy link at the bottom */}
      <div style={{ textAlign: 'center', padding: '4px 0 16px' }}>
        <AskCompanionLink label="Need a hand? Ask your Buddy" />
      </div>
    </section>
  );
}

/* ── You card — identity + intention + employer ─────────────────── */

function initialsOf(name: string | null | undefined): string {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function YouCard({
  profile,
  tenant,
  phaseLabel,
  dayNumber,
  data,
}: {
  profile: Profile | null;
  tenant: TenantWelcome | null;
  phaseLabel: string;
  dayNumber: number;
  data: DashboardData;
}) {
  const name = profile?.name ?? 'You';
  const firstName = name.split(/\s+/)[0];
  const initials = initialsOf(profile?.name);
  const intention = profile?.intention?.trim();

  // The encouragement line adapts to where the user actually is, so
  // a Day 2 user feels welcomed and a Day 60 user feels recognized.
  // Always uplifting — never reproachful.
  const greeting = useMemo(
    () => buildGreeting({ dayNumber, totalSessions: data.total_sessions, daysPracticed30d: data.days_practiced_30d, firstName }),
    [dayNumber, data.total_sessions, data.days_practiced_30d, firstName],
  );

  return (
    <article
      className="mok-card mok-card--padded"
      style={{
        display: 'grid',
        gap: 18,
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, transparent), color-mix(in srgb, var(--accent) 3%, transparent))',
        borderColor: 'color-mix(in srgb, var(--accent) 25%, var(--border))',
      }}
    >
      {/* Avatar + name */}
      <div className="mok-row" style={{ gap: 14, alignItems: 'center' }}>
        <div
          aria-hidden="true"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'white',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="mok-eyebrow" style={{ margin: 0 }}>{greeting.eyebrow}</p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 400,
              margin: '4px 0 0',
              letterSpacing: '-0.01em',
              color: 'var(--text)',
              lineHeight: 1.2,
            }}
          >
            {greeting.title}
          </h1>
        </div>
      </div>

      {/* Uplifting one-liner — the line that makes them feel seen */}
      <div style={{ display: 'grid', gap: 10 }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-editorial)',
            fontSize: 17,
            fontStyle: 'italic',
            lineHeight: 1.55,
            color: 'var(--text)',
          }}
        >
          {greeting.lede}
        </p>
        {/* Spark — a brighter, more celebratory beat to lift the page */}
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 500,
            lineHeight: 1.45,
            color: 'var(--accent)',
            letterSpacing: '-0.005em',
          }}
        >
          {greeting.spark}
        </p>
      </div>

      {/* Soft stats row — what they've built, framed warmly */}
      <div
        className="mok-row"
        style={{
          gap: 14,
          flexWrap: 'wrap',
          padding: '12px 14px',
          borderRadius: 10,
          background: 'color-mix(in srgb, var(--accent) 8%, var(--bg-raised))',
        }}
      >
        <Stat number={dayNumber} label="day in" />
        <span style={{ opacity: 0.35 }}>·</span>
        <Stat number={data.total_sessions} label={data.total_sessions === 1 ? 'session' : 'sessions'} />
        <span style={{ opacity: 0.35 }}>·</span>
        <Stat number={data.days_practiced_30d} label="days this month" />
      </div>

      {/* Phase + employer line — quiet context, not loud chips */}
      <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: 0 }}>
        Currently in the <strong style={{ color: 'var(--accent)' }}>{phaseLabel}</strong> phase
        {tenant?.organisation_name && (
          <> · Part of {tenant.organisation_name}</>
        )}
      </p>

      {/* Intention — the why */}
      {intention && (
        <div
          style={{
            borderLeft: '3px solid var(--accent)',
            paddingLeft: 14,
            margin: '4px 0',
          }}
        >
          <p className="mok-eyebrow" style={{ margin: 0 }}>Your intention</p>
          <p
            style={{
              fontFamily: 'var(--font-editorial)',
              fontSize: 16,
              fontStyle: 'italic',
              lineHeight: 1.5,
              margin: '6px 0 0',
              color: 'var(--text)',
            }}
          >
            "{intention}"
          </p>
        </div>
      )}

      <div className="mok-row" style={{ justifyContent: 'flex-end', gap: 12 }}>
        <Link to="/me/settings" className="mok-subtle" style={{ fontSize: 13 }}>
          Edit your profile →
        </Link>
      </div>
    </article>
  );
}

/* ── Consistency Index card ──────────────────────────────────────
 * Surfaces the user's Mokshly Consistency Index on the Me page.
 * Hidden until the user has completed the 7-week Arriving phase —
 * before then a quiet "begins after week 7" placeholder is shown so
 * the user knows the surface exists and what it's for. */
function IndexCard({ mci, weekIndex }: { mci: MciOut | null; weekIndex: number }) {
  const weeksUntilActive = Math.max(0, 7 - weekIndex);
  const activated = mci?.activated === true;

  return (
    <article
      className="mok-card mok-card--padded"
      style={{
        display: 'grid',
        gap: 12,
        background: activated
          ? 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent), color-mix(in srgb, var(--accent) 2%, transparent))'
          : undefined,
        borderColor: activated ? 'color-mix(in srgb, var(--accent) 20%, var(--border))' : undefined,
      }}
    >
      <div className="mok-row" style={{ justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p className="mok-eyebrow" style={{ margin: 0 }}>Your Consistency Index</p>
          <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: '2px 0 0' }}>
            A quiet measure of your rhythm — yours alone.
          </p>
        </div>
        {activated && (
          <Link to="/me/history" className="mok-subtle" style={{ fontSize: 13 }}>
            See history →
          </Link>
        )}
      </div>

      {activated && mci ? (
        <>
          <div className="mok-row" style={{ alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 56,
                fontWeight: 400,
                lineHeight: 1,
                color: 'var(--accent)',
                letterSpacing: '-0.02em',
              }}
            >
              {mci.mci}
            </span>
            <div style={{ display: 'grid', gap: 2 }}>
              <span style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                {mci.milestone}
              </span>
              <span className="mok-subtle" style={{ fontSize: 12 }}>
                across the last {Math.min(mci.window_days / 7, 8)} weeks · lower is deeper
              </span>
            </div>
          </div>
          <MciExplainer />
        </>
      ) : (
        <div
          style={{
            padding: '16px 18px',
            borderRadius: 8,
            background: 'var(--bg-raised)',
            display: 'grid',
            gap: 8,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--text)',
            }}
          >
            {weeksUntilActive > 0
              ? `Your Index begins in ${weeksUntilActive} ${weeksUntilActive === 1 ? 'week' : 'weeks'}.`
              : 'Your Index begins as your first full week settles.'}
          </p>
          <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}>
            The first seven weeks are <strong>Arriving</strong> — you're meeting the
            practices, finding what fits. A score in this window would be noise.
            Once Arriving is complete, your Index will populate from your weekly rhythm.
          </p>
          <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--text)' }}>What it is:</strong> a single number from{' '}
            <strong style={{ color: 'var(--text)' }}>0 to 36</strong> — lower means a steadier
            rhythm. Across the last eight weeks it reads three signals:{' '}
            <strong>returning</strong>, the <strong>grip</strong> on each
            practice (weeks done ≥3 days), and the <strong>breadth</strong> of
            practices that have crossed that bar for at least half the window.
          </p>
        </div>
      )}
    </article>
  );
}

function Stat({ number, label }: { number: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 500,
          color: 'var(--accent)',
          letterSpacing: '-0.005em',
        }}
      >
        {number}
      </span>
      <span className="mok-subtle" style={{ fontSize: 12, letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  );
}

/** Build a warm, adaptive greeting based on where the user is. Every
 *  branch is uplifting — never reproachful for missed days. */
function buildGreeting({
  dayNumber,
  totalSessions,
  daysPracticed30d,
  firstName,
}: {
  dayNumber: number;
  totalSessions: number;
  daysPracticed30d: number;
  firstName: string;
}): { eyebrow: string; title: string; lede: string; spark: string } {
  // First two days — fresh start.
  if (dayNumber <= 2) {
    return {
      eyebrow: 'Welcome',
      title: `Hello, ${firstName}.`,
      lede: "You're at the start of something quiet and good. There's nothing to catch up on — just one breath, today.",
      spark: 'Today is page one of a story only you can write.',
    };
  }
  // First week — finding rhythm.
  if (dayNumber <= 7) {
    return {
      eyebrow: 'Settling in',
      title: `Hello, ${firstName}.`,
      lede: totalSessions === 0
        ? 'A practice waits for you whenever you open it. No rush, no schedule to honor. Just begin.'
        : `${totalSessions} ${totalSessions === 1 ? 'session' : 'sessions'} in your first week. You're already underway — that's the hardest part.`,
      spark: 'Something beautiful is taking shape — and it begins with you.',
    };
  }
  // Active recently — celebrate the rhythm.
  if (daysPracticed30d >= 15) {
    return {
      eyebrow: 'Steady rhythm',
      title: `Hello, ${firstName}.`,
      lede: `${daysPracticed30d} days of practice in the last month. The rhythm is yours now — keep returning.`,
      spark: 'This is what a life in alignment looks like. Keep going — you are luminous.',
    };
  }
  if (daysPracticed30d >= 5) {
    return {
      eyebrow: 'Showing up',
      title: `Hello, ${firstName}.`,
      lede: `${daysPracticed30d} days practiced this month. The practice is starting to fit you. Today is another chance to return.`,
      spark: 'Every return is a quiet victory — and yours are starting to add up.',
    };
  }
  // Coming back after a gap.
  if (daysPracticed30d > 0 && daysPracticed30d < 5) {
    return {
      eyebrow: 'Welcome back',
      title: `Hello, ${firstName}.`,
      lede: 'The practice has been waiting — never judging the time away. One breath, one moment, and the rhythm picks back up.',
      spark: 'Today is a fresh beginning — and you already know the way.',
    };
  }
  // Has sessions but none recent.
  if (totalSessions > 0) {
    return {
      eyebrow: 'Welcome back',
      title: `Hello, ${firstName}.`,
      lede: `${totalSessions} ${totalSessions === 1 ? 'session' : 'sessions'} in your history. The practice remembers — pick up wherever feels right today.`,
      spark: 'The path is delighted you came back. Let the rhythm find you again.',
    };
  }
  // Mid-program but no sessions yet — gentle invitation.
  return {
    eyebrow: 'Begin anywhere',
    title: `Hello, ${firstName}.`,
    lede: "The path is open. There's no wrong place to begin — one breath and you're in.",
    spark: 'A blank page is a beautiful place to begin.',
  };
}

function careerStageLabel(s: string): string {
  switch (s) {
    case 'early': return 'Early career';
    case 'mid': return 'Mid career';
    case 'senior': return 'Senior';
    case 'post-career': return 'Post-career';
    default: return s;
  }
}

/* ── Cohort card ─────────────────────────────────────────────── */

function CohortCard({ profile }: { profile: Profile | null }) {
  const cohortEnabled = profile?.cohort_enabled === true;
  const pref = profile?.cohort_preference;
  const meetingDay = profile?.cohort_meeting_day;
  const optedOut = pref === 'none';

  if (optedOut) {
    return (
      <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 8 }}>
        <p className="mok-eyebrow" style={{ margin: 0 }}>Your cohort</p>
        <p style={{ margin: 0, fontSize: 15 }}>Walking solo for now.</p>
        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: 0 }}>
          You can join a cohort whenever you're ready —{' '}
          <Link to="/me/rhythm" style={{ color: 'var(--accent)' }}>open Rhythm</Link>.
        </p>
      </article>
    );
  }

  if (!cohortEnabled) {
    return (
      <article
        className="mok-card mok-card--padded"
        style={{
          display: 'grid',
          gap: 8,
          background: 'var(--bg-raised)',
          borderStyle: 'dashed',
        }}
      >
        <p className="mok-eyebrow" style={{ margin: 0 }}>Your cohort</p>
        <p style={{ margin: 0, fontSize: 15 }}>Connect opens here when ready.</p>
        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: 0 }}>
          A small weekly circle — listening and being heard.
        </p>
      </article>
    );
  }

  return (
    <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 10 }}>
      <div className="mok-row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <p className="mok-eyebrow" style={{ margin: 0 }}>Your cohort</p>
        <span className="mok-muted" style={{ fontSize: 12 }}>Meets weekly</span>
      </div>
      <div className="mok-row" style={{ gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 22 }} aria-hidden="true">·∘·</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>
            A small weekly circle
          </p>
          <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: '2px 0 0' }}>
            {meetingDay
              ? `${meetingDay.charAt(0).toUpperCase()}${meetingDay.slice(1)}s.`
              : 'A day and time you choose.'}
          </p>
        </div>
      </div>
      <Link to="/connect" style={{ fontSize: 13, color: 'var(--accent)', fontStyle: 'italic' }}>
        Open Connect →
      </Link>
    </article>
  );
}

/* ── Buddy card — recent questions + count ─────────────────── */

function BuddyCard({ history }: { history: CompanionHistory | null }) {
  const total = history?.total ?? 0;
  const items = history?.items ?? [];

  return (
    <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 12 }}>
      <div className="mok-row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <p className="mok-eyebrow" style={{ margin: 0 }}>Your Buddy</p>
        <span className="mok-muted" style={{ fontSize: 12 }}>
          {total === 0
            ? 'No questions yet'
            : total === 1
              ? '1 question asked'
              : `${total} questions asked`}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', margin: 0 }}>
          Got a question about a practice, a moment, or what's coming up? Ask Buddy —
          it's the quiet helper that stays close, day to day.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
          {items.map((m) => (
            <li
              key={m.id}
              style={{
                fontSize: 14,
                lineHeight: 1.4,
                padding: '8px 12px',
                borderRadius: 6,
                background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
                borderLeft: '2px solid var(--accent)',
              }}
            >
              <span className="mok-subtle" style={{ fontSize: 11, marginRight: 6 }}>You asked:</span>
              <span style={{ fontStyle: 'italic' }}>"{trimmed(m.question, 100)}"</span>
            </li>
          ))}
        </ul>
      )}

      <Link to="/companion" style={{ fontSize: 13, color: 'var(--accent)', fontStyle: 'italic' }}>
        {items.length === 0 ? 'Open Buddy →' : 'Continue with Buddy →'}
      </Link>
    </article>
  );
}

function trimmed(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

/* ── Phase strip ─────────────────────────────────────────────── */

function PhaseStrip({ data }: { data: DashboardData }) {
  // Find the current phase + where the user sits within it.
  const userDay = Math.min(data.day_index, TOTAL_DAYS - 1);
  const dayInPhase = useMemo(() => {
    let cursor = 0;
    for (const p of PHASES) {
      const phaseDays = p.weeks * 7;
      if (p.key === data.phase) {
        return Math.max(0, Math.min(userDay - cursor, phaseDays));
      }
      cursor += phaseDays;
    }
    return 0;
  }, [data.phase, userDay]);

  const currentPhase = PHASES.find((p) => p.key === data.phase) ?? PHASES[0];
  const currentPhaseDays = currentPhase.weeks * 7;
  const weekInPhase = Math.floor(dayInPhase / 7) + 1;
  const progressInPhase = Math.min(100, ((dayInPhase + 1) / currentPhaseDays) * 100);

  // Compute when the next phase begins.
  const nextPhase = useMemo(() => {
    const idx = PHASES.findIndex((p) => p.key === data.phase);
    if (idx < 0 || idx >= PHASES.length - 1) return null;
    let daysToStart = -dayInPhase;
    for (let i = idx; i < PHASES.length; i++) {
      if (i > idx) break;
      daysToStart += PHASES[i].weeks * 7;
    }
    return { phase: PHASES[idx + 1], inDays: daysToStart };
  }, [data.phase, dayInPhase]);

  return (
    <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 16 }}>
      <div>
        <p className="mok-eyebrow" style={{ margin: 0 }}>Your journey</p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 500,
            margin: '4px 0 0',
            letterSpacing: '-0.005em',
          }}
        >
          You're in <span style={{ color: 'var(--accent)' }}>{currentPhase.label}</span> ·
          Week {weekInPhase} of {currentPhase.weeks}
        </h2>
        <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', margin: '4px 0 0' }}>
          {currentPhase.tag}
        </p>
      </div>

      {/* Progress within current phase */}
      <div style={{ display: 'grid', gap: 6 }}>
        <div className="mok-row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="mok-subtle" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Day {dayInPhase + 1} of {currentPhaseDays}
          </span>
          <span className="mok-subtle" style={{ fontSize: 11 }}>{Math.round(progressInPhase)}%</span>
        </div>
        <div
          style={{
            position: 'relative',
            height: 8,
            borderRadius: 4,
            background: 'var(--surface-raised)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressInPhase}%`,
              height: '100%',
              background: 'var(--accent)',
              transition: 'width 0.6s ease-out',
            }}
          />
        </div>
      </div>

      {/* All four phases as stepped cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {PHASES.map((p) => {
          const status: 'past' | 'current' | 'future' =
            PHASES.findIndex((x) => x.key === p.key) < PHASES.findIndex((x) => x.key === data.phase)
              ? 'past'
              : p.key === data.phase
                ? 'current'
                : 'future';
          return (
            <div
              key={p.key}
              style={{
                padding: '8px 6px',
                borderRadius: 8,
                border: status === 'current' ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                background:
                  status === 'past'
                    ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                    : status === 'current'
                      ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
                      : 'transparent',
                opacity: status === 'future' ? 0.6 : 1,
                textAlign: 'center',
                display: 'grid',
                gap: 2,
                minHeight: 70,
              }}
            >
              <span
                className="mok-subtle"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: status === 'current' ? 'var(--accent)' : 'var(--text-subtle)',
                  fontWeight: status === 'current' ? 600 : 400,
                }}
              >
                {status === 'past' ? '✓' : status === 'current' ? 'NOW' : 'NEXT'}
              </span>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: status === 'current' ? 600 : 500,
                  color: 'var(--text)',
                }}
              >
                {p.label}
              </p>
              <span className="mok-subtle" style={{ fontSize: 10 }}>
                {p.weeks} week{p.weeks === 1 ? '' : 's'}
              </span>
            </div>
          );
        })}
      </div>

      {/* What's next */}
      {nextPhase && (
        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
          {currentPhaseDays - dayInPhase === 1
            ? `Tomorrow, ${nextPhase.phase.label} begins.`
            : `${nextPhase.phase.label} begins in ${currentPhaseDays - dayInPhase} day${currentPhaseDays - dayInPhase === 1 ? '' : 's'}.`}
          {' '}<em>{nextPhase.phase.tag}</em>
        </p>
      )}
    </article>
  );
}

/* ── The seven practices — where you are in the path ───────── */

function PracticesUnfolding({ data }: { data: DashboardData }) {
  // Sort unlocks by unlock day so the visual reads as a timeline.
  const sorted = useMemo(
    () => [...data.unlocks].sort((a, b) => a.unlock_day - b.unlock_day),
    [data.unlocks],
  );
  const sessionsByKey = useMemo(() => {
    const m = new Map<string, number>();
    data.by_practice.forEach((p) => m.set(p.key, p.count_90d));
    return m;
  }, [data.by_practice]);

  const unlocked = sorted.filter((u) => u.unlocked).length;
  const total = sorted.length;

  return (
    <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 12 }}>
      <div>
        <div className="mok-row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <p className="mok-eyebrow" style={{ margin: 0 }}>The seven practices</p>
          <span className="mok-subtle" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {unlocked} of {total} open
          </span>
        </div>
        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: '4px 0 0' }}>
          Each one arrives in its own time. The first four are yours from Day 1; the others join your rhythm as the weeks unfold.
        </p>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {sorted.map((u) => (
          <PracticeRow
            key={u.key}
            unlock={u}
            dayIndex={data.day_index}
            sessions={sessionsByKey.get(u.key) ?? 0}
          />
        ))}
      </div>
    </article>
  );
}

function PracticeRow({
  unlock,
  dayIndex,
  sessions,
}: {
  unlock: PracticeUnlock;
  dayIndex: number;
  sessions: number;
}) {
  const Art = PracticeArt[unlock.key as PracticeKey];
  const color = PRACTICE_COLORS[unlock.key as PracticeKey] || 'var(--accent)';
  const isLocked = !unlock.unlocked;
  const daysUntil = unlock.unlock_day - dayIndex;

  const body = (
    <div
      className="mok-row"
      style={{
        gap: 12,
        padding: '10px 4px',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center',
        opacity: isLocked ? 0.55 : 1,
      }}
    >
      <span style={{ width: 28, display: 'flex', justifyContent: 'center' }}>
        {isLocked ? (
          <span className="mok-muted" style={{ fontSize: 14 }}>○</span>
        ) : (
          <span style={{ color: 'var(--accent)' }}>✓</span>
        )}
      </span>
      <span style={{ width: 60, fontSize: 12, color: 'var(--text-muted)' }}>
        Day {unlock.unlock_day + 1}
      </span>
      <Art color={color} size={20} />
      <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 16 }}>
        {unlock.name}
      </span>
      <span className="mok-muted" style={{ fontSize: 12, fontStyle: 'italic' }}>
        {isLocked
          ? daysUntil === 1
            ? 'unlocks tomorrow'
            : `unlocks in ${daysUntil} days`
          : sessions === 1
            ? '1 session'
            : `${sessions} sessions`}
      </span>
    </div>
  );

  if (isLocked) return body;
  return (
    <Link
      to={`/practices/${unlock.key}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {body}
    </Link>
  );
}

/* ── Learn progress ──────────────────────────────────────────── */

function LearnProgress() {
  // Read 5S progress from localStorage (utils/learnProgress).
  const [readCount, setReadCount] = useState(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('mok.learn.progress.v1');
      if (!raw) { setReadCount(0); return; }
      const parsed = JSON.parse(raw);
      const fiveS = ['source', 'seed', 'soil', 'season', 'sowing'];
      const modules: string[] = Array.isArray(parsed.modules) ? parsed.modules : [];
      setReadCount(fiveS.filter((s) => modules.includes(s)).length);
    } catch {
      setReadCount(0);
    }
  }, []);

  return (
    <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 10 }}>
      <div className="mok-row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <p className="mok-eyebrow" style={{ margin: 0 }}>Learn · 5S Framework</p>
        <span className="mok-muted" style={{ fontSize: 12 }}>{readCount} / 5 read</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: i < readCount ? 'var(--accent)' : 'var(--surface-raised)',
              border: '1px solid var(--border)',
            }}
          />
        ))}
      </div>
      {readCount < 5 ? (
        <Link
          to="/learn"
          style={{ fontSize: 13, color: 'var(--accent)', fontStyle: 'italic', textDecoration: 'underline' }}
        >
          Continue reading →
        </Link>
      ) : (
        <Link
          to="/learn/source"
          style={{ fontSize: 13, color: 'var(--accent)', fontStyle: 'italic', textDecoration: 'underline' }}
        >
          ↻ Revisit Source — you'll hear it differently now
        </Link>
      )}
    </article>
  );
}

/* ── This week grid ──────────────────────────────────────────── */

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function isoDayOfWeek(d: Date): number {
  const js = d.getDay();
  return js === 0 ? 6 : js - 1;
}

function WeekGrid({ data }: { data: DashboardData }) {
  // last 7 days from data.last_30_days, oldest first.
  const week = useMemo(() => {
    const counts = new Map<string, number>();
    data.last_30_days.forEach((d) => counts.set(d.day, d.count));
    const out: Array<{ key: string; label: string; count: number; isToday: boolean }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      out.push({
        key,
        label: WEEKDAY_LABELS[isoDayOfWeek(d)],
        count: counts.get(key) ?? 0,
        isToday: i === 0,
      });
    }
    return out;
  }, [data]);

  return (
    <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 12 }}>
      <p className="mok-eyebrow" style={{ margin: 0 }}>This week</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center' }}>
        {week.map((d) => (
          <div key={d.key} style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
            <span className="mok-muted" style={{ fontSize: 12 }}>{d.label}</span>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  d.count > 0
                    ? 'var(--accent)'
                    : d.isToday
                      ? 'var(--surface-raised)'
                      : 'transparent',
                border:
                  d.count > 0
                    ? '1px solid var(--accent)'
                    : d.isToday
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border)',
                color: d.count > 0 ? 'white' : 'var(--text-subtle)',
                fontSize: 12,
              }}
            >
              {d.count > 0 ? '✓' : d.isToday ? '·' : ''}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

/* ── Community pulse placeholder ─────────────────────────────── */

function CommunityPulsePlaceholder() {
  return (
    <article
      className="mok-card mok-card--padded"
      style={{
        display: 'grid',
        gap: 10,
        background: 'var(--bg-raised)',
        borderStyle: 'dashed',
      }}
    >
      <p className="mok-eyebrow" style={{ margin: 0 }}>The community today</p>
      <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', margin: 0 }}>
        A quiet hello from others practicing alongside you — coming soon.
        Counts only, never names.
      </p>
    </article>
  );
}

/* ── Consistency help — tips + learning for practices you've slipped on ── */

/** Per-practice consistency tips. Short, concrete, encouraging — and
 *  each pairs with a "read more" link to the practice's Part A so
 *  the user can refresh on the why if motivation is the gap. */
const CONSISTENCY_TIPS: Record<string, { tip: string; learnPath: string }> = {
  breathing: {
    tip: "Three conscious breaths between meetings is a real session. Don't wait for the perfect moment — the moment is when you remember.",
    learnPath: '/practices/breathing/learn',
  },
  thinking: {
    tip: 'Even sixty seconds with the anchor counts. Short and often beats long and rare. The drift is the practice.',
    learnPath: '/practices/thinking/learn',
  },
  talking: {
    tip: 'Speak one affirmation while making coffee. The morning kitchen is a fine place to set your inner voice for the day.',
    learnPath: '/practices/talking/learn',
  },
  writing: {
    tip: 'Open the journal, write one honest sentence. That can be the whole entry. The page holds whatever shows up.',
    learnPath: '/practices/writing/learn',
  },
  moving: {
    tip: 'Five squats while waiting for the kettle. A two-minute stretch before bed. The body remembers the small returns.',
    learnPath: '/practices/moving/learn',
  },
  resetting: {
    tip: 'Start with the daily 3-hour reset — phone away and food finished a few hours before sleep. That alone shifts a lot.',
    learnPath: '/practices/resetting/learn',
  },
  aligning: {
    tip: 'The 2–3 minute daily check-in is the easiest doorway. Pick a time you already keep — first sip of coffee, last thing before bed.',
    learnPath: '/practices/aligning/learn',
  },
};

interface ConsistencyGap {
  key: string;
  name: string;
  reason: string;
  tip: string;
  learnPath: string;
}

function ConsistencyHelp({ data }: { data: DashboardData }) {
  // Build per-practice last-practiced map.
  const gaps = useMemo<ConsistencyGap[]>(() => {
    const today = new Date();
    const out: ConsistencyGap[] = [];
    for (const p of data.by_practice) {
      const unlock = data.unlocks.find((u) => u.key === p.key);
      // Only nudge for practices that have actually unlocked.
      if (!unlock || !unlock.unlocked) continue;
      const tipEntry = CONSISTENCY_TIPS[p.key];
      if (!tipEntry) continue;

      let reason: string | null = null;
      if (!p.last_practiced) {
        reason = "You haven't tried this one yet.";
      } else {
        const last = new Date(p.last_practiced);
        const days = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 7) reason = `Last practiced ${days} days ago.`;
        else if (days >= 4 && p.count_90d < 8) reason = `It's been ${days} days, and the rhythm is still finding its feet.`;
      }
      if (!reason) continue;

      out.push({ key: p.key, name: p.name, reason, tip: tipEntry.tip, learnPath: tipEntry.learnPath });
    }
    return out;
  }, [data]);

  if (gaps.length === 0) {
    return (
      <article
        className="mok-card mok-card--padded"
        style={{
          display: 'grid',
          gap: 6,
          borderLeft: '3px solid var(--accent)',
        }}
      >
        <p className="mok-eyebrow" style={{ margin: 0 }}>Steady rhythm</p>
        <p style={{ margin: 0, fontSize: 14 }}>
          You're keeping a consistent practice across what's unlocked. Lovely.
        </p>
      </article>
    );
  }

  return (
    <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 12 }}>
      <div>
        <p className="mok-eyebrow" style={{ margin: 0 }}>Where you could use a hand</p>
        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: '2px 0 0' }}>
          A few practices the rhythm has slipped on. Small, doable nudges — and a quick refresh on the why.
        </p>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
        {gaps.slice(0, 4).map((g) => {
          const key = g.key as PracticeKey;
          const Art = PracticeArt[key];
          const color = PRACTICE_COLORS[key] || 'var(--accent)';
          return (
            <li
              key={g.key}
              style={{
                display: 'grid',
                gap: 8,
                padding: '12px',
                borderRadius: 8,
                borderLeft: `3px solid ${color}`,
                background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
              }}
            >
              <div className="mok-row" style={{ gap: 10, alignItems: 'center' }}>
                <Art color={color} size={22} />
                <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, flex: 1 }}>
                  {g.name}
                </p>
                <span className="mok-subtle" style={{ fontSize: 11 }}>{g.reason}</span>
              </div>

              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--text)' }}>
                {g.tip}
              </p>

              <div className="mok-row" style={{ gap: 12 }}>
                <Link
                  to={g.learnPath}
                  style={{ fontSize: 13, color: 'var(--accent)', fontStyle: 'italic' }}
                >
                  Refresh on the why →
                </Link>
                <Link
                  to={`/practices/${g.key}`}
                  style={{ fontSize: 13, color: 'var(--accent)', fontStyle: 'italic' }}
                >
                  Open the practice →
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
