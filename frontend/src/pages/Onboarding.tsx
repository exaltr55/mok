import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, type ProfileUpdate } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import Wordmark from '../components/Wordmark';

/**
 * First-login onboarding — nine focused preference questions, each on its
 * own screen for focus, plus welcome / palette / consents / ready bookends.
 *
 *   Welcome →
 *   Q1 Your intention (free text)
 *   Q2 What brings you here?              (here_because)
 *   Q3 What feels most stretched?         (stretched_area)
 *   Q4 How do you best restore?           (restore_style)
 *   Q5 A voice that meets you well…       (tone_preference)
 *   Q6 Career stage                       (career_stage)
 *   Q7 Preferred time of day              (preferred_time_of_day)
 *   Q8 Days per week                      (preferred_days_per_week)
 *   Q9 Your cohort                        (cohort_preference + meeting_day)
 *   Palette → Consent → Ready → /orientation
 */

const ALL_STEPS = [
  'welcome',
  'intention',
  'here',
  'stretched',
  'restore',
  'tone',
  'career',
  'time',
  'days',
  'cohort',
  'palette',
  'consent',
  'ready',
] as const;

type Step = typeof ALL_STEPS[number];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

type Stretched = 'mind' | 'body' | 'heart' | 'time';
type Restore = 'solitude' | 'movement' | 'conversation' | 'writing';
type Tone = 'quiet' | 'encouraging' | 'reflective';
type HereBecause = 'burnout' | 'transition' | 'growth' | 'curiosity' | 'recommended';
type CareerStage = 'early' | 'mid' | 'senior' | 'post-career' | '';

const STRETCHED: Array<{ id: Stretched; label: string; hint: string }> = [
  { id: 'mind',   label: 'Mind',   hint: 'Racing thoughts, hard to focus, hard to land.' },
  { id: 'body',   label: 'Body',   hint: 'Tight shoulders, low energy, restless sleep.' },
  { id: 'heart',  label: 'Heart',  hint: 'A heaviness; difficult conversations weighing.' },
  { id: 'time',   label: 'Time',   hint: 'Too many demands, not enough hours.' },
];

const RESTORE: Array<{ id: Restore; label: string; hint: string }> = [
  { id: 'solitude',     label: 'Solitude',     hint: 'Quiet alone-time refills you.' },
  { id: 'movement',     label: 'Movement',     hint: 'A walk, a stretch, the body in motion.' },
  { id: 'conversation', label: 'Conversation', hint: 'Talking it through with someone who listens.' },
  { id: 'writing',      label: 'Writing',      hint: 'Putting it on the page and letting it settle.' },
];

const TONE: Array<{ id: Tone; label: string; hint: string }> = [
  { id: 'quiet',       label: 'Quiet',       hint: 'Few words. Let me find my own meaning.' },
  { id: 'encouraging', label: 'Encouraging', hint: 'A warm, supportive companion.' },
  { id: 'reflective',  label: 'Reflective',  hint: 'Pose the question; let it sit with me.' },
];

const HERE_BECAUSE: Array<{ id: HereBecause; label: string; hint: string }> = [
  { id: 'burnout',    label: 'Recovering from burnout', hint: 'I have been running on empty.' },
  { id: 'transition', label: 'Going through a transition', hint: 'A change is underway — role, life, season.' },
  { id: 'growth',     label: 'Developing a steadier practice', hint: 'Building durable capacity.' },
  { id: 'curiosity',  label: 'Curious about the system', hint: 'Exploring what this is.' },
  { id: 'recommended', label: 'Recommended by my employer', hint: 'My company introduced me to YouSourceful.' },
];

const CAREER: Array<{ id: CareerStage; label: string; hint: string }> = [
  { id: 'early',       label: 'Early career',       hint: 'Finding your footing in the work.' },
  { id: 'mid',         label: 'Mid career',         hint: 'Carrying real weight, steering outcomes.' },
  { id: 'senior',      label: 'Senior',             hint: 'Leading at scale; many things to hold.' },
  { id: 'post-career', label: 'Post-career',        hint: 'A different season — open, exploring.' },
  { id: '',            label: 'Prefer not to say',  hint: 'Skip — used only for cohort matching.' },
];

type TimeOfDay = 'morning' | 'midday' | 'evening' | 'flexible';
const TIME_OF_DAY: Array<{ id: TimeOfDay; label: string; hint: string }> = [
  { id: 'morning',  label: 'Morning',  hint: 'First thing — set the tone for the day.' },
  { id: 'midday',   label: 'Midday',   hint: 'A pause in the middle. Reset.' },
  { id: 'evening',  label: 'Evening',  hint: 'A close to the day. Soften.' },
  { id: 'flexible', label: 'Flexible', hint: 'Whenever the moment opens.' },
];

