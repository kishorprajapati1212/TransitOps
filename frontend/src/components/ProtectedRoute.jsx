import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';

export default function ProtectedRoute({ children }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!user)
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-500" />
      </div>
    );

  return children;
}
