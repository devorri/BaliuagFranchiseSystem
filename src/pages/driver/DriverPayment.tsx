import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as storage from '../../services/storageService';
import { createGCashSource, getGCashSource, isPayMongoConfigured } from '../../services/paymongoService';
import type { Application } from '../../types';
import {
  CheckCircle2, Building, Receipt, Smartphone, QrCode,
  ArrowRight, ShieldCheck, X, Loader2, ExternalLink, RefreshCw, Printer
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function DriverPayment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [orNumber, setOrNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'cash'>('gcash');
  const [isPaid, setIsPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // PayMongo session tracking
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Fallback simulation state (if PayMongo keys not configured)
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [gcashRef] = useState(`900${Math.floor(10000000 + Math.random() * 90000000)}`);

  const paymongoReady = isPayMongoConfigured();

  useEffect(() => {
    if (user) {
      const apps = storage.getApplications();
      const userApp = apps.find(
        a => a.applicantId === user.id ||
          a.driverName?.toLowerCase() === `${user.firstName} ${user.lastName}`.toLowerCase()
      );
      if (userApp) {
        setApplication(userApp);
        if (userApp.treasurerPayment?.paid) {
          setIsPaid(true);
        }
      }
    }
  }, [user]);

  // Check if returning from PayMongo checkout
  useEffect(() => {
    const sourceId = searchParams.get('source_id') || searchParams.get('session_id');
    const status = searchParams.get('status');

    if (sourceId && (status === 'success' || status === 'paid')) {
      setCheckoutSessionId(sourceId);
      handleVerifyPayment(sourceId);
    }
  }, [searchParams]);

  // ──────────────────────────────────────
  // PayMongo GCash Checkout
  // ──────────────────────────────────────

  const handlePayWithGCash = async () => {
    if (!application) return;
    setIsLoading(true);
    setError('');

    try {
      const currentUrl = window.location.origin + window.location.pathname;

      const source = await createGCashSource({
        amount: 600,
        successUrl: `${currentUrl}?status=success&source_id={source_id}`,
        failedUrl: `${currentUrl}?status=failed`,
      });

      setCheckoutSessionId(source.id);
      setCheckoutUrl(source.attributes.redirect.checkout_url);

      // Open PayMongo's hosted GCash checkout page in a new tab
      window.open(source.attributes.redirect.checkout_url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPayment = async (sourceId?: string) => {
    const sid = sourceId || checkoutSessionId;
    if (!sid || !application) return;

    setIsVerifying(true);
    setError('');

    try {
      const source = await getGCashSource(sid);
      const status = source.attributes.status;

      if (status === 'chargeable' || status === 'paid') {
        const refNum = `PM-${sid.slice(-8).toUpperCase()}`;
        const updated = storage.recordTreasurerPayment(
          application.id,
          600,
          refNum,
          'gcash'
        );

        if (updated) {
          setApplication(updated);
          setIsPaid(true);
          setCheckoutUrl(null);
        }
      } else if (status === 'pending') {
        // Automatically accept or inform user
        const refNum = `PM-${sid.slice(-8).toUpperCase()}`;
        const updated = storage.recordTreasurerPayment(
          application.id,
          600,
          refNum,
          'gcash'
        );
        if (updated) {
          setApplication(updated);
          setIsPaid(true);
          setCheckoutUrl(null);
        }
      } else {
        setError(`GCash Source Status: ${status}. If authorized in GCash app, click "Verify Payment" again.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify payment status.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ──────────────────────────────────────
  // Fallback Simulated GCash
  // ──────────────────────────────────────

  const handleSimulatedGCashPayment = () => {
    if (!application) return;

    const updated = storage.recordTreasurerPayment(
      application.id,
      600,
      `GCASH-${gcashRef}`,
      'gcash'
    );

    if (updated) {
      setApplication(updated);
      setIsPaid(true);
      setShowSimulatedModal(false);
    }
  };

  // ──────────────────────────────────────
  // Cash Over-the-Counter
  // ──────────────────────────────────────

  const handlePayCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !orNumber.trim()) return;

    const updated = storage.recordTreasurerPayment(
      application.id,
      600,
      orNumber.trim(),
      'cash'
    );

    if (updated) {
      setApplication(updated);
      setIsPaid(true);
    }
  };

  // ──────────────────────────────────────
  // Render
  // ──────────────────────────────────────

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-orange">Step 3 of Workflow</span>
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Payment of Fees</span>
          {paymongoReady && (
            <span className="pill-badge pill-emerald" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
              <ShieldCheck size={12} /> PayMongo Live
            </span>
          )}
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Treasurer's Office Fee Payment
        </h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Ang bayad sa MTOP permit application ay opisyal na binabayaran sa <strong>City Treasurer's Office</strong> o sa pamamagitan ng <strong>GCash Cashless Payment</strong> powered by PayMongo.
        </p>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '1.25rem', borderRadius: '14px', marginBottom: '1.5rem',
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'
          }}>
            <div>{error}</div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => { setError(''); setShowSimulatedModal(true); }}
                className="btn-glass btn-emerald-glass"
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
              >
                <Smartphone size={16} /> Switch to Simulated GCash Payment Modal
              </button>
            </div>
          </div>
        )}

        {application ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* Fee Breakdown */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <Building size={24} color="#22c55e" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>City Treasurer Fee Breakdown</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: '#cbd5e1' }}>MTOP Base Application Fee</span>
                  <strong style={{ color: '#ffffff' }}>₱450.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Stenciling & Inspection Verification Fee</span>
                  <strong style={{ color: '#ffffff' }}>₱150.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>Kabuuang Bayarin sa Treasurer:</span>
                  <strong style={{ fontSize: '1.3rem', color: '#22c55e', fontWeight: 800 }}>₱600.00</strong>
                </div>
              </div>
            </div>

            {/* ════════════════════ PAID CONFIRMATION SCREEN ════════════════════ */}
            {isPaid ? (
              <div className="glass-panel animate-fade-in printable-official-document" style={{
                padding: '2.25rem',
                border: '2px solid rgba(34, 197, 94, 0.5)',
                background: 'linear-gradient(135deg, rgba(20, 50, 30, 0.75) 0%, rgba(10, 30, 18, 0.85) 100%)',
                boxShadow: '0 15px 40px rgba(34, 197, 94, 0.15)'
              }}>

                {/* Status Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.75rem', paddingBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.2)' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.2)', border: '2px solid #22c55e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto'
                  }}>
                    <CheckCircle2 size={36} color="#22c55e" />
                  </div>
                  <span className="pill-badge pill-emerald" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
                    Official Municipal Receipt
                  </span>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4ade80', marginBottom: '0.25rem' }}>
                    Payment Confirmation Successful
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                    Lungsod ng Baliwag — Tanggapan ng Ingat-Yaman (City Treasurer's Office)
                  </p>
                </div>

                {/* Structured Receipt Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Official Receipt / Ref No.</span>
                    <strong style={{ color: '#facc15', fontSize: '1.1rem', wordBreak: 'break-all' }}>
                      {application.treasurerPayment?.orNumber}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Payment Method</span>
                    <strong style={{ color: '#38bdf8', fontSize: '1.05rem', textTransform: 'uppercase' }}>
                      {application.treasurerPayment?.paymentMethod === 'gcash' ? 'GCash Cashless QR' : 'Treasurer Cash OR'}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Total Amount Paid</span>
                    <strong style={{ color: '#4ade80', fontSize: '1.2rem', fontWeight: 800 }}>
                      ₱600.00
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Payer / Driver Name</span>
                    <strong style={{ color: '#ffffff', fontSize: '1rem' }}>
                      {application.driverName || `${user?.firstName} ${user?.lastName}`}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>MTOP Reference No.</span>
                    <strong style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                      {application.id}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Date & Timestamp</span>
                    <strong style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                      {application.treasurerPayment?.paidAt ? new Date(application.treasurerPayment.paidAt).toLocaleString() : new Date().toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '1rem' }}>
                  <button
                    onClick={() => window.print()}
                    className="btn-glass"
                    style={{ padding: '0.95rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Printer size={18} /> Print Official Receipt
                  </button>

                  <button
                    onClick={() => navigate('/driver/toda-status')}
                    className="btn-glass btn-primary-glass"
                    style={{ padding: '0.95rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    Proceed to TODA Clearance <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              /* ════════════════════ UNPAID STATE ════════════════════ */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Method Selector Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('gcash'); setCheckoutUrl(null); }}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
                      border: paymentMethod === 'gcash' ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.15)',
                      background: paymentMethod === 'gcash' ? 'rgba(34, 197, 94, 0.18)' : 'rgba(10, 24, 16, 0.55)',
                    }}
                  >
                    <Smartphone size={28} color="#22c55e" style={{ margin: '0 auto 0.5rem auto' }} />
                    <strong style={{ color: '#ffffff', display: 'block', fontSize: '1.05rem' }}>GCash via PayMongo</strong>
                    <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {paymongoReady ? 'Real Online Payment' : 'Instant Cashless Payment'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('cash'); setCheckoutUrl(null); }}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
                      border: paymentMethod === 'cash' ? '2px solid #eab308' : '1px solid rgba(255,255,255,0.15)',
                      background: paymentMethod === 'cash' ? 'rgba(234, 179, 8, 0.18)' : 'rgba(10, 24, 16, 0.55)',
                    }}
                  >
                    <Building size={28} color="#eab308" style={{ margin: '0 auto 0.5rem auto' }} />
                    <strong style={{ color: '#ffffff', display: 'block', fontSize: '1.05rem' }}>Cash Over-the-Counter</strong>
                    <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Treasurer Office Receipt</span>
                  </button>
                </div>

                {/* ─── GCash Panel ─── */}
                {paymentMethod === 'gcash' && (
                  <div className="glass-panel" style={{ padding: '1.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <QrCode size={24} color="#22c55e" />
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                        {paymongoReady ? 'PayMongo GCash Checkout' : 'GCash Instant Payment'}
                      </h3>
                    </div>

                    {paymongoReady ? (
                      /* ── Real PayMongo Flow ── */
                      <div style={{ textAlign: 'center' }}>
                        {!checkoutUrl ? (
                          <>
                            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '1.5rem', maxWidth: '550px', margin: '0 auto 1.5rem auto' }}>
                              I-click ang button sa ibaba upang mag-open ng <strong>PayMongo GCash Checkout</strong>. Ire-redirect ka sa secure na payment page upang makumpleto ang ₱600.00 na bayad.
                            </p>

                            {/* PayMongo Badge */}
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                              background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: '10px', padding: '0.6rem 1.2rem', marginBottom: '1.5rem',
                              fontSize: '0.82rem', color: '#86efac'
                            }}>
                              <ShieldCheck size={16} /> Secured by PayMongo — PCI DSS Compliant
                            </div>

                            <br />
                            <button
                              type="button"
                              onClick={handlePayWithGCash}
                              disabled={isLoading}
                              className="btn-glass btn-primary-glass"
                              style={{ padding: '1rem 2rem', fontSize: '1.05rem', opacity: isLoading ? 0.7 : 1 }}
                            >
                              {isLoading ? (
                                <><Loader2 size={20} className="spin-icon" /> Creating Checkout Session...</>
                              ) : (
                                <><Smartphone size={20} /> Pay ₱600.00 via GCash</>
                              )}
                            </button>
                          </>
                        ) : (
                          /* ── Checkout Created — Awaiting Payment ── */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
                            <div style={{
                              padding: '1.25rem', borderRadius: '14px', width: '100%',
                              background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.35)',
                            }}>
                              <Loader2 size={28} color="#38bdf8" style={{ margin: '0 auto 0.75rem auto' }} className="spin-icon" />
                              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#7dd3fc' }}>
                                GCash Checkout Session Created!
                              </p>
                              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.4rem' }}>
                                A new tab was opened with the PayMongo checkout page. Complete your GCash payment there, then return here and click <strong>"Verify Payment"</strong>.
                              </p>
                            </div>

                            <a
                              href={checkoutUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-glass btn-primary-glass"
                              style={{ padding: '0.85rem 1.75rem', textDecoration: 'none', fontSize: '0.95rem' }}
                            >
                              <ExternalLink size={18} /> Re-open GCash Checkout
                            </a>

                            <button
                              type="button"
                              onClick={() => handleVerifyPayment()}
                              disabled={isVerifying}
                              className="btn-glass btn-emerald-glass"
                              style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', opacity: isVerifying ? 0.7 : 1 }}
                            >
                              {isVerifying ? (
                                <><Loader2 size={20} className="spin-icon" /> Verifying Payment...</>
                              ) : (
                                <><RefreshCw size={20} /> Verify Payment Status</>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ── Simulated GCash (No PayMongo Keys) ── */
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '1.5rem', maxWidth: '550px', margin: '0 auto 1.5rem auto' }}>
                          I-click ang button sa ibaba upang buksan ang <strong>GCash QR Scanner Modal</strong> at kumpletuhin ang pagbabayad ng <strong>₱600.00</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowSimulatedModal(true)}
                          className="btn-glass btn-primary-glass"
                          style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}
                        >
                          <Smartphone size={20} /> Open GCash QR Payment (₱600.00)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Cash Panel ─── */}
                {paymentMethod === 'cash' && (
                  <form onSubmit={handlePayCash} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#eab308' }}>
                      I-record ang Cash Official Receipt (OR)
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
                      Kung nabayaran na ang ₱600.00 sa Municipal Treasurer's Office cashier, i-type ang OR number sa ibaba.
                    </p>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                        Treasurer Official Receipt (OR) Number *
                      </label>
                      <input
                        type="text"
                        className="glass-input"
                        value={orNumber}
                        onChange={e => setOrNumber(e.target.value)}
                        placeholder="e.g. OR-TREAS-88192"
                        required
                      />
                    </div>
                    <button type="submit" className="btn-glass btn-emerald-glass" style={{ padding: '1rem', fontSize: '1.05rem' }}>
                      <Receipt size={20} /> Record Cash Treasurer Payment
                    </button>
                  </form>
                )}

              </div>
            )}

          </div>
        ) : (
          <p style={{ color: '#cbd5e1' }}>Wala pang aktibong aplikasyon. Pumunta sa <strong>Submit Requirements</strong> para mag-apply.</p>
        )}
      </div>

      {/* ════════════ Simulated GCash QR Modal (Fallback) ════════════ */}
      {showSimulatedModal && (
        <div className="modal-overlay" onClick={() => setShowSimulatedModal(false)}>
          <div className="glass-container modal-glass-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Smartphone size={22} color="#22c55e" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>GCash Payment</h3>
              </div>
              <button onClick={() => setShowSimulatedModal(false)} className="btn-glass" style={{ padding: '0.4rem' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
              <div style={{
                background: 'linear-gradient(135deg, #005ce6 0%, #003b99 100%)',
                padding: '1.5rem', borderRadius: '20px', width: '100%', color: '#ffffff',
                boxShadow: '0 12px 35px rgba(0, 92, 230, 0.4)', border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.2rem' }}>GCash Scan to Pay</div>
                <span style={{ fontSize: '0.78rem', color: '#93c5fd', display: 'block', marginBottom: '1rem' }}>
                  Pamahalaang Lungsod ng Baliwag Treasurer
                </span>
                <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '14px', display: 'inline-block', marginBottom: '1rem' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=BALIUAG-TREASURER-GCASH-${gcashRef}`}
                    alt="GCash QR"
                    style={{ width: '180px', height: '180px' }}
                  />
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.65rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                  <span>Ref No: </span><strong>GCASH-{gcashRef}</strong><br />
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>₱600.00</span>
                </div>
              </div>

              <button
                onClick={handleSimulatedGCashPayment}
                className="btn-glass btn-emerald-glass"
                style={{ width: '100%', padding: '0.95rem', fontSize: '1rem' }}
              >
                <ShieldCheck size={20} /> Confirm GCash Payment (₱600.00)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
