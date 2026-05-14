import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPractice, logPractice, type PracticeDetail as PracticeDetailT } from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';
import { parsePractice } from '../utils/practiceContent';

type Part = 'A' | 'B';

/**
 * Reading view for a practice. Two tabs:
 *   Part A — Learning the Practice (educational)
 *   Part B — Daily Practice (the script that the guided session walks through)
 *
 * Also offers "Begin a session" → guided player at /practices/:key/session,
 * and "Log a self-practice" for when the user practiced outside the app.
 */
export default function PracticeDetail() {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PracticeDetailT | null>(null);
  const [part, setPart] = useState<Part>('A');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logState, setLogState] = useState<'idle' | 'submitting' | 'logged'>('idle');
  const [logError, setLogError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!key) return;
    setLoading(true);
    getPractice(key)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load practice'))
      .finally(() => setLoading(false));
  }, [key]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [part]);

  const parsed = useMemo(() => (data ? parsePractice(data.content) : null), [data]);

  async function recordSelfPractice() {
    if (!key) return;
    setLogState('submitting');
    setLogError('');
    try {
      await logPractice(key, { source: 'self_log' });
      setLogState('logged');
      setTimeout(() => navigate('/today'), 1200);
    } catch (err) {
      setLogError(err instanceof Error ? err.message : 'Could not log practice');
      setLogState('idle');
    }
  }

  if (loading) return <div className="mok-loading">Opening the practice…</div>;
  if (error || !data) return <div className="mok-banner mok-banner--error">{error || 'Not found'}</div>;

  const k = data.key as PracticeKey;
  const Art = PracticeArt[k];
  const color = PRACTICE_COLORS[k];

  const stanzas = stanzasForPart(parsed, part);

  return (
    <div className="mok-reading mok-rise">
      <header className="mok-reading-header">
        <div className="mok-row" style={{ gap: 12 }}>
          <Art color={color} size={22} />
          <span className="mok-eyebrow" style={{ margin: 0 }}>{data.name}</span>
        </div>
        <button type="button" className="mok-btn mok-btn--ghost" onClick={() => navigate('/practices')}>
          ✕
        </button>
      </header>

      <div className="mok-reading-tabs">
        <button
          type="button"
          className={`mok-reading-tab ${part === 'A' ? 'mok-reading-tab--active' : ''}`}
          onClick={() => setPart('A')}
        >
          Part A — Learning the Practice
        </button>
        <button
          type="button"
          className={`mok-reading-tab ${part === 'B' ? 'mok-reading-tab--active' : ''}`}
          onClick={() => setPart('B')}
        >
          Part B — Daily Practice
        </button>
      </div>

      <main ref={scrollRef} className="mok-reading-body">
        <div className="mok-reading-content">
          <div
            className="mok-eyebrow"
            style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}
          >
            <span style={{ width: 24, height: 1, background: 'var(--border)' }} />
            Part {part}
          </div>

          <div style={{ marginBottom: 32, opacity: 0.85 }}>
            <Art color={color} size={72} />
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 38,
              fontWeight: 400,
              lineHeight: 1.15,
              margin: '0 0 8px',
              letterSpacing: '-0.015em',
            }}
          >
            {data.name}
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-subtle)',
              fontFamily: 'var(--font-sans)',
              margin: '0 0 24px',
              letterSpacing: '0.04em',
            }}
          >
            {part === 'A' ? 'Learning the Practice' : 'Daily Practice'}
          </p>

          {/* Always-visible CTA: take the user back to the session.
              Mirrors the footer CTAs but is reachable without scrolling. */}
          <div
            className="mok-row"
            style={{
              padding: '14px 16px',
              marginBottom: 40,
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span className="mok-muted" style={{ fontSize: 14, flex: 1, minWidth: 180 }}>
              Ready when you are. Begin the guided session anytime.
            </span>
            <Link
              to={data.key === 'writing' ? '/journal' : `/practices/${data.key}/session`}
              className="mok-btn mok-btn--primary"
            >
              Begin session →
            </Link>
          </div>

          {stanzas.length === 0 ? (
            <p className="mok-muted">Content is being prepared. Check back soon.</p>
          ) : (
            stanzas.map((stanza, i) => (
              <div
                key={i}
                className="mok-stanza"
                style={{
                  animation: 'mok-fade-in 0.5s ease-out forwards',
                  animationDelay: `${Math.min(i * 0.04, 1.2)}s`,
                  opacity: 0,
                  marginBottom: 32,
                }}
              >
                {stanza.map((line, li) => (
                  <p
                    key={li}
                    style={{
                      fontSize: 19,
                      lineHeight: 1.55,
                      color: 'var(--text)',
                      margin: 0,
                      fontWeight: 400,
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            ))
          )}

          <div
            style={{
              marginTop: 48,
              paddingTop: 32,
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-subtle)',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-sans)',
              }}
            >
              ·
            </span>
          </div>

          {logState !== 'idle' && (
            <div style={{ marginTop: 24 }}>
              {logState === 'logged' ? (
                <p className="mok-banner mok-banner--success">Practice recorded. See you tomorrow if you would like.</p>
              ) : logError ? (
                <p className="mok-banner mok-banner--error">{logError}</p>
              ) : null}
            </div>
          )}
        </div>
      </main>

      <footer className="mok-reading-footer">
        {part === 'A' ? (
          <>
            <button type="button" className="mok-btn mok-btn--ghost" onClick={() => navigate('/practices')}>
              Close
            </button>
            <div className="mok-row" style={{ gap: 8 }}>
              <button type="button" className="mok-btn" onClick={() => setPart('B')}>
                Read Part B ›
              </button>
              <Link
                to={data.key === 'writing' ? '/journal' : `/practices/${data.key}/session`}
                className="mok-btn mok-btn--primary"
              >
                Begin a session
              </Link>
            </div>
          </>
        ) : (
          <>
            <button type="button" className="mok-btn mok-btn--ghost" onClick={() => setPart('A')}>
              ← Part A
            </button>
            <div className="mok-row" style={{ gap: 8 }}>
              <button
                type="button"
                className="mok-btn"
                onClick={recordSelfPractice}
                disabled={logState === 'submitting' || logState === 'logged'}
              >
                {logState === 'submitting' ? 'Recording…' : 'I practiced outside the app'}
              </button>
              <Link
                to={data.key === 'writing' ? '/journal' : `/practices/${data.key}/session`}
                className="mok-btn mok-btn--primary"
              >
                Begin a session
              </Link>
            </div>
          </>
        )}
      </footer>
    </div>
  );
}

function stanzasForPart(
  parsed: ReturnType<typeof parsePractice> | null,
  part: Part,
): string[][] {
  if (!parsed) return [];
  const src = part === 'A' ? parsed.learn || parsed.intro : parsed.session;
  if (!src) return [];

  const body = src
    .replace(/^# .*\n+/m, '')
    .replace(/^.*Part\s*[AB][^\n]*\n+/im, '')
    .replace(/^>[^\n]*\n+/gm, '')
    .replace(/^-{3,}$/gm, '')
    .trim();

  return body
    .split(/\n\s*\n/)
    .map((stanza) =>
      stanza
        .split('\n')
        .map((l) => l.replace(/  $/, '').trim())
        .filter(Boolean),
    )
    .filter((s) => s.length > 0 && !/^#{1,6}\s/.test(s[0]));
}
