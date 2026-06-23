import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getProfile,
  getTodaySummary,
  type Profile,
  type TodayScreen,
} from '../api/client';

/**
 * Reminder banner — a quiet sticky bar that surfaces when a scheduled
 * practice time approaches. Only fires when:
 *   - the user has opted in (`profile.reminders_on`)
 *   - they're in the first 21 days of the program
 *   - the scheduled time is within the next 10 minutes (or just passed)
 *   - the relevant practice hasn't been completed today
 *
 * When browser Notification permission is granted, a matching system
 * notification fires alongside the banner.
 */

const DISMISS_FOR_MS = 30 * 60 * 1000;
const REFRESH_TODAY_MS = 5 * 60 * 1000;
const TICK_MS = 30 * 1000;

/** Unlock day for each non-core nudge — mirrors the curriculum in
 *  backend services/practices.unlock_day_for. */
const UNLOCK_DAY: Record<string, number> = {
  moving: 21,    // Week 4
  resetting: 28, // Week 5
  aligning: 42,  // Week 7
};

/** Default times per onboarding band — used when the profile column
 *  is null (e.g. for a user whose practice unlocked but who hasn't
 *  visited Rhythm to set a specific time). */
const TIME_DEFAULTS: Record<string, {
  morningBlock: string;
  moving: string;
  resetting: string;
  aligning: string;
  writing: string;
}> = {
  morning:  { morningBlock: '07:30', moving: '15:00', resetting: '18:00', aligning: '21:00', writing: '22:00' },
  midday:   { morningBlock: '12:30', moving: '16:00', resetting: '18:00', aligning: '21:00', writing: '22:00' },
  evening:  { morningBlock: '17:00', moving: '19:00', resetting: '20:00', aligning: '22:00', writing: '22:30' },
  flexible: { morningBlock: '08:00', moving: '15:00', resetting: '18:00', aligning: '21:00', writing: '22:00' },
};

type Role =
  | 'morning'
  | 'breathing-extra'
  | 'moving'
  | 'resetting'
  | 'aligning'
  | 'writing';

interface ScheduledItem {
  id: string;
  time: string;
  role: Role;
  message: string;
  href: string;
  /** Practice keys to check against `practiced_today` for dismissal. */
  gateKeys: string[];
}

function minutesUntil(hhmm: string, now: Date): number | null {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(h) || Number.isNaN(mm)) return null;
  const target = new Date(now);
  target.setHours(h, mm, 0, 0);
  return (target.getTime() - now.getTime()) / 60_000;
}

