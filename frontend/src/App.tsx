import { Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import About from './pages/About';
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

            {/* Authenticated but onboarding allowed */}
            <Route element={<PrivateRoute requireOnboarded={false} />}>
              <Route path="onboarding" element={<Onboarding />} />
            </Route>

            {/* Authenticated + onboarded */}
            <Route element={<PrivateRoute />}>
              <Route path="today" element={<Today />} />
              <Route path="practices" element={<Practices />} />
              <Route path="practices/:key" element={<PracticeDetail />} />
              <Route path="practices/:key/session" element={<PracticeSession />} />
              <Route path="journal" element={<Journal />} />
              <Route path="history" element={<History />} />
              <Route path="learn" element={<Learn />} />
              <Route path="learn/:slug" element={<LearnModule />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
