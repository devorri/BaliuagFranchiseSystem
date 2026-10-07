import { useState, useEffect } from 'react';
import * as supabaseService from '../../services/supabaseService';
import type { Franchise, FranchiseStatus, User } from '../../types';
import { Search, UserCheck } from 'lucide-react';

export function FranchiseRegistry() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | FranchiseStatus>('all');
  const [selectedOperators, setSelectedOperators] = useState<Record<string, string>>({});
  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({});
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([supabaseService.getFranchisesAsync(), supabaseService.getUsersAsync()]).then(([units, accounts]) => {
      setFranchises(units);
      setUsers(accounts.filter(account => account.accountStatus === 'approved'));
    });
  }, []);

  const handleAssignSlot = async (franchise: Franchise) => {
    const operator = users.find(user => user.id === selectedOperators[franchise.id] && user.role === 'operator');
    const driver = users.find(user => user.id === selectedDrivers[franchise.id] && user.role === 'driver');
    if (franchise.status !== 'available' || !operator || !driver) return;
    setSavingSlotId(franchise.id);
    setError('');
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    try {
      const reassigned = await supabaseService.saveFranchiseAsync({
        ...franchise,
        operatorId: operator.id,
        operatorName: `${operator.firstName} ${operator.lastName}`,
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
        status: 'active',
        startDate: now.toISOString().slice(0, 10),
        endDate: expiresAt.toISOString().slice(0, 10),
        issuedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        renewalDate: new Date(expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        slotReleasedAt: undefined,
      }, true);
      setFranchises(current => current.map(item => item.id === reassigned.id ? reassigned : item));
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : 'Could not reassign the slot.');
    } finally {
      setSavingSlotId(null);
    }
  };

  const filteredFranchises = franchises.filter(f => {
    const matchesSearch = 
      f.mtopNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.todaName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-container" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-cyan">Franchise Registry</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>City of Baliwag</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Franchise Monitoring & Registry
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Monitor and track all **Active** and **Expired** tricycle franchises registered in the City of Baliwag.
        </p>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="glass-input"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="Search by MTOP #, Driver Name, Plate #, or TODA..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="glass-input glass-select"
            style={{ width: '200px' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'all' | FranchiseStatus)}
          >
            <option value="all">All Franchise Statuses</option>
            <option value="active">Active Franchises Only</option>
            <option value="expired">Expired Franchises Only</option>
            <option value="available">Available Slots</option>
          </select>
        </div>
      </div>

      {error && <p role="alert" style={{ color: '#f87171' }}>{error}</p>}

      {/* Registry Table Card */}
      <div className="glass-container" style={{ padding: '1.75rem' }}>
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>MTOP Number</th>
                <th>Driver / Operator</th>
                <th>Plate Number</th>
                <th>TODA Route</th>
                <th>Issued Date</th>
                <th>Expiration Date</th>
                <th>Status</th>
                <th>Slot Assignment</th>
              </tr>
            </thead>
            <tbody>
              {filteredFranchises.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                    No records found in the franchise registry.
                  </td>
                </tr>
              ) : (
                filteredFranchises.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 800, color: '#38bdf8' }}>{f.mtopNumber}</td>
                    <td>
                      <strong style={{ color: '#ffffff', display: 'block' }}>{f.driverName}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Op: {f.operatorName}</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{f.plateNumber}</td>
                    <td style={{ fontSize: '0.85rem' }}>{f.todaName}</td>
                    <td style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{new Date(f.issuedAt).toLocaleDateString()}</td>
                    <td style={{ fontSize: '0.82rem', color: f.status === 'expired' ? '#fb7185' : '#cbd5e1', fontWeight: f.status === 'expired' ? 700 : 400 }}>
                      {new Date(f.expiresAt).toLocaleDateString()}
                    </td>
                    <td><span className={`pill-badge ${f.status === 'active' ? 'pill-emerald' : f.status === 'available' ? 'pill-cyan' : 'pill-rose'}`}>{f.status.toUpperCase()}</span></td>
                    <td>
                      {f.status === 'available' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(130px, 1fr) minmax(130px, 1fr) auto', gap: '0.4rem', minWidth: '410px' }}>
                          <select className="glass-input glass-select" aria-label="Assign operator" value={selectedOperators[f.id] || ''} onChange={e => setSelectedOperators(current => ({ ...current, [f.id]: e.target.value }))}>
                            <option value="">Select operator</option>
                            {users.filter(account => account.role === 'operator').map(operator => <option key={operator.id} value={operator.id}>{operator.firstName} {operator.lastName}</option>)}
                          </select>
                          <select className="glass-input glass-select" aria-label="Assign driver" value={selectedDrivers[f.id] || ''} onChange={e => setSelectedDrivers(current => ({ ...current, [f.id]: e.target.value }))}>
                            <option value="">Select driver</option>
                            {users.filter(account => account.role === 'driver').map(driver => <option key={driver.id} value={driver.id}>{driver.firstName} {driver.lastName}</option>)}
                          </select>
                          <button type="button" className="btn-glass btn-primary-glass" title="Assign available slot" disabled={!selectedOperators[f.id] || !selectedDrivers[f.id] || savingSlotId === f.id} onClick={() => void handleAssignSlot(f)}>
                            <UserCheck size={16} />
                          </button>
                        </div>
                      )}
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
