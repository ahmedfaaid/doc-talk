import { useAuth } from '@/context/auth';
import { PropsWithChildren, useEffect } from 'react';
import { useNavigate } from 'react-router';

interface ProtectedRouteProps extends PropsWithChildren {}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.user === null && auth.token === null) {
      navigate('/login', { replace: true });
    }
  }, [navigate, auth]);

  return children;
}
