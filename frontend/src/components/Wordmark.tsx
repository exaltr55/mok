import type { CSSProperties } from 'react';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  size?: Size;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

/**
 * The Mokshly + YouSourceful wordmark — a two-line stacked composition:
 *
 *     Mokshly
 *     YouSourceful
 *
 * "Mokshly" is the corporate parent (small, subtle, on top); "YouSourceful"
 * is the product (prominent). Mirrors the Google → Gmail logo relationship.
 */
export default function Wordmark({
  size = 'md',
  className = '',
  style,
  ariaLabel = 'YouSourceful by Mokshly',
}: Props) {
  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={`mok-wordmark mok-wordmark--${size} ${className}`.trim()}
      style={style}
    >
      <span className="mok-wordmark-parent">Mokshly</span>
      <span className="mok-wordmark-main">YouSourceful</span>
    </span>
  );
}
