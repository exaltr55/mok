import { type ReactNode } from 'react';

/**
 * Tiny inline-label parser. Splits a string on ``*…*`` and wraps the
 * inside in a ``<span class="mok-ui-label">``. Use to lift a section
 * or tab name (e.g., ``Learn``) inside an otherwise plain string
 * returned from the backend or written into a content catalog, so the
 * reader sees it as a navigable surface rather than emphasis.
 *
 * Example::
 *
 *   renderEmphasis("YouSourceful *Learn*")
 *     → ["YouSourceful ", <span class="mok-ui-label">Learn</span>]
 *
 * Does not handle nested or unbalanced markers — anything that isn't a
 * complete ``*…*`` pair is returned verbatim.
 */
export function renderEmphasis(text: string): ReactNode {
  const parts = text.split(/\*([^*]+)\*/);
  if (parts.length === 1) return text;
  return parts.map((p, i) =>
    i % 2 === 1 ? <span key={i} className="mok-ui-label">{p}</span> : p
  );
}
