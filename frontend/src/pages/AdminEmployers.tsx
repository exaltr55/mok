import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  listEmployers,
  provisionEmployer,
  updateEmployerAsAdmin,
  type Tenant,
  type ProvisionEmployerPayload,
  type TenantUpdate,
} from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Wordmark from '../components/Wordmark';

/**
 * Platform-admin tool — the Mokshly team uses this to provision new
 * employers and update existing ones. Three views in one component:
 *   - list: every tenant on the platform with inline Connect toggle
 *   - new:  focused form to provision a new employer
 *   - edit: same form, pre-filled, saving via PATCH for an existing tenant
 */
type View =
  | { kind: 'list' }
  | { kind: 'new' }
  | { kind: 'edit'; tenant: Tenant };

export default function AdminEmployers() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>({ kind: 'list' });
  const [employers, setEmployers] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state for "new employer"
  const [form, setForm] = useState<ProvisionEmployerPayload>({
    organisation_name: '',
    contact_name: '',
    contact_email: '',
    employee_count_band: '51-200',
  });
  const [saving, setSaving] = useState(false);
  const [provisioned, setProvisioned] = useState<{ inviteUrl: string; sent: boolean; tenantName: string } | null>(null);

  useEffect(() => {
    document.title = 'Admin · Employers';
    return () => { document.title = 'YouSourceful · Mokshly'; };
  }, []);

  useEffect(() => {
    if (view.kind !== 'list') return;
    setLoading(true);
    setError('');
    listEmployers()
      .then(setEmployers)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load employers'))
      .finally(() => setLoading(false));
  }, [view]);

  function update<K extends keyof ProvisionEmployerPayload>(key: K, value: ProvisionEmployerPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    setProvisioned(null);
    try {
      // Strip empty strings so optional fields aren't sent as ""
      const payload: ProvisionEmployerPayload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '' && v !== undefined),
      ) as ProvisionEmployerPayload;
      const res = await provisionEmployer(payload);
      setProvisioned({
        inviteUrl: res.invite_url,
        sent: res.invite_sent,
        tenantName: res.tenant.display_name,
      });
      // Reset form
      setForm({
        organisation_name: '',
        contact_name: '',
        contact_email: '',
        employee_count_band: '51-200',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not provision the employer');
    } finally {
      setSaving(false);
    }
  }

  function signOut() {
    logout();
    navigate('/login', { replace: true });
  }

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
          <span className="mok-chip">Mokshly admin</span>
        </div>
        <div className="mok-row" style={{ gap: 8 }}>
          <button type="button" className="mok-btn mok-btn--ghost" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {/* ── Welcome + context ──────────────────────────── */}
      <section style={{ marginBottom: 24 }}>
        <p className="mok-eyebrow">{timeOfDayGreeting()}</p>
        <h1 className="mok-section-title">Welcome back.</h1>
        <p className="mok-section-lede">
          This is the Mokshly admin tool for setting up and overseeing
          employer organizations. From here you can provision a new employer,
          send their HR contact an invitation, and see the status of every org
          on the platform.
        </p>
        <p className="mok-muted" style={{ fontSize: 13, marginTop: 8, fontStyle: 'italic' }}>
          <strong>Actions you can take:</strong>{' '}
          (1) provision a new employer when a deal closes, (2) re-send an invite
          if needed by re-provisioning, (3) review the status of every org at a
          glance.
        </p>
      </section>

      <div className="mok-row" style={{ marginBottom: 24, gap: 10 }}>
        <button
          type="button"
          className={`mok-btn ${view.kind === 'list' ? 'mok-btn--primary' : ''}`}
          onClick={() => setView({ kind: 'list' })}
        >
          All employers ({employers.length})
        </button>
        <button
          type="button"
          className={`mok-btn ${view.kind === 'new' ? 'mok-btn--primary' : ''}`}
          onClick={() => { setView({ kind: 'new' }); setProvisioned(null); setError(''); }}
        >
          + Provision new employer
        </button>
      </div>

      {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

      {view.kind === 'list' && (
        <section>
          <p className="mok-section-h3">All employers</p>
          <p className="mok-muted" style={{ fontSize: 14, margin: '6px 0 20px', lineHeight: 1.55 }}>
            Status chips show where each org is in their lifecycle:{' '}
            <strong>invited</strong> (waiting for HR to accept their invitation),{' '}
            <strong>active</strong> (HR has signed in and completed onboarding),{' '}
            <strong>pending</strong> (set up but invite not yet sent).
          </p>

          {loading ? (
            <p className="mok-muted">Loading…</p>
          ) : employers.length === 0 ? (
            <div className="mok-card" style={{ borderLeft: '3px solid var(--accent)' }}>
              <p className="mok-eyebrow" style={{ margin: 0 }}>Nothing here yet</p>
              <p style={{ margin: '6px 0 10px' }}>
                No employers have been provisioned. When you're ready, set up
                your first one — it takes about a minute.
              </p>
              <button
                type="button"
                className="mok-btn mok-btn--primary"
                onClick={() => { setView({ kind: 'new' }); setProvisioned(null); setError(''); }}
              >
                Provision the first employer →
              </button>
            </div>
          ) : (
            <div className="mok-stack-sm">
              {employers.map((t) => (
                <EmployerRow
                  key={t.id}
                  tenant={t}
                  onEdit={() => { setView({ kind: 'edit', tenant: t }); setError(''); }}
                  onUpdate={(next) =>
                    setEmployers((prev) => prev.map((e) => (e.id === next.id ? next : e)))
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {view.kind === 'edit' && (
        <EditEmployerView
          tenant={view.tenant}
          onCancel={() => setView({ kind: 'list' })}
          onSaved={(updated) => {
            setEmployers((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
            setView({ kind: 'list' });
          }}
        />
      )}

      {view.kind === 'new' && (
        <section>
          <p className="mok-section-h3">Provision a new employer</p>
          <p className="mok-section-lede" style={{ marginBottom: 10, marginTop: 6 }}>
            Set up a new organization on the platform and invite their HR
            contact in one step.
          </p>
          <p className="mok-muted" style={{ fontSize: 13, margin: '0 0 24px', lineHeight: 1.55, fontStyle: 'italic' }}>
            <strong>What happens:</strong> the tenant is created with the
            details below, an invited HR-admin user is created (not yet
            active), and an invitation email is sent. If SMTP isn't configured
            in this environment, the invite link is shown after creation so you
            can copy it directly. Only Organization name, contact name, and
            contact email are required — everything else can be added later.
          </p>

          {provisioned && (
            <div
              className="mok-card"
              style={{ borderLeft: '3px solid var(--accent)', marginBottom: 24 }}
            >
              <p className="mok-eyebrow" style={{ margin: 0 }}>{provisioned.tenantName} created</p>
              <p style={{ margin: '4px 0 10px', fontSize: 14 }}>
                {provisioned.sent
                  ? 'Invitation email sent to the HR contact.'
                  : 'Email not sent (SMTP not configured in this environment). Share the link below directly.'}
              </p>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                  borderRadius: 6, fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
                  wordBreak: 'break-all',
                }}
              >
                <span style={{ flex: 1 }}>{provisioned.inviteUrl}</span>
                <button
                  type="button"
                  className="mok-btn"
                  style={{ padding: '4px 10px', minHeight: 0, fontSize: 12 }}
                  onClick={() => navigator.clipboard?.writeText(provisioned.inviteUrl)}
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleCreate} className="mok-card mok-card--padded" style={{ display: 'grid', gap: 16 }}>
            <FieldSection title="Organization">
              <Field label="Organization name" required>
                <input value={form.organisation_name} onChange={(e) => update('organisation_name', e.target.value)} required />
              </Field>
              <Field label="Website">
                <input type="url" value={form.website ?? ''} onChange={(e) => update('website', e.target.value)} placeholder="https://example.com" />
              </Field>
              <Field label="HQ — Street address">
                <input value={form.hq_street1 ?? ''} onChange={(e) => update('hq_street1', e.target.value)} placeholder="e.g. 123 Market Street" />
              </Field>
              <Field label="HQ — Street address, line 2">
                <input value={form.hq_street2 ?? ''} onChange={(e) => update('hq_street2', e.target.value)} placeholder="Suite, floor, building (optional)" />
              </Field>
              <Field label="HQ — City">
                <input value={form.hq_city ?? ''} onChange={(e) => update('hq_city', e.target.value)} placeholder="e.g. San Francisco" />
              </Field>
              <Field label="HQ — State / region">
                <input value={form.hq_state ?? ''} onChange={(e) => update('hq_state', e.target.value)} placeholder="e.g. California" />
              </Field>
              <Field label="HQ — Country">
                <input value={form.hq_country ?? ''} onChange={(e) => update('hq_country', e.target.value)} placeholder="e.g. United States" />
              </Field>
              <Field label="HQ — Postal / ZIP code">
                <input value={form.hq_postal_code ?? ''} onChange={(e) => update('hq_postal_code', e.target.value)} placeholder="e.g. 94103" />
              </Field>
              <Field label="Company notes (optional)">
                <textarea rows={2} value={form.company_data ?? ''} onChange={(e) => update('company_data', e.target.value)} placeholder="Industry, regions, anything useful for our team." />
              </Field>
              <Field label="Roughly how many people on their team?">
                <select value={form.employee_count_band ?? ''} onChange={(e) => update('employee_count_band', (e.target.value || undefined) as ProvisionEmployerPayload['employee_count_band'])}>
                  <option value="">(unspecified)</option>
                  <option value="1-50">1–50</option>
                  <option value="51-200">51–200</option>
                  <option value="201-1000">201–1,000</option>
                  <option value="1000+">1,000+</option>
                </select>
              </Field>
            </FieldSection>

            <FieldSection title="HR contact (will receive the invitation)">
              <Field label="Contact name" required>
                <input value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} required />
              </Field>
              <Field label="Contact email" required>
                <input type="email" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} required />
              </Field>
              <Field label="Contact phone">
                <input type="tel" value={form.contact_phone ?? ''} onChange={(e) => update('contact_phone', e.target.value)} />
              </Field>
            </FieldSection>

            <FieldSection title="Billing (optional)">
              <Field label="Billing contact name">
                <input value={form.billing_contact_name ?? ''} onChange={(e) => update('billing_contact_name', e.target.value)} />
              </Field>
              <Field label="Billing email">
                <input type="email" value={form.billing_email ?? ''} onChange={(e) => update('billing_email', e.target.value)} />
              </Field>
              <Field label="Billing phone">
                <input type="tel" value={form.billing_phone ?? ''} onChange={(e) => update('billing_phone', e.target.value)} />
              </Field>
              <Field label="Billing — Street address">
                <input value={form.billing_street1 ?? ''} onChange={(e) => update('billing_street1', e.target.value)} />
              </Field>
              <Field label="Billing — Street address, line 2">
                <input value={form.billing_street2 ?? ''} onChange={(e) => update('billing_street2', e.target.value)} placeholder="Suite, floor, building (optional)" />
              </Field>
              <Field label="Billing — City">
                <input value={form.billing_city ?? ''} onChange={(e) => update('billing_city', e.target.value)} />
              </Field>
              <Field label="Billing — State / region">
                <input value={form.billing_state ?? ''} onChange={(e) => update('billing_state', e.target.value)} />
              </Field>
              <Field label="Billing — Country">
                <input value={form.billing_country ?? ''} onChange={(e) => update('billing_country', e.target.value)} />
              </Field>
              <Field label="Billing — Postal / ZIP code">
                <input value={form.billing_postal_code ?? ''} onChange={(e) => update('billing_postal_code', e.target.value)} />
              </Field>
            </FieldSection>

            <FieldSection title="Internal notes (optional)">
              <Field label="Notes for our team">
                <textarea rows={3} value={form.notes ?? ''} onChange={(e) => update('notes', e.target.value)} placeholder="Anything relevant — rollout plan, sensitivities, dates, …" />
              </Field>
            </FieldSection>

            <div className="mok-row" style={{ justifyContent: 'flex-end', gap: 10 }}>
              <Link to="/admin/employers" className="mok-btn mok-btn--ghost" onClick={() => setView('list')}>Cancel</Link>
              <button type="submit" className="mok-btn mok-btn--primary" disabled={saving}>
                {saving ? 'Provisioning…' : 'Create employer & send invite →'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

/* ── Edit existing employer ───────────────────────────────────── */

interface EditState {
  display_name: string;
  website: string;
  hq_street1: string;
  hq_street2: string;
  hq_city: string;
  hq_state: string;
  hq_postal_code: string;
  hq_country: string;
  company_data: string;
  employee_count_band: '' | '1-50' | '51-200' | '201-1000' | '1000+';
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  ceo_name: string;
  hr_head_name: string;
  billing_contact_name: string;
  billing_email: string;
  billing_phone: string;
  billing_street1: string;
  billing_street2: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  billing_country: string;
  description: string;
}

function tenantToEdit(t: Tenant): EditState {
  return {
    display_name: t.display_name ?? '',
    website: t.website ?? '',
    hq_street1: t.hq_street1 ?? '',
    hq_street2: t.hq_street2 ?? '',
    hq_city: t.hq_city ?? '',
    hq_state: t.hq_state ?? '',
    hq_postal_code: t.hq_postal_code ?? '',
    hq_country: t.hq_country ?? '',
    company_data: t.company_data ?? '',
    employee_count_band: (t.employee_count_band as EditState['employee_count_band']) ?? '',
    contact_name: t.contact_name ?? '',
    contact_email: t.contact_email ?? '',
    contact_phone: t.contact_phone ?? '',
    ceo_name: t.ceo_name ?? '',
    hr_head_name: t.hr_head_name ?? '',
    billing_contact_name: t.billing_contact_name ?? '',
    billing_email: t.billing_email ?? '',
    billing_phone: t.billing_phone ?? '',
    billing_street1: t.billing_street1 ?? '',
    billing_street2: t.billing_street2 ?? '',
    billing_city: t.billing_city ?? '',
    billing_state: t.billing_state ?? '',
    billing_postal_code: t.billing_postal_code ?? '',
    billing_country: t.billing_country ?? '',
    description: t.description ?? '',
  };
}

function EditEmployerView({
  tenant,
  onCancel,
  onSaved,
}: {
  tenant: Tenant;
  onCancel: () => void;
  onSaved: (t: Tenant) => void;
}) {
  const [form, setForm] = useState<EditState>(() => tenantToEdit(tenant));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function up<K extends keyof EditState>(key: K, v: EditState[K]) {
    setForm((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Only send fields whose value differs from the loaded tenant. Empty
    // strings become null on the backend — that's intentional, so admins can
    // clear a field by emptying it.
    const patch: TenantUpdate = {};
    const orig = tenantToEdit(tenant);
    (Object.keys(form) as Array<keyof EditState>).forEach((k) => {
      if (form[k] !== orig[k]) {
        // Coerce '' to undefined? No — for nullable fields we want to allow
        // clearing. But PATCH schema treats omitted as no-change. So we send
        // empty string explicitly to clear.
        (patch as Record<string, unknown>)[k] = form[k] === '' ? null : form[k];
      }
    });

    if (Object.keys(patch).length === 0) {
      setError('No changes to save.');
      setSaving(false);
      return;
    }

    try {
      const updated = await updateEmployerAsAdmin(tenant.id, patch);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <p className="mok-section-h3">Editing {tenant.display_name}</p>
      <p className="mok-section-lede" style={{ marginBottom: 10, marginTop: 6 }}>
        Update what we have on file for this organization. The HR contact
        email and password are not editable from here — those affect the user
        account directly.
      </p>
      <p className="mok-muted" style={{ fontSize: 13, margin: '0 0 24px', lineHeight: 1.55, fontStyle: 'italic' }}>
        <strong>Tip:</strong> empty a field and save to clear it. Only changed
        fields are sent. The Connect feature toggle is on the list view —
        flipping it there cascades to every practitioner in this tenant.
      </p>

      {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

      <form onSubmit={handleSubmit} className="mok-card mok-card--padded" style={{ display: 'grid', gap: 16 }}>
        <FieldSection title="Organization">
          <Field label="Organization name" required>
            <input value={form.display_name} onChange={(e) => up('display_name', e.target.value)} required />
          </Field>
          <Field label="Website">
            <input type="url" value={form.website} onChange={(e) => up('website', e.target.value)} placeholder="https://example.com" />
          </Field>
          <Field label="HQ — Street address">
            <input value={form.hq_street1} onChange={(e) => up('hq_street1', e.target.value)} />
          </Field>
          <Field label="HQ — Street address, line 2">
            <input value={form.hq_street2} onChange={(e) => up('hq_street2', e.target.value)} />
          </Field>
          <Field label="HQ — City">
            <input value={form.hq_city} onChange={(e) => up('hq_city', e.target.value)} />
          </Field>
          <Field label="HQ — State / region">
            <input value={form.hq_state} onChange={(e) => up('hq_state', e.target.value)} />
          </Field>
          <Field label="HQ — Country">
            <input value={form.hq_country} onChange={(e) => up('hq_country', e.target.value)} />
          </Field>
          <Field label="HQ — Postal / ZIP code">
            <input value={form.hq_postal_code} onChange={(e) => up('hq_postal_code', e.target.value)} />
          </Field>
          <Field label="Company notes">
            <textarea rows={2} value={form.company_data} onChange={(e) => up('company_data', e.target.value)} />
          </Field>
          <Field label="Team size">
            <select value={form.employee_count_band} onChange={(e) => up('employee_count_band', e.target.value as EditState['employee_count_band'])}>
              <option value="">(unspecified)</option>
              <option value="1-50">1–50</option>
              <option value="51-200">51–200</option>
              <option value="201-1000">201–1,000</option>
              <option value="1000+">1,000+</option>
            </select>
          </Field>
        </FieldSection>

        <FieldSection title="Leadership & HR contact">
          <Field label="CEO name">
            <input value={form.ceo_name} onChange={(e) => up('ceo_name', e.target.value)} />
          </Field>
          <Field label="HR head name">
            <input value={form.hr_head_name} onChange={(e) => up('hr_head_name', e.target.value)} />
          </Field>
          <Field label="HR contact name (account holder)">
            <input value={form.contact_name} onChange={(e) => up('contact_name', e.target.value)} />
          </Field>
          <Field label="HR contact email">
            <input type="email" value={form.contact_email} onChange={(e) => up('contact_email', e.target.value)} disabled title="Email cannot be changed here — it ties to the user account." />
            <span className="mok-field-hint">Locked — tied to the HR user account.</span>
          </Field>
          <Field label="HR contact phone">
            <input type="tel" value={form.contact_phone} onChange={(e) => up('contact_phone', e.target.value)} />
          </Field>
        </FieldSection>

        <FieldSection title="Accounts team (billing)">
          <Field label="Accounts contact name">
            <input value={form.billing_contact_name} onChange={(e) => up('billing_contact_name', e.target.value)} />
          </Field>
          <Field label="Accounts email">
            <input type="email" value={form.billing_email} onChange={(e) => up('billing_email', e.target.value)} />
          </Field>
          <Field label="Accounts phone">
            <input type="tel" value={form.billing_phone} onChange={(e) => up('billing_phone', e.target.value)} />
          </Field>
          <Field label="Billing — Street address">
            <input value={form.billing_street1} onChange={(e) => up('billing_street1', e.target.value)} />
          </Field>
          <Field label="Billing — Street address, line 2">
            <input value={form.billing_street2} onChange={(e) => up('billing_street2', e.target.value)} />
          </Field>
          <Field label="Billing — City">
            <input value={form.billing_city} onChange={(e) => up('billing_city', e.target.value)} />
          </Field>
          <Field label="Billing — State / region">
            <input value={form.billing_state} onChange={(e) => up('billing_state', e.target.value)} />
          </Field>
          <Field label="Billing — Country">
            <input value={form.billing_country} onChange={(e) => up('billing_country', e.target.value)} />
          </Field>
          <Field label="Billing — Postal / ZIP code">
            <input value={form.billing_postal_code} onChange={(e) => up('billing_postal_code', e.target.value)} />
          </Field>
        </FieldSection>

        <FieldSection title="Internal notes">
          <Field label="Notes for our team">
            <textarea rows={3} value={form.description} onChange={(e) => up('description', e.target.value)} />
          </Field>
        </FieldSection>

        <div className="mok-row" style={{ justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="mok-btn mok-btn--ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="mok-btn mok-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes →'}
          </button>
        </div>
      </form>
    </section>
  );
}

/** A single row in the employer list with an inline "Connect: on/off"
 *  toggle. Flipping it calls the admin endpoint, which cascades to every
 *  member user of that tenant. */
function EmployerRow({
  tenant,
  onEdit,
  onUpdate,
}: {
  tenant: Tenant;
  onEdit: () => void;
  onUpdate: (t: Tenant) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function toggleCohort() {
    setSaving(true);
    setError('');
    try {
      const updated = await updateEmployerAsAdmin(tenant.id, {
        cohort_enabled: !tenant.cohort_enabled,
      });
      onUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update');
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="mok-card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 18 }}>
          {tenant.display_name}
        </h3>
        <p className="mok-muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
          {tenant.contact_name ?? '—'} · {tenant.contact_email ?? '—'}
          {tenant.contact_phone ? ` · ${tenant.contact_phone}` : ''}
        </p>
        {tenant.website && (
          <p className="mok-subtle" style={{ margin: '2px 0 0', fontSize: 12 }}>{tenant.website}</p>
        )}
        {error && (
          <p className="mok-banner mok-banner--error" style={{ marginTop: 8 }}>{error}</p>
        )}
      </div>
      <div className="mok-row" style={{ gap: 10, flexShrink: 0, alignItems: 'center' }}>
        <span className="mok-chip" style={{ textTransform: 'capitalize' }}>{tenant.status}</span>
        <button
          type="button"
          className={`mok-toggle ${tenant.cohort_enabled ? 'mok-toggle--on' : ''}`}
          onClick={toggleCohort}
          disabled={saving}
          aria-pressed={tenant.cohort_enabled}
          aria-label={tenant.cohort_enabled ? 'Turn Connect off for this tenant' : 'Turn Connect on for this tenant'}
          title="Connect feature — only Mokshly admin can flip this"
        >
          <span className="mok-toggle-knob" aria-hidden="true" />
          <span className="mok-toggle-label">
            {saving ? 'Saving…' : tenant.cohort_enabled ? 'Connect: on' : 'Connect: off'}
          </span>
        </button>
        <button
          type="button"
          className="mok-btn mok-btn--ghost"
          onClick={onEdit}
          aria-label={`Edit ${tenant.display_name}`}
        >
          Edit
        </button>
      </div>
    </article>
  );
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function FieldSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mok-eyebrow" style={{ margin: '0 0 12px' }}>{title}</p>
      <div style={{ display: 'grid', gap: 14 }}>{children}</div>
    </section>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="mok-field" style={{ margin: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>
        {label}
        {required && <span style={{ color: 'var(--accent)' }}> *</span>}
      </span>
      {children}
    </label>
  );
}
