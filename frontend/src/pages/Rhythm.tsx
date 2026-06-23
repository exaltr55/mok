import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getDashboard,
  getProfile,
  updateProfile,
  type DashboardData,
  type Profile,
} from '../api/client';

/**
 * Your Rhythm — the time-keeper page.
 *
 * Three things in one place:
 *   1. A warm greeting tuned to time of day, week, and phase.
 *   2. Your personal practice time (committed slot, countdown to today's,
 *      and a way to begin or edit).
 *   3. Cohort timekeeping — when your group meets, countdown to next.
 *
 * Plus a quiet week-grid showing which days you've practiced this week.
 *
 * The richer scheduling controls (specific time-of-day clock,
 * preferred days per week, cohort meeting day/window) live here instead
 * of being scattered in Settings.
 */

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TIME_BANDS = ['morning', 'midday', 'evening', 'flexible'] as const;

/** Suggested default times based on the user's coarse onboarding
 *  preference. The morning block bundles Breathing, Thinking, and
 *  Talking into one reminder — ideally within ~2 hours of waking.
 *  Writing is always last — bedtime ritual at 22:00. */
const TIME_DEFAULTS: Record<string, { morningBlock: string; writing: string }> = {
  morning:  { morningBlock: '07:30', writing: '22:00' },
  midday:   { morningBlock: '12:30', writing: '22:00' },
  evening:  { morningBlock: '17:00', writing: '22:30' },
  flexible: { morningBlock: '08:00', writing: '22:00' },
};

const REMINDERS_FIRST_DAYS = 21;

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function phaseLabel(phase: string): string {
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}

/** Local-time YYYY-MM-DD for the last 7 days, oldest first. */
function lastSevenDayKeys(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

/** Mon=1 .. Sun=7 (ISO). Used to index WEEKDAYS. */
function isoDayOfWeek(d: Date): number {
  const js = d.getDay(); // 0=Sun..6=Sat
  return js === 0 ? 6 : js - 1; // → 0=Mon..6=Sun
}

/** Days until the next occurrence of `targetDay` (cohort weekday).
 *  0 means today. Returns null if targetDay is invalid. */
function daysUntilWeekday(targetDay: string | null): number | null {
  if (!targetDay) return null;
  const idx = WEEKDAYS.indexOf(targetDay as (typeof WEEKDAYS)[number]);
  if (idx < 0) return null;
  const today = isoDayOfWeek(new Date());
  return (idx - today + 7) % 7;
}

/** Human-readable countdown. */
function countdownPhrase(daysAway: number | null): string {
  if (daysAway === null) return '';
  if (daysAway === 0) return 'today';
  if (daysAway === 1) return 'tomorrow';
  return `in ${daysAway} days`;
}

/** Compute time until `HH:MM` today (or tomorrow if past). Returns
 *  a friendly string, or null if no committed time. */
function practiceTimeCountdown(hhmm: string | null): string | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  let diffMin = Math.round((target.getTime() - now.getTime()) / 60_000);
  if (diffMin < -5) {
    target.setDate(target.getDate() + 1);
    diffMin = Math.round((target.getTime() - now.getTime()) / 60_000);
  }
  if (diffMin >= -5 && diffMin <= 5) return 'now';
  if (diffMin < 0) return 'today (passed)';
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (hours === 0) return `in ${mins} min`;
  if (mins === 0) return `in ${hours} h`;
  return `in ${hours} h ${mins} min`;
}

