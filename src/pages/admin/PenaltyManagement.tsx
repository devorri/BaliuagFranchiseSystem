import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import type { Franchise, Penalty, User } from '../../types';
import { PlusCircle } from 'lucide-react';

export function PenaltyManagement() {
  const { user } = useAuth();
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    violationType: 'Out of Route Operation' as Penalty['violationType'],
    amount: 500,
    remarks: '',
  });
  const isExpiredFranchisePenalty = formData.violationType === 'Expired MTOP';

  useEffect(() => {
    void supabaseService.getPenaltiesAsync().then(setPenalties);
    Promise.all([supabaseService.getUsersAsync(), supabaseService.getFranchisesAsync()]).then(([accounts, units]) => {
      setDrivers(accounts.filter(account => account.role === 'driver' && account.accountStatus === 'approved'));
      setFranchises(units);
    });
  }, []);

  const loadPenalties = async () => {
    setPenalties(await supabaseService.getPenaltiesAsync());
  };

  const handleCreatePenalty = (e: React.FormEvent) => {
    e.preventDefault();
    const driver = drivers.find(account => account.id === selectedDriverId);
    const franchise = franchises.find(unit => unit.id === selectedFranchiseId && unit.driverId === selectedDriverId);
    if (!user || !driver || !franchise) return;

    const newPenalty: Penalty = {
      id: crypto.randomUUID(),
      driverId: driver.id,
      driverName: `${driver.firstName} ${driver.lastName}`,
      plateNumber: franchise.plateNumber,
      todaName: franchise.todaName,
      violationType: formData.violationType,
      amount: Number(formData.amount),
      status: 'unpaid',
      issuedDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      remarks: formData.remarks,
      issuedBy: `${user.firstName} ${user.lastName} (Municipal Admin)`,
    };

    setSaving(true);
    setError('');
    void supabaseService.savePenaltyAsync(newPenalty, true).then(() => {
      setShowModal(false);
      setFormData({ ...formData, remarks: '' });
      return loadPenalties();
    }).catch(saveError => {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the penalty.');
    }).finally(() => setSaving(false));
  };

  const handleMarkAsPaid = async (penaltyId: string) => {
    try {
      await supabaseService.updatePenaltyStatusAsync(penaltyId, 'paid');
      await loadPenalties();
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Could not update the penalty payment.');
    }
  };

  const eligibleFranchises = franchises.filter(franchise => franchise.driverId === selectedDriverId && franchise.status === 'active');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-container" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="pill-badge pill-rose">Penalty Management</span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Traffic & Route Compliance</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Penalty Records & Management
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Record penalties for violations such as **Expired MTOP**, **Out of Route Operation**, **Overcharging**, and **No License**.
            </p>
          </div>

          <button onClick={() => setShowModal(true)} className="btn-glass btn-orange-glass">
            <PlusCircle size={20} /> Record New Penalty Violation
          </button>
        </div>
      </div>

      {error && <p role="alert" style={{ color: '#f87171' }}>{error}</p>}

      {/* Penalties List Table */}
      <div className="glass-container" style={{ padding: '1.75rem' }}>
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Penalty ID</th>
                <th>Driver / Plate</th>
                <th>Violation Type</th>
                <th>Fine Amount</th>
                <th>Date Issued</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {penalties.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                    No recorded violations found.
                  </td>
                </tr>
              ) : (
                penalties.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 800, color: '#38bdf8' }}>{p.id}</td>
                    <td>
                      <strong style={{ color: '#ffffff', display: 'block' }}>{p.driverName}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Plate: {p.plateNumber}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.violationType}</td>
                    <td style={{ color: '#fb7185', fontWeight: 800 }}>₱{p.amount.toFixed(2)}</td>
                    <td style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{new Date(p.issuedDate).toLocaleDateString()}</td>
                    <td>
                      {p.status === 'paid' ? (
                        <span className="pill-badge pill-emerald">PAID</span>
                      ) : (
                        <span className="pill-badge pill-rose">UNPAID</span>
                      )}
                    </td>
                    <td>
                      {p.status === 'unpaid' && (
                        <button
                          onClick={() => handleMarkAsPaid(p.id)}
                          className="btn-glass btn-emerald-glass"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Penalty Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass-container modal-glass-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Record New Violation Penalty
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Fill out the information below to issue an official penalty citation.
            </p>

            <form onSubmit={handleCreatePenalty} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Driver</label>
                <select className="glass-input glass-select" value={selectedDriverId} onChange={e => { setSelectedDriverId(e.target.value); setSelectedFranchiseId(''); }} required>
                  <option value="">Select an approved driver</option>
                  {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.firstName} {driver.lastName}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Assigned Tricycle</label>
                <select className="glass-input glass-select" value={selectedFranchiseId} onChange={e => setSelectedFranchiseId(e.target.value)} required disabled={!selectedDriverId}>
                  <option value="">Select the registered plate</option>
                  {eligibleFranchises.map(franchise => <option key={franchise.id} value={franchise.id}>{franchise.plateNumber} · {franchise.todaName}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Violation Type
                </label>
                <select
                  className="glass-input glass-select"
                  value={formData.violationType}
                  onChange={e => {
                    const violationType = e.target.value as Penalty['violationType'];
                    setFormData({ ...formData, violationType, amount: violationType === 'Expired MTOP' ? 125 : formData.amount });
                  }}
                >
                  <option value="Expired MTOP">Expired MTOP Permit</option>
                  <option value="Out of Route Operation">Out of Route Operation</option>
                  <option value="Overcharging">Overcharging Fare Rate</option>
                  <option value="Illegal Parking">Illegal Parking / Obstruction</option>
                  <option value="No License">No Driver License</option>
                  <option value="No TODA Cert">No TODA Certificate</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Fine Amount (PHP)
                </label>
                <input
                  type="number"
                  className="glass-input"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                  readOnly={isExpiredFranchisePenalty}
                />
                {isExpiredFranchisePenalty && <span style={{ color: '#facc15', fontSize: '0.78rem' }}>Expired franchise penalty is fixed at ₱125.00.</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Remarks / Violation Details
                </label>
                <textarea
                  className="glass-input"
                  rows={3}
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-glass" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || !selectedFranchiseId} className="btn-glass btn-orange-glass" style={{ flex: 2 }}>
                  {saving ? 'Saving...' : 'Issue Penalty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
