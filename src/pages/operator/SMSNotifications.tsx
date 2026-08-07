import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import type { SMSNotification } from '../../types';


export function SMSNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SMSNotification[]>([]);

  useEffect(() => {
    if (user) {
      setNotifications(storage.getSMSNotifications(user.id));
    }
  }, [user]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-cyan">SMS Notifications Inbox</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Automated Reminders</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          SMS Alerts & Paalala
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Nakakatanggap ng paalala sa **renewal**, **expiration**, at **penalties**.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
              Walang SMS notifications sa inbox.
            </p>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #06b6d4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>{n.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(n.sentAt).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {n.message}
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#38bdf8' }}>
                  Ipinadala sa: {n.recipientPhone}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
