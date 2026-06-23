import { Link } from 'react-router-dom';

interface Props {
  /** Optional starting prompt the Buddy page opens with. */
  topic?: string;
  /** Display text. Defaults to "Ask your Buddy". */
  label?: string;
}

/**
 * Quiet inline link that opens the Buddy with optional context.
 * Used on screens where a user might need help without making the
 * link visually compete with the practice itself.
 */
export default function AskCompanionLink({ topic, label = 'Ask your Buddy' }: Props) {
  const href = topic
    ? `/companion?topic=${encodeURIComponent(topic)}`
    : '/companion';
  return (
    <Link
      to={href}
      style={{
        color: 'var(--accent)',
        fontSize: 13,
        fontStyle: 'italic',
        textDecoration: 'underline',
      }}
    >
      {label}
    </Link>
  );
}
