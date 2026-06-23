import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getProfile,
  listLearnModules,
  listPractices,
  type LearnModuleSummary,
  type PracticeSummary,
  type Profile,
} from '../api/client';
import { PracticeArt, PRACTICE_COLORS, type PracticeKey } from '../components/PracticeArt';
import {
  getReadModules,
  getReadPracticeDaily,
  getReadPracticeLearn,
} from '../utils/learnProgress';
import { renderEmphasis } from '../utils/inlineEmphasis';

/**
 * Learn — the conceptual foundation of YouSourceful.
 *
 * Two ordered parts, presented in the same order a new practitioner moves
 * through them: first the 5S Framework (Source → Seed → Soil → Seasons →
 * Sowing → bridge), then the 7 Practice teachings (Part A of each practice).
 *
 * The first unread 5S module is highlighted at the top as a clear "start
 * here" so practitioners coming from the tour know exactly where to begin.
 */
export default function Learn() {
  const [modules, setModules] = useState<LearnModuleSummary[]>([]);
  const [practices, setPractices] = useState<PracticeSummary[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listLearnModules(), listPractices(), getProfile().catch(() => null)])
      .then(([m, p, pr]) => {
        setModules([...m].sort((a, b) => a.order - b.order));
        setPractices(p);
        setProfile(pr);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mok-loading">Loading…</div>;

  // The 5S list shows only the five S modules themselves — welcome, the
  // bridge, and the 7-Practices intro all appear elsewhere or as
  // transition pieces.
  const fiveS = modules.filter(
    (m) => !['welcome', 'bridge', 'practices-intro'].includes(m.slug),
  );
  const firstName = profile?.name?.split(' ')[0];

  // Smart "Begin with" pointer. Walks the curriculum in order:
  //   1. Next unread Part 1 module (welcome → 5S → bridge)
  //   2. For each practice in order: Part 1 (what) → Part 2 (how)
  //   3. Once everything is read, the pointer hides.
  // Progress is tracked client-side in localStorage (utils/learnProgress).
  const readModules = getReadModules();
  const readPracticeLearn = getReadPracticeLearn();
  const readPracticeDaily = getReadPracticeDaily();

  const nextModule = modules.find((m) => !readModules.includes(m.slug));
  type Pointer = { eyebrow: string; title: string; subtitle: string; to: string };
  let nextPracticeStep: Pointer | null = null;
  if (!nextModule) {
    for (const p of practices) {
      if (!readPracticeLearn.includes(p.key)) {
        nextPracticeStep = {
          eyebrow: 'Continue — Part 2 of 2',
          title: `${p.name} — Learning the Practice`,
          subtitle: p.description,
          to: `/practices/${p.key}/learn`,
        };
        break;
      }
      if (!readPracticeDaily.includes(p.key)) {
        nextPracticeStep = {
          eyebrow: 'Continue — Part 2 of 2',
          title: `${p.name} — Doing the Practice`,
          subtitle: p.description,
          to: `/practices/${p.key}/daily`,
        };
        break;
      }
    }
  }
  const beginHere = nextModule
    ? {
        eyebrow: 'Begin with',
        title: nextModule.title,
        subtitle: nextModule.subtitle,
        to: `/learn/${nextModule.slug}`,
      }
    : nextPracticeStep;

  // Always show the full Learn structure (5S Framework + 7 Practices)
  // regardless of read state, so that a first-time learner arriving from
  // orientation sees the same landing page as a returning user clicking
  // the Learn tab. Access is still gated by `isModuleLocked` /
  // `isPracticeLocked` below — locked sections render but can't be
  // opened out of order. Keeps the two pathways into Learn visually
  // consistent.
  const readSet = new Set(readModules);
  const showFiveS = true;
  const showSevenP = true;
  void readSet; // (retained for future progressive surfaces)

  // First-time gate. While the learner is still walking the curriculum
  // for the first time, the only chapter they can open is the one
  // that comes next in canonical order (already-completed chapters
  // stay open for review). Once everything is complete, full freedom.
  const allModulesDone = !nextModule;
  const allPracticesDone =
    practices.every(
      (p) => readPracticeLearn.includes(p.key) && readPracticeDaily.includes(p.key),
    );
  const isFirstTimeLearner = !(allModulesDone && allPracticesDone);
  const nextModuleSlug = nextModule?.slug ?? null;

  function isModuleLocked(slug: string): boolean {
    if (!isFirstTimeLearner) return false;
    if (readSet.has(slug)) return false;
    return slug !== nextModuleSlug;
  }

  // For 7 Practices: find the next-in-sequence practice part to read.
  // We walk the same order the begin-here pointer uses.
  let nextPracticeKey: string | null = null;
  let nextPracticePart: 'learn' | 'daily' | null = null;
  for (const p of practices) {
    if (!readPracticeLearn.includes(p.key)) {
      nextPracticeKey = p.key; nextPracticePart = 'learn'; break;
    }
    if (!readPracticeDaily.includes(p.key)) {
      nextPracticeKey = p.key; nextPracticePart = 'daily'; break;
    }
  }
  function isPracticeLocked(key: string, part: 'learn' | 'daily'): boolean {
    if (!isFirstTimeLearner) return false;
    if (part === 'learn' && readPracticeLearn.includes(key)) return false;
    if (part === 'daily' && readPracticeDaily.includes(key)) return false;
    return !(nextPracticeKey === key && nextPracticePart === part);
  }

  return (
    <section className="mok-rise" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Hero */}
      <header style={{ padding: '32px 0 0' }}>
        <p className="mok-eyebrow">Learn</p>
        <h1 className="mok-section-title">Start here{firstName ? `, ${firstName}` : ''}.</h1>
        <p className="mok-section-lede">
          Two short parts, in order. Start with the 5S Framework — five quick
          modules about how our life experiences take shape. Then move into
          the 7 Practices — short daily exercises that put it into action.
        </p>
      </header>

      {/* Begin-here pointer */}
      {beginHere && (
        <article
          className="mok-card"
          style={{
            borderLeft: '3px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <p className="mok-eyebrow" style={{ margin: 0 }}>
              {beginHere.eyebrow}
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 400,
                margin: '6px 0 4px',
                letterSpacing: '-0.005em',
              }}
            >
              {beginHere.title}
            </h2>
            <p className="mok-muted" style={{ fontSize: 14, fontStyle: 'italic', margin: 0 }}>
              {beginHere.subtitle}
            </p>
          </div>
          <Link to={beginHere.to} className="mok-btn mok-btn--primary">
            Begin here →
          </Link>
        </article>
      )}

      {/* Part 1 — 5S Framework */}
      {showFiveS && (
      <section>
        <div
          className="mok-row"
          style={{ alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}
        >
          <div>
            <p className="mok-eyebrow" style={{ margin: 0 }}>
              Part 1 of 2
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                fontWeight: 400,
                margin: '6px 0 0',
                letterSpacing: '-0.005em',
              }}
            >
              The 5S Framework
            </h2>
          </div>
          <span className="mok-subtle" style={{ fontSize: 12, fontFamily: 'var(--font-sans)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {fiveS.length} modules
          </span>
        </div>

        <div className="mok-stack-sm">
          {fiveS.map((m) => {
            const locked = isModuleLocked(m.slug);
            const completed = readSet.has(m.slug);
            const body = (
              <>
                <span style={{ flex: 1 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-display)',
                      fontSize: 17,
                      fontWeight: 500,
                      letterSpacing: '-0.005em',
                      color: 'var(--text)',
                    }}
                  >
                    {renderEmphasis(m.title)}
                  </span>
                  <span className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic' }}>
                    {m.subtitle}
                  </span>
                </span>
                <span
                  className="mok-subtle"
                  style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}
                >
                  {locked ? 'Locked' : completed ? '✓ Read' : '›'}
                </span>
              </>
            );
            if (locked) {
              return (
                <div
                  key={m.slug}
                  className="mok-learn-row"
                  style={{ opacity: 0.45, cursor: 'not-allowed' }}
                  aria-disabled="true"
                >
                  {body}
                </div>
              );
            }
            return (
              <Link key={m.slug} to={`/learn/${m.slug}`} className="mok-learn-row">
                {body}
              </Link>
            );
          })}
        </div>
      </section>
      )}

      {/* Part 2 — 7 Practice teachings */}
      {showSevenP && (
      <section>
        <div
          className="mok-row"
          style={{ alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}
        >
          <div>
            <p className="mok-eyebrow" style={{ margin: 0 }}>
              Part 2 of 2
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                fontWeight: 400,
                margin: '6px 0 0',
                letterSpacing: '-0.005em',
              }}
            >
              The 7 Practices
            </h2>
          </div>
          <span className="mok-subtle" style={{ fontSize: 12, fontFamily: 'var(--font-sans)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {practices.length} practices
          </span>
        </div>

        <p className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic', margin: '0 0 12px' }}>
          Each practice has two short readings — first the what, then the how.
          After reading both, the guided session opens.
        </p>

        <div className="mok-stack-sm">
          {practices.map((p, i) => {
            const key = p.key as PracticeKey;
            const Art = PracticeArt[key];
            const color = PRACTICE_COLORS[key];
            return (
              <article key={p.key} className="mok-learn-practice">
                <header className="mok-learn-practice-head">
                  <Art color={color} size={32} />
                  <div className="mok-learn-practice-headtext">
                    <span className="mok-learn-practice-title-row">
                      <span className="mok-learn-num">P{String(i + 1).padStart(2, '0')}</span>
                      <span className="mok-learn-practice-name">{p.name}</span>
                    </span>
                    <span className="mok-muted" style={{ fontSize: 13, fontStyle: 'italic' }}>
                      {p.description}
                    </span>
                  </div>
                </header>
                <div className="mok-learn-practice-parts">
                  {(() => {
                    const aLocked = isPracticeLocked(p.key, 'learn');
                    const aDone = readPracticeLearn.includes(p.key);
                    const bLocked = isPracticeLocked(p.key, 'daily');
                    const bDone = readPracticeDaily.includes(p.key);
                    return (
                      <>
                        {aLocked ? (
                          <div
                            className="mok-learn-practice-part"
                            style={{ opacity: 0.45, cursor: 'not-allowed' }}
                            aria-disabled="true"
                          >
                            <span className="mok-eyebrow">Part A — What</span>
                            <span className="mok-learn-practice-part-title">Learning the Practice</span>
                            <span className="mok-subtle">Locked</span>
                          </div>
                        ) : (
                          <Link
                            to={`/practices/${p.key}/learn`}
                            className="mok-learn-practice-part"
                          >
                            <span className="mok-eyebrow">Part A — What</span>
                            <span className="mok-learn-practice-part-title">Learning the Practice</span>
                            <span className="mok-subtle">{aDone ? '✓ Read' : 'Read ›'}</span>
                          </Link>
                        )}
                        {bLocked ? (
                          <div
                            className="mok-learn-practice-part"
                            style={{ opacity: 0.45, cursor: 'not-allowed' }}
                            aria-disabled="true"
                          >
                            <span className="mok-eyebrow">Part B — How</span>
                            <span className="mok-learn-practice-part-title">Doing the Practice</span>
                            <span className="mok-subtle">Locked</span>
                          </div>
                        ) : (
                          <Link
                            to={`/practices/${p.key}/daily`}
                            className="mok-learn-practice-part"
                          >
                            <span className="mok-eyebrow">Part B — How</span>
                            <span className="mok-learn-practice-part-title">Doing the Practice</span>
                            <span className="mok-subtle">{bDone ? '✓ Read' : 'Read ›'}</span>
                          </Link>
                        )}
                      </>
                    );
                  })()}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      )}
    </section>
  );
}
