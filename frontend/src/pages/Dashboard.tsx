import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
} from '../api/client';
import { PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';

/**
 * Dashboard — aggregate charts across all 7 practices. Everything here is
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
            day: d.day.slice(5), // "MM-DD"
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

  return (
    <div className="mok-rise" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <header style={{ padding: '24px 0 16px', borderBottom: '1px solid var(--border)' }}>
        <p className="mok-eyebrow">Your patterns</p>
        <h1 className="mok-section-title">A quiet record.</h1>
        <p className="mok-section-lede">
          Everything you see here is yours alone — never shared. Look gently.
        </p>
      </header>

      {/* Top stats */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        <StatCard
          label="Days practiced"
          value={data.days_practiced_30d}
          sub={`of last 30`}
        />
        <StatCard
          label="Days practiced"
          value={data.days_practiced_90d}
          sub={`of last 90`}
        />
        <StatCard
          label="Total sessions"
          value={data.total_sessions}
          sub={`in 90 days`}
        />
        {mci && (
          <StatCard
            label="MCI"
            value={mci.mci}
            sub={mci.milestone.toLowerCase()}
            accent
          />
        )}
      </section>

      {/* Per-practice — bar chart */}
      <section className="mok-card">
        <p className="mok-section-h3">By doorway · sessions over 30 / 90 days</p>
        <div style={{ width: '100%', height: 260, marginTop: 12 }}>
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
                  <Cell key={i} fill={d.color} fillOpacity={0.45} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 28,
        }}
      >
        {/* Distribution donut */}
        {pieData.length > 0 && (
          <section className="mok-card">
            <p className="mok-section-h3">Distribution · the doorways you walk</p>
            <div style={{ width: '100%', height: 260, marginTop: 12 }}>
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
          <div style={{ width: '100%', height: 220, marginTop: 12 }}>
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

      {/* Per-practice cards */}
      <section>
        <p className="mok-section-h3">Each doorway, in detail</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {data.by_practice.map((p) => {
            const color = getCssColor(PRACTICE_COLORS[p.key as PracticeKey] || 'var(--accent)');
            return (
              <Link
                key={p.key}
                to={`/practices/${p.key}`}
                className="mok-card"
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  borderLeft: `3px solid ${color}`,
                  color: 'inherit',
                }}
              >
                <span className="mok-eyebrow" style={{ margin: 0 }}>
                  {p.short_name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 28,
                    fontWeight: 300,
                    color: 'var(--text)',
                  }}
                >
                  {p.count_30d}
                </span>
                <span className="mok-muted" style={{ fontSize: 12 }}>
                  {p.count_30d === 1 ? '1 session' : `${p.count_30d} sessions`} · 30 days
                </span>
                <span className="mok-subtle" style={{ fontSize: 11, marginTop: 6 }}>
                  {p.last_practiced
                    ? `Last: ${new Date(p.last_practiced + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                    : 'Not yet practiced'}
                </span>
              </Link>
            );
          })}
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

/* ── Helpers ───────────────────────────────────────────────── */

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
      {label && (
        <div style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>{label}</div>
      )}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: p.color ?? 'var(--accent)',
            }}
          />
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
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 12,
      }}
    >
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
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: d.color,
              }}
            />
            <span style={{ color: 'var(--text)' }}>{d.name}</span>
            <span className="mok-subtle">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Resolve a CSS variable reference like `var(--accent)` against the live
 * computed style on :root. Recharts cannot consume CSS variables directly
 * because it generates inline SVG attributes; we resolve once at render.
 */
function getCssColor(value: string): string {
  if (!value.startsWith('var(')) return value;
  const match = value.match(/var\(\s*(--[\w-]+)/);
  if (!match) return value;
  if (typeof window === 'undefined') return value;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  return resolved || value;
}
