import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from './BottomNav';
import Wordmark from './Wordmark';

const PUBLIC_PATHS = ['/', '/about', '/contact', '/login', '/signup', '/forgot-password', '/reset-password'];

/**
 * The chrome wrapping every routed page. Two presentations:
 *   - marketing (public pages): top nav with Home/About/Contact + Sign in/Begin
 *   - app (authenticated, non-public): top nav with Settings/Sign-out;
 *     primary destinations live in the mobile bottom-nav and in the
 *     desktop-only middle of the top nav.
 *
 * The session route (/practices/:key/session) and the reading view
 * (/practices/:key) are fullscreen overlays — they render outside this shell.
 */
export default function AppShell() {
  const { isAuthenticated, user, logout } = useAuth();
  const { pathname } = useLocation();

  const isPublic = PUBLIC_PATHS.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)));
  const showAppNav = isAuthenticated && !isPublic;

  return (
    <div className="mok-shell">
      <div className="mok-grain" aria-hidden />

      <nav className="mok-nav">
        <div className="mok-nav-inner">
          <NavLink to={isAuthenticated ? '/dashboard' : '/'} style={{ textDecoration: 'none' }}>
            <Wordmark size="sm" />
          </NavLink>

          {/* Primary nav links — hidden on mobile via CSS */}
          <div className="mok-nav-links">
            {showAppNav ? (
              <>
                <NavLink to="/today" className={({ isActive }) => `mok-nav-link ${isActive ? 'active' : ''}`}>Today</NavLink>
                <NavLink to="/practices" className={({ isActive }) => `mok-nav-link ${isActive ? 'active' : ''}`}>Practices</NavLink>
                <NavLink to="/journal" className={({ isActive }) => `mok-nav-link ${isActive ? 'active' : ''}`}>Journal</NavLink>
                <NavLink to="/learn" className={({ isActive }) => `mok-nav-link ${isActive ? 'active' : ''}`}>Learn</NavLink>
                <NavLink to="/dashboard" className={({ isActive }) => `mok-nav-link ${isActive ? 'active' : ''}`}>Me</NavLink>
              </>
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
                <NavLink to="/settings" className="mok-nav-link mok-nav-link--icon" aria-label="Settings">
                  <span aria-hidden="true">⚙</span>
                  <span className="mok-hide-mobile">Settings</span>
                </NavLink>
                <span className="mok-subtle mok-hide-mobile" style={{ fontSize: 13, fontFamily: 'var(--font-sans)' }}>
                  {user?.name?.split(' ')[0]}
                </span>
                <button type="button" className="mok-btn mok-btn--ghost mok-hide-mobile" onClick={logout}>Sign out</button>
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
