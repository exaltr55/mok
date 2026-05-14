import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  requireOnboarded?: boolean;
}

/**
 * Gates child routes on authentication.
 *
 * If ``requireOnboarded`` is true (the default for most app pages), users who
 * haven't completed onboarding are redirected to /onboarding. The onboarding
 * route itself uses ``requireOnboarded={false}`` so it doesn't loop.
 */
export default function PrivateRoute({ requireOnboarded = true }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="mok-loading">Drawing a breath…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (requireOnboarded && user && !user.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}
