import { useEffect, useRef, useState } from 'react';
import { createJournal, type JournalStyle } from '../../api/client';

type StylePick = 'Expressive' | 'Reflective' | 'Gratitude';
const HINT: Record<StylePick, string> = {
  Expressive: 'Whatever wants to come out.',
  Reflective: 'Something from today, looked at with care.',
  Gratitude: 'Three things, however small.',
};
const PLACEHOLDER: Record<StylePick, string> = {
  Expressive: 'Begin where you are…',
  Reflective: 'Something from today…',
  Gratitude: 'Three things, however small…',
};

interface Props {
  onComplete: () => void;
  onError: (msg: string) => void;
}

/** Writing practice — style picker, then a textarea, then save journal entry. */
export default function WritingFlow({ onComplete, onError }: Props) {
  const [style, setStyle] = useState<StylePick>('Reflective');
  const [body, setBody] = useState('');
  const [chosen, setChosen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chosen) ta.current?.focus();
  }, [chosen]);

  async function save() {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await createJournal(style.toLowerCase() as JournalStyle, body.trim());
      onComplete();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save journal');
      setSaving(false);
    }
  }

  if (!chosen) {
    return (
      <div className="mok-session-stage-inner">
        <p className="mok-session-eyebrow">Choose a style</p>
        <div className="mok-stack-sm" style={{ margin: '0 auto 28px', maxWidth: 420, textAlign: 'left' }}>
          {(['Expressive', 'Reflective', 'Gratitude'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`mok-choice ${style === s ? 'mok-choice--active' : ''}`}
              onClick={() => setStyle(s)}
            >
              <div style={{ fontWeight: 500 }}>{s}</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4, fontStyle: 'italic' }}>{HINT[s]}</div>
            </button>
          ))}
        </div>
        <button type="button" className="mok-session-btn mok-session-btn--accent" onClick={() => setChosen(true)}>
          Continue →
        </button>
      </div>
    );
  }

  return (
    <div className="mok-session-stage-inner" style={{ textAlign: 'left' }}>
      <p className="mok-session-eyebrow">{style}</p>
      <textarea
        ref={ta}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={PLACEHOLDER[style]}
        rows={10}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--text-subtle)',
          padding: '12px 0',
          fontSize: 18,
          color: 'var(--text-inverse)',
          fontFamily: 'var(--font-serif)',
          lineHeight: 1.6,
          resize: 'none',
          outline: 'none',
        }}
      />
      <div className="mok-row" style={{ marginTop: 18, justifyContent: 'space-between' }}>
        <span className="mok-muted" style={{ fontSize: 12 }}>
          {body.length} characters
        </span>
        <button
          type="button"
          className="mok-session-btn mok-session-btn--accent"
          onClick={save}
          disabled={!body.trim() || saving}
        >
          {saving ? 'Saving…' : 'Save entry'}
        </button>
      </div>
    </div>
  );
}
