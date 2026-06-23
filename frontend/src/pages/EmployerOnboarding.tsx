import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  completeEmployerOnboarding,
  getEmployerMe,
  updateTenant,
  type EmployerMe,
} from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from '../components/Wordmark';

/**
 * HR onboarding — a few light questions about how this team is rolling out
 * the program, then on to the orientation. Five steps, never longer than two
 * minutes.
 */

const STEPS = ['welcome', 'rollout', 'cohort', 'consent', 'ready'] as const;
type Step = typeof STEPS[number];

export default function EmployerOnboarding() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [me, setMe] = useState<EmployerMe | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [rollout, setRollout] = useState<'pilot' | 'department' | 'whole-team' | ''>('');
  const [description, setDescription] = useState('');
  const [confidential, setConfidential] = useState(true);

  useEffect(() => {
    getEmployerMe()
      .then(setMe)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your account'));
  }, []);

  const step: Step = STEPS[stepIdx];
  const onLast = stepIdx === STEPS.length - 1;
  const firstName = me?.user.name?.split(' ')[0];
  const orgName = me?.tenant.display_name;

  async function next() {
    setError('');
    if (onLast) {
      setSaving(true);
      try {
        await updateTenant({
          description: description.trim() || undefined,
        });
        await completeEmployerOnboarding();
        await refresh();
        navigate('/employer/orientation', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save');
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
          <span className="mok-chip">Step {stepIdx + 1} of {STEPS.length}</span>
          <span className="mok-spacer" />
          <span>About 2 minutes</span>
        </div>

        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

        {step === 'welcome' && (
          <>
            <h1 className="mok-section-title">Welcome{firstName ? `, ${firstName}` : ''}.</h1>
            <p className="mok-section-lede">
              We're glad you're bringing YouSourceful to {orgName ?? 'your team'}. A
              few light questions about how you'd like to roll out, then a short
              orientation. You can change anything later from your dashboard.
            </p>
            <p className="mok-muted" style={{ marginTop: 16, fontStyle: 'italic' }}>
              We take privacy seriously. Your team's journals, reflections, and
              private numbers stay with each individual — your view shows only
              anonymous, group-level patterns when ten or more people share.
            </p>
          </>
        )}

        {step === 'rollout' && (
          <>
            <p className="mok-eyebrow" style={{ margin: 0 }}>How you're rolling out</p>
            <h1 className="mok-section-title">Where will this start?</h1>
            <p className="mok-section-lede">
              Just to shape the conversation. There's no wrong answer.
            </p>

            <div className="mok-stack-sm" style={{ marginTop: 14 }}>
              {([
                ['pilot',      'A small pilot first',      'A team or two, to see how it lands.'],
                ['department', 'A whole department',       'An engineering org, a region, a unit.'],
                ['whole-team', 'The whole organization',   'Everyone in our team at once.'],
              ] as const).map(([val, label, hint]) => (
                <label key={val} className="mok-card mok-card--quiet" style={{ padding: 14, cursor: 'pointer', display: 'block' }}>
                  <div className="mok-row">
                    <input type="radio" name="rollout" value={val} checked={rollout === val} onChange={() => setRollout(val)} />
                    <strong>{label}</strong>
                  </div>
                  <div className="mok-muted" style={{ marginLeft: 24, fontSize: 13 }}>{hint}</div>
                </label>
              ))}
            </div>

            <div className="mok-field" style={{ marginTop: 16 }}>
              <label htmlFor="notes">Anything you want to note? (Optional)</label>
              <textarea
                id="notes"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short context note — what you hope to support, which team is starting, etc."
                maxLength={2000}
              />
            </div>
          </>
        )}

        {step === 'cohort' && (
          <>
            <p className="mok-eyebrow" style={{ margin: 0 }}>The cohort feature</p>
            <h1 className="mok-section-title">Connect — activated by Mokshly.</h1>
            <p className="mok-section-lede">
              Connect is a small weekly circle of five practitioners,
              drawn from outside your company by default. It needs a critical
              mass of practitioners across companies to form well — so{' '}
              <strong>the Mokshly team activates it for each employer at the
              right time</strong>, usually a few weeks in.
            </p>

            <div className="mok-card mok-card--quiet" style={{ padding: 16, marginTop: 14 }}>
              <p className="mok-eyebrow" style={{ margin: 0 }}>What this means for you</p>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, lineHeight: 1.65, fontSize: 14 }}>
                <li>Mokshly handles the activation — the timing decision lives with us, so you can focus elsewhere.</li>
                <li>Your team can begin their private practice right away.</li>
                <li>We'll reach out when Connect goes live for your team, and gently let your practitioners know.</li>
                <li>Until then, Connect is mentioned in their orientation as "coming when your team is ready," so the rollout is a warm reveal when the moment is right.</li>
              </ul>
            </div>
          </>
        )}

        {step === 'consent' && (
          <>
            <h1 className="mok-section-title">A few quiet promises.</h1>
            <p className="mok-section-lede">
              You can revisit any of these later in your dashboard.
            </p>

            <div className="mok-card mok-card--quiet" style={{ padding: 16, marginBottom: 12 }}>
              <div><strong>Practitioner privacy</strong> <span className="mok-chip">always on</span></div>
              <div className="mok-muted" style={{ fontSize: 13, marginTop: 4 }}>
                Every practitioner's journal, reflections, and private numbers
                belong to them alone. Your view shows only anonymous, group-level
                patterns — and only when ten or more people have shared the
                same way, keeping each person fully unrecognisable.
              </div>
            </div>

            <label className="mok-card mok-card--quiet" style={{ padding: 16, display: 'block', cursor: 'pointer' }}>
              <div className="mok-row">
                <input
                  type="checkbox"
                  checked={confidential}
                  onChange={(e) => setConfidential(e.target.checked)}
                />
                <strong>I will keep what is shared in cohort circles confidential.</strong>
              </div>
              <div className="mok-muted" style={{ marginLeft: 24, fontSize: 13 }}>
                This is what every practitioner signs too — a small agreement
                that holds the space safe.
              </div>
            </label>
          </>
        )}

        {step === 'ready' && (
          <>
            <h1 className="mok-section-title">You're set{firstName ? `, ${firstName}` : ''}.</h1>
            <p className="mok-section-lede">
              Next, a brief orientation — the two parts of the program, how
              practitioners settle in, your dashboard, and how invitations work.
              About four minutes.
            </p>
            <div className="mok-card mok-card--quiet" style={{ padding: 20, marginTop: 12 }}>
              <p className="mok-muted" style={{ fontSize: 14, margin: 0, fontStyle: 'italic' }}>
                "A team that practices together remembers how to meet each
                moment — including the hard ones."
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
