import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import type { Application, Document, Franchise, SMSNotification, User } from '../../types';
import { 
  ShieldCheck, RefreshCw, QrCode, Users, Clock, UserCheck, 
  CheckCircle2, AlertTriangle, FileText, Upload, Loader2, 
  ExternalLink 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyzeDocumentWithOcr } from '../../services/ocrService';

export function OperatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [smsNotifs, setSmsNotifs] = useState<SMSNotification[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [driverSelections, setDriverSelections] = useState<Record<string, string>>({});
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [savingAssignment, setSavingAssignment] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState('');

  // Resubmission state for rejected documents
  const [resubmittingDocId, setResubmittingDocId] = useState<string | null>(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [resubmitMessage, setResubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      const [allFranchises, allUsers, allApplications, userNotifications] = await Promise.all([
        supabaseService.getFranchisesAsync(),
        supabaseService.getUsersAsync(),
        supabaseService.getApplicationsAsync(),
        supabaseService.getSMSNotificationsAsync(user.id),
      ]);

      const owned = allFranchises
        .filter(franchise => franchise.operatorId === user.id)
        .sort((a, b) => new Date(b.issuedAt || b.startDate || 0).getTime() - new Date(a.issuedAt || a.startDate || 0).getTime());
      setFranchises(owned);
      setDriverSelections(Object.fromEntries(owned.map(franchise => [franchise.id, franchise.driverId])));
      setDrivers(allUsers.filter(account => account.role === 'driver' && account.accountStatus === 'approved'));
      setMyApplications(
        allApplications
          .filter(app => app.applicantId === user.id)
          .sort((a, b) => new Date(b.updatedAt || b.submittedAt || 0).getTime() - new Date(a.updatedAt || a.submittedAt || 0).getTime())
      );
      setSmsNotifs(
        userNotifications
          .sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime())
      );
    } catch (err) {
      console.error('Error loading operator dashboard:', err);
    }
  };

  const handleAssignDriver = async (franchise: Franchise) => {
    const driverId = driverSelections[franchise.id];
    const selectedDriver = drivers.find(driver => driver.id === driverId);
    if (!selectedDriver || franchise.operatorId !== user?.id) return;
    setSavingAssignment(franchise.id);
    setAssignmentError('');
    try {
      const updated = await supabaseService.saveFranchiseAsync({
        ...franchise,
        driverId: selectedDriver.id,
        driverName: `${selectedDriver.firstName} ${selectedDriver.lastName}`,
      }, true);
      setFranchises(current => current.map(item => item.id === updated.id ? updated : item));
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : 'Could not assign driver.');
    } finally {
      setSavingAssignment(null);
    }
  };

  const handleResubmitDocument = async (app: Application, doc: Document, file: File) => {
    if (!user) return;
    setResubmitLoading(true);
    setResubmittingDocId(doc.id);
    setResubmitMessage(null);

    try {
      // 1. OCR verification
      if (file.type.startsWith('image/')) {
        const ocrResult = await analyzeDocumentWithOcr(file, doc.type);
        if (!ocrResult.isValid) {
          setResubmitMessage({
            type: 'error',
            text: ocrResult.validationMessage || 'Document validation failed. Please upload an authentic official copy.'
          });
          setResubmitLoading(false);
          setResubmittingDocId(null);
          return;
        }
      }

      // 2. Upload to storage
      const uploadResult = await supabaseService.uploadFileToBucketAsync(file, 'operator_documents');
      if (!uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload document file.');
      }

      // 3. Update the specific document while preserving all verified ones
      const now = new Date().toISOString();
      const updatedDocs = (app.documents || []).map(d => {
        if (d.id === doc.id) {
          return {
            ...d,
            fileName: file.name,
            fileUrl: uploadResult.url!,
            uploadedAt: now,
            status: 'uploaded' as const,
            rejectionReason: undefined,
          };
        }
        return d;
      });

      // Check if any rejected documents remain
      const remainingRejected = updatedDocs.some(d => d.status === 'rejected');
      const newStatus = remainingRejected ? 'requires_revision' : 'pending_admin_approval';

      const updatedApp: Application = {
        ...app,
        documents: updatedDocs,
        status: newStatus,
        updatedAt: now,
      };

      await supabaseService.saveApplicationAsync(updatedApp, true);

      void supabaseService.recordAuditLogAsync({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: 'operator',
        action: 'REQUIREMENT_RESUBMITTED',
        details: `Operator resubmitted ${doc.name} for Application #${app.id.slice(0, 8)}`,
        targetId: app.id,
      });

      setResubmitMessage({
        type: 'success',
        text: `Successfully resubmitted "${doc.name}". Admin has been notified for re-verification.`
      });

      await loadDashboardData();
    } catch (err) {
      setResubmitMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to resubmit requirement.'
      });
    } finally {
      setResubmitLoading(false);
      setResubmittingDocId(null);
    }
  };

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'approved':
        return <span className="pill-badge pill-approved">MTOP Issued & Active</span>;
      case 'rejected':
        return <span className="pill-badge pill-rejected">Application Declined</span>;
      case 'requires_revision':
        return <span className="pill-badge pill-rejected">Requires Document Revision</span>;
      case 'pending_driver_requirements':
        return <span className="pill-badge pill-pending">Pending Requirements</span>;
      case 'pending_toda_approval':
        return <span className="pill-badge pill-pending">Pending TODA Endorsement</span>;
      case 'pending_admin_approval':
        return <span className="pill-badge pill-pending">Pending Final Admin Review</span>;
      default:
        return <span className="pill-badge pill-pending">{(status as string).replace(/_/g, ' ').toUpperCase()}</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Operator Hero */}
      <div className="glass-container dashboard-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="pill-badge pill-emerald">Franchise Operator Portal</span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>City of Baliwag MTOP Office</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
              Welcome, Operator {user?.firstName}!
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '680px', lineHeight: 1.5 }}>
              Track live application progress, monitor document review feedback, manage assigned drivers, and renew your franchise permits seamlessly.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dashboard/requirements')} className="btn-glass btn-blue-glass">
              <FileText size={18} /> New Application
            </button>
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
            <div className="stat-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="stat-val">{franchises.filter(f => f.status === 'active').length} Active</div>
              <div className="stat-lbl">Active Franchises</div>
            </div>
          </div>

          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Clock size={24} />
            </div>
            <div>
              <div className="stat-val">
                {myApplications.filter(a => a.status !== 'approved' && a.status !== 'rejected').length} Ongoing
              </div>
              <div className="stat-lbl">Applications In Progress</div>
            </div>
          </div>

          <div className="glass-card hero-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Users size={24} />
            </div>
            <div>
              <div className="stat-val">{franchises.length} Registered</div>
              <div className="stat-lbl">Registered Tricycle Units</div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Resubmission Feedback Notification */}
      {resubmitMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: resubmitMessage.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: resubmitMessage.type === 'success' ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
            color: resubmitMessage.type === 'success' ? '#4ade80' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {resubmitMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>{resubmitMessage.text}</span>
        </div>
      )}

      {/* Live Application Status & Tracker Section */}
      <div className="glass-container" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Live Application Status & Document Tracker
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
              Monitor your application lifecycle stages and resubmit rejected documents directly.
            </p>
          </div>
          <button
            onClick={() => void loadDashboardData()}
            className="btn-glass"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} /> Refresh Status
          </button>
        </div>

        {myApplications.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <FileText size={42} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              No Applications Submitted Yet
            </h3>
            <p style={{ color: '#94a3b8', maxWidth: '460px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              You haven't submitted any new franchise or renewal applications. Get started by clicking the button below.
            </p>
            <button
              onClick={() => navigate('/dashboard/requirements')}
              className="btn-glass btn-emerald-glass"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem' }}
            >
              <FileText size={16} /> Submit Franchise Application
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {myApplications.map(app => {
              const isApproved = app.status === 'approved';
              const requiresRevision = app.status === 'requires_revision' || (app.documents || []).some(d => d.status === 'rejected');

              // Pipeline stage completion logic
              const step1Done = true; // Submitted
              const step2Done = Boolean(app.presidentEndorsed || isApproved);
              const step3Done = Boolean(app.inspection?.status === 'passed' || isApproved);
              const step4Done = Boolean(app.treasurerPayment?.paid || isApproved);
              const step5Done = isApproved;

              return (
                <div
                  key={app.id}
                  className="glass-panel"
                  style={{
                    padding: '1.75rem',
                    border: requiresRevision ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
                    background: requiresRevision ? 'rgba(239, 68, 68, 0.03)' : undefined,
                  }}
                >
                  {/* Application Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
                          Plate: {app.plateNumber}
                        </span>
                        <span className="pill-badge pill-blue">
                          {app.type === 'renewal' ? 'RENEWAL' : 'NEW APPLICATION'}
                        </span>
                        {getStatusBadge(requiresRevision && app.status !== 'rejected' ? 'requires_revision' : app.status)}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        Driver: <strong>{app.driverName || 'Not Assigned'}</strong> · TODA: <strong>{app.todaName}</strong> · Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {isApproved && app.mtopNumber && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                          Official MTOP Permit
                        </span>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4ade80' }}>
                          {app.mtopNumber}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5-Step Visual Progress Bar */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                      {[
                        { num: 1, label: 'Submitted', done: step1Done },
                        { num: 2, label: 'TODA Review', done: step2Done },
                        { num: 3, label: 'Stenciling', done: step3Done },
                        { num: 4, label: 'Treasurer Fee', done: step4Done },
                        { num: 5, label: 'MTOP Grant', done: step5Done },
                      ].map((step, idx) => (
                        <div key={idx} style={{ textAlign: 'center', position: 'relative' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: step.done ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              border: step.done ? '2px solid #4ade80' : '2px solid rgba(255, 255, 255, 0.2)',
                              color: step.done ? '#4ade80' : '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 0.4rem',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                            }}
                          >
                            {step.done ? '✓' : step.num}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: step.done ? '#f8fafc' : '#94a3b8', fontWeight: step.done ? 600 : 400 }}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document Requirements Review Breakdown */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} color="#38bdf8" />
                      Document Verification Checklist & Re-upload
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {(app.documents || []).length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No documents attached.</p>
                      ) : (
                        app.documents.map(doc => {
                          const isDocRejected = doc.status === 'rejected';
                          const isDocVerified = doc.status === 'verified';
                          const isCurrentResubmitting = resubmittingDocId === doc.id && resubmitLoading;

                          return (
                            <div
                              key={doc.id}
                              style={{
                                padding: '1rem',
                                borderRadius: '8px',
                                background: isDocRejected
                                  ? 'rgba(239, 68, 68, 0.07)'
                                  : isDocVerified
                                  ? 'rgba(34, 197, 94, 0.04)'
                                  : 'rgba(255, 255, 255, 0.02)',
                                border: isDocRejected
                                  ? '1px solid rgba(239, 68, 68, 0.3)'
                                  : isDocVerified
                                  ? '1px solid rgba(34, 197, 94, 0.2)'
                                  : '1px solid rgba(255, 255, 255, 0.06)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{doc.name}</strong>
                                    {isDocVerified && <span className="pill-badge pill-approved">✓ Verified</span>}
                                    {isDocRejected && <span className="pill-badge pill-rejected">✕ Rejected</span>}
                                    {!isDocVerified && !isDocRejected && <span className="pill-badge pill-pending">Pending Review</span>}
                                  </div>

                                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                    File: <span style={{ color: '#e2e8f0' }}>{doc.fileName}</span>
                                    {doc.fileUrl && (
                                      <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: '#38bdf8', marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                      >
                                        View <ExternalLink size={11} />
                                      </a>
                                    )}
                                  </div>

                                  {/* Prominent Admin Rejection Reason */}
                                  {isDocRejected && (
                                    <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', borderRadius: '4px' }}>
                                      <span style={{ fontSize: '0.82rem', color: '#fca5a5', fontWeight: 600 }}>
                                        Admin Rejection Reason:
                                      </span>
                                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#fecaca' }}>
                                        {doc.rejectionReason || 'Document requires resubmission with a clearer, up-to-date copy.'}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Re-upload Action for Rejected Documents */}
                                {isDocRejected && (
                                  <div>
                                    <input
                                      type="file"
                                      id={`resubmit-${doc.id}`}
                                      accept="image/*,.pdf"
                                      style={{ display: 'none' }}
                                      disabled={isCurrentResubmitting}
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) void handleResubmitDocument(app, doc, file);
                                      }}
                                    />
                                    <label
                                      htmlFor={`resubmit-${doc.id}`}
                                      className="btn-glass btn-orange-glass"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.5rem 0.9rem',
                                        fontSize: '0.82rem',
                                        cursor: isCurrentResubmitting ? 'not-allowed' : 'pointer',
                                      }}
                                    >
                                      {isCurrentResubmitting ? (
                                        <>
                                          <Loader2 size={14} className="spin-icon" />
                                          <span>Uploading & Verifying...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Upload size={14} />
                                          <span>Resubmit Document</span>
                                        </>
                                      )}
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Grid: Franchise Records & SMS Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.75rem' }}>
        
        {/* Franchise & Driver Records Card */}
        <div className="glass-container" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Registered Franchises & Assigned Drivers
            </h3>
            <span className="pill-badge pill-blue">{franchises.length} Units</span>
          </div>

          {assignmentError && (
            <p role="alert" style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.88rem' }}>
              {assignmentError}
            </p>
          )}

          <div className="glass-table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>MTOP Body #</th>
                  <th>Assigned Driver</th>
                  <th>Assign Driver Account</th>
                  <th>Plate #</th>
                  <th>Expiration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {franchises.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No registered tricycles under your account yet. Submit an application to add a unit.
                    </td>
                  </tr>
                ) : (
                  franchises.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 800, color: '#38bdf8' }}>{f.mtopNumber}</td>
                      <td style={{ fontWeight: 700, color: '#f8fafc' }}>{f.driverName}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', minWidth: '240px' }}>
                          <select
                            className="glass-input glass-select"
                            value={driverSelections[f.id] || ''}
                            onChange={e => setDriverSelections(current => ({ ...current, [f.id]: e.target.value }))}
                          >
                            <option value="">Select driver</option>
                            {drivers.map(driver => (
                              <option key={driver.id} value={driver.id}>
                                {driver.firstName} {driver.lastName}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAssignDriver(f)}
                            disabled={savingAssignment === f.id}
                            className="btn-glass"
                            title="Assign driver"
                            style={{ padding: '0.45rem' }}
                          >
                            <UserCheck size={16} />
                          </button>
                        </div>
                      </td>
                      <td>{f.plateNumber}</td>
                      <td style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                        {new Date(f.expiresAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`pill-badge ${f.status === 'active' ? 'pill-approved' : 'pill-rejected'}`}>
                          {f.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SMS Notifications Inbox Brief */}
        <div className="glass-container" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              SMS Notification Alerts
            </h3>
            <button onClick={() => navigate('/dashboard/sms-notifications')} className="btn-glass" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
              View Inbox ({smsNotifs.length}) →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {smsNotifs.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', textAlign: 'center', padding: '2rem' }}>
                No SMS notification alerts received at this time.
              </p>
            ) : (
              smsNotifs.slice(0, 3).map(n => (
                <div key={n.id} className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #38bdf8' }}>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                    {n.title}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.4', margin: 0 }}>
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
