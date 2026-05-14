import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, type ProfileUpdate } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

const STEPS = [
  'welcome',
  'intention',
  'cadence',
  'cohort',
  'consent',
  'first-practice',
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
        navigate('/me', { replace: true });
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
        <Logo size="md" />
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
              We'll set up your practice in a few quiet steps. Nothing here is required —
              you can change everything later in Settings.
            </p>
            <p className="mok-muted" style={{ fontStyle: 'italic', marginTop: 18 }}>
              Mokshly is not a regime of seven daily practices to check off. It's a
              system for cultivating Awareness. The practices are doorways — some
              days you walk through one, some days three, some days none. Each is
              enough.
            </p>
          </>
        )}

        {step === 'intention' && (
          <>
            <h1 className="mok-section-title">What brings you here?</h1>
            <p className="mok-section-lede">One sentence. You can change it any time.</p>
            <div className="mok-field">
              <label htmlFor="intention">Your intention (optional)</label>
              <textarea
                id="intention"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="To stay grounded as my work changes."
                maxLength={400}
              />
            </div>
            <div className="mok-field">
              <label htmlFor="stage">Career stage (optional)</label>
              <select id="stage" value={careerStage} onChange={(e) => setCareerStage(e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="early">Early career</option>
                <option value="mid">Mid career</option>
                <option value="senior">Senior</option>
                <option value="post-career">Post-career</option>
              </select>
              <span className="mok-field-hint">Used only for cohort matching. Never shared.</span>
            </div>
          </>
        )}

        {step === 'cadence' && (
          <>
            <h1 className="mok-section-title">How will you practice?</h1>
            <p className="mok-section-lede">
              A rough rhythm helps. The target is 5 of 7 days — never all seven. Rest is
              part of practice.
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
            <h1 className="mok-section-title">Your cohort</h1>
            <p className="mok-section-lede">
              When you share what matters, you'd rather be with…
            </p>
            <div className="mok-stack-sm" style={{ marginBottom: 14 }}>
              {([
                ['outside', 'People outside my affiliation', 'Most members choose this — perspective from outside your day-to-day.'],
                ['within', 'People from my affiliation', 'Useful when you want shared context.'],
                ['none', 'No cohort for now', 'Practice solo. You can opt in later.'],
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
                <span className="mok-field-hint">Your weekly Connect is 15 minutes. Same time each week.</span>
              </div>
            )}
          </>
        )}

        {step === 'consent' && (
          <>
            <h1 className="mok-section-title">A few quiet promises</h1>
            <p className="mok-section-lede">
              Each consent is separate. You can change them any time in Settings.
            </p>
            <div className="mok-card mok-card--quiet" style={{ padding: 16, marginBottom: 12 }}>
              <div><strong>Platform data</strong> <span className="mok-chip">required</span></div>
              <div className="mok-muted" style={{ fontSize: 13, marginTop: 4 }}>
                Necessary for the account to work. Your journal, MCI, and reflections
                are always Tier 1 — never shared with anyone.
              </div>
            </div>
            <label className="mok-card mok-card--quiet" style={{ padding: 16, marginBottom: 12, display: 'block', cursor: 'pointer' }}>
              <div className="mok-row">
                <input type="checkbox" checked={aggregateConsent} onChange={(e) => setAggregateConsent(e.target.checked)} />
                <strong>Tenant aggregate sharing</strong>
                <span className="mok-chip">optional</span>
              </div>
              <div className="mok-muted" style={{ marginLeft: 24, fontSize: 13 }}>
                Contributes anonymized signals (never individual data) to aggregate
                reports. Only at groups of ≥10. Revocable any time.
              </div>
            </label>
            <label className="mok-card mok-card--quiet" style={{ padding: 16, display: 'block', cursor: 'pointer' }}>
              <div className="mok-row">
                <input type="checkbox" checked={aiGuideConsent} onChange={(e) => setAiGuideConsent(e.target.checked)} />
                <strong>AI Guide check-ins</strong>
              </div>
              <div className="mok-muted" style={{ marginLeft: 24, fontSize: 13 }}>
                A rule-based companion that notices meaningful moments (Day 7, after
                an absence, anniversaries). Sees practice patterns and your MCI,
                never your journal or reflections.
              </div>
            </label>
          </>
        )}

        {step === 'first-practice' && (
          <>
            <h1 className="mok-section-title">You're ready.</h1>
            <p className="mok-section-lede">
              We'll place you in a cohort in the next formation wave. Until then,
              your practice is waiting.
            </p>
            <div className="mok-card mok-card--quiet" style={{ padding: 20 }}>
              <div className="mok-muted" style={{ fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                Recommended first practice
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', margin: '6px 0', fontSize: 24 }}>I M Breathing</h2>
              <div className="mok-muted">Three minutes. A simple 4-4-4 rhythm.</div>
            </div>
          </>
        )}

        <div className="mok-row" style={{ marginTop: 32, justifyContent: 'space-between' }}>
          {stepIdx > 0 ? (
            <button type="button" className="mok-btn mok-btn--ghost" onClick={back} disabled={saving}>← Back</button>
          ) : <span />}
          <button type="button" className="mok-btn mok-btn--gradient" onClick={next} disabled={saving}>
            {saving ? 'Saving…' : onLast ? 'Begin practicing' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
