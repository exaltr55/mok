import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { askCompanion } from '../api/client';

/**
 * Your Companion — a quiet, supportive presence that can answer
 * questions, guide you through practices, and gently nudge when
 * needed. Backed by a two-layer pipeline: a curated Q&A library
 * (zero tokens) and a Claude fallback for anything not in the
 * library. Daily LLM cap enforced server-side.
 *
 * The page accepts a ?topic= query param so contextual entry points
 * (from practice arrival screens, learn modules, journal, etc.) can
 * open the Companion with a starting prompt already framed.
 */

interface Message {
  role: 'user' | 'companion';
  body: string;
}

export default function Companion() {
  const [params] = useSearchParams();
  const initialTopic = params.get('topic') || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState(initialTopic);
  const [sending, setSending] = useState(false);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: 'user', body: text }]);
    setDraft('');
    setSending(true);
    try {
      const reply = await askCompanion(text);
      setMessages((m) => [
        ...m,
        { role: 'companion', body: reply.answer },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Buddy is unavailable right now.';
      setMessages((m) => [
        ...m,
        { role: 'companion', body: msg },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      className="mok-rise"
      style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      <header style={{ padding: '32px 0 8px' }}>
        <p className="mok-eyebrow">Buddy</p>
        <h1 className="mok-section-title">Here whenever you need a hand.</h1>
        <p className="mok-section-lede">
          Ask about a practice, talk through what's coming up, or simply
          check in. Your Buddy walks with you — quietly, on your terms.
        </p>
      </header>

      {/* Conversation */}
      <article
        className="mok-card mok-card--padded"
        style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 320 }}
      >
        {messages.length === 0 ? (
          <p className="mok-muted" style={{ fontStyle: 'italic', textAlign: 'center', padding: '40px 12px' }}>
            Start with anything on your mind.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 14,
                    background:
                      m.role === 'user' ? 'var(--surface-raised)' : 'var(--bg-raised)',
                    border: m.role === 'companion' ? '1px solid var(--border)' : 'none',
                    fontSize: 15,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.body}
                </div>
              </div>
            ))}
            {sending && (
              <p className="mok-muted" style={{ fontStyle: 'italic', fontSize: 13 }}>
                Buddy is thinking…
              </p>
            )}
          </div>
        )}
      </article>

      {/* Input */}
      <div className="mok-row" style={{ gap: 8 }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type a question, or share what's on your mind…"
          maxLength={4000}
          style={{
            flex: 1,
            minHeight: 64,
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            padding: '10px 12px',
            resize: 'vertical',
          }}
        />
        <button
          type="button"
          className="mok-btn mok-btn--primary"
          onClick={send}
          disabled={!draft.trim() || sending}
        >
          {sending ? '…' : 'Send'}
        </button>
      </div>
      <p className="mok-muted" style={{ fontSize: 12, fontStyle: 'italic', textAlign: 'center' }}>
        Press ⌘/Ctrl + Enter to send.
      </p>
    </section>
  );
}
