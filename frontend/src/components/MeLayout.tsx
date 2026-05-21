import { NavLink, Outlet } from 'react-router-dom';

interface Tab {
  to: string;
  label: string;
}

const TABS: Tab[] = [
  { to: '/me',          label: 'Overview' },
  { to: '/me/journal',  label: 'Journal' },
  { to: '/me/history',  label: 'History' },
  { to: '/me/settings', label: 'Preferences' },
];

/**
 * "Me" shell — the practitioner's private sanctuary.
 *
 * Renders a compact section banner ("Me · your private sanctuary") and a
 * tab bar above the routed body. The banner is intentionally smaller than
 * a page hero so the child page's own h1 reads as the dominant title.
 */
export default function MeLayout() {
  return (
    <div className="mok-me mok-rise">
      <header className="mok-me-banner">
        <p className="mok-eyebrow">Me</p>
        <p className="mok-me-banner-title">
          Your private sanctuary
        </p>
        <p className="mok-me-banner-sub">
          Everything here belongs to you — your dashboard, your journal,
          your history, your preferences.
        </p>
      </header>

      <nav className="mok-subnav" aria-label="My YouSourceful">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/me'}
            className={({ isActive }) => `mok-subnav-link ${isActive ? 'active' : ''}`}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <div className="mok-me-body">
        <Outlet />
      </div>
    </div>
  );
}
