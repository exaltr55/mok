import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getEmployerMe,
  updateTenant,
  type EmployerMe,
  type TenantUpdate,
} from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from '../components/Wordmark';
// Connect (cohort) is intentionally Mokshly-managed for now — we'll turn it
// on for each employer at the appropriate time, once we have enough
// practitioners across companies to form quality cohorts. The dashboard
// surfaces the feature so HR knows it exists, but offers no toggle.

/**
 * Employer dashboard — the HR home. Shows organization info, the cohort
 * feature toggle, and quick links. Aggregate team metrics will land here once
 * we have ten or more practitioners in the tenant.
 */
export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [me, setMe] = useState<EmployerMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Dashboard · YouSourceful for employers';
    getEmployerMe()
      .then(setMe)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your account'))
      .finally(() => setLoading(false));
    return () => { document.title = 'YouSourceful · Mokshly'; };
  }, []);

  function signOut() {
    logout();
    navigate('/employer/login', { replace: true });
  }

  if (loading) return <div className="mok-loading">Opening your dashboard…</div>;
  if (error || !me) return <div className="mok-banner mok-banner--error">{error || 'Not found'}</div>;

  const { user, tenant } = me;
  const firstName = user.name?.split(' ')[0];

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '16px 0 60px' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingBottom: 28,
          borderBottom: '1px solid var(--border)',
          marginBottom: 28,
        }}
      >
        <div className="mok-row" style={{ gap: 14 }}>
          <Wordmark size="sm" />
          <span className="mok-chip">Employer</span>
        </div>
        <div className="mok-row" style={{ gap: 8 }}>
          <Link to="/employer/team" className="mok-btn mok-btn--ghost">Team</Link>
          <Link to="/employer/orientation" className="mok-btn mok-btn--ghost">Orientation</Link>
          <button type="button" className="mok-btn mok-btn--ghost" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {/* ── Welcome header with context ─────────────────── */}
      <section style={{ marginBottom: 24 }}>
        <p className="mok-eyebrow">{timeOfDayGreeting()}</p>
        <h1 className="mok-section-title">
          {firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}
        </h1>
        <p className="mok-section-lede">
          This is your employer portal for <strong>{tenant.display_name}</strong> —
          where you shape how YouSourceful shows up for your team: the welcome
          notes new practitioners see, when the Connect cohort goes live, and
          (later) the anonymous, group-level patterns of how the program is
          landing.
        </p>
        <p className="mok-muted" style={{ fontSize: 13, marginTop: 8 }}>
          <span style={{ textTransform: 'capitalize' }}>{tenant.status}</span>
          {tenant.employee_count_band ? ` · ${tenant.employee_count_band} people` : ''}
          {tenant.cohort_enabled ? ' · Connect is live' : ''}
        </p>
      </section>

      {/* ── What to do next — adapts to current state ────── */}
      <NextSteps me={me} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 18,
          marginTop: 28,
          marginBottom: 32,
        }}
      >
        {/* Organization summary */}
        <OrganizationCard tenant={tenant} />

        {/* Accounts team (billing) */}
        <AccountsTeamCard tenant={tenant} />

        {/* Connect — read-only status. Mokshly turns this on at the right time. */}
        <section id="cohort-toggle" className="mok-card">
          <div className="mok-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div className="mok-row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <p className="mok-section-h3" style={{ margin: 0 }}>Connect — the cohort feature</p>
                <span className="mok-chip" title="Mokshly turns this on for your team at the right time">
                  Activated by Mokshly
                </span>
              </div>
              <p className="mok-muted" style={{ fontSize: 14, lineHeight: 1.55, margin: '10px 0 0', maxWidth: 520 }}>
                A small weekly circle of five practitioners, drawn from
                outside your company by default. Cohorts need a critical mass
                of practitioners across companies to form well, so{' '}
                <strong>the Mokshly team activates Connect for each employer
                at the right moment</strong> — usually a few weeks after your
                team begins their practice.
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.55, margin: '10px 0 0', color: 'var(--text)' }}>
                {tenant.cohort_enabled
                  ? <><strong>Live for your team.</strong> Every practitioner now sees the Connect tab populated.</>
                  : <><strong>Nothing for you to do right now.</strong> Your Mokshly contact will reach out when Connect goes live for your team — no action needed on your side.</>}
              </p>
            </div>
            <span
              className={`mok-status-chip ${tenant.cohort_enabled ? 'mok-status-chip--on' : ''}`}
              aria-label={tenant.cohort_enabled ? 'Connect is live' : 'Connect is not yet live'}
            >
              {tenant.cohort_enabled ? '● Live' : '○ Coming when ready'}
            </span>
          </div>
        </section>

        {/* Welcome notes for employees */}
        <WelcomeMessagesEditor me={me} onSave={(t) => setMe({ ...me, tenant: t })} />

        {/* Aggregate metrics placeholder */}
        <section className="mok-card">
          <p className="mok-section-h3">Team patterns</p>
          <p className="mok-muted" style={{ fontSize: 14, margin: '8px 0 0', fontStyle: 'italic', lineHeight: 1.55 }}>
            Anonymous, group-level engagement patterns will appear here once ten
            or more practitioners have joined and shared the same way. Each
            individual's data stays with them alone — this is the foundation we
            hold to, and what keeps the practice safe enough to be real.
          </p>
        </section>

        {/* Help */}
        <section className="mok-card">
          <p className="mok-section-h3">Need help or want to think through rollout?</p>
          <p className="mok-muted" style={{ fontSize: 14, margin: '8px 0 14px', lineHeight: 1.55 }}>
            Reach out any time — we read every message and reply within a day.
            We're glad to help with drafting team communications, planning a
            phased launch, or talking through a particular situation.
          </p>
          <Link to="/contact" className="mok-btn">Open Contact</Link>
        </section>
      </div>
    </div>
  );
}

