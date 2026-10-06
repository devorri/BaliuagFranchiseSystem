import { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Search, Filter, 
  ShieldCheck, Clock, UserCheck, ShieldAlert 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import * as supabaseService from '../../services/supabaseService';
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

  const canManageSecurity = hasPermission('security');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getUsersAsync();
      setUsers(data);
    } catch {
      showToast('Failed to load accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: 'approved' | 'rejected', userName: string) => {
    if (!canManageSecurity) {
      showToast('You do not have Security Admin permissions to approve or reject accounts.', 'error');
      return;
    }

    setActionLoadingId(userId);
    try {
      const updated = await supabaseService.updateAccountStatusAsync(userId, newStatus);
      if (updated) {
        showToast(`Account for ${userName} has been ${newStatus === 'approved' ? 'APPROVED' : 'REJECTED'}.`, 'success');
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.todaName && u.todaName.toLowerCase().includes(search.toLowerCase()));

    const status = u.accountStatus || 'approved'; // default legacy to approved
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const pendingCount = users.filter(u => u.accountStatus === 'pending').length;
  const approvedCount = users.filter(u => !u.accountStatus || u.accountStatus === 'approved').length;
  const rejectedCount = users.filter(u => u.accountStatus === 'rejected').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Title & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
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
              <ShieldCheck size={14} /> Security Admin Control
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Manage approval and access status of registered Driver and Operator accounts before login access.
          </p>
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
            <option value="driver">Driver</option>
            <option value="operator">Operator</option>
            <option value="president">TODA President</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="glass-container" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Fetching registered accounts...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <Users size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            No accounts match your current filter.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Name / Username</th>
                <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                <th style={{ padding: '0.75rem 1rem' }}>TODA / Contact</th>
                <th style={{ padding: '0.75rem 1rem' }}>Registration Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action (Security)</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const status = u.accountStatus || 'approved';
                const isPending = status === 'pending';
                const isApproved = status === 'approved';
                const isRejected = status === 'rejected';
                const isLoadingAction = actionLoadingId === u.id;

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>
                        {u.firstName} {u.lastName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                        @{u.username}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: u.role === 'admin' ? 'rgba(249, 115, 22, 0.2)' :
                                   u.role === 'president' || u.role === 'toda_president' ? 'rgba(168, 85, 247, 0.2)' :
                                   u.role === 'operator' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                        color: u.role === 'admin' ? '#fb923c' :
                               u.role === 'president' || u.role === 'toda_president' ? '#c084fc' :
                               u.role === 'operator' ? '#34d399' : '#38bdf8',
                      }}>
                        {u.role === 'toda_president' ? 'President' : u.role}
                      </span>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ color: '#e2e8f0' }}>{u.todaName || '—'}</div>
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
                      <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
                                title="Approve account"
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
                                title="Reject account"
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
        )}
      </div>

    </div>
  );
}
