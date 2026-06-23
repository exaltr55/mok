import { NavLink, useLocation } from 'react-router-dom';

interface Item {
  to: string;
  label: string;
  glyph: string;
  /** Other paths that should also activate this tab. */
  alsoActive?: string[];
  /** True when the destination is not yet live for any user — renders
   *  visually dimmer in the tab bar so the available tabs stand out. */
  coming?: boolean;
}

const ITEMS: Item[] = [
  { to: '/today',     label: 'Today',     glyph: '○' },
  { to: '/practices', label: 'Practice',  glyph: '◊', alsoActive: ['/practices'] },
  { to: '/connect',   label: 'Connect',   glyph: '∾', coming: true },
  { to: '/learn',     label: 'Learn',     glyph: '☰' },
  { to: '/companion', label: 'Buddy',     glyph: '☉' },
  { to: '/me',        label: 'Me',        glyph: '·', alsoActive: ['/me', '/dashboard', '/journal', '/history', '/settings'] },
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
            className={[
              'mok-bottom-nav-link',
              isActive(it) ? 'active' : '',
              it.coming ? 'mok-bottom-nav-link--coming' : '',
            ].filter(Boolean).join(' ')}
          >
            <span aria-hidden="true" className="mok-bottom-nav-glyph">{it.glyph}</span>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
