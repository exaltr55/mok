import { useState } from 'react';

interface Props {
  onComplete: (note: string) => void;
}

interface ResetOption {
  id: string;
  title: string;
  duration: string;
  desc: string;
}

const OPTIONS: ResetOption[] = [
  {
    id: 'dietary-mini',
    title: 'Dietary mini-reset',
    duration: '3 hours, evening',
    desc: 'Finish dinner by 7pm. Water and herbal tea only until morning.',
  },
  {
    id: 'dietary-deep',
    title: 'Dietary deeper reset',
    duration: '20 hours, weekly',
    desc: 'Stop eating Friday evening. Break the reset Saturday afternoon.',
  },
  {
    id: 'digital-mini',
    title: 'Digital mini-reset',
    duration: '3 hours, evening',
    desc: 'Screens off from 7pm until sleep. Reading, walking, conversation.',
  },
  {
    id: 'digital-deep',
    title: 'Digital deeper reset',
    duration: '20 hours, weekly',
    desc: 'A longer pause from screens. Align with the dietary reset if you would like.',
  },
];

/** Resetting practice — pick a reset, set intention, commit. */
export default function ResettingFlow({ onComplete }: Props) {
  const [picked, setPicked] = useState<ResetOption | null>(null);
  const [committed, setCommitted] = useState(false);

  if (!picked) {
    return (
      <div className="mok-session-stage-inner">
        <p className="mok-session-eyebrow">Choose a reset</p>
        <p className="mok-muted" style={{ marginBottom: 24, fontSize: 15, fontStyle: 'italic' }}>
          Resetting is not deprivation. It is giving yourself a holiday from compulsion.
        </p>
        <div className="mok-stack-sm" style={{ maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="mok-choice"
              onClick={() => setPicked(opt)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{opt.title}</span>
                <span style={{ fontSize: 11, opacity: 0.7, fontFamily: 'var(--font-sans)', letterSpacing: '0.06em' }}>
                  {opt.duration}
                </span>
              </div>
              <p style={{ fontSize: 13, opacity: 0.7, fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!committed) {
    return (
      <div className="mok-session-stage-inner">
        <p className="mok-session-eyebrow">Setting an intention</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: '0 0 24px', color: 'var(--text-inverse)' }}>
          {picked.title}
        </h2>
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '20px 24px',
            borderRadius: 4,
            marginBottom: 28,
            textAlign: 'left',
          }}
        >
          <p className="mok-session-line" style={{ fontStyle: 'italic', margin: '0 0 12px' }}>
            "I am choosing freedom, not compulsion."
          </p>
          <p className="mok-muted" style={{ fontSize: 13, fontFamily: 'var(--font-sans)', margin: 0, lineHeight: 1.55 }}>
            When the urge arises, return here. The urge will pass within 10–15 minutes.
          </p>
        </div>
        <div className="mok-row" style={{ justifyContent: 'center' }}>
          <button type="button" className="mok-session-btn" onClick={() => setPicked(null)}>← Back</button>
          <button
            type="button"
            className="mok-session-btn mok-session-btn--accent"
            onClick={() => setCommitted(true)}
          >
            I'm ready →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mok-session-stage-inner">
      <p className="mok-session-eyebrow">Reset begun</p>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, color: 'var(--text-inverse)', margin: '0 0 16px' }}>
        Your {picked.title.toLowerCase()} is underway.
      </h2>
      <p className="mok-muted" style={{ fontSize: 15, fontStyle: 'italic', margin: '0 0 32px', lineHeight: 1.6 }}>
        Return to this screen at the end of your reset window to record how it went.
      </p>
      <button
        type="button"
        className="mok-session-btn mok-session-btn--accent"
        onClick={() => onComplete(picked.title)}
      >
        Log this practice
      </button>
    </div>
  );
}
