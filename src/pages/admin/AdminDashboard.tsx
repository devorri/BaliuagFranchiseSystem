import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import * as storage from '../../services/storageService';
import type { Application, Franchise, Penalty, User } from '../../types';
import { 
  ShieldCheck, FileText, AlertTriangle, Clock, BarChart3, 
  Users, CheckCircle2, Receipt, ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const { } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<Application[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [apps, frs, usersList] = await Promise.all([
          supabaseService.getApplicationsAsync(),
          supabaseService.getFranchisesAsync(),
          supabaseService.getUsersAsync(),
        ]);
        setApplications(apps);
        setFranchises(frs);
        setUsers(usersList);
        setPenalties(storage.getPenalties());
      } catch {
        setApplications(storage.getApplications());
        setFranchises(storage.getFranchises());
        setUsers(storage.getUsers());
        setPenalties(storage.getPenalties());
      }
    }
    loadData();
  }, []);

  const pendingAdminReviews = applications.filter(a => a.status === 'pending_admin_approval' || (a.treasurerPayment?.paid && a.todaApproval?.routeFeePaid && a.status !== 'approved'));
  const activeFranchisesCount = franchises.filter(f => f.status === 'active').length;
  const expiredFranchisesCount = franchises.filter(f => f.status === 'expired').length;
  const totalPenaltiesCount = penalties.length;
  
  // Total Registered (Drivers + Operators registered in system)
  const registeredDrivers = users.filter(u => u.role === 'driver').length;
  const registeredOperators = users.filter(u => u.role === 'operator').length;
  const totalRegisteredUsers = registeredDrivers + registeredOperators;
  const totalRegisteredFranchises = franchises.length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      {/* Admin Hero Header */}
      <div className="glass-container dashboard-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="pill-badge pill-orange">Municipal Admin Portal</span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>City of Baliuag</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
              Admin Executive Dashboard
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '700px' }}>
              Executive overview of <strong>Total Registered</strong>, <strong>Requirements Review</strong>, <strong>MTOP Approval</strong>, and <strong>Transaction Records</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/admin/accounts')} className="btn-glass" style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}>
              <Users size={18} /> Manage Accounts
            </button>
            <button onClick={() => navigate('/admin/applications')} className="btn-glass btn-primary-glass">
              <FileText size={18} /> Review Applications ({pendingAdminReviews.length})
            </button>
          </div>
        </div>

        {/* Hero Stats - Includes Total Registered Count */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
          gap: '1.25rem', 
          marginTop: '2rem' 
        }}>
          {/* Total Registered Stat Card */}
          <div className="glass-card hero-stat-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
              <Users size={24} />
            </div>
            <div>
              <div className="stat-val" style={{ color: '#38bdf8' }}>{totalRegisteredUsers}</div>
              <div className="stat-lbl" style={{ fontWeight: 700 }}>Total Registered</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                <strong style={{ color: '#38bdf8' }}>{registeredDrivers}</strong> Drivers • <strong style={{ color: '#38bdf8' }}>{registeredOperators}</strong> Operators
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '0.15rem' }}>
                ({totalRegisteredFranchises} Franchises in record)
              </span>
            </div>
          </div>

          <div className="glass-card hero-stat-card" style={{ borderLeft: '4px solid #facc15' }}>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(250, 204, 21, 0.2)', color: '#facc15' }}>
              <Clock size={24} />
            </div>
            <div>
              <div className="stat-val" style={{ color: '#facc15' }}>{pendingAdminReviews.length}</div>
              <div className="stat-lbl">Pending Admin Approval</div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ready for MTOP approval</span>
            </div>
          </div>

          <div className="glass-card hero-stat-card" style={{ borderLeft: '4px solid #34d399' }}>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="stat-val" style={{ color: '#34d399' }}>{activeFranchisesCount}</div>
              <div className="stat-lbl">Active Franchises</div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Legal & validated units</span>
            </div>
          </div>

          <div className="glass-card hero-stat-card" style={{ borderLeft: '4px solid #fb7185' }}>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="stat-val" style={{ color: '#fb7185' }}>{expiredFranchisesCount}</div>
              <div className="stat-lbl">Expired Franchises</div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Renewal alerts pending</span>
            </div>
          </div>

          <div className="glass-card hero-stat-card" style={{ borderLeft: '4px solid #fb923c' }}>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c' }}>
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="stat-val" style={{ color: '#fb923c' }}>{totalPenaltiesCount}</div>
              <div className="stat-lbl">Total Penalties</div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Recorded violations</span>
            </div>
          </div>
        </div>
      </div>

      {/* TASK 1: FIXED ALIGNMENT - Main Section & Transactions Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
        
        {/* Top Split: Applications for MTOP & Recent Penalties */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', 
          gap: '1.75rem',
          alignItems: 'start'
        }}>
          
          {/* Applications Card */}
          <div className="glass-container" style={{ padding: '1.75rem', width: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>Applications for Final MTOP Approval</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Queued after TODA & Treasurer approval</p>
              </div>
              <span className="pill-badge pill-cyan">{pendingAdminReviews.length} Queue</span>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="glass-table" style={{ width: '100%', minWidth: '500px' }}>
                <thead>
                  <tr>
                    <th>Applicant / Driver</th>
                    <th>Plate / TODA</th>
                    <th>TODA Approval</th>
                    <th>Treasurer Fee</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAdminReviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 1rem' }}>
                        No pending applications require approval at this time.
                      </td>
                    </tr>
                  ) : (
                    pendingAdminReviews.slice(0, 5).map(app => (
                      <tr key={app.id}>
                        <td style={{ fontWeight: 700, color: '#ffffff' }}>{app.driverName || app.applicantName}</td>
                        <td>{app.plateNumber} ({app.todaName ? app.todaName.split(' ')[0] : 'TODA'})</td>
                        <td>
                          {app.todaApproval?.routeFeePaid || app.presidentEndorsed ? (
                            <span className="pill-badge pill-purple">Endorsed</span>
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
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => navigate('/admin/applications')}
                            className="btn-glass btn-primary-glass"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                          >
                            Review & Approve
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Penalty Quick Summary */}
          <div className="glass-container" style={{ padding: '1.75rem', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>Traffic Penalty Records</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Latest violation records</p>
              </div>
              <button onClick={() => navigate('/admin/penalties')} className="btn-glass" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                View All →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {penalties.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
                  No penalties recorded.
                </div>
              ) : (
                penalties.slice(0, 4).map(p => (
                  <div key={p.id} className="glass-panel" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.88rem' }}>{p.driverName} ({p.plateNumber})</strong>
                      <span style={{ fontSize: '0.75rem', color: '#fb7185' }}>{p.violationType} • ₱{p.amount.toFixed(2)}</span>
                    </div>
                    <span className={`pill-badge ${p.status === 'paid' ? 'pill-emerald' : 'pill-rose'}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* TASK 1: Full-Width Cleanly Aligned Transactions & Activity Section */}
        <div className="glass-container" style={{ padding: '1.75rem', width: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={20} color="#34d399" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  System Transactions & Payment History
                </h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Detailed record of all payments (MTOP base fee, TODA fee, stenciling, and penalties).
              </p>
            </div>

            <button onClick={() => navigate('/admin/reports')} className="btn-glass" style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}>
              Full Financial Report <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="glass-table" style={{ width: '100%', minWidth: '700px' }}>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Payer Name</th>
                  <th>Fee Type</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.filter(a => a.treasurerPayment?.paid).length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No transaction records found.
                    </td>
                  </tr>
                ) : (
                  applications
                    .filter(a => a.treasurerPayment?.paid)
                    .slice(0, 6)
                    .map(a => (
                      <tr key={a.id}>
                        <td style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{a.treasurerPayment?.orNumber || a.id}</td>
                        <td style={{ fontWeight: 700, color: '#ffffff' }}>{a.applicantName}</td>
                        <td>MTOP Franchise Processing & Stenciling</td>
                        <td>
                          <span style={{ 
                            textTransform: 'uppercase', 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            color: a.treasurerPayment?.paymentMethod === 'gcash' ? '#38bdf8' : '#e2e8f0' 
                          }}>
                            {a.treasurerPayment?.paymentMethod || 'Treasurer Cash'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: '#4ade80' }}>
                          ₱{(a.totalFee || a.treasurerPayment?.amount || 950).toFixed(2)}
                        </td>
                        <td style={{ color: '#cbd5e1' }}>
                          {a.treasurerPayment?.paidAt ? new Date(a.treasurerPayment.paidAt).toLocaleDateString() : new Date().toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="pill-badge pill-emerald">
                            <CheckCircle2 size={12} /> PAID
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
