import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import type { Application, Penalty } from '../../types';
import { QrCode, AlertTriangle, CheckCircle2, ShieldCheck, Clock, Award, X, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    if (user) {
      const apps = storage.getApplications();
      const userApp = apps.find(a => a.applicantId === user.id || a.driverName?.toLowerCase() === `${user.firstName} ${user.lastName}`.toLowerCase());
      if (userApp) setApplication(userApp);

      const allPenalties = storage.getPenalties();
      const myPenalties = allPenalties.filter(p => p.driverId === user.id || p.driverName.toLowerCase().includes(user.lastName.toLowerCase()));
      setPenalties(myPenalties);
    }
  }, [user]);

  const getStatusPill = (status?: string) => {
    switch (status) {
      case 'approved':
        return <span className="pill-badge pill-emerald"><CheckCircle2 size={14} /> Approved (MTOP Issued)</span>;
      case 'pending_inspection':
        return <span className="pill-badge pill-cyan"><Clock size={14} /> For Stenciling & Inspection</span>;
      case 'inspection_passed':
        return <span className="pill-badge pill-cyan"><CheckCircle2 size={14} /> Inspection Cleared</span>;
      case 'pending_treasurer_payment':
        return <span className="pill-badge pill-orange"><Clock size={14} /> Pending Treasurer Fee</span>;
      case 'pending_toda_approval':
        return <span className="pill-badge pill-purple"><Clock size={14} /> Pending TODA Line Approval</span>;
      case 'pending_admin_approval':
        return <span className="pill-badge pill-orange"><Clock size={14} /> For Final Admin Review</span>;
      default:
        return <span className="pill-badge pill-orange"><Clock size={14} /> In Progress</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Container */}
      <div className="glass-container dashboard-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="pill-badge pill-cyan">Tricycle Driver Portal</span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Lungsod ng Baliwag</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
              Mabuhay, {user?.firstName}!
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px' }}>
              Subaybayan ang iyong **MTOP Application Status**, magbayad ng **Treasurer Fees**, at tingnan ang **Digital QR Code**.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {application && !application.treasurerPayment?.paid && (
              <button
                onClick={() => navigate('/driver/payment')}
                className="btn-glass btn-emerald-glass"
                style={{ padding: '0.85rem 1.5rem' }}
              >
                <CreditCard size={20} /> Pay Fees (GCash / Cash)
              </button>
            )}

            <button
              onClick={() => setShowQRModal(true)}
              className="btn-glass btn-primary-glass"
              style={{ padding: '0.85rem 1.5rem' }}
            >
              <QrCode size={20} /> View Driver QR Code
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="hero-stats-grid">
          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="stat-val">{application ? application.status === 'approved' ? 'Active' : 'In Progress' : 'No App'}</div>
              <div className="stat-lbl">MTOP Permit Status</div>
            </div>
          </div>

          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="stat-val">{penalties.filter(p => p.status === 'unpaid').length}</div>
              <div className="stat-lbl">Unpaid Penalties</div>
            </div>
          </div>

          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>
              <Award size={24} />
            </div>
            <div>
              <div className="stat-val">{user?.todaName ? user.todaName.split(' ')[0] : 'BASTODA'}</div>
              <div className="stat-lbl">Assigned TODA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.75rem' }}>
        
        {/* Application Status Card */}
        <div className="glass-container" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Aplikasyon ng MTOP</h3>
            {getStatusPill(application?.status)}
          </div>

          {application ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.8rem' }}>Application Reference</span>
                    <strong style={{ color: '#38bdf8' }}>{application.id}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.8rem' }}>Plate / Body No.</span>
                    <strong>{application.plateNumber}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.8rem' }}>Make & Model</span>
                    <strong>{application.vehicleMake} {application.vehicleModel}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.8rem' }}>TODA Route Area</span>
                    <strong>{application.todaName}</strong>
                  </div>
                </div>
              </div>

              {/* Progress Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#cbd5e1' }}>Workflow Status:</h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <span>Submission of Requirements (OR/CR, Clearance, License)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem' }}>
                  {application.inspection?.status === 'passed' ? <CheckCircle2 size={18} color="#10b981" /> : <Clock size={18} color="#06b6d4" />}
                  <span>Engine & Chassis Stenciling Inspection ({application.inspection?.status === 'passed' ? 'PASSED' : 'PENDING'})</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem' }}>
                  {application.treasurerPayment?.paid ? <CheckCircle2 size={18} color="#10b981" /> : <Clock size={18} color="#f59e0b" />}
                  <span>Treasurer’s Office Fee Payment ({application.treasurerPayment?.paid ? `OR #${application.treasurerPayment.orNumber}` : 'UNPAID'})</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem' }}>
                  {application.todaApproval?.routeFeePaid ? <CheckCircle2 size={18} color="#10b981" /> : <Clock size={18} color="#8b5cf6" />}
                  <span>TODA President Route & Membership Fee Approval ({application.todaApproval?.routeFeePaid ? 'APPROVED' : 'PENDING'})</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem' }}>
                  {application.status === 'approved' ? <CheckCircle2 size={18} color="#10b981" /> : <Clock size={18} color="#f97316" />}
                  <span>City Admin Final Review & MTOP Grant</span>
                </div>
              </div>

              {/* Action Banner for Unpaid Fees */}
              {!application.treasurerPayment?.paid && (
                <div style={{ marginTop: '0.75rem', padding: '1rem', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <strong style={{ color: '#facc15', fontSize: '0.92rem', display: 'block' }}>Kailangan ng Bayad sa Treasurer (₱600.00)</strong>
                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Maaaring magbayad via GCash o Cash sa Treasurer's Office.</span>
                  </div>
                  <button
                    onClick={() => navigate('/driver/payment')}
                    className="btn-glass btn-emerald-glass"
                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    Pay Fees Now →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#94a3b8' }}>Wala pang aktibong aplikasyon. Pumunta sa **Submit Requirements** para mag-apply.</p>
          )}
        </div>

        {/* Record of Penalties Card */}
        <div className="glass-container" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Record ng Penalties</h3>
            <span className="pill-badge pill-rose">{penalties.length} Violations</span>
          </div>

          <div className="glass-table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Violation</th>
                  <th>Halaga</th>
                  <th>Petsa</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {penalties.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                      Walang naitalang penalty. Malinis ang iyong rekor!
                    </td>
                  </tr>
                ) : (
                  penalties.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.violationType}</td>
                      <td style={{ color: '#fb7185', fontWeight: 700 }}>₱{p.amount.toFixed(2)}</td>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(p.issuedDate).toLocaleDateString()}</td>
                      <td>
                        {p.status === 'paid' ? (
                          <span className="pill-badge pill-emerald">PAID</span>
                        ) : (
                          <span className="pill-badge pill-rose">UNPAID</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* QR Code Display Modal */}
      {showQRModal && (
        <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="glass-container modal-glass-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Digital Driver QR Code</h3>
              <button onClick={() => setShowQRModal(false)} className="btn-glass" style={{ padding: '0.4rem' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              <div style={{
                background: '#ffffff',
                padding: '1.25rem',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=BALIUAG-DRIVER|ID:${user?.id}|NAME:${user?.firstName}-${user?.lastName}`}
                  alt="Driver QR Code"
                  style={{ width: '220px', height: '220px' }}
                />
              </div>

              <div style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '14px', padding: '1rem', width: '100%' }}>
                <h4 style={{ color: '#38bdf8', fontWeight: 700, fontSize: '1.1rem' }}>{user?.firstName} {user?.lastName}</h4>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Authorized Tricycle Driver - Lungsod ng Baliwag</p>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>TODA: {user?.todaName || 'BASTODA'}</p>
              </div>

              <button onClick={() => window.print()} className="btn-glass btn-primary-glass" style={{ width: '100%' }}>
                Print Official Driver Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
