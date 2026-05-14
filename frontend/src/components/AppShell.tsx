import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from './BottomNav';
import Wordmark from './Wordmark';

const PUBLIC_PATHS = ['/', '/about', '/contact', '/login', '/signup', '/forgot-password', '/reset-password'];

interface NavTab {
  to: string;
  label: string;
  /** Other paths that should also light the tab up as active. */
  alsoActive?: string[];
}

const APP_TABS: NavTab[] = [
  { to: '/today',     label: 'Today' },
  { to: '/practices', label: 'Practice', alsoActive: ['/practices'] },
  { to: '/connect',   label: 'Connect' },
  { to: '/learn',     label: 'Learn' },
  { to: '/me',        label: 'Me', alsoActive: ['/me', '/dashboard', '/journal', '/history', '/settings'] },
];

/**
 * The chrome wrapping every routed page. Two presentations:
 *   - marketing (public pages): top nav with Home/About/Contact + Sign in/Begin
 *   - app (authenticated, non-public): five primary tabs — Today, Practice,
 *     Connect, Learn, Me — plus a Sign-out action.
 *
 * The session route (/practices/:key/session) and the reading view
 * (/practices/:key) are fullscreen overlays — they render outside this shell.
 */
export default function AppShell() {
  const { isAuthenticated, user, logout } = useAuth();
  const { pathname } = useLocation();

  const isPublic = PUBLIC_PATHS.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)));
  const showAppNav = isAuthenticated && !isPublic;

  function isTabActive(tab: NavTab): boolean {
    if (pathname === tab.to) return true;
    if (tab.alsoActive?.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true;
    return false;
  }

  return (
    <div className="mok-shell">
      <div className="mok-grain" aria-hidden />

      <nav className="mok-nav">
        <div className="mok-nav-inner">
          <NavLink to={isAuthenticated ? '/today' : '/'} style={{ textDecoration: 'none' }}>
            <Wordmark size="sm" />
          </NavLink>

          {/* Primary nav links — hidden on mobile via CSS */}
          <div className="mok-nav-links">
            {showAppNav ? (
              APP_TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={`mok-nav-link ${isTabActive(tab) ? 'active' : ''}`}
                >
                  {tab.label}
                </NavLink>
              ))
            ) : (
              <>
                <NavLink to="/" end className={({ isActive }) => `mok-nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
                <NavLink to="/about" className={({ isActive }) => `mok-nav-link ${isActive ? 'active' : ''}`}>About</NavLink>
                <NavLink to="/contact" className={({ isActive }) => `mok-nav-link ${isActive ? 'active' : ''}`}>Contact</NavLink>
              </>
            )}
          </div>

          <div className="mok-nav-actions">
            {isAuthenticated ? (
              <>
                <span className="mok-subtle mok-hide-mobile" style={{ fontSize: 13, fontFamily: 'var(--font-sans)' }}>
                  {user?.name?.split(' ')[0]}
                </span>
                <button type="button" className="mok-btn mok-btn--ghost mok-hide-mobile" onClick={logout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="mok-nav-link mok-hide-mobile">Sign in</NavLink>
                <NavLink to="/signup" className="mok-btn mok-btn--primary">Begin</NavLink>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="mok-shell-main">
        <Outlet />
      </main>

      <footer className="mok-footer">
        © {new Date().getFullYear()} · Mokshly · Human Sustainability
      </footer>

      {showAppNav && <BottomNav />}
    </div>
  );
}
