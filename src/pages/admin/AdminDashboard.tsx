import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import type { Application, Franchise, Penalty } from '../../types';
import { ShieldCheck, FileText, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const { } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<Application[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);

  useEffect(() => {
    setApplications(storage.getApplications());
    setFranchises(storage.getFranchises());
    setPenalties(storage.getPenalties());
  }, []);

  const pendingAdminReviews = applications.filter(a => a.status === 'pending_admin_approval' || (a.treasurerPayment?.paid && a.todaApproval?.routeFeePaid && a.status !== 'approved'));
  const activeFranchisesCount = franchises.filter(f => f.status === 'active').length;
  const expiredFranchisesCount = franchises.filter(f => f.status === 'expired').length;
  const totalPenaltiesCount = penalties.length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Admin Hero Header */}
      <div className="glass-container dashboard-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="pill-badge pill-orange">Municipal Admin Portal</span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Lungsod ng Baliwag</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
              Admin Executive Dashboard
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '700px' }}>
              Pagsusuri ng **Requirements & Fees**, **MTOP Approval**, **Franchise Monitoring**, **Penalty Management**, at **Report Generation**.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/admin/applications')} className="btn-glass btn-primary-glass">
              <FileText size={18} /> Review Applications ({pendingAdminReviews.length})
            </button>
            <button onClick={() => navigate('/admin/penalties')} className="btn-glass btn-orange-glass">
              <AlertTriangle size={18} /> Record Penalties
            </button>
          </div>
        </div>

        {/* Hero Stats */}
        <div className="hero-stats-grid">
          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8' }}>
              <Clock size={24} />
            </div>
            <div>
              <div className="stat-val">{pendingAdminReviews.length}</div>
              <div className="stat-lbl">Pending Admin Approval</div>
            </div>
          </div>

          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="stat-val">{activeFranchisesCount}</div>
              <div className="stat-lbl">Active Franchises</div>
            </div>
          </div>

          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="stat-val">{expiredFranchisesCount}</div>
              <div className="stat-lbl">Expired Franchises</div>
            </div>
          </div>

          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c' }}>
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="stat-val">{totalPenaltiesCount}</div>
              <div className="stat-lbl">Total Recorded Penalties</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Pending MTOP Reviews & Quick Penalties */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem' }}>
        
        {/* Pending Reviews Card */}
        <div className="glass-container" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Applications Ready for MTOP Approval</h3>
            <span className="pill-badge pill-cyan">{pendingAdminReviews.length} Queue</span>
          </div>

          <div className="glass-table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Applicant / Driver</th>
                  <th>Plate / TODA</th>
                  <th>TODA Approval</th>
                  <th>Treasurer Fee</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingAdminReviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                      Walang nakapilang aplikasyon na nangangailangan ng final approval.
                    </td>
                  </tr>
                ) : (
                  pendingAdminReviews.map(app => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 700 }}>{app.driverName || app.applicantName}</td>
                      <td>{app.plateNumber} ({app.todaName.split(' ')[0]})</td>
                      <td>
                        {app.todaApproval?.routeFeePaid ? (
                          <span className="pill-badge pill-purple">Approved</span>
                        ) : (
                          <span className="pill-badge pill-orange">Pending</span>
                        )}
                      </td>
                      <td>
                        {app.treasurerPayment?.paid ? (
                          <span className="pill-badge pill-emerald">Paid</span>
                        ) : (
                          <span className="pill-badge pill-orange">Pending</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => navigate('/admin/applications')}
                          className="btn-glass btn-primary-glass"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          Review & Grant MTOP
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Penalty Records Brief */}
        <div className="glass-container" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Penalty Management Quick Summary</h3>
            <button onClick={() => navigate('/admin/penalties')} className="btn-glass" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
              Manage All →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {penalties.slice(0, 4).map(p => (
              <div key={p.id} className="glass-panel" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.9rem' }}>{p.driverName} ({p.plateNumber})</strong>
                  <span style={{ fontSize: '0.78rem', color: '#fb7185' }}>{p.violationType} - ₱{p.amount.toFixed(2)}</span>
                </div>
                <span className={`pill-badge ${p.status === 'paid' ? 'pill-emerald' : 'pill-rose'}`}>
                  {p.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
