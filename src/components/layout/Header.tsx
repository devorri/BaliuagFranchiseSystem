import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from '../../services/storageService';
import type { Notification } from '../../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = user ? getUnreadNotificationCount(user.id) : 0;
  const notifications = user ? getNotifications(user.id).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => setIsDropdownOpen(!isDropdownOpen);

  const handleRead = (id: string) => {
    markNotificationRead(id);
  };

  const handleReadAll = () => {
    if (user) {
      markAllNotificationsRead(user.id);
      setIsDropdownOpen(false);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green" />;
      case 'warning': return <AlertTriangle size={16} className="text-orange" />;
      default: return <Info size={16} className="text-blue" />;
    }
  };

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__left">
        <h1 className="dashboard-header__title">{title}</h1>
        {subtitle && <p className="dashboard-header__subtitle">{subtitle}</p>}
      </div>
      <div className="dashboard-header__right">
        <div className="notif-wrapper" ref={dropdownRef}>
          <button 
            className={`dashboard-header__notif ${isDropdownOpen ? 'active' : ''}`} 
            onClick={handleToggle}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="dashboard-header__notif-badge">{unreadCount}</span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="notif-dropdown">
              <div className="notif-dropdown__header">
                <h3>Notifications</h3>
                {unreadCount > 0 && <span className="notif-count">{unreadCount} New</span>}
              </div>
              <div className="notif-dropdown__body">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={32} />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => handleRead(n.id)}
                    >
                      <div className="notif-item__icon">
                        {getIcon(n.type)}
                      </div>
                      <div className="notif-item__content">
                        <p className="notif-item__title">{n.title}</p>
                        <p className="notif-item__message">{n.message}</p>
                        <span className="notif-item__time">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      {!n.read && <div className="notif-item__dot"></div>}
                    </div>
                  ))
                )}
              </div>
              <div className="notif-dropdown__footer">
                <button className="btn btn--ghost btn--sm w-full" onClick={handleReadAll}>
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="dashboard-header__user">
          <span className="dashboard-header__greeting">
            Welcome, <strong>{user?.firstName}</strong>
          </span>
        </div>
      </div>
    </header>
  );
}