/* ── Organization + Accounts cards ──────────────────────────── */

interface AddressParts {
  street1: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  /** Legacy single-line fallback if structured fields are blank. */
  legacy: string | null;
}

/** Renders a standard mailing-format address block:
 *    Street 1
 *    Street 2
 *    City, State Postal
 *    Country
 *  Skips lines that have no content. Falls back to the legacy single-line
 *  blob if no structured fields are filled in. Returns null when there is
 *  nothing to show. */
function FormattedAddress({ parts }: { parts: AddressParts }) {
  const cityLine = [
    parts.city,
    [parts.state, parts.postal_code].filter(Boolean).join(' '),
  ]
    .filter((s) => s && s.trim())
    .join(', ');

  const lines = [
    parts.street1,
    parts.street2,
    cityLine || null,
    parts.country,
  ].filter((l): l is string => !!(l && l.trim()));

  if (lines.length === 0) {
    if (parts.legacy?.trim()) {
      return <span style={{ whiteSpace: 'pre-line' }}>{parts.legacy}</span>;
    }
    return <>—</>;
  }

  return (
    <span style={{ whiteSpace: 'pre-line', lineHeight: 1.55 }}>
      {lines.join('\n')}
    </span>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="mok-subtle">{label}</dt>
      <dd style={{ margin: 0 }}>{children ?? '—'}</dd>
    </>
  );
}

