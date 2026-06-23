import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ info });
    console.error('App crash:', error, info);
  }

  handleReset = (): void => {
    try {
      // Wipe both the legacy un-namespaced progress keys and any
      // user-scoped variants so a reset clears everything.
      const drop: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('mok.learn.progress.') || k.startsWith('mok.quiz.progress.'))) {
          drop.push(k);
        }
      }
      drop.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    this.setState({ error: null, info: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div
        style={{
          maxWidth: 720,
          margin: '40px auto',
          padding: '24px 20px',
          fontFamily: 'var(--font-sans), system-ui, sans-serif',
          color: 'var(--text, #1a1a1a)',
          background: 'var(--bg, #fff)',
        }}
      >
        <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>Something broke on this page.</h1>
        <p style={{ margin: '0 0 16px', color: 'var(--text-muted, #555)' }}>
          The app caught the error so you don't see a blank screen. Details below — share
          this with whoever is debugging, then click "Reset & reload".
        </p>
        <pre
          style={{
            background: 'var(--bg-raised, #f5f5f5)',
            border: '1px solid var(--border, #ddd)',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            lineHeight: 1.4,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
{this.state.error.name}: {this.state.error.message}
{this.state.error.stack ?? ''}
{this.state.info?.componentStack ?? ''}
        </pre>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent, #2563eb)',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reset & reload
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid var(--border, #ddd)',
              background: 'transparent',
              color: 'var(--text, #1a1a1a)',
              cursor: 'pointer',
            }}
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }
}
