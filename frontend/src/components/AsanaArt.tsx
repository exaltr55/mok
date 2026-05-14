/**
 * Stick-figure asana illustrations for the I M Moving practice.
 *
 * Each asana is a stylized line-art figure showing the body shape, drawn in a
 * 100x100 viewBox. They are referenced from `ASANAS` (asanas/walking/squat
 * sequence) via their key.
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

const CatCow: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    <path d="M 20 70 L 20 55 Q 30 30, 50 32 Q 70 34, 80 55 L 80 70" />
    <circle cx="18" cy="48" r="4" />
    <line x1="22" y1="55" x2="22" y2="70" />
    <line x1="78" y1="55" x2="78" y2="70" />
  </svg>
);

const Mountain: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    <circle cx="50" cy="20" r="6" />
    <line x1="50" y1="26" x2="50" y2="60" />
    <line x1="50" y1="32" x2="40" y2="58" />
    <line x1="50" y1="32" x2="60" y2="58" />
    <line x1="50" y1="60" x2="44" y2="86" />
    <line x1="50" y1="60" x2="56" y2="86" />
    <line x1="36" y1="88" x2="64" y2="88" opacity={0.5} />
  </svg>
);

const Tree: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    <circle cx="50" cy="14" r="5" />
    <line x1="50" y1="19" x2="50" y2="56" />
    <path d="M 50 24 L 38 8" />
    <path d="M 50 24 L 62 8" />
    <line x1="38" y1="8" x2="62" y2="8" opacity={0.6} />
    <line x1="50" y1="56" x2="50" y2="88" />
    <path d="M 50 56 L 38 68 L 50 70" />
    <line x1="42" y1="89" x2="58" y2="89" opacity={0.5} />
  </svg>
);

const Warrior: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    <circle cx="48" cy="22" r="5" />
    <line x1="48" y1="27" x2="48" y2="55" />
    <line x1="20" y1="38" x2="76" y2="38" />
    <path d="M 48 55 L 32 72 L 32 88" />
    <path d="M 48 55 L 78 88" />
    <line x1="24" y1="89" x2="84" y2="89" opacity={0.4} />
  </svg>
);

const ForwardFold: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    <line x1="50" y1="20" x2="50" y2="58" />
    <circle cx="50" cy="68" r="5" />
    <path d="M 50 58 L 38 72" />
    <path d="M 50 58 L 62 72" />
    <line x1="50" y1="20" x2="44" y2="88" />
    <line x1="50" y1="20" x2="56" y2="88" />
    <line x1="38" y1="89" x2="62" y2="89" opacity={0.4} />
  </svg>
);

const DownDog: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    {/* inverted V: hands left, hips up, feet right */}
    <line x1="14" y1="80" x2="50" y2="30" />
    <line x1="50" y1="30" x2="86" y2="80" />
    <line x1="14" y1="80" x2="86" y2="80" opacity={0.4} />
    <circle cx="22" cy="78" r="3" />
  </svg>
);

const Cobra: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    <circle cx="22" cy="38" r="5" />
    <path d="M 26 42 Q 40 48, 60 60 L 88 64" />
    <path d="M 26 42 L 26 60" />
    <line x1="60" y1="64" x2="88" y2="64" opacity={0.6} />
    <line x1="14" y1="78" x2="86" y2="78" opacity={0.4} />
  </svg>
);

const Child: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    <path d="M 70 76 Q 62 60, 48 60 Q 36 60, 30 70" />
    <circle cx="22" cy="68" r="5" />
    <line x1="22" y1="68" x2="8" y2="64" />
    <line x1="14" y1="80" x2="86" y2="80" opacity={0.4} />
  </svg>
);

const Twist: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    <circle cx="50" cy="22" r="5" />
    <path d="M 50 27 Q 56 36, 50 56" />
    <path d="M 50 32 L 30 38" />
    <path d="M 50 32 L 70 30" />
    <path d="M 50 56 L 34 72 L 50 80" />
    <path d="M 50 56 L 66 72 L 50 80" opacity={0.7} />
    <line x1="28" y1="84" x2="72" y2="84" opacity={0.4} />
  </svg>
);

const Butterfly: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    <circle cx="50" cy="22" r="5" />
    <line x1="50" y1="27" x2="50" y2="60" />
    <path d="M 50 60 Q 30 60, 22 72 L 50 70 L 78 72 Q 70 60, 50 60 Z" />
    <line x1="20" y1="80" x2="80" y2="80" opacity={0.4} />
  </svg>
);

