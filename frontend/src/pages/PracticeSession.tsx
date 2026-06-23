import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getPractice,
  getTodaySummary,
  listPractices,
  logPractice,
  type PracticeDetail,
  type PracticeSummary,
} from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';
import Wordmark from '../components/Wordmark';
import BreathingAccompaniment from '../components/session/BreathingAccompaniment';
import ThinkingAccompaniment from '../components/session/ThinkingAccompaniment';
import TalkingAccompaniment, { getTalkingTotalSeconds, TALKING_TOTAL_SECONDS } from '../components/session/TalkingAccompaniment';
import AligningAccompaniment from '../components/session/AligningAccompaniment';
import SessionProgressDial from '../components/session/SessionProgressDial';
import AskCompanionLink from '../components/AskCompanionLink';
import { getAnchorThought, hasSeenAnchorPrimer } from '../utils/anchorThought';
import WritingFlow from '../components/session/WritingFlow';
import MovingFlow from '../components/session/MovingFlow';
import ResettingFlow from '../components/session/ResettingFlow';
import { getReadPracticeLearn } from '../utils/learnProgress';

type Stage = 'arriving' | 'session' | 'reflection' | 'logged';
type Feeling = 'lighter' | 'same' | 'heavier';

const DURATIONS: Record<PracticeKey, number> = {
  breathing: 3,
  thinking: 5,
  talking: Math.round(TALKING_TOTAL_SECONDS / 60),
  writing: 10,
  moving: 12,
  resetting: 3,
  aligning: 3,
};

/** Per-practice fixed duration options. When unset we fall back to
 *  the backend's [session_min, default, session_max] triple. */
const DURATION_OPTIONS: Partial<Record<PracticeKey, number[]>> = {
  thinking: [5, 10, 20],
};

/** Practice-specific labels for the post-session "how did it feel?"
 *  prompt. Designed so every option signals some form of progress —
 *  a clear shift, a subtle shift, or naming a specific difficulty
 *  noticed today (which is awareness, also progress). The stored
 *  value stays `lighter | same | heavier` so the backend mood field
 *  is untouched. */
const FEELING_LABELS: Record<PracticeKey, { lighter: string; same: string; heavier: string }> = {
  breathing: { lighter: 'much calmer',        same: 'a little calmer',      heavier: 'breath felt tight' },
  thinking:  { lighter: 'much clearer',       same: 'a little clearer',     heavier: 'mind felt busy' },
  talking:   { lighter: 'much more aligned',  same: 'a touch more grounded',heavier: 'voice felt scattered' },
  writing:   { lighter: 'much lighter',       same: 'a touch lighter',      heavier: 'felt heavy today' },
  moving:    { lighter: 'much more open',     same: 'warming up',           heavier: 'body felt tight' },
  resetting: { lighter: 'felt great',         same: 'felt comfortable',     heavier: 'felt challenging' },
  aligning:  { lighter: 'much more in tune',  same: 'a touch more aligned', heavier: 'felt out of sync' },
};

/** The reflection question itself — phrased to match what each
 *  practice is actually moving in the practitioner. */
const FEELING_PROMPTS: Record<PracticeKey, string> = {
  breathing: 'How does the breath feel now?',
  thinking:  'How is the mind now?',
  talking:   'How does the inner voice feel?',
  writing:   'How did it feel?',
  moving:    'How does the body feel?',
  resetting: 'How did this pause feel?',
  aligning:  'How does it feel inside?',
};

/** Short, warm encouragements shown just above the Begin button so
 *  arriving never feels transactional. */
const START_NOTES: Record<PracticeKey, string> = {
  breathing: 'A few breaths. A simple return to balance.',
  thinking: 'Notice the thoughts. Don\'t follow them.',
  talking: 'Shape the inner voice. Begin where you are.',
  writing: 'The page is here, listening.',
  moving: 'Begin where the body is. Move with care.',
  resetting: 'Stepping back is part of moving forward.',
  aligning: 'Meet yourself, just as you are today.',
};

