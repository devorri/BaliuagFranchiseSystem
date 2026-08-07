import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import type { Application } from '../../types';
import { CheckCircle2, Clock, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DriverTodaStatus() {
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

  const hasTodaApproval = application?.todaApproval?.routeFeePaid;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-purple">Step 4 of Workflow</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>TODA Line Approval & Route Fee</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          TODA President Line Approval
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Ipapasa ang aplikasyon sa **TODA President** para sa approval ng linya at pagtanggap ng bayad sa membership/route fee.
        </p>

        {application ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Toda Status Panel */}
            <div className="glass-panel" style={{ padding: '1.75rem', border: hasTodaApproval ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Award size={26} color="#c084fc" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{application.todaName}</h3>
                </div>
                {hasTodaApproval ? (
                  <span className="pill-badge pill-purple"><CheckCircle2 size={16} /> LINE APPROVED</span>
                ) : (
                  <span className="pill-badge pill-orange"><Clock size={16} /> PENDING TODA PRES APPROVAL</span>
                )}
              </div>

              {hasTodaApproval ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(139, 92, 246, 0.12)', padding: '1.25rem', borderRadius: '14px' }}>
                  <p style={{ color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={18} color="#4ade80" /> Naaprubahan na ni <strong>{application.todaApproval?.approvedByName}</strong> (TODA President).
                  </p>
                  <div style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
                    • TODA Membership Fee: <strong>₱300.00 (PAID)</strong><br />
                    • TODA Route Fee: <strong>₱500.00 (PAID)</strong><br />
                    • Receipt / Ref OR: <strong>{application.todaApproval?.orNumber || 'TODA-OR-9001'}</strong>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#34d399', marginTop: '0.5rem', fontWeight: 700 }}>
                    Automatic na ipinasa sa Municipal Admin para sa final MTOP review & release!
                  </p>
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '14px' }}>
                  <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
                    Naka-queue ang inyong aplikasyon para sa pagsusuri ng inyong **TODA President**. Siguraduhing nabayaran ang TODA Membership & Route fee.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      onClick={() => navigate('/driver')}
                      className="btn-glass btn-primary-glass"
                      style={{ padding: '0.75rem 1.25rem' }}
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>Wala pang aktibong aplikasyon.</p>
        )}
      </div>
    </div>
  );
}
