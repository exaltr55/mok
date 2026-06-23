import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getCustomAffirmations,
  MAX_CUSTOM_AFFIRMATIONS,
  setCustomAffirmations,
} from '../utils/customAffirmations';
import { CORE_AFFIRMATIONS } from '../components/session/TalkingAccompaniment';

/**
 * Settings page for I M Talking — lets the practitioner add up to two
 * personal affirmations that join the seven core lines during the
 * practice. Reachable from a "Change affirmations" link on the session
 * arrival screen.
 */
export default function TalkingAffirmationsSettings() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get('return') || '/practices/talking/session';

  // Seed from localStorage so existing custom lines persist across visits.
  const [drafts, setDrafts] = useState<string[]>(() => {
    const saved = getCustomAffirmations();
    return [saved[0] ?? '', saved[1] ?? ''];
  });

  function updateDraft(i: number, v: string) {
    setDrafts((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  function saveAndReturn() {
    setCustomAffirmations(drafts);
    navigate(returnTo);
  }

  function clearAll() {
    setDrafts(['', '']);
    setCustomAffirmations([]);
  }

  const cleaned = drafts.map((d) => d.trim()).filter(Boolean);

  return (
    <section
      className="mok-rise"
      style={{ maxWidth: 640, margin: '0 auto', display: 'grid', gap: 24 }}
    >
      <header style={{ paddingTop: 8 }}>
        <Link to={returnTo} className="mok-nav-link">← Back</Link>
        <p className="mok-eyebrow" style={{ marginTop: 16 }}>I M Talking · Setting</p>
        <h1 className="mok-section-title">Your affirmations</h1>
      </header>

      {/* Commentary */}
      <article
        className="mok-card mok-card--padded"
        style={{ display: 'grid', gap: 14, fontSize: 16, lineHeight: 1.65 }}
      >
        <h2 className="mok-section-h3" style={{ margin: 0 }}>Make it yours</h2>
        <p>
          I M Talking ships with seven core affirmations — they cover
          health, abundance, gratitude, gifts, openness, attention, and
          choice. They're a strong baseline for most people.
        </p>
        <p>
          On top of those, you can add <strong>up to two of your own</strong>{' '}
          — words that already carry weight for you. They'll cycle right
          after the seven core lines, before the closing <em>I am.</em>
        </p>
        <p>
          Pick affirmations that meet what's <strong>actually present</strong>{' '}
          in your life right now — a chapter you're walking through, a quality
          you're growing into, a steadiness you want to strengthen. You can
          change them anytime as your season shifts.
        </p>
        <p>
          Keep them short. Present tense. Begin with <em>"I am"</em> if it
          feels right — the framing matters more than the exact words.
        </p>
      </article>

      {/* Situation-based suggestion picker — helps the user generate
          affirmations rooted in what they're going through. */}
      <SuggestionPicker
        onUse={(text) => {
          // Drop into the first empty slot, or replace slot 1 if both full.
          const target = drafts.findIndex((d) => !d.trim());
          const i = target === -1 ? 0 : target;
          updateDraft(i, text);
        }}
      />

      {/* The seven core — visible so the user knows what they're adding to */}
      <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 10 }}>
        <p className="mok-eyebrow" style={{ margin: 0 }}>The seven core</p>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
          {CORE_AFFIRMATIONS.map((a, i) => (
            <li
              key={i}
              style={{
                fontFamily: 'var(--font-editorial)',
                fontStyle: 'italic',
                fontSize: 15,
                lineHeight: 1.5,
                color: 'var(--text-muted)',
                whiteSpace: 'pre-line',
              }}
            >
              <span className="mok-subtle" style={{ fontSize: 11, marginRight: 8, fontStyle: 'normal' }}>
                {i + 1}.
              </span>
              {a.replace(/\n/g, ' ')}
            </li>
          ))}
        </ol>
      </article>

      {/* Two input slots for the user's own */}
      <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 14 }}>
        <p className="mok-section-h3" style={{ margin: 0 }}>
          Add your own <span className="mok-subtle" style={{ fontSize: 12, marginLeft: 6 }}>(up to {MAX_CUSTOM_AFFIRMATIONS})</span>
        </p>
        {drafts.map((draft, i) => (
          <div key={i} className="mok-field" style={{ display: 'grid', gap: 6 }}>
            <label htmlFor={`aff-${i}`} className="mok-eyebrow" style={{ margin: 0 }}>
              Affirmation {i + 1}
            </label>
            <textarea
              id={`aff-${i}`}
              value={draft}
              onChange={(e) => updateDraft(i, e.target.value)}
              placeholder={i === 0
                ? 'e.g. I am present for my family, with my whole heart.'
                : 'e.g. I am building something meaningful, one day at a time.'}
              maxLength={240}
              rows={2}
              style={{
                width: '100%',
                fontSize: 15,
                padding: '10px 12px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>
        ))}

        {cleaned.length > 0 && (
          <div style={{ display: 'grid', gap: 6, paddingTop: 4 }}>
            <p className="mok-eyebrow" style={{ margin: 0 }}>
              Preview · your additions
            </p>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
              {cleaned.map((line, i) => (
                <li
                  key={i}
                  style={{
                    fontFamily: 'var(--font-editorial)',
                    fontStyle: 'italic',
                    fontSize: 15,
                    color: 'var(--text)',
                    padding: '6px 10px',
                    borderLeft: '2px solid var(--accent)',
                    background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
                    borderRadius: 4,
                  }}
                >
                  <span className="mok-subtle" style={{ fontSize: 11, marginRight: 8, fontStyle: 'normal' }}>
                    {CORE_AFFIRMATIONS.length + i + 1}.
                  </span>
                  {line}
                </li>
              ))}
            </ol>
          </div>
        )}
      </article>

      <div
        className="mok-row"
        style={{ justifyContent: 'center', gap: 12, paddingBottom: 24, flexWrap: 'wrap' }}
      >
        <button type="button" className="mok-btn mok-btn--ghost" onClick={clearAll}>
          Clear additions
        </button>
        <button
          type="button"
          className="mok-btn mok-btn--primary mok-btn--lg"
          onClick={saveAndReturn}
        >
          Save — back to practice →
        </button>
      </div>
    </section>
  );
}

