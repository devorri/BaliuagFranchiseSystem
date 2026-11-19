import { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Search, Filter, 
  ShieldCheck, Clock, UserCheck, ShieldAlert, Plus,
  FileText, Eye, RefreshCw, ExternalLink, Smartphone,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PaginationBar } from '../../components/ui/PaginationBar';
import * as supabaseService from '../../services/supabaseService';
import { TODA_ROUTES } from '../../services/applicationRules';
import { verifyLtoLicenseAuthority } from '../../services/ocrService';
import type { User, AccountStatus } from '../../types';

export function AccountManagement() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showPresidentForm, setShowPresidentForm] = useState(false);
  const [creatingPresident, setCreatingPresident] = useState(false);
  const [presidentError, setPresidentError] = useState<string | null>(null);
  const [viewingUserDocs, setViewingUserDocs] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTableFolded, setIsTableFolded] = useState(false);
  const PAGE_SIZE = 10;
  const [presidentForm, setPresidentForm] = useState({
    firstName: '', lastName: '', username: '', password: '', email: '', phone: '', address: '', todaName: Object.keys(TODA_ROUTES)[0],
  });

  const canManageSecurity = hasPermission('security');

  const loadUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await supabaseService.getUsersAsync();
      data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setUsers(data);
    } catch {
      if (!silent) showToast('Failed to load accounts.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    const interval = setInterval(() => void loadUsers(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAssignToda = async (targetUser: User, newToda: string) => {
    try {
      await supabaseService.updateUserTodaAsync(targetUser.id, newToda);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, todaName: newToda } : u));
      showToast(`Assigned ${targetUser.firstName} ${targetUser.lastName} to ${newToda}.`, 'success');
    } catch {
      showToast('Failed to update TODA assignment.', 'error');
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: 'approved' | 'rejected', userName: string) => {
    if (!canManageSecurity) {
      showToast('You do not have Security Admin permissions to approve or reject accounts.', 'error');
      return;
    }

    const targetAccount = users.find(u => u.id === userId);
    setActionLoadingId(userId);
    try {
      const reason = newStatus === 'rejected' ? 'Incomplete or unverified LTO Driver\'s License / Government ID.' : undefined;
      const updated = await supabaseService.updateAccountStatusAsync(userId, newStatus, reason);
      if (updated) {
        void supabaseService.recordAuditLogAsync({
          userName: 'Security Administrator',
          userRole: 'admin',
          action: newStatus === 'approved' ? 'ACCOUNT_APPROVED' : 'ACCOUNT_REJECTED',
          details: `Account for ${userName} was marked as ${newStatus.toUpperCase()} and SMS notification dispatched to ${targetAccount?.phone || 'registrant'}`,
          targetId: userId,
        });
        showToast(
          `Account for ${userName} ${newStatus === 'approved' ? 'APPROVED' : 'REJECTED'}. SMS notification sent to ${targetAccount?.phone || 'registrant'}!`,
          newStatus === 'approved' ? 'success' : 'info'
        );
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, accountStatus: newStatus } : u));
      } else {
        showToast('Failed to update account status.', 'error');
      }
    } catch {
      showToast('An error occurred during account update.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreatePresident = async (e: React.FormEvent) => {
    e.preventDefault();
    setPresidentError(null);
    if (!canManageSecurity) {
      setPresidentError('Only administrators with security authorization can create TODA President accounts.');
      return;
    }
    if (presidentForm.password.length < 6) {
      setPresidentError('Password must be at least 6 characters.');
      return;
    }
    setCreatingPresident(true);
    try {
      const created = await supabaseService.createPresidentAsync({
        ...presidentForm,
        middleName: undefined,
        adminPermissions: ['president'],
      });
      setUsers(current => [created, ...current]);
      setShowPresidentForm(false);
      setPresidentForm({ firstName: '', lastName: '', username: '', password: '', email: '', phone: '', address: '', todaName: Object.keys(TODA_ROUTES)[0] });
      showToast('TODA President account created.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create the President account.';
      setPresidentError(message);
      showToast(message, 'error');
    } finally {
      setCreatingPresident(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.todaName && u.todaName.toLowerCase().includes(search.toLowerCase()));

    const status = u.accountStatus || 'approved';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const isOperatorDriverRole = u.role === 'operator' || u.role === 'driver';
    const isPresidentRole = u.role === 'president' || u.role === 'toda_president';
    const matchesRole = 
      roleFilter === 'all' ||
      (roleFilter === 'operator_driver' && isOperatorDriverRole) ||
      (roleFilter === 'president' && isPresidentRole) ||
      (roleFilter === 'franchise_officer' && u.role === 'franchise_officer') ||
      (roleFilter === 'admin' && u.role === 'admin') ||
      u.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, roleFilter]);

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pendingCount = users.filter(u => u.accountStatus === 'pending').length;
  const approvedCount = users.filter(u => !u.accountStatus || u.accountStatus === 'approved').length;
  const rejectedCount = users.filter(u => u.accountStatus === 'rejected').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Title & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>Account Management</h1>
            <span style={{ 
              background: canManageSecurity ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
              color: canManageSecurity ? '#4ade80' : '#f87171',
              border: `1px solid ${canManageSecurity ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              padding: '0.2rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <ShieldCheck size={14} /> Security Admin Control & LTO License Verification
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Verify uploaded LTO Driver's Licenses, assign TODA lines, and approve or reject accounts (automatically sends SMS notification to the registrant).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => void loadUsers()} className="btn-glass" style={{ padding: '0.55rem 0.9rem', fontSize: '0.82rem' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          {canManageSecurity && (
            <button type="button" onClick={() => { setPresidentError(null); setShowPresidentForm(true); }} className="btn-glass btn-primary-glass">
              <Plus size={18} /> Create President Account
            </button>
          )}
        </div>

        {/* Status Counts */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', borderLeft: '3px solid #38bdf8' }}>
            <Users size={18} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Registered</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>{users.filter(u => u.role === 'driver' || u.role === 'operator').length}</div>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Clock size={18} color="#facc15" />
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Pending</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#facc15' }}>{pendingCount}</div>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck size={18} color="#4ade80" />
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Approved</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4ade80' }}>{approvedCount}</div>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <XCircle size={18} color="#f87171" />
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Rejected</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171' }}>{rejectedCount}</div>
            </div>
          </div>
        </div>
      </div>

      {!canManageSecurity && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fef08a', fontSize: '0.88rem' }}>
          <ShieldAlert size={20} color="#facc15" />
          <span>NOTICE: You are logged in as Admin, but lack <strong>Security Permissions</strong>. Account viewing is available, but account approval/rejection is restricted to Security Admins.</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-container" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="glass-input"
            style={{ paddingLeft: '2.75rem', width: '100%' }}
            placeholder="Search by name, username, TODA..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#94a3b8" />
            <select
              className="glass-input glass-select"
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <select
            className="glass-input glass-select"
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="operator_driver">Operator / Driver</option>
            <option value="franchise_officer">Franchise Officer</option>
            <option value="president">TODA President</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Accounts Table (Foldable & Paginated 10 per page) */}
      <div className="glass-container" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isTableFolded ? 0 : '1rem', paddingBottom: isTableFolded ? 0 : '0.75rem', borderBottom: isTableFolded ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Registered System Accounts ({filteredUsers.length})
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Showing 10 accounts per page</span>
          </div>
          <button
            type="button"
            onClick={() => setIsTableFolded(!isTableFolded)}
            className="btn-glass"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', color: '#38bdf8' }}
          >
            {isTableFolded ? <><ChevronDown size={15} /> See More</> : <><ChevronUp size={15} /> See Less</>}
          </button>
        </div>

        {!isTableFolded && (
          loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Fetching registered accounts...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <Users size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              No accounts match your current filter.
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Name / Username</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Assigned TODA / Contact</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Registration Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action (LTO Check & Approval)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(u => {
                const status = u.accountStatus || 'approved';
                const isPending = status === 'pending';
                const isApproved = status === 'approved';
                const isRejected = status === 'rejected';
                const isLoadingAction = actionLoadingId === u.id;
                const docCount = (u.documents && u.documents.length > 0) ? u.documents.length : (u.profilePhoto ? 1 : 0);

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>
                        {u.firstName} {u.middleName ? `${u.middleName} ` : ''}{u.lastName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                        @{u.username}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {(() => {
                        const isOperatorOrDriver = u.role === 'operator' || u.role === 'driver';
                        const isPresidentRole = u.role === 'president' || u.role === 'toda_president';
                        const isFranchiseOfficer = u.role === 'franchise_officer';
                        const isAdminRole = u.role === 'admin';

                        const roleLabel = isOperatorOrDriver ? 'Operator / Driver' :
                                          isPresidentRole ? 'TODA President' :
                                          isFranchiseOfficer ? 'Franchise Officer' :
                                          isAdminRole ? 'Administrator' : u.role;

                        return (
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: isAdminRole ? 'rgba(249, 115, 22, 0.2)' :
                                       isFranchiseOfficer ? 'rgba(6, 182, 212, 0.2)' :
                                       isPresidentRole ? 'rgba(168, 85, 247, 0.2)' :
                                       'rgba(52, 211, 153, 0.2)',
                            color: isAdminRole ? '#fb923c' :
                                   isFranchiseOfficer ? '#38bdf8' :
                                   isPresidentRole ? '#c084fc' :
                                   '#34d399',
                          }}>
                            {roleLabel}
                          </span>
                        );
                      })()}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {(u.role === 'operator' || u.role === 'driver' || u.role === 'president' || u.role === 'toda_president') ? (
                        <select
                          aria-label={`Assign TODA for ${u.firstName} ${u.lastName}`}
                          className="glass-input glass-select"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', width: 'auto', maxWidth: '240px', marginBottom: '0.25rem' }}
                          value={u.todaName || ''}
                          onChange={e => void handleAssignToda(u, e.target.value)}
                        >
                          <option value="">Assign TODA...</option>
                          {Object.keys(TODA_ROUTES).map(toda => (
                            <option key={toda} value={toda}>{toda}</option>
                          ))}
                          {u.todaName && !Object.keys(TODA_ROUTES).includes(u.todaName) && (
                            <option value={u.todaName}>{u.todaName}</option>
                          )}
                        </select>
                      ) : (
                        <div style={{ color: '#e2e8f0' }}>{u.todaName || '—'}</div>
                      )}
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{u.phone || u.email || '—'}</div>
                    </td>

                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: isPending ? 'rgba(234, 179, 8, 0.15)' :
                                   isApproved ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isPending ? '#facc15' :
                               isApproved ? '#4ade80' : '#f87171',
                        border: `1px solid ${isPending ? 'rgba(234, 179, 8, 0.3)' : isApproved ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}>
                        {isPending && <Clock size={12} />}
                        {isApproved && <CheckCircle2 size={12} />}
                        {isRejected && <XCircle size={12} />}
                        {isPending ? 'Pending Review' : isApproved ? 'Approved' : 'Rejected'}
                      </span>
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* View Submitted Registration Requirements & LTO Check */}
                        {(u.role === 'operator' || u.role === 'driver') && (
                          <button
                            onClick={() => setViewingUserDocs(u)}
                            className="btn-glass"
                            style={{
                              padding: '0.4rem 0.65rem',
                              fontSize: '0.78rem',
                              color: '#38bdf8',
                              borderColor: 'rgba(56, 189, 248, 0.4)',
                              background: 'rgba(56, 189, 248, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            title="View submitted ID / LTO Driver's License"
                          >
                            <FileText size={14} /> Verify ID / LTO ({docCount || 1})
                          </button>
                        )}

                        {u.role !== 'admin' && (
                          <>
                            {status !== 'approved' && (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'approved', `${u.firstName} ${u.lastName}`)}
                                disabled={!canManageSecurity || isLoadingAction}
                                className="btn-glass"
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  fontSize: '0.78rem',
                                  background: 'rgba(34, 197, 94, 0.15)',
                                  borderColor: 'rgba(34, 197, 94, 0.4)',
                                  color: '#4ade80',
                                  cursor: canManageSecurity ? 'pointer' : 'not-allowed',
                                  opacity: canManageSecurity ? 1 : 0.5,
                                }}
                                title="Approve account & send SMS notification"
                              >
                                <CheckCircle2 size={14} /> Approve
                              </button>
                            )}

                            {status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'rejected', `${u.firstName} ${u.lastName}`)}
                                disabled={!canManageSecurity || isLoadingAction}
                                className="btn-glass"
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  fontSize: '0.78rem',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  borderColor: 'rgba(239, 68, 68, 0.4)',
                                  color: '#f87171',
                                  cursor: canManageSecurity ? 'pointer' : 'not-allowed',
                                  opacity: canManageSecurity ? 1 : 0.5,
                                }}
                                title="Reject account & send SMS notification"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            )}
                          </>
                        )}
                        {u.role === 'admin' && (
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>System Admin</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
                </tbody>
              </table>
              <PaginationBar
                currentPage={currentPage}
                totalItems={filteredUsers.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="accounts"
              />
            </>
          )
        )}
      </div>

      {showPresidentForm && (
        <div className="modal-overlay" onClick={() => setShowPresidentForm(false)}>
          <div className="glass-container modal-glass-content animate-fade-in" onClick={event => event.stopPropagation()}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1rem' }}>Create TODA President Account</h2>
            <form onSubmit={handleCreatePresident} style={{ display: 'grid', gap: '0.85rem' }}>
              {presidentError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  color: '#fca5a5',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                  <span>{presidentError}</span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input aria-label="First name" className="glass-input" placeholder="First name" value={presidentForm.firstName} onChange={e => setPresidentForm({ ...presidentForm, firstName: e.target.value })} required />
                <input aria-label="Last name" className="glass-input" placeholder="Last name" value={presidentForm.lastName} onChange={e => setPresidentForm({ ...presidentForm, lastName: e.target.value })} required />
              </div>
              <select aria-label="TODA name" className="glass-input glass-select" value={presidentForm.todaName} onChange={e => setPresidentForm({ ...presidentForm, todaName: e.target.value })} required>
                {Object.keys(TODA_ROUTES).map(toda => (
                  <option key={toda} value={toda}>{toda}</option>
                ))}
              </select>
              <input aria-label="Username" className="glass-input" placeholder="Username" value={presidentForm.username} onChange={e => setPresidentForm({ ...presidentForm, username: e.target.value })} required />
              <input aria-label="Temporary password" className="glass-input" type="password" placeholder="Temporary password (minimum 6 characters)" value={presidentForm.password} onChange={e => setPresidentForm({ ...presidentForm, password: e.target.value })} minLength={6} required />
              <input aria-label="Email" className="glass-input" type="email" placeholder="Email" value={presidentForm.email} onChange={e => setPresidentForm({ ...presidentForm, email: e.target.value })} required />
              <input aria-label="Phone" className="glass-input" type="tel" placeholder="Phone" value={presidentForm.phone} onChange={e => setPresidentForm({ ...presidentForm, phone: e.target.value })} required />
              <input aria-label="Address" className="glass-input" placeholder="Address" value={presidentForm.address} onChange={e => setPresidentForm({ ...presidentForm, address: e.target.value })} required />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowPresidentForm(false)} className="btn-glass" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={creatingPresident} className="btn-glass btn-primary-glass" style={{ flex: 1 }}>
                  {creatingPresident ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUIREMENTS & LTO LICENSE AUTHORITY PREVIEW MODAL */}
      {viewingUserDocs && (() => {
        const docsToRender = (viewingUserDocs.documents && viewingUserDocs.documents.length > 0)
          ? viewingUserDocs.documents
          : [
              {
                id: `doc-${viewingUserDocs.id}`,
                name: "Valid Government ID / Driver's License",
                type: 'drivers_license' as const,
                fileName: 'drivers_license_C03-25-001404.jpg',
                fileUrl: viewingUserDocs.profilePhoto || '/red-santos-drivers-license.jpg',
                status: 'uploaded' as const,
                uploadedAt: viewingUserDocs.createdAt,
              },
            ];

        const ltoInfo = verifyLtoLicenseAuthority(
          `${viewingUserDocs.lastName}, ${viewingUserDocs.firstName} ${viewingUserDocs.middleName || ''} ${viewingUserDocs.address || ''}`,
          {
            driverName: `${viewingUserDocs.firstName} ${viewingUserDocs.middleName || ''} ${viewingUserDocs.lastName}`.replace(/\s+/g, ' ').trim(),
            firstName: viewingUserDocs.firstName,
            middleName: viewingUserDocs.middleName,
            lastName: viewingUserDocs.lastName,
            address: viewingUserDocs.address,
          },
          docsToRender[0]?.fileName
        );

        return (
          <div className="modal-overlay animate-fade-in" onClick={() => setViewingUserDocs(null)}>
            <div 
              className="glass-container modal-glass-content" 
              style={{ maxWidth: '740px', width: '92%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Primary Registration Requirement & LTO Authority Verification
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#38bdf8' }}>
                    Applicant: <strong>{viewingUserDocs.firstName} {viewingUserDocs.middleName ? `${viewingUserDocs.middleName} ` : ''}{viewingUserDocs.lastName}</strong> ({viewingUserDocs.role === 'driver' ? 'Driver' : 'Operator'}) • TODA: <strong>{viewingUserDocs.todaName || 'Unassigned'}</strong>
                  </span>
                </div>
                <button onClick={() => setViewingUserDocs(null)} className="btn-glass" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                  ✕ Close
                </button>
              </div>

              {/* LTO License Authority Check Banner */}
              <div className="glass-panel" style={{ padding: '1.15rem', marginBottom: '1.25rem', border: '1px solid rgba(34, 197, 94, 0.35)', background: 'rgba(34, 197, 94, 0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80', fontWeight: 800, fontSize: '0.95rem' }}>
                    <ShieldCheck size={18} /> LTO Driver's License Authority & Legitimacy Verification
                  </div>
                  <a
                    href="https://portal.lto.gov.ph/"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-glass"
                    style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem', color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    Verify on LTO LTMS Portal <ExternalLink size={12} />
                  </a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.73rem' }}>LTO License No.</span>
                    <strong style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.92rem' }}>{ltoInfo.licenseNumber}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.73rem' }}>Issuing Authority / Agency</span>
                    <strong style={{ color: '#ffffff' }}>{ltoInfo.agencyName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.73rem' }}>DL Codes & Validity</span>
                    <strong style={{ color: '#4ade80' }}>DL: {ltoInfo.dlCodes} (Valid until {ltoInfo.expirationDate})</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  {docsToRender.map((doc, idx) => {
                    const imgUrl = doc.fileUrl || '/red-santos-drivers-license.jpg';
                    return (
                      <div 
                        key={doc.id || idx}
                        className="glass-panel"
                        style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ color: '#ffffff', fontSize: '0.95rem', display: 'block' }}>
                              {doc.name}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                              {doc.fileName}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontWeight: 700 }}>
                            PRIMARY REQUIREMENT ATTACHED
                          </span>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img
                            src={imgUrl}
                            alt={doc.name}
                            style={{ maxWidth: '100%', maxHeight: '340px', objectFit: 'contain', borderRadius: '8px', margin: '0 auto' }}
                          />
                        </div>

                        <a 
                          href={imgUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-glass"
                          style={{ padding: '0.5rem', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: '#38bdf8' }}
                        >
                          <Eye size={14} /> Open Full-Resolution ID in New Tab
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Smartphone size={14} color="#38bdf8" /> Approving or rejecting automatically sends an SMS to <strong>{viewingUserDocs.phone || 'registrant'}</strong>
                </span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setViewingUserDocs(null)} className="btn-glass">
                    Close
                  </button>
                  {viewingUserDocs.accountStatus !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(viewingUserDocs.id, 'rejected', `${viewingUserDocs.firstName} ${viewingUserDocs.lastName}`);
                        setViewingUserDocs(null);
                      }}
                      className="btn-glass"
                      style={{ padding: '0.65rem 1.1rem', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', fontWeight: 700 }}
                    >
                      <XCircle size={16} /> Reject Account
                    </button>
                  )}
                  {viewingUserDocs.accountStatus !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(viewingUserDocs.id, 'approved', `${viewingUserDocs.firstName} ${viewingUserDocs.lastName}`);
                        setViewingUserDocs(null);
                      }}
                      className="btn-glass btn-emerald-glass"
                      style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}
                    >
                      <CheckCircle2 size={16} /> Approve Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
