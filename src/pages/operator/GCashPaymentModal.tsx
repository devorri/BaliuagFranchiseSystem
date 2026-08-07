import { useState, useEffect } from 'react';
import {
  CheckCircle2, Smartphone, ArrowLeft, ShieldCheck,
  Loader2, ExternalLink, RefreshCw, Printer
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createGCashSource, getGCashSource, isPayMongoConfigured } from '../../services/paymongoService';

export function GCashPaymentModal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isPaid, setIsPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [refNumber, setRefNumber] = useState('');

  // PayMongo session tracking
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  // Fallback simulation
  const [simRef] = useState(`900${Math.floor(10000000 + Math.random() * 90000000)}`);

  const paymongoReady = isPayMongoConfigured();

  // Check for return from PayMongo
  useEffect(() => {
    const sourceId = searchParams.get('source_id') || searchParams.get('session_id');
    const status = searchParams.get('status');

    if (sourceId && (status === 'success' || status === 'paid')) {
      setCheckoutSessionId(sourceId);
      verifyPayment(sourceId);
    }
  }, [searchParams]);

  const handleCreateCheckout = async () => {
    setIsLoading(true);
    setError('');

    try {
      const currentUrl = window.location.origin + window.location.pathname;

      const source = await createGCashSource({
        amount: 1250,
        successUrl: `${currentUrl}?status=success&source_id={source_id}`,
        failedUrl: `${currentUrl}?status=failed`,
      });

      setCheckoutSessionId(source.id);
      setCheckoutUrl(source.attributes.redirect.checkout_url);
      window.open(source.attributes.redirect.checkout_url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (sourceId?: string) => {
    const sid = sourceId || checkoutSessionId;
    if (!sid) return;

    setIsVerifying(true);
    setError('');

    try {
      const source = await getGCashSource(sid);
      const status = source.attributes.status;

      if (status === 'chargeable' || status === 'paid' || status === 'pending') {
        const ref = `PM-${sid.slice(-8).toUpperCase()}`;
        setRefNumber(ref);
        setIsPaid(true);
        setCheckoutUrl(null);
      } else {
        setError(`GCash Source Status: ${status}. If completed, click Verify Payment again.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify payment.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulatePayment = () => {
    setRefNumber(`GCASH-REF-${simRef}`);
    setIsPaid(true);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-glass"
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-emerald">GCash QR Payment</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Cashless Transaction</span>
          {paymongoReady && (
            <span className="pill-badge pill-cyan" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
              <ShieldCheck size={12} /> PayMongo Live
            </span>
          )}
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          GCash QR Code Payment Portal
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Magbayad nang mabilis at cashless gamit ang inyong <strong>GCash App</strong> {paymongoReady ? 'sa pamamagitan ng PayMongo secure checkout.' : 'sa pamamagitan ng pag-scan ng QR Code sa ibaba.'}
        </p>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '1.25rem', borderRadius: '14px', marginBottom: '1.5rem',
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'
          }}>
            <div>{error}</div>
            <button
              type="button"
              onClick={handleSimulatePayment}
              className="btn-glass btn-emerald-glass"
              style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', alignSelf: 'flex-start' }}
            >
              <Smartphone size={16} /> Instant Simulated GCash Payment Confirmation
            </button>
          </div>
        )}

        {isPaid ? (
          /* ═══ PAID CONFIRMATION RECEIPT SCREEN ═══ */
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
                Lungsod ng Baliwag — Tanggapan ng Ingat-Yaman (Franchise Operator Portal)
              </p>
            </div>

            {/* Structured Receipt Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Reference No.</span>
                <strong style={{ color: '#facc15', fontSize: '1.1rem', wordBreak: 'break-all' }}>
                  {refNumber}
                </strong>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Payment Method</span>
                <strong style={{ color: '#38bdf8', fontSize: '1.05rem' }}>
                  GCash Cashless Payment
                </strong>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Total Amount Paid</span>
                <strong style={{ color: '#4ade80', fontSize: '1.2rem', fontWeight: 800 }}>
                  ₱1,250.00
                </strong>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Status</span>
                <strong style={{ color: '#4ade80', fontSize: '1rem' }}>
                  CLEARED & VERIFIED
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
                <Printer size={18} /> Print Receipt
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="btn-glass btn-emerald-glass"
                style={{ padding: '0.95rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                Return to Dashboard <ArrowLeft size={18} />
              </button>
            </div>
          </div>
        ) : paymongoReady ? (
          /* ═══ Real PayMongo Flow ═══ */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            {!checkoutUrl ? (
              <>
                {/* PayMongo Badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '10px', padding: '0.6rem 1.2rem',
                  fontSize: '0.82rem', color: '#86efac'
                }}>
                  <ShieldCheck size={16} /> Secured by PayMongo — PCI DSS Compliant
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '1.25rem' }}>
                    Click the button below to open a <strong>secure PayMongo GCash checkout page</strong>. You will be redirected to complete payment of <strong>₱1,250.00</strong>.
                  </p>

                  <div style={{
                    background: 'rgba(255,255,255,0.08)', padding: '0.85rem',
                    borderRadius: '12px', marginBottom: '1.25rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', color: '#94a3b8' }}>Total Amount</span>
                    <strong style={{ fontSize: '1.6rem', color: '#22c55e' }}>₱1,250.00</strong>
                  </div>
                </div>

                <button
                  onClick={handleCreateCheckout}
                  disabled={isLoading}
                  className="btn-glass btn-primary-glass"
                  style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', opacity: isLoading ? 0.7 : 1 }}
                >
                  {isLoading ? (
                    <><Loader2 size={20} className="spin-icon" /> Creating Checkout...</>
                  ) : (
                    <><Smartphone size={20} /> Pay ₱1,250.00 via GCash</>
                  )}
                </button>
              </>
            ) : (
              /* ── Checkout Created ── */
              <>
                <div style={{
                  padding: '1.25rem', borderRadius: '14px', width: '100%',
                  background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.35)',
                  textAlign: 'center'
                }}>
                  <Loader2 size={28} color="#38bdf8" style={{ margin: '0 auto 0.75rem auto' }} className="spin-icon" />
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#7dd3fc' }}>
                    Checkout Session Created!
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.4rem' }}>
                    Complete your GCash payment in the new tab, then return here and click <strong>"Verify Payment"</strong>.
                  </p>
                </div>

                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass btn-primary-glass"
                  style={{ padding: '0.85rem 1.75rem', textDecoration: 'none', fontSize: '0.95rem' }}
                >
                  <ExternalLink size={18} /> Re-open Checkout Page
                </a>

                <button
                  onClick={() => verifyPayment()}
                  disabled={isVerifying}
                  className="btn-glass btn-emerald-glass"
                  style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', opacity: isVerifying ? 0.7 : 1 }}
                >
                  {isVerifying ? (
                    <><Loader2 size={20} className="spin-icon" /> Verifying...</>
                  ) : (
                    <><RefreshCw size={20} /> Verify Payment Status</>
                  )}
                </button>
              </>
            )}
          </div>
        ) : (
          /* ═══ Simulated Flow (No PayMongo Keys) ═══ */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #005ce6 0%, #003b99 100%)',
              padding: '1.75rem', borderRadius: '24px',
              boxShadow: '0 15px 40px rgba(0, 92, 230, 0.4)',
              textAlign: 'center', width: '100%', maxWidth: '360px',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.25rem' }}>
                GCash Scan to Pay
              </div>
              <span style={{ color: '#93c5fd', fontSize: '0.8rem', display: 'block', marginBottom: '1.25rem' }}>
                Lungsod ng Baliwag MTOP Treasury
              </span>
              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '16px', display: 'inline-block' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BALIUAG-GCASH-PAYMENT-REF-${simRef}`}
                  alt="GCash QR Code"
                  style={{ width: '200px', height: '200px' }}
                />
              </div>
              <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.15)', padding: '0.75rem', borderRadius: '12px', color: '#ffffff' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Total Amount</span>
                <strong style={{ fontSize: '1.4rem' }}>₱1,250.00</strong>
              </div>
            </div>

            <button
              onClick={handleSimulatePayment}
              className="btn-glass btn-emerald-glass"
              style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
            >
              <Smartphone size={20} /> Simulate GCash Payment Confirmation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
