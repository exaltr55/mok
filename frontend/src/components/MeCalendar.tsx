import { useEffect, useMemo, useState } from 'react';
import { type DashboardDay, type PracticeBreakdown } from '../api/client';
import {
  type CadencePlan,
  DAY_NAMES,
  getCadencePlan,
  MONTH_NAMES,
  setCadencePlan,
} from '../utils/cadencePlan';

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

/**
 * Me → Calendar — a single surface to track what's been practiced and
 * plan upcoming cadence check-ins (daily / weekly / monthly / seasonal).
 *
 * Three view modes:
 *   - Week (default): 7 columns, Sun→Sat, with practice dots and any
 *           scheduled check-ins highlighted. Week resets every Sunday
 *           at midnight (snapped via startOfWeek).
 *   - Month: standard 7×6 grid for the current month.
 *   - Year: 12 mini-month heatmaps — a year of practice at a glance.
 *
 * The "Plan your cadence" panel below the calendar lets the user pick
 * their daily time, weekly day, monthly date, and seasonal months.
 * Once chosen, those scheduled items render as accent rings on the
 * calendar days they fall on.
 */
interface Props {
  /** Activity from the dashboard endpoint — counts per day for the
   *  last 30 days. */
  last30Days: DashboardDay[];
  /** Per-practice breakdown — used so a clicked day can show which
   *  practices were completed that day. */
  byPractice: PracticeBreakdown[];
  /** Lowercase day name ("monday", "tuesday", …) — null if no cohort. */
  cohortMeetingDay: string | null;
  /** Free-text time window like "7:00 PM" — used in the legend tooltip
   *  and detail panel. */
  cohortMeetingWindow: string | null;
}

type View = 'week' | 'month' | 'year';

export default function MeCalendar({
  last30Days,
  byPractice,
  cohortMeetingDay,
  cohortMeetingWindow,
}: Props) {
  const [view, setView] = useState<View>('week');
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [plan, setPlan] = useState<CadencePlan>(() => getCadencePlan());
  const [selectedKey, setSelectedKey] = useState<string | null>(() => dayKey(new Date()));

  // Index activity by "YYYY-MM-DD" for fast lookup.
  const activityByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of last30Days) m.set(d.day, d.count);
    return m;
  }, [last30Days]);

  // Map day-string → index into the 30-day window, so we can look up
  // each practice's per-day count on a clicked day.
  const dayIndex30 = useMemo(() => {
    const m = new Map<string, number>();
    last30Days.forEach((d, i) => m.set(d.day, i));
    return m;
  }, [last30Days]);

  const cohortDayIndex = cohortMeetingDay ? DAY_NAME_TO_INDEX[cohortMeetingDay] ?? null : null;

  function updatePlan(patch: Partial<CadencePlan>) {
    setPlan((prev) => {
      const next = { ...prev, ...patch };
      setCadencePlan(next);
      return next;
    });
  }

  return (
    <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 14 }}>
      {/* Header + view toggle */}
      <div className="mok-row" style={{ justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p className="mok-eyebrow" style={{ margin: 0 }}>Your calendar</p>
          <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: '2px 0 0' }}>
            Track what's been practiced. Plan what's coming.
          </p>
        </div>
        <div className="mok-row" style={{ gap: 4 }} role="tablist" aria-label="Calendar view">
          {(['week', 'month', 'year'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`mok-btn ${view === v ? 'mok-btn--primary' : ''}`}
              style={{ fontSize: 12, padding: '4px 10px', minHeight: 0 }}
            >
              {v === 'week' ? 'Week' : v === 'month' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation header */}
      <div className="mok-row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          className="mok-btn mok-btn--ghost"
          onClick={() => setCursorDate((d) => shiftCursor(d, view, -1))}
          style={{ minHeight: 0, padding: '4px 10px' }}
          aria-label="Previous"
        >
          ←
        </button>
        <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>
          {headerLabel(cursorDate, view)}
        </p>
        <button
          type="button"
          className="mok-btn mok-btn--ghost"
          onClick={() => setCursorDate((d) => shiftCursor(d, view, +1))}
          style={{ minHeight: 0, padding: '4px 10px' }}
          aria-label="Next"
        >
          →
        </button>
      </div>

      {/* The calendar itself */}
      {view === 'week' && (
        <WeekView
          cursorDate={cursorDate}
          activity={activityByDay}
          plan={plan}
          cohortDayIndex={cohortDayIndex}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
        />
      )}
      {view === 'month' && (
        <MonthView
          cursorDate={cursorDate}
          activity={activityByDay}
          plan={plan}
          cohortDayIndex={cohortDayIndex}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
        />
      )}
      {view === 'year' && (
        <YearView cursorDate={cursorDate} activity={activityByDay} plan={plan} cohortDayIndex={cohortDayIndex} />
      )}

      {/* Day detail — what was practiced on the selected day */}
      {view !== 'year' && selectedKey && (
        <DayDetail
          dayKeyStr={selectedKey}
          byPractice={byPractice}
          dayIndex30={dayIndex30}
          plan={plan}
          cohortDayIndex={cohortDayIndex}
          cohortMeetingWindow={cohortMeetingWindow}
        />
      )}

      {/* Legend */}
      <Legend hasCohort={cohortDayIndex !== null} />

      {/* Cadence planner */}
      <CadencePlanner plan={plan} onChange={updatePlan} />
    </article>
  );
}