function OrganizationCard({ tenant }: { tenant: EmployerMe['tenant'] }) {
  return (
    <section className="mok-card">
      <p className="mok-section-h3">Your organization</p>
      <p className="mok-muted" style={{ fontSize: 13, margin: '6px 0 14px' }}>
        What we have on file. Reach out via Contact if anything needs to change
        — we update the record on our side.
      </p>
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '10px 18px',
          margin: 0,
          fontSize: 14,
        }}
      >
        <InfoRow label="Name">{tenant.display_name}</InfoRow>
        <InfoRow label="Headquarters">
          <FormattedAddress
            parts={{
              street1: tenant.hq_street1,
              street2: tenant.hq_street2,
              city: tenant.hq_city,
              state: tenant.hq_state,
              postal_code: tenant.hq_postal_code,
              country: tenant.hq_country,
              legacy: tenant.hq_address,
            }}
          />
        </InfoRow>
        <InfoRow label="Website">
          {tenant.website ? (
            <a href={tenant.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              {tenant.website}
            </a>
          ) : '—'}
        </InfoRow>
        <InfoRow label="CEO">{tenant.ceo_name ?? '—'}</InfoRow>
        <InfoRow label="HR head">{tenant.hr_head_name ?? '—'}</InfoRow>
        <InfoRow label="HR contact email">{tenant.contact_email ?? '—'}</InfoRow>
        <InfoRow label="HR contact phone">{tenant.contact_phone ?? '—'}</InfoRow>
        <InfoRow label="Team size">{tenant.employee_count_band ?? '—'}</InfoRow>
        <InfoRow label="Status">
          <span style={{ textTransform: 'capitalize' }}>{tenant.status}</span>
        </InfoRow>
      </dl>
      {tenant.description && (
        <p className="mok-muted" style={{ fontSize: 13, marginTop: 14, fontStyle: 'italic', lineHeight: 1.55 }}>
          {tenant.description}
        </p>
      )}
    </section>
  );
}

function AccountsTeamCard({ tenant }: { tenant: EmployerMe['tenant'] }) {
  const hasStructuredAddress =
    tenant.billing_street1 || tenant.billing_city ||
    tenant.billing_state || tenant.billing_country || tenant.billing_postal_code;
  const hasAny =
    tenant.billing_contact_name || tenant.billing_email ||
    tenant.billing_phone || hasStructuredAddress || tenant.billing_address;

  return (
    <section className="mok-card">
      <p className="mok-section-h3">Accounts team</p>
      <p className="mok-muted" style={{ fontSize: 13, margin: '6px 0 14px' }}>
        Who we reach out to for billing matters — invoices, renewals, and
        account questions. Reach out via Contact to add or update.
      </p>
      {hasAny ? (
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '10px 18px',
            margin: 0,
            fontSize: 14,
          }}
        >
          <InfoRow label="Contact name">{tenant.billing_contact_name ?? '—'}</InfoRow>
          <InfoRow label="Email">{tenant.billing_email ?? '—'}</InfoRow>
          <InfoRow label="Phone">{tenant.billing_phone ?? '—'}</InfoRow>
          {(hasStructuredAddress || tenant.billing_address) && (
            <InfoRow label="Billing address">
              <FormattedAddress
                parts={{
                  street1: tenant.billing_street1,
                  street2: tenant.billing_street2,
                  city: tenant.billing_city,
                  state: tenant.billing_state,
                  postal_code: tenant.billing_postal_code,
                  country: tenant.billing_country,
                  legacy: tenant.billing_address,
                }}
              />
            </InfoRow>
          )}
        </dl>
      ) : (
        <p className="mok-muted" style={{ fontSize: 14, margin: 0, fontStyle: 'italic' }}>
          No accounts contact on file yet. Reach out via Contact and we'll add
          it for you.
        </p>
      )}
    </section>
  );
}

/* ── Welcome helpers ─────────────────────────────────────────── */

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Renders a prioritized to-do list adapted to what the employer hasn't yet
 *  done. Disappears entirely when everything is in good shape. */
