import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import type { Application } from '../../types';
import { Award, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TodaDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    const apps = storage.getApplications();
    setApplications(apps);
  }, []);

  const pendingApprovals = applications.filter(a => a.status === 'pending_toda_approval' || (a.treasurerPayment?.paid && !a.todaApproval?.routeFeePaid));
  const approvedApps = applications.filter(a => a.todaApproval?.routeFeePaid);

  const totalCollectedRouteFees = approvedApps.reduce((acc, curr) => acc + (curr.todaApproval?.routeFeeAmount || 500) + (curr.todaApproval?.membershipFeeAmount || 300), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Container */}
      <div className="glass-container dashboard-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="pill-badge pill-purple">TODA President Portal</span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{user?.todaName || 'BASTODA Baliuag'}</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
              Mabuhay, Pres. {user?.lastName}!
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px' }}>
              Tumatanggap ng bayad para sa **linya (route fee)**, nagbibigay ng **approval sa aplikasyon ng driver**, at **nagpapasa sa Admin** para sa final review.
            </p>
          </div>

          <button
            onClick={() => navigate('/toda/approvals')}
            className="btn-glass btn-orange-glass"
            style={{ padding: '0.85rem 1.75rem' }}
          >
            <CheckCircle2 size={20} /> Manage Driver Approvals ({pendingApprovals.length})
          </button>
        </div>

        {/* Stats Grid */}
        <div className="hero-stats-grid">
          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c' }}>
              <Clock size={24} />
            </div>
            <div>
              <div className="stat-val">{pendingApprovals.length}</div>
              <div className="stat-lbl">Pending Driver Approvals</div>
            </div>
          </div>

          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>
              <Award size={24} />
            </div>
            <div>
              <div className="stat-val">{approvedApps.length}</div>
              <div className="stat-lbl">Approved Route Lines</div>
            </div>
          </div>

          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="stat-val">₱{totalCollectedRouteFees.toFixed(2)}</div>
              <div className="stat-lbl">Total TODA Fees Collected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Applications Queue Card */}
      <div className="glass-container" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Mga Aplikasyong Naghihintay ng TODA Approval</h3>
          <span className="pill-badge pill-purple">{pendingApprovals.length} Driver Applications</span>
        </div>

        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Plate / Body No.</th>
                <th>TODA Route</th>
                <th>Treasurer Fee</th>
                <th>Aksyon</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                    Walang nakapilang aplikasyon para sa TODA approval.
                  </td>
                </tr>
              ) : (
                pendingApprovals.map(app => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>{app.driverName || app.applicantName}</td>
                    <td style={{ color: '#38bdf8', fontWeight: 600 }}>{app.plateNumber}</td>
                    <td>{app.todaName}</td>
                    <td>
                      {app.treasurerPayment?.paid ? (
                        <span className="pill-badge pill-emerald">Paid (OR #{app.treasurerPayment.orNumber})</span>
                      ) : (
                        <span className="pill-badge pill-orange">Unpaid</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => navigate('/toda/approvals')}
                        className="btn-glass btn-primary-glass"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                      >
                        Review & Approve →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
