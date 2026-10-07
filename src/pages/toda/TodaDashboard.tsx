import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import type { Application, Payment } from '../../types';
import { Award, CheckCircle2, Clock, ShieldCheck, UploadCloud, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TodaDashboard() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [qrUploading, setQrUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadData();
  }, [user?.todaName]);

  const loadData = async () => {
    const [allApplications, allPayments] = await Promise.all([
      supabaseService.getApplicationsAsync(),
      supabaseService.getPaymentsAsync(),
    ]);
    const assigned = allApplications.filter(app => app.todaName.trim().toLowerCase() === user?.todaName?.trim().toLowerCase());
    const appIds = new Set(assigned.map(app => app.id));
    setApplications(assigned);
    setPayments(allPayments.filter(payment => appIds.has(payment.applicationId)));
  };

  const pendingApprovals = applications.filter(app => app.status === 'pending_toda_approval');
  const endorsedApps = applications.filter(app => app.presidentEndorsed);
  const totalCollectedRouteFees = payments
    .filter(payment => payment.status === 'completed')
    .reduce((total, payment) => total + payment.amount, 0);

  const handleQrUpload = async (file?: File) => {
    if (!file || !user) return;
    setQrUploading(true);
    setError('');
    try {
      const uploaded = await supabaseService.uploadFileToBucketAsync(file, 'toda_payment_qr');
      if (!uploaded.url) throw new Error(uploaded.error || 'Could not upload the payment QR.');
      await supabaseService.updatePresidentQrAsync(user.id, uploaded.url);
      updateProfile({ todaPaymentQrUrl: uploaded.url });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not save the payment QR.');
    } finally {
      setQrUploading(false);
    }
  };

  const handlePaymentStatus = async (paymentId: string, status: Payment['status']) => {
    setError('');
    try {
      await supabaseService.updatePaymentStatusAsync(paymentId, status);
      await loadData();
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Could not update the payment.');
    }
  };

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
              <div className="stat-val">{endorsedApps.length}</div>
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

      <div className="glass-container" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Wallet size={18} /> TODA Payment QR</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.35rem' }}>I-upload ang official GCash/QR Ph code ng inyong TODA. Ang payment references ay kukumpirmahin dito bago maisama sa collections.</p>
          {error && <p role="alert" style={{ color: '#f87171', marginTop: '0.5rem' }}>{error}</p>}
          <label className="btn-glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.55rem 0.85rem', cursor: 'pointer' }}>
            <UploadCloud size={16} /> {qrUploading ? 'Uploading...' : 'Upload TODA QR'}
            <input type="file" accept="image/*" hidden disabled={qrUploading} onChange={event => void handleQrUpload(event.target.files?.[0])} />
          </label>
        </div>
        {user?.todaPaymentQrUrl ? (
          <img src={user.todaPaymentQrUrl} alt={`${user.todaName} payment QR`} style={{ width: 150, aspectRatio: '1', objectFit: 'contain', background: '#fff', padding: '0.5rem', borderRadius: '6px' }} />
        ) : <span style={{ color: '#facc15', fontSize: '0.85rem' }}>No QR uploaded</span>}
      </div>

      <div className="glass-container" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>TODA Payment Transactions</h3>
          <button type="button" onClick={() => void loadData()} className="btn-glass" style={{ padding: '0.45rem 0.75rem' }}>Refresh</button>
        </div>
        {error && <p role="alert" style={{ color: '#f87171', marginBottom: '0.75rem' }}>{error}</p>}
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead><tr><th>Payer / Driver</th><th>Plate</th><th>Reference</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {payments.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.25rem' }}>No TODA payments submitted.</td></tr> : payments.map(payment => {
                const app = applications.find(item => item.id === payment.applicationId);
                return (
                  <tr key={payment.id}>
                    <td>{payment.payerName}</td><td>{app?.plateNumber || '—'}</td><td>{payment.referenceNumber}</td>
                    <td>₱{payment.amount.toFixed(2)}</td>
                    <td><span className={`pill-badge ${payment.status === 'completed' ? 'pill-emerald' : payment.status === 'failed' ? 'pill-rose' : 'pill-orange'}`}>{payment.status.toUpperCase()}</span></td>
                    <td>{payment.status === 'pending' && <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button type="button" onClick={() => void handlePaymentStatus(payment.id, 'completed')} className="btn-glass btn-emerald-glass" style={{ padding: '0.35rem 0.55rem' }}>Confirm</button>
                      <button type="button" onClick={() => void handlePaymentStatus(payment.id, 'failed')} className="btn-glass" style={{ padding: '0.35rem 0.55rem' }}>Reject</button>
                    </div>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                    <td>{(app.documents || []).length} documents</td>
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
