import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  acceptInvite,
  previewInvite,
  setToken,
  type InvitePreview,
} from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

/**
 * Invitation acceptance — the HR contact arrives here from the invitation
 * email, sets a password, and lands in their employer onboarding flow.
 */
export default function AcceptInvite() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { refresh } = useAuth();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setPreviewError('This invitation link is missing a token.');
      return;
    }
    previewInvite(token)
      .then(setPreview)
      .catch((err) => setPreviewError(err instanceof Error ? err.message : 'This invitation is no longer valid.'));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Your password needs to be at least eight characters long.');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Please include an uppercase letter, a lowercase letter, and a digit.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await acceptInvite(token, password);
      setToken(res.access_token);
      await refresh();
      // Route to the right onboarding based on who was invited.
      const dest = res.user.user_type === 'employer_admin'
        ? '/employer/onboarding'
        : '/onboarding';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept the invitation');
    } finally {
      setLoading(false);
    }
  }

  if (previewError) {
    return (
      <div className="mok-auth-shell">
        <div className="mok-card mok-card--padded mok-auth-card" style={{ textAlign: 'center' }}>
          <Logo size="md" />
          <h1 className="mok-section-title" style={{ fontSize: 22, marginTop: 16 }}>
            This invitation can't be opened.
          </h1>
          <p className="mok-section-lede" style={{ marginTop: 8 }}>{previewError}</p>
          <p className="mok-muted" style={{ fontSize: 14, marginTop: 12 }}>
            Reach out to your Mokshly contact and we'll send you a fresh link.
          </p>
        </div>
      </div>
    );
  }

  if (!preview) {
    return <div className="mok-loading">Opening your invitation…</div>;
  }

  return (
    <div className="mok-auth-shell">
      <form className="mok-card mok-card--padded mok-auth-card" onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18, textAlign: 'center' }}>
          <Logo size="md" />
        </div>
        <p className="mok-eyebrow" style={{ textAlign: 'center', margin: 0 }}>Welcome to YouSourceful</p>
        <h1 className="mok-section-title" style={{ textAlign: 'center', fontSize: 24, margin: '6px 0 6px' }}>
          Hello{preview.contact_name ? `, ${preview.contact_name.split(' ')[0]}` : ''}.
        </h1>
        <p className="mok-section-lede" style={{ textAlign: 'center', marginBottom: 24 }}>
          {preview.organisation_name
            ? `Your account for ${preview.organisation_name} is ready. Choose a password to continue.`
            : 'Your account is ready. Choose a password to continue.'}
        </p>

        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

        <div className="mok-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={preview.contact_email ?? ''} disabled readOnly />
          <span className="mok-field-hint">This is the email your invitation was sent to.</span>
        </div>

        <div className="mok-field">
          <label htmlFor="password">Choose a password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            autoComplete="new-password"
          />
          <span className="mok-field-hint">
            Eight or more characters, with an uppercase letter, a lowercase letter, and a digit.
          </span>
        </div>

        <div className="mok-field">
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="mok-btn mok-btn--gradient mok-btn--block mok-btn--lg" disabled={loading}>
          {loading ? 'Setting up…' : 'Set password & continue'}
        </button>
      </form>
    </div>
  );
}
