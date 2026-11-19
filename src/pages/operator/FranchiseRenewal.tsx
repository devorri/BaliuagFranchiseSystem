import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import type { Application, Franchise } from '../../types';
import { FRANCHISE_FEES } from '../../services/fees';
import {
  feeForAddress, canRenewFranchise, franchiseExpiryDate, isActiveApplication, RENEWAL_WINDOW_DAYS,
} from '../../services/applicationRules';
import { daysUntil, CLOCK_CHANGED_EVENT } from '../../services/clock';
import { RefreshCw, ArrowRight, ShieldCheck, AlertCircle, FilePlus, Lock, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FranchiseRenewal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setClockTick] = useState(0);

  useEffect(() => {
    const onClock = () => setClockTick(tick => tick + 1);
    window.addEventListener(CLOCK_CHANGED_EVENT, onClock);
    return () => window.removeEventListener(CLOCK_CHANGED_EVENT, onClock);
  }, []);

  useEffect(() => {
    if (!user) return;
    void Promise.all([supabaseService.getFranchisesAsync(), supabaseService.getApplicationsAsync()])
      .then(([items, apps]) => {
        setFranchises(
          items
            .filter(item => item.operatorId === user.id)
            .sort((a, b) => new Date(b.issuedAt || b.startDate || 0).getTime() - new Date(a.issuedAt || a.startDate || 0).getTime())
        );
        setApplications(apps.filter(app => app.applicantId === user.id));
      })
      .finally(() => setLoading(false));
  }, [user]);

  const baseFee = feeForAddress(user?.address).amount;
  const pendingApplication = applications.find(isActiveApplication);

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
          {RENEWAL_WINDOW_DAYS > 0
            ? `Renewal opens ${RENEWAL_WINDOW_DAYS} day(s) before your franchise expires.`
            : 'Renewal opens once your franchise has expired. While your franchise is still valid, renewal is locked.'}{' '}
          You will receive SMS reminders 30, 7 and 1 day(s) before expiration.
        </p>

        <div style={{ padding: '0.9rem 1.1rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', color: '#38bdf8', fontSize: '0.88rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={20} style={{ flexShrink: 0 }} />
          <span>
            <strong>Policy:</strong> Barangay Clearance is <strong>waived</strong> for renewals. Only updated OR/CR, Driver's License and 2x2 Photo are required. An expired franchise carries a ₱{FRANCHISE_FEES.expiredFranchisePenalty} penalty.
          </span>
        </div>

        {pendingApplication && (
          <div style={{ padding: '0.9rem 1.1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: '#fbbf24', fontSize: '0.88rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={20} style={{ flexShrink: 0 }} />
            <span>
              You already have an application in process (Plate <strong>{pendingApplication.plateNumber}</strong>). Only one submission is allowed at a time.
            </span>
          </div>
        )}

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
              You do not currently have any franchise registered under your account. To obtain a franchise, please submit a new application.
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
              const expiry = franchiseExpiryDate(f);
              const daysLeft = daysUntil(expiry);
              const isExpired = daysLeft < 0;
              const renewable = canRenewFranchise(f);
              const hasPendingForUnit = applications.some(app => isActiveApplication(app) && app.plateNumber === f.plateNumber);
              const blocked = !renewable || Boolean(pendingApplication);

              return (
                <div key={f.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
                        {f.mtopNumber}
                      </h3>
                      <span className={isExpired ? 'pill-badge pill-rejected' : daysLeft <= 30 ? 'pill-badge pill-pending' : 'pill-badge pill-approved'}>
                        {isExpired ? 'EXPIRED' : daysLeft <= 30 ? `EXPIRES IN ${daysLeft} DAY(S)` : 'ACTIVE'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600 }}>
                      Driver: {f.driverName} · Plate: {f.plateNumber} · TODA: {f.todaName}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: isExpired ? '#f87171' : '#cbd5e1', marginTop: '0.35rem', margin: 0 }}>
                      Expiration Date: <strong>{new Date(expiry).toLocaleDateString()}</strong>
                      {isExpired && ` (Subject to ₱${FRANCHISE_FEES.expiredFranchisePenalty} expired penalty fee)`}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {hasPendingForUnit ? (
                      <span className="pill-badge pill-pending">Renewal in process</span>
                    ) : blocked ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                        <button
                          type="button"
                          disabled
                          className="btn-glass"
                          style={{ padding: '0.7rem 1.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', opacity: 0.55, cursor: 'not-allowed' }}
                        >
                          <Lock size={16} /> Renewal Locked
                        </button>
                        {!renewable && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Still valid — renewal opens after {new Date(expiry).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/dashboard/requirements?type=renewal&franchise=${f.id}`)}
                        className="btn-glass btn-orange-glass"
                        style={{ padding: '0.7rem 1.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <RefreshCw size={18} />
                        <span>Renew (₱{baseFee}{isExpired ? ` + ₱${FRANCHISE_FEES.expiredFranchisePenalty} penalty` : ''})</span>
                        <ArrowRight size={15} />
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
