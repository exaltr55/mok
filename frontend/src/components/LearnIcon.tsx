/**
 * Five themed emblems — one per S in the 5S Framework. Rendered at the
 * top of each Learn module's slideshow so each chapter carries its own
 * visual identity. Same family DNA as the other icon sets (64×64 viewBox,
 * round caps, two-stop gradient).
 */

import type { FC } from 'react';

interface Props {
  size?: number;
  from: string;
  to: string;
  id: string;
}

function gradient(from: string, to: string, id: string) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   style={{ stopColor: `var(--${from})` }} />
      <stop offset="100%" style={{ stopColor: `var(--${to})` }} />
    </linearGradient>
  );
}

/** S1 · Source — ever-present awareness, concentric ripples around a still core. */
export const IconSource: FC<Props> = ({ size = 56, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    <circle cx="32" cy="32" r="28" stroke={`url(#${id})`} strokeWidth="1.3" opacity="0.18" />
    <circle cx="32" cy="32" r="22" stroke={`url(#${id})`} strokeWidth="1.4" opacity="0.36" />
    <circle cx="32" cy="32" r="16" stroke={`url(#${id})`} strokeWidth="1.6" opacity="0.56" />
    <circle cx="32" cy="32" r="10" stroke={`url(#${id})`} strokeWidth="1.8" opacity="0.80" />
    <circle cx="32" cy="32" r="4"  fill={`url(#${id})`} />
  </svg>
);

/** S2 · Seed — a teardrop seed with a tiny first sprout. */
export const IconSeed: FC<Props> = ({ size = 56, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    {/* The seed body — a soft teardrop. */}
    <path
      d="M 32 18 C 22 24, 18 34, 24 44 C 30 52, 38 52, 42 46 C 48 38, 46 26, 32 18 Z"
      fill={`url(#${id})`}
      opacity="0.88"
    />
    {/* Sprout — a thin stem with two tiny leaves. */}
    <path
      d="M 32 18 Q 32 12, 32 8"
      stroke={`url(#${id})`}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M 32 12 Q 28 10, 25 11"
      stroke={`url(#${id})`}
      strokeWidth="1.6"
      strokeLinecap="round"
      opacity="0.85"
    />
    <path
      d="M 32 14 Q 36 12, 39 13"
      stroke={`url(#${id})`}
      strokeWidth="1.6"
      strokeLinecap="round"
      opacity="0.85"
    />
  </svg>
);

/** S3 · Soil — horizontal earth strata with a small embedded seed. */
export const IconSoil: FC<Props> = ({ size = 56, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    {/* Four layered strata. */}
    <path d="M 8 20 Q 32 14, 56 20" stroke={`url(#${id})`} strokeWidth="1.6" strokeLinecap="round" opacity="0.20" />
    <path d="M 6 30 Q 32 24, 58 30" stroke={`url(#${id})`} strokeWidth="2"   strokeLinecap="round" opacity="0.40" />
    <path d="M 6 40 Q 32 34, 58 40" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" opacity="0.65" />
    <path d="M 6 50 Q 32 46, 58 50" stroke={`url(#${id})`} strokeWidth="2.4" strokeLinecap="round" opacity="0.92" />
    {/* Seed nestled in the middle layer. */}
    <ellipse cx="32" cy="38" rx="4" ry="6" fill={`url(#${id})`} />
    {/* A tiny sprout reaching toward light. */}
    <path
      d="M 32 32 Q 32 26, 32 22"
      stroke={`url(#${id})`}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/** S4 · Seasons — a circle divided into four quadrants suggesting the wheel. */
export const IconSeasons: FC<Props> = ({ size = 56, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    {/* Outer circle. */}
    <circle cx="32" cy="32" r="22" stroke={`url(#${id})`} strokeWidth="1.6" opacity="0.45" />
    {/* Four quadrant arcs, each a different shade of opacity to suggest cycle. */}
    <path d="M 32 10 A 22 22 0 0 1 54 32" fill={`url(#${id})`} opacity="0.85" />
    <path d="M 54 32 A 22 22 0 0 1 32 54" fill={`url(#${id})`} opacity="0.60" />
    <path d="M 32 54 A 22 22 0 0 1 10 32" fill={`url(#${id})`} opacity="0.38" />
    <path d="M 10 32 A 22 22 0 0 1 32 10" fill={`url(#${id})`} opacity="0.20" />
    {/* Center point. */}
    <circle cx="32" cy="32" r="3" fill="#FFFFFF" opacity="0.92" />
  </svg>
);

/** S5 · Sowing — a hand arcing out, three seeds in flight, ground beneath. */
export const IconSowing: FC<Props> = ({ size = 56, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    {/* Ground line. */}
    <path d="M 8 54 L 56 54" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" opacity="0.35" />
    {/* Sowing arc — a curve that suggests the throw of seeds. */}
    <path
      d="M 12 38 Q 24 18, 50 16"
      stroke={`url(#${id})`}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      opacity="0.55"
    />
    {/* Three seeds along the arc. */}
    <circle cx="20" cy="28" r="3"   fill={`url(#${id})`} />
    <circle cx="32" cy="22" r="3.4" fill={`url(#${id})`} />
    <circle cx="44" cy="18" r="2.6" fill={`url(#${id})`} opacity="0.85" />
    {/* Two seeds resting on the ground — already sown. */}
    <circle cx="20" cy="50" r="2.4" fill={`url(#${id})`} opacity="0.75" />
    <circle cx="42" cy="50" r="2.4" fill={`url(#${id})`} opacity="0.75" />
  </svg>
);

/** Resolve a learn module slug → its emblem + theme. */
export const LEARN_ICONS = {
  source:   { Icon: IconSource,  from: 'cyan',      to: 'indigo'  },
  seed:     { Icon: IconSeed,    from: 'mint-deep', to: 'cyan'    },
  soil:     { Icon: IconSoil,    from: 'amber',     to: 'coral'   },
  seasons:  { Icon: IconSeasons, from: 'violet',    to: 'magenta' },
  sowing:   { Icon: IconSowing,  from: 'magenta',   to: 'coral'   },
} as const;
