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
 * "Me" shell — a mobile-first tab bar above the routed body. Each child
 * tab carries its own page header, so this shell intentionally has no
 * section title of its own.
 */
export default function MeLayout() {
  return (
    <div className="mok-me mok-rise">
      <nav className="mok-subnav mok-me-tabs" aria-label="My YouSourceful">
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
