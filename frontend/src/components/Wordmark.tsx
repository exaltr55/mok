import type { CSSProperties } from 'react';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  size?: Size;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

/**
 * The Mokshly wordmark — a three-line stacked composition:
 *
 *     be
 *     YouSourceful
 *     by Mokshly
 *
 * "be" hugs the left edge; YouSourceful and "by Mokshly" are centered beneath.
 * The block sizes itself to the width of YouSourceful (the widest line).
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
      <span className="mok-wordmark-be">be</span>
      <span className="mok-wordmark-main">YouSourceful</span>
      <span className="mok-wordmark-by">by Mokshly</span>
    </span>
  );
}
