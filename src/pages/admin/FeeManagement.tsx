import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { useToast } from '../../components/ui/Toast';
import { Settings, Save } from 'lucide-react';
import * as storage from '../../services/storageService';

export function FeeManagement() {
  const { showToast } = useToast();
  const config = storage.getFeeConfig();

  const [form, setForm] = useState({
    newRegistrationResident: config.newRegistrationResident,
    newRegistrationNonResident: config.newRegistrationNonResident,
    renewalResident: config.renewalResident,
    renewalNonResident: config.renewalNonResident,
    latePenaltyPerMonth: config.latePenaltyPerMonth,
    maxLatePenaltyMonths: config.maxLatePenaltyMonths,
  });

  const updateField = (field: string, value: number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateFeeConfig(form);
    showToast('Fee configuration updated successfully!', 'success');
  };

  // Fee History from payments
  const payments = storage.getPayments()
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPenalties = payments.reduce((sum, p) => sum + p.latePenalty, 0);

  return (
    <div className="page">
      <Header title="Fee Management" subtitle="Configure franchise fees and penalties" />

      <div className="page__content">
        <div className="page__grid">
          {/* Fee Config */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title"><Settings size={18} /> Fee Configuration</h3>
            </div>
            <div className="card__body">
              <form onSubmit={handleSave}>
                <h4 className="form-section__title">New Registration Fees</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Resident (₱)</label>
                    <input className="form-input" type="number" min={0} value={form.newRegistrationResident} onChange={e => updateField('newRegistrationResident', parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Non-Resident (₱)</label>
                    <input className="form-input" type="number" min={0} value={form.newRegistrationNonResident} onChange={e => updateField('newRegistrationNonResident', parseInt(e.target.value) || 0)} />
                  </div>
                </div>

                <h4 className="form-section__title">Renewal Fees</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Resident (₱)</label>
                    <input className="form-input" type="number" min={0} value={form.renewalResident} onChange={e => updateField('renewalResident', parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Non-Resident (₱)</label>
                    <input className="form-input" type="number" min={0} value={form.renewalNonResident} onChange={e => updateField('renewalNonResident', parseInt(e.target.value) || 0)} />
                  </div>
                </div>

                <h4 className="form-section__title">Late Penalties</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Penalty per Month (₱)</label>
                    <input className="form-input" type="number" min={0} value={form.latePenaltyPerMonth} onChange={e => updateField('latePenaltyPerMonth', parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Penalty Months</label>
                    <input className="form-input" type="number" min={1} max={24} value={form.maxLatePenaltyMonths} onChange={e => updateField('maxLatePenaltyMonths', parseInt(e.target.value) || 1)} />
                  </div>
                </div>

                <button type="submit" className="btn btn--primary">
                  <Save size={16} /> Save Configuration
                </button>
              </form>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Revenue Summary</h3>
            </div>
            <div className="card__body">
              <div className="revenue-stats">
                <div className="revenue-stat">
                  <span className="revenue-stat__label">Total Revenue</span>
                  <span className="revenue-stat__value">₱{totalRevenue.toLocaleString()}.00</span>
                </div>
                <div className="revenue-stat">
                  <span className="revenue-stat__label">Total Penalties Collected</span>
                  <span className="revenue-stat__value">₱{totalPenalties.toLocaleString()}.00</span>
                </div>
                <div className="revenue-stat">
                  <span className="revenue-stat__label">Total Transactions</span>
                  <span className="revenue-stat__value">{payments.length}</span>
                </div>
              </div>

              <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Recent Payments</h4>
              <div className="mini-list">
                {payments.slice(0, 5).map(pay => (
                  <div key={pay.id} className="mini-list__item">
                    <div className="mini-list__info">
                      <span className="mini-list__title">{pay.payerName} — {pay.referenceNumber}</span>
                      <span className="mini-list__sub">{new Date(pay.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="mini-list__amount">₱{pay.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
