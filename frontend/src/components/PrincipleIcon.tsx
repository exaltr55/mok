/**
 * Six small emblematic icons for the About page principles — one per
 * principle, each in its assigned theme accent. Sized for the principle
 * card (~36px) but drawn in a 64×64 viewBox so they scale crisply. They
 * share visual DNA with the Home feature icons (round caps, soft strokes,
 * two-stop gradient).
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

/** Awareness — three concentric rings around a centre, a quiet lens. */
export const IconAwareness: FC<Props> = ({ size = 36, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    <circle cx="32" cy="32" r="22" stroke={`url(#${id})`} strokeWidth="1.8" opacity="0.30" />
    <circle cx="32" cy="32" r="14" stroke={`url(#${id})`} strokeWidth="1.8" opacity="0.60" />
    <circle cx="32" cy="32" r="7"  stroke={`url(#${id})`} strokeWidth="2"   opacity="0.90" />
    <circle cx="32" cy="32" r="2.4" fill={`url(#${id})`} />
  </svg>
);

/** Gentle — a single leaf, soft. */
export const IconLeaf: FC<Props> = ({ size = 36, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    <path
      d="M 14 50 C 20 26, 38 14, 52 12 C 50 28, 38 46, 16 52 Z"
      fill={`url(#${id})`}
      opacity="0.85"
    />
    {/* Central vein. */}
    <path
      d="M 16 52 C 28 36, 40 24, 52 12"
      stroke="#FFFFFF"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.55"
      fill="none"
    />
  </svg>
);

/** Self-relating — a soft loop returning to a centred dot. */
export const IconMirror: FC<Props> = ({ size = 36, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    <path
      d="M 14 32 C 14 20, 22 14, 32 14 C 42 14, 50 22, 50 32 C 50 42, 42 50, 32 50 L 26 50"
      stroke={`url(#${id})`}
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Arrow head curving back. */}
    <path
      d="M 26 50 L 30 46 M 26 50 L 30 54"
      stroke={`url(#${id})`}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <circle cx="32" cy="32" r="3.4" fill={`url(#${id})`} />
  </svg>
);

/** Intimate cohorts — five dots in a small ring around a centre. */
export const IconCohort: FC<Props> = ({ size = 36, from, to, id }) => {
  const cx = 32;
  const cy = 32;
  const r = 18;
  const dots = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>{gradient(from, to, id)}</defs>
      <circle cx={cx} cy={cy} r={r} stroke={`url(#${id})`} strokeWidth="1.2" opacity="0.25" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="4" fill={`url(#${id})`} />
      ))}
      <circle cx={cx} cy={cy} r="2.8" stroke={`url(#${id})`} strokeWidth="1.6" />
    </svg>
  );
};

/** Privacy as the product — a shield with a heart inside. */
export const IconShield: FC<Props> = ({ size = 36, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    <path
      d="M 32 8 L 52 16 L 52 32 C 52 45 42 55 32 58 C 22 55 12 45 12 32 L 12 16 Z"
      stroke={`url(#${id})`}
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <path
      d="M 32 42 C 27 38, 22 36, 22 32 C 22 29 24 27 27 27 C 29 27 31 28 32 30 C 33 28 35 27 37 27 C 40 27 42 29 42 32 C 42 36 37 38 32 42 Z"
      fill={`url(#${id})`}
      opacity="0.92"
    />
  </svg>
);

/** Return-friendly — a circular arrow looping back to start. */
export const IconReturn: FC<Props> = ({ size = 36, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    <path
      d="M 50 30 A 20 20 0 1 0 38 50"
      stroke={`url(#${id})`}
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
    {/* Arrow head at the end. */}
    <path
      d="M 38 50 L 33 46 M 38 50 L 36 56"
      stroke={`url(#${id})`}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle cx="32" cy="32" r="2.4" fill={`url(#${id})`} />
  </svg>
);
