import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { UserRole } from '../../types';

interface DashboardLayoutProps {
  requiredRole?: UserRole;
}

export function DashboardLayout({ requiredRole }: DashboardLayoutProps) {
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (user) void supabaseService.processFranchiseLifecycleAsync().catch(error => console.error('Franchise lifecycle check failed:', error));
  }, [user?.id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/baliuag-logo.png" alt="City of Baliwag" style={{ height: '64px', width: 'auto', marginBottom: '1rem', opacity: 0.85 }} />
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const roleMatches = !requiredRole || 
    user.role === requiredRole ||
    (requiredRole === 'admin' && (user.role === 'admin' || user.role === 'franchise_officer')) ||
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
      case 'franchise_officer':
        return <Navigate to="/admin/applications" replace />;
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
