import { useState } from 'react';
import { ASANAS, AsanaArt } from '../AsanaArt';

type Section = null | 'asanas' | 'walking' | 'squats';

interface Props {
  onComplete: (note: string) => void;
}

/** Moving practice — pick a section (asanas / walking / squats), then play through. */
export default function MovingFlow({ onComplete }: Props) {
  const [section, setSection] = useState<Section>(null);
  const [step, setStep] = useState(0);

  if (!section) {
    return (
      <div className="mok-session-stage-inner">
        <p className="mok-session-eyebrow">Choose a section</p>
        <div className="mok-stack-sm" style={{ maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          {[
            { id: 'asanas' as const, label: 'Yoga Postures', art: 'mountain' as const,
              desc: 'Ten gentle postures, moved through with breath.' },
            { id: 'walking' as const, label: 'Walking', art: 'walking' as const,
              desc: 'A simple, natural movement you can return to anytime.' },
            { id: 'squats' as const, label: 'Squats', art: 'squat' as const,
              desc: 'A foundational movement the body understands instinctively.' },
          ].map((opt) => {
            const Art = AsanaArt[opt.art];
            return (
              <button
                key={opt.id}
                type="button"
                className="mok-choice"
                onClick={() => { setSection(opt.id); setStep(0); }}
                style={{ display: 'flex', alignItems: 'center', gap: 18 }}
              >
                <Art color="var(--text-inverse)" size={44} />
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 17 }}>{opt.label}</span>
                  <span style={{ fontSize: 13, opacity: 0.7, fontStyle: 'italic' }}>{opt.desc}</span>
                </span>
                <span style={{ opacity: 0.6 }}>→</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (section === 'asanas') {
    const asana = ASANAS[step];
    const Art = AsanaArt[asana.id];
    const isLast = step === ASANAS.length - 1;
    return (
      <div className="mok-session-stage-inner" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 24 }}>
          {ASANAS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 16 : 6,
                height: 4,
                borderRadius: 2,
                background: i <= step ? 'var(--text-inverse)' : 'var(--text-subtle)',
                opacity: i === step ? 1 : i < step ? 0.6 : 0.3,
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
        <p className="mok-session-eyebrow">Posture {asana.num} of {ASANAS.length}</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color: 'var(--text-inverse)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          {asana.name}
        </h2>
        <p className="mok-muted" style={{ fontSize: 13, letterSpacing: '0.04em', margin: '0 0 24px' }}>
          {asana.subtitle}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28, padding: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
          <Art color="var(--text-inverse)" size={140} />
        </div>
        <p className="mok-session-line" style={{ fontSize: 16, fontStyle: 'italic', maxWidth: 480, margin: '0 auto 28px' }}>
          "{asana.cue}"
        </p>
        <div className="mok-row" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            className="mok-session-btn"
            onClick={() => (step === 0 ? setSection(null) : setStep(step - 1))}
          >
            ← {step === 0 ? 'Back' : 'Previous'}
          </button>
          <button
            type="button"
            className="mok-session-btn mok-session-btn--accent"
            onClick={() => (isLast ? onComplete('Asana sequence complete') : setStep(step + 1))}
          >
            {isLast ? 'Complete' : 'Next pose →'}
          </button>
        </div>
      </div>
    );
  }

  // Walking / Squats — single guided card.
  const title = section === 'walking' ? 'Mindful Walking' : 'Squats';
  const cue =
    section === 'walking'
      ? 'Find a path. Aim for ten minutes. Walk at a pace that lets you breathe through the nose. Heel. Sole. Toes.'
      : 'Five to ten gentle squats. Knees track over the toes. Feet stay grounded. The chair behind you gives confidence — use it if you want.';
  const Art = section === 'walking' ? AsanaArt.walking : AsanaArt.squat;
  return (
    <div className="mok-session-stage-inner">
      <p className="mok-session-eyebrow">{title}</p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28, padding: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
        <Art color="var(--text-inverse)" size={140} />
      </div>
      <p className="mok-session-line" style={{ fontSize: 18, fontStyle: 'italic', maxWidth: 480, margin: '0 auto 28px' }}>
        "{cue}"
      </p>
      <div className="mok-row" style={{ justifyContent: 'center' }}>
        <button type="button" className="mok-session-btn" onClick={() => setSection(null)}>← Back</button>
        <button
          type="button"
          className="mok-session-btn mok-session-btn--accent"
          onClick={() => onComplete(`${title} complete`)}
        >
          Mark complete
        </button>
      </div>
    </div>
  );
}
