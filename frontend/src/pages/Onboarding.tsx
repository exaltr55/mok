import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, type ProfileUpdate } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from '../components/Wordmark';

const STEPS = [
  'welcome',
  'about',
  'cadence',
  'cohort',
  'consent',
  'ready',
] as const;

type Step = typeof STEPS[number];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Onboarding() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [intention, setIntention] = useState('');
  const [careerStage, setCareerStage] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'midday' | 'evening' | 'flexible'>('morning');
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [cohortPref, setCohortPref] = useState<'outside' | 'within' | 'none'>('outside');
  const [meetingDay, setMeetingDay] = useState('tuesday');
  const [aggregateConsent, setAggregateConsent] = useState(false);
  const [aiGuideConsent, setAiGuideConsent] = useState(true);

  const step: Step = STEPS[stepIdx];
  const onLast = stepIdx === STEPS.length - 1;

  async function next() {
    setError('');
    if (onLast) {
      setSaving(true);
      try {
        const patch: ProfileUpdate = {
          intention: intention.trim() || null,
          career_stage: (careerStage || null) as ProfileUpdate['career_stage'],
          preferred_time_of_day: timeOfDay,
          preferred_days_per_week: daysPerWeek,
          cohort_preference: cohortPref,
          cohort_meeting_day: cohortPref === 'none' ? null : meetingDay,
          onboarded: true,
        };
        await updateProfile(patch);
        await refresh();
        // First stop after onboarding is the section tour, then Learn.
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

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <Wordmark size="md" />
      </div>

      <div className="mok-card mok-card--padded">
        <div className="mok-row" style={{ marginBottom: 20, fontSize: 12, color: 'var(--text-subtle)' }}>
          <span className="mok-chip">{stepIdx + 1} of {STEPS.length}</span>
          <span className="mok-spacer" />
          <span>Takes about 3 minutes</span>
        </div>

        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

        {step === 'welcome' && (
          <>
            <h1 className="mok-section-title">Welcome, {user?.name?.split(' ')[0]}.</h1>
            <p className="mok-section-lede">
              YouSourceful is a quiet system for cultivating Awareness — the steady inner
              space that lets you stay yourself through change. The next few steps shape
              the app for you.
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
              A sentence on what's bringing you here, and one quick context question.
              Everything is optional. You can change it later in Preferences.
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
            <h1 className="mok-section-title">You're ready, {user?.name?.split(' ')[0]}.</h1>
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
