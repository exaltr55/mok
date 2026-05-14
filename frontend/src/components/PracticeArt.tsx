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
    <line x1="40" y1="30" x2="40" y2="50" />
    <path d="M 28 30 Q 22 40, 28 50" opacity={0.7} />
    <path d="M 52 30 Q 58 40, 52 50" opacity={0.7} />
    <path d="M 18 24 Q 8 40, 18 56" opacity={0.4} />
    <path d="M 62 24 Q 72 40, 62 56" opacity={0.4} />
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
    <circle cx="40" cy="18" r="5" />
    <line x1="40" y1="23" x2="40" y2="48" />
    <path d="M 40 32 L 28 40" />
    <path d="M 40 32 L 52 40" />
    <path d="M 40 48 L 32 66" />
    <path d="M 40 48 L 48 66" />
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

export const PRACTICE_COLORS: Record<PracticeKey, string> = {
  breathing: 'var(--sage)',
  thinking: 'var(--ochre)',
  talking: 'var(--rust)',
  writing: 'var(--ochre-deep)',
  moving: 'var(--sage)',
  resetting: 'var(--rust)',
  aligning: 'var(--ochre)',
};
