import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/client';
import Logo from '../components/Logo';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="mok-auth-shell">
        <div className="mok-card mok-card--padded mok-auth-card">
          <Logo size="md" />
          <h1 className="mok-section-title" style={{ fontSize: 22, marginTop: 18 }}>Reset link is missing</h1>
          <p className="mok-muted">
            This page expects a token from the email we sent. Please use that
            link or request a new one.
          </p>
          <div style={{ marginTop: 16 }}>
            <Link className="mok-btn mok-btn--primary" to="/forgot-password">Request a new link</Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setStatus('submitting');
    try {
      await resetPassword(token, newPassword);
      setStatus('done');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
      setStatus('idle');
    }
  }

  return (
    <div className="mok-auth-shell">
      <form className="mok-card mok-card--padded mok-auth-card" onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <Logo size="md" />
        </div>
        <h1 className="mok-section-title" style={{ textAlign: 'center', fontSize: 22 }}>Set a new password</h1>
        <p className="mok-section-lede" style={{ textAlign: 'center', marginBottom: 28 }}>
          Pick something strong.
        </p>

        {status === 'done' && (
          <div className="mok-banner mok-banner--success" role="status">
            Password updated. Redirecting to sign in…
          </div>
        )}
        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

        <div className="mok-field">
          <label htmlFor="new-password">New password</label>
          <input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoFocus autoComplete="new-password" />
        </div>
        <div className="mok-field">
          <label htmlFor="confirm-password">Confirm</label>
          <input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
        </div>

        <button type="submit" className="mok-btn mok-btn--primary mok-btn--block" disabled={status !== 'idle'}>
          {status === 'submitting' ? 'Updating…' : 'Update password'}
        </button>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--accent)' }}>Back to sign in</Link>
        </div>
      </form>
    </div>
  );
}
