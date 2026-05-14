import { NavLink, useLocation } from 'react-router-dom';

interface Item {
  to: string;
  label: string;
  glyph: string;
  /** Other paths that should also activate this tab. */
  alsoActive?: string[];
}

const ITEMS: Item[] = [
  { to: '/today',     label: 'Today',    glyph: '○' },
  { to: '/practices', label: 'Practice', glyph: '◊', alsoActive: ['/practices'] },
  { to: '/connect',   label: 'Connect',  glyph: '∾' },
  { to: '/learn',     label: 'Learn',    glyph: '☰' },
  { to: '/me',        label: 'Me',       glyph: '·', alsoActive: ['/me', '/dashboard', '/journal', '/history', '/settings'] },
];

/**
 * Mobile bottom tab bar for authenticated practitioners. Hidden ≥ 720px via
 * the .mok-bottom-nav CSS rule. Auto-adjusts for iOS safe-area inset.
 */
export default function BottomNav() {
  const { pathname } = useLocation();

  const isActive = (item: Item) =>
    pathname === item.to ||
    !!item.alsoActive?.some((p) => pathname === p || pathname.startsWith(p + '/'));

  return (
    <nav className="mok-bottom-nav" aria-label="Primary">
      <div className="mok-bottom-nav-inner">
        {ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={`mok-bottom-nav-link ${isActive(it) ? 'active' : ''}`}
          >
            <span aria-hidden="true" className="mok-bottom-nav-glyph">{it.glyph}</span>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
