import { useEffect, useState } from 'react';
import { getProfile, updateProfile, type Profile } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const { refresh } = useAuth();
  const { theme, setTheme, options } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mok-loading">Loading…</div>;
  if (!profile) return <div className="mok-banner mok-banner--error">{error}</div>;

  async function save(patch: Partial<Profile>) {
    if (!profile) return;
    setSaving(true);
    setError('');
    try {
      const next = await updateProfile(patch);
      setProfile(next);
      await refresh();
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ display: 'grid', gap: 24, maxWidth: 720 }}>
      {/* ── Page header ──────────────────────────────────── */}
      <header>
        <p className="mok-eyebrow">Preferences</p>
        <h1 className="mok-section-title">Your settings.</h1>
        <p className="mok-section-lede">
          The details that shape how the app meets you each day. Changes save
          as you make them.
        </p>
      </header>

      {status === 'saved' && <div className="mok-banner mok-banner--success">Saved.</div>}
      {error && <div className="mok-banner mok-banner--error">{error}</div>}

      <article className="mok-card">
        <p className="mok-section-h3">Identity</p>
        <div className="mok-field">
          <label>Name</label>
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            onBlur={() => save({ name: profile.name })}
          />
        </div>
        <div className="mok-field" style={{ marginBottom: 0 }}>
          <label>Email</label>
          <input value={profile.email} readOnly />
        </div>
      </article>

      <article className="mok-card">
        <p className="mok-section-h3">Your intention</p>
        <div className="mok-field" style={{ marginBottom: 0 }}>
          <label>What brings you here?</label>
          <textarea
            value={profile.intention ?? ''}
            onChange={(e) => setProfile({ ...profile, intention: e.target.value })}
            onBlur={() => save({ intention: profile.intention })}
            placeholder="A sentence is enough."
            maxLength={400}
          />
        </div>
      </article>

      <article className="mok-card">
        <p className="mok-section-h3">Practice cadence</p>
        <div className="mok-field">
          <label>Time of day</label>
          <select
            value={profile.preferred_time_of_day}
            onChange={(e) => save({ preferred_time_of_day: e.target.value })}
            disabled={saving}
          >
            <option value="morning">Morning</option>
            <option value="midday">Midday</option>
            <option value="evening">Evening</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
        <div className="mok-field" style={{ marginBottom: 0 }}>
          <label>Days per week</label>
          <input
            type="range"
            min={1}
            max={7}
            value={profile.preferred_days_per_week}
            onChange={(e) => setProfile({ ...profile, preferred_days_per_week: Number(e.target.value) })}
            onMouseUp={() => save({ preferred_days_per_week: profile.preferred_days_per_week })}
            onTouchEnd={() => save({ preferred_days_per_week: profile.preferred_days_per_week })}
            style={{ accentColor: 'var(--accent)' }}
          />
          <span className="mok-field-hint">Aiming for {profile.preferred_days_per_week} day{profile.preferred_days_per_week === 1 ? '' : 's'} a week.</span>
        </div>
      </article>

      <article className="mok-card">
        <p className="mok-section-h3">Phase</p>
        <p className="mok-muted" style={{ fontSize: 14, margin: '6px 0 14px' }}>
          The app adapts gently to your phase. You can shift it here at any time.
        </p>
        <div className="mok-row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {(['arriving', 'steadying', 'integrating', 'living'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`mok-btn ${profile.phase === p ? 'mok-btn--primary' : ''}`}
              onClick={() => save({ phase: p })}
              disabled={saving}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </article>

      <article className="mok-card">
        <p className="mok-section-h3">Theme</p>
        <p className="mok-muted" style={{ fontSize: 14, margin: '6px 0 14px' }}>
          A different palette for a different mood. Every theme stays within
          the brand family.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
            marginTop: 8,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`mok-choice ${theme === opt.id ? 'mok-choice--active' : ''}`}
              onClick={() => {
                setTheme(opt.id);
                save({ theme: opt.id });
              }}
              style={{ padding: '12px 14px' }}
            >
              <div style={{ fontWeight: 500, fontSize: 14 }}>{opt.label}</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2, fontStyle: 'italic' }}>
                {opt.hint}
              </div>
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}
