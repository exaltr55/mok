import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
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
        <h1 className="mok-section-title" style={{ textAlign: 'center', fontSize: 24 }}>Begin your practice</h1>
        <p className="mok-section-lede" style={{ textAlign: 'center', marginBottom: 28 }}>
          A 30-day trial. No card required.
        </p>

        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

        <div className="mok-field">
          <label htmlFor="name">Your name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus autoComplete="name" />
        </div>
        <div className="mok-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="mok-field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
          <span className="mok-field-hint">At least 8 characters, with uppercase, lowercase, and a digit.</span>
        </div>

        <button type="submit" className="mok-btn mok-btn--gradient mok-btn--block mok-btn--lg" disabled={loading}>
          {loading ? 'Creating your account…' : 'Begin'}
        </button>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          Already a member? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </div>
      </form>
    </div>
  );
}
