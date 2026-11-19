import { useAuth } from '../../context/AuthContext';
import { Bell, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as storage from '../../services/storageService';
import * as supabaseService from '../../services/supabaseService';
import type { SMSNotification } from '../../types';
import { CLOCK_CHANGED_EVENT } from '../../services/clock';
import { DateNavigator } from './DateNavigator';

export function Header() {
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<SMSNotification[]>([]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const isAdminView = user.role === 'admin' || user.role === 'franchise_officer';
      const list = await supabaseService.getSMSNotificationsAsync(isAdminView ? undefined : user.id);
      list.sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime());
      setNotifications(list);
    } catch {
      const fallback = storage.getSMSNotifications(user.role === 'admin' ? undefined : user.id);
      setNotifications(fallback);
    }
  };

  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => void loadNotifications(), 4000);
    const onClockChange = () => void loadNotifications();
    window.addEventListener(CLOCK_CHANGED_EVENT, onClockChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener(CLOCK_CHANGED_EVENT, onClockChange);
    };
  }, [user?.id, user?.role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'driver':
        return <span className="pill-badge pill-cyan">Tricycle Driver</span>;
      case 'president':
      case 'toda_president':
        return <span className="pill-badge pill-purple">TODA President</span>;
      case 'franchise_officer':
        return <span className="pill-badge pill-cyan">Franchise Officer</span>;
      case 'admin':
        return <span className="pill-badge pill-orange">Municipal Admin</span>;
      case 'operator':
        return <span className="pill-badge pill-emerald">Franchise Operator</span>;
      default:
        return null;
    }
  };

  return (
    <header className="header-bar">
      <div className="header-brand">
        <img src="/baliuag-logo.png" alt="City of Baliwag Logo" className="header-logo-img" />
        <div>
          <h2 className="header-title-text">City of Baliwag</h2>
          <span className="header-sub-text">Tricycle Franchise & MTOP Management System</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user?.role === 'driver' && (
          <a
            href="/driver/payment"
            className="btn-glass btn-emerald-glass"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            💳 Pay Fees (GCash/Cash)
          </a>
        )}

        {user?.role === 'operator' && (
          <a
            href="/dashboard/gcash-payment"
            className="btn-glass btn-emerald-glass"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            📱 GCash QR Payment
          </a>
        )}

        <DateNavigator />

        {getRoleBadge()}

        {/* Notifications Icon */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              void loadNotifications();
            }}
            className="btn-glass"
            style={{ padding: '0.5rem', borderRadius: '12px' }}
            title="SMS & System Notifications"
          >
            <Bell size={20} color="#38bdf8" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#fff',
                borderRadius: '999px',
                padding: '2px 6px',
                fontSize: '0.68rem',
                fontWeight: 800,
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="glass-panel" style={{
              position: 'absolute',
              right: 0,
              top: '52px',
              width: '390px',
              padding: '1.25rem',
              zIndex: 999,
              background: 'linear-gradient(165deg, rgba(8, 22, 15, 0.98) 0%, rgba(5, 14, 10, 0.99) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.38)',
              borderRadius: '18px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>SMS & System Notifications</h4>
                <span className="pill-badge pill-cyan" style={{ fontSize: '0.72rem' }}>{notifications.length} alerts</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', padding: '1.25rem 0' }}>
                    No notifications available.
                  </p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '0.9rem 1rem',
                      borderRadius: '12px',
                      background: n.type === 'expiration'
                        ? 'rgba(52, 16, 20, 0.96)'
                        : n.type === 'renewal_reminder'
                        ? 'rgba(48, 32, 10, 0.96)'
                        : 'rgba(13, 35, 26, 0.96)',
                      border: `1px solid ${n.type === 'expiration' ? 'rgba(239, 68, 68, 0.5)' : n.type === 'renewal_reminder' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(56, 189, 248, 0.35)'}`,
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                    }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff', marginBottom: '0.3rem' }}>
                        {n.title}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.45', margin: '0.25rem 0' }}>
                        {n.message}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#38bdf8', fontWeight: 600 }}>
                          <Smartphone size={12} /> {n.recipientPhone || 'SMS Sent'}
                        </span>
                        <span style={{ color: '#cbd5e1' }}>{new Date(n.sentAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile brief */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>
                {user.firstName} {user.lastName}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {user.username}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
