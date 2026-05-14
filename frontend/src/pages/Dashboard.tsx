import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getDashboard,
  getMci,
  type DashboardData,
  type MciOut,
  type PracticeBreakdown,
} from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';

/**
 * Dashboard — aggregate charts across all 7 practices, plus a "continue your
 * practice" hand-off and per-practice progress sparklines. Everything here is
 * user-scoped (Tier 1 sacred data). Nothing on this screen is ever shared.
 */
export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [mci, setMci] = useState<MciOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getDashboard(), getMci()])
      .then(([d, m]) => {
        setData(d);
        setMci(m);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  // Charts data with theme-aware colours.
  const pieData = useMemo(
    () =>
      data
        ? data.by_practice
            .filter((p) => p.count_90d > 0)
            .map((p) => ({
              name: p.short_name,
              value: p.count_90d,
              color: getCssColor(PRACTICE_COLORS[p.key as PracticeKey] || 'var(--accent)'),
            }))
        : [],
    [data],
  );

  const barData = useMemo(
    () =>
      data
        ? data.by_practice.map((p) => ({
            name: p.short_name,
            '30 days': p.count_30d,
            '90 days': p.count_90d,
            color: getCssColor(PRACTICE_COLORS[p.key as PracticeKey] || 'var(--accent)'),
          }))
        : [],
    [data],
  );

  const timelineData = useMemo(
    () =>
      data
        ? data.last_30_days.map((d) => ({
            day: d.day.slice(5),
            count: d.count,
          }))
        : [],
    [data],
  );

  if (loading) return <div className="mok-loading">Drawing your patterns…</div>;
  if (error) return <div className="mok-banner mok-banner--error">{error}</div>;
  if (!data) return null;

  const accentColor = getCssColor('var(--accent)');
  const accentSoft = getCssColor('var(--accent-soft)');
  const borderColor = getCssColor('var(--border)');
  const textMuted = getCssColor('var(--text-muted)');
  const textSubtle = getCssColor('var(--text-subtle)');

  const lastKey = data.last_practice_key as PracticeKey | null;
  const lastPractice = lastKey
    ? data.by_practice.find((p) => p.key === lastKey) ?? null
    : null;

  return (
    <div className="mok-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Continue last practice — surface the doorway you most recently walked */}
      {lastPractice ? (
        <ContinueCard
          practice={lastPractice}
          when={data.last_practice_day}
        />
      ) : (
        <FirstTimeCard />
      )}

      {/* Top stats */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        <StatCard label="Days practiced" value={data.days_practiced_30d} sub="of last 30" />
        <StatCard label="Days practiced" value={data.days_practiced_90d} sub="of last 90" />
        <StatCard label="Total sessions" value={data.total_sessions} sub="in 90 days" />
        {mci && <StatCard label="MCI" value={mci.mci} sub={mci.milestone.toLowerCase()} accent />}
      </section>

      {/* Per-practice — bar chart */}
      <section className="mok-card">
        <p className="mok-section-h3">By doorway · sessions over 30 / 90 days</p>
        <div style={{ width: '100%', height: 240, marginTop: 12 }}>
          <ResponsiveContainer>
            <BarChart data={barData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={borderColor} strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: textMuted, fontFamily: 'Inter, sans-serif' }}
                tickLine={false}
                axisLine={{ stroke: borderColor }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: textSubtle, fontFamily: 'Inter, sans-serif' }}
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
              />
              <Tooltip content={<CalmTooltip />} cursor={{ fill: accentSoft }} />
              <Bar dataKey="30 days" radius={[2, 2, 0, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={d.color} fillOpacity={0.95} />
                ))}
              </Bar>
              <Bar dataKey="90 days" radius={[2, 2, 0, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={d.color} fillOpacity={0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* Distribution donut */}
        {pieData.length > 0 && (
          <section className="mok-card">
            <p className="mok-section-h3">Distribution · the doorways you walk</p>
            <div style={{ width: '100%', height: 240, marginTop: 12 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CalmTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <DistributionLegend data={pieData} />
          </section>
        )}

        {/* 30-day timeline */}
        <section className="mok-card">
          <p className="mok-section-h3">Last 30 days · daily count</p>
          <div style={{ width: '100%', height: 200, marginTop: 12 }}>
            <ResponsiveContainer>
              <AreaChart data={timelineData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="mokTimelineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={borderColor} strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: textSubtle, fontFamily: 'Inter, sans-serif' }}
                  tickLine={false}
                  axisLine={{ stroke: borderColor }}
                  interval={3}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: textSubtle, fontFamily: 'Inter, sans-serif' }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip content={<CalmTooltip />} cursor={{ stroke: accentColor, strokeDasharray: '3 3' }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={accentColor}
                  strokeWidth={1.5}
                  fill="url(#mokTimelineFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Per-practice cards with sparklines */}
      <section>
        <p className="mok-section-h3">Each doorway, in detail</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {data.by_practice.map((p) => (
            <PracticeProgressCard key={p.key} practice={p} />
          ))}
        </div>
      </section>

      <p
        className="mok-subtle"
        style={{ fontSize: 12, fontFamily: 'var(--font-sans)', textAlign: 'center', padding: '12px 4px 0' }}
      >
        These observations are yours alone. None of them are visible to anyone else.
      </p>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function ContinueCard({
  practice,
  when,
}: {
  practice: PracticeBreakdown;
  when: string | null;
}) {
  const key = practice.key as PracticeKey;
  const Art = PracticeArt[key];
  const color = PRACTICE_COLORS[key] || 'var(--accent)';
  const ago = when ? humanizeDay(when) : '';

  return (
    <article
      className="mok-card"
      style={{
        borderLeft: `3px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <Art color={color} size={56} />
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <p className="mok-eyebrow" style={{ margin: 0 }}>
          Continue your practice
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: '-0.005em',
            margin: '4px 0 4px',
          }}
        >
          {practice.name}
        </h2>
        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: 0 }}>
          Last practiced {ago}.
        </p>
      </div>
      <div className="mok-row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <Link to={`/practices/${practice.key}`} className="mok-btn">
          Read
        </Link>
        <Link
          to={practice.key === 'writing' ? '/journal' : `/practices/${practice.key}/session`}
          className="mok-btn mok-btn--primary"
        >
          Begin →
        </Link>
      </div>
    </article>
  );
}

function FirstTimeCard() {
  return (
    <article
      className="mok-card"
      style={{
        borderLeft: '3px solid var(--accent)',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <p className="mok-eyebrow" style={{ margin: 0 }}>
          Begin your practice
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: '-0.005em',
            margin: '4px 0 4px',
          }}
        >
          The simplest doorway is Breathing.
        </h2>
        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: 0 }}>
          Three minutes. A 4-4-4 rhythm. You can do this anywhere.
        </p>
      </div>
      <Link to="/practices/breathing/session" className="mok-btn mok-btn--primary">
        Begin →
      </Link>
    </article>
  );
}

function PracticeProgressCard({ practice }: { practice: PracticeBreakdown }) {
  const key = practice.key as PracticeKey;
  const color = getCssColor(PRACTICE_COLORS[key] || 'var(--accent)');
  const data = practice.daily_30d.map((count, i) => ({ i, count }));
  const hasAny = practice.count_30d > 0;

  return (
    <Link
      to={`/practices/${practice.key}`}
      className="mok-card"
      style={{
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        borderLeft: `3px solid ${color}`,
        color: 'inherit',
      }}
    >
      <span className="mok-eyebrow" style={{ margin: 0 }}>
        {practice.short_name}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 300,
          color: 'var(--text)',
        }}
      >
        {practice.count_30d}
      </span>
      <span className="mok-muted" style={{ fontSize: 12 }}>
        {practice.count_30d === 1 ? '1 session' : `${practice.count_30d} sessions`} · 30 days
      </span>

      {/* Sparkline */}
      <div style={{ width: '100%', height: 36, marginTop: 6 }}>
        {hasAny ? (
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <YAxis hide domain={[0, 'dataMax + 1']} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: '100%',
              borderTop: '1px dashed var(--border)',
              display: 'flex',
              alignItems: 'center',
              fontSize: 11,
              color: 'var(--text-subtle)',
              fontStyle: 'italic',
              paddingTop: 12,
            }}
          >
            no sessions yet
          </div>
        )}
      </div>

      <span className="mok-subtle" style={{ fontSize: 11, marginTop: 2 }}>
        {practice.last_practiced
          ? `Last: ${humanizeDay(practice.last_practiced)}`
          : 'Not yet practiced'}
      </span>
    </Link>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className="mok-card"
      style={{
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        borderLeft: accent ? '3px solid var(--accent)' : '1px solid var(--border)',
      }}
    >
      <span className="mok-eyebrow" style={{ margin: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          fontWeight: 300,
          lineHeight: 1,
          color: accent ? 'var(--accent)' : 'var(--text)',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </span>
      <span className="mok-subtle" style={{ fontSize: 11, fontFamily: 'var(--font-sans)' }}>
        {sub}
      </span>
    </div>
  );
}

interface TooltipPayload {
  payload: Record<string, unknown>;
  dataKey: string | number;
  value: number;
  color?: string;
}

function CalmTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: 'var(--bg-ink)',
        color: 'var(--text-inverse)',
        padding: '8px 12px',
        borderRadius: 'var(--radius)',
        fontSize: 12,
        fontFamily: 'var(--font-sans)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {label && <div style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color ?? 'var(--accent)' }} />
          <span>
            {String(p.dataKey)}: {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function DistributionLegend({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
      {data.map((d) => {
        const pct = ((d.value / total) * 100).toFixed(0);
        return (
          <div
            key={d.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
            <span style={{ color: 'var(--text)' }}>{d.name}</span>
            <span className="mok-subtle">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────── */

function humanizeDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  const ms = today.getTime() - d.getTime();
  const days = Math.floor(ms / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getCssColor(value: string): string {
  if (!value.startsWith('var(')) return value;
  const match = value.match(/var\(\s*(--[\w-]+)/);
  if (!match) return value;
  if (typeof window === 'undefined') return value;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  return resolved || value;
}
