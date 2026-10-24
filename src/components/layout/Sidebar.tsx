import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, FilePlus, Shield,
  ChevronLeft, ChevronRight, LogOut, QrCode, AlertTriangle,
  CheckCircle2, BellRing, RefreshCw, BarChart3,
  Users, Megaphone, Award
} from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
  const { user, isPresident, isTodaPresident, isAdmin, isOperator, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const todaLinks = [
    { to: '/toda', icon: LayoutDashboard, label: 'TODA Overview' },
    { to: '/toda/approvals', icon: CheckCircle2, label: 'Driver Approvals' },
  ];

  // Admin Homepage is set to Accounts & Security
  const adminLinks = [
    { to: '/admin/accounts', icon: Users, label: 'Accounts & Security' },
    { to: '/admin/overview', icon: LayoutDashboard, label: 'Admin Dashboard' },
    { to: '/admin/applications', icon: FileText, label: 'Review Applications' },
    { to: '/admin/content', icon: Megaphone, label: 'Content & Ads' },
    { to: '/admin/franchises', icon: Shield, label: 'Franchise Registry' },
    { to: '/admin/penalties', icon: AlertTriangle, label: 'Overdue Penalties' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports & Analytics' },
  ];

  const operatorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Operator Dashboard' },
    { to: '/dashboard/requirements', icon: FilePlus, label: 'Franchise Application' },
    { to: '/dashboard/gcash-payment', icon: QrCode, label: 'GCash QR Payment' },
    { to: '/dashboard/renewal', icon: RefreshCw, label: 'Franchise Renewal' },
    { to: '/dashboard/certification', icon: Award, label: 'Franchise Certification' },
    { to: '/dashboard/sms-notifications', icon: BellRing, label: 'SMS Notifications' },
  ];

  let links = operatorLinks;
  let roleTitle = 'Franchise Operator';

  if (isAdmin) {
    links = adminLinks;
    roleTitle = 'City Administrator';
  } else if (user?.role === 'franchise_officer') {
    links = [
      { to: '/admin/applications', icon: FileText, label: 'Review Applications' },
      { to: '/admin/franchises', icon: Shield, label: 'Franchise Registry' },
      { to: '/admin/overview', icon: LayoutDashboard, label: 'Admin Dashboard' },
      { to: '/admin/reports', icon: BarChart3, label: 'Reports & Analytics' },
      { to: '/admin/penalties', icon: AlertTriangle, label: 'Overdue Penalties' },
    ];
    roleTitle = 'Franchise Officer';
  } else if (isPresident || isTodaPresident) {
    links = todaLinks;
    roleTitle = 'TODA President';
  } else if (isOperator) {
    links = operatorLinks;
    roleTitle = 'Franchise Operator';
  }

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__brand">
        <img src="/baliuag-logo.png" alt="Baliuag Seal" className="sidebar__logo-img" />
        {!collapsed && (
          <div>
            <span className="sidebar__brand-name">City of Baliwag</span>
            <span className="sidebar__brand-sub">Franchise & MTOP</span>
          </div>
        )}
      </div>

      <button
        className="sidebar__toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#94a3b8',
          margin: '0.5rem 1rem',
          padding: '0.25rem',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <nav className="sidebar__nav">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/driver' || link.to === '/toda' || link.to === '/admin' || link.to === '/dashboard'}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            title={collapsed ? link.label : undefined}
          >
            <link.icon size={20} />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        {!collapsed && user && (
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <span className="sidebar__user-name">{user.firstName} {user.lastName}</span>
              <span className="sidebar__user-role">{roleTitle}</span>
            </div>
          </div>
        )}
        <button className="sidebar__logout" onClick={() => setShowLogoutModal(true)} title="Sign Out">
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowLogoutModal(false)}>
          <div
            className="glass-container modal-glass-content"
            style={{ maxWidth: '420px', padding: '2rem', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <LogOut size={26} color="#f87171" />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
              Sign Out Confirmation
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.75rem' }}>
              Are you sure you want to log out of your Baliuag Franchise System account? You will need to enter your credentials again to log in.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="btn-glass"
                style={{ padding: '0.75rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="btn-glass"
                style={{
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.25)',
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  color: '#fca5a5',
                  fontWeight: 700
                }}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
