/**
 * Three distinct icons used only on the Contact page, so they carry no
 * meaning from About / Home. Same family DNA as the rest (64×64 viewBox,
 * round caps, two-stop gradient) but unique silhouettes.
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

/** Speech bubble with three small dots — a friendly "say something" mark. */
export const IconMessage: FC<Props> = ({ size = 36, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    <path
      d="M 12 18 C 12 14 14 12 18 12 L 46 12 C 50 12 52 14 52 18 L 52 38 C 52 42 50 44 46 44 L 28 44 L 18 52 L 18 44 C 14 44 12 42 12 38 Z"
      fill={`url(#${id})`}
      opacity="0.92"
    />
    {/* Three dots inside the bubble. */}
    <circle cx="24" cy="28" r="2.4" fill="#FFFFFF" opacity="0.85" />
    <circle cx="32" cy="28" r="2.4" fill="#FFFFFF" opacity="0.85" />
    <circle cx="40" cy="28" r="2.4" fill="#FFFFFF" opacity="0.85" />
  </svg>
);

/** Stylised building — for employer / team enquiries. */
export const IconBuilding: FC<Props> = ({ size = 36, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    {/* Building outline. */}
    <path
      d="M 14 54 L 14 16 L 38 16 L 38 28 L 50 28 L 50 54 Z"
      stroke={`url(#${id})`}
      strokeWidth="2.2"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    {/* Door at the base. */}
    <path
      d="M 22 54 L 22 44 L 30 44 L 30 54"
      stroke={`url(#${id})`}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Window grid — three small windows on the left tower. */}
    <rect x="18" y="22" width="5" height="5" fill={`url(#${id})`} opacity="0.65" />
    <rect x="29" y="22" width="5" height="5" fill={`url(#${id})`} opacity="0.65" />
    <rect x="18" y="32" width="5" height="5" fill={`url(#${id})`} opacity="0.65" />
    <rect x="29" y="32" width="5" height="5" fill={`url(#${id})`} opacity="0.65" />
    {/* Two small windows on the right wing. */}
    <rect x="42" y="34" width="4" height="4" fill={`url(#${id})`} opacity="0.65" />
    <rect x="42" y="42" width="4" height="4" fill={`url(#${id})`} opacity="0.65" />
  </svg>
);

/** Megaphone with two sound waves — for press / partnerships. */
export const IconMegaphone: FC<Props> = ({ size = 36, from, to, id }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>{gradient(from, to, id)}</defs>
    {/* Megaphone cone — pointing right. */}
    <path
      d="M 16 28 L 16 40 L 26 40 L 46 50 L 46 18 L 26 28 Z"
      fill={`url(#${id})`}
      opacity="0.92"
    />
    {/* Small handle stem under the cone. */}
    <path
      d="M 22 40 L 22 50"
      stroke={`url(#${id})`}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    {/* Two sound waves emanating right of the cone. */}
    <path
      d="M 52 24 Q 58 34, 52 44"
      stroke={`url(#${id})`}
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
      opacity="0.65"
    />
    <path
      d="M 56 18 Q 64 34, 56 50"
      stroke={`url(#${id})`}
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
      opacity="0.35"
    />
  </svg>
);
