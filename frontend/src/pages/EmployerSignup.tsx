import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

/**
 * Employer accounts are provisioned by the Mokshly team — we set up the
 * tenant, the billing details, and email the HR contact an invitation link.
 * This page replaces the old self-serve form: it points interested teams to
 * the Contact page so we can speak with them first.
 */
export default function EmployerSignup() {
  return (
    <div className="mok-auth-shell">
      <div className="mok-card mok-card--padded mok-auth-card" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 18 }}>
          <Logo size="md" />
        </div>
        <p className="mok-eyebrow" style={{ margin: 0 }}>For employers</p>
        <h1 className="mok-section-title" style={{ fontSize: 24, margin: '6px 0 8px' }}>
          Bring YouSourceful to your team.
        </h1>
        <p className="mok-section-lede" style={{ marginBottom: 24 }}>
          Employer accounts are set up by the Mokshly team. We will take a few
          minutes to understand your goals, prepare your portal, and email an
          invitation to your HR contact to finish onboarding.
        </p>

        <div className="mok-card mok-card--quiet" style={{ padding: 18, textAlign: 'left', marginBottom: 24 }}>
          <p className="mok-eyebrow" style={{ margin: 0 }}>What happens next</p>
          <ol style={{ paddingLeft: 18, margin: '10px 0 0', lineHeight: 1.65 }}>
            <li>You reach out via Contact — share your organization and HR contact.</li>
            <li>We set up your tenant and send your HR contact an invitation email.</li>
            <li>They accept the invite, choose a password, and walk through a brief HR orientation.</li>
            <li>From the dashboard, they can write welcome notes for your team and decide when to turn the cohort feature on.</li>
          </ol>
        </div>

        <Link to="/contact" className="mok-btn mok-btn--gradient mok-btn--block mok-btn--lg">
          Contact us to get set up
        </Link>

        <p style={{ marginTop: 18, fontSize: 14, color: 'var(--text-muted)' }}>
          Already received an invitation?{' '}
          <Link to="/employer/login" style={{ color: 'var(--accent)' }}>Sign in</Link>{' '}
          or open your invitation email link.
        </p>
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-subtle)' }}>
          Looking for the practitioner sign-in?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>Go here</Link>
        </p>
      </div>
    </div>
  );
}
