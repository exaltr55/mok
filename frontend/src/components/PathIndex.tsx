import { Link } from 'react-router-dom';

/**
 * A horizontal step index for sequential teaching paths.
 *
 * Used in two places:
 *   - On Learn module pages, to show position within the 5S framework.
 *   - On Practice Part 1 pages, to show position within the 7 Practices.
 *
 * Per-item status:
 *   - locked     — previous step not yet completed; not clickable.
 *   - available  — previous step is read; clickable to jump in.
 *   - current    — the step the user is on right now; not clickable.
 *   - completed  — the user has already finished this step; clickable to revisit.
 */

export type PathStatus = 'locked' | 'available' | 'current' | 'completed';

export interface PathItem {
  /** Short label shown on the pill (e.g., "Source", "Breathing"). */
  label: string;
  /** Where the pill links when clickable. Ignored when status is
   *  ``locked`` or ``current``. */
  href: string;
  status: PathStatus;
}

interface Props {
  items: PathItem[];
  /** Accessible name for the nav region (e.g. "The 5S framework"). */
  srLabel: string;
}

export default function PathIndex({ items, srLabel }: Props) {
  return (
    <nav className="mok-path-index" aria-label={srLabel}>
      <ol className="mok-path-index-list">
        {items.map((item, i) => {
          const num = i + 1;
          const className = `mok-path-index-item mok-path-index-item--${item.status}`;
          const content = (
            <>
              <span className="mok-path-index-num" aria-hidden="true">
                {item.status === 'completed' ? '✓' : item.status === 'locked' ? '·' : num}
              </span>
              <span className="mok-path-index-label">{item.label}</span>
            </>
          );

          // current + locked render as <span>, not clickable.
          if (item.status === 'current') {
            return (
              <li key={item.href} className={className} aria-current="step">
                {content}
              </li>
            );
          }
          if (item.status === 'locked') {
            return (
              <li key={item.href} className={className} aria-disabled="true">
                {content}
              </li>
            );
          }
          // available + completed link out.
          return (
            <li key={item.href} className={className}>
              <Link to={item.href} className="mok-path-index-link">
                {content}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


// ── Builders ─────────────────────────────────────────────────────────


/** The 5S learning path. Order matters — it drives the unlock chain. */
const FIVE_S: Array<{ slug: string; label: string }> = [
  { slug: 'source',  label: 'Source' },
  { slug: 'seed',    label: 'Seed' },
  { slug: 'soil',    label: 'Soil' },
  { slug: 'seasons', label: 'Season' },
  { slug: 'sowing',  label: 'Sowing' },
];

/** The 7 Practices in canonical sequence. */
const SEVEN_P: Array<{ key: string; label: string }> = [
  { key: 'breathing', label: 'Breathing' },
  { key: 'thinking',  label: 'Thinking' },
  { key: 'talking',   label: 'Talking' },
  { key: 'writing',   label: 'Writing' },
  { key: 'moving',    label: 'Moving' },
  { key: 'resetting', label: 'Resetting' },
  { key: 'aligning',  label: 'Aligning' },
];

function buildItems<T extends { label: string }>(
  steps: ReadonlyArray<T & { slug?: string; key?: string }>,
  currentKey: string,
  readSet: ReadonlySet<string>,
  hrefFor: (step: T) => string,
  idFor: (step: T) => string,
): PathItem[] {
  return steps.map((step, i) => {
    const id = idFor(step);
    const isCurrent = id === currentKey;
    const isCompleted = readSet.has(id);
    const previousReadOrCurrent =
      i === 0 || readSet.has(idFor(steps[i - 1])) || isCompleted || isCurrent;

    let status: PathStatus;
    if (isCurrent) status = 'current';
    else if (isCompleted) status = 'completed';
    else if (previousReadOrCurrent) status = 'available';
    else status = 'locked';

    return { label: step.label, href: hrefFor(step), status };
  });
}

/** Build a 5S path-index item list. ``currentSlug`` is the Learn module
 *  slug being viewed; ``readSlugs`` is the set returned by
 *  ``getReadModules()``. Returns items for the 5 framework modules in
 *  order (Source through Sowing). */
export function buildFiveSItems(
  currentSlug: string,
  readSlugs: ReadonlySet<string>,
): PathItem[] {
  return buildItems(
    FIVE_S,
    currentSlug,
    readSlugs,
    (s) => `/learn/${s.slug}`,
    (s) => s.slug,
  );
}

/** Build a 7-Practice path-index item list. ``currentKey`` is the
 *  practice slug being viewed; ``readKeys`` is the set returned by
 *  ``getReadPracticeLearn()``. The links land on each practice's
 *  Part 1 teaching page. */
export function buildSevenPItems(
  currentKey: string,
  readKeys: ReadonlySet<string>,
): PathItem[] {
  return buildItems(
    SEVEN_P,
    currentKey,
    readKeys,
    (p) => `/practices/${p.key}/learn`,
    (p) => p.key,
  );
}