const Savasana: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    <circle cx="14" cy="50" r="5" />
    <line x1="20" y1="50" x2="86" y2="50" />
    <line x1="40" y1="50" x2="38" y2="58" opacity={0.7} />
    <line x1="60" y1="50" x2="62" y2="58" opacity={0.7} />
    <line x1="86" y1="50" x2="92" y2="46" opacity={0.7} />
    <line x1="86" y1="50" x2="92" y2="54" opacity={0.7} />
    <line x1="6" y1="68" x2="94" y2="68" opacity={0.4} />
  </svg>
);

const Walking: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    <circle cx="50" cy="20" r="5" />
    <line x1="50" y1="25" x2="48" y2="58" />
    <path d="M 50 32 L 38 44" />
    <path d="M 50 32 L 62 44" />
    <path d="M 48 58 L 36 84" />
    <path d="M 48 58 L 64 80" />
    <line x1="20" y1="86" x2="80" y2="86" opacity={0.4} />
    <line x1="14" y1="40" x2="22" y2="40" opacity={0.4} />
    <line x1="12" y1="50" x2="20" y2="50" opacity={0.3} />
  </svg>
);

const Squat: FC<ArtProps> = ({ color = 'currentColor', size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" {...stroke(color)}>
    <circle cx="50" cy="22" r="5" />
    <line x1="50" y1="27" x2="48" y2="50" />
    <line x1="48" y1="34" x2="74" y2="36" />
    <line x1="48" y1="34" x2="22" y2="36" opacity={0.7} />
    <path d="M 48 50 L 30 62 L 32 84" />
    <path d="M 48 50 L 66 62 L 64 84" />
    <line x1="20" y1="86" x2="80" y2="86" opacity={0.4} />
  </svg>
);

export const AsanaArt = {
  catCow: CatCow,
  mountain: Mountain,
  tree: Tree,
  warrior: Warrior,
  forwardFold: ForwardFold,
  downDog: DownDog,
  cobra: Cobra,
  child: Child,
  twist: Twist,
  butterfly: Butterfly,
  savasana: Savasana,
  walking: Walking,
  squat: Squat,
} as const;

export type AsanaKey = keyof typeof AsanaArt;

export interface AsanaStep {
  id: AsanaKey;
  num: number;
  name: string;
  subtitle: string;
  cue: string;
}

export const ASANAS: AsanaStep[] = [
  { id: 'catCow', num: 1, name: 'Cat–Cow Pose', subtitle: 'Spinal Warm-Up',
    cue: 'Move with the breath. Inhale to soften and open. Exhale to round and curl.' },
  { id: 'mountain', num: 2, name: 'Mountain Pose', subtitle: 'Standing Awareness',
    cue: 'Press all four corners of the feet down. Crown of the head lifts. Three full breaths.' },
  { id: 'tree', num: 3, name: 'Tree Pose', subtitle: 'Balance and Focus',
    cue: 'Wobbling is the practice. Soften your gaze. Press the standing foot. Switch sides.' },
  { id: 'warrior', num: 4, name: 'Warrior II', subtitle: 'Strength and Stability',
    cue: 'Front knee tracks over the ankle. Arms reach long. Gaze over the front fingertips.' },
  { id: 'forwardFold', num: 5, name: 'Forward Fold', subtitle: 'Release',
    cue: 'Soft knees. Let the head be heavy. The fold deepens with the exhale.' },
  { id: 'downDog', num: 6, name: 'Downward-Facing Dog', subtitle: 'Full-Body Stretch',
    cue: 'Press through the hands. Lengthen the spine. Heels do not need to touch.' },
  { id: 'cobra', num: 7, name: 'Cobra Pose', subtitle: 'Heart Opener',
    cue: 'Lift from the back, not the arms. Keep the lower back long.' },
  { id: 'child', num: 8, name: "Child's Pose", subtitle: 'Rest',
    cue: 'Knees wide. Big toes touching. Forehead toward the mat. Breathe into the back.' },
  { id: 'twist', num: 9, name: 'Seated Twist', subtitle: 'Spinal Mobility',
    cue: 'Lengthen the spine on the inhale. Twist on the exhale. Switch sides.' },
  { id: 'savasana', num: 10, name: 'Savasana', subtitle: 'Final Rest',
    cue: 'Lie flat. Let the body soften completely. Stay as long as you would like.' },
];
