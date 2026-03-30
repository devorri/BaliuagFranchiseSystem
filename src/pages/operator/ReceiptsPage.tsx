import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { Receipt, Printer } from 'lucide-react';
import * as storage from '../../services/storageService';

export function ReceiptsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const receipts = storage.getReceiptsByUser(user.id)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  const handlePrint = (receiptId: string) => {
    const receipt = receipts.find(r => r.id === receiptId);
    if (!receipt) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.receiptNumber}</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #1E3A5F; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #1E3A5F; font-size: 20px; margin: 0; }
          .header p { margin: 5px 0; color: #666; font-size: 12px; }
          .receipt-title { text-align: center; font-size: 16px; font-weight: bold; color: #1E3A5F; margin: 20px 0; }
          .details { margin: 20px 0; }
          .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .details-row span:first-child { color: #666; }
          .total { font-size: 18px; font-weight: bold; color: #1E3A5F; border-top: 2px solid #1E3A5F; margin-top: 10px; padding-top: 10px; }
          .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Baliuag City Local Government Unit</h1>
          <p>Tricycle Franchise Management System</p>
          <p>Official Digital Receipt</p>
        </div>
        <div class="receipt-title">OFFICIAL RECEIPT</div>
        <div class="details">
          <div class="details-row"><span>Receipt No:</span><span>${receipt.receiptNumber}</span></div>
          <div class="details-row"><span>Date Issued:</span><span>${new Date(receipt.issuedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
          <div class="details-row"><span>Payer:</span><span>${receipt.payerName}</span></div>
          <div class="details-row"><span>Description:</span><span>${receipt.description}</span></div>
          <div class="details-row"><span>Issued By:</span><span>${receipt.issuedBy}</span></div>
          <div class="details-row total"><span>Amount Paid:</span><span>₱${receipt.amount.toLocaleString()}.00</span></div>
        </div>
        <div class="footer">
          <p>This is a system-generated receipt. No signature required.</p>
          <p>Baliuag City Tricycle Registration System © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="page">
      <Header title="Digital Receipts" subtitle="View and print your payment receipts" />

      <div className="page__content">
        {receipts.length === 0 ? (
          <div className="card">
            <div className="card__body">
              <div className="card__empty">
                <Receipt size={48} />
                <h3>No Receipts Yet</h3>
                <p>Receipts will appear here after successful payments.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="receipt-list">
            {receipts.map(receipt => (
              <div key={receipt.id} className="receipt-card">
                <div className="receipt-card__header">
                  <div className="receipt-card__icon">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h4 className="receipt-card__number">{receipt.receiptNumber}</h4>
                    <p className="receipt-card__date">{new Date(receipt.issuedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="receipt-card__body">
                  <p className="receipt-card__desc">{receipt.description}</p>
                  <p className="receipt-card__payer">Payer: {receipt.payerName}</p>
                </div>
                <div className="receipt-card__footer">
                  <span className="receipt-card__amount">₱{receipt.amount.toLocaleString()}.00</span>
                  <button className="btn btn--outline btn--sm" onClick={() => handlePrint(receipt.id)}>
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