export default function Rhythm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<'practice' | 'cohort' | null>(null);
  const [draftDays, setDraftDays] = useState(5);
  const [draftBand, setDraftBand] = useState<string>('morning');
  const [draftTime, setDraftTime] = useState('');
  const [draftCohortDay, setDraftCohortDay] = useState('');
  const [draftCohortWindow, setDraftCohortWindow] = useState('');
  const [saving, setSaving] = useState(false);
  // Per-practice schedule drafts. The "morning block" time is held
  // in breathingTime — it covers Breathing + Thinking + Talking. The
  // thinking_time and talking_time columns mirror it on save.
  const [breathingTime, setBreathingTime] = useState('');
  const [writingTime, setWritingTime] = useState('');
  // Up to 3 extra Breathing times the user can add throughout the day.
  const [breathingExtras, setBreathingExtras] = useState<string[]>([]);
  const [remindersOn, setRemindersOn] = useState(false);
  const [savingTimes, setSavingTimes] = useState(false);

  useEffect(() => {
    Promise.all([getProfile(), getDashboard().catch(() => null)])
      .then(([p, d]) => {
        setProfile(p);
        setDashboard(d);
        setDraftDays(p.preferred_days_per_week);
        setDraftBand(p.preferred_time_of_day);
        setDraftTime(p.preferred_practice_time ?? '');
        setDraftCohortDay(p.cohort_meeting_day ?? '');
        setDraftCohortWindow(p.cohort_meeting_window ?? '');
        setBreathingTime(p.breathing_time ?? '');
        setWritingTime(p.writing_time ?? '');
        setBreathingExtras(
          (p.breathing_extra_times ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        );
        setRemindersOn(p.reminders_on);
      })
      .finally(() => setLoading(false));
  }, []);

  // Build last-7-days status from dashboard.last_30_days.
  const week = useMemo(() => {
    const keys = lastSevenDayKeys();
    const counts = new Map<string, number>();
    dashboard?.last_30_days.forEach((d) => counts.set(d.day, d.count));
    const todayIdx = 6;
    return keys.map((k, i) => ({
      key: k,
      label: WEEKDAY_LABELS[isoDayOfWeek(new Date(k))],
      count: counts.get(k) ?? 0,
      isToday: i === todayIdx,
    }));
  }, [dashboard]);

  async function savePractice() {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await updateProfile({
        preferred_days_per_week: draftDays,
        preferred_time_of_day: draftBand,
        preferred_practice_time: draftTime || null,
      });
      setProfile(updated);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function saveCohort() {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await updateProfile({
        cohort_meeting_day: draftCohortDay || null,
        cohort_meeting_window: draftCohortWindow || null,
      });
      setProfile(updated);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  function applyDefaults() {
    const band = profile?.preferred_time_of_day ?? 'morning';
    const d = TIME_DEFAULTS[band] ?? TIME_DEFAULTS.morning;
    // One reminder covers Breathing, Thinking, and Talking together —
    // we anchor all three to the morning-block time.
    setBreathingTime(d.morningBlock);
    setThinkingTime(d.morningBlock);
    setTalkingTime(d.morningBlock);
    setWritingTime(d.writing);
  }

  async function saveTimes() {
    if (!profile) return;
    setSavingTimes(true);
    try {
      // The "morning block" time is stored in all three of
      // breathing/thinking/talking so any consumer (current or future)
      // sees the same value. Reminders only fire one banner using
      // breathing_time as the canonical morning trigger.
      // Extras are joined comma-separated; empty string clears them.
      const extras = breathingExtras.filter(Boolean).join(',');
      const updated = await updateProfile({
        breathing_time: breathingTime || null,
        thinking_time: breathingTime || null,
        talking_time: breathingTime || null,
        writing_time: writingTime || null,
        breathing_extra_times: extras || null,
        reminders_on: remindersOn,
      });
      setProfile(updated);
    } finally {
      setSavingTimes(false);
    }
  }

  if (loading) return <div className="mok-loading">Opening your rhythm…</div>;
  if (!profile) return <div className="mok-banner mok-banner--error">Couldn't load profile.</div>;

  const firstName = profile.name.split(' ')[0];
  const practiceCountdown = practiceTimeCountdown(profile.preferred_practice_time);
  const cohortDaysAway = daysUntilWeekday(profile.cohort_meeting_day);

  return (
    <section className="mok-rise" style={{ display: 'grid', gap: 22 }}>
      {/* Greeting */}
      <header style={{ paddingTop: 8 }}>
        <p className="mok-eyebrow">Rhythm</p>
        <h1 className="mok-section-title">
          {timeOfDayGreeting()}, {firstName}.
        </h1>
        <p className="mok-section-lede">{phaseLabel(profile.phase)} phase · here is your week.</p>
      </header>

      {/* Practice time card */}
      <article className="mok-card mok-card--padded">
        <div className="mok-row" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p className="mok-eyebrow">Your practice time</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, margin: '8px 0 4px' }}>
              {profile.preferred_practice_time || `${profile.preferred_time_of_day}s`} ·
              {' '}{profile.preferred_days_per_week} day{profile.preferred_days_per_week === 1 ? '' : 's'}/week
            </p>
            {practiceCountdown && (
              <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic' }}>
                Next: {practiceCountdown}
              </p>
            )}
          </div>
          <div className="mok-row" style={{ gap: 8 }}>
            <Link to="/today" className="mok-btn mok-btn--primary">Begin now</Link>
            <button
              type="button"
              className="mok-btn"
              onClick={() => setEditing(editing === 'practice' ? null : 'practice')}
            >
              {editing === 'practice' ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>

        {editing === 'practice' && (
          <div style={{ marginTop: 18, display: 'grid', gap: 14 }}>
            <div>
              <p className="mok-eyebrow" style={{ marginBottom: 6 }}>Days per week</p>
              <div className="mok-row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`mok-session-btn ${draftDays === n ? 'mok-session-btn--accent' : ''}`}
                    onClick={() => setDraftDays(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mok-eyebrow" style={{ marginBottom: 6 }}>Time of day</p>
              <div className="mok-row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {TIME_BANDS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`mok-session-btn ${draftBand === b ? 'mok-session-btn--accent' : ''}`}
                    onClick={() => setDraftBand(b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mok-eyebrow" style={{ marginBottom: 6 }}>
                Specific time <span className="mok-muted" style={{ fontStyle: 'italic', fontSize: 12 }}>(optional)</span>
              </p>
              <input
                type="time"
                value={draftTime}
                onChange={(e) => setDraftTime(e.target.value)}
                style={{ fontSize: 15, padding: '6px 10px' }}
              />
              {draftTime && (
                <button
                  type="button"
                  className="mok-btn"
                  onClick={() => setDraftTime('')}
                  style={{ marginLeft: 8 }}
                >
                  Clear
                </button>
              )}
            </div>
            <div>
              <button
                type="button"
                className="mok-btn mok-btn--primary"
                disabled={saving}
                onClick={savePractice}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </article>

      {/* Cohort card */}
      <article className="mok-card mok-card--padded">
        <div className="mok-row" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p className="mok-eyebrow">Your cohort</p>
            {profile.cohort_meeting_day ? (
              <>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, margin: '8px 0 4px', textTransform: 'capitalize' }}>
                  {profile.cohort_meeting_day}s
                  {profile.cohort_meeting_window ? ` · ${profile.cohort_meeting_window}` : ''}
                </p>
                {cohortDaysAway !== null && (
                  <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic' }}>
                    Next: {countdownPhrase(cohortDaysAway)}
                  </p>
                )}
              </>
            ) : (
              <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', marginTop: 8 }}>
                No cohort meeting set.
              </p>
            )}
          </div>
          <button
            type="button"
            className="mok-btn"
            onClick={() => setEditing(editing === 'cohort' ? null : 'cohort')}
          >
            {editing === 'cohort' ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing === 'cohort' && (
          <div style={{ marginTop: 18, display: 'grid', gap: 14 }}>
            <div>
              <p className="mok-eyebrow" style={{ marginBottom: 6 }}>Meeting day</p>
              <div className="mok-row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {WEEKDAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`mok-session-btn ${draftCohortDay === d ? 'mok-session-btn--accent' : ''}`}
                    onClick={() => setDraftCohortDay(d)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
                {draftCohortDay && (
                  <button
                    type="button"
                    className="mok-btn"
                    onClick={() => setDraftCohortDay('')}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="mok-eyebrow" style={{ marginBottom: 6 }}>
                Meeting window <span className="mok-muted" style={{ fontStyle: 'italic', fontSize: 12 }}>(e.g. 7–8pm)</span>
              </p>
              <input
                type="text"
                value={draftCohortWindow}
                onChange={(e) => setDraftCohortWindow(e.target.value)}
                placeholder="7–8pm"
                maxLength={30}
                style={{ fontSize: 15, padding: '6px 10px', maxWidth: 200 }}
              />
            </div>
            <div>
              <button
                type="button"
                className="mok-btn mok-btn--primary"
                disabled={saving}
                onClick={saveCohort}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </article>

      {/* Practice times — two reminders: morning block + bedtime writing */}
      <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 12 }}>
        <div className="mok-row" style={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Practice times</p>
            <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: '4px 0 0' }}>
              Two gentle anchors — a morning block that holds Breathing,
              Thinking, and Talking together; and Writing at bedtime.
            </p>
          </div>
          <button type="button" className="mok-btn" onClick={applyDefaults}>
            Set defaults
          </button>
        </div>

        <div style={{ display: 'grid', gap: 14, marginTop: 4 }}>
          <div className="mok-row" style={{ gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, margin: 0 }}>
                When would you like to do Breathing, Thinking, and Talking?
              </p>
              <p className="mok-muted" style={{ fontSize: 12, fontStyle: 'italic', margin: '2px 0 0' }}>
                One after another. Within two hours of waking works well.
              </p>
            </div>
            <input
              type="time"
              value={breathingTime}
              onChange={(e) => setBreathingTime(e.target.value)}
              style={{ fontSize: 15, padding: '4px 8px', maxWidth: 130 }}
            />
          </div>
          <div className="mok-row" style={{ gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, margin: 0 }}>
                When would you like to do Writing?
              </p>
              <p className="mok-muted" style={{ fontSize: 12, fontStyle: 'italic', margin: '2px 0 0' }}>
                A short reflection before sleep. 10:00 PM is a good place to start.
              </p>
            </div>
            <input
              type="time"
              value={writingTime}
              onChange={(e) => setWritingTime(e.target.value)}
              style={{ fontSize: 15, padding: '4px 8px', maxWidth: 130 }}
            />
          </div>
        </div>

        {/* Additional Breathing sessions — Breathing is an anchor the
            user can return to throughout the day. Up to 3 extras. */}
        <div style={{ marginTop: 4, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div className="mok-row" style={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, margin: 0 }}>
                More Breathing through the day?
              </p>
              <p className="mok-muted" style={{ fontSize: 12, fontStyle: 'italic', margin: '2px 0 0' }}>
                Breathing is your anchor — return to it whenever you need.
                Add up to three more times.
              </p>
            </div>
            {breathingExtras.length < 3 && (
              <button
                type="button"
                className="mok-btn"
                onClick={() => setBreathingExtras([...breathingExtras, ''])}
              >
                + Add time
              </button>
            )}
          </div>
          {breathingExtras.length > 0 && (
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {breathingExtras.map((t, i) => (
                <div
                  key={i}
                  className="mok-row"
                  style={{ gap: 10, alignItems: 'center', justifyContent: 'flex-end' }}
                >
                  <span className="mok-muted" style={{ fontSize: 13, marginRight: 'auto' }}>
                    Breathing · {i + 2}
                  </span>
                  <input
                    type="time"
                    value={t}
                    onChange={(e) => {
                      const next = [...breathingExtras];
                      next[i] = e.target.value;
                      setBreathingExtras(next);
                    }}
                    style={{ fontSize: 15, padding: '4px 8px', maxWidth: 130 }}
                  />
                  <button
                    type="button"
                    className="mok-btn"
                    aria-label="Remove"
                    onClick={() => setBreathingExtras(breathingExtras.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <label
          className="mok-row"
          style={{ gap: 10, alignItems: 'center', marginTop: 4, cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={remindersOn}
            onChange={(e) => setRemindersOn(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          <span style={{ fontSize: 14 }}>
            Remind me at these times
          </span>
        </label>
        <p className="mok-muted" style={{ fontSize: 12, fontStyle: 'italic', margin: 0 }}>
          New nudges arrive as practices unlock — Moving in week 4, Resetting in week 5,
          Aligning in week 7. You can turn reminders off anytime.
        </p>

        <div>
          <button
            type="button"
            className="mok-btn mok-btn--primary"
            disabled={savingTimes}
            onClick={saveTimes}
          >
            {savingTimes ? 'Saving…' : 'Save practice times'}
          </button>
        </div>
      </article>

      {/* This week grid */}
      <article className="mok-card mok-card--padded">
        <p className="mok-eyebrow">This week</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 8,
            marginTop: 14,
            textAlign: 'center',
          }}
        >
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
                aria-label={
                  d.count > 0
                    ? `${d.count} session${d.count === 1 ? '' : 's'} on ${d.key}`
                    : `No session on ${d.key}`
                }
              >
                {d.count > 0 ? '✓' : d.isToday ? '·' : ''}
              </span>
            </div>
          ))}
        </div>
        <p className="mok-muted" style={{ fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 12 }}>
          ✓ practiced · · today
        </p>
      </article>
    </section>
  );
}
