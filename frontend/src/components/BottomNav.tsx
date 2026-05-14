import { NavLink } from 'react-router-dom';

interface Item {
  to: string;
  label: string;
  glyph: string;
}

const ITEMS: Item[] = [
  { to: '/today',     label: 'Today',     glyph: '○' },
  { to: '/practices', label: 'Practices', glyph: '◊' },
  { to: '/journal',   label: 'Journal',   glyph: '✎' },
  { to: '/learn',     label: 'Learn',     glyph: '☰' },
  { to: '/dashboard', label: 'Me',        glyph: '·' },
];

/**
 * Mobile bottom tab bar for authenticated practitioners. Hidden ≥ 720px via
 * the .mok-bottom-nav CSS rule. Auto-adjusts for iOS safe-area inset.
 */
export default function BottomNav() {
  return (
    <nav className="mok-bottom-nav" aria-label="Primary">
      <div className="mok-bottom-nav-inner">
        {ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => `mok-bottom-nav-link ${isActive ? 'active' : ''}`}
          >
            <span aria-hidden="true" className="mok-bottom-nav-glyph">{it.glyph}</span>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
