import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/use-services';
import { Loading, Feedback } from '../components/feedback';
import { Button } from '../components/ui/button';
export function ProtectedRoute() {
  const auth = useAuth(); const location = useLocation();
  if (auth.status === 'loading') return <main id="main" className="mx-auto max-w-xl p-8"><Loading /></main>;
  if (auth.status === 'error') return <main id="main" className="mx-auto max-w-xl space-y-5 p-8"><Feedback>Não foi possível carregar sua sessão.</Feedback><Button onClick={() => window.location.reload()}>Tentar novamente</Button></main>;
  if (auth.recovery) return <Navigate to="/auth/recovery" replace />;
  if (auth.status !== 'authenticated') return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}
