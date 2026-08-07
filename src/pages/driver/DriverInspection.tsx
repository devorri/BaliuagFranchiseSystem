import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import type { Application } from '../../types';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DriverInspection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);

  useEffect(() => {
    if (user) {
      const apps = storage.getApplications();
      const userApp = apps.find(a => a.applicantId === user.id || a.driverName?.toLowerCase() === `${user.firstName} ${user.lastName}`.toLowerCase());
      if (userApp) setApplication(userApp);
    }
  }, [user]);

  const handleSimulatePassInspection = () => {
    if (!application) return;
    const updated = storage.recordInspection(
      application.id,
      true,
      true,
      'Insp. Rodolfo Gonzales (City Stenciling Office)',
      'Engine and chassis stenciling verified. All numbers verified against registered OR/CR.'
    );
    if (updated) {
      setApplication(updated);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-cyan">Step 2 of Workflow</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Stenciling & Inspection</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Inspection & Stenciling
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Sinusuri ng City Stenciling Officer ang iyong **Engine Number** at **Chassis Number** upang matiyak na tumutugma sa opisyal na papeles.
        </p>

        {application ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Inspection Status Card */}
            <div className="glass-panel" style={{ padding: '1.75rem', border: application.inspection?.status === 'passed' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(6, 182, 212, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Stenciling Verification Status</h3>
                {application.inspection?.status === 'passed' ? (
                  <span className="pill-badge pill-emerald"><CheckCircle2 size={16} /> INSPECTION PASSED</span>
                ) : (
                  <span className="pill-badge pill-cyan"><Clock size={16} /> FOR INSPECTION</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Engine / Motor Number</span>
                  <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>{application.motorNumber}</strong>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: application.inspection?.engineVerified ? '#34d399' : '#f59e0b' }}>
                    {application.inspection?.engineVerified ? '✓ Verified Stenciled' : '⏳ Pending Officer Check'}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Chassis Number</span>
                  <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>{application.chassisNumber}</strong>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: application.inspection?.chassisVerified ? '#34d399' : '#f59e0b' }}>
                    {application.inspection?.chassisVerified ? '✓ Verified Stenciled' : '⏳ Pending Officer Check'}
                  </div>
                </div>
              </div>

              {application.inspection?.inspectorName && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.88rem', color: '#cbd5e1' }}>
                  <strong>Assigned Officer:</strong> {application.inspection.inspectorName}
                  <br />
                  <strong>Remarks:</strong> {application.inspection.notes}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {application.inspection?.status !== 'passed' ? (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSimulatePassInspection}
                  className="btn-glass btn-emerald-glass"
                  style={{ flex: 1, padding: '1rem' }}
                >
                  <ShieldCheck size={20} /> Simulate Officer Stenciling Verification (Pass)
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/driver/payment')}
                className="btn-glass btn-primary-glass"
                style={{ padding: '1rem', fontSize: '1.05rem' }}
              >
                Proceed to Treasurer Fee Payment →
              </button>
            )}

          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>Kailangan munang magsumite ng **Driver Requirements** bago ang stenciling.</p>
        )}
      </div>
    </div>
  );
}
