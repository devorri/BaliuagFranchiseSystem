import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import type { Application } from '../../types';
import { CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';

export function TodaApprovals() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [orNumber, setOrNumber] = useState('TODA-OR-9005');
  const [remarks, setRemarks] = useState('Aprubado ang linya at ruta. Cleared para sa final MTOP Municipal Admin review.');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = () => {
    const apps = storage.getApplications();
    setApplications(apps);
  };

  const handleGrantApproval = (app: Application) => {
    if (!user) return;
    const updated = storage.approveTodaLine(app.id, user, orNumber, remarks);
    if (updated) {
      setSuccessMsg(`Ang linya para kay ${app.driverName || app.applicantName} ay APRUBADO na at naipasa na sa Admin!`);
      setSelectedApp(null);
      loadApps();
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-container" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-purple">TODA Line Approvals</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{user?.todaName || 'BASTODA Baliuag'}</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Approval ng Linya at Pagtanggap ng Bayad
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Dito sinusuri ng TODA President ang mga aplikasyon ng driver. Kapag natanggap ang bayad sa **route fee (₱500)** at **membership fee (₱300)**, aprobahan ang linya upang awtomatikong maipasa sa **Municipal Admin**.
        </p>

        {successMsg && (
          <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginTop: '1.25rem', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700 }}>
            <CheckCircle2 size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            {successMsg}
          </div>
        )}
      </div>

      {/* Applications List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.75rem' }}>
        {applications.map(app => {
          const isApproved = app.todaApproval?.routeFeePaid;

          return (
            <div key={app.id} className="glass-container" style={{ padding: '1.75rem', border: isApproved ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>{app.driverName || app.applicantName}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Plate: {app.plateNumber} | Ref: {app.id}</span>
                </div>
                {isApproved ? (
                  <span className="pill-badge pill-purple"><CheckCircle2 size={14} /> TODA Approved</span>
                ) : (
                  <span className="pill-badge pill-orange">Needs Line Approval</span>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Vehicle Make</span>
                    <strong>{app.vehicleMake} {app.vehicleModel}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Engine Stenciling</span>
                    <span style={{ color: app.inspection?.status === 'passed' ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
                      {app.inspection?.status === 'passed' ? 'Passed' : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Treasurer Fee OR</span>
                    <strong>{app.treasurerPayment?.orNumber || 'Paid'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Assigned TODA</span>
                    <strong>{app.todaName}</strong>
                  </div>
                </div>
              </div>

              {isApproved ? (
                <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', fontSize: '0.85rem' }}>
                  <span style={{ color: '#c084fc', fontWeight: 700 }}>Naipasa na sa Admin for Final Review.</span>
                  <br />
                  <span style={{ color: '#cbd5e1' }}>OR #: {app.todaApproval?.orNumber} | Approved by {app.todaApproval?.approvedByName}</span>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedApp(app)}
                  className="btn-glass btn-emerald-glass"
                  style={{ width: '100%', padding: '0.85rem' }}
                >
                  <UserCheck size={18} /> Review & Approve TODA Line
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Approval Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="glass-container modal-glass-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              TODA Line Approval & Fee Collection
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              Driver: <strong style={{ color: '#ffffff' }}>{selectedApp.driverName || selectedApp.applicantName}</strong> (Plate: {selectedApp.plateNumber})
            </p>

            <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>TODA Route Fee</span>
                <strong style={{ color: '#ffffff' }}>₱500.00</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>TODA Membership Fee</span>
                <strong style={{ color: '#ffffff' }}>₱300.00</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: 800, color: '#c084fc' }}>
                <span>Kabuuang Bayad sa TODA:</span>
                <span>₱800.00</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  TODA Official Receipt (OR) Number
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={orNumber}
                  onChange={e => setOrNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Approval Remarks / Line Route Permit
                </label>
                <textarea
                  className="glass-input"
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setSelectedApp(null)}
                className="btn-glass"
                style={{ flex: 1 }}
              >
                Cancel
              </button>

              <button
                onClick={() => handleGrantApproval(selectedApp)}
                className="btn-glass btn-emerald-glass"
                style={{ flex: 2 }}
              >
                <ShieldCheck size={18} /> Confirm Payment & Forward to Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
