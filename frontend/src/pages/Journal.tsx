import { useEffect, useState } from 'react';
import {
  createJournal,
  getTodaysJournal,
  listJournal,
  type JournalEntry,
  type JournalStyle,
} from '../api/client';

const STYLE_DESCRIPTIONS: Record<JournalStyle, string> = {
  expressive: 'Release. Let what is inside move onto the page without editing.',
  reflective: 'Notice. Look back at the day and ask what it is teaching you.',
  gratitude: 'Notice what is working. Small things. Ordinary things.',
};

export default function Journal() {
  const [today, setToday] = useState<JournalEntry | null>(null);
  const [recent, setRecent] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [style, setStyle] = useState<JournalStyle>('reflective');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'saved'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getTodaysJournal(), listJournal(30)])
      .then(([t, r]) => {
        setToday(t);
        setRecent(r);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load journal'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!body.trim()) return;
    setStatus('submitting');
    setError('');
    try {
      const entry = await createJournal(style, body.trim());
      setToday(entry);
      setRecent([entry, ...recent]);
      setStatus('saved');
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save journal');
      setStatus('idle');
    }
  }

  if (loading) return <div className="mok-loading">Opening your journal…</div>;

  return (
    <section style={{ display: 'grid', gap: 28 }}>
      {/* ── Page header ──────────────────────────────────── */}
      <header>
        <p className="mok-eyebrow">Journal</p>
        <h1 className="mok-section-title">Today's page is open.</h1>
        <p className="mok-section-lede">
          One entry a day — expressive, reflective, or gratitude. Your words
          stay with you alone.
        </p>
      </header>

      {today ? (
        <article className="mok-card mok-card--padded">
          <div className="mok-row" style={{ marginBottom: 10 }}>
            <span className="mok-chip mok-chip--accent">{today.style}</span>
            <span className="mok-spacer" />
            <span className="mok-muted" style={{ fontSize: 13 }}>Today</span>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-editorial)', fontSize: 17, lineHeight: 1.7 }}>
            {today.body}
          </p>
          <p className="mok-muted" style={{ fontSize: 13, marginTop: 18, fontStyle: 'italic' }}>
            One entry per day. Return tomorrow.
          </p>
        </article>
      ) : (
        <article className="mok-card mok-card--padded">
          <p className="mok-section-h3">Write today's entry</p>
          <p className="mok-muted" style={{ fontSize: 13, margin: '6px 0 18px', fontStyle: 'italic' }}>
            Choose a style and let the page hold what you share.
          </p>

          {error && <div className="mok-banner mok-banner--error">{error}</div>}

          <div className="mok-field">
            <label>Style</label>
            <div className="mok-row" style={{ gap: 8 }}>
              {(['expressive', 'reflective', 'gratitude'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`mok-btn ${style === s ? 'mok-btn--primary' : ''}`}
                  onClick={() => setStyle(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <span className="mok-field-hint">{STYLE_DESCRIPTIONS[style]}</span>
          </div>

          <div className="mok-field">
            <label htmlFor="body">Write freely</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="The page is here, listening. Write whatever is true for you today."
              style={{ minHeight: 240, fontFamily: 'var(--font-editorial)', fontSize: 16 }}
              maxLength={20_000}
            />
            <span className="mok-field-hint">{body.length} characters</span>
          </div>

          <button
            type="button"
            className="mok-btn mok-btn--gradient"
            onClick={save}
            disabled={status === 'submitting' || !body.trim()}
          >
            {status === 'submitting' ? 'Saving…' : 'Save entry'}
          </button>
        </article>
      )}

      <section>
        <p className="mok-section-h3">Recent entries</p>
        <p className="mok-muted" style={{ fontSize: 13, margin: '6px 0 16px', fontStyle: 'italic' }}>
          The last 30 days, newest first.
        </p>
        {recent.length === 0 ? (
          <p className="mok-muted">Today's will be your first — when you're ready.</p>
        ) : (
          <div className="mok-stack-sm">
            {recent.filter((e) => !today || e.id !== today.id).map((e) => (
              <article key={e.id} className="mok-card mok-card--quiet" style={{ padding: 18 }}>
                <div className="mok-row">
                  <span className="mok-chip">{e.style}</span>
                  <span className="mok-spacer" />
                  <span className="mok-muted" style={{ fontSize: 12 }}>{new Date(e.entry_day).toLocaleDateString()}</span>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 10, lineHeight: 1.7 }}>{e.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