export default function ReminderBanner() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [today, setToday] = useState<TodayScreen | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [dismissedAt, setDismissedAt] = useState<Record<string, number>>({});
  const lastNotifiedRef = useRef<string | null>(null);

  // Initial load.
  useEffect(() => {
    Promise.all([
      getProfile().catch(() => null),
      getTodaySummary().catch(() => null),
    ]).then(([p, t]) => {
      if (p) setProfile(p);
      if (t) setToday(t);
    });
  }, []);

  // Tick every 30s for clock check.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Refresh today's practiced list every 5 min.
  useEffect(() => {
    const id = setInterval(() => {
      getTodaySummary().then((t) => t && setToday(t)).catch(() => {});
    }, REFRESH_TODAY_MS);
    return () => clearInterval(id);
  }, []);

  // Ask for Notification permission once when the user opts in.
  useEffect(() => {
    if (!profile?.reminders_on) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [profile?.reminders_on]);

  const items = useMemo<ScheduledItem[]>(() => {
    if (!profile || !today) return [];
    const band = profile.preferred_time_of_day in TIME_DEFAULTS
      ? profile.preferred_time_of_day
      : 'morning';
    const d = TIME_DEFAULTS[band];
    const out: ScheduledItem[] = [];

    // Morning core — always present, day 1+
    const morningTime = profile.breathing_time || d.morningBlock;
    if (morningTime) {
      out.push({
        id: `morning-${morningTime}`,
        time: morningTime,
        role: 'morning',
        message: 'Time for your morning practices — Breathing, Thinking, Talking.',
        href: '/practices/breathing/session',
        gateKeys: ['breathing', 'thinking', 'talking'],
      });
    }

    // Optional extra Breathing returns through the day
    (profile.breathing_extra_times ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((t, i) => {
        out.push({
          id: `breathing-${i}-${t}`,
          time: t,
          role: 'breathing-extra',
          message: 'A breath break — return to your anchor.',
          href: '/practices/breathing/session',
          gateKeys: [],
        });
      });

    // Moving — week 4+
    if (today.day_index >= UNLOCK_DAY.moving) {
      out.push({
        id: `moving-${d.moving}`,
        time: d.moving,
        role: 'moving',
        message: 'Time to move — the body asks for attention.',
        href: '/practices/moving/session',
        gateKeys: ['moving'],
      });
    }

    // Resetting — week 5+
    if (today.day_index >= UNLOCK_DAY.resetting) {
      out.push({
        id: `resetting-${d.resetting}`,
        time: d.resetting,
        role: 'resetting',
        message: 'A conscious pause — step back from food or screens.',
        href: '/practices/resetting/session',
        gateKeys: ['resetting'],
      });
    }

    // Aligning — week 7+
    if (today.day_index >= UNLOCK_DAY.aligning) {
      out.push({
        id: `aligning-${d.aligning}`,
        time: d.aligning,
        role: 'aligning',
        message: 'Pause to align — meet yourself where you are today.',
        href: '/practices/aligning/session',
        gateKeys: ['aligning'],
      });
    }

    // Writing — always last, bedtime
    const writingTime = profile.writing_time || d.writing;
    if (writingTime) {
      out.push({
        id: `writing-${writingTime}`,
        time: writingTime,
        role: 'writing',
        message: 'Before bed — a short reflection.',
        href: '/journal',
        gateKeys: ['writing'],
      });
    }

    return out;
  }, [profile, today]);

  // Active gate — banner is eligible whenever the user has opted in.
  // Reminders now grow with the curriculum (more nudges at weeks 4+),
  // so we no longer hard-cut at day 21.
  const active = !!profile && !!today && profile.reminders_on;

  // Find the first due item — only meaningful when active.
  const due = useMemo<ScheduledItem | undefined>(() => {
    if (!active) return undefined;
    return items.find((it) => {
      const m = minutesUntil(it.time, now);
      if (m === null) return false;
      if (m > 10 || m < -5) return false;
      const da = dismissedAt[it.id];
      if (da && Date.now() - da < DISMISS_FOR_MS) return false;
      // Suppress once the relevant practice(s) are logged today. Extras
      // (gateKeys empty) never gate on done — Breathing is an anchor.
      if (it.gateKeys.length > 0) {
        const allDone = it.gateKeys.every((k) => today!.practiced_today.includes(k));
        if (allDone) return false;
      }
      return true;
    });
  }, [active, items, now, dismissedAt, today]);

  // Fire a single browser Notification when `due` becomes a new id.
  // Always run as a hook — body no-ops when there's nothing to fire.
  useEffect(() => {
    if (!due) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    if (lastNotifiedRef.current === due.id) return;
    try {
      new Notification('YouSourceful', {
        body: due.message,
        tag: due.id,
      });
      lastNotifiedRef.current = due.id;
    } catch {
      // Some browsers throw when the tab is hidden — silent fallback.
    }
  }, [due]);

  if (!due) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'var(--accent-soft)',
        borderBottom: '1px solid var(--accent)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 14, fontFamily: 'var(--font-sans)', flex: 1 }}>
        <span aria-hidden="true" style={{ marginRight: 8 }}>·</span>
        {due.message}
      </span>
      <Link to={due.href} className="mok-btn mok-btn--primary">
        Begin now
      </Link>
      <button
        type="button"
        className="mok-btn"
        onClick={() =>
          setDismissedAt((prev) => ({ ...prev, [due.id]: Date.now() }))
        }
      >
        Dismiss
      </button>
    </div>
  );
}
