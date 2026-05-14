import { useState } from 'react';
import { chatComplete } from '../api/client';
import type { ChatMessage } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

/**
 * Authenticated landing page. Shows the signed-in user and a minimal chat box
 * so you can verify the `/api/v1/chat/completions` integration end-to-end as
 * soon as an LLM API key is configured.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const next: ChatMessage[] = [...history, { role: 'user', content: input.trim() }];
    setHistory(next);
    setInput('');
    setSending(true);
    setError('');
    try {
      const res = await chatComplete(next);
      setHistory([...next, { role: 'assistant', content: res.content }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat request failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <section>
      <h1 style={{ margin: '0 0 8px' }}>Welcome, {user?.name ?? 'friend'}.</h1>
      <p className="muted">
        Signed in as <strong>{user?.email}</strong> ({user?.role}).
      </p>

      <div className="card" style={{ marginTop: 32 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Try the LLM</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          The dashboard sends messages to <code>/api/v1/chat/completions</code>,
          which routes to the model set by <code>MOK_DEFAULT_MODEL</code>.
        </p>

        <div
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 12,
            marginBottom: 12,
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {history.length === 0 ? (
            <p className="subtle" style={{ margin: 0 }}>
              No messages yet. Ask the model something below.
            </p>
          ) : (
            history.map((m, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div className="subtle" style={{ fontSize: 12 }}>{m.role}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
              </div>
            ))
          )}
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Ask anything…"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius)',
              fontSize: 14,
            }}
          />
          <button
            className="btn btn-primary"
            onClick={() => void sendMessage()}
            disabled={sending || !input.trim()}
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </section>
  );
}
