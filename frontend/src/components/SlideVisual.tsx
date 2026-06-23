/**
 * Inline illustrations for the Learn slideshows.
 *
 * Authors mark a stanza in the content as `[visual: key]` and the renderer
 * turns it into a centred illustration slide.
 *
 * The registry is intentionally **empty** today. Hand-rolled SVGs felt
 * amateur next to the seriousness of the content; we'd rather ship
 * clean text-only slides than under-finished illustrations. Bring back
 * visuals once we have one of:
 *
 *   - A bespoke illustration set from a designer in a consistent style.
 *   - A licensed minimalist illustration library (e.g., open-source
 *     editorial illustration packs vetted for tone).
 *   - High-craft inline SVG that matches the rest of the brand.
 *
 * Until then any `[visual: key]` markers in markdown are silently
 * dropped by the slide builder — they look up the key, find no
 * component registered, and skip the slide. Safe to add markers
 * speculatively; nothing will render.
 *
 *   Guiding rules for placement (when we re-add):
 *     1.  Use a visual only where the text describes a vivid image
 *         (waves in an ocean, a seed, a path) — not for abstract beats.
 *     2.  Cap total coverage at ~20 % of slides per module. Lower is
 *         better; 4-8 % is healthy.
 *     3.  Visuals are rest beats, not decoration. If the next text
 *         slide doesn't sit better because of the visual, drop it.
 */

import type { FC } from 'react';

interface Props {
  size?: number;
}

/** Registry — empty for now. See file header. */
export const SLIDE_VISUALS: Record<string, FC<Props>> = {};
