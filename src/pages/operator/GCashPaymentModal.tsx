import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, ArrowLeft, ShieldCheck,
  Loader2, ExternalLink, RefreshCw, Printer, QrCode,
  Sparkles, Smartphone, ArrowRight
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import { 
  generateDynamicQrPh, checkPaymentIntentStatus,
  createCheckoutSession, isPayMongoConfigured
} from '../../services/paymongoService';
import {
  isValidGcashReference,
  sanitizeGcashReference,
  generateStandardGcashReference
} from '../../services/applicationRules';
import { sendPaymentReceiptEmail } from '../../services/emailService';
import type { Application } from '../../types';

export function GCashPaymentModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [application, setApplication] = useState<Application | null>(null);
  const [amount, setAmount] = useState(450);
  const [isPaid, setIsPaid] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [error, setError] = useState('');

  // Mode: QR scan vs GCash direct / reference
  const [paymentMode, setPaymentMode] = useState<'qr' | 'checkout' | 'ref'>('qr');

  // Dynamic QR Ph states
  const [realQrCode, setRealQrCode] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(true);

  // Manual reference entry for demo/test
  const [manualRef, setManualRef] = useState('');
  const [isConfirmingManual, setIsConfirmingManual] = useState(false);
  const [refTouched, setRefTouched] = useState(false);
  const isRefValid = isValidGcashReference(manualRef);

  // Hosted checkout fallback
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const verifyingRef = useRef(false);
  const paymongoConfigured = isPayMongoConfigured();

  // 1. Load user's pending application & assessed fee
  useEffect(() => {
    if (!user) return;
    void supabaseService.getApplicationsAsync().then(applications => {
      const current = applications.find(app => (app.applicantId === user.id || app.driverId === user.id) && !app.treasurerPayment?.paid);
      if (current) {
        setApplication(current);
        setAmount(current.totalFee || 450);
      }
    });
  }, [user]);

  // 2. Automatically generate the Real Dynamic QR Ph code
  const fetchDynamicQr = async (targetAmount = amount) => {
    setIsLoadingQr(true);
    setError('');
    try {
      const data = await generateDynamicQrPh({
        amount: targetAmount,
        description: `Baliuag MTOP Franchise Fee - ${application?.plateNumber || 'Unit'}`,
        applicantName: user ? `${user.firstName} ${user.lastName}` : undefined,
      });

      if (data && data.qr_image) {
        setRealQrCode(data.qr_image);
        setPaymentIntentId(data.payment_intent_id);
      }
    } catch (err) {
      console.warn('Dynamic QR generation warning:', err);
      setError(err instanceof Error ? err.message : 'Could not generate dynamic QR Ph code.');
    } finally {
      setIsLoadingQr(false);
    }
  };

  useEffect(() => {
    if (amount > 0) {
      void fetchDynamicQr(amount);
    }
  }, [amount, application?.id]);

  // 3. Live Polling for Automatic Payment Detection (every 3 seconds)
  useEffect(() => {
    if (!paymentIntentId || isPaid) return;

    const interval = setInterval(async () => {
      if (verifyingRef.current) return;
      verifyingRef.current = true;
      try {
        const res = await checkPaymentIntentStatus(paymentIntentId);
        if (res.paid) {
          clearInterval(interval);
          const pId = res.payments?.[0]?.id || `PM-${paymentIntentId.slice(-8).toUpperCase()}`;
          await onPaymentConfirmed(pId);
        }
      } catch {
        // Polling silent fallback
      } finally {
        verifyingRef.current = false;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentIntentId, isPaid]);

  // Check URL query parameters (return from PayMongo checkout redirect)
  useEffect(() => {
    const status = searchParams.get('status');
    const sid = searchParams.get('session_id') || searchParams.get('source_id');
    if (status === 'success' && sid) {
      void onPaymentConfirmed(`PM-CHK-${sid.slice(-8).toUpperCase()}`);
    }
  }, [searchParams]);

  // 4. Record Confirmed Payment in Supabase & update Application
  const onPaymentConfirmed = async (ref: string) => {
    setRefNumber(ref);
    setIsPaid(true);

    if (user) {
      try {
        const apps = await supabaseService.getApplicationsAsync();
        const pendingApp = application || apps.find(
          a => (a.applicantId === user.id || a.driverId === user.id) && !a.treasurerPayment?.paid
        );

        if (pendingApp) {
          await supabaseService.recordTreasurerPaymentAsync(
            pendingApp.id,
            pendingApp.totalFee || amount,
            ref,
            'gcash',
            { id: user.id, name: `${user.firstName} ${user.lastName}` }
          );
        } else {
          await supabaseService.savePaymentAsync({
            id: crypto.randomUUID(),
            applicationId: '',
            payerId: user.id,
            payerName: `${user.firstName} ${user.lastName}`,
            amount,
            description: `Baliuag MTOP GCash Payment - Ref: ${ref}`,
            status: 'completed',
            paymentMethod: 'gcash',
            referenceNumber: ref,
            paidAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }, false);
        }
        void supabaseService.recordAuditLogAsync({
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userRole: user.role,
          action: 'PAYMENT_VERIFIED',
          details: `Digital QR Ph payment confirmed: ₱${amount.toFixed(2)} (OR/Ref: ${ref})`,
          targetId: pendingApp?.id,
        });

        // Dispatch official EmailJS electronic receipt
        if (user.email) {
          void sendPaymentReceiptEmail({
            toEmail: user.email,
            applicantName: pendingApp?.applicantName || `${user.firstName} ${user.lastName}`,
            orNumber: ref,
            amount: pendingApp?.totalFee || amount,
            paymentMethod: 'gcash',
            plateNumber: pendingApp?.plateNumber || 'Unit under Review',
            mtopNumber: pendingApp?.id,
            todaName: pendingApp?.todaName,
            applicationType: pendingApp?.type || 'new',
            paidAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Payment recording sync warning:', err);
      }
    }
  };

  // Manual payment submission (for defense testing / simulation)
  const handleManualConfirm = async () => {
    setRefTouched(true);
    if (!isValidGcashReference(manualRef)) {
      setError('GCash reference number must be a 10- to 13-digit alphanumeric code (e.g. 902184918204).');
      return;
    }
    setError('');
    const ref = manualRef.trim();
    setIsConfirmingManual(true);
    try {
      await onPaymentConfirmed(ref);
    } finally {
      setIsConfirmingManual(false);
    }
  };

  // PayMongo Hosted Checkout Redirection
  const handleCreateHostedCheckout = async () => {
    setIsCreatingCheckout(true);
    setError('');
    try {
      const currentUrl = window.location.origin + window.location.pathname;
      const session = await createCheckoutSession({
        amount,
        name: 'MTOP Franchise Application Fee',
        description: 'Baliwag City Tricycle MTOP Permit & Inspection Fee',
        successUrl: `${currentUrl}?status=success&session_id={checkout_session_id}`,
        cancelUrl: `${currentUrl}?status=cancelled`,
      });
      setCheckoutUrl(session.attributes.checkout_url);
      window.open(session.attributes.checkout_url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch PayMongo checkout.');
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '750px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="glass-container" style={{ padding: '2.5rem' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-glass"
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span className="pill-badge pill-emerald">
            <Sparkles size={12} /> Dynamic QR Ph & GCash
          </span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>City of Baliwag Treasury</span>
          {paymongoConfigured && (
            <span className="pill-badge pill-cyan" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
              <ShieldCheck size={12} /> PayMongo Sandbox Active
            </span>
          )}
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>
          Tricycle Franchise Fee Payment
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Scan the automatic <strong>PayMongo Dynamic QR Ph Code</strong> below using GCash, Maya, or any banking app. Payment is confirmed automatically in real-time.
        </p>

        {/* Error notification */}
        {error && (
          <div style={{
            padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5', fontSize: '0.88rem'
          }}>
            {error}
          </div>
        )}

        {isPaid ? (
          /* ══════════════════════════════════════════════════════════════ */
          /* PAID CONFIRMATION RECEIPT SCREEN (OFFICIAL MUNICIPAL RECEIPT)   */
          /* ══════════════════════════════════════════════════════════════ */
          <div className="glass-panel animate-fade-in printable-official-document" style={{
            padding: '2.25rem',
            border: '2px solid rgba(34, 197, 94, 0.5)',
            background: 'linear-gradient(135deg, rgba(20, 50, 30, 0.85) 0%, rgba(10, 30, 18, 0.95) 100%)',
            boxShadow: '0 15px 40px rgba(34, 197, 94, 0.2)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem', paddingBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.2)' }}>
              <div style={{
                width: '68px', height: '68px', borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.2)', border: '2px solid #22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto'
              }}>
                <CheckCircle2 size={40} color="#22c55e" />
              </div>
              <span className="pill-badge pill-emerald" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
                Official Municipal Electronic Receipt
              </span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4ade80', marginBottom: '0.25rem' }}>
                Payment Successfully Cleared
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                City of Baliwag — City Treasurer's Office
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Official OR / Reference #</span>
                <strong style={{ color: '#facc15', fontSize: '1.05rem', wordBreak: 'break-all' }}>
                  {refNumber}
                </strong>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Payment Method</span>
                <strong style={{ color: '#38bdf8', fontSize: '1.05rem' }}>
                  GCash / QR Ph Dynamic
                </strong>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Total Amount Paid</span>
                <strong style={{ color: '#4ade80', fontSize: '1.25rem', fontWeight: 800 }}>
                  ₱{amount.toFixed(2)}
                </strong>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Verification Status</span>
                <strong style={{ color: '#4ade80', fontSize: '1rem' }}>
                  CLEARED & VERIFIED
                </strong>
              </div>
            </div>

            {application && (
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  <div><span style={{ color: '#94a3b8' }}>Applicant:</span> <strong>{application.applicantName}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Plate Number:</span> <strong>{application.plateNumber}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>TODA:</span> <strong>{application.todaName}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Residency:</span> <strong>{application.residency === 'baliwag_resident' ? 'Baliwag Resident' : 'Non-Resident'}</strong></div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button
                onClick={() => window.print()}
                className="btn-glass"
                style={{ padding: '0.95rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Printer size={18} /> Print Official Receipt
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
        ) : (
          /* ══════════════════════════════════════════════════════════════ */
          /* ACTIVE CHECKOUT & AUTOMATIC DYNAMIC QR PH DISPLAY              */
          /* ══════════════════════════════════════════════════════════════ */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Assessment Summary Pill */}
            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                  Franchise Assessment Fee
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0.2rem 0' }}>
                  {application ? `${application.applicantName} (${application.plateNumber})` : 'MTOP Franchise Application'}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#38bdf8' }}>
                  TODA: {application?.todaName || 'Assigned TODA'} · {application?.residency === 'baliwag_resident' ? 'Baliwag Resident Rate' : 'Non-Resident Rate'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Assessed Amount</span>
                <strong style={{ fontSize: '1.75rem', color: '#4ade80' }}>
                  ₱{amount.toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Mode Selector Tabs (like in sinag-catering) */}
            <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setPaymentMode('qr')}
                className="btn-glass"
                style={{
                  flex: 1, padding: '0.65rem 1rem', fontSize: '0.85rem',
                  background: paymentMode === 'qr' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                  borderColor: paymentMode === 'qr' ? '#22c55e' : 'rgba(255,255,255,0.1)',
                  color: paymentMode === 'qr' ? '#4ade80' : '#cbd5e1',
                  fontWeight: paymentMode === 'qr' ? 700 : 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <QrCode size={16} /> Scan Dynamic QR Ph Code
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('checkout')}
                className="btn-glass"
                style={{
                  flex: 1, padding: '0.65rem 1rem', fontSize: '0.85rem',
                  background: paymentMode === 'checkout' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                  borderColor: paymentMode === 'checkout' ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                  color: paymentMode === 'checkout' ? '#38bdf8' : '#cbd5e1',
                  fontWeight: paymentMode === 'checkout' ? 700 : 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <ExternalLink size={16} /> PayMongo Hosted Checkout
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('ref')}
                className="btn-glass"
                style={{
                  padding: '0.65rem 1rem', fontSize: '0.85rem',
                  background: paymentMode === 'ref' ? 'rgba(250, 204, 21, 0.2)' : 'transparent',
                  borderColor: paymentMode === 'ref' ? '#facc15' : 'rgba(255,255,255,0.1)',
                  color: paymentMode === 'ref' ? '#facc15' : '#cbd5e1',
                  fontWeight: paymentMode === 'ref' ? 700 : 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <Smartphone size={16} /> Reference Bypass
              </button>
            </div>

            {/* TAB 1: DYNAMIC QR PH DISPLAY (AUTOMATIC) */}
            {paymentMode === 'qr' && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 40, 25, 0.6) 100%)',
                border: '1.5px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '20px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.25rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800,
                    marginBottom: '0.5rem'
                  }}>
                    <Sparkles size={13} /> REAL DYNAMIC QR PH — AUTO GENERATED
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                    City of Baliwag — MTOP Cashless Payment
                  </h4>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    Open GCash, Maya, BDO, BPI, or any QR Ph app & scan below
                  </span>
                </div>

                {/* QR Code Container */}
                <div style={{
                  width: '240px',
                  height: '240px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  border: '2px solid rgba(34, 197, 94, 0.3)'
                }}>
                  {isLoadingQr ? (
                    <div style={{ textAlign: 'center', color: '#0f172a' }}>
                      <Loader2 size={36} className="spin-icon" color="#16a34a" style={{ margin: '0 auto 0.5rem auto' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#16a34a' }}>
                        Generating Real QR Ph...
                      </span>
                    </div>
                  ) : realQrCode ? (
                    <img
                      src={realQrCode}
                      alt="PayMongo Dynamic QR Ph Code"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#0f172a' }}>
                      <QrCode size={160} color="#005ce6" />
                      <span style={{ fontSize: '0.75rem', display: 'block', color: '#64748b' }}>Standard QR Ph</span>
                    </div>
                  )}
                </div>

                {/* Live Polling Status Indicator */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.5rem 1rem', borderRadius: '999px',
                  background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)',
                  fontSize: '0.82rem', color: '#86efac'
                }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#22c55e', display: 'inline-block',
                    boxShadow: '0 0 10px #22c55e', animation: 'pulse 1.5s infinite'
                  }} />
                  <span>Listening for live payment confirmation...</span>
                </div>

                <div style={{ textAlign: 'center', maxWidth: '480px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                    Once scanned and authorized on your mobile phone, the system will instantly detect the transaction, mark your MTOP fee as paid, and generate your official municipal receipt.
                  </p>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '400px' }}>
                  <button
                    type="button"
                    onClick={() => fetchDynamicQr(amount)}
                    disabled={isLoadingQr}
                    className="btn-glass"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <RefreshCw size={14} className={isLoadingQr ? 'spin-icon' : ''} /> Refresh QR
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (paymentIntentId) {
                        void checkPaymentIntentStatus(paymentIntentId).then(res => {
                          if (res.paid) void onPaymentConfirmed(`PM-${paymentIntentId.slice(-8).toUpperCase()}`);
                          else setError('Payment not yet received in PayMongo. Please scan and authorize first.');
                        });
                      }
                    }}
                    className="btn-glass btn-emerald-glass"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <CheckCircle2 size={14} /> Check Status
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: HOSTED CHECKOUT TAB */}
            {paymentMode === 'checkout' && (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <ShieldCheck size={36} color="#38bdf8" style={{ margin: '0 auto 1rem auto' }} />
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                  PayMongo Hosted Checkout Session
                </h4>
                <p style={{ color: '#cbd5e1', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
                  Open PayMongo's secure hosted payment portal in a separate browser tab to pay with GCash or Card.
                </p>

                {checkoutUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-glass btn-primary-glass"
                      style={{ padding: '0.9rem 1.75rem', fontSize: '1rem', textDecoration: 'none' }}
                    >
                      <ExternalLink size={18} /> Re-open PayMongo Checkout Tab
                    </a>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      After completing payment in that tab, return here to view your confirmed receipt.
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateHostedCheckout}
                    disabled={isCreatingCheckout}
                    className="btn-glass btn-primary-glass"
                    style={{ padding: '0.95rem 2rem', fontSize: '1rem' }}
                  >
                    {isCreatingCheckout ? (
                      <><Loader2 size={18} className="spin-icon" /> Creating Checkout Session...</>
                    ) : (
                      <><ExternalLink size={18} /> Open PayMongo Checkout Page</>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* TAB 3: REFERENCE / TEST BYPASS TAB */}
            {paymentMode === 'ref' && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                    GCash Reference Number Confirmation
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setManualRef(generateStandardGcashReference());
                      setRefTouched(true);
                      setError('');
                    }}
                    className="btn-glass"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                  >
                    <Sparkles size={13} style={{ marginRight: '0.35rem' }} /> Auto-Generate Demo Reference
                  </button>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Enter the <strong>10- to 13-digit alphanumeric code</strong> automatically generated for every successful transaction, serving as the primary proof of payment and tracking identifier.
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      GCash / Bank Reference Number <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: isRefValid ? '#4ade80' : manualRef.length > 0 ? '#facc15' : '#64748b'
                    }}>
                      {manualRef.length} / 10–13 digits {isRefValid ? '✓ Valid' : manualRef.length > 0 ? `(Requires ${10 - manualRef.length > 0 ? (10 - manualRef.length) + ' more' : 'max 13'})` : ''}
                    </span>
                  </div>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. 902184918204 (10 to 13 characters)"
                    value={manualRef}
                    maxLength={13}
                    onChange={e => {
                      setManualRef(sanitizeGcashReference(e.target.value));
                      setRefTouched(true);
                      if (error) setError('');
                    }}
                    style={{
                      letterSpacing: '0.08em',
                      fontFamily: 'monospace',
                      fontSize: '1.05rem',
                      borderColor: (refTouched && manualRef.length > 0 && !isRefValid) ? '#ef4444' : isRefValid ? '#22c55e' : undefined
                    }}
                  />
                  {refTouched && manualRef.length > 0 && !isRefValid && (
                    <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                      Must be 10 to 13 alphanumeric characters (currently {manualRef.length}). Single digits or short codes are not permitted.
                    </p>
                  )}
                  {isRefValid && (
                    <p style={{ color: '#4ade80', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                      ✓ Format accepted: 10- to 13-character tracking identifier.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleManualConfirm}
                  disabled={isConfirmingManual || !isRefValid}
                  className="btn-glass btn-emerald-glass"
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    fontSize: '0.95rem',
                    justifyContent: 'center',
                    opacity: (!isRefValid || isConfirmingManual) ? 0.5 : 1,
                    cursor: (!isRefValid || isConfirmingManual) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isConfirmingManual ? (
                    <><Loader2 size={18} className="spin-icon" /> Confirming...</>
                  ) : (
                    <>Confirm Payment of ₱{amount.toFixed(2)} <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
