import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import * as storage from '../../services/storageService';

export function Header() {
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  const notifications = user ? storage.getSMSNotifications(user.id) : [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'driver':
        return <span className="pill-badge pill-cyan">Tricycle Driver</span>;
      case 'toda_president':
        return <span className="pill-badge pill-purple">TODA President</span>;
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
        <img src="/baliuag-logo.png" alt="Lungsod ng Baliwag Logo" className="header-logo-img" />
        <div>
          <h2 className="header-title-text">Lungsod ng Baliwag</h2>
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

        {getRoleBadge()}

        {/* Notifications Icon */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="btn-glass"
            style={{ padding: '0.5rem', borderRadius: '12px' }}
            title="Notifications"
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
              top: '50px',
              width: '340px',
              padding: '1.25rem',
              zIndex: 100,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Notifications & SMS</h4>
                <span className="pill-badge pill-cyan" style={{ fontSize: '0.7rem' }}>{notifications.length} alerts</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>
                    No notifications available.
                  </p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: n.read ? 'rgba(255,255,255,0.03)' : 'rgba(6,182,212,0.12)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff', marginBottom: '0.2rem' }}>
                        {n.title}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.3' }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem', display: 'block' }}>
                        {new Date(n.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
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
