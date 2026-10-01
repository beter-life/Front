import { Navigate, Outlet, useLocation } from 'react-router';
import { Loading } from '../components/feedback';
import { useAuthV2 } from './hooks';

export function ProtectedRouteV2() {
  const { status } = useAuthV2();
  const location = useLocation();
  if (status === 'loading') return <main id="main" className="mx-auto max-w-xl p-8"><Loading /></main>;
  if (status === 'unauthenticated') return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}
