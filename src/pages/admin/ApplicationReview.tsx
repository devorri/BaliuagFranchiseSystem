import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import * as supabaseService from '../../services/supabaseService';
import type { Application, Document, DocumentType, TreasurerPayment } from '../../types';
import { hasCompleteRequirements } from '../../services/applicationRules';
import { sendMtopCertificateEmail } from '../../services/emailService';
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
  const [filterTab, setFilterTab] = useState<'needs_action' | 'pending_admin' | 'approved' | 'all'>('needs_action');

  // Document Confirmation Modals State
  const [docToVerify, setDocToVerify] = useState<Document | null>(null);
  const [docToReject, setDocToReject] = useState<Document | null>(null);
  const [rejectionPreset, setRejectionPreset] = useState<string>('Expired document / Needs latest renewal copy');
  const [customRejectionNotes, setCustomRejectionNotes] = useState<string>('');

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
    const reviewerName = user ? `${user.firstName} ${user.lastName} (Municipal Admin)` : 'Municipal Licensing Admin';

    const finalStartDate = startDate || todayStr;
    const finalEndDate = endDate || nextYearStr;

    if (new Date(finalStartDate) >= new Date(finalEndDate)) {
      showToast('End Date must be after the Start Date.', 'error');
      return;
    }

    if (!selectedApp) return;

    // Check for any rejected documents
    const hasRejectedDocs = (selectedApp.documents || []).some(d => d.status === 'rejected');
    if (hasRejectedDocs) {
      showToast('Cannot grant MTOP: One or more requirements are marked as rejected. The applicant must resubmit valid documents first.', 'error');
      return;
    }

    // Check for unverified documents
    const hasUnverifiedDocs = (selectedApp.documents || []).some(d => d.status !== 'verified');
    if (hasUnverifiedDocs) {
      showToast('Cannot grant MTOP: All submitted requirements must be verified first.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (!hasCompleteRequirements(selectedApp.documents, selectedApp.type) || selectedApp.inspection?.status !== 'passed' || !selectedApp.presidentEndorsed || !selectedApp.treasurerPayment?.paid) {
        showToast('Cannot grant MTOP: Ensure requirements, TODA endorsement, passed inspection, and verified payment are complete.', 'error');
        return;
      }

      const updated = await supabaseService.updateApplicationStatusAsync(
        appId,
        'approved',
        adminNotes,
        reviewerName,
        finalStartDate,
        finalEndDate
      );

      if (updated) {
        void supabaseService.recordAuditLogAsync({
          userId: user?.id,
          userName: reviewerName,
          userRole: user?.role || 'admin',
          action: 'MTOP_GRANTED',
          details: `Granted MTOP #${updated.mtopNumber || 'Approved'} for plate ${selectedApp.plateNumber} (Effectivity: ${finalStartDate} to ${finalEndDate})`,
          targetId: appId,
        });

        // Dispatch official EmailJS MTOP Certificate Release email
        void supabaseService.getUsersAsync().then(allUsers => {
          const applicantUser = allUsers.find(u => u.id === selectedApp.applicantId || u.id === selectedApp.driverId);
          if (applicantUser?.email) {
            void sendMtopCertificateEmail({
              toEmail: applicantUser.email,
              applicantName: updated.applicantName || `${applicantUser.firstName} ${applicantUser.lastName}`,
              mtopNumber: updated.mtopNumber || 'MTOP-APPROVED',
              plateNumber: updated.plateNumber,
              todaName: updated.todaName || 'Baliwag TODA Association',
              validUntil: `${finalStartDate} to ${finalEndDate}`,
              certificateUrl: window.location.origin + '/operator/certification',
            });
          }
        }).catch(e => console.warn('Certificate email dispatch notice:', e));

        showToast(`MTOP Granted! Official MTOP #: ${updated.mtopNumber || 'Approved'}. Effectivity: ${finalStartDate} to ${finalEndDate}.`, 'success');
        setSelectedApp(null);
        await loadApplications();
      }
    } catch (err) {
      console.error('Error approving MTOP:', err);
      showToast(err instanceof Error ? err.message : 'An error occurred while approving the MTOP.', 'error');
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

  const confirmVerifyDoc = async () => {
    if (!docToVerify || !selectedApp) return;
    setLoading(true);
    try {
      const updatedDocs = (selectedApp.documents || []).map(d => 
        d.id === docToVerify.id ? {
          ...d,
          status: 'verified' as const,
          rejectionReason: undefined,
          reviewedAt: new Date().toISOString()
        } : d
      );
      const updatedApp = { ...selectedApp, documents: updatedDocs };
      const saved = await supabaseService.saveApplicationAsync(updatedApp, true);
      setSelectedApp(saved);
      showToast(`Document "${docToVerify.name}" verified and accepted.`, 'success');
      setDocToVerify(null);
      await loadApplications();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save document verification.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmRejectDoc = async () => {
    if (!docToReject || !selectedApp) return;
    setLoading(true);
    try {
      const finalReason = customRejectionNotes.trim()
        ? `${rejectionPreset}: ${customRejectionNotes.trim()}`
        : rejectionPreset || 'Document declined by municipal admin.';

      const updatedDocs = (selectedApp.documents || []).map(d => 
        d.id === docToReject.id ? {
          ...d,
          status: 'rejected' as const,
          rejectionReason: finalReason,
          reviewedAt: new Date().toISOString()
        } : d
      );
      const updatedApp: Application = {
        ...selectedApp,
        status: 'requires_revision',
        documents: updatedDocs,
        adminNotes: `Requirement issue: ${docToReject.name} - ${finalReason}`
      };
      const saved = await supabaseService.saveApplicationAsync(updatedApp, true);
      setSelectedApp(saved);
      showToast(`Document "${docToReject.name}" declined with reason recorded.`, 'info');
      setDocToReject(null);
      setCustomRejectionNotes('');
      await loadApplications();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save document rejection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAllDocs = async () => {
    if (!selectedApp) return;
    const hasRejectedDocs = (selectedApp.documents || []).some(d => d.status === 'rejected');
    if (hasRejectedDocs) {
      showToast('Cannot verify all: One or more documents are rejected. Please resolve rejected items first.', 'error');
      return;
    }
    setLoading(true);
    try {
      const updatedDocs = (selectedApp.documents || []).map(d => ({
        ...d,
        status: 'verified' as const,
        reviewedAt: new Date().toISOString()
      }));
      const updatedApp = { ...selectedApp, documents: updatedDocs };
      const saved = await supabaseService.saveApplicationAsync(updatedApp, true);
      setSelectedApp(saved);
      void supabaseService.recordAuditLogAsync({
        userId: user?.id,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Franchise Officer',
        userRole: user?.role || 'franchise_officer',
        action: 'DOCUMENT_VERIFIED',
        details: `Verified all requirements for applicant ${selectedApp.applicantName} (Plate: ${selectedApp.plateNumber})`,
        targetId: selectedApp.id,
      });
      showToast('All documents have been verified successfully.', 'success');
      await loadApplications();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save document verification.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveInspection = async (appId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const inspectorName = `${user.firstName} ${user.lastName} (City Stenciling Office)`;
      const notes = 'Engine and chassis stenciling verified. All numbers verified against registered OR/CR.';
      const updated = await supabaseService.recordInspectionAsync(
        appId,
        true,
        true,
        inspectorName,
        notes
      );
      if (updated) {
        void supabaseService.recordAuditLogAsync({
          userId: user?.id,
          userName: inspectorName,
          userRole: user?.role || 'franchise_officer',
          action: 'STENCILING_PASSED',
          details: `Passed engine & chassis stenciling for Motor #${updated.motorNumber} / Plate ${updated.plateNumber}`,
          targetId: appId,
        });
        showToast('Nai-record na pumasa ang makina at chassis stenciling!', 'success');
        setSelectedApp(updated);
        await loadApplications();
      }
    } catch {
      showToast('Hindi na-save ang stenciling record.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminEndorseToda = async (appId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const updated = await supabaseService.endorseApplicationByPresidentAsync(
        appId,
        `${user.firstName} ${user.lastName} (Admin Override)`,
        'Verified and endorsed for MTOP grant by Municipal Licensing Officer.'
      );
      if (updated) {
        showToast('Nai-record ang TODA endorsement ng Admin!', 'success');
        setSelectedApp(updated);
        await loadApplications();
      }
    } catch {
      showToast('Hindi na-save ang TODA endorsement.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTreasurerPaid = async (appId: string) => {
    if (!user || !selectedApp || selectedApp.id !== appId) return;
    setLoading(true);
    try {
      const orNumber = `OR-ADM-${Date.now().toString().slice(-6)}`;
      const updatedPayment: TreasurerPayment = {
        amount: selectedApp.treasurerPayment?.amount || selectedApp.totalFee || 450,
        paid: true,
        paidAt: new Date().toISOString(),
        orNumber: selectedApp.treasurerPayment?.orNumber || orNumber,
        paymentMethod: 'gcash'
      };
      const updatedApp = { ...selectedApp, treasurerPayment: updatedPayment };
      const saved = await supabaseService.saveApplicationAsync(updatedApp, true);
      setSelectedApp(saved);
      void supabaseService.recordAuditLogAsync({
        userId: user?.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        action: 'PAYMENT_VERIFIED',
        details: `Treasurer fee marked cleared: ₱${updatedPayment.amount.toFixed(2)} (OR: ${updatedPayment.orNumber})`,
        targetId: appId,
      });
      showToast('Nai-record na bayad na ang Treasurer Fee!', 'success');
      await loadApplications();
    } catch {
      showToast('Hindi na-save ang payment record.', 'error');
    } finally {
      setLoading(false);
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

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {[
            { key: 'needs_action' as const, label: 'Needs Action', color: '#facc15' },
            { key: 'pending_admin' as const, label: 'Pending Approval', color: '#f97316' },
            { key: 'approved' as const, label: 'Approved / Granted', color: '#34d399' },
            { key: 'all' as const, label: 'All Applications', color: '#38bdf8' },
          ].map(tab => {
            const isActive = filterTab === tab.key;
            const count = applications.filter(app => {
              if (tab.key === 'needs_action') return app.status !== 'approved' && app.status !== 'rejected';
              if (tab.key === 'pending_admin') return app.status === 'pending_admin_approval';
              if (tab.key === 'approved') return app.status === 'approved';
              return true;
            }).length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTab(tab.key)}
                className="btn-glass"
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? `${tab.color}22` : 'transparent',
                  borderColor: isActive ? `${tab.color}66` : 'rgba(255,255,255,0.12)',
                  color: isActive ? tab.color : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem' }}>
        {applications.filter(app => {
          if (filterTab === 'needs_action') return app.status !== 'approved' && app.status !== 'rejected';
          if (filterTab === 'pending_admin') return app.status === 'pending_admin_approval';
          if (filterTab === 'approved') return app.status === 'approved';
          return true; // 'all'
        }).map(app => {
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
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Plate / Body No. (MTOP): <strong>{app.plateNumber}</strong> {app.mtopNumber ? `• MTOP #${app.mtopNumber}` : ''}</span>
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
                ) : app.status === 'rejected' ? (
                  <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                    <strong style={{ color: '#f87171' }}>❌ Application Rejected</strong>
                    <br />
                    <span style={{ color: '#cbd5e1' }}>{app.reviewedBy ? `By ${app.reviewedBy}` : ''}</span>
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
                  Applicant: <strong style={{ color: '#38bdf8' }}>{selectedApp.driverName || selectedApp.applicantName}</strong> | Plate / Body No. (MTOP): <strong style={{ color: '#ffffff' }}>{selectedApp.plateNumber}</strong> ({selectedApp.todaName})
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
                          {doc.status === 'rejected' && doc.rejectionReason && (
                            <div style={{ marginTop: '0.5rem', padding: '0.45rem 0.65rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '6px', fontSize: '0.73rem', color: '#fca5a5' }}>
                              <strong style={{ color: '#f87171' }}>Reason:</strong> {doc.rejectionReason}
                            </div>
                          )}
                        </div>

                        <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.4rem', justifyContent: 'space-between' }}>
                          <button
                            type="button"
                            onClick={() => setViewingDoc(doc)}
                            className="btn-glass"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', flex: 1 }}
                          >
                            <Eye size={13} /> View
                          </button>
                          
                          {canManageRequirements && (
                            <>
                              <button
                                type="button"
                                onClick={() => setDocToVerify(doc)}
                                className="btn-glass"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.4)' }}
                                title="Accept & Verify Document"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDocToReject(doc);
                                  setRejectionPreset('Expired document / Needs latest renewal copy');
                                  setCustomRejectionNotes('');
                                }}
                                className="btn-glass"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                                title="Decline & Reject Requirement"
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

              {/* Verify All Documents Button */}
              {canManageRequirements && selectedApp.documents && selectedApp.documents.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleVerifyAllDocs}
                    disabled={loading || requiredDocumentTypes.every(type => selectedApp.documents?.some(doc => doc.type === type && doc.status === 'verified'))}
                    className="btn-glass"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      fontSize: '0.85rem',
                      background: 'rgba(34, 197, 94, 0.12)',
                      borderColor: 'rgba(34, 197, 94, 0.3)',
                      color: '#4ade80'
                    }}
                  >
                    <FileCheck size={16} /> {requiredDocumentTypes.every(type => selectedApp.documents?.some(doc => doc.type === type && doc.status === 'verified')) ? '✓ Lahat ng Dokumento ay Verified Na' : 'I-Verify Lahat ng Dokumento'}
                  </button>
                </div>
              )}
            </div>

            {/* LGU Official Fee Assessment Sheet (Step 6) */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={18} color="#38bdf8" />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
                    LGU Official Fee Assessment Sheet (Step 6 Assessment)
                  </h4>
                </div>
                <span className={`pill-badge ${selectedApp.treasurerPayment?.paid ? 'pill-emerald' : 'pill-orange'}`}>
                  {selectedApp.treasurerPayment?.paid ? 'PAYMENT CLEARED' : 'AWAITING PAYMENT'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Base MTOP Franchise Fee</span>
                  <strong style={{ color: '#ffffff' }}>₱450.00</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Residency Assessment</span>
                  <strong style={{ color: selectedApp.residency === 'baliwag_resident' ? '#4ade80' : '#fb923c' }}>
                    {selectedApp.residency === 'baliwag_resident' ? 'Baliwag Resident (₱0)' : 'Non-Resident (+₱500.00)'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Mechanical Stenciling</span>
                  <strong style={{ color: '#ffffff' }}>Included in Assessment</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Total Assessed Fee</span>
                  <strong style={{ color: '#4ade80', fontSize: '1.2rem' }}>
                    ₱{(selectedApp.totalFee || 450).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Workflow Progress Details Grid — with Admin Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Stenciling Panel */}
              <div className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Wrench size={14} /> Makina & Chassis Stenciling
                </span>
                <strong style={{ color: selectedApp.inspection?.status === 'passed' ? '#4ade80' : '#facc15', fontSize: '0.9rem', display: 'block', marginTop: '0.2rem' }}>
                  {selectedApp.inspection?.status === 'passed' ? 'PASSED (Stenciled)' : 'PENDING'}
                </strong>
                <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Motor: {selectedApp.motorNumber}</span>
                {selectedApp.inspection?.status !== 'passed' && (
                  <button
                    type="button"
                    onClick={() => handleApproveInspection(selectedApp.id)}
                    disabled={loading}
                    className="btn-glass"
                    style={{ marginTop: '0.4rem', padding: '0.4rem 0.6rem', fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}
                  >
                    <CheckCircle2 size={13} /> Approve Stenciling
                  </button>
                )}
              </div>

              {/* Treasurer Fee Panel */}
              <div className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CreditCard size={14} /> Treasurer Fee
                </span>
                <strong style={{ color: selectedApp.treasurerPayment?.paid ? '#4ade80' : '#facc15', fontSize: '0.9rem', display: 'block', marginTop: '0.2rem' }}>
                  {selectedApp.treasurerPayment?.paid ? `PAID (₱${selectedApp.treasurerPayment.amount})` : 'UNPAID'}
                </strong>
                <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>OR #: {selectedApp.treasurerPayment?.orNumber || 'None'}</span>
                {!selectedApp.treasurerPayment?.paid && (
                  <button
                    type="button"
                    onClick={() => handleMarkTreasurerPaid(selectedApp.id)}
                    disabled={loading}
                    className="btn-glass"
                    style={{ marginTop: '0.4rem', padding: '0.4rem 0.6rem', fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}
                  >
                    <CheckCircle2 size={13} /> Mark Paid (Admin)
                  </button>
                )}
              </div>

              {/* TODA Endorsement Panel */}
              <div className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Award size={14} /> TODA Endorsement
                </span>
                <strong style={{ color: (selectedApp.presidentEndorsed || selectedApp.todaApproval?.routeFeePaid) ? '#4ade80' : '#facc15', fontSize: '0.9rem', display: 'block', marginTop: '0.2rem' }}>
                  {(selectedApp.presidentEndorsed || selectedApp.todaApproval?.routeFeePaid) ? 'ENDORSED' : 'PENDING'}
                </strong>
                <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>{selectedApp.todaName}</span>
                {!selectedApp.presidentEndorsed && !selectedApp.todaApproval?.routeFeePaid && (
                  <button
                    type="button"
                    onClick={() => handleAdminEndorseToda(selectedApp.id)}
                    disabled={loading}
                    className="btn-glass"
                    style={{ marginTop: '0.4rem', padding: '0.4rem 0.6rem', fontSize: '0.75rem', background: 'rgba(168, 85, 247, 0.12)', borderColor: 'rgba(168, 85, 247, 0.3)', color: '#d8b4fe' }}
                  >
                    <Award size={13} /> Admin Endorse TODA
                  </button>
                )}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  An official <strong>MTOP Number</strong> and <strong>QR Code</strong> will be automatically generated upon approval.
                </span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleReject(selectedApp.id)}
                    disabled={loading}
                    className="btn-glass"
                    style={{ background: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fb7185', cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    <XCircle size={18} /> Reject Entire Application
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGrantMtop(selectedApp.id)}
                    disabled={
                      loading || 
                      !selectedApp.treasurerPayment?.paid ||
                      selectedApp.documents?.some(d => d.status === 'rejected') ||
                      !selectedApp.documents?.every(d => d.status === 'verified')
                    }
                    className="btn-glass btn-emerald-glass"
                    style={{
                      padding: '0.75rem 1.75rem',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: (loading || !selectedApp.treasurerPayment?.paid || selectedApp.documents?.some(d => d.status === 'rejected') || !selectedApp.documents?.every(d => d.status === 'verified')) ? 'not-allowed' : 'pointer',
                      opacity: (!selectedApp.treasurerPayment?.paid || selectedApp.documents?.some(d => d.status === 'rejected') || !selectedApp.documents?.every(d => d.status === 'verified')) ? 0.6 : 1
                    }}
                  >
                    <ShieldCheck size={18} /> {
                      loading ? 'Processing...' : 
                      selectedApp.documents?.some(d => d.status === 'rejected') ? 'Requirements Have Rejections' :
                      !selectedApp.documents?.every(d => d.status === 'verified') ? 'Verify All Requirements First' :
                      !selectedApp.treasurerPayment?.paid ? 'Payment Clearance Required' : 
                      'Approve & Issue MTOP Permit'
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT ACCEPTANCE CONFIRMATION MODAL */}
      {docToVerify && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }} onClick={() => setDocToVerify(null)}>
          <div
            className="glass-container modal-glass-content"
            style={{ maxWidth: '440px', padding: '2rem', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <CheckCircle2 size={30} color="#4ade80" />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
              Accept & Verify Document
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              Are you sure you want to accept and verify this requirement? Please confirm that the uploaded file is authentic and clear.
            </p>

            <div className="glass-panel" style={{ padding: '0.85rem 1rem', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.82rem' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Requirement Name:</div>
              <strong style={{ color: '#ffffff', display: 'block', marginBottom: '0.4rem' }}>{docToVerify.name}</strong>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Attached File:</div>
              <span style={{ color: '#38bdf8', wordBreak: 'break-all' }}>{docToVerify.fileName}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDocToVerify(null)}
                className="btn-glass"
                style={{ padding: '0.75rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmVerifyDoc}
                className="btn-glass btn-emerald-glass"
                style={{ padding: '0.75rem', fontWeight: 700 }}
              >
                Confirm & Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT REJECTION CONFIRMATION & REASON MODAL */}
      {docToReject && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }} onClick={() => setDocToReject(null)}>
          <div
            className="glass-container modal-glass-content"
            style={{ maxWidth: '480px', padding: '2rem' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <XCircle size={26} color="#f87171" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Decline & Reject Requirement
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {docToReject.name}
                </span>
              </div>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.86rem', lineHeight: '1.45', marginBottom: '1.2rem' }}>
              Are you sure you want to decline this document? Please specify the reason below so the applicant knows what to correct and resubmit.
            </p>

            <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>File to be rejected:</div>
              <span style={{ color: '#fca5a5', wordBreak: 'break-all' }}>{docToReject.fileName}</span>
            </div>

            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
              Select Rejection Reason:
            </label>
            <select
              className="glass-input glass-select"
              style={{ width: '100%', marginBottom: '1rem' }}
              value={rejectionPreset}
              onChange={e => setRejectionPreset(e.target.value)}
            >
              <option value="Expired document / Needs latest renewal copy">Expired document / Needs latest renewal copy</option>
              <option value="Blurry, cropped, or unreadable scan / photo">Blurry, cropped, or unreadable scan / photo</option>
              <option value="Incorrect document uploaded (does not match requirement)">Incorrect document uploaded (does not match requirement)</option>
              <option value="Missing official signature, LTO stamp, or certification seal">Missing official signature, LTO stamp, or certification seal</option>
              <option value="Custom remarks">Other (Provide custom notes below)</option>
            </select>

            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
              Additional Instructions for Applicant (Optional):
            </label>
            <textarea
              className="glass-input"
              rows={2}
              placeholder="e.g. Please take a clearer photo under good lighting showing the entire certificate..."
              value={customRejectionNotes}
              onChange={e => setCustomRejectionNotes(e.target.value)}
              style={{ width: '100%', marginBottom: '1.5rem' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDocToReject(null)}
                className="btn-glass"
                style={{ padding: '0.75rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRejectDoc}
                className="btn-glass"
                style={{
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.25)',
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  color: '#fca5a5',
                  fontWeight: 700
                }}
              >
                Confirm & Reject Document
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
