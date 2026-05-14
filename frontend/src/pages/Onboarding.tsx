import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, type ProfileUpdate } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import Wordmark from '../components/Wordmark';

const STEPS = [
  'welcome',
  'about',
  'personalize',
  'palette',
  'cadence',
  'cohort',
  'consent',
  'ready',
] as const;

type Step = typeof STEPS[number];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

type Stretched = 'mind' | 'body' | 'heart' | 'time';
type Restore = 'solitude' | 'movement' | 'conversation' | 'writing';
type Tone = 'quiet' | 'encouraging' | 'reflective';
type HereBecause = 'burnout' | 'transition' | 'growth' | 'curiosity' | 'recommended';

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

const PALETTE: Array<{ id: Theme; label: string; hint: string; swatch: string }> = [
  { id: 'stillwater', label: 'Stillwater', hint: 'Calm slate blue — the default.',      swatch: 'linear-gradient(135deg, #EEF3F9, #4D6FA5)' },
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

  // Form state
  const [intention, setIntention] = useState('');
  const [careerStage, setCareerStage] = useState('');
  const [stretched, setStretched] = useState<Stretched | ''>('');
  const [restore, setRestore] = useState<Restore | ''>('');
  const [tone, setTone] = useState<Tone | ''>('');
  const [hereBecause, setHereBecause] = useState<HereBecause | ''>('');
  const [theme, setLocalTheme] = useState<Theme>('stillwater');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'midday' | 'evening' | 'flexible'>('morning');
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [cohortPref, setCohortPref] = useState<'outside' | 'within' | 'none'>('outside');
  const [meetingDay, setMeetingDay] = useState('tuesday');
  const [aggregateConsent, setAggregateConsent] = useState(false);
  const [aiGuideConsent, setAiGuideConsent] = useState(true);

  const step: Step = STEPS[stepIdx];
  const onLast = stepIdx === STEPS.length - 1;

  // Apply the chosen palette live as the user picks it.
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
        // Silence the unused-vars warning for consents until Tier 2/4 are wired
        // to the consent table.
        void aggregateConsent;
        void aiGuideConsent;
        await updateProfile(patch);
        await refresh();
        navigate('/tour', { replace: true });
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

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <Wordmark size="md" />
      </div>

      <div className="mok-card mok-card--padded">
        <div className="mok-row" style={{ marginBottom: 20, fontSize: 12, color: 'var(--text-subtle)' }}>
          <span className="mok-chip">{stepIdx + 1} of {STEPS.length}</span>
          <span className="mok-spacer" />
          <span>Takes about 4 minutes</span>
        </div>

        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

        {step === 'welcome' && (
          <>
            <h1 className="mok-section-title">Welcome, {firstName}.</h1>
            <p className="mok-section-lede">
              YouSourceful is a quiet system for cultivating Awareness — the steady inner
              space that lets you stay yourself through change. The next few minutes shape
              the app for you, personally.
            </p>
            <p className="mok-muted" style={{ marginTop: 16, fontStyle: 'italic' }}>
              The practices are doorways through which Awareness becomes available. Some
              days you walk through one. Some days three. Each is enough. We honor
              consistency and intention.
            </p>
            <p className="mok-muted" style={{ marginTop: 12, fontSize: 14 }}>
              Your practice is yours alone — your journal, your reflections, and your MCI
              stay private to you.
            </p>
          </>
        )}

        {step === 'about' && (
          <>
            <h1 className="mok-section-title">Tell us about you.</h1>
            <p className="mok-section-lede">
              A sentence on what's bringing you here, and one context question. Both
              optional. You can change them later in Preferences.
            </p>
            <div className="mok-field">
              <label htmlFor="intention">Your objective for this practice</label>
              <textarea
                id="intention"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="To stay grounded as my work changes. To be more present with my team."
                maxLength={400}
              />
              <span className="mok-field-hint">
                You can revisit this any time — it shapes how the app gently meets you.
              </span>
            </div>
            <div className="mok-field">
              <label htmlFor="stage">Career stage</label>
              <select id="stage" value={careerStage} onChange={(e) => setCareerStage(e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="early">Early career</option>
                <option value="mid">Mid career</option>
                <option value="senior">Senior</option>
                <option value="post-career">Post-career</option>
              </select>
              <span className="mok-field-hint">
                Used for cohort matching only. Stays private to you and the matcher.
              </span>
            </div>
          </>
        )}

        {step === 'personalize' && (
          <>
            <h1 className="mok-section-title">A few quick choices.</h1>
            <p className="mok-section-lede">
              These shape what the app surfaces for you each day — the practice it leads
              with, the voice it speaks in, the cohort it suggests.
            </p>

            <QuestionGroup
              label="What feels most stretched right now?"
              options={STRETCHED}
              value={stretched}
              onChange={setStretched}
            />
            <QuestionGroup
              label="How do you best restore?"
              options={RESTORE}
              value={restore}
              onChange={setRestore}
            />
            <QuestionGroup
              label="A voice that meets you well is…"
              options={TONE}
              value={tone}
              onChange={setTone}
            />
            <QuestionGroup
              label="What brings you here right now?"
              options={HERE_BECAUSE}
              value={hereBecause}
              onChange={setHereBecause}
            />
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
                  <div
                    aria-hidden="true"
                    style={{
                      height: 56,
                      background: p.swatch,
                    }}
                  />
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

        {step === 'cadence' && (
          <>
            <h1 className="mok-section-title">How will you practice?</h1>
            <p className="mok-section-lede">
              A rough rhythm helps. Aim for five of seven days — rest is part of practice.
            </p>
            <div className="mok-field">
              <label>Preferred time of day</label>
              <div className="mok-row" style={{ gap: 8 }}>
                {(['morning', 'midday', 'evening', 'flexible'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`mok-btn ${timeOfDay === t ? 'mok-btn--primary' : ''}`}
                    onClick={() => setTimeOfDay(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mok-field">
              <label htmlFor="days">Days per week</label>
              <input
                id="days"
                type="range"
                min={1}
                max={7}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span className="mok-field-hint">Aiming for {daysPerWeek} day{daysPerWeek === 1 ? '' : 's'} a week.</span>
            </div>
          </>
        )}

        {step === 'cohort' && (
          <>
            <h1 className="mok-section-title">Your cohort.</h1>
            <p className="mok-section-lede">
              Five practitioners walking alongside you. Fifteen minutes a week. When you
              share what matters, you'd rather be with…
            </p>
            <div className="mok-stack-sm" style={{ marginBottom: 14 }}>
              {([
                ['outside', 'People outside my company', 'Fresh perspective, away from your day-to-day.'],
                ['within', 'People from my company', 'Shared context, same trenches.'],
                ['none', 'Practice solo for now', 'Walking alone is its own path. You can opt into a cohort any time.'],
              ] as const).map(([val, label, hint]) => (
                <label key={val} className="mok-card mok-card--quiet" style={{ padding: 16, cursor: 'pointer', display: 'block' }}>
                  <div className="mok-row">
                    <input type="radio" name="cohortpref" value={val} checked={cohortPref === val} onChange={() => setCohortPref(val)} />
                    <strong>{label}</strong>
                  </div>
                  <div className="mok-muted" style={{ marginLeft: 24, fontSize: 13 }}>{hint}</div>
                </label>
              ))}
            </div>
            {cohortPref !== 'none' && (
              <div className="mok-field">
                <label htmlFor="meeting-day">Preferred meeting day</label>
                <select id="meeting-day" value={meetingDay} onChange={(e) => setMeetingDay(e.target.value)}>
                  {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
                <span className="mok-field-hint">Your weekly Connect is fifteen minutes. Same time each week.</span>
              </div>
            )}
          </>
        )}

        {step === 'consent' && (
          <>
            <h1 className="mok-section-title">A few quiet promises.</h1>
            <p className="mok-section-lede">
              Each consent is separate, and reversible any time in Preferences.
            </p>
            <div className="mok-card mok-card--quiet" style={{ padding: 16, marginBottom: 12 }}>
              <div><strong>Platform data</strong> <span className="mok-chip">required</span></div>
              <div className="mok-muted" style={{ fontSize: 13, marginTop: 4 }}>
                What we need to run your account. Your journal, your MCI, and your
                reflections stay private to you — always.
              </div>
            </div>
            <label className="mok-card mok-card--quiet" style={{ padding: 16, marginBottom: 12, display: 'block', cursor: 'pointer' }}>
              <div className="mok-row">
                <input type="checkbox" checked={aggregateConsent} onChange={(e) => setAggregateConsent(e.target.checked)} />
                <strong>Aggregate signals to your employer</strong>
                <span className="mok-chip">optional</span>
              </div>
              <div className="mok-muted" style={{ marginLeft: 24, fontSize: 13 }}>
                Anonymized counts roll up into your employer's program-health view, only
                at groups of ten or more. Your individual data stays with you.
              </div>
            </label>
            <label className="mok-card mok-card--quiet" style={{ padding: 16, display: 'block', cursor: 'pointer' }}>
              <div className="mok-row">
                <input type="checkbox" checked={aiGuideConsent} onChange={(e) => setAiGuideConsent(e.target.checked)} />
                <strong>AI Guide check-ins</strong>
              </div>
              <div className="mok-muted" style={{ marginLeft: 24, fontSize: 13 }}>
                A rule-based companion that notices meaningful moments — Day 7, after an
                absence, the turn of a phase. Sees only your practice patterns; your
                journal and reflections stay yours.
              </div>
            </label>
          </>
        )}

        {step === 'ready' && (
          <>
            <h1 className="mok-section-title">You're ready, {firstName}.</h1>
            <p className="mok-section-lede">
              Next, a brief tour — about ninety seconds, showing what's in YouSourceful
              and how it all fits together. Then we'll begin with the Learn section.
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
            {saving ? 'Saving…' : onLast ? 'Start the tour →' : 'Continue →'}
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
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: OptionShape<T>[];
  value: T | '';
  onChange: (v: T) => void;
}) {
  return (
    <div className="mok-field" style={{ marginBottom: 22 }}>
      <label style={{ marginBottom: 10 }}>{label}</label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 8,
        }}
      >
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`mok-choice ${value === opt.id ? 'mok-choice--active' : ''}`}
            onClick={() => onChange(opt.id)}
            style={{ padding: '12px 14px' }}
          >
            <div style={{ fontWeight: 500, fontSize: 14 }}>{opt.label}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2, fontStyle: 'italic' }}>
              {opt.hint}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
