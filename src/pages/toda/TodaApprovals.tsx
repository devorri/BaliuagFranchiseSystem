import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import { belongsToToda } from '../../services/todaService';
import type { Application } from '../../types';
import { 
  CheckCircle2, FileText, RefreshCw, UserCheck, 
  Search, ExternalLink, ChevronLeft, ChevronRight,
  Eye, X, Clock, Award
} from 'lucide-react';

export function TodaApprovals() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [viewingDocsApp, setViewingDocsApp] = useState<Application | null>(null);
  const [remarks, setRemarks] = useState('Driver is eligible to join this TODA line. Requirements forwarded for municipal admin review.');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs_approval' | 'endorsed'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  useEffect(() => {
    void loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const apps = await supabaseService.getApplicationsAsync();
      apps.sort((a, b) => new Date(b.updatedAt || b.submittedAt || 0).getTime() - new Date(a.updatedAt || a.submittedAt || 0).getTime());
      setApplications(apps);
    } catch (err) {
      console.error('Error loading TODA applications:', err);
    }
  };

  const handleGrantApproval = async (app: Application) => {
    if (!user) return;
    const now = new Date().toISOString();
    setActionError('');
    setIsSubmitting(true);
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

      if (updated) {
        void supabaseService.recordAuditLogAsync({
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userRole: 'president',
          action: 'TODA_ENDORSED',
          details: `TODA President endorsed application for plate ${app.plateNumber} (${app.driverName || app.applicantName})`,
          targetId: app.id,
        });

        setSuccessMsg(`Application for ${app.driverName || app.applicantName} was endorsed and forwarded to Municipal Admin.`);
        setSelectedApp(null);
        await loadApps();
        setTimeout(() => setSuccessMsg(''), 4500);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to forward application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Base TODA assigned applications
  const assignedApplications = useMemo(() => {
    return applications.filter(app => {
      return belongsToToda(app.todaName, user?.todaName)
        && ['pending_toda_approval', 'pending_admin_approval', 'approved'].includes(app.status);
    });
  }, [applications, user?.todaName]);

  // Filtered and searched applications
  const filteredApplications = useMemo(() => {
    return assignedApplications.filter(app => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (app.driverName || '').toLowerCase().includes(q) ||
        (app.applicantName || '').toLowerCase().includes(q) ||
        (app.plateNumber || '').toLowerCase().includes(q) ||
        (app.id || '').toLowerCase().includes(q) ||
        (app.vehicleMake || '').toLowerCase().includes(q);

      // 2. Status Filter
      const isEndorsed = app.presidentEndorsed || app.status === 'pending_admin_approval' || app.status === 'approved';
      let matchesFilter = true;
      if (statusFilter === 'needs_approval') {
        matchesFilter = !isEndorsed;
      } else if (statusFilter === 'endorsed') {
        matchesFilter = isEndorsed;
      }

      return matchesSearch && matchesFilter;
    }).sort((a, b) => new Date(b.updatedAt || b.submittedAt || 0).getTime() - new Date(a.updatedAt || a.submittedAt || 0).getTime());
  }, [assignedApplications, searchQuery, statusFilter]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, itemsPerPage]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredApplications.length);
  const paginatedApplications = useMemo(() => {
    return filteredApplications.slice(startIndex, endIndex);
  }, [filteredApplications, startIndex, endIndex]);

  const countNeedsApproval = assignedApplications.filter(a => !a.presidentEndorsed && a.status !== 'approved').length;
  const countEndorsed = assignedApplications.filter(a => a.presidentEndorsed || a.status === 'approved').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Container */}
      <div className="glass-container" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span className="pill-badge pill-purple">TODA Line Approvals</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{user?.todaName || 'Baliwag TODA Federation'}</span>
          <button 
            type="button" 
            onClick={() => void loadApps()} 
            className="btn-glass" 
            style={{ marginLeft: 'auto', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }} 
            title="Refresh applications"
          >
            <RefreshCw size={14} /> Refresh List
          </button>
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f8fafc' }}>
          Driver & Line Route Approvals
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '750px', lineHeight: 1.5 }}>
          Review operators and drivers applying for your TODA franchise line. Verify vehicle details and documents before endorsing them to the Municipal Licensing Office.
        </p>

        {successMsg && (
          <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginTop: '1.25rem', border: '1px solid rgba(34, 197, 94, 0.4)', background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={20} />
            {successMsg}
          </div>
        )}

        {actionError && (
          <p role="alert" style={{ color: '#f87171', marginTop: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {actionError}
          </p>
        )}

        {/* Search Bar & Filter Controls */}
        <div style={{ marginTop: '1.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '520px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Driver Name, Operator, Plate #, or Ref ID..."
              className="glass-input"
              style={{ paddingLeft: '2.8rem', width: '100%' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.3rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', flexWrap: 'wrap' }}>
            <button
              onClick={() => setStatusFilter('all')}
              className="btn-glass"
              style={{
                padding: '0.45rem 0.95rem',
                fontSize: '0.82rem',
                background: statusFilter === 'all' ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
                borderColor: statusFilter === 'all' ? '#38bdf8' : 'transparent',
                color: statusFilter === 'all' ? '#38bdf8' : '#94a3b8',
                fontWeight: statusFilter === 'all' ? 700 : 500
              }}
            >
              All ({assignedApplications.length})
            </button>
            <button
              onClick={() => setStatusFilter('needs_approval')}
              className="btn-glass"
              style={{
                padding: '0.45rem 0.95rem',
                fontSize: '0.82rem',
                background: statusFilter === 'needs_approval' ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
                borderColor: statusFilter === 'needs_approval' ? '#fbbf24' : 'transparent',
                color: statusFilter === 'needs_approval' ? '#fbbf24' : '#94a3b8',
                fontWeight: statusFilter === 'needs_approval' ? 700 : 500
              }}
            >
              Needs Line Approval ({countNeedsApproval})
            </button>
            <button
              onClick={() => setStatusFilter('endorsed')}
              className="btn-glass"
              style={{
                padding: '0.45rem 0.95rem',
                fontSize: '0.82rem',
                background: statusFilter === 'endorsed' ? 'rgba(34, 197, 94, 0.22)' : 'transparent',
                borderColor: statusFilter === 'endorsed' ? '#4ade80' : 'transparent',
                color: statusFilter === 'endorsed' ? '#4ade80' : '#94a3b8',
                fontWeight: statusFilter === 'endorsed' ? 700 : 500
              }}
            >
              Endorsed ({countEndorsed})
            </button>
          </div>
        </div>
      </div>

      {/* Linear Applications Data Table View */}
      <div className="glass-container" style={{ padding: '1.75rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Driver Applications Queue
            </h3>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Linear view of drivers registered under {user?.todaName || 'your TODA line'}
            </span>
          </div>

          {filteredApplications.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={e => setItemsPerPage(Number(e.target.value))}
                className="glass-input"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.82rem', width: 'auto', background: 'rgba(10, 24, 16, 0.8)' }}
              >
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
              </select>
              <span>per page</span>
            </div>
          )}
        </div>

        {filteredApplications.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
            <Search size={42} color="#64748b" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
              No Driver Applications Found
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
              {searchQuery ? `No records matched your search "${searchQuery}". Please check the keyword or clear filters.` : 'There are currently no driver applications under this filter.'}
            </p>
          </div>
        ) : (
          <div className="glass-table-wrapper" style={{ border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '200px' }}>Driver / Operator</th>
                  <th style={{ minWidth: '150px' }}>Plate & Vehicle</th>
                  <th style={{ minWidth: '160px' }}>TODA Route</th>
                  <th style={{ minWidth: '170px' }}>Inspection & Treasurer</th>
                  <th style={{ minWidth: '130px', textAlign: 'center' }}>Documents</th>
                  <th style={{ minWidth: '150px' }}>Status</th>
                  <th style={{ minWidth: '150px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedApplications.map(app => {
                  const isApproved = app.presidentEndorsed || app.status === 'pending_admin_approval' || app.status === 'approved';
                  const docCount = app.documents?.length || 0;
                  const verifiedDocCount = (app.documents || []).filter(d => d.status === 'verified').length;

                  return (
                    <tr key={app.id}>
                      {/* Driver / Operator Column */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>
                            {app.driverName || app.applicantName}
                          </strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                              Ref: {app.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                              background: app.type === 'renewal' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(34, 197, 94, 0.18)',
                              color: app.type === 'renewal' ? '#38bdf8' : '#4ade80',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              {app.type || 'new'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Plate & Vehicle Column */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span className="pill-badge pill-cyan" style={{ fontSize: '0.78rem', width: 'fit-content', padding: '0.2rem 0.55rem', letterSpacing: '0.06em' }}>
                            {app.plateNumber}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                            {app.vehicleMake || '—'} {app.vehicleModel || ''}
                          </span>
                        </div>
                      </td>

                      {/* TODA Route Column */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                            {app.todaName}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                            Route Line Assignment
                          </span>
                        </div>
                      </td>

                      {/* Inspection & Treasurer Column */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Stenciling:</span>
                            <span style={{ color: app.inspection?.status === 'passed' ? '#4ade80' : '#fbbf24', fontWeight: 700 }}>
                              {app.inspection?.status === 'passed' ? 'Passed ✓' : 'Pending'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Treasurer:</span>
                            <span style={{ color: app.treasurerPayment?.paid ? '#4ade80' : '#fbbf24', fontWeight: 600 }}>
                              {app.treasurerPayment?.paid ? `Paid (OR #${app.treasurerPayment.orNumber})` : 'Unpaid'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Documents Column */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setViewingDocsApp(app)}
                          className="btn-glass"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            borderColor: docCount > 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.15)',
                            background: docCount > 0 ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                            color: docCount > 0 ? '#38bdf8' : '#94a3b8'
                          }}
                          title="Click to inspect submitted documents"
                        >
                          <FileText size={13} />
                          <span>{docCount} Docs</span>
                          <Eye size={12} style={{ opacity: 0.8 }} />
                        </button>
                        {docCount > 0 && (
                          <span style={{ display: 'block', fontSize: '0.7rem', color: verifiedDocCount === docCount ? '#4ade80' : '#94a3b8', marginTop: '0.2rem' }}>
                            {verifiedDocCount}/{docCount} verified
                          </span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td>
                        {isApproved ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span className="pill-badge pill-approved" style={{ width: 'fit-content', fontSize: '0.72rem' }}>
                              <CheckCircle2 size={12} /> Endorsed
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              {app.presidentEndorsedAt ? new Date(app.presidentEndorsedAt).toLocaleDateString() : 'Active'}
                            </span>
                          </div>
                        ) : (
                          <span className="pill-badge pill-pending" style={{ fontSize: '0.72rem' }}>
                            <Clock size={12} /> Needs Approval
                          </span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td style={{ textAlign: 'right' }}>
                        {isApproved ? (
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="btn-glass"
                            style={{
                              padding: '0.4rem 0.85rem',
                              fontSize: '0.78rem',
                              color: '#cbd5e1',
                              borderColor: 'rgba(255, 255, 255, 0.18)'
                            }}
                            title="View official endorsement details"
                          >
                            <Award size={14} color="#4ade80" /> View Endorsement
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setRemarks('Driver is eligible to join this TODA line. Requirements forwarded for municipal admin review.');
                              setSelectedApp(app);
                            }}
                            className="btn-glass btn-emerald-glass"
                            style={{
                              padding: '0.45rem 1rem',
                              fontSize: '0.82rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <UserCheck size={15} /> Endorse Line
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Linear Pagination Bar */}
        {filteredApplications.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 0.5rem 0.25rem 0.5rem',
            marginTop: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Showing <strong style={{ color: '#ffffff' }}>{startIndex + 1}</strong> to <strong style={{ color: '#ffffff' }}>{endIndex}</strong> of <strong style={{ color: '#ffffff' }}>{filteredApplications.length}</strong> drivers
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-glass"
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.82rem',
                  opacity: currentPage === 1 ? 0.4 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronLeft size={16} /> Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (totalPages > 7 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                  if (page === 2 || page === totalPages - 1) {
                    return <span key={page} style={{ color: '#64748b', padding: '0 0.25rem' }}>…</span>;
                  }
                  return null;
                }
                const isActive = currentPage === page;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className="btn-glass"
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.82rem',
                      minWidth: '34px',
                      background: isActive ? 'rgba(34, 197, 94, 0.3)' : 'transparent',
                      borderColor: isActive ? '#22c55e' : 'rgba(255, 255, 255, 0.1)',
                      color: isActive ? '#4ade80' : '#cbd5e1',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-glass"
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.82rem',
                  opacity: currentPage === totalPages ? 0.4 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submitted Requirements Modal */}
      {viewingDocsApp && (
        <div className="modal-overlay" onClick={() => setViewingDocsApp(null)}>
          <div
            className="glass-container modal-glass-content animate-fade-in"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '650px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Submitted Requirements
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Applicant: <strong style={{ color: '#ffffff' }}>{viewingDocsApp.driverName || viewingDocsApp.applicantName}</strong> (Plate: {viewingDocsApp.plateNumber})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingDocsApp(null)}
                className="btn-glass"
                style={{ padding: '0.4rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(!viewingDocsApp.documents || viewingDocsApp.documents.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No documents have been uploaded for this application yet.
                </div>
              ) : (
                viewingDocsApp.documents.map(doc => {
                  const documentUrl = doc.fileUrl || (/^(https?:|blob:)/i.test(doc.fileName) ? doc.fileName : undefined);
                  const isDocVerified = doc.status === 'verified';
                  const isDocRejected = doc.status === 'rejected';

                  return (
                    <div
                      key={doc.id}
                      className="glass-panel"
                      style={{
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        border: isDocVerified ? '1px solid rgba(34, 197, 94, 0.3)' : isDocRejected ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <FileText size={18} color="#38bdf8" />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#ffffff', display: 'block' }}>
                            {doc.name}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            File: {doc.fileName}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          textTransform: 'uppercase',
                          background: isDocVerified ? 'rgba(34, 197, 94, 0.18)' : isDocRejected ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                          color: isDocVerified ? '#4ade80' : isDocRejected ? '#f87171' : '#fbbf24',
                          border: isDocVerified ? '1px solid rgba(34, 197, 94, 0.4)' : isDocRejected ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                        }}>
                          {doc.status}
                        </span>

                        {documentUrl && (
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-glass"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              color: '#38bdf8',
                              textDecoration: 'none'
                            }}
                          >
                            <Eye size={13} /> View File <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setViewingDocsApp(null)}
                className="btn-glass"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Line Endorsement / Details Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="glass-container modal-glass-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Award size={24} color="#c084fc" />
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                TODA Line Route Endorsement
              </h3>
            </div>
            
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Applicant: <strong style={{ color: '#ffffff' }}>{selectedApp.driverName || selectedApp.applicantName}</strong> · Plate: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{selectedApp.plateNumber}</span> · Line: <strong style={{ color: '#ffffff' }}>{selectedApp.todaName}</strong>
            </p>

            {selectedApp.presidentEndorsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                  <span style={{ color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <CheckCircle2 size={18} /> Official Line Endorsement Completed
                  </span>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0.4rem 0' }}>
                    Endorsed by: <strong>{selectedApp.presidentEndorsedBy || 'TODA President'}</strong>
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0.4rem 0' }}>
                    Endorsed on: {selectedApp.presidentEndorsedAt ? new Date(selectedApp.presidentEndorsedAt).toLocaleString() : 'Recent'}
                  </p>
                  {selectedApp.presidentRemarks && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.82rem', color: '#94a3b8' }}>
                      <strong>Remarks:</strong> {selectedApp.presidentRemarks}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="btn-glass"
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                      Official TODA Endorsement Remarks:
                    </label>
                    <textarea
                      className="glass-input"
                      rows={3}
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Add remarks certifying the applicant's line eligibility..."
                    />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                    By endorsing, you certify that this driver is eligible for the designated TODA route line in Baliwag City.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    disabled={isSubmitting}
                    className="btn-glass"
                    style={{ flex: 1, padding: '0.75rem' }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleGrantApproval(selectedApp)}
                    disabled={isSubmitting}
                    className="btn-glass btn-emerald-glass"
                    style={{ flex: 2, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <UserCheck size={18} /> {isSubmitting ? 'Endorsing...' : 'Confirm & Endorse to Admin'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
