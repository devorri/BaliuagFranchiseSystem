import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, FilePlus, CreditCard, User, Receipt,
  ClipboardList, Users, Settings, MessageSquare, BarChart3, Shield,
  ChevronLeft, ChevronRight, LogOut, Bike, QrCode, Star
} from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const operatorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/apply', icon: FilePlus, label: 'New Application' },
    { to: '/dashboard/applications', icon: FileText, label: 'My Applications' },
    { to: '/dashboard/status', icon: ClipboardList, label: 'Track Status' },
    { to: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
    { to: '/dashboard/receipts', icon: Receipt, label: 'Receipts' },
    { to: '/dashboard/profile', icon: User, label: 'My Profile & QR' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/applications', icon: FileText, label: 'Applications' },
    { to: '/admin/franchises', icon: Shield, label: 'Franchises' },
    { to: '/admin/drivers', icon: Users, label: 'Drivers' },
    { to: '/admin/fees', icon: Settings, label: 'Fee Management' },
    { to: '/admin/feedback', icon: MessageSquare, label: 'Feedback' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  ];

  const passengerLinks = [
    { to: '/passenger', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/passenger/scan', icon: QrCode, label: 'Scan / Verify' },
    { to: '/passenger/feedback', icon: MessageSquare, label: 'Give Feedback' },
    { to: '/passenger/history', icon: Star, label: 'My Reviews' },
    { to: '/passenger/profile', icon: User, label: 'My Profile' },
  ];

  const links = isAdmin ? adminLinks : user?.role === 'passenger' ? passengerLinks : operatorLinks;

  const roleLabel = isAdmin ? 'Administrator' : user?.role === 'passenger' ? 'Passenger' : 'Operator';

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Bike size={28} />
        </div>
        {!collapsed && (
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">Baliuag City</span>
            <span className="sidebar__brand-sub">Tricycle System</span>
          </div>
        )}
      </div>

      <button
        className="sidebar__toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <nav className="sidebar__nav">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard' || link.to === '/admin' || link.to === '/passenger'}
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
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user.firstName} {user.lastName}</span>
              <span className="sidebar__user-role">{roleLabel}</span>
            </div>
          </div>
        )}
        <button className="sidebar__logout" onClick={handleLogout} title="Logout">
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
