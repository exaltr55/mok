import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  inviteEmployee,
  listEmployees,
  type Employee,
} from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from '../components/Wordmark';

/**
 * Employer "Team" page — HR can invite practitioners by email and see the
 * status of everyone on their team (invited / active).
 */
export default function EmployerTeam() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Invite form
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [sentToast, setSentToast] = useState('');

  useEffect(() => {
    document.title = 'Team · YouSourceful for employers';
    listEmployees()
      .then(setEmployees)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your team'))
      .finally(() => setLoading(false));
    return () => { document.title = 'YouSourceful · Mokshly'; };
  }, []);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSentToast('');
    if (!email.trim()) return;
    setSending(true);
    try {
      const created = await inviteEmployee(email.trim(), name.trim() || undefined);
      setEmployees((prev) => [created, ...prev]);
      setSentToast(`Invitation sent to ${created.email}.`);
      setEmail('');
      setName('');
      setTimeout(() => setSentToast(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the invitation');
    } finally {
      setSending(false);
    }
  }

  function signOut() {
    logout();
    navigate('/employer/login', { replace: true });
  }

  const invitedCount = employees.filter((e) => !e.is_active).length;
  const activeCount = employees.filter((e) => e.is_active).length;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 0 60px' }}>
      <header
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 28,
        }}
      >
        <div className="mok-row" style={{ gap: 14 }}>
          <Wordmark size="sm" />
          <span className="mok-chip">Employer</span>
        </div>
        <div className="mok-row" style={{ gap: 8 }}>
          <Link to="/employer" className="mok-btn mok-btn--ghost">Dashboard</Link>
          <Link to="/employer/orientation" className="mok-btn mok-btn--ghost">Orientation</Link>
          <button type="button" className="mok-btn mok-btn--ghost" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {/* Welcome */}
      <section style={{ marginBottom: 24 }}>
        <p className="mok-eyebrow">Team</p>
        <h1 className="mok-section-title">Invite your team.</h1>
        <p className="mok-section-lede">
          Send an invitation by email. Each person creates their own private
          account, walks through onboarding, and starts their practice the
          same day.
        </p>
        <p className="mok-muted" style={{ fontSize: 13, marginTop: 8 }}>
          {activeCount} active · {invitedCount} invited
        </p>
      </section>

      {/* Invite form */}
      <section className="mok-card" style={{ marginBottom: 28 }}>
        <p className="mok-section-h3">Send a new invitation</p>
        <p className="mok-muted" style={{ fontSize: 13, margin: '6px 0 18px', fontStyle: 'italic' }}>
          They'll receive an email with a link valid for 30 days.
        </p>

        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}
        {sentToast && <div className="mok-banner mok-banner--success" role="status">{sentToast}</div>}

        <form onSubmit={handleInvite} style={{ display: 'grid', gap: 14 }}>
          <div className="mok-row" style={{ gap: 14, flexWrap: 'wrap' }}>
            <div className="mok-field" style={{ flex: '2 1 280px', marginBottom: 0 }}>
              <label htmlFor="invite-email">Work email</label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@yourcompany.com"
                required
                autoComplete="off"
              />
            </div>
            <div className="mok-field" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label htmlFor="invite-name">Their name (optional)</label>
              <input
                id="invite-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name"
                autoComplete="off"
              />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button type="submit" className="mok-btn mok-btn--primary" disabled={sending}>
              {sending ? 'Sending…' : 'Send invitation →'}
            </button>
          </div>
        </form>
      </section>

      {/* Team list */}
      <section>
        <p className="mok-section-h3">Your team</p>
        <p className="mok-muted" style={{ fontSize: 13, margin: '6px 0 16px', fontStyle: 'italic' }}>
          Everyone we've sent an invite to, newest first.
        </p>

        {loading ? (
          <p className="mok-muted">Loading…</p>
        ) : employees.length === 0 ? (
          <div className="mok-card" style={{ borderLeft: '3px solid var(--accent)' }}>
            <p className="mok-eyebrow" style={{ margin: 0 }}>Nothing here yet</p>
            <p style={{ margin: '6px 0 0' }}>
              Send your first invitation above — most teams begin with a small
              pilot of 5–15 people before opening it up wider.
            </p>
          </div>
        ) : (
          <div className="mok-stack-sm">
            {employees.map((emp) => (
              <article
                key={emp.id}
                className="mok-card"
                style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 17 }}>
                    {emp.name}
                  </h3>
                  <p className="mok-muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                    {emp.email}
                  </p>
                </div>
                <span
                  className={`mok-status-chip ${emp.is_active ? 'mok-status-chip--on' : ''}`}
                  aria-label={emp.is_active ? 'Active' : 'Invited'}
                >
                  {emp.is_active
                    ? (emp.onboarded ? '● Practicing' : '● Joined')
                    : '○ Invited'}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
