import { useEffect, useMemo, useState } from 'react';
import { Printer, Users, Loader2 } from 'lucide-react';
import * as supabaseService from '../../services/supabaseService';
import { TODA_ROUTES } from '../../services/applicationRules';
import { todaKey } from '../../services/todaService';
import { daysUntil, now } from '../../services/clock';
import type { Application, Franchise, Payment, User } from '../../types';

type ReportKind = 'all' | 'operators' | 'drivers' | 'pos';

interface Props {
  /** When set (TODA President), the report is locked to this TODA. */
  fixedToda?: string;
}

interface OperatorRow { name: string; phone: string; address: string; units: number; active: number; }
interface DriverRow { name: string; license: string; plate: string; operator: string; mtop: string; validity: string; status: string; }
interface PosRow { date: string; reference: string; payer: string; plate: string; description: string; method: string; amount: number; }

const peso = (value: number) => `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esc = (value: string | number) => String(value ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] as string));

/**
 * Masterlist report grouped per TODA: Operators, Drivers, and POS (payment collections).
 * Every TODA section can be printed on its own or all TODAs at once.
 */
export function TodaMasterlistReport({ fixedToda }: Props) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedToda, setSelectedToda] = useState<string>(fixedToda ? todaKey(fixedToda) : 'all');
  const [kind, setKind] = useState<ReportKind>('all');

  useEffect(() => {
    void Promise.all([
      supabaseService.getUsersAsync(),
      supabaseService.getApplicationsAsync(),
      supabaseService.getFranchisesAsync(),
      supabaseService.getPaymentsAsync(),
    ]).then(([u, a, f, p]) => {
      setUsers(u); setApplications(a); setFranchises(f); setPayments(p);
    }).finally(() => setLoading(false));
  }, []);

  // Known TODAs (official list + any other TODA found in the data)
  const todaList = useMemo(() => {
    const map = new Map<string, string>();
    Object.keys(TODA_ROUTES).forEach(name => map.set(todaKey(name), name));
    [...applications.map(a => a.todaName), ...franchises.map(f => f.todaName), ...users.map(u => u.todaName || '')]
      .filter(Boolean)
      .forEach(name => { const key = todaKey(name); if (key && !map.has(key)) map.set(key, name); });
    return [...map.entries()].map(([key, name]) => ({ key, name }));
  }, [applications, franchises, users]);

  const buildSection = (key: string) => {
    const apps = applications.filter(a => todaKey(a.todaName) === key && a.status !== 'rejected');
    const frs = franchises.filter(f => todaKey(f.todaName) === key && f.status !== 'available');

    // ---- Operators ----
    const operatorIds = new Set<string>([
      ...users.filter(u => u.role === 'operator' && u.accountStatus === 'approved' && todaKey(u.todaName) === key).map(u => u.id),
      ...apps.filter(a => a.applicantRole === 'operator').map(a => a.applicantId),
      ...frs.map(f => f.operatorId).filter(Boolean),
    ]);
    const operators: OperatorRow[] = [...operatorIds].map(id => {
      const account = users.find(u => u.id === id);
      const owned = frs.filter(f => f.operatorId === id);
      const fallbackName = apps.find(a => a.applicantId === id)?.applicantName || owned[0]?.operatorName || 'Unknown operator';
      return {
        name: account ? `${account.lastName}, ${account.firstName}${account.middleName ? ` ${account.middleName.charAt(0)}.` : ''}` : fallbackName,
        phone: account?.phone || '—',
        address: account?.address || apps.find(a => a.applicantId === id)?.applicantAddress || '—',
        units: owned.length,
        active: owned.filter(f => daysUntil(f.endDate || f.expiresAt) >= 0).length,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // ---- Drivers (one row per unit; includes applicants still in process) ----
    const drivers: DriverRow[] = [
      ...frs.map(f => {
        const app = applications.find(a => a.id === f.applicationId);
        const left = daysUntil(f.endDate || f.expiresAt);
        return {
          name: f.driverName || '—',
          license: app?.licenseNumber || '—',
          plate: f.plateNumber,
          operator: f.operatorName,
          mtop: f.mtopNumber,
          validity: `${new Date(f.startDate || f.issuedAt).toLocaleDateString()} – ${new Date(f.endDate || f.expiresAt).toLocaleDateString()}`,
          status: left < 0 ? 'EXPIRED' : left <= 30 ? `EXPIRING (${left}d)` : 'ACTIVE',
        };
      }),
      ...apps
        .filter(a => a.status !== 'approved' && !frs.some(f => f.plateNumber === a.plateNumber))
        .map(a => ({
          name: a.driverName || a.applicantName,
          license: a.licenseNumber || '—',
          plate: a.plateNumber,
          operator: a.applicantName,
          mtop: '—',
          validity: '—',
          status: 'IN PROCESS',
        })),
    ].sort((a, b) => a.name.localeCompare(b.name));

    // ---- POS / Collections ----
    const appIds = new Set(apps.map(a => a.id));
    const ledgerRefs = new Set<string>();
    const pos: PosRow[] = [];
    payments
      .filter(p => p.status === 'completed' && appIds.has(p.applicationId))
      .forEach(p => {
        const app = apps.find(a => a.id === p.applicationId);
        ledgerRefs.add(p.referenceNumber);
        pos.push({
          date: p.paidAt || p.createdAt,
          reference: p.referenceNumber,
          payer: p.payerName,
          plate: app?.plateNumber || '—',
          description: app?.type === 'renewal' ? 'MTOP Renewal Fee' : 'MTOP Franchise Fee',
          method: p.paymentMethod.toUpperCase(),
          amount: p.amount,
        });
      });
    apps
      .filter(a => a.treasurerPayment?.paid && !ledgerRefs.has(a.treasurerPayment.orNumber))
      .forEach(a => pos.push({
        date: a.treasurerPayment!.paidAt || a.updatedAt,
        reference: a.treasurerPayment!.orNumber,
        payer: a.applicantName,
        plate: a.plateNumber,
        description: a.type === 'renewal' ? 'MTOP Renewal Fee' : 'MTOP Franchise Fee',
        method: (a.treasurerPayment!.paymentMethod || 'cash').toUpperCase(),
        amount: a.treasurerPayment!.amount,
      }));
    pos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { operators, drivers, pos, total: pos.reduce((sum, row) => sum + row.amount, 0) };
  };

  const visibleTodas = todaList.filter(t => selectedToda === 'all' || t.key === selectedToda);
  const sections = visibleTodas.map(t => ({ ...t, ...buildSection(t.key) }));

  const handlePrint = () => {
    const printedOn = now().toLocaleString('en-PH');
    const titles: Record<ReportKind, string> = {
      all: 'TODA Masterlist Report',
      operators: 'TODA Operators Masterlist',
      drivers: 'TODA Drivers Masterlist',
      pos: 'TODA Collections (POS) Report',
    };
    const table = (headers: string[], rows: (string | number)[][]) => `
      <table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.length ? rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}" class="empty">No records</td></tr>`}</tbody></table>`;

    const body = sections.map((sec, index) => `
      <section class="${index > 0 ? 'page-break' : ''}">
        <div class="head">
          <img src="${window.location.origin}/baliuag-logo.png" alt="" />
          <div>
            <div class="lgu">CITY GOVERNMENT OF BALIWAG</div>
            <div class="office">Tricycle Franchising &amp; Regulatory Office</div>
            <h1>${esc(titles[kind])}</h1>
            <div class="toda">${esc(sec.name)}${TODA_ROUTES[sec.name] ? ` — Route: ${esc(TODA_ROUTES[sec.name])}` : ''}</div>
          </div>
        </div>
        <div class="meta">Printed: ${esc(printedOn)} &nbsp;|&nbsp; Operators: ${sec.operators.length} &nbsp;|&nbsp; Drivers/Units: ${sec.drivers.length} &nbsp;|&nbsp; Collections: ${esc(peso(sec.total))}</div>
        ${kind === 'all' || kind === 'operators' ? `<h2>Operators</h2>${table(['#', 'Operator Name', 'Contact No.', 'Address', 'Units', 'Active'], sec.operators.map((o, i) => [i + 1, o.name, o.phone, o.address, o.units, o.active]))}` : ''}
        ${kind === 'all' || kind === 'drivers' ? `<h2>Drivers / Units</h2>${table(['#', 'Driver Name', 'License No.', 'Plate No.', 'Operator', 'MTOP No.', 'Validity', 'Status'], sec.drivers.map((d, i) => [i + 1, d.name, d.license, d.plate, d.operator, d.mtop, d.validity, d.status]))}` : ''}
        ${kind === 'all' || kind === 'pos' ? `<h2>Collections (POS)</h2>${table(['#', 'Date', 'OR / Ref No.', 'Payor', 'Plate', 'Particulars', 'Mode', 'Amount'], sec.pos.map((p, i) => [i + 1, new Date(p.date).toLocaleDateString(), p.reference, p.payer, p.plate, p.description, p.method, peso(p.amount)]))}
          <div class="total">TOTAL COLLECTIONS: ${esc(peso(sec.total))}</div>` : ''}
        <div class="sign">
          <div><div class="line"></div>Prepared by</div>
          <div><div class="line"></div>TODA President</div>
          <div><div class="line"></div>Head, Franchising Office</div>
        </div>
      </section>`).join('');

    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${esc(titles[kind])}</title>
      <style>
        @page { size: A4 landscape; margin: 14mm; }
        body { font-family: 'Times New Roman', Georgia, serif; color: #111; margin: 0; }
        .head { display: flex; gap: 14px; align-items: center; border-bottom: 2px solid #111; padding-bottom: 8px; }
        .head img { height: 64px; }
        .lgu { font-weight: bold; font-size: 15px; }
        .office { font-size: 12px; }
        h1 { font-size: 19px; margin: 4px 0 2px; text-transform: uppercase; }
        .toda { font-size: 13px; font-weight: bold; }
        .meta { font-size: 11px; margin: 8px 0 4px; }
        h2 { font-size: 14px; margin: 14px 0 6px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #444; padding: 4px 6px; text-align: left; }
        th { background: #eee; }
        .empty { text-align: center; color: #666; font-style: italic; }
        .total { text-align: right; font-weight: bold; margin-top: 6px; font-size: 12px; }
        .sign { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; text-align: center; }
        .sign > div { width: 30%; }
        .line { border-top: 1px solid #111; margin-bottom: 4px; height: 1px; }
        .page-break { page-break-before: always; }
      </style></head><body>${body || '<p>No TODA data.</p>'}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div className="glass-container no-print" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="#38bdf8" /> TODA Masterlist Reports
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0.35rem 0 0' }}>
            Operators, drivers and POS collections arranged per TODA — printable per TODA.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {!fixedToda && (
            <select className="glass-input glass-select" style={{ width: 'auto', minWidth: '220px' }} value={selectedToda} onChange={e => setSelectedToda(e.target.value)}>
              <option value="all">All TODAs (one page each)</option>
              {todaList.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
            </select>
          )}
          <select className="glass-input glass-select" style={{ width: 'auto' }} value={kind} onChange={e => setKind(e.target.value as ReportKind)}>
            <option value="all">Operators + Drivers + POS</option>
            <option value="operators">Operators only</option>
            <option value="drivers">Drivers only</option>
            <option value="pos">POS / Collections only</option>
          </select>
          <button type="button" className="btn-glass btn-primary-glass" onClick={handlePrint} disabled={loading} style={{ padding: '0.6rem 1.1rem' }}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Loader2 size={16} className="spin-icon" /> Loading TODA records...
        </div>
      ) : (
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>TODA</th>
                <th style={{ textAlign: 'center' }}>Operators</th>
                <th style={{ textAlign: 'center' }}>Drivers / Units</th>
                <th style={{ textAlign: 'center' }}>Expired Units</th>
                <th style={{ textAlign: 'right' }}>POS Collections</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(sec => (
                <tr key={sec.key}>
                  <td><strong style={{ color: '#f8fafc' }}>{sec.name}</strong></td>
                  <td style={{ textAlign: 'center' }}>{sec.operators.length}</td>
                  <td style={{ textAlign: 'center' }}>{sec.drivers.length}</td>
                  <td style={{ textAlign: 'center', color: '#f87171' }}>{sec.drivers.filter(d => d.status === 'EXPIRED').length}</td>
                  <td style={{ textAlign: 'right', color: '#4ade80', fontWeight: 700 }}>{peso(sec.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
