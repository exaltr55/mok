import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

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
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
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
        <h1 className="mok-section-title" style={{ textAlign: 'center', fontSize: 24 }}>Welcome back</h1>
        <p className="mok-section-lede" style={{ textAlign: 'center', marginBottom: 28 }}>
          Your practice is waiting.
        </p>

        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

        <div className="mok-field">
          <label htmlFor="email">Email</label>
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

          <hr style={{ margin: '20px 0', border: 0, borderTop: '1px solid var(--border)' }} />

          <p style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 10 }}>
            Don't have an account yet?
          </p>
          <p style={{ marginTop: 4 }}>
            <Link to="/signup" style={{ color: 'var(--accent)' }}>Sign up as an individual</Link>
          </p>
          <p style={{ marginTop: 6 }}>
            <Link to="/employer/signup" style={{ color: 'var(--accent)' }}>Bring YouSourceful to your team →</Link>
          </p>
          <p style={{ marginTop: 18, fontSize: 13, color: 'var(--text-subtle)' }}>
            Just exploring?{' '}
            <a
              href={import.meta.env.VITE_MOKSHLY_URL ?? 'http://localhost:5173'}
              style={{ color: 'var(--accent)' }}
            >
              Learn about Mokshly →
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
