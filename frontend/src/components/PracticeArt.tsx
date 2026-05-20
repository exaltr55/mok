/**
 * Stroke-based, line-art illustrations for the 7 Practices.
 *
 * Every illustration takes a `color` and `size` prop. They are symbolic, not
 * literal — concentric ripples for Breathing, waves with an observer dot for
 * Thinking, sound emanations for Talking, a page for Writing, a small figure
 * for Moving, an arrow-arc for Resetting, a compass for Aligning.
 *
 * Use them anywhere you would otherwise reach for a generic Lucide icon.
 */

import type { FC } from 'react';

interface ArtProps {
  color?: string;
  size?: number;
}

const stroke = (color: string, width = 1.4) => ({
  stroke: color,
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
});

const Breathing: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" {...stroke(color)}>
    <circle cx="40" cy="40" r="6" />
    <circle cx="40" cy="40" r="16" opacity={0.7} />
    <circle cx="40" cy="40" r="26" opacity={0.45} />
    <circle cx="40" cy="40" r="34" opacity={0.2} />
  </svg>
);

const Thinking: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" {...stroke(color)}>
    <path d="M 8 50 Q 18 38, 28 50 T 48 50 T 68 50" />
    <path d="M 8 58 Q 18 46, 28 58 T 48 58 T 68 58" opacity={0.5} />
    <circle cx="40" cy="22" r="3" />
    <line x1="40" y1="28" x2="40" y2="40" opacity={0.5} />
  </svg>
);

const Talking: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" {...stroke(color)}>
    <ellipse cx="40" cy="40" rx="10" ry="6" />
    <path d="M 26 30 Q 18 40, 26 50" opacity={0.75} />
    <path d="M 54 30 Q 62 40, 54 50" opacity={0.75} />
    <path d="M 18 22 Q 6 40, 18 58" opacity={0.45} />
    <path d="M 62 22 Q 74 40, 62 58" opacity={0.45} />
  </svg>
);

const Writing: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" {...stroke(color)}>
    <path d="M 18 14 L 18 66 L 62 66 L 62 22 L 54 14 Z" />
    <path d="M 54 14 L 54 22 L 62 22" opacity={0.6} />
    <line x1="26" y1="32" x2="54" y2="32" opacity={0.6} />
    <line x1="26" y1="40" x2="50" y2="40" opacity={0.6} />
    <line x1="26" y1="48" x2="46" y2="48" opacity={0.6} />
  </svg>
);

const Moving: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" {...stroke(color)}>
    <circle cx="40" cy="16" r="6" />
    <line x1="40" y1="22" x2="40" y2="50" />
    <path d="M 40 30 L 22 40" />
    <path d="M 40 30 L 58 40" />
    <path d="M 40 50 L 26 68" />
    <path d="M 40 50 L 54 68" />
    <line x1="14" y1="70" x2="66" y2="70" opacity={0.35} />
  </svg>
);

const Resetting: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" {...stroke(color)}>
    <path d="M 40 14 A 26 26 0 1 1 14 40" />
    <path d="M 14 40 L 8 36" />
    <path d="M 14 40 L 18 46" />
    <circle cx="40" cy="40" r="4" />
  </svg>
);

const Aligning: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" {...stroke(color)}>
    <circle cx="40" cy="40" r="3" />
    <line x1="40" y1="14" x2="40" y2="28" />
    <line x1="40" y1="52" x2="40" y2="66" />
    <line x1="14" y1="40" x2="28" y2="40" />
    <line x1="52" y1="40" x2="66" y2="40" />
    <circle cx="40" cy="40" r="22" opacity={0.3} />
  </svg>
);

export const PracticeArt = {
  breathing: Breathing,
  thinking: Thinking,
  talking: Talking,
  writing: Writing,
  moving: Moving,
  resetting: Resetting,
  aligning: Aligning,
} as const;

export type PracticeKey = keyof typeof PracticeArt;

/** Each practice's accent. These map to the `--practice-<key>` tokens
 *  declared in `styles/variables.css`, so they resolve in every theme. */
export const PRACTICE_COLORS: Record<PracticeKey, string> = {
  breathing: 'var(--practice-breathing)',
  thinking:  'var(--practice-thinking)',
  talking:   'var(--practice-talking)',
  writing:   'var(--practice-writing)',
  moving:    'var(--practice-moving)',
  resetting: 'var(--practice-resetting)',
  aligning:  'var(--practice-aligning)',
};
