import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface DashboardLayoutProps {
  requiredRole?: 'operator' | 'admin' | 'passenger';
}

export function DashboardLayout({ requiredRole }: DashboardLayoutProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    const redirectPath = user.role === 'admin' 
      ? '/admin' 
      : user.role === 'passenger' 
        ? '/passenger' 
        : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
