/**
 * Emblematic illustrations for the Home page feature cards. Each is a 64×64
 * viewBox SVG with a two-stop gradient, tuned to be memorable on its own
 * while still reading as part of one family (round caps, soft 1.6 strokes,
 * symbolic rather than literal).
 */

import type { FC } from 'react';

interface Props {
  size?: number;
  /** Gradient stop colours (CSS variable names without `--`). */
  from: string;
  to: string;
  /** Unique id for the linearGradient — must differ per render to avoid
   *  cross-icon bleed when several icons share a page. */
  id: string;
}

function makeGradient(from: string, to: string, id: string) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   style={{ stopColor: `var(--${from})` }} />
      <stop offset="100%" style={{ stopColor: `var(--${to})` }} />
    </linearGradient>
  );
}

/** Five layered horizons rising toward a small light — the 5S framework as
 *  ordered strata of awareness, ground to sky. */
export const IconFramework: FC<Props> = ({ size = 56, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{makeGradient(from, to, id)}</defs>
    {/* Five arcs stacked, widest at base. */}
    <path d="M 6 50 Q 32 38, 58 50" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" opacity="0.22" />
    <path d="M 10 42 Q 32 32, 54 42" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" opacity="0.40" />
    <path d="M 14 34 Q 32 26, 50 34" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" opacity="0.60" />
    <path d="M 18 27 Q 32 21, 46 27" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" opacity="0.80" />
    <path d="M 22 20 Q 32 16, 42 20" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" />
    {/* Small light at the peak. */}
    <circle cx="32" cy="10" r="2.6" fill={`url(#${id})`} />
  </svg>
);

/** Seven-petal bloom opening from a small core — seven daily practices
 *  unfolding from one centre. */
export const IconPractices: FC<Props> = ({ size = 56, from, to, id }) => {
  const cx = 32;
  const cy = 32;
  const r = 22;
  // Each petal is a soft teardrop oriented outward.
  const petals = Array.from({ length: 7 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
    const tipX = cx + r * Math.cos(angle);
    const tipY = cy + r * Math.sin(angle);
    return { tipX, tipY, angle: (angle * 180) / Math.PI + 90 };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>{makeGradient(from, to, id)}</defs>
      {petals.map((p, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy - 13}
          rx="4.5"
          ry="11"
          fill={`url(#${id})`}
          opacity="0.55"
          transform={`rotate(${p.angle - 90} ${cx} ${cy})`}
        />
      ))}
      {/* Central core. */}
      <circle cx={cx} cy={cy} r="4.2" fill={`url(#${id})`} />
    </svg>
  );
};

/** Sanctuary arch with a heart inside — your private space, held warmly. */
export const IconPrivacy: FC<Props> = ({ size = 56, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{makeGradient(from, to, id)}</defs>
    {/* Arched doorway: vertical sides + half-circle top. */}
    <path
      d="M 14 56 L 14 32 A 18 18 0 0 1 50 32 L 50 56"
      stroke={`url(#${id})`}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Floor beneath the arch. */}
    <path d="M 8 56 L 56 56" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" opacity="0.4" />
    {/* Heart inside the arch. */}
    <path
      d="M 32 46 C 27 42, 22 39, 22 34 C 22 31 24 29 27 29 C 29 29 31 30 32 32 C 33 30 35 29 37 29 C 40 29 42 31 42 34 C 42 39 37 42 32 46 Z"
      fill={`url(#${id})`}
      opacity="0.92"
    />
  </svg>
);

/** Two soft circles joined by a quiet arc — you and your Buddy, an
 *  always-present companion alongside the practice. */
export const IconBuddy: FC<Props> = ({ size = 56, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{makeGradient(from, to, id)}</defs>
    {/* Connecting arc — quiet, steady presence between the two. */}
    <path
      d="M 20 38 Q 32 28, 44 38"
      stroke={`url(#${id})`}
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.5"
    />
    {/* The larger anchor (you). */}
    <circle cx="20" cy="38" r="8" fill={`url(#${id})`} opacity="0.85" />
    {/* The smaller companion (Buddy). */}
    <circle cx="44" cy="38" r="6" fill={`url(#${id})`} />
    {/* Soft halo above Buddy — its attentive, listening quality. */}
    <circle cx="44" cy="22" r="2.2" fill={`url(#${id})`} opacity="0.7" />
  </svg>
);

/** Sapling rising from a soft ground line — patient growth, return over
 *  time. The leaves curl outward like opening hands. */
export const IconLoop: FC<Props> = ({ size = 56, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{makeGradient(from, to, id)}</defs>
    {/* Ground line. */}
    <path d="M 10 52 L 54 52" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" opacity="0.35" />
    {/* Stem. */}
    <path d="M 32 52 L 32 18" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" />
    {/* Left leaf — opening curl. */}
    <path
      d="M 32 32 C 22 32, 16 28, 14 22 C 22 22, 30 26, 32 32 Z"
      fill={`url(#${id})`}
      opacity="0.78"
    />
    {/* Right leaf — opening curl, slightly higher. */}
    <path
      d="M 32 26 C 42 26, 48 22, 50 16 C 42 16, 34 20, 32 26 Z"
      fill={`url(#${id})`}
      opacity="0.92"
    />
    {/* Tiny bud at the top. */}
    <circle cx="32" cy="16" r="2.4" fill={`url(#${id})`} />
  </svg>
);