/* ── Date helpers ────────────────────────────────────────────── */

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date): Date {
  // Sunday-start week — resets every Sunday at midnight.
  const out = new Date(d);
  out.setDate(out.getDate() - out.getDay());
  out.setHours(0, 0, 0, 0);
  return out;
}

function shiftCursor(d: Date, view: View, dir: number): Date {
  const out = new Date(d);
  if (view === 'week') out.setDate(out.getDate() + dir * 7);
  else if (view === 'month') out.setMonth(out.getMonth() + dir);
  else out.setFullYear(out.getFullYear() + dir);
  return out;
}

function headerLabel(d: Date, view: View): string {
  if (view === 'week') {
    const start = startOfWeek(d);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}`;
  }
  if (view === 'month') {
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }
  return `${d.getFullYear()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface CellInfo {
  hasActivity: boolean;
  count: number;
  /** Cadence overlays scheduled for this day. */
  daily: boolean;
  weekly: boolean;
  monthly: boolean;
  seasonal: boolean;
  cohort: boolean;
  isToday: boolean;
}

function describeCell(
  d: Date,
  activity: Map<string, number>,
  plan: CadencePlan,
  today: Date,
  cohortDayIndex: number | null,
): CellInfo {
  const count = activity.get(dayKey(d)) ?? 0;
  const dow = d.getDay();
  const daily = plan.dailyTime != null;
  const weekly = plan.weeklyDay !== null && dow === plan.weeklyDay;
  const monthly = plan.monthlyDay !== null && d.getDate() === plan.monthlyDay;
  const seasonal = plan.seasonalMonths.includes(d.getMonth()) && d.getDate() === 1;
  const cohort = cohortDayIndex !== null && dow === cohortDayIndex;
  return {
    hasActivity: count > 0,
    count,
    daily,
    weekly,
    monthly,
    seasonal,
    cohort,
    isToday: isSameDay(d, today),
  };
}

/* ── Week view ───────────────────────────────────────────────── */

function WeekView({
  cursorDate,
  activity,
  plan,
  cohortDayIndex,
  selectedKey,
  onSelect,
}: {
  cursorDate: Date;
  activity: Map<string, number>;
  plan: CadencePlan;
  cohortDayIndex: number | null;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const start = useMemo(() => startOfWeek(cursorDate), [cursorDate]);
  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [start]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
      {days.map((d) => {
        const k = dayKey(d);
        const info = describeCell(d, activity, plan, today, cohortDayIndex);
        return (
          <DayCell
            key={k}
            date={d}
            info={info}
            large
            selected={selectedKey === k}
            onClick={() => onSelect(k)}
          />
        );
      })}
    </div>
  );
}

/* ── Month view (default) ────────────────────────────────────── */

function MonthView({
  cursorDate,
  activity,
  plan,
  cohortDayIndex,
  selectedKey,
  onSelect,
}: {
  cursorDate: Date;
  activity: Map<string, number>;
  plan: CadencePlan;
  cohortDayIndex: number | null;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const cells = useMemo(() => {
    const first = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursorDate]);

  return (
    <div style={{ display: 'grid', gap: 4 }}>
      {/* Weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <span
            key={d}
            className="mok-subtle"
            style={{ fontSize: 11, textAlign: 'center', letterSpacing: '0.16em', textTransform: 'uppercase' }}
          >
            {d}
          </span>
        ))}
      </div>
      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((d) => {
          const inMonth = d.getMonth() === cursorDate.getMonth();
          const k = dayKey(d);
          const info = describeCell(d, activity, plan, today, cohortDayIndex);
          return (
            <DayCell
              key={k}
              date={d}
              info={info}
              dimmed={!inMonth}
              selected={selectedKey === k}
              onClick={() => onSelect(k)}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Year view — 12 mini month heatmaps ─────────────────────── */

function YearView({
  cursorDate,
  activity,
  plan,
  cohortDayIndex,
}: {
  cursorDate: Date;
  activity: Map<string, number>;
  plan: CadencePlan;
  cohortDayIndex: number | null;
}) {
  const today = useMemo(() => new Date(), []);
  const year = cursorDate.getFullYear();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
      }}
    >
      {Array.from({ length: 12 }, (_, m) => (
        <MiniMonth
          key={m}
          year={year}
          month={m}
          activity={activity}
          plan={plan}
          today={today}
          cohortDayIndex={cohortDayIndex}
        />
      ))}
    </div>
  );
}

function MiniMonth({
  year,
  month,
  activity,
  plan,
  today,
  cohortDayIndex,
}: {
  year: number;
  month: number;
  activity: Map<string, number>;
  plan: CadencePlan;
  today: Date;
  cohortDayIndex: number | null;
}) {
  const first = new Date(year, month, 1);
  const start = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  // Trim trailing weeks that don't include this month's days.
  const usedCells = cells.filter((_, i) => i < 35 || cells[35].getMonth() === month);
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 500,
          textAlign: 'center',
        }}
      >
        {MONTH_NAMES[month]}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {usedCells.map((d) => {
          const inMonth = d.getMonth() === month;
          const info = describeCell(d, activity, plan, today, cohortDayIndex);
          return (
            <span
              key={dayKey(d)}
              title={inMonth ? `${MONTH_NAMES[month]} ${d.getDate()}${info.count ? ` — ${info.count} session${info.count === 1 ? '' : 's'}` : ''}` : ''}
              style={{
                aspectRatio: '1',
                borderRadius: 2,
                background: !inMonth
                  ? 'transparent'
                  : info.hasActivity
                    ? 'var(--accent)'
                    : 'color-mix(in srgb, var(--accent) 8%, transparent)',
                opacity: !inMonth ? 0.15 : 1,
                border: info.isToday ? '1.5px solid var(--accent)' : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Day cell (shared by Week & Month) ───────────────────────── */

function DayCell({
  date,
  info,
  dimmed = false,
  large = false,
  selected = false,
  onClick,
}: {
  date: Date;
  info: CellInfo;
  dimmed?: boolean;
  large?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const border = selected
    ? '2px solid var(--accent)'
    : info.isToday
      ? '1.5px solid var(--accent)'
      : '1px solid var(--border)';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: 'grid',
        gap: 4,
        padding: large ? '8px 6px' : '4px 4px',
        minHeight: large ? 92 : 56,
        borderRadius: 8,
        border,
        background: selected
          ? 'color-mix(in srgb, var(--accent) 20%, transparent)'
          : info.hasActivity
            ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
            : 'transparent',
        opacity: dimmed ? 0.4 : 1,
        textAlign: 'center',
        alignContent: 'start',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: selected ? '0 0 0 4px color-mix(in srgb, var(--accent) 14%, transparent)' : 'none',
        transition: 'background 120ms ease, box-shadow 120ms ease',
        color: 'inherit',
        font: 'inherit',
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontFamily: 'var(--font-display)',
          fontWeight: info.isToday || selected ? 600 : 400,
          color: info.isToday ? 'var(--accent)' : 'var(--text)',
        }}
      >
        {date.getDate()}
      </span>
      {/* Activity check */}
      {info.hasActivity && (
        <span style={{ fontSize: 14, color: 'var(--accent)', lineHeight: 1 }}>✓</span>
      )}
      {/* Cadence + cohort overlay dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 'auto' }}>
        {info.weekly && <Dot color="var(--accent)" title="Weekly review" />}
        {info.monthly && <Dot color="#D4954A" title="Monthly review" />}
        {info.seasonal && <Dot color="#4D6F8A" title="Seasonal review" />}
        {info.cohort && <Dot color="#7A5BA1" title="Cohort meeting" />}
      </div>
    </button>
  );
}

function Dot({ color, title }: { color: string; title: string }) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
      }}
    />
  );
}

/* ── Legend ──────────────────────────────────────────────────── */

function Legend({ hasCohort }: { hasCohort: boolean }) {
  return (
    <div className="mok-row" style={{ gap: 14, fontSize: 11, flexWrap: 'wrap', color: 'var(--text-muted)' }}>
      <span className="mok-row" style={{ gap: 4 }}>
        <span style={{ color: 'var(--accent)' }}>✓</span> Practiced
      </span>
      <span className="mok-row" style={{ gap: 4 }}>
        <Dot color="var(--accent)" title="Weekly review" /> Weekly review
      </span>
      <span className="mok-row" style={{ gap: 4 }}>
        <Dot color="#D4954A" title="Monthly review" /> Monthly review
      </span>
      <span className="mok-row" style={{ gap: 4 }}>
        <Dot color="#4D6F8A" title="Seasonal review" /> Seasonal review
      </span>
      {hasCohort && (
        <span className="mok-row" style={{ gap: 4 }}>
          <Dot color="#7A5BA1" title="Cohort meeting" /> Cohort meeting
        </span>
      )}
    </div>
  );
}

/* ── Day detail — what was practiced on the selected day ────── */

function DayDetail({
  dayKeyStr,
  byPractice,
  dayIndex30,
  plan,
  cohortDayIndex,
  cohortMeetingWindow,
}: {
  dayKeyStr: string;
  byPractice: PracticeBreakdown[];
  dayIndex30: Map<string, number>;
  plan: CadencePlan;
  cohortDayIndex: number | null;
  cohortMeetingWindow: string | null;
}) {
  const date = useMemo(() => parseDayKey(dayKeyStr), [dayKeyStr]);
  const today = useMemo(() => new Date(), []);
  const idx30 = dayIndex30.get(dayKeyStr);

  // Practices done on this day, if within the 30-day window.
  const practicesToday: { name: string; count: number }[] = [];
  if (idx30 !== undefined) {
    for (const b of byPractice) {
      const c = b.daily_30d[idx30] ?? 0;
      if (c > 0) practicesToday.push({ name: b.short_name || b.name, count: c });
    }
  }

  const dow = date.getDay();
  const isCohortDay = cohortDayIndex !== null && dow === cohortDayIndex;
  const isWeeklyReview = plan.weeklyDay !== null && dow === plan.weeklyDay;
  const isMonthlyReview = plan.monthlyDay !== null && date.getDate() === plan.monthlyDay;
  const isSeasonalReview = plan.seasonalMonths.includes(date.getMonth()) && date.getDate() === 1;
  const isDailyPlanned = plan.dailyTime != null;
  const isFuture = startOfDay(date).getTime() > startOfDay(today).getTime();
  const isPast = startOfDay(date).getTime() < startOfDay(today).getTime();
  const dayLabel = formatDayLabel(date, today);

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 8,
        border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border))',
        background: 'color-mix(in srgb, var(--accent) 5%, var(--bg-raised))',
        display: 'grid',
        gap: 10,
      }}
    >
      <div className="mok-row" style={{ justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
        <p className="mok-eyebrow" style={{ margin: 0 }}>{dayLabel}</p>
        {idx30 === undefined && !isFuture && (
          <span className="mok-subtle" style={{ fontSize: 11 }}>Outside the 30-day window</span>
        )}
      </div>

      {/* Practices completed */}
      {practicesToday.length > 0 ? (
        <div style={{ display: 'grid', gap: 6 }}>
          <p className="mok-muted" style={{ fontSize: 12, margin: 0, fontStyle: 'italic' }}>
            {isPast ? 'Practiced this day' : 'Practiced today'}
          </p>
          <div className="mok-row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {practicesToday.map((p) => (
              <span
                key={p.name}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                  color: 'var(--text)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ color: 'var(--accent)' }}>✓</span> {p.name}
                {p.count > 1 && <span className="mok-subtle" style={{ fontSize: 11 }}>×{p.count}</span>}
              </span>
            ))}
          </div>
        </div>
      ) : idx30 !== undefined && !isFuture ? (
        <p className="mok-muted" style={{ fontSize: 13, margin: 0, fontStyle: 'italic' }}>
          No practices logged that day — every day doesn't need to be perfect.
        </p>
      ) : null}

      {/* Scheduled for this day */}
      {(isCohortDay || isWeeklyReview || isMonthlyReview || isSeasonalReview || (isFuture && isDailyPlanned)) && (
        <div style={{ display: 'grid', gap: 6 }}>
          <p className="mok-muted" style={{ fontSize: 12, margin: 0, fontStyle: 'italic' }}>
            {isFuture ? 'Scheduled' : 'On this day'}
          </p>
          <div className="mok-row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {isFuture && isDailyPlanned && plan.dailyTime && (
              <ScheduleChip color="var(--accent)" label={`Daily check-in · ${plan.dailyTime}`} />
            )}
            {isWeeklyReview && <ScheduleChip color="var(--accent)" label="Weekly review · 10–15 min" />}
            {isMonthlyReview && <ScheduleChip color="#D4954A" label="Monthly review · 30–45 min" />}
            {isSeasonalReview && <ScheduleChip color="#4D6F8A" label="Seasonal review · 1–2 hours" />}
            {isCohortDay && (
              <ScheduleChip
                color="#7A5BA1"
                label={`Cohort meeting${cohortMeetingWindow ? ` · ${cohortMeetingWindow}` : ''}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleChip({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: '4px 10px',
        borderRadius: 999,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
        color: 'var(--text)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Dot color={color} title={label} /> {label}
    </span>
  );
}

function parseDayKey(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function formatDayLabel(d: Date, today: Date): string {
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(today).getTime()) / 86400000);
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
  const base = `${weekday}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  if (diff === 0) return `Today · ${base}`;
  if (diff === -1) return `Yesterday · ${base}`;
  if (diff === 1) return `Tomorrow · ${base}`;
  return base;
}

/* ── Cadence planner — pick when each review happens ────────── */

function CadencePlanner({
  plan,
  onChange,
}: {
  plan: CadencePlan;
  onChange: (patch: Partial<CadencePlan>) => void;
}) {
  const [open, setOpen] = useState(false);

  // Show the setup card collapsed by default — but auto-expand if
  // nothing has been planned yet, so first-time visitors see it.
  useEffect(() => {
    if (!plan.dailyTime && plan.weeklyDay == null && plan.monthlyDay == null && plan.seasonalMonths.length === 0) {
      setOpen(true);
    }
  }, [plan.dailyTime, plan.weeklyDay, plan.monthlyDay, plan.seasonalMonths.length]);

  const summary = summarizePlan(plan);

  return (
    <div
      style={{
        marginTop: 8,
        padding: '12px 14px',
        borderRadius: 8,
        background: 'var(--bg-raised)',
        display: 'grid',
        gap: open ? 14 : 0,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'transparent',
          border: 0,
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          color: 'inherit',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>
          <p className="mok-eyebrow" style={{ margin: 0 }}>Plan your cadence</p>
          <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: '2px 0 0' }}>
            {summary || 'Schedule your daily, weekly, monthly, and seasonal alignment check-ins.'}
          </p>
        </span>
        <span className="mok-subtle" style={{ fontSize: 14 }}>{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div style={{ display: 'grid', gap: 14 }}>
          {/* Daily */}
          <div style={{ display: 'grid', gap: 4 }}>
            <label htmlFor="cadence-daily" className="mok-eyebrow" style={{ margin: 0 }}>
              Daily check-in · 2–3 minutes
            </label>
            <input
              id="cadence-daily"
              type="time"
              value={plan.dailyTime ?? ''}
              onChange={(e) => onChange({ dailyTime: e.target.value || null })}
              style={{ width: 140, fontSize: 14, padding: '6px 10px' }}
            />
          </div>

          {/* Weekly */}
          <div style={{ display: 'grid', gap: 6 }}>
            <span className="mok-eyebrow" style={{ margin: 0 }}>Weekly review · 10–15 min</span>
            <div className="mok-row" style={{ gap: 4, flexWrap: 'wrap' }}>
              {DAY_NAMES.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onChange({ weeklyDay: plan.weeklyDay === i ? null : i })}
                  className={`mok-btn ${plan.weeklyDay === i ? 'mok-btn--primary' : ''}`}
                  style={{ fontSize: 12, padding: '4px 10px', minHeight: 0 }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly */}
          <div style={{ display: 'grid', gap: 4 }}>
            <label htmlFor="cadence-monthly" className="mok-eyebrow" style={{ margin: 0 }}>
              Monthly review · 30–45 min
            </label>
            <select
              id="cadence-monthly"
              value={plan.monthlyDay ?? ''}
              onChange={(e) => onChange({ monthlyDay: e.target.value ? Number(e.target.value) : null })}
              style={{ width: 200, fontSize: 14, padding: '6px 10px' }}
            >
              <option value="">Not scheduled</option>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{`Day ${d} of each month`}</option>
              ))}
            </select>
          </div>

          {/* Seasonal */}
          <div style={{ display: 'grid', gap: 6 }}>
            <span className="mok-eyebrow" style={{ margin: 0 }}>Seasonal review · 1–2 hours</span>
            <p className="mok-muted" style={{ fontSize: 12, fontStyle: 'italic', margin: 0 }}>
              Pick four months — typically the start of each quarter.
            </p>
            <div className="mok-row" style={{ gap: 4, flexWrap: 'wrap' }}>
              {MONTH_NAMES.map((name, i) => {
                const on = plan.seasonalMonths.includes(i);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      const next = on
                        ? plan.seasonalMonths.filter((m) => m !== i)
                        : [...plan.seasonalMonths, i].sort((a, b) => a - b);
                      onChange({ seasonalMonths: next });
                    }}
                    className={`mok-btn ${on ? 'mok-btn--primary' : ''}`}
                    style={{ fontSize: 12, padding: '4px 10px', minHeight: 0 }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function summarizePlan(p: CadencePlan): string {
  const bits: string[] = [];
  if (p.dailyTime) bits.push(`daily at ${p.dailyTime}`);
  if (p.weeklyDay != null) bits.push(`weekly on ${DAY_NAMES[p.weeklyDay]}`);
  if (p.monthlyDay) bits.push(`monthly on day ${p.monthlyDay}`);
  if (p.seasonalMonths.length > 0) bits.push(`seasonal in ${p.seasonalMonths.map((m) => MONTH_NAMES[m]).join(', ')}`);
  return bits.length === 0 ? '' : `Currently: ${bits.join(' · ')}.`;
}
