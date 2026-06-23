import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserId, updateProfile, type ProfileUpdate } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import Wordmark from '../components/Wordmark';

/** localStorage key used to remember how far the user got in onboarding,
 *  scoped per user so two accounts on the same browser don't share state. */
function onboardingPositionKey(): string {
  const uid = getCurrentUserId();
  return uid ? `mok.onboarding.position.${uid}` : 'mok.onboarding.position.anon';
}

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
  'roadmap',
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

// "outside" / "within" preferences kept in the type for backward
// compatibility with existing saved profiles — but we no longer
// present a composition choice during onboarding. The language stays
// neutral about who joins the circle.
type CohortPref = 'outside' | 'within' | 'none' | 'open';
const COHORT: Array<{ id: CohortPref; label: string; hint: string }> = [
  {
    id: 'open',
    label: "Yes, I'd like a cohort",
    hint: 'A small group walking alongside you, gathering once a week.',
  },
  {
    id: 'none',
    label: 'Practice solo for now',
    hint: "Walking alone is its own path. You can join a cohort whenever you're ready.",
  },
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
  // Offer "resume where you left off" if the user dropped out earlier.
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [resumeStepIdx, setResumeStepIdx] = useState(0);

  // On first mount, check whether we have a saved position for this user.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(onboardingPositionKey());
      if (!raw) return;
      const saved = parseInt(raw, 10);
      if (Number.isFinite(saved) && saved > 0) {
        setResumeStepIdx(saved);
        setResumeAvailable(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist the current step so returning users can resume.
  useEffect(() => {
    try {
      localStorage.setItem(onboardingPositionKey(), String(stepIdx));
    } catch {
      // ignore
    }
  }, [stepIdx]);

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
  const [daysPerWeek, setDaysPerWeek] = useState(6);
  const [cohortPref, setCohortPref] = useState<CohortPref>('open');
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
        // Seed the four core practice times based on the user's chosen
        // band so reminders work from day 1 — they can refine in Rhythm.
        const TIME_DEFAULTS: Record<string, { morningBlock: string; writing: string }> = {
          morning:  { morningBlock: '07:30', writing: '22:00' },
          midday:   { morningBlock: '12:30', writing: '22:00' },
          evening:  { morningBlock: '17:00', writing: '22:30' },
          flexible: { morningBlock: '08:00', writing: '22:00' },
        };
        const d = TIME_DEFAULTS[timeOfDay] ?? TIME_DEFAULTS.morning;

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
          // Default reminder schedule — three practices share the morning
          // block; Writing anchors bedtime. Reminders auto-on so the
          // first 21 days have gentle nudges without any setup.
          breathing_time: d.morningBlock,
          thinking_time: d.morningBlock,
          talking_time: d.morningBlock,
          writing_time: d.writing,
          reminders_on: true,
          onboarded: true,
        };
        void aggregateConsent;
        void aiGuideConsent;
        await updateProfile(patch);
        await refresh();
        // Onboarding complete — clear the resume marker.
        try { localStorage.removeItem(onboardingPositionKey()); } catch { /* ignore */ }
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
  // Welcome + roadmap come before the questions; questions begin once the
  // user reaches 'intention'. We label them as questions so the counter
  // stays meaningful when the user is actually answering.
  const firstQuestionIdx = STEPS.indexOf('intention');
  const questionStepIdx =
    firstQuestionIdx > 0 && stepIdx >= firstQuestionIdx && stepIdx < firstQuestionIdx + totalQuestions
      ? stepIdx - firstQuestionIdx + 1
      : null;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <Wordmark size="md" />
      </div>

      {resumeAvailable && (
        <div
          className="mok-card mok-card--padded"
          style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Welcome back</p>
            <p className="mok-muted" style={{ margin: '4px 0 0', fontSize: 14, fontStyle: 'italic' }}>
              You left off at Step {resumeStepIdx + 1} of {STEPS.length}. Pick up where you were?
            </p>
          </div>
          <div className="mok-row" style={{ gap: 8 }}>
            <button
              type="button"
              className="mok-btn"
              onClick={() => { setResumeAvailable(false); setStepIdx(0); }}
            >
              Start over
            </button>
            <button
              type="button"
              className="mok-btn mok-btn--primary"
              onClick={() => { setStepIdx(resumeStepIdx); setResumeAvailable(false); }}
            >
              Resume →
            </button>
          </div>
        </div>
      )}

      <div className="mok-card mok-card--padded">
        {/* The welcome and roadmap screens stand apart as a quiet intro
            (no counter). Actual onboarding screens just show their own
            position — "Question X of 8" or "Step X of 3" — without the
            broader "Stage 1 of 4" framing, which is unnecessary here. */}
        {step !== 'welcome' && step !== 'roadmap' && (
          <div className="mok-row" style={{ marginBottom: 20, fontSize: 12, color: 'var(--text-subtle)' }}>
            {questionStepIdx ? (
              <span className="mok-chip">Onboarding · Question {questionStepIdx} of {totalQuestions}</span>
            ) : (
              <span className="mok-chip">
                Onboarding · Step {stepIdx - firstQuestionIdx - totalQuestions + 1} of {STEPS.length - firstQuestionIdx - totalQuestions}
              </span>
            )}
            <span className="mok-spacer" />
            <span>About 4 minutes</span>
          </div>
        )}

        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

        {step === 'welcome' && (
          <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <p className="mok-eyebrow" style={{ margin: 0 }}>YouSourceful · by Mokshly</p>
            <h1
              className="mok-section-title"
              style={{ marginTop: 14, fontSize: 36, lineHeight: 1.15 }}
            >
              Welcome, {firstName}.
            </h1>
            <p
              className="mok-section-lede"
              style={{ marginTop: 18, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}
            >
              So glad you're here. YouSourceful is yours — a quiet system
              for staying steady through whatever life brings, carried by
              small, daily acts of Awareness.
            </p>
            <p
              className="mok-muted"
              style={{ marginTop: 12, fontSize: 14, fontStyle: 'italic', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}
            >
              A thoughtful path, walked at your own pace.
            </p>
          </div>
        )}

        {step === 'roadmap' && (
          <>
            <p className="mok-eyebrow" style={{ margin: 0 }}>The path ahead</p>
            <h1 className="mok-section-title">Here's where we're going.</h1>
            <p className="mok-section-lede" style={{ marginBottom: 20 }}>
              Four clear stages, each at its own pace. You'll always know
              where you are.
            </p>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14 }}>
              {[
                {
                  title: 'Onboarding',
                  meta: 'A few minutes',
                  desc: 'A few short questions so the app fits you. You\'re in this step now.',
                },
                {
                  title: 'Orientation',
                  meta: 'A few minutes',
                  desc: 'A quick tour of how the program flows and where everything lives.',
                },
                {
                  title: 'Learn',
                  meta: 'Self-paced',
                  desc: 'Where you understand how life experience takes shape, and meet the practices that put that understanding into action.',
                },
                {
                  title: 'Do',
                  meta: 'Lifelong',
                  desc: 'Where it becomes real. Short daily practices that build into a steady rhythm — small, consistent, lasting.',
                },
              ].map((step_, i) => (
                <li
                  key={step_.title}
                  className="mok-card"
                  style={{ padding: '14px 16px', borderLeft: '3px solid var(--accent)' }}
                >
                  <div className="mok-row" style={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 14,
                          color: 'var(--accent)',
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>
                        {step_.title}
                      </h3>
                    </div>
                    <span className="mok-subtle" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                      {step_.meta}
                    </span>
                  </div>
                  <p className="mok-muted" style={{ margin: '6px 0 0', fontSize: 13, fontStyle: 'italic' }}>
                    {step_.desc}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mok-muted" style={{ marginTop: 18, fontStyle: 'italic', fontSize: 13, textAlign: 'center' }}>
              You can return to this view any time from Preferences.
            </p>
          </>
        )}

        {step === 'intention' && (
          <>
            <h1 className="mok-section-title">What are you here to cultivate?</h1>
            <p className="mok-section-lede">
              A sentence or two is plenty. Be honest, not poetic — this one is
              just for you. (You can rewrite it anytime in Preferences.)
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
                Optional — we'll bring it back gently on days when it helps to remember.
              </span>
            </div>
          </>
        )}

        {step === 'here' && (
          <>
            <h1 className="mok-section-title">What brings you here right now?</h1>
            <QuestionGroup options={HERE_BECAUSE} value={hereBecause} onChange={setHereBecause} />
          </>
        )}

        {step === 'stretched' && (
          <>
            <h1 className="mok-section-title">Where are you feeling the pull right now?</h1>
            <p className="mok-section-lede">
              The part of you that's asking for the most attention these days.
            </p>
            <QuestionGroup options={STRETCHED} value={stretched} onChange={setStretched} />
          </>
        )}

        {step === 'restore' && (
          <>
            <h1 className="mok-section-title">What actually fills your tank?</h1>
            <p className="mok-section-lede">
              The kind of recovery that genuinely brings you back — not the kind
              that just looks like it should.
            </p>
            <QuestionGroup options={RESTORE} value={restore} onChange={setRestore} />
          </>
        )}

        {step === 'tone' && (
          <>
            <h1 className="mok-section-title">How would you like us to speak to you?</h1>
            <p className="mok-section-lede">
              We can be quiet, encouraging, or reflective. We'll shape ourselves
              to match.
            </p>
            <QuestionGroup options={TONE} value={tone} onChange={setTone} />
          </>
        )}

        {step === 'career' && (
          <>
            <h1 className="mok-section-title">Where are you in your career?</h1>
            <p className="mok-section-lede">
              We use this only for cohort matching. Stays between you and the
              matcher — no further.
            </p>
            <QuestionGroup options={CAREER} value={careerStage} onChange={(v) => setCareerStage(v)} />
          </>
        )}

        {step === 'time' && (
          <>
            <h1 className="mok-section-title">When do you want to practice?</h1>
            <p className="mok-section-lede">
              We'll shape the daily rhythm around your answer. Shiftable
              anytime — no big deal.
            </p>
            <QuestionGroup options={TIME_OF_DAY} value={timeOfDay} onChange={setTimeOfDay} />
          </>
        )}

        {step === 'days' && (
          <>
            <h1 className="mok-section-title">How often, in a week?</h1>
            <p className="mok-section-lede">
              Six days a week is the sweet spot. Rest counts — it's part of
              the practice. Move the dial.
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
            <h1 className="mok-section-title">Want company on the walk?</h1>
            <p className="mok-section-lede">
              A small group of fellow practitioners, meeting once a week.
              You're welcome to join when cohorts open in your space — or to
              keep the practice yours alone for now.
            </p>
            <QuestionGroup options={COHORT} value={cohortPref} onChange={setCohortPref} />
            {cohortPref !== 'none' && (
              <div className="mok-field" style={{ marginTop: 16 }}>
                <label htmlFor="meeting-day">Preferred meeting day</label>
                <select id="meeting-day" value={meetingDay} onChange={(e) => setMeetingDay(e.target.value)}>
                  {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
                <span className="mok-field-hint">Same time each week.</span>
              </div>
            )}
          </>
        )}

        {step === 'palette' && (
          <>
            <h1 className="mok-section-title">Pick a mood.</h1>
            <p className="mok-section-lede">
              The colour you'll see every time you sign in. Tap one — it
              changes live, so you can try them on. Switchable anytime.
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
              We're going to be careful with you. Three things below, all
              separate, all in your control. Change any of them anytime in
              Preferences — we're not going to chase you.
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
            <h1 className="mok-section-title">All set, {firstName}.</h1>
            <p className="mok-section-lede">
              You answered everything. The app is tuned to you now. Next: a
              quick orientation — the shape of the program, how the daily
              rhythm works, what's where. Then we open Learn together.
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
