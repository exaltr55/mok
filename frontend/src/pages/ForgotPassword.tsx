import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/client';
import Logo from '../components/Logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setStatus('submitting');
    try {
      await forgotPassword(email);
      setStatus('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setStatus('idle');
    }
  }

  return (
    <div className="mok-auth-shell">
      <form className="mok-card mok-card--padded mok-auth-card" onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <Logo size="md" />
        </div>
        <h1 className="mok-section-title" style={{ textAlign: 'center', fontSize: 22 }}>Forgot password</h1>
        <p className="mok-section-lede" style={{ textAlign: 'center', marginBottom: 28 }}>
          Enter your email and we'll send a reset link.
        </p>

        {status === 'sent' && (
          <div className="mok-banner mok-banner--success" role="status">
            If an account exists for that email, a reset link is on its way.
          </div>
        )}
        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

        <div className="mok-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email" />
        </div>

        <button
          type="submit"
          className="mok-btn mok-btn--primary mok-btn--block"
          disabled={status === 'submitting' || status === 'sent'}
        >
          {status === 'submitting' ? 'Sending…' : 'Send reset link'}
        </button>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--accent)' }}>Back to sign in</Link>
        </div>
      </form>
    </div>
  );
}
