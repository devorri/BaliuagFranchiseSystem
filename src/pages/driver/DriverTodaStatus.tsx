import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApplicationsAsync, getPaymentsAsync, getUsersAsync, savePaymentAsync } from '../../services/supabaseService';
import { belongsToToda } from '../../services/todaService';
import type { Application, Payment, User } from '../../types';
import { CheckCircle2, Clock, Award, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DriverTodaStatus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [president, setPresident] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      Promise.all([getApplicationsAsync(), getUsersAsync(), getPaymentsAsync()]).then(([apps, users, allPayments]) => {
        const userApp = apps.find(app => app.driverId === user.id || app.applicantId === user.id);
        if (!userApp) return;
        setApplication(userApp);
        setPresident(users.find(account =>
          (account.role === 'president' || account.role === 'toda_president')
          && belongsToToda(userApp.todaName, account.todaName)
        ) || null);
        setPayments(allPayments.filter(payment => payment.applicationId === userApp.id));
      });
    }
  }, [user]);

  const hasTodaApproval = application?.presidentEndorsed || application?.todaApproval?.routeFeePaid;
  const currentPayment = payments.find(payment => payment.status === 'pending')
    || payments.find(payment => payment.status === 'completed');

  const handleSubmitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !application || !paymentReference.trim() || currentPayment) return;
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
          Ipapasa ang aplikasyon sa TODA President para suriin kung pasok ang driver sa linya. Kapag inendorso, susuriin ng Municipal Admin ang lahat ng requirements.
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
                    <CheckCircle2 size={18} color="#4ade80" /> Inendorso ni <strong>{application.presidentEndorsedBy || application.todaApproval?.approvedByName || 'TODA President'}</strong> ang aplikasyon.
                  </p>
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

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Wallet size={18} /> TODA Line Payment
              </h3>
              {president?.todaPaymentQrUrl ? (
                <img src={president.todaPaymentQrUrl} alt={`${application.todaName} payment QR`} style={{ width: 180, aspectRatio: '1', objectFit: 'contain', background: '#fff', padding: '0.5rem', borderRadius: '6px' }} />
              ) : <p style={{ color: '#facc15', fontSize: '0.88rem' }}>Wala pang naka-upload na official payment QR ang inyong TODA President.</p>}
              <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '0.75rem 0' }}>
                Route at membership fees: <strong>₱{(application.todaFee || 800).toFixed(2)}</strong>. Pagkatapos magbayad, ilagay ang GCash reference number para ma-verify ng President.
              </p>
              {currentPayment ? (
                <p className={`pill-badge ${currentPayment.status === 'completed' ? 'pill-emerald' : 'pill-orange'}`}>
                  Payment {currentPayment.status}: {currentPayment.referenceNumber}
                </p>
              ) : (
                <form onSubmit={handleSubmitPayment} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <input aria-label="GCash payment reference" className="glass-input" placeholder="GCash reference number" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} required />
                  <button type="submit" className="btn-glass btn-primary-glass" disabled={submittingPayment || !president?.todaPaymentQrUrl}>
                    {submittingPayment ? 'Sending...' : 'Submit Payment Reference'}
                  </button>
                </form>
              )}
              {paymentError && <p role="alert" style={{ color: '#f87171', marginTop: '0.5rem' }}>{paymentError}</p>}
            </div>

          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>Wala pang aktibong aplikasyon.</p>
        )}
      </div>
    </div>
  );
}
