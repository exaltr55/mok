import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPractice,
  logPractice,
  type PracticeDetail,
} from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';
import Wordmark from '../components/Wordmark';
import BreathingAccompaniment from '../components/session/BreathingAccompaniment';
import ThinkingAccompaniment from '../components/session/ThinkingAccompaniment';
import TalkingAccompaniment, { TALKING_TOTAL_SECONDS } from '../components/session/TalkingAccompaniment';
import AligningAccompaniment from '../components/session/AligningAccompaniment';
import WritingFlow from '../components/session/WritingFlow';
import MovingFlow from '../components/session/MovingFlow';
import ResettingFlow from '../components/session/ResettingFlow';

type Stage = 'arriving' | 'session' | 'reflection' | 'logged';
type Feeling = 'lighter' | 'same' | 'heavier';

const DURATIONS: Record<PracticeKey, number> = {
  breathing: 3,
  thinking: 7,
  talking: Math.round(TALKING_TOTAL_SECONDS / 60),
  writing: 10,
  moving: 12,
  resetting: 3,
  aligning: 3,
};

/** Format seconds as M:SS. */
function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function PracticeSession() {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const [practice, setPractice] = useState<PracticeDetail | null>(null);
  const [error, setError] = useState('');

  const [stage, setStage] = useState<Stage>('arriving');
  const [running, setRunning] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [feeling, setFeeling] = useState<Feeling>('same');
  const [note, setNote] = useState('');
  const [logError, setLogError] = useState('');
  const [bespokeNote, setBespokeNote] = useState('');

  const practiceKey = key as PracticeKey | undefined;
  const isTimerPractice = practiceKey === 'breathing' || practiceKey === 'thinking' ||
                          practiceKey === 'talking' || practiceKey === 'aligning';
  const isWriting = practiceKey === 'writing';
  const isMoving = practiceKey === 'moving';
  const isResetting = practiceKey === 'resetting';

  useEffect(() => {
    if (!key) return;
    getPractice(key)
      .then((p) => {
        setPractice(p);
        const defaultMin = DURATIONS[key as PracticeKey] ?? p.session_min;
        setDuration(defaultMin);
        setSecondsLeft(defaultMin * 60);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not open the practice'));
  }, [key]);

  // Timer loop for the timer-based practices.
  useEffect(() => {
    if (stage !== 'session' || !running || !isTimerPractice) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setRunning(false);
          setStage('reflection');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage, running, isTimerPractice]);

  function begin() {
    setStartedAt(Date.now());
    if (isWriting) { setStage('session'); return; }
    if (isMoving)  { setStage('session'); return; }
    if (isResetting){ setStage('session'); return; }
    setSecondsLeft(duration * 60);
    setRunning(true);
    setStage('session');
  }

  function endEarly() {
    setRunning(false);
    setStage('reflection');
  }

  async function recordPractice() {
    if (!key) return;
    setLogError('');
    const elapsedMin = startedAt
      ? Math.max(1, Math.round((Date.now() - startedAt) / 60000))
      : duration;
    try {
      await logPractice(key, {
        source: 'guided',
        duration_minutes: elapsedMin,
        mood: feeling,
        note: note.trim() || bespokeNote || null,
      });
      setStage('logged');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not record practice';
      setLogError(msg);
      setStage('logged');
    }
  }

  const ArtIcon = practiceKey ? PracticeArt[practiceKey] : null;
  const accent = practiceKey ? PRACTICE_COLORS[practiceKey] : undefined;
  const cssVar = useMemo(
    () => (accent ? ({ ['--practice-color' as string]: accent } as React.CSSProperties) : undefined),
    [accent],
  );

  if (error) {
    return (
      <div className="mok-session">
        <header className="mok-session-header">
          <button type="button" className="mok-session-btn mok-session-btn--ghost" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </header>
        <div className="mok-session-stage">
          <div className="mok-session-stage-inner">
            <p className="mok-banner mok-banner--error">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  if (!practice || !practiceKey) {
    return <div className="mok-loading" style={{ background: 'var(--bg-ink)', color: 'var(--text-inverse)' }}>Opening…</div>;
  }

  return (
    <div className="mok-session" style={cssVar}>
      <header className="mok-session-header">
        <button
          type="button"
          className="mok-session-btn mok-session-btn--ghost"
          onClick={() => navigate(`/practices/${practice.key}`)}
        >
          ← End session
        </button>
        <Wordmark size="xs" />
        <span className="mok-session-header-name">
          {ArtIcon && <ArtIcon color={accent} size={22} />}
          {practice.name}
        </span>
      </header>

      <main className="mok-session-stage">
        {stage === 'arriving' && (
          <div className="mok-session-stage-inner mok-fade-in">
            <p className="mok-session-eyebrow">{practice.short_name}</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, color: 'var(--text-inverse)', margin: '0 0 18px', letterSpacing: '-0.015em' }}>
              {practice.name}
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-inverse)', opacity: 0.85, margin: '0 0 28px', lineHeight: 1.5, fontWeight: 300 }}>
              {practice.description}
            </p>

            {isTimerPractice && practiceKey !== 'talking' && (
              <div style={{ marginBottom: 32 }}>
                <p className="mok-session-eyebrow">Duration</p>
                <div className="mok-row" style={{ justifyContent: 'center', gap: 8 }}>
                  {Array.from(new Set([practice.session_min, duration, practice.session_max])).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`mok-session-btn ${duration === m ? 'mok-session-btn--accent' : ''}`}
                      onClick={() => { setDuration(m); setSecondsLeft(m * 60); }}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </div>
            )}
            {practiceKey === 'talking' && (
              <p className="mok-muted" style={{ marginBottom: 28, fontSize: 13, fontStyle: 'italic' }}>
                Seven affirmations · about {Math.ceil(TALKING_TOTAL_SECONDS / 60)} minutes
              </p>
            )}

            <button type="button" className="mok-session-btn mok-session-btn--accent" onClick={begin}>
              Begin →
            </button>
          </div>
        )}

        {stage === 'session' && practiceKey === 'breathing' && (
          <div className="mok-session-stage-inner">
            <BreathingAccompaniment running={running} colorVar={accent} />
            <p className="mok-session-timer">{fmt(secondsLeft)}</p>
            <SessionControls running={running} setRunning={setRunning} onEnd={endEarly} />
          </div>
        )}

        {stage === 'session' && practiceKey === 'thinking' && (
          <div className="mok-session-stage-inner">
            <ThinkingAccompaniment running={running} />
            <p className="mok-session-timer">{fmt(secondsLeft)}</p>
            <SessionControls running={running} setRunning={setRunning} onEnd={endEarly} />
          </div>
        )}

        {stage === 'session' && practiceKey === 'talking' && (
          <div className="mok-session-stage-inner">
            <TalkingAccompaniment running={running} onComplete={endEarly} />
            <p className="mok-session-timer">{fmt(secondsLeft)}</p>
            <SessionControls running={running} setRunning={setRunning} onEnd={endEarly} />
          </div>
        )}

        {stage === 'session' && practiceKey === 'aligning' && (
          <div className="mok-session-stage-inner">
            <AligningAccompaniment running={running} />
            <p className="mok-session-timer">{fmt(secondsLeft)}</p>
            <SessionControls running={running} setRunning={setRunning} onEnd={endEarly} />
          </div>
        )}

        {stage === 'session' && isWriting && (
          <WritingFlow
            onComplete={() => {
              // The journal endpoint auto-logs the writing practice, so we go
              // straight to a quiet "logged" stage rather than the reflection.
              setBespokeNote('Journal entry');
              setStage('logged');
            }}
            onError={(m) => setLogError(m)}
          />
        )}

        {stage === 'session' && isMoving && (
          <MovingFlow
            onComplete={(n) => { setBespokeNote(n); setStage('reflection'); }}
          />
        )}

        {stage === 'session' && isResetting && (
          <ResettingFlow
            onComplete={(n) => { setBespokeNote(n); setStage('reflection'); }}
          />
        )}

        {stage === 'reflection' && (
          <div className="mok-session-stage-inner mok-fade-in">
            <p className="mok-session-eyebrow">A brief reflection</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text-inverse)', margin: '0 0 28px' }}>
              You practiced {practice.short_name.toLowerCase()} today.
            </h2>

            <div className="mok-field" style={{ textAlign: 'left' }}>
              <label style={{ color: 'var(--text-subtle)' }}>How did it feel?</label>
              <div className="mok-row" style={{ gap: 8 }}>
                {(['lighter', 'same', 'heavier'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`mok-session-btn ${feeling === f ? 'mok-session-btn--accent' : ''}`}
                    onClick={() => setFeeling(f)}
                    style={{ flex: 1 }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {!isWriting && (
              <div className="mok-field" style={{ textAlign: 'left' }}>
                <label style={{ color: 'var(--text-subtle)' }}>A line, if you'd like</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--text-subtle)',
                    color: 'var(--text-inverse)',
                    padding: '10px 0',
                    fontSize: 16,
                    fontFamily: 'var(--font-serif)',
                  }}
                />
              </div>
            )}

            <button
              type="button"
              className="mok-session-btn mok-session-btn--accent"
              onClick={recordPractice}
              style={{ marginTop: 16 }}
            >
              Record practice
            </button>
          </div>
        )}

        {stage === 'logged' && (
          <div className="mok-session-stage-inner mok-fade-in">
            <p className="mok-session-eyebrow">Recorded</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text-inverse)', margin: '0 0 16px' }}>
              Your practice is noted.
            </h2>
            <p className="mok-muted" style={{ fontSize: 15, fontStyle: 'italic', marginBottom: 24 }}>
              {logError ?? 'One log per practice per day — see you tomorrow if you would like.'}
            </p>
            <div className="mok-row" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="mok-session-btn mok-session-btn--accent"
                onClick={() => navigate('/today')}
              >
                Return to today
              </button>
              {!isWriting && (
                <button
                  type="button"
                  className="mok-session-btn"
                  onClick={() => navigate('/journal')}
                >
                  Open journal
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SessionControls({
  running,
  setRunning,
  onEnd,
}: {
  running: boolean;
  setRunning: (b: boolean) => void;
  onEnd: () => void;
}) {
  return (
    <div className="mok-session-controls">
      <button type="button" className="mok-session-btn" onClick={() => setRunning(!running)}>
        {running ? 'Pause' : 'Resume'}
      </button>
      <button type="button" className="mok-session-btn mok-session-btn--ghost" onClick={onEnd}>
        End early
      </button>
    </div>
  );
}
