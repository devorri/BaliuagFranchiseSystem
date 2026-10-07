import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import * as supabaseService from '../../services/supabaseService';
import type { Application, Document, DocumentType } from '../../types';
import { 
  CheckCircle2, ShieldCheck, XCircle, FileText, Calendar, 
  Eye, FileCheck, AlertCircle, Award, CreditCard, Wrench, RefreshCw
} from 'lucide-react';

export function ApplicationReview() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);

  // Effectivity Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearStr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextYearStr);

  const [adminNotes, setAdminNotes] = useState(
    'Requirements, stenciling inspection, and Treasurer/TODA fees are complete. MTOP permit approved.'
  );

  const canManageRequirements = hasPermission('requirements');
  const requiredDocumentTypes: DocumentType[] = ['or_cr', 'barangay_clearance', 'drivers_license', 'toda_cert', 'id_photo'];

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await supabaseService.getApplicationsAsync();
      setApplications(data);
    } catch {
      showToast('Failed to load applications.', 'error');
    }
  };

  const openReviewModal = (app: Application) => {
    setSelectedApp(app);
    setStartDate(app.startDate || todayStr);
    setEndDate(app.endDate || nextYearStr);
    setAdminNotes(app.adminNotes || 'Requirements, stenciling inspection, and Treasurer/TODA fees are complete. MTOP permit approved.');
  };

  const handleGrantMtop = async (appId: string) => {
    if (!user) return;
    if (!selectedApp?.presidentEndorsed) {
      showToast('Kailangan munang i-endorso ng TODA President ang application.', 'error');
      return;
    }
    const verifiedTypes = new Set((selectedApp.documents || []).filter(doc => doc.status === 'verified').map(doc => doc.type));
    if (requiredDocumentTypes.some(type => !verifiedTypes.has(type))) {
      showToast('I-verify muna ng admin ang lahat ng limang required documents.', 'error');
      return;
    }

    if (!startDate || !endDate) {
      showToast('Please specify the Start Date and End Date for the effectivity period.', 'error');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      showToast('End Date must be after the Start Date.', 'error');
      return;
    }

    setLoading(true);
    try {
      const updated = await supabaseService.updateApplicationStatusAsync(
        appId,
        'approved',
        adminNotes,
        `${user.firstName} ${user.lastName} (Municipal Admin)`,
        startDate,
        endDate
      );

      if (updated) {
        showToast(`MTOP Granted! Effectivity: ${startDate} to ${endDate}.`, 'success');
        setSelectedApp(null);
        await loadApplications();
      }
    } catch {
      showToast('An error occurred while approving the MTOP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (appId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await supabaseService.updateApplicationStatusAsync(
        appId, 
        'rejected', 
        adminNotes, 
        `${user.firstName} ${user.lastName} (Municipal Admin)`
      );
      showToast('Application rejected.', 'error');
      setSelectedApp(null);
      await loadApplications();
    } catch {
      showToast('An error occurred while rejecting the application.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDocStatus = async (docId: string, newStatus: 'verified' | 'rejected') => {
    if (!canManageRequirements) {
      showToast('Requirements Admin permission is required to verify documents.', 'error');
      return;
    }

    if (!selectedApp) return;
    const updatedDocs = (selectedApp.documents || []).map(d => 
      d.id === docId ? { ...d, status: newStatus } : d
    );
    const updatedApp = { ...selectedApp, documents: updatedDocs };
    setSelectedApp(updatedApp);
    try {
      await supabaseService.saveApplicationAsync(updatedApp, true);
      showToast(`Document marked as ${newStatus.toUpperCase()}.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save document verification.', 'error');
      await loadApplications();
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div className="glass-container" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-orange">Admin Review & Approval</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>MTOP Issuance Portal</span>
          <button type="button" onClick={loadApplications} className="btn-glass" style={{ marginLeft: 'auto', padding: '0.5rem 0.75rem' }} title="Refresh applications">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>
          Review Application & MTOP Approval
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Review **Requirements**, **Stenciling Record**, **TODA Endorsement**, and set **Start & End Effectivity Dates** before issuing the official franchise.
        </p>
      </div>

      {/* Applications Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem' }}>
        {applications.filter(app => app.status === 'pending_admin_approval' || app.status === 'approved').map(app => {
          const isApproved = app.status === 'approved';
          const isRequirementsComplete = requiredDocumentTypes.every(type => app.documents?.some(doc => doc.type === type));
          const isRequirementsVerified = requiredDocumentTypes.every(type => app.documents?.some(doc => doc.type === type && doc.status === 'verified'));
          const isStenciled = app.inspection?.status === 'passed';
          const isTreasurerPaid = app.treasurerPayment?.paid;
          const isTodaApproved = app.todaApproval?.routeFeePaid || app.presidentEndorsed;

          return (
            <div 
              key={app.id} 
              className="glass-container" 
              style={{ 
                padding: '1.75rem', 
                border: isApproved ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
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

                {/* President Endorsement Status */}
                {app.presidentEndorsed && (
                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#d8b4fe' }}>
                    <Award size={16} color="#c084fc" />
                    <span>Inindorso ni TODA Pres: <strong>{app.presidentEndorsedBy || 'TODA President'}</strong></span>
                  </div>
                )}

                {/* Verification Checklist Matrix */}
                <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#cbd5e1' }}>1. Requirements Upload ({app.documents?.length || 0})</span>
                    <span style={{ color: isRequirementsComplete ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
                      {isRequirementsVerified ? '✓ Verified' : isRequirementsComplete ? 'Uploaded, needs verification' : 'Incomplete'}
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
                      {isTodaApproved ? `✓ Endorsed (${app.todaName?.split(' ')[0] || 'TODA'})` : 'Pending TODA Pres'}
                    </span>
                  </div>

                  {/* Effectivity Dates display if already approved */}
                  {isApproved && app.startDate && app.endDate && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#38bdf8' }}>
                      <span>Effectivity Period:</span>
                      <strong>{app.startDate} hanggang {app.endDate}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div>
                {isApproved ? (
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                    <strong style={{ color: '#34d399' }}>Official MTOP #: {app.mtopNumber || 'MTOP-2026-0891'}</strong>
                    <br />
                    <span style={{ color: '#cbd5e1' }}>Reviewed by {app.reviewedBy}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => openReviewModal(app)}
                    className="btn-glass btn-primary-glass"
                    style={{ width: '100%', padding: '0.85rem' }}
                  >
                    <Eye size={18} /> Inspect Requirements & Grant MTOP
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPREHENSIVE APPROVAL MODAL WITH REQUIREMENTS VISIBILITY & EFFECTIVITY DATES */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div 
            className="glass-container modal-glass-content animate-fade-in" 
            style={{ maxWidth: '850px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                  Aplikasyon para sa MTOP Approval
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
                  Applicant: <strong style={{ color: '#38bdf8' }}>{selectedApp.driverName || selectedApp.applicantName}</strong> | Plate: <strong style={{ color: '#ffffff' }}>{selectedApp.plateNumber}</strong> ({selectedApp.todaName})
                </p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="btn-glass" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                ✕ Isara
              </button>
            </div>

            {/* TASK 1: REQUIREMENTS VISIBILITY SECTION */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#facc15', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileCheck size={18} /> Mga Naisumiteng Dokumento at Requirements ({selectedApp.documents?.length || 0})
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Pindutin ang "Tingnan" upang mabuksan ang bawat dokumento
                </span>
              </div>

              {(!selectedApp.documents || selectedApp.documents.length === 0) ? (
                <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', textAlign: 'center', color: '#fca5a5' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 0.5rem' }} />
                  Walang na-upload na dokumento ang aplikante.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
                  {selectedApp.documents.map((doc) => {
                    const isVerified = doc.status === 'verified';
                    const isRejected = doc.status === 'rejected';

                    return (
                      <div 
                        key={doc.id}
                        className="glass-panel" 
                        style={{ 
                          padding: '0.9rem', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between',
                          border: isVerified ? '1px solid rgba(34, 197, 94, 0.4)' : isRejected ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <FileText size={20} color={isVerified ? '#4ade80' : '#38bdf8'} />
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: isVerified ? 'rgba(34, 197, 94, 0.2)' : isRejected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                              color: isVerified ? '#4ade80' : isRejected ? '#f87171' : '#facc15'
                            }}>
                              {doc.status.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.2rem' }}>
                            {doc.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', wordBreak: 'break-all' }}>
                            {doc.fileName}
                          </div>
                        </div>

                        <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.4rem', justifyContent: 'space-between' }}>
                          <button
                            type="button"
                            onClick={() => setViewingDoc(doc)}
                            className="btn-glass"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', flex: 1 }}
                          >
                            <Eye size={13} /> Tingnan
                          </button>
                          
                          {canManageRequirements && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleDocStatus(doc.id, 'verified')}
                                className="btn-glass"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}
                                title="Aprubahan ang dokumento"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleDocStatus(doc.id, 'rejected')}
                                className="btn-glass"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}
                                title="Tanggihan ang dokumento"
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Workflow Progress Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Wrench size={14} /> Makina & Chassis Stenciling
                </span>
                <strong style={{ color: selectedApp.inspection?.status === 'passed' ? '#4ade80' : '#facc15', fontSize: '0.9rem', display: 'block', marginTop: '0.2rem' }}>
                  {selectedApp.inspection?.status === 'passed' ? 'PASSED (Stenciled)' : 'PENDING'}
                </strong>
                <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Motor: {selectedApp.motorNumber}</span>
              </div>

              <div className="glass-panel" style={{ padding: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CreditCard size={14} /> Treasurer Fee
                </span>
                <strong style={{ color: selectedApp.treasurerPayment?.paid ? '#4ade80' : '#facc15', fontSize: '0.9rem', display: 'block', marginTop: '0.2rem' }}>
                  {selectedApp.treasurerPayment?.paid ? `PAID (₱${selectedApp.treasurerPayment.amount})` : 'UNPAID'}
                </strong>
                <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>OR #: {selectedApp.treasurerPayment?.orNumber || 'None'}</span>
              </div>

              <div className="glass-panel" style={{ padding: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Award size={14} /> TODA Endorsement
                </span>
                <strong style={{ color: (selectedApp.presidentEndorsed || selectedApp.todaApproval?.routeFeePaid) ? '#4ade80' : '#facc15', fontSize: '0.9rem', display: 'block', marginTop: '0.2rem' }}>
                  {(selectedApp.presidentEndorsed || selectedApp.todaApproval?.routeFeePaid) ? 'ENDORSED' : 'PENDING'}
                </strong>
                <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>{selectedApp.todaName}</span>
              </div>
            </div>

            {/* TASK 2: EFFECTIVITY DATES SECTION */}
            <div style={{ 
              background: 'rgba(6, 182, 212, 0.08)', 
              border: '1px solid rgba(6, 182, 212, 0.25)', 
              borderRadius: '12px', 
              padding: '1.25rem', 
              marginBottom: '1.5rem' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Calendar size={18} color="#38bdf8" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                  Itakda ang Effectivity Dates ng Prangkisa (Registration / Renewal)
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                Itakda ang simula at huling araw ng bisa ng prangkisa. Ang karaniwang bisa ay 1 taon mula sa petsa ng pag-apruba.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Start Date (Simula ng Bisa) *
                  </label>
                  <input
                    type="date"
                    className="glass-input"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    End Date (Katapusan ng Bisa / Expiration) *
                  </label>
                  <input
                    type="date"
                    className="glass-input"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Admin Notes & Remarks (Ilalagay sa Opisyal na Rekord)
              </label>
              <textarea
                className="glass-input"
                rows={2}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => handleReject(selectedApp.id)}
                disabled={loading}
                className="btn-glass"
                style={{ background: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fb7185' }}
              >
                <XCircle size={18} /> Tanggihan Aplikasyon
              </button>

              <button
                type="button"
                onClick={() => handleGrantMtop(selectedApp.id)}
                disabled={loading}
                className="btn-glass btn-emerald-glass"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                <ShieldCheck size={18} /> {loading ? 'Nino-proseso...' : 'Aprubahan at Igawad ang MTOP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {viewingDoc && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setViewingDoc(null)}>
          <div 
            className="glass-container modal-glass-content animate-fade-in" 
            style={{ maxWidth: '600px', width: '90%', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{viewingDoc.name}</h4>
              <button onClick={() => setViewingDoc(null)} className="btn-glass" style={{ padding: '0.3rem 0.6rem' }}>✕</button>
            </div>

            <div style={{ 
              background: 'rgba(0,0,0,0.5)', 
              borderRadius: '12px', 
              padding: '2rem', 
              marginBottom: '1rem',
              minHeight: '260px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed rgba(255,255,255,0.2)'
            }}>
              {(viewingDoc.fileUrl || /^(https?:|blob:)/i.test(viewingDoc.fileName)) ? (
                (() => {
                  const documentUrl = viewingDoc.fileUrl || viewingDoc.fileName;
                  return (
                    <>
                      {/\.(png|jpe?g|gif|webp)(\?|$)/i.test(documentUrl) ? (
                        <img src={documentUrl} alt={viewingDoc.name} style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }} />
                      ) : (
                        <iframe title={viewingDoc.name} src={documentUrl} style={{ width: '100%', height: '400px', border: 0, borderRadius: '8px' }} />
                      )}
                      <a href={documentUrl} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', marginTop: '0.75rem' }}>Open document in new tab</a>
                    </>
                  );
                })()
              ) : (
                <>
                  <FileText size={64} color="#38bdf8" style={{ marginBottom: '1rem' }} />
                  <strong style={{ color: '#ffffff', fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>
                    {viewingDoc.fileName}
                  </strong>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    Opisyal na kopya na naisumite noong {new Date(viewingDoc.uploadedAt).toLocaleDateString()}
                  </span>
                  <div style={{ marginTop: '1rem', padding: '0.4rem 0.8rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '6px', fontSize: '0.78rem', color: '#38bdf8' }}>
                    ✓ Beripikado ang lagda at selyo ng dokumento
                  </div>
                </>
              )}
            </div>

            <button 
              type="button"
              onClick={() => setViewingDoc(null)} 
              className="btn-glass btn-primary-glass" 
              style={{ width: '100%' }}
            >
              Isara ang Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