type CohortPref = 'outside' | 'within' | 'none';
const COHORT: Array<{ id: CohortPref; label: string; hint: string }> = [
  { id: 'outside', label: 'People outside my company', hint: 'Fresh perspective, away from your day-to-day.' },
  { id: 'within',  label: 'People from my company',    hint: 'Shared context, same trenches.' },
  { id: 'none',    label: 'Practice solo for now',     hint: 'Walking alone is its own path. You can join a cohort whenever you’re ready.' },
];

const PALETTE: Array<{ id: Theme; label: string; hint: string; swatch: string }> = [
  { id: 'stillwater', label: 'Stillwater', hint: 'Ocean × sky — the default.',          swatch: 'linear-gradient(135deg, #EEF8F8 0%, #0EA5A5 50%, #38BDF8 100%)' },
  { id: 'sunbeam',    label: 'Sunbeam',    hint: 'Warm amber morning, a touch of joy.', swatch: 'linear-gradient(135deg, #FBF6E2, #D4954A)' },
  { id: 'cobalt',     label: 'Cobalt',     hint: 'Vibrant royal blue, energetic.',      swatch: 'linear-gradient(135deg, #F4F7FC, #2563EB)' },
  { id: 'sage',       label: 'Sage',       hint: 'Cool teal-slate, grounded.',          swatch: 'linear-gradient(135deg, #EFF3F1, #4D6F8A)' },
  { id: 'twilight',   label: 'Twilight',   hint: 'Midnight blue for the evening hours.', swatch: 'linear-gradient(135deg, #1A2434, #88A8D6)' },
];

