import { useState } from 'react';
import { CalendarClock, Loader2, RotateCcw } from 'lucide-react';
import * as supabaseService from '../../services/supabaseService';
import { daysFromToday, isSimulated, now, setSystemDate, todayStr } from '../../services/clock';

/**
 * Date Navigator — moves the system date (not the PC clock) so the panel can
 * jump to a franchise's expiration date and see the SMS expiry reminders,
 * expired status, and renewal unlock happen.
 */
export function DateNavigator() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(todayStr());
  const simulated = isSimulated();

  const apply = async (dateStr: string | null) => {
    setBusy(true);
    setSystemDate(dateStr);
    try {
      // Re-run expiry checks on the new date so SMS reminders are generated right away
      await supabaseService.processFranchiseLifecycleAsync();
    } catch (err) {
      console.warn('Lifecycle check after date change failed:', err);
    } finally {
      window.location.reload();
    }
  };

  const label = now().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => { setDraft(todayStr()); setOpen(!open); }}
        className="btn-glass"
        title="Date Navigator — change the system date"
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
          style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '290px', padding: '1rem', zIndex: 60, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
        >
          <strong style={{ color: '#f8fafc', fontSize: '0.92rem' }}>Date Navigator</strong>
          <span style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.4 }}>
            Change the system date to test expiration. SMS reminders are sent 30, 7 and 1 day(s) before a franchise expires, and renewal unlocks once it has expired.
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
