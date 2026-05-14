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
 * Renders a sticky sub-nav of internal tabs and a routed `<Outlet>` body.
 * Each tab is a nested route under `/me`. Legacy URLs (`/dashboard`,
 * `/journal`, `/history`, `/settings`) redirect to the matching tab.
 */
export default function MeLayout() {
  return (
    <div className="mok-rise" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <header style={{ padding: '24px 0 8px' }}>
        <p className="mok-eyebrow">Me</p>
        <h1 className="mok-section-title">Your private sanctuary.</h1>
        <p className="mok-section-lede">
          Everything here is yours alone. Your journal, your reflections, your MCI — never
          visible to anyone else.
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

      <div style={{ paddingTop: 20 }}>
        <Outlet />
      </div>
    </div>
  );
}
