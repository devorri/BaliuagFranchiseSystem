import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import type { Application, Franchise } from '../../types';
import { FRANCHISE_FEES, franchiseFeeFor } from '../../services/fees';
import { feeForAddress } from '../../services/applicationRules';
import { RefreshCw, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle, FilePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FranchiseRenewal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [renewedId, setRenewedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void supabaseService.getFranchisesAsync()
      .then(items => setFranchises(items.filter(item => item.operatorId === user.id)))
      .finally(() => setLoading(false));
  }, [user]);

  const handleInitiateRenewal = async (franchise: Franchise) => {
    if (!user || renewedId) return;
    const now = new Date().toISOString();
    const isExpired = franchise.status === 'expired' || new Date(franchise.expiresAt).getTime() < new Date(now).getTime();
    const latePenalty = isExpired ? FRANCHISE_FEES.expiredFranchisePenalty : 0;
    const addressFee = feeForAddress(user.address);
    const renewal: Application = {
      id: crypto.randomUUID(),
      applicantId: user.id,
      applicantName: `${user.firstName} ${user.lastName}`,
      applicantRole: 'operator',
      driverId: franchise.driverId,
      driverName: franchise.driverName,
      type: 'renewal',
      residency: addressFee.residency,
      status: 'pending_toda_approval',
      vehicleMake: franchise.vehicleMake,
      vehicleModel: franchise.vehicleModel,
      plateNumber: franchise.plateNumber,
      motorNumber: franchise.motorNumber,
      chassisNumber: franchise.chassisNumber,
      vehicleColor: franchise.vehicleColor,
      todaName: franchise.todaName,
      routeArea: franchise.routeArea,
      documents: [],
      baseFee: franchiseFeeFor(addressFee.residency),
      todaFee: 0,
      latePenalty,
      totalFee: franchiseFeeFor(addressFee.residency) + latePenalty,
      submittedAt: now,
      updatedAt: now,
    };
    await supabaseService.saveApplicationAsync(renewal, true);
    setRenewedId(franchise.id);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-orange">Franchise Renewal</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>City of Baliwag MTOP Office</span>
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f8fafc' }}>
          Franchise Renewal Application
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Renew your motorized tricycle franchise permit before expiration to avoid late penalties and revocation of MTOP privileges.
        </p>

        {/* Policy Notice: Barangay Clearance waived */}
        <div style={{ padding: '0.9rem 1.1rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', color: '#38bdf8', fontSize: '0.88rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={20} style={{ flexShrink: 0 }} />
          <span>
            <strong>Policy Update:</strong> Barangay Clearance is <strong>waived</strong> for franchise renewals. Only updated OR/CR, Driver's License, TODA Endorsement, and 2x2 Photo are required.
          </span>
        </div>

        {loading ? (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
            Loading your registered franchises...
          </div>
        ) : franchises.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <AlertCircle size={40} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              No Existing Franchises Found
            </h3>
            <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              You do not currently have any active or expired franchises registered under your account. To obtain a franchise, please submit a new application.
            </p>
            <button
              onClick={() => navigate('/dashboard/requirements')}
              className="btn-glass btn-emerald-glass"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
            >
              <FilePlus size={18} /> Apply for New Franchise
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {franchises.map(f => {
              const isExpired = f.status === 'expired' || new Date(f.expiresAt).getTime() < Date.now();
              return (
                <div key={f.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
                        {f.mtopNumber}
                      </h3>
                      <span className={isExpired ? 'pill-badge pill-rejected' : 'pill-badge pill-approved'}>
                        {isExpired ? 'EXPIRED' : 'ACTIVE'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600 }}>
                      Driver: {f.driverName} · Plate: {f.plateNumber} · TODA: {f.todaName}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: isExpired ? '#f87171' : '#cbd5e1', marginTop: '0.35rem', margin: 0 }}>
                      Expiration Date: <strong>{new Date(f.expiresAt).toLocaleDateString()}</strong>
                      {isExpired && ' (Subject to ₱125 expired penalty fee)'}
                    </p>
                  </div>

                  <div>
                    {renewedId === f.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <span className="pill-badge pill-approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle2 size={16} /> Renewal Initiated
                        </span>
                        <button
                          onClick={() => navigate('/dashboard/requirements?type=renewal')}
                          className="btn-glass btn-emerald-glass"
                          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          Submit Renewal Documents <ArrowRight size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => void handleInitiateRenewal(f)}
                        className="btn-glass btn-orange-glass"
                        style={{ padding: '0.7rem 1.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <RefreshCw size={18} />
                        <span>Start Renewal (₱450{isExpired ? ' + ₱125 penalty' : ''})</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
