import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import type { SMSNotification } from '../../types';
import { Bell, Smartphone, Clock, MailOpen, ShieldCheck, Loader2 } from 'lucide-react';

export function SMSNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SMSNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      void supabaseService.getSMSNotificationsAsync(user.id)
        .then(data => setNotifications(data))
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span className="pill-badge pill-cyan">
            <Bell size={13} style={{ marginRight: '0.2rem' }} /> SMS Notifications Inbox
          </span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Automated Reminders</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>
          SMS Alerts & Reminders
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Receive automated alerts for **franchise renewals**, **permit expiration dates**, and **official compliance notices**.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isLoading ? (
            <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <Loader2 size={32} color="#38bdf8" className="spin-icon" />
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <MailOpen size={40} color="#64748b" style={{ margin: '0 auto 0.75rem auto', opacity: 0.6 }} />
              <p style={{ color: '#f8fafc', fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                No SMS Notifications Found
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
                Your SMS inbox is currently empty. Automated updates regarding your MTOP applications and renewals will appear here.
              </p>
            </div>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                className="glass-panel" 
                style={{ 
                  padding: '1.25rem 1.5rem', 
                  borderLeft: '4px solid #22c55e',
                  background: 'rgba(12, 28, 18, 0.6)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={16} color="#4ade80" />
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                      {n.title}
                    </h4>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} /> {new Date(n.sentAt).toLocaleString()}
                  </span>
                </div>

                <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0.4rem 0' }}>
                  {n.message}
                </p>

                <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#38bdf8' }}>
                  <Smartphone size={14} />
                  <span>Sent to: <strong>{n.recipientPhone}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
