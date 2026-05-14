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
    <section style={{ display: 'grid', gap: 32 }}>
      <header>
        <p className="mok-hero-eyebrow">Your practice arc</p>
        <h1 className="mok-section-title">A quiet record.</h1>
        <p className="mok-section-lede">
          The last 30 days. The dots mark days you returned to your practice — nothing
          about what you did or for how long.
        </p>
      </header>

      <div className="mok-row mok-row-gap-lg">
        {mci && (
          <div className="mok-mci-card">
            <span className="mok-mci-label">MCI today</span>
            <span className="mok-mci-number">{mci.mci}</span>
            <span className="mok-mci-milestone">{mci.milestone}</span>
          </div>
        )}
        <div className="mok-mci-card">
          <span className="mok-mci-label">Days practiced</span>
          <span className="mok-mci-number">{practiced}</span>
          <span className="mok-muted" style={{ fontSize: 12 }}>of last {days.length}</span>
        </div>
      </div>

      <section className="mok-card mok-card--padded">
        <h2 className="mok-section-title" style={{ fontSize: 18 }}>The last 30 days</h2>
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
          Rest is honored. The target is 5 of 7 days a week, never all seven.
        </p>
      </section>
    </section>
  );
}
