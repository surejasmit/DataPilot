import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '@/lib/api';

export default function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
}
