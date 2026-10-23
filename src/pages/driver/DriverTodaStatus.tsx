import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApplicationsAsync, getPaymentsAsync, getUsersAsync, savePaymentAsync } from '../../services/supabaseService';
import { belongsToToda } from '../../services/todaService';
import { isValidGcashReference, sanitizeGcashReference, generateStandardGcashReference } from '../../services/applicationRules';
import type { Application, Payment, User } from '../../types';
import { CheckCircle2, Clock, Award, Wallet, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DriverTodaStatus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [president, setPresident] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentReference, setPaymentReference] = useState('');
  const [refTouched, setRefTouched] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      Promise.all([getApplicationsAsync(), getUsersAsync(), getPaymentsAsync()]).then(([apps, users, allPayments]) => {
        const userApp = apps
          .filter(app => app.driverId === user.id || app.applicantId === user.id)
          .sort((a, b) => new Date(b.updatedAt || b.submittedAt || 0).getTime() - new Date(a.updatedAt || a.submittedAt || 0).getTime())[0];
        if (!userApp) return;
        setApplication(userApp);
        setPresident(users.find(account =>
          (account.role === 'president' || account.role === 'toda_president')
          && belongsToToda(userApp.todaName, account.todaName)
        ) || null);
        setPayments(
          allPayments
            .filter(payment => payment.applicationId === userApp.id)
            .sort((a, b) => new Date(b.paidAt || b.createdAt || 0).getTime() - new Date(a.paidAt || a.createdAt || 0).getTime())
        );
      });
    }
  }, [user]);

  const hasTodaApproval = application?.presidentEndorsed || application?.todaApproval?.routeFeePaid;
  const currentPayment = payments.find(payment => payment.status === 'pending')
    || payments.find(payment => payment.status === 'completed');
  const isRefValid = isValidGcashReference(paymentReference);

  const handleSubmitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    setRefTouched(true);
    if (!user || !application || currentPayment) return;

    if (!isValidGcashReference(paymentReference)) {
      setPaymentError('GCash reference number must be a 10- to 13-digit alphanumeric code (e.g. 902184918204).');
      return;
    }

    setSubmittingPayment(true);
    setPaymentError('');
    const payment: Payment = {
      id: crypto.randomUUID(),
      applicationId: application.id,
      payerId: user.id,
      payerName: `${user.firstName} ${user.lastName}`,
      amount: application.todaFee || 800,
      description: `${application.todaName} route and membership fees`,
      status: 'pending',
      paymentMethod: 'gcash',
      referenceNumber: paymentReference.trim(),
      createdAt: new Date().toISOString(),
    };
    try {
      await savePaymentAsync(payment, true);
      setPayments(previous => [payment, ...previous]);
      setPaymentReference('');
      setRefTouched(false);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Could not submit payment reference.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-purple">Step 2 of Workflow</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>TODA Line Eligibility Review</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          TODA President Line Approval
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Your application is reviewed by your TODA President to verify line eligibility. Once endorsed, Municipal Admin will inspect all official requirements.
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
                    <CheckCircle2 size={18} color="#4ade80" /> Endorsed by <strong>{application.presidentEndorsedBy || application.todaApproval?.approvedByName || 'TODA President'}</strong>.
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#34d399', marginTop: '0.5rem', fontWeight: 700 }}>
                    Automatically routed to Municipal Admin for final MTOP review & release!
                  </p>
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '14px' }}>
                  <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
                    Your application is currently queued for evaluation by your **TODA President**. Please ensure TODA Membership & Route fees are settled.
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

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wallet size={18} /> TODA Line Payment
                </h3>
                {!currentPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentReference(generateStandardGcashReference());
                      setRefTouched(true);
                      setPaymentError('');
                    }}
                    className="btn-glass"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                  >
                    <Sparkles size={13} style={{ marginRight: '0.35rem' }} /> Auto-Generate Demo Reference
                  </button>
                )}
              </div>

              {president?.todaPaymentQrUrl ? (
                <img src={president.todaPaymentQrUrl} alt={`${application.todaName} payment QR`} style={{ width: 180, aspectRatio: '1', objectFit: 'contain', background: '#fff', padding: '0.5rem', borderRadius: '6px' }} />
              ) : <p style={{ color: '#facc15', fontSize: '0.88rem' }}>No official payment QR has been uploaded yet by your TODA President.</p>}

              <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '0.75rem 0' }}>
                Route and membership fees: <strong>₱{(application.todaFee || 800).toFixed(2)}</strong>. After settling via GCash, enter the <strong>10- to 13-digit alphanumeric reference code</strong> automatically generated by GCash to verify payment.
              </p>

              {currentPayment ? (
                <p className={`pill-badge ${currentPayment.status === 'completed' ? 'pill-emerald' : 'pill-orange'}`}>
                  Payment {currentPayment.status}: {currentPayment.referenceNumber}
                </p>
              ) : (
                <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '520px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      GCash Transaction Reference Number <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: isRefValid ? '#4ade80' : paymentReference.length > 0 ? '#facc15' : '#64748b'
                    }}>
                      {paymentReference.length} / 10–13 digits {isRefValid ? '✓ Valid' : paymentReference.length > 0 ? `(Requires ${10 - paymentReference.length > 0 ? (10 - paymentReference.length) + ' more' : 'max 13'})` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <input
                      aria-label="GCash payment reference"
                      className="glass-input"
                      placeholder="e.g. 902184918204"
                      value={paymentReference}
                      maxLength={13}
                      onChange={e => {
                        setPaymentReference(sanitizeGcashReference(e.target.value));
                        setRefTouched(true);
                        if (paymentError) setPaymentError('');
                      }}
                      style={{
                        flex: '1 1 200px',
                        letterSpacing: '0.08em',
                        fontFamily: 'monospace',
                        fontSize: '1rem',
                        borderColor: (refTouched && paymentReference.length > 0 && !isRefValid) ? '#ef4444' : isRefValid ? '#22c55e' : undefined
                      }}
                      required
                    />
                    <button
                      type="submit"
                      className="btn-glass btn-primary-glass"
                      disabled={submittingPayment || !president?.todaPaymentQrUrl || !isRefValid}
                      style={{
                        opacity: (!isRefValid || submittingPayment || !president?.todaPaymentQrUrl) ? 0.5 : 1,
                        cursor: (!isRefValid || submittingPayment || !president?.todaPaymentQrUrl) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {submittingPayment ? 'Sending...' : 'Submit Payment Reference'}
                    </button>
                  </div>

                  {refTouched && paymentReference.length > 0 && !isRefValid && (
                    <p style={{ color: '#f87171', fontSize: '0.78rem', margin: 0 }}>
                      GCash reference must be 10 to 13 alphanumeric characters (currently {paymentReference.length}).
                    </p>
                  )}
                  {isRefValid && (
                    <p style={{ color: '#4ade80', fontSize: '0.78rem', margin: 0 }}>
                      ✓ Valid 10- to 13-digit tracking reference format.
                    </p>
                  )}
                </form>
              )}

              {paymentError && <p role="alert" style={{ color: '#f87171', marginTop: '0.5rem' }}>{paymentError}</p>}
            </div>

          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>No active application found.</p>
        )}
      </div>
    </div>
  );
}

