import { useState } from 'react';
import type { FormEvent } from 'react';
import { submitContact } from '../api/client';

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
    <section style={{ maxWidth: 560 }}>
      <p className="mok-hero-eyebrow">Contact</p>
      <h1 className="mok-section-title">Drop us a note.</h1>
      <p className="mok-section-lede">
        Questions, partnership ideas, or feedback — write directly.
      </p>

      <form onSubmit={handleSubmit} className="mok-card">
        {status === 'sent' && (
          <div className="mok-banner mok-banner--success" role="status">
            Your message is on its way. We'll be in touch soon.
          </div>
        )}
        {error && <div className="mok-banner mok-banner--error" role="alert">{error}</div>}

        <div className="mok-field">
          <label htmlFor="contact-name">Your name</label>
          <input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mok-field">
          <label htmlFor="contact-email">Email</label>
          <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mok-field">
          <label htmlFor="contact-subject">Subject</label>
          <input id="contact-subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div className="mok-field">
          <label htmlFor="contact-message">Message</label>
          <textarea id="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} required />
        </div>

        <button type="submit" className="mok-btn mok-btn--primary mok-btn--block" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </section>
  );
}
