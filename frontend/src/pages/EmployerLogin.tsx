import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

/**
 * Employer login. Uses the same auth endpoint as practitioners — what differs
 * is the post-login redirect: an employer_admin user lands in
 * /employer/dashboard, an employee in /today.
 */
export default function EmployerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // The default authed redirect logic picks the right destination based
      // on user_type — pushing to /employer here lets the gate route them.
      navigate('/employer', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mok-auth-shell">
      <form className="mok-card mok-card--padded mok-auth-card" onSubmit={handleSubmit}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Logo size="md" />
        </div>
        <p className="mok-eyebrow" style={{ textAlign: 'center', margin: 0 }}>For employers</p>
        <h1 className="mok-section-title" style={{ textAlign: 'center', fontSize: 24, margin: '6px 0 6px' }}>Welcome back.</h1>
        <p className="mok-section-lede" style={{ textAlign: 'center', marginBottom: 24 }}>
          Sign in to your employer portal.
        </p>

        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

        <div className="mok-field">
          <label htmlFor="email">Work email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email" />
        </div>

        <div className="mok-field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>

        <button type="submit" className="mok-btn mok-btn--gradient mok-btn--block mok-btn--lg" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          <Link to="/forgot-password" style={{ color: 'var(--accent)' }}>Forgot your password?</Link>
          <p style={{ marginTop: 10 }}>
            New to YouSourceful?{' '}
            <Link to="/employer/signup" style={{ color: 'var(--accent)' }}>Create an employer account</Link>
          </p>
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-subtle)' }}>
            Looking for the practitioner sign-in? <Link to="/login" style={{ color: 'var(--accent)' }}>Go here</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
