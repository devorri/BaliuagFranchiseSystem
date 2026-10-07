import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import { belongsToToda } from '../../services/todaService';
import type { Application } from '../../types';
import { CheckCircle2, FileText, RefreshCw, UserCheck } from 'lucide-react';

export function TodaApprovals() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [remarks, setRemarks] = useState('Driver is eligible to join this TODA line. Requirements forwarded for admin review.');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    supabaseService.getApplicationsAsync().then(setApplications);
  }, []);

  const loadApps = async () => {
    const apps = await supabaseService.getApplicationsAsync();
    setApplications(apps);
  };

  const handleGrantApproval = async (app: Application) => {
    if (!user) return;
    const now = new Date().toISOString();
    setActionError('');
    try {
      const updated = await supabaseService.saveApplicationAsync({
        ...app,
        presidentEndorsed: true,
        presidentEndorsedAt: now,
        presidentEndorsedBy: `${user.firstName} ${user.lastName}`,
        presidentRemarks: remarks,
        status: 'pending_admin_approval',
        updatedAt: now,
      }, true);
      if (updated.status === 'pending_admin_approval') {
        setSuccessMsg(`Application for ${app.driverName || app.applicantName} was endorsed and forwarded to Municipal Admin.`);
        setSelectedApp(null);
        await loadApps();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Hindi na-forward ang application. Pakisubukang muli.');
    }
  };

  const assignedApplications = applications.filter(app => {
    return belongsToToda(app.todaName, user?.todaName)
      && ['pending_toda_approval', 'pending_admin_approval', 'approved'].includes(app.status);
  });


  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-container" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-purple">TODA Line Approvals</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{user?.todaName || 'BASTODA Baliuag'}</span>
          <button type="button" onClick={loadApps} className="btn-glass" style={{ marginLeft: 'auto', padding: '0.5rem 0.75rem' }} title="Refresh applications">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Line Route Approval & Fee Verification
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Review applicants for your TODA line and inspect their submitted documents. Endorsed applications are forwarded to the Municipal Admin for full requirements review.
        </p>

        {successMsg && (
          <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginTop: '1.25rem', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700 }}>
            <CheckCircle2 size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            {successMsg}
          </div>
        )}
        {actionError && <p role="alert" style={{ color: '#f87171', marginTop: '1rem' }}>{actionError}</p>}
      </div>

      {/* Applications List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.75rem' }}>
        {assignedApplications.map(app => {
          const isApproved = app.presidentEndorsed || app.status === 'pending_admin_approval' || app.status === 'approved';

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

              <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.65rem', color: '#facc15' }}>
                  Submitted requirements ({app.documents?.length || 0})
                </strong>
                {(app.documents || []).length ? app.documents.map(doc => {
                  const documentUrl = doc.fileUrl || (/^(https?:|blob:)/i.test(doc.fileName) ? doc.fileName : undefined);
                  return (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.4rem 0', fontSize: '0.85rem' }}>
                      <span><FileText size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />{doc.name} <span style={{ color: '#94a3b8' }}>({doc.status})</span></span>
                      {documentUrl ? <a href={documentUrl} target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>Open file</a> : <span style={{ color: '#94a3b8' }}>{doc.fileName}</span>}
                    </div>
                  );
                }) : <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No documents submitted.</span>}
              </div>

              {isApproved ? (
                <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', fontSize: '0.85rem' }}>
                  <span style={{ color: '#c084fc', fontWeight: 700 }}>Forwarded to Admin for Final Review.</span>
                  <br />
                  <span style={{ color: '#cbd5e1' }}>Endorsed by {app.presidentEndorsedBy || 'TODA President'}</span>
                </div>
              ) : (
                <button
                  onClick={() => { setRemarks('Driver is eligible to join this TODA line. Requirements forwarded for admin review.'); setSelectedApp(app); }}
                  className="btn-glass btn-emerald-glass"
                  style={{ width: '100%', padding: '0.85rem' }}
                >
                  <UserCheck size={18} /> Review Line Eligibility
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
              TODA Line Eligibility Review
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              Applicant: <strong style={{ color: '#ffffff' }}>{selectedApp.driverName || selectedApp.applicantName}</strong> (Plate: {selectedApp.plateNumber})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Line eligibility / endorsement remarks
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
                <UserCheck size={18} /> Endorse Requirements to Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