/* ── Suggestion picker — affirmations by life situation ─────────── */

interface Situation {
  id: string;
  label: string;
  blurb: string;
  affirmations: string[];
}

const SITUATIONS: Situation[] = [
  {
    id: 'grief',
    label: 'Grief & Loss',
    blurb: 'A separation, a goodbye, a chapter closing.',
    affirmations: [
      'I am moving through this loss at my own pace, with kindness for myself.',
      'I am carrying the love forward, even as I let go of what was.',
    ],
  },
  {
    id: 'burnout',
    label: 'Burnout & Recovery',
    blurb: 'Refilling the tank after running on empty.',
    affirmations: [
      'I am giving myself permission to rest, and to come back gently.',
      'I am restoring my energy, one quiet hour at a time.',
    ],
  },
  {
    id: 'self_worth',
    label: 'Self-worth',
    blurb: 'When you forget what you bring to the room.',
    affirmations: [
      'I am worthy of care and attention, just as I am right now.',
      'I am enough, today, without needing to prove it.',
    ],
  },
  {
    id: 'career',
    label: 'Career Change',
    blurb: 'A role shift, a pivot, or an unclear next step.',
    affirmations: [
      'I am open to what wants to unfold, and trusting that clarity will come.',
      'I am capable, and what is right for me is finding me.',
    ],
  },
  {
    id: 'anxiety',
    label: 'Anxiety & Overwhelm',
    blurb: 'When the mind is moving faster than the day.',
    affirmations: [
      'I am safe in this moment. The next will arrive in its time.',
      'I am bringing calm to what is, breath by breath.',
    ],
  },
  {
    id: 'health',
    label: 'Health Challenges',
    blurb: 'Walking through something the body is asking for attention on.',
    affirmations: [
      'I am tending my body with patience and trust.',
      'I am supporting my own recovery, in body and in mind.',
    ],
  },
  {
    id: 'relationships',
    label: 'Relationship Repair',
    blurb: 'A conversation that wants honesty.',
    affirmations: [
      'I am bringing honesty and care to the people who matter to me.',
      'I am learning to listen more deeply and speak more truly.',
    ],
  },
  {
    id: 'caregiving',
    label: 'Caregiving',
    blurb: "Holding others while remembering to hold yourself.",
    affirmations: [
      'I am caring for others by also caring for myself.',
      'I am allowed to put my own well-being on the list.',
    ],
  },
  {
    id: 'starting_over',
    label: 'Starting Over',
    blurb: 'A new chapter, a new city, a new beginning.',
    affirmations: [
      'I am beginning, and that is enough.',
      'I am open to what is unfolding, even when the path is not clear.',
    ],
  },
];

function SuggestionPicker({ onUse }: { onUse: (text: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = SITUATIONS.find((s) => s.id === openId);

  return (
    <article className="mok-card mok-card--padded" style={{ display: 'grid', gap: 14 }}>
      <div>
        <p className="mok-section-h3" style={{ margin: 0 }}>Need help finding the right words?</p>
        <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', margin: '6px 0 0' }}>
          Choose what feels closest to your season right now. We'll suggest a
          couple of affirmations you can use as a starting point — edit them
          freely once they're in.
        </p>
      </div>

      <div className="mok-row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {SITUATIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setOpenId((cur) => (cur === s.id ? null : s.id))}
            className={`mok-btn ${openId === s.id ? 'mok-btn--primary' : ''}`}
            style={{ fontSize: 13, padding: '6px 12px', minHeight: 0 }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {active && (
        <div
          className="mok-fade-in"
          style={{
            display: 'grid',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 8,
            background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
            borderLeft: '3px solid var(--accent)',
          }}
        >
          <div>
            <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500 }}>
              {active.label}
            </p>
            <p className="mok-muted" style={{ margin: '2px 0 0', fontSize: 13, fontStyle: 'italic' }}>
              {active.blurb}
            </p>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
            {active.affirmations.map((a, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: 'var(--bg-raised)',
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-editorial)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: 'var(--text)',
                  }}
                >
                  "{a}"
                </span>
                <button
                  type="button"
                  className="mok-btn"
                  onClick={() => onUse(a)}
                  style={{ fontSize: 12, padding: '4px 10px', minHeight: 0, flexShrink: 0 }}
                >
                  Use →
                </button>
              </li>
            ))}
          </ul>

          <p className="mok-muted" style={{ fontSize: 12, fontStyle: 'italic', margin: 0 }}>
            Tap <strong>Use →</strong> to drop one into your slots above — then
            tune the words to match your voice.
          </p>
        </div>
      )}
    </article>
  );
}
