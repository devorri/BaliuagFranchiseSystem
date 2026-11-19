import { useEffect, useState } from 'react';
import { CalendarClock, Loader2, RotateCcw, BellRing } from 'lucide-react';
import * as supabaseService from '../../services/supabaseService';
import { daysFromToday, isSimulated, now, setSystemDate, todayStr } from '../../services/clock';
import { useToast } from '../ui/Toast';
import type { Franchise } from '../../types';

/**
 * Date Navigator — moves the system date (not the PC clock) so the panel can
 * jump to a franchise's expiration date and see the SMS expiry reminders,
 * expired status, and renewal unlock happen.
 */
export function DateNavigator() {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(todayStr());
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const simulated = isSimulated();

  useEffect(() => {
    const notice = sessionStorage.getItem('baliuag_date_nav_sms_notice');
    if (notice) {
      sessionStorage.removeItem('baliuag_date_nav_sms_notice');
      showToast(notice, 'info');
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void supabaseService.getFranchisesAsync().then(list => setFranchises(list));
  }, [open]);

  const offsetDateStr = (baseIso: string, deltaDays: number): string => {
    const d = new Date(baseIso.slice(0, 10) + 'T12:00:00');
    d.setDate(d.getDate() + deltaDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const apply = async (dateStr: string | null) => {
    setBusy(true);
    setSystemDate(dateStr);
    try {
      // Re-run expiry checks on the new date so SMS reminders are generated right away
      const res = await supabaseService.processFranchiseLifecycleAsync();
      if (res.triggeredCount > 0) {
        sessionStorage.setItem(
          'baliuag_date_nav_sms_notice',
          `Date changed to ${dateStr || 'Today'}: Dispatched ${res.triggeredCount} SMS Expiry Notification(s) (${res.triggeredMessages.join(' • ')})!`
        );
      } else if (dateStr) {
        sessionStorage.setItem(
          'baliuag_date_nav_sms_notice',
          `System Date set to ${dateStr}. Check the Notification Bell or SMS Notifications inbox for expiry alerts.`
        );
      }
    } catch (err) {
      console.warn('Lifecycle check after date change failed:', err);
    } finally {
      window.location.reload();
    }
  };

  const primaryFranchise = franchises[0];
  const primaryExpiry = primaryFranchise ? (primaryFranchise.endDate || primaryFranchise.expiresAt).slice(0, 10) : null;

  const label = now().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => { setDraft(todayStr()); setOpen(!open); }}
        className="btn-glass"
        title="Date Navigator — change the system date to test franchise expiration & SMS notifications"
        style={{
          padding: '0.45rem 0.75rem',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          borderColor: simulated ? 'rgba(245, 158, 11, 0.6)' : undefined,
          color: simulated ? '#fbbf24' : '#cbd5e1',
          background: simulated ? 'rgba(245, 158, 11, 0.12)' : undefined,
        }}
      >
        <CalendarClock size={16} />
        <span>{label}{simulated ? ' (simulated)' : ''}</span>
      </button>

      {open && (
        <div
          className="glass-container"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '345px',
            padding: '1.15rem',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            background: 'linear-gradient(165deg, rgba(8, 22, 15, 0.98) 0%, rgba(5, 14, 10, 0.99) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.38)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.12)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Date Navigator (Expiry & SMS Tester)</strong>
            <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.4 }}>
            Change the system date to simulate approaching or reaching a franchise's expiration date. SMS notifications are sent <strong>30, 7, and 1 day(s)</strong> before expiration and on the <strong>expiration date</strong> (which also unlocks Franchise Renewal).
          </span>

          <input
            type="date"
            className="glass-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            disabled={busy}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
            {[
              { label: '+1d', days: 1 },
              { label: '+7d', days: 7 },
              { label: '+30d', days: 30 },
              { label: '+1y', days: 365 },
            ].map(step => (
              <button
                key={step.label}
                type="button"
                className="btn-glass"
                disabled={busy}
                style={{ padding: '0.35rem 0', fontSize: '0.75rem' }}
                onClick={() => void apply(daysFromToday(step.days))}
              >
                {step.label}
              </button>
            ))}
          </div>

          {primaryExpiry && primaryFranchise && (
            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <BellRing size={13} /> Jump to {primaryFranchise.mtopNumber} ({primaryFranchise.plateNumber}) Expiry:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void apply(offsetDateStr(primaryExpiry, -7))}
                  className="btn-glass"
                  style={{ padding: '0.35rem 0.45rem', fontSize: '0.72rem', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                >
                  7 Days Before ({offsetDateStr(primaryExpiry, -7)})
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void apply(offsetDateStr(primaryExpiry, -1))}
                  className="btn-glass"
                  style={{ padding: '0.35rem 0.45rem', fontSize: '0.72rem', color: '#fb923c', borderColor: 'rgba(249, 115, 22, 0.4)' }}
                >
                  1 Day Before ({offsetDateStr(primaryExpiry, -1)})
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void apply(offsetDateStr(primaryExpiry, 1))}
                  className="btn-glass"
                  style={{ gridColumn: '1 / -1', padding: '0.4rem 0.5rem', fontSize: '0.74rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.45)', background: 'rgba(239, 68, 68, 0.12)', fontWeight: 700 }}
                >
                  Expired Date ({offsetDateStr(primaryExpiry, 1)}) — Trigger SMS & Unlock Renewal
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-glass btn-primary-glass"
              disabled={busy || !draft}
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
              onClick={() => void apply(draft)}
            >
              {busy ? <Loader2 size={14} className="spin-icon" /> : 'Apply Date'}
            </button>
            <button
              type="button"
              className="btn-glass"
              disabled={busy || !simulated}
              style={{ padding: '0.5rem 0.7rem', fontSize: '0.8rem' }}
              onClick={() => void apply(null)}
              title="Back to the real date"
            >
              <RotateCcw size={14} /> Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
