import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import type { Application } from '../../types';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';

export function ApplicationReview() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [adminNotes, setAdminNotes] = useState('Kumpleto ang requirements, stenciling inspection, at mga bayarin sa Treasurer at TODA. Inaprubahan ang MTOP permit.');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    setApplications(storage.getApplications());
  };

  const handleGrantMtop = (appId: string) => {
    if (!user) return;
    const updated = storage.updateApplicationStatus(
      appId,
      'approved',
      adminNotes,
      `${user.firstName} ${user.lastName} (Municipal Admin)`
    );
    if (updated) {
      setSelectedApp(null);
      loadApplications();
    }
  };

  const handleReject = (appId: string) => {
    if (!user) return;
    storage.updateApplicationStatus(appId, 'rejected', adminNotes, `${user.firstName} ${user.lastName}`);
    setSelectedApp(null);
    loadApplications();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-container" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-orange">Admin Review & Approval</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>MTOP Issuance Portal</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Review Application & MTOP Approval
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Tinitingnan kung kumpleto ang mga **requirements** (OR/CR, Clearance, License), naipasa ang **stenciling**, nabayaran ang **Treasurer's Office Fee**, at aprubado ng **TODA President**.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem' }}>
        {applications.map(app => {
          const isApproved = app.status === 'approved';
          const isRequirementsComplete = app.documents && app.documents.length >= 3;
          const isStenciled = app.inspection?.status === 'passed';
          const isTreasurerPaid = app.treasurerPayment?.paid;
          const isTodaApproved = app.todaApproval?.routeFeePaid;

          return (
            <div key={app.id} className="glass-container" style={{ padding: '1.75rem', border: isApproved ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>{app.driverName || app.applicantName}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Ref #: {app.id} | Plate: {app.plateNumber}</span>
                </div>
                {isApproved ? (
                  <span className="pill-badge pill-emerald"><CheckCircle2 size={14} /> MTOP GRANTED</span>
                ) : (
                  <span className="pill-badge pill-orange">Needs Approval</span>
                )}
              </div>

              {/* Verification Checklist Matrix */}
              <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#cbd5e1' }}>1. Requirements Upload</span>
                  <span style={{ color: isRequirementsComplete ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
                    {isRequirementsComplete ? '✓ Complete' : 'Incomplete'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#cbd5e1' }}>2. Stenciling & Inspection</span>
                  <span style={{ color: isStenciled ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
                    {isStenciled ? '✓ Stenciled' : 'Pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#cbd5e1' }}>3. Treasurer Fee Payment</span>
                  <span style={{ color: isTreasurerPaid ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
                    {isTreasurerPaid ? `✓ Paid (OR #${app.treasurerPayment?.orNumber})` : 'Unpaid'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#cbd5e1' }}>4. TODA Line Approval</span>
                  <span style={{ color: isTodaApproved ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
                    {isTodaApproved ? `✓ Approved (${app.todaName.split(' ')[0]})` : 'Pending TODA Pres'}
                  </span>
                </div>
              </div>

              {isApproved ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#34d399' }}>Official MTOP #: {app.mtopNumber || 'MTOP-2026-0891'}</strong>
                  <br />
                  <span style={{ color: '#cbd5e1' }}>Reviewed by {app.reviewedBy}</span>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedApp(app)}
                  className="btn-glass btn-primary-glass"
                  style={{ width: '100%', padding: '0.85rem' }}
                >
                  <ShieldCheck size={18} /> Inspect & Grant MTOP Approval
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="glass-container modal-glass-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Municipal MTOP Approval Verification
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Driver: <strong style={{ color: '#ffffff' }}>{selectedApp.driverName || selectedApp.applicantName}</strong> | Plate: {selectedApp.plateNumber}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Admin Notes & Approval Remarks
                </label>
                <textarea
                  className="glass-input"
                  rows={3}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => handleReject(selectedApp.id)}
                className="btn-glass"
                style={{ background: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fb7185' }}
              >
                <XCircle size={18} /> Reject
              </button>

              <button
                onClick={() => handleGrantMtop(selectedApp.id)}
                className="btn-glass btn-emerald-glass"
                style={{ flex: 1 }}
              >
                <ShieldCheck size={18} /> Approve & Issue MTOP Permit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