/** Closing affirmations shown after a session is logged. */
function closingNote(allDoneToday: boolean, practiceCount: number): string {
  if (allDoneToday) {
    return (
      "You're building balance and steadiness — "
      + "the rhythm is taking shape."
    );
  }
  if (practiceCount === 0) {
    // Just logged their very first session ever (the count was 0
    // before this one).
    return (
      "You've started. That's everything. "
      + "A path to balance and steadiness opens here."
    );
  }
  return (
    "You're building balance and steadiness — "
    + 'one practice at a time.'
  );
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
  const anchor = useMemo(() => getAnchorThought(), []);
  // Practices already practiced today and the catalog — used to suggest
  // the next practice after the session logs.
  const [practicedToday, setPracticedToday] = useState<string[]>([]);
  const [allPractices, setAllPractices] = useState<PracticeSummary[]>([]);

  const practiceKey = key as PracticeKey | undefined;
  const isTimerPractice = practiceKey === 'breathing' || practiceKey === 'thinking' ||
                          practiceKey === 'talking' || practiceKey === 'aligning';
  const isWriting = practiceKey === 'writing';
  const isMoving = practiceKey === 'moving';

  // First-time Thinking visitors get redirected to the anchor primer
  // so they understand what an anchor thought is before practicing.
  useEffect(() => {
    if (practiceKey === 'thinking' && !hasSeenAnchorPrimer()) {
      navigate('/practices/thinking/anchor?return=/practices/thinking/session', {
        replace: true,
      });
    }
  }, [practiceKey, navigate]);
  const isResetting = practiceKey === 'resetting';

  useEffect(() => {
    if (!key) return;
    // Reset all session-stage state when the route's :key changes so
    // "Continue with X" actually starts a fresh session for the next
    // practice instead of leaving us stuck on the previous "logged"
    // reflection screen.
    setStage('arriving');
    setRunning(false);
    setStartedAt(null);
    setFeeling('same');
    setNote('');
    setLogError('');
    setBespokeNote('');
    setError('');
    getPractice(key)
      .then((p) => {
        setPractice(p);
        const defaultMin = DURATIONS[key as PracticeKey] ?? p.session_min;
        setDuration(defaultMin);
        setSecondsLeft(defaultMin * 60);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not open the practice'));
    // Re-fetch today's practiced list — it changed because we just
    // logged the previous practice, and "Continue with X" depends on
    // it to pick the right suggestion.
    getTodaySummary()
      .then((t) => setPracticedToday(t?.practiced_today ?? []))
      .catch(() => {});
  }, [key]);

  // Fetch the practice catalog once — needed to pick a "next" suggestion.
  useEffect(() => {
    listPractices()
      .then((p) => setAllPractices(p ?? []))
      .catch(() => {});
  }, []);

  // Pick the next practice to suggest after this session is logged.
  // Walk the catalog starting from the position *after* the current
  // practice (so finishing Resetting → suggests Aligning, not back to
  // Breathing). Wrap around to the start of the list only after we've
  // walked past the end. Skip practices already done today.
  const nextPractice = useMemo<PracticeSummary | null>(() => {
    if (!practiceKey || allPractices.length === 0) return null;
    const skip = new Set<string>([practiceKey, ...practicedToday]);
    const startIdx = allPractices.findIndex((p) => p.key === practiceKey);
    if (startIdx < 0) return allPractices.find((p) => !skip.has(p.key)) ?? null;
    for (let offset = 1; offset <= allPractices.length; offset++) {
      const p = allPractices[(startIdx + offset) % allPractices.length];
      if (!skip.has(p.key)) return p;
    }
    return null;
  }, [practiceKey, allPractices, practicedToday]);

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

  // Talking has a fixed-length accompaniment script — seven core
  // affirmations plus any custom additions, plus "I am." and the
  // closing nudge. Use the dynamic total so the timer/dial reflect
  // the user's actual setup, not a rounded-down minute.
  const sessionTotalSeconds = practiceKey === 'talking'
    ? getTalkingTotalSeconds()
    : duration * 60;

  function begin() {
    setStartedAt(Date.now());
    if (isWriting) { setStage('session'); return; }
    if (isMoving)  { setStage('session'); return; }
    if (isResetting){ setStage('session'); return; }
    setSecondsLeft(sessionTotalSeconds);
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
            <h1 className="mok-session-title">{practice.name}</h1>
            <p className="mok-session-lede">{practice.description}</p>

            {isTimerPractice && practiceKey !== 'talking' && (
              <div style={{ marginBottom: 32 }}>
                <p className="mok-session-eyebrow">Duration</p>
                <div className="mok-row" style={{ justifyContent: 'center', gap: 8 }}>
                  {(practiceKey && DURATION_OPTIONS[practiceKey]
                    ? DURATION_OPTIONS[practiceKey]!
                    : Array.from(new Set([practice.session_min, duration, practice.session_max]))
                  ).map((m) => (
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
              <div style={{ marginBottom: 28, textAlign: 'center' }}>
                <p
                  className="mok-muted"
                  style={{ marginBottom: 8, fontSize: 13, fontStyle: 'italic' }}
                >
                  Seven affirmations · about 1–2 minutes
                </p>
                <Link
                  to="/practices/talking/affirmations?return=/practices/talking/session"
                  style={{
                    color: 'var(--accent)',
                    fontSize: 13,
                    fontStyle: 'italic',
                    textDecoration: 'underline',
                  }}
                >
                  Add your own affirmations
                </Link>
              </div>
            )}

            {practiceKey === 'thinking' && (
              <div style={{ marginBottom: 32, textAlign: 'center' }}>
                <p className="mok-session-eyebrow">Anchor thought</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, margin: '6px 0 4px' }}>
                  {anchor}
                </p>
                <Link
                  to="/practices/thinking/anchor?return=/practices/thinking/session"
                  style={{
                    color: 'var(--accent)',
                    fontSize: 13,
                    fontStyle: 'italic',
                    textDecoration: 'underline',
                  }}
                >
                  Change anchor thought
                </Link>
              </div>
            )}

            {practiceKey && START_NOTES[practiceKey] && (
              <p
                className="mok-muted"
                style={{
                  fontSize: 14,
                  fontStyle: 'italic',
                  textAlign: 'center',
                  margin: '0 auto 16px',
                  maxWidth: 380,
                }}
              >
                {START_NOTES[practiceKey]}
              </p>
            )}

            <button type="button" className="mok-session-btn mok-session-btn--accent" onClick={begin}>
              Begin →
            </button>

            <div style={{ marginTop: 18 }}>
              <AskCompanionLink
                topic={practice ? `I have a question about ${practice.name}.` : undefined}
                label="Have a question? Ask your Buddy"
              />
            </div>
          </div>
        )}

        {stage === 'session' && practiceKey === 'breathing' && (
          <div className="mok-session-stage-inner">
            <BreathingAccompaniment running={running} colorVar={accent} />
            <SessionProgressDial
              progress={duration > 0 ? 1 - secondsLeft / (duration * 60) : 0}
              accent={accent}
            />
            <SessionControls running={running} setRunning={setRunning} onEnd={endEarly} />
          </div>
        )}

        {stage === 'session' && practiceKey === 'thinking' && (
          <div className="mok-session-stage-inner">
            <ThinkingAccompaniment running={running} anchor={anchor} />
            <SessionProgressDial
              progress={duration > 0 ? 1 - secondsLeft / (duration * 60) : 0}
              accent={accent}
            />
            <SessionControls running={running} setRunning={setRunning} onEnd={endEarly} />
          </div>
        )}

        {stage === 'session' && practiceKey === 'talking' && (
          <div className="mok-session-stage-inner">
            <TalkingAccompaniment running={running} onComplete={endEarly} />
            <SessionProgressDial
              progress={sessionTotalSeconds > 0 ? 1 - secondsLeft / sessionTotalSeconds : 0}
              accent={accent}
            />
            <SessionControls running={running} setRunning={setRunning} onEnd={endEarly} />
          </div>
        )}

        {stage === 'session' && practiceKey === 'aligning' && (
          <div className="mok-session-stage-inner">
            <AligningAccompaniment running={running} />
            <SessionProgressDial
              progress={duration > 0 ? 1 - secondsLeft / (duration * 60) : 0}
              accent={accent}
            />
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
            <h2 className="mok-session-h2">
              You practiced {practice.short_name.toLowerCase()} today.
            </h2>

            <div className="mok-field" style={{ textAlign: 'left' }}>
              <label>
                {practiceKey ? FEELING_PROMPTS[practiceKey] : 'How did it feel?'}
              </label>
              <div className="mok-row" style={{ gap: 8 }}>
                {(['lighter', 'same', 'heavier'] as const).map((f) => {
                  const label = practiceKey ? FEELING_LABELS[practiceKey][f] : f;
                  return (
                    <button
                      key={f}
                      type="button"
                      className={`mok-session-btn ${feeling === f ? 'mok-session-btn--accent' : ''}`}
                      onClick={() => setFeeling(f)}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {!isWriting && (
              <div className="mok-field" style={{ textAlign: 'left' }}>
                <label htmlFor="reflection-line">A line, if you'd like</label>
                <input
                  id="reflection-line"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional"
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
            <h2 className="mok-session-h2">
              {nextPractice ? 'Your practice is noted.' : 'All for today. Beautiful.'}
            </h2>
            <p
              className="mok-session-lede"
              style={{ fontStyle: 'italic', maxWidth: 520, margin: '0 auto 8px' }}
            >
              {logError ?? closingNote(!nextPractice, practicedToday.length)}
            </p>
            {nextPractice && (
              <p
                className="mok-muted"
                style={{ fontSize: 14, fontStyle: 'italic', margin: '0 0 18px' }}
              >
                When you're ready, continue with the next.
              </p>
            )}
            <div className="mok-row" style={{ justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              {nextPractice && (() => {
                // If the user hasn't yet read Part A of the suggested next
                // practice, send them to the teaching first — not straight
                // into a guided session they aren't ready for.
                const nextRead = getReadPracticeLearn().includes(nextPractice.key);
                const to = !nextRead
                  ? `/practices/${nextPractice.key}/learn`
                  : nextPractice.key === 'writing'
                    ? '/journal'
                    : `/practices/${nextPractice.key}/session`;
                const label = !nextRead
                  ? `Read ${nextPractice.name} first →`
                  : `Continue with ${nextPractice.name} →`;
                return (
                  <button
                    type="button"
                    className="mok-session-btn mok-session-btn--accent"
                    onClick={() => navigate(to)}
                  >
                    {label}
                  </button>
                );
              })()}
              <button
                type="button"
                className={`mok-session-btn ${nextPractice ? '' : 'mok-session-btn--accent'}`}
                onClick={() => navigate('/today')}
              >
                Return to today
              </button>
              {!isWriting && (
                <button
                  type="button"
                  className="mok-session-btn"
                  onClick={() => navigate('/me/journal')}
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
