import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import type { Application, Franchise } from '../../types';
import { FRANCHISE_FEES } from '../../services/fees';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

export function FranchiseRenewal() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [renewedId, setRenewedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void supabaseService.getFranchisesAsync().then(items => setFranchises(items.filter(item => item.operatorId === user.id)));
  }, [user]);

  const handleInitiateRenewal = async (franchise: Franchise) => {
    if (!user || renewedId) return;
    const isExpired = franchise.status === 'expired' || new Date(franchise.expiresAt).getTime() < Date.now();
    const latePenalty = isExpired ? FRANCHISE_FEES.expiredFranchisePenalty : 0;
    const now = new Date().toISOString();
    const renewal: Application = {
      id: crypto.randomUUID(), applicantId: user.id, applicantName: `${user.firstName} ${user.lastName}`,
      applicantRole: 'operator', driverId: franchise.driverId, driverName: franchise.driverName,
      type: 'renewal', residency: 'baliwag_resident', status: 'pending_driver_requirements',
      vehicleMake: franchise.vehicleMake, vehicleModel: franchise.vehicleModel, plateNumber: franchise.plateNumber,
      motorNumber: franchise.motorNumber, chassisNumber: franchise.chassisNumber, vehicleColor: franchise.vehicleColor,
      todaName: franchise.todaName, routeArea: franchise.routeArea, documents: [],
      baseFee: FRANCHISE_FEES.baliwagResident, todaFee: 0, latePenalty,
      totalFee: FRANCHISE_FEES.baliwagResident + latePenalty, submittedAt: now, updatedAt: now,
    };
    await supabaseService.saveApplicationAsync(renewal, true);
    setRenewedId(franchise.id);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-orange">Franchise Renewal</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Lungsod ng Baliwag</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Paghiling ng Franchise Renewal
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Ina-update at pinarere-renew ang franchise permit bago mag-expire upang maiwasan ang penalties at pagka-expire ng MTOP.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {franchises.map(f => (
            <div key={f.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{f.mtopNumber}</h3>
                <span style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600 }}>Driver: {f.driverName} | Plate: {f.plateNumber}</span>
                <p style={{ fontSize: '0.8rem', color: f.status === 'expired' ? '#fb7185' : '#cbd5e1', marginTop: '0.25rem' }}>
                  Expiration Date: <strong>{new Date(f.expiresAt).toLocaleDateString()}</strong> ({f.status.toUpperCase()})
                </p>
              </div>

              <div>
                {renewedId === f.id ? (
                  <span className="pill-badge pill-emerald"><CheckCircle2 size={16} /> Renewal sent to assigned driver</span>
                ) : (
                  <button
                    onClick={() => void handleInitiateRenewal(f)}
                    className="btn-glass btn-orange-glass"
                    style={{ padding: '0.65rem 1.25rem' }}
                  >
                    <RefreshCw size={18} /> Start renewal (₱450{f.status === 'expired' ? ' + ₱125 expired fee' : ''})
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
