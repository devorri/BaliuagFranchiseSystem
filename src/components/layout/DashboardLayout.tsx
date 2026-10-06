import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { UserRole } from '../../types';

interface DashboardLayoutProps {
  requiredRole?: UserRole;
}

export function DashboardLayout({ requiredRole }: DashboardLayoutProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const roleMatches = !requiredRole || 
    user.role === requiredRole ||
    ((requiredRole === 'toda_president' || requiredRole === 'president') && 
     (user.role === 'toda_president' || user.role === 'president'));

  if (!roleMatches) {
    // Redirect based on actual role
    switch (user.role) {
      case 'driver':
        return <Navigate to="/driver" replace />;
      case 'president':
      case 'toda_president':
        return <Navigate to="/toda" replace />;
      case 'admin':
        return <Navigate to="/admin/accounts" replace />;
      case 'operator':
        return <Navigate to="/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
