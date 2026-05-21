import { useEffect, useState } from 'react';
import { getHistory, getMci, type HistoryDay, type MciOut } from '../api/client';

export default function History() {
  const [days, setDays] = useState<HistoryDay[]>([]);
  const [mci, setMci] = useState<MciOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getHistory(30), getMci()])
      .then(([h, m]) => {
        setDays(h.days);
        setMci(m);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mok-loading">Loading your arc…</div>;

  const practiced = days.filter((d) => d.practiced).length;

  return (
    <section style={{ display: 'grid', gap: 28 }}>
      {/* ── Page header ──────────────────────────────────── */}
      <header>
        <p className="mok-eyebrow">Your history</p>
        <h1 className="mok-section-title">The shape of your practice.</h1>
        <p className="mok-section-lede">
          A quiet record of where you returned. Dots mark practice days —
          nothing about what you did, or for how long. Rest days are part of
          the rhythm too.
        </p>
      </header>

      {/* ── At a glance ──────────────────────────────────── */}
      <section>
        <p className="mok-section-h3" style={{ marginBottom: 12 }}>At a glance</p>
        <div className="mok-row mok-row-gap-lg">
          {mci && (
            <div className="mok-mci-card">
              <span className="mok-mci-label">Your steady rhythm</span>
              <span className="mok-mci-number">{mci.mci}</span>
              <span className="mok-mci-milestone">{mci.milestone}</span>
            </div>
          )}
          <div className="mok-mci-card">
            <span className="mok-mci-label">Days practiced</span>
            <span className="mok-mci-number">{practiced}</span>
            <span className="mok-muted" style={{ fontSize: 12 }}>of the last {days.length}</span>
          </div>
        </div>
      </section>

      {/* ── Dot trail ────────────────────────────────────── */}
      <section className="mok-card mok-card--padded">
        <p className="mok-section-h3">Days you returned</p>
        <p className="mok-muted" style={{ fontSize: 13, margin: '6px 0 16px', fontStyle: 'italic' }}>
          The last {days.length} days, one square at a time.
        </p>
        <div className="mok-history-grid">
          {days.map((d) => {
            const date = new Date(d.day + 'T00:00:00');
            return (
              <div
                key={d.day}
                className={`mok-history-day ${d.practiced ? 'mok-history-day--practiced' : ''}`}
                title={`${date.toLocaleDateString()} — ${d.practiced ? 'practiced' : 'rest'}`}
              >
                {!d.practiced && date.getDate()}
              </div>
            );
          })}
        </div>
        <p className="mok-muted" style={{ fontSize: 13, marginTop: 16, fontStyle: 'italic' }}>
          A steady five of seven days a week is the sweet spot — rest is part
          of the practice, not a gap in it.
        </p>
      </section>
    </section>
  );
}
