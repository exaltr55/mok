import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { submitContact } from '../api/client';
import {
  IconBuilding,
  IconMegaphone,
  IconMessage,
} from '../components/ContactIcon';

interface IconProps {
  size?: number;
  from: string;
  to: string;
  id: string;
}

interface ContactReason {
  Icon: FC<IconProps>;
  from: string;
  to: string;
  accent: 'cyan' | 'magenta' | 'mint-deep';
  surface: 'ocean' | 'magenta' | 'fresh';
  title: string;
  body: string;
}

const REASONS: ContactReason[] = [
  {
    Icon: IconMessage,
    from: 'cyan',
    to: 'indigo',
    accent: 'cyan',
    surface: 'ocean',
    title: 'General questions',
    body: 'How the program works, getting started, anything about your practice.',
  },
  {
    Icon: IconBuilding,
    from: 'mint-deep',
    to: 'cyan',
    accent: 'mint-deep',
    surface: 'fresh',
    title: 'For employers',
    body: 'Bringing YouSourceful to your team — rollout, pricing, anything HR.',
  },
  {
    Icon: IconMegaphone,
    from: 'magenta',
    to: 'coral',
    accent: 'magenta',
    surface: 'magenta',
    title: 'Press & partnerships',
    body: 'Media inquiries, research collaborations, or thoughtful introductions.',
  },
];

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setStatus('submitting');
    try {
      await submitContact({ name, email, subject, message });
      setStatus('sent');
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setStatus('idle');
    }
  }

  return (
    <section className="mok-contact mok-rise">
      {/* ── Hero ───────────────────────────────────────────── */}
      <header className="mok-contact-hero">
        <p className="mok-eyebrow">Contact</p>
        <h1 className="mok-section-title">
          We'd love to <span className="mok-gradient-text">hear from you</span>.
        </h1>
        <p className="mok-section-lede">
          Questions, ideas, feedback, or a warm hello — write directly, and a
          human on our team will read it and write back within a day.
        </p>
      </header>

      {/* ── Split layout: reasons on the left, form on the right ─── */}
      <div className="mok-contact-grid">
        {/* Reasons column */}
        <aside className="mok-contact-reasons">
          <p className="mok-section-h3">Why people reach out</p>
          <p className="mok-muted" style={{ fontSize: 13, margin: '6px 0 16px', fontStyle: 'italic' }}>
            Pick the one closest to your reason — it helps us route quickly.
          </p>
          <div className="mok-contact-reason-stack">
            {REASONS.map((r, i) => (
              <article
                key={r.title}
                className={`mok-contact-reason mok-surface-${r.surface} mok-card-rise`}
                style={{ ['--d' as string]: `${120 + i * 80}ms` }}
              >
                <span className={`mok-principle-icon mok-principle-icon--${r.accent}`}>
                  <r.Icon size={32} from={r.from} to={r.to} id={`reason-${i}`} />
                </span>
                <div>
                  <h3 className={`mok-contact-reason-title mok-text--${r.accent}`}>{r.title}</h3>
                  <p className="mok-contact-reason-body">{r.body}</p>
                </div>
              </article>
            ))}
          </div>

          <p className="mok-muted" style={{ fontSize: 13, margin: '20px 0 0', lineHeight: 1.55 }}>
            Replies usually within one business day. Everything you share stays
            with our small team.
          </p>
        </aside>

        {/* Form column */}
        <form
          onSubmit={handleSubmit}
          className="mok-card mok-card--padded mok-contact-form mok-card-rise"
          style={{ ['--d' as string]: '380ms' }}
        >
          <p className="mok-section-h3">Send us a note</p>
          <p className="mok-muted" style={{ fontSize: 13, margin: '6px 0 18px', fontStyle: 'italic' }}>
            A few lines is plenty. We'll take it from there.
          </p>

          {status === 'sent' && (
            <div className="mok-banner mok-banner--success" role="status">
              Your message is on its way. We'll be in touch within a day.
            </div>
          )}
          {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

          <div className="mok-field">
            <label htmlFor="contact-name">Your name</label>
            <input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>
          <div className="mok-field">
            <label htmlFor="contact-email">Email</label>
            <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="mok-field">
            <label htmlFor="contact-subject">Subject</label>
            <input id="contact-subject" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="A few words about what you'd like to discuss" />
          </div>
          <div className="mok-field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="Write as much or as little as feels right."
              style={{ minHeight: 180 }}
            />
          </div>

          <button
            type="submit"
            className="mok-btn mok-btn--gradient mok-btn--block mok-btn--lg"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? 'Sending…' : 'Send message →'}
          </button>
        </form>
      </div>
    </section>
  );
}
