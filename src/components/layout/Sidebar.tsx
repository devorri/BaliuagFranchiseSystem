import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, FilePlus, CreditCard, Shield,
  ChevronLeft, ChevronRight, LogOut, QrCode, AlertTriangle,
  CheckCircle2, BellRing, RefreshCw, BarChart3, Wrench
} from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
  const { user, isTodaPresident, isAdmin, isOperator, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const driverLinks = [
    { to: '/driver', icon: LayoutDashboard, label: 'Dashboard & QR' },
    { to: '/driver/requirements', icon: FilePlus, label: 'Submit Requirements' },
    { to: '/driver/inspection', icon: Wrench, label: 'Inspection & Stenciling' },
    { to: '/driver/payment', icon: CreditCard, label: 'Payment of Fees (GCash/Cash)' },
    { to: '/driver/toda-status', icon: CheckCircle2, label: 'TODA Line Status' },
  ];

  const todaLinks = [
    { to: '/toda', icon: LayoutDashboard, label: 'TODA Overview' },
    { to: '/toda/approvals', icon: CheckCircle2, label: 'Driver Approvals' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Admin Overview' },
    { to: '/admin/applications', icon: FileText, label: 'Review Applications' },
    { to: '/admin/franchises', icon: Shield, label: 'Franchise Registry' },
    { to: '/admin/penalties', icon: AlertTriangle, label: 'Penalty Management' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports & Analytics' },
  ];

  const operatorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Operator Dashboard' },
    { to: '/dashboard/requirements', icon: FilePlus, label: 'Franchise Application' },
    { to: '/dashboard/gcash-payment', icon: QrCode, label: 'GCash QR Payment' },
    { to: '/dashboard/renewal', icon: RefreshCw, label: 'Franchise Renewal' },
    { to: '/dashboard/sms-notifications', icon: BellRing, label: 'SMS Notifications' },
  ];

  let links = driverLinks;
  let roleTitle = 'Tricycle Driver';

  if (isAdmin) {
    links = adminLinks;
    roleTitle = 'City Administrator';
  } else if (isTodaPresident) {
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
            <span className="sidebar__brand-name">Lungsod ng Baliwag</span>
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
        <button className="sidebar__logout" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
