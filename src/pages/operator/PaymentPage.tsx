import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { useToast } from '../../components/ui/Toast';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CreditCard, QrCode, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import * as storage from '../../services/storageService';

export function PaymentPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [payingAppId, setPayingAppId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  if (!user) return null;

  const applications = storage.getApplicationsByUser(user.id);
  const payments = storage.getPaymentsByUser(user.id);

  // Applications that need payment (approved but not yet paid)
  const paidAppIds = payments.filter(p => p.status === 'completed').map(p => p.applicationId);
  const unpaidApps = applications.filter(a => !paidAppIds.includes(a.id) && (a.status === 'pending' || a.status === 'approved' || a.status === 'under_review'));

  const handleSimulatePayment = (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    setProcessing(true);
    setTimeout(() => {
      const payment = storage.createPayment({
        applicationId: appId,
        payerId: user.id,
        payerName: `${user.firstName} ${user.lastName}`,
        amount: app.totalFee,
        baseFee: app.baseFee,
        latePenalty: app.latePenalty,
        status: 'completed',
        paymentMethod: 'qr_code',
        paidAt: new Date().toISOString(),
      });

      storage.createReceipt({
        paymentId: payment.id,
        applicationId: appId,
        payerName: `${user.firstName} ${user.lastName}`,
        amount: app.totalFee,
        description: `${app.type === 'new' ? 'New Registration' : 'Renewal'} Fee — ${app.plateNumber}`,
        issuedBy: 'System',
      });

      showToast('Payment successful! Receipt generated.', 'success');
      setPayingAppId(null);
      setProcessing(false);
    }, 2000);
  };

  return (
    <div className="page">
      <Header title="Payments" subtitle="Pay fees and view payment history" />

      <div className="page__content">
        {/* Unpaid */}
        {unpaidApps.length > 0 && (
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Pending Payments</h3>
            </div>
            <div className="card__body">
              <div className="payment-list">
                {unpaidApps.map(app => (
                  <div key={app.id} className="payment-item">
                    <div className="payment-item__info">
                      <h4>{app.type === 'new' ? 'New Registration' : 'Renewal'} — {app.plateNumber}</h4>
                      <p>{app.todaName} • {app.vehicleMake} {app.vehicleModel}</p>
                    </div>
                    <div className="payment-item__amount">
                      <span className="payment-item__total">₱{app.totalFee.toLocaleString()}.00</span>
                    </div>
                    <button className="btn btn--primary btn--sm" onClick={() => setPayingAppId(app.id)}>
                      <QrCode size={14} /> Pay Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QR Payment Modal */}
        {payingAppId && (() => {
          const app = applications.find(a => a.id === payingAppId);
          if (!app) return null;
          return (
            <div className="modal-overlay" onClick={() => !processing && setPayingAppId(null)}>
              <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
                <div className="modal__header">
                  <h3 className="modal__title">QR Code Payment</h3>
                </div>
                <div className="modal__body">
                  <div className="qr-payment">
                    <div className="qr-payment__code">
                      <QRCodeSVG
                        value={`BALIUAG-TRIKE-PAY|${app.id}|${app.totalFee}|${user.id}`}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#1E3A5F"
                        level="H"
                      />
                    </div>
                    <p className="qr-payment__instruction">Scan QR code with your payment app</p>
                    <div className="qr-payment__details">
                      <div className="qr-payment__row">
                        <span>Application</span>
                        <span>{app.plateNumber}</span>
                      </div>
                      <div className="qr-payment__row">
                        <span>Amount</span>
                        <span className="qr-payment__amount">₱{app.totalFee.toLocaleString()}.00</span>
                      </div>
                    </div>
                    <button
                      className="btn btn--primary btn--full"
                      onClick={() => handleSimulatePayment(app.id)}
                      disabled={processing}
                    >
                      {processing ? <span className="btn__spinner"></span> : <><CheckCircle size={16} /> Simulate Payment</>}
                    </button>
                    {!processing && (
                      <button className="btn btn--ghost btn--full" onClick={() => setPayingAppId(null)}>Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Payment History */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Payment History</h3>
          </div>
          <div className="card__body">
            {payments.length === 0 ? (
              <div className="card__empty">
                <CreditCard size={48} />
                <h3>No Payments Yet</h3>
                <p>Your payment history will appear here.</p>
              </div>
            ) : (
              <div className="mini-list">
                {[...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(pay => (
                  <div key={pay.id} className="mini-list__item">
                    <div className="mini-list__info">
                      <span className="mini-list__title">₱{pay.amount.toLocaleString()}.00 — {pay.referenceNumber}</span>
                      <span className="mini-list__sub">
                        {pay.paymentMethod === 'qr_code' ? 'QR Code' : 'Cash'} • {new Date(pay.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <StatusBadge status={pay.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
