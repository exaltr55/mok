import { useState } from 'react';

/**
 * Small explainer that sits next to the MCI number. Front line names
 * the range; "Learn more" expands an inline section with how it's
 * measured and the milestone ladder.
 *
 * The Index folds three signals on a golf-handicap scale:
 *  · return rate  — weeks you came back at all
 *  · per-practice grip — for each of the 7 practices, weeks done ≥3 days
 *  · breadth — practices whose grip has crossed a sustained threshold
 *
 * Lower is deeper. Copy here mirrors backend/app/services/mci.py.
 */
export default function MciExplainer() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 6, maxWidth: 540 }}>
      <p
        className="mok-muted"
        style={{ fontSize: 13, fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}
      >
        Your Consistency Index — a number from{' '}
        <strong style={{ color: 'var(--text)' }}>0 to 36</strong>. Lower means
        a steadier rhythm.
      </p>
      <p
        className="mok-muted"
        style={{ fontSize: 13, fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}
      >
        It rewards returning, doing each practice often enough to feel like
        a habit, and steadily widening the practices you sustain.
      </p>

      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          fontSize: 13,
          fontStyle: 'italic',
          textDecoration: 'underline',
          cursor: 'pointer',
          padding: 0,
          marginTop: 2,
          alignSelf: 'flex-start',
        }}
      >
        {open ? 'Hide details ↑' : 'Learn more ↓'}
      </button>

      {open && (
        <div
          style={{
            marginTop: 6,
            padding: '14px 16px',
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            display: 'grid',
            gap: 10,
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          <div>
            <p className="mok-eyebrow" style={{ margin: '0 0 6px' }}>
              How it's measured
            </p>
            <p style={{ margin: 0 }}>
              Across the last eight weeks, the Index reads three signals:
            </p>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              <li>
                <strong>Returning</strong> — the weeks you came back to practice
                at all.
              </li>
              <li>
                <strong>Grip per practice</strong> — for each of the seven,
                the weeks you did it on at least three days.
              </li>
              <li>
                <strong>Breadth</strong> — how many practices have crossed
                that bar for at least half of the last eight weeks.
              </li>
            </ul>
            <p style={{ margin: '8px 0 0' }}>
              Returning is forty percent of the weight; breadth is the
              other sixty. So showing up matters, and quietly making more of
              the seven your own moves the number further down.
            </p>
          </div>
          <div>
            <p className="mok-eyebrow" style={{ margin: '0 0 6px' }}>
              Milestones <span className="mok-muted" style={{ fontStyle: 'italic', textTransform: 'none', letterSpacing: 'normal' }}>(lower = deeper)</span>
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
              {[
                ['0–5', 'Deep practitioner'],
                ['6–10', 'Aligned'],
                ['11–18', 'Grounded'],
                ['19–25', 'Steady'],
                ['26–32', 'Returning'],
                ['33–36', 'Beginning'],
              ].map(([range, label]) => (
                <li key={range} style={{ display: 'flex', gap: 12 }}>
                  <span
                    className="mok-muted"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12,
                      width: 60,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {range}
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
