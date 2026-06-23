interface Props {
  /** 0 = just started, 1 = complete. Values outside [0,1] are clamped. */
  progress: number;
  /** CSS color (hex or rgb) for the filled arc. */
  accent?: string;
  /** Visual diameter in px. Default 56. */
  size?: number;
}

/**
 * Quiet, non-numerical session progress indicator. A thin ring that
 * gradually fills with the accent color as the session elapses —
 * meant to be glanceable without pulling attention away from the
 * practice.
 */
export default function SessionProgressDial({
  progress,
  accent = 'var(--accent)',
  size = 56,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={clamped}
      aria-label="Session progress"
      style={{ display: 'block', margin: '0 auto' }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--border)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={accent}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  );
}
