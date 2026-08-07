import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import type { Franchise, SMSNotification } from '../../types';
import { ShieldCheck, RefreshCw, QrCode, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OperatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [smsNotifs, setSmsNotifs] = useState<SMSNotification[]>([]);

  useEffect(() => {
    if (user) {
      const allFranchises = storage.getFranchises();
      const myFranchises = allFranchises.filter(f => f.operatorId === user.id || f.operatorName.toLowerCase().includes(user.lastName.toLowerCase()));
      setFranchises(myFranchises.length > 0 ? myFranchises : allFranchises.slice(0, 2));

      setSmsNotifs(storage.getSMSNotifications(user.id));
    }
  }, [user]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Operator Hero */}
      <div className="glass-container dashboard-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="pill-badge pill-emerald">Franchise Operator Portal</span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Lungsod ng Baliwag</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
              Welcome, Operator {user?.firstName}!
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px' }}>
              Subaybayan ang iyong **Franchise Status**, makatanggap ng **Renewal Reminders**, i-manage ang **Driver Records**, at magbayad gamit ang **GCash QR Code**.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dashboard/gcash-payment')} className="btn-glass btn-emerald-glass">
              <QrCode size={18} /> GCash QR Payment
            </button>
            <button onClick={() => navigate('/dashboard/renewal')} className="btn-glass btn-orange-glass">
              <RefreshCw size={18} /> Franchise Renewal
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="hero-stats-grid">
          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="stat-val">{franchises.filter(f => f.status === 'active').length} Active</div>
              <div className="stat-lbl">Franchise Status</div>
            </div>
          </div>

          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c' }}>
              <Clock size={24} />
            </div>
            <div>
              <div className="stat-val">30 Days</div>
              <div className="stat-lbl">Renewal Reminder</div>
            </div>
          </div>

          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8' }}>
              <Users size={24} />
            </div>
            <div>
              <div className="stat-val">{franchises.length} Registered</div>
              <div className="stat-lbl">Driver Records</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Franchise Records & SMS Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.75rem' }}>
        
        {/* Franchise & Driver Records Card */}
        <div className="glass-container" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Mga Franchise at Driver Records</h3>
            <span className="pill-badge pill-cyan">{franchises.length} Units</span>
          </div>

          <div className="glass-table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>MTOP Permit #</th>
                  <th>Assigned Driver</th>
                  <th>Plate Number</th>
                  <th>Expiration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {franchises.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 800, color: '#38bdf8' }}>{f.mtopNumber}</td>
                    <td style={{ fontWeight: 700 }}>{f.driverName}</td>
                    <td>{f.plateNumber}</td>
                    <td style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{new Date(f.expiresAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`pill-badge ${f.status === 'active' ? 'pill-emerald' : 'pill-rose'}`}>
                        {f.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SMS Notifications Inbox Brief */}
        <div className="glass-container" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>SMS Notification Alerts</h3>
            <button onClick={() => navigate('/dashboard/sms-notifications')} className="btn-glass" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
              View Inbox ({smsNotifs.length}) →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {smsNotifs.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem' }}>
                Walang natanggap na SMS alerts sa kasalukuyan.
              </p>
            ) : (
              smsNotifs.slice(0, 3).map(n => (
                <div key={n.id} className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #38bdf8' }}>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                    {n.title}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.3' }}>
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