function NextSteps({ me }: { me: EmployerMe }) {
  const t = me.tenant;
  const steps: Array<{ key: string; label: string; hint: string; cta: string; onClick?: () => void; href?: string; done?: boolean }> = [];

  if (!t.hr_head_message?.trim()) {
    steps.push({
      key: 'hr-note',
      label: 'Write a welcome note from your HR team',
      hint: 'Every new practitioner sees a short message from you during their orientation. A sentence or two, written warmly, goes a long way.',
      cta: 'Write HR note ↓',
      onClick: () => document.getElementById('welcome-notes')?.scrollIntoView({ behavior: 'smooth' }),
    });
  }
  if (!t.ceo_message?.trim()) {
    steps.push({
      key: 'ceo-note',
      label: 'Add a welcome note from your CEO',
      hint: 'Leadership backing makes the difference between "another tool" and "a practice we hold together." It only needs to be a few sentences.',
      cta: 'Write CEO note ↓',
      onClick: () => document.getElementById('welcome-notes')?.scrollIntoView({ behavior: 'smooth' }),
    });
  }
  steps.push({
    key: 'invite-team',
    label: 'Invite your first practitioners',
    hint: 'Send a small pilot group an invitation by email — five to fifteen people is a great place to start. They sign up, walk through onboarding, and begin practicing the same day.',
    cta: 'Open team page →',
    href: '/employer/team',
  });
  if (!steps.length) {
    return (
      <section
        className="mok-card"
        style={{
          borderLeft: '3px solid var(--accent)',
          background: 'color-mix(in srgb, var(--accent) 6%, var(--bg-raised))',
        }}
      >
        <p className="mok-eyebrow" style={{ margin: 0 }}>Everything in place</p>
        <p style={{ margin: '6px 0 0', fontSize: 15 }}>
          Your portal is set up beautifully — welcome notes ready, cohort
          decision made. The next thing to watch is your team's engagement,
          which will appear here as anonymous patterns once ten or more
          practitioners have joined.
        </p>
      </section>
    );
  }

  return (
    <section
      className="mok-card"
      style={{ borderLeft: '3px solid var(--accent)' }}
    >
      <p className="mok-eyebrow" style={{ margin: 0 }}>What to do next</p>
      <h2
        style={{
          margin: '6px 0 8px',
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 18,
        }}
      >
        A few small things to set your team up for a warm start.
      </h2>
      <ol className="mok-next-steps">
        {steps.map((s) => (
          <li key={s.key}>
            <div>
              <strong>{s.label}</strong>
              <p className="mok-muted" style={{ fontSize: 13, margin: '4px 0 8px', lineHeight: 1.55 }}>
                {s.hint}
              </p>
              {s.href ? (
                <Link to={s.href} className="mok-btn">{s.cta}</Link>
              ) : (
                <button type="button" className="mok-btn" onClick={s.onClick}>{s.cta}</button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ── Welcome notes editor (HR head + CEO messages) ───────────── */

function WelcomeMessagesEditor({
  me,
  onSave,
}: {
  me: EmployerMe;
  onSave: (t: EmployerMe['tenant']) => void;
}) {
  const [hrName, setHrName] = useState(me.tenant.hr_head_name ?? '');
  const [hrTitle, setHrTitle] = useState(me.tenant.hr_head_title ?? 'Head of People');
  const [hrMessage, setHrMessage] = useState(me.tenant.hr_head_message ?? '');
  const [ceoName, setCeoName] = useState(me.tenant.ceo_name ?? '');
  const [ceoTitle, setCeoTitle] = useState(me.tenant.ceo_title ?? 'Chief Executive Officer');
  const [ceoMessage, setCeoMessage] = useState(me.tenant.ceo_message ?? '');
  const [saving, setSaving] = useState<'hr' | 'ceo' | null>(null);
  const [error, setError] = useState('');
  const [savedFlash, setSavedFlash] = useState<'hr' | 'ceo' | null>(null);

  async function save(which: 'hr' | 'ceo') {
    setSaving(which);
    setError('');
    try {
      const patch: TenantUpdate = which === 'hr'
        ? {
            hr_head_name: hrName.trim() || undefined,
            hr_head_title: hrTitle.trim() || undefined,
            hr_head_message: hrMessage.trim() || undefined,
          }
        : {
            ceo_name: ceoName.trim() || undefined,
            ceo_title: ceoTitle.trim() || undefined,
            ceo_message: ceoMessage.trim() || undefined,
          };
      const updated = await updateTenant(patch);
      onSave(updated);
      setSavedFlash(which);
      setTimeout(() => setSavedFlash(null), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(null);
    }
  }

  function onSubmit(e: FormEvent, which: 'hr' | 'ceo') {
    e.preventDefault();
    void save(which);
  }

  return (
    <section id="welcome-notes" className="mok-card">
      <p className="mok-section-h3">Welcome notes for your team</p>
      <p className="mok-muted" style={{ fontSize: 14, margin: '8px 0 4px', lineHeight: 1.55 }}>
        Each new practitioner sees a short message from you during their
        orientation — a warm note from HR, and one from your CEO.
      </p>
      <p className="mok-muted" style={{ fontSize: 13, margin: '0 0 18px', fontStyle: 'italic', lineHeight: 1.55 }}>
        <strong>Tip for readability:</strong> write one thought per line
        (press Enter to start a new line). Each line will appear as its own
        bullet point on the practitioner's orientation card, making the note
        easy to scan and warm to read.
      </p>

      {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

      <div style={{ display: 'grid', gap: 22 }}>
        {/* HR head */}
        <form onSubmit={(e) => onSubmit(e, 'hr')} style={{ display: 'grid', gap: 10 }}>
          <p className="mok-eyebrow" style={{ margin: 0 }}>Note from HR</p>
          <div className="mok-row" style={{ gap: 10 }}>
            <input
              type="text"
              value={hrName}
              onChange={(e) => setHrName(e.target.value)}
              placeholder="Your name"
              style={{ flex: 1 }}
            />
            <input
              type="text"
              value={hrTitle}
              onChange={(e) => setHrTitle(e.target.value)}
              placeholder="Your title"
              style={{ flex: 1 }}
            />
          </div>
          <textarea
            rows={5}
            value={hrMessage}
            onChange={(e) => setHrMessage(e.target.value)}
            placeholder={[
              "We're so glad you're here.",
              "Take this practice at your own pace — it is yours alone, with your own measure.",
              "Your journal and reflections stay private to you, always.",
              "Reach out any time — we're here to support you.",
            ].join('\n')}
            maxLength={4000}
          />
          <div className="mok-row" style={{ justifyContent: 'flex-end', gap: 10 }}>
            {savedFlash === 'hr' && <span className="mok-subtle" style={{ fontSize: 12 }}>Saved ✓</span>}
            <button type="submit" className="mok-btn mok-btn--primary" disabled={saving === 'hr'}>
              {saving === 'hr' ? 'Saving…' : 'Save HR note'}
            </button>
          </div>
        </form>

        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />

        {/* CEO */}
        <form onSubmit={(e) => onSubmit(e, 'ceo')} style={{ display: 'grid', gap: 10 }}>
          <p className="mok-eyebrow" style={{ margin: 0 }}>Note from your CEO</p>
          <div className="mok-row" style={{ gap: 10 }}>
            <input
              type="text"
              value={ceoName}
              onChange={(e) => setCeoName(e.target.value)}
              placeholder="CEO name"
              style={{ flex: 1 }}
            />
            <input
              type="text"
              value={ceoTitle}
              onChange={(e) => setCeoTitle(e.target.value)}
              placeholder="Title"
              style={{ flex: 1 }}
            />
          </div>
          <textarea
            rows={5}
            value={ceoMessage}
            onChange={(e) => setCeoMessage(e.target.value)}
            placeholder={[
              'The way we work matters — and so does how we hold ourselves while doing it.',
              'Thank you for taking this small daily step with us.',
              "I'm grateful you're here.",
            ].join('\n')}
            maxLength={4000}
          />
          <div className="mok-row" style={{ justifyContent: 'flex-end', gap: 10 }}>
            {savedFlash === 'ceo' && <span className="mok-subtle" style={{ fontSize: 12 }}>Saved ✓</span>}
            <button type="submit" className="mok-btn mok-btn--primary" disabled={saving === 'ceo'}>
              {saving === 'ceo' ? 'Saving…' : 'Save CEO note'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
