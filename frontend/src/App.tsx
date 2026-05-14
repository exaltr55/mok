import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import MeLayout from './components/MeLayout';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import About from './pages/About';
import Connect from './pages/Connect';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import History from './pages/History';
import Home from './pages/Home';
import Journal from './pages/Journal';
import Learn from './pages/Learn';
import LearnModule from './pages/LearnModule';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Onboarding from './pages/Onboarding';
import PracticeDetail from './pages/PracticeDetail';
import PracticeSession from './pages/PracticeSession';
import Practices from './pages/Practices';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import Today from './pages/Today';

/**
 * Top-level routing for YouSourceful.
 *
 * Five primary practitioner tabs:
 *   /today      — phase-aware daily landing
 *   /practices  — Practice section (all 7 + reading + sessions)
 *   /connect    — cohort + community
 *   /learn      — 5S Framework + per-practice teachings
 *   /me         — private sanctuary (Overview · Journal · History · Preferences)
 *
 * Legacy URLs (/dashboard, /journal, /history, /settings) redirect into /me
 * so existing bookmarks and external links continue to work.
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            {/* Public */}
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />

            {/* Authenticated; onboarding pre-required */}
            <Route element={<PrivateRoute requireOnboarded={false} />}>
              <Route path="onboarding" element={<Onboarding />} />
            </Route>

            {/* Authenticated + onboarded */}
            <Route element={<PrivateRoute />}>
              {/* Today */}
              <Route path="today" element={<Today />} />

              {/* Practice */}
              <Route path="practices" element={<Practices />} />
              <Route path="practices/:key" element={<PracticeDetail />} />
              <Route path="practices/:key/session" element={<PracticeSession />} />

              {/* Connect */}
              <Route path="connect" element={<Connect />} />

              {/* Learn */}
              <Route path="learn" element={<Learn />} />
              <Route path="learn/:slug" element={<LearnModule />} />

              {/* Me — tabbed shell wrapping the four private surfaces */}
              <Route path="me" element={<MeLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="journal" element={<Journal />} />
                <Route path="history" element={<History />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Legacy URL redirects — keep external bookmarks working. */}
              <Route path="dashboard" element={<Navigate to="/me" replace />} />
              <Route path="journal"   element={<Navigate to="/me/journal" replace />} />
              <Route path="history"   element={<Navigate to="/me/history" replace />} />
              <Route path="settings"  element={<Navigate to="/me/settings" replace />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