export default function Onboarding() {
  const { user, refresh } = useAuth();
  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Skip the cohort step when the employer has not turned the feature on.
  const STEPS = (user?.cohort_enabled
    ? ALL_STEPS
    : ALL_STEPS.filter((s) => s !== 'cohort')) as readonly Step[];
  const totalQuestions = user?.cohort_enabled ? 9 : 8;

  // Form state — one slot per preference field.
  const [intention, setIntention] = useState('');
  const [hereBecause, setHereBecause] = useState<HereBecause | ''>('');
  const [stretched, setStretched] = useState<Stretched | ''>('');
  const [restore, setRestore] = useState<Restore | ''>('');
  const [tone, setTone] = useState<Tone | ''>('');
  const [careerStage, setCareerStage] = useState<CareerStage>('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [cohortPref, setCohortPref] = useState<CohortPref>('outside');
  const [meetingDay, setMeetingDay] = useState('tuesday');
  const [theme, setLocalTheme] = useState<Theme>('stillwater');
  const [aggregateConsent, setAggregateConsent] = useState(false);
  const [aiGuideConsent, setAiGuideConsent] = useState(true);

  const step: Step = STEPS[stepIdx];
  const onLast = stepIdx === STEPS.length - 1;

  function pickTheme(t: Theme) {
    setLocalTheme(t);
    setTheme(t);
  }

  async function next() {
    setError('');
    if (onLast) {
      setSaving(true);
      try {
        const patch: ProfileUpdate = {
          intention: intention.trim() || null,
          career_stage: (careerStage || null) as ProfileUpdate['career_stage'],
          stretched_area: (stretched || null) as ProfileUpdate['stretched_area'],
          restore_style: (restore || null) as ProfileUpdate['restore_style'],
          tone_preference: (tone || null) as ProfileUpdate['tone_preference'],
          here_because: (hereBecause || null) as ProfileUpdate['here_because'],
          theme,
          preferred_time_of_day: timeOfDay,
          preferred_days_per_week: daysPerWeek,
          cohort_preference: cohortPref,
          cohort_meeting_day: cohortPref === 'none' ? null : meetingDay,
          onboarded: true,
        };
        void aggregateConsent;
        void aiGuideConsent;
        await updateProfile(patch);
        await refresh();
        navigate('/orientation', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save your preferences');
      } finally {
        setSaving(false);
      }
      return;
    }
    setStepIdx(stepIdx + 1);
  }

  function back() {
    setError('');
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  const firstName = user?.name?.split(' ')[0];
  const questionStepIdx = stepIdx > 0 && stepIdx <= totalQuestions ? stepIdx : null;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <Wordmark size="md" />
      </div>

      <div className="mok-card mok-card--padded">
        <div className="mok-row" style={{ marginBottom: 20, fontSize: 12, color: 'var(--text-subtle)' }}>
          {questionStepIdx ? (
            <span className="mok-chip">Question {questionStepIdx} of {totalQuestions}</span>
          ) : (
            <span className="mok-chip">Step {stepIdx + 1} of {STEPS.length}</span>
          )}
          <span className="mok-spacer" />
          <span>About 4 minutes</span>
        </div>

        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

        {step === 'welcome' && (
          <>
            <h1 className="mok-section-title">Welcome, {firstName}.</h1>
            <p className="mok-section-lede">
              YouSourceful is a quiet system for cultivating Awareness — the steady
              inner space that lets you stay yourself through change. The next few
              minutes shape the app for you, personally.
            </p>
            <p className="mok-muted" style={{ marginTop: 16, fontStyle: 'italic' }}>
              {totalQuestions === 9 ? 'Nine' : 'Eight'} short questions to help
              us know you a little, then a brief orientation to the program.
              Your practice is yours alone — your journal, your reflections,
              and your private numbers stay with you.
            </p>
          </>
        )}

        {step === 'intention' && (
          <>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Question 1</p>
            <h1 className="mok-section-title">Your objective for this practice.</h1>
            <p className="mok-section-lede">
              In a sentence or two — what do you hope to cultivate? You can change
              this at any time in Preferences.
            </p>
            <div className="mok-field">
              <textarea
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="To stay grounded as my work changes. To be more present with my team."
                maxLength={400}
                rows={3}
                autoFocus
              />
              <span className="mok-field-hint">
                Optional. We'll surface it gently on days when it helps to remember.
              </span>
            </div>
          </>
        )}

        {step === 'here' && (
          <>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Question 2</p>
            <h1 className="mok-section-title">What brings you here right now?</h1>
            <QuestionGroup options={HERE_BECAUSE} value={hereBecause} onChange={setHereBecause} />
          </>
        )}

        {step === 'stretched' && (
          <>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Question 3</p>
            <h1 className="mok-section-title">What feels most stretched right now?</h1>
            <p className="mok-section-lede">
              Where the most attention is asked of you these days.
            </p>
            <QuestionGroup options={STRETCHED} value={stretched} onChange={setStretched} />
          </>
        )}

        {step === 'restore' && (
          <>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Question 4</p>
            <h1 className="mok-section-title">How do you best restore?</h1>
            <p className="mok-section-lede">
              The kind of recovery that actually refills you.
            </p>
            <QuestionGroup options={RESTORE} value={restore} onChange={setRestore} />
          </>
        )}

        {step === 'tone' && (
          <>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Question 5</p>
            <h1 className="mok-section-title">A voice that meets you well is…</h1>
            <p className="mok-section-lede">
              The tone the app should speak in.
            </p>
            <QuestionGroup options={TONE} value={tone} onChange={setTone} />
          </>
        )}

        {step === 'career' && (
          <>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Question 6</p>
            <h1 className="mok-section-title">Your career stage.</h1>
            <p className="mok-section-lede">
              Used only to match you with a cohort. Stays private to you and the matcher.
            </p>
            <QuestionGroup options={CAREER} value={careerStage} onChange={(v) => setCareerStage(v)} />
          </>
        )}

        {step === 'time' && (
          <>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Question 7</p>
            <h1 className="mok-section-title">When do you prefer to practice?</h1>
            <p className="mok-section-lede">
              We'll shape the daily rhythm around this. You can shift it any time.
            </p>
            <QuestionGroup options={TIME_OF_DAY} value={timeOfDay} onChange={setTimeOfDay} />
          </>
        )}

        {step === 'days' && (
          <>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Question 8</p>
            <h1 className="mok-section-title">How often, in a week?</h1>
            <p className="mok-section-lede">
              Rest is part of practice. Aim for five of seven — adjustable any time.
            </p>
            <div className="mok-field">
              <input
                type="range"
                min={1}
                max={7}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                style={{ accentColor: 'var(--accent)' }}
              />
              <p
                className="mok-muted"
                style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginTop: 8 }}
              >
                {daysPerWeek} day{daysPerWeek === 1 ? '' : 's'} a week.
              </p>
            </div>
          </>
        )}

        {step === 'cohort' && (
          <>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Question 9</p>
            <h1 className="mok-section-title">Your cohort.</h1>
            <p className="mok-section-lede">
              Five practitioners walking alongside you. Fifteen minutes a week. When
              you share what matters, you'd rather be with…
            </p>
            <QuestionGroup options={COHORT} value={cohortPref} onChange={setCohortPref} />
            {cohortPref !== 'none' && (
              <div className="mok-field" style={{ marginTop: 16 }}>
                <label htmlFor="meeting-day">Preferred meeting day</label>
                <select id="meeting-day" value={meetingDay} onChange={(e) => setMeetingDay(e.target.value)}>
                  {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
                <span className="mok-field-hint">Same time each week. Fifteen minutes.</span>
              </div>
            )}
          </>
        )}

        {step === 'palette' && (
          <>
            <h1 className="mok-section-title">Choose your palette.</h1>
            <p className="mok-section-lede">
              The colour you'll see each time you sign in. Pick a mood — the change is
              live as you choose, and you can switch any time.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 10,
                marginTop: 12,
              }}
            >
              {PALETTE.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`mok-choice ${theme === p.id ? 'mok-choice--active' : ''}`}
                  onClick={() => pickTheme(p.id)}
                  style={{ padding: 0, overflow: 'hidden' }}
                >
                  <div aria-hidden="true" style={{ height: 56, background: p.swatch }} />
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{p.label}</div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2, fontStyle: 'italic' }}>
                      {p.hint}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'consent' && (
          <>
            <h1 className="mok-section-title">A few quiet promises.</h1>
            <p className="mok-section-lede">
              Each choice below is separate. You can change any of them, any
              time, in Preferences.
            </p>
            <div className="mok-card mok-card--quiet" style={{ padding: 16, marginBottom: 12 }}>
              <div><strong>Running your account</strong> <span className="mok-chip">always on</span></div>
              <div className="mok-muted" style={{ fontSize: 13, marginTop: 4 }}>
                The basics we need to keep your account safe and working. Your
                journal, your private numbers, and your reflections stay with
                you — always.
              </div>
            </div>
            <label className="mok-card mok-card--quiet" style={{ padding: 16, marginBottom: 12, display: 'block', cursor: 'pointer' }}>
              <div className="mok-row">
                <input type="checkbox" checked={aggregateConsent} onChange={(e) => setAggregateConsent(e.target.checked)} />
                <strong>Helping your employer see patterns</strong>
                <span className="mok-chip">optional</span>
              </div>
              <div className="mok-muted" style={{ marginLeft: 24, fontSize: 13 }}>
                Only anonymous group patterns are shared — and only when ten or
                more colleagues have shared the same way, keeping each person
                fully unrecognisable. Your name, your journal, and your
                reflections stay with you, always.
              </div>
            </label>
            <label className="mok-card mok-card--quiet" style={{ padding: 16, display: 'block', cursor: 'pointer' }}>
              <div className="mok-row">
                <input type="checkbox" checked={aiGuideConsent} onChange={(e) => setAiGuideConsent(e.target.checked)} />
                <strong>Gentle check-ins from us</strong>
              </div>
              <div className="mok-muted" style={{ marginLeft: 24, fontSize: 13 }}>
                A quiet companion that notices meaningful moments — your
                seventh day, or a return after a break — and sends a kind word.
                It sees only that you practiced; your words remain private to
                you.
              </div>
            </label>
          </>
        )}

        {step === 'ready' && (
          <>
            <h1 className="mok-section-title">You're ready, {firstName}.</h1>
            <p className="mok-section-lede">
              Next, a brief orientation — a peek at the two parts of the
              program, how a daily practice settles in, your private space, and
              your cohort. Then we'll begin together in Learn.
            </p>
            <div className="mok-card mok-card--quiet" style={{ padding: 20, marginTop: 12 }}>
              <p className="mok-muted" style={{ fontSize: 14, margin: 0, fontStyle: 'italic' }}>
                "The practice is a doorway. What you carry from it lives in your day."
              </p>
            </div>
          </>
        )}

        <div className="mok-row" style={{ marginTop: 32, justifyContent: 'space-between' }}>
          {stepIdx > 0 ? (
            <button type="button" className="mok-btn mok-btn--ghost" onClick={back} disabled={saving}>← Back</button>
          ) : <span />}
          <button type="button" className="mok-btn mok-btn--primary" onClick={next} disabled={saving}>
            {saving ? 'Saving…' : onLast ? 'Start orientation →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable single-question chip group ───────────────────────── */

interface OptionShape<T extends string> {
  id: T;
  label: string;
  hint: string;
}

function QuestionGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: OptionShape<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 10,
        marginTop: 14,
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`mok-choice ${value === opt.id ? 'mok-choice--active' : ''}`}
          onClick={() => onChange(opt.id)}
          style={{ padding: '14px 16px', textAlign: 'left' }}
        >
          <div style={{ fontWeight: 500, fontSize: 15 }}>{opt.label}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4, fontStyle: 'italic' }}>
            {opt.hint}
          </div>
        </button>
      ))}
    </div>
  );
}
