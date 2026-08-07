import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import type { Penalty } from '../../types';
import { PlusCircle } from 'lucide-react';

export function PenaltyManagement() {
  const { user } = useAuth();
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    driverName: 'Juan Manaloto',
    plateNumber: '123-XYZ',
    todaName: 'BASTODA (Baliuag Poblacion TODA)',
    violationType: 'Out of Route Operation' as Penalty['violationType'],
    amount: 500,
    remarks: 'Operated outside designated TODA route without valid special municipal permit.',
  });

  useEffect(() => {
    loadPenalties();
  }, []);

  const loadPenalties = () => {
    setPenalties(storage.getPenalties());
  };

  const handleCreatePenalty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newPen: Penalty = {
      id: `PEN-2026-${Math.floor(100 + Math.random() * 900)}`,
      driverId: 'user-driver-01',
      driverName: formData.driverName,
      plateNumber: formData.plateNumber,
      todaName: formData.todaName,
      violationType: formData.violationType,
      amount: Number(formData.amount),
      status: 'unpaid',
      issuedDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      remarks: formData.remarks,
      issuedBy: `${user.firstName} ${user.lastName} (Municipal Admin)`,
    };

    storage.addPenalty(newPen);
    setShowModal(false);
    loadPenalties();
  };

  const handleMarkAsPaid = (penaltyId: string) => {
    storage.payPenalty(penaltyId);
    loadPenalties();
  };

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
              Record at Pamamahala ng Penalties
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Nagrerecord ng penalties kapag may paglabag (hal. **Expired MTOP**, **Out of Route Operation**, **Overcharging**, **No License**).
            </p>
          </div>

          <button onClick={() => setShowModal(true)} className="btn-glass btn-orange-glass">
            <PlusCircle size={20} /> Record New Penalty Violation
          </button>
        </div>
      </div>

      {/* Penalties List Table */}
      <div className="glass-container" style={{ padding: '1.75rem' }}>
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Penalty ID</th>
                <th>Driver / Plate</th>
                <th>Uri ng Paglabag (Violation)</th>
                <th>Multa (Amount)</th>
                <th>Petsa ng Huli</th>
                <th>Status</th>
                <th>Aksyon</th>
              </tr>
            </thead>
            <tbody>
              {penalties.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                    Walang recorded violations.
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
              Mag-record ng Bagong Violation Penalty
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              I-fill up ang impormasyon sa ibaba para mag-issue ng opisyal na penalty citation.
            </p>

            <form onSubmit={handleCreatePenalty} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Pangalan ng Driver
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.driverName}
                  onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Plate / Body Number
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.plateNumber}
                  onChange={e => setFormData({ ...formData, plateNumber: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Uri ng Paglabag (Violation Type)
                </label>
                <select
                  className="glass-input glass-select"
                  value={formData.violationType}
                  onChange={e => setFormData({ ...formData, violationType: e.target.value as any })}
                >
                  <option value="Expired MTOP">Expired MTOP Permit</option>
                  <option value="Out of Route Operation">Out of Route Operation</option>
                  <option value="Overcharging">Overcharging Fare Rate</option>
                  <option value="Illegal Parking">Illegal Parking / Obstruction</option>
                  <option value="No License">No Driver License</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Halaga ng Multa (Amount in PHP)
                </label>
                <input
                  type="number"
                  className="glass-input"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Remarks / Details ng Huli
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
                <button type="submit" className="btn-glass btn-orange-glass" style={{ flex: 2 }}>
                  Issue Citation & Send SMS Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
