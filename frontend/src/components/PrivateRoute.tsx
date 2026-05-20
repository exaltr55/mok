import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  requireOnboarded?: boolean;
  /** Which user_type this route is for. Defaults to "employee" — employer
   *  admins are redirected to /employer, and vice versa, so each portal stays
   *  in its own URL space. */
  audience?: 'employee' | 'employer_admin' | 'platform_admin';
  /** Where unauthenticated users land. Defaults to /login. Employer routes
   *  pass "/employer/login". */
  loginPath?: string;
  /** Where un-onboarded users go. Defaults to /onboarding. */
  onboardingPath?: string;
}

/**
 * Gates child routes on authentication and user type.
 *
 * If the signed-in user does not match ``audience``, they are redirected to
 * the right portal's landing — keeping employee and employer URL spaces
 * cleanly separated.
 */
export default function PrivateRoute({
  requireOnboarded = true,
  audience = 'employee',
  loginPath = '/login',
  onboardingPath = '/onboarding',
}: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="mok-loading">Drawing a breath…</div>;
  if (!isAuthenticated || !user) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  // Wrong portal? Send them to the right one's landing.
  if (audience === 'employee' && user.user_type === 'employer_admin') {
    return <Navigate to="/employer" replace />;
  }
  if (audience === 'employee' && user.user_type === 'platform_admin') {
    return <Navigate to="/admin/employers" replace />;
  }
  if (audience === 'employer_admin' && user.user_type !== 'employer_admin') {
    return <Navigate to={user.user_type === 'platform_admin' ? '/admin/employers' : '/today'} replace />;
  }
  if (audience === 'platform_admin' && user.user_type !== 'platform_admin') {
    return <Navigate to={user.user_type === 'employer_admin' ? '/employer' : '/today'} replace />;
  }

  if (requireOnboarded && !user.onboarded) {
    return <Navigate to={onboardingPath} replace />;
  }
  return <Outlet />;
}
