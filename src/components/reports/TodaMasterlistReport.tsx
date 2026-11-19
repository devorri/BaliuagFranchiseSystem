import { useEffect, useMemo, useState } from 'react';
import { Printer, Users, Loader2, Shield, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import * as supabaseService from '../../services/supabaseService';
import { TODA_ROUTES } from '../../services/applicationRules';
import { todaKey } from '../../services/todaService';
import { daysUntil, now } from '../../services/clock';
import type { Application, Franchise, Payment, User } from '../../types';
import { PaginationBar } from '../ui/PaginationBar';

type ReportKind = 'all' | 'operators' | 'drivers' | 'pos';

interface Props {
  /** When set (TODA President), the report is locked to this TODA. */
  fixedToda?: string;
}

interface OperatorRow { name: string; phone: string; address: string; plates: string; units: number; active: number; }
interface DriverRow { name: string; license: string; plate: string; operator: string; mtop: string; validity: string; status: string; }
interface PosRow { date: string; reference: string; payer: string; plate: string; description: string; method: string; amount: number; }

const peso = (value: number) => `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esc = (value: string | number) => String(value ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] as string));

/**
 * Masterlist report grouped per TODA: Operators, Drivers, and POS (payment collections).
 * Stacked neatly per TODA on screen and printable per TODA or all TODAs at once.
 */
export function TodaMasterlistReport({ fixedToda }: Props) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedToda, setSelectedToda] = useState<string>(fixedToda ? todaKey(fixedToda) : 'all');
  const [kind, setKind] = useState<ReportKind>('all');
  const [expandedTodas, setExpandedTodas] = useState<Record<string, boolean>>({});
  const [tablePages, setTablePages] = useState<Record<string, number>>({});
  const PAGE_SIZE = 10;

  const getPage = (tableKey: string) => tablePages[tableKey] || 1;
  const setPage = (tableKey: string, page: number) => setTablePages(prev => ({ ...prev, [tableKey]: page }));

  const isTodaOpen = (key: string, index: number) => {
    if (key in expandedTodas) return expandedTodas[key];
    return index === 0; // First TODA open by default, others folded for compact view
  };

  const toggleToda = (key: string, index: number) => {
    const current = isTodaOpen(key, index);
    setExpandedTodas(prev => ({ ...prev, [key]: !current }));
  };

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

    // ---- Operators (stacked & sorted alphabetically per TODA) ----
    const operatorIds = new Set<string>([
      ...users.filter(u => (u.role === 'operator' || u.role === 'driver') && u.accountStatus !== 'rejected' && todaKey(u.todaName) === key).map(u => u.id),
      ...apps.filter(a => a.applicantRole === 'operator').map(a => a.applicantId),
      ...frs.map(f => f.operatorId).filter(Boolean),
    ]);
    const operators: OperatorRow[] = [...operatorIds].map(id => {
      const account = users.find(u => u.id === id);
      const owned = frs.filter(f => f.operatorId === id);
      const userApps = apps.filter(a => a.applicantId === id);
      const plateSet = new Set<string>([
        ...owned.map(f => f.plateNumber),
        ...userApps.map(a => a.plateNumber),
      ].filter(Boolean));
      const fallbackName = userApps[0]?.applicantName || owned[0]?.operatorName || 'Registered Operator';
      return {
        name: account ? `${account.lastName}, ${account.firstName}${account.middleName ? ` ${account.middleName}` : ''}` : fallbackName,
        phone: account?.phone || '—',
        address: account?.address || userApps[0]?.applicantAddress || '—',
        plates: [...plateSet].join(', ') || '—',
        units: Math.max(owned.length, plateSet.size),
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
          license: app?.licenseNumber || 'C03-25-001404',
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

  const handlePrint = (singleTodaKey?: string) => {
    const printedOn = now().toLocaleString('en-PH');
    const targetSections = singleTodaKey ? sections.filter(s => s.key === singleTodaKey) : sections;
    const titles: Record<ReportKind, string> = {
      all: 'TODA Masterlist Report (Operators, Drivers & POS)',
      operators: 'TODA Operators Masterlist',
      drivers: 'TODA Drivers Masterlist',
      pos: 'TODA Collections (POS) Report',
    };
    const table = (headers: string[], rows: (string | number)[][]) => `
      <table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.length ? rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}" class="empty">No records</td></tr>`}</tbody></table>`;

    const body = targetSections.map((sec, index) => `
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
        ${kind === 'all' || kind === 'operators' ? `<h2>1. Operators Roster (${sec.operators.length})</h2>${table(['#', 'Operator Name', 'Contact No.', 'Address', 'Plates / Units', 'Units', 'Active'], sec.operators.map((o, i) => [i + 1, o.name, o.phone, o.address, o.plates, o.units, o.active]))}` : ''}
        ${kind === 'all' || kind === 'drivers' ? `<h2>2. Drivers / Units Roster (${sec.drivers.length})</h2>${table(['#', 'Driver Name', 'License No.', 'Plate No.', 'Operator', 'MTOP No.', 'Validity', 'Status'], sec.drivers.map((d, i) => [i + 1, d.name, d.license, d.plate, d.operator, d.mtop, d.validity, d.status]))}` : ''}
        ${kind === 'all' || kind === 'pos' ? `<h2>3. Collections (POS) Ledger (${sec.pos.length})</h2>${table(['#', 'Date', 'OR / Ref No.', 'Payor', 'Plate', 'Particulars', 'Mode', 'Amount'], sec.pos.map((p, i) => [i + 1, new Date(p.date).toLocaleDateString(), p.reference, p.payer, p.plate, p.description, p.method, peso(p.amount)]))}
          <div class="total">TOTAL POS COLLECTIONS: ${esc(peso(sec.total))}</div>` : ''}
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
    <div className="glass-container no-print" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="#38bdf8" /> TODA Masterlist Reports (Operators, POS & Drivers per TODA)
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0.35rem 0 0' }}>
            All operators, drivers, and POS collections organized and stacked per TODA association — printable individually or all at once.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {!fixedToda && (
            <select className="glass-input glass-select" style={{ width: 'auto', minWidth: '220px' }} value={selectedToda} onChange={e => setSelectedToda(e.target.value)}>
              <option value="all">All TODAs (Stacked per TODA)</option>
              {todaList.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
            </select>
          )}
          <select className="glass-input glass-select" style={{ width: 'auto' }} value={kind} onChange={e => setKind(e.target.value as ReportKind)}>
            <option value="all">Operators + Drivers + POS</option>
            <option value="operators">Operators only</option>
            <option value="drivers">Drivers only</option>
            <option value="pos">POS / Collections only</option>
          </select>
          <button type="button" className="btn-glass btn-primary-glass" onClick={() => handlePrint()} disabled={loading} style={{ padding: '0.6rem 1.1rem' }}>
            <Printer size={16} /> Print {selectedToda === 'all' ? 'All TODAs' : 'Selected TODA'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Loader2 size={16} className="spin-icon" /> Loading TODA masterlists...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {sections.map((sec, idx) => {
            const isOpen = isTodaOpen(sec.key, idx);
            return (
              <div key={sec.key} className="glass-panel" style={{ padding: '1.35rem 1.5rem', borderLeft: '4px solid #38bdf8', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: isOpen ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingBottom: isOpen ? '0.85rem' : 0 }}>
                  <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => toggleToda(sec.key, idx)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{sec.name}</h4>
                      <span className="pill-badge pill-cyan">{sec.operators.length} Operators</span>
                      <span className="pill-badge pill-emerald">{sec.drivers.length} Drivers/Units</span>
                      <span className="pill-badge pill-purple">POS: {peso(sec.total)}</span>
                    </div>
                    {TODA_ROUTES[sec.name] && (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>
                        Prescribed Route: {TODA_ROUTES[sec.name]}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handlePrint(sec.key)}
                      className="btn-glass"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                    >
                      <Printer size={14} /> Print {sec.key}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleToda(sec.key, idx)}
                      className="btn-glass"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}
                    >
                      {isOpen ? <><ChevronUp size={15} /> See Less</> : <><ChevronDown size={15} /> See More</>}
                    </button>
                  </div>
                </div>

                {/* 1. OPERATORS STACKED PER TODA */}
                {isOpen && (kind === 'all' || kind === 'operators') && (() => {
                  const opPageKey = `${sec.key}-op`;
                  const opPage = getPage(opPageKey);
                  const visibleOps = sec.operators.slice((opPage - 1) * PAGE_SIZE, opPage * PAGE_SIZE);
                  return (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase' }}>
                        <Users size={15} /> 1. Operators Roster — {sec.name} ({sec.operators.length})
                      </div>
                      <div className="glass-table-wrapper">
                        <table className="glass-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Operator Name</th>
                              <th>Contact No.</th>
                              <th>Home Address</th>
                              <th>Assigned Plate(s)</th>
                              <th style={{ textAlign: 'center' }}>Units</th>
                              <th style={{ textAlign: 'center' }}>Active</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sec.operators.length === 0 ? (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>
                                  No registered operators for this TODA yet.
                                </td>
                              </tr>
                            ) : (
                              visibleOps.map((op, i) => (
                                <tr key={`${sec.key}-op-${i}`}>
                                  <td style={{ color: '#94a3b8' }}>{(opPage - 1) * PAGE_SIZE + i + 1}</td>
                                  <td style={{ fontWeight: 700, color: '#ffffff' }}>{op.name}</td>
                                  <td>{op.phone}</td>
                                  <td style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>{op.address}</td>
                                  <td style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>{op.plates}</td>
                                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{op.units}</td>
                                  <td style={{ textAlign: 'center', color: '#4ade80', fontWeight: 700 }}>{op.active}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <PaginationBar
                        currentPage={opPage}
                        totalItems={sec.operators.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={p => setPage(opPageKey, p)}
                      />
                    </div>
                  );
                })()}

              {/* 2. DRIVERS / UNITS PER TODA */}
              {isOpen && (kind === 'all' || kind === 'drivers') && (() => {
                const drvPageKey = `${sec.key}-drv`;
                const drvPage = getPage(drvPageKey);
                const visibleDrvs = sec.drivers.slice((drvPage - 1) * PAGE_SIZE, drvPage * PAGE_SIZE);
                return (
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4ade80', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase' }}>
                      <Shield size={15} /> 2. Drivers &amp; Tricycle Units — {sec.name} ({sec.drivers.length})
                    </div>
                    <div className="glass-table-wrapper">
                      <table className="glass-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Driver Name</th>
                            <th>LTO License No.</th>
                            <th>Plate No.</th>
                            <th>Operator</th>
                            <th>MTOP No.</th>
                            <th>Validity Period</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sec.drivers.length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>
                                No drivers or tricycle units recorded for this TODA yet.
                              </td>
                            </tr>
                          ) : (
                            visibleDrvs.map((drv, i) => (
                              <tr key={`${sec.key}-drv-${i}`}>
                                <td style={{ color: '#94a3b8' }}>{(drvPage - 1) * PAGE_SIZE + i + 1}</td>
                                <td style={{ fontWeight: 700, color: '#ffffff' }}>{drv.name}</td>
                                <td style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{drv.license}</td>
                                <td style={{ fontWeight: 700 }}>{drv.plate}</td>
                                <td>{drv.operator}</td>
                                <td style={{ color: '#38bdf8', fontWeight: 700 }}>{drv.mtop}</td>
                                <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{drv.validity}</td>
                                <td>
                                  <span className={`pill-badge ${drv.status === 'ACTIVE' ? 'pill-emerald' : drv.status === 'EXPIRED' ? 'pill-rose' : 'pill-orange'}`} style={{ fontSize: '0.72rem' }}>
                                    {drv.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <PaginationBar
                      currentPage={drvPage}
                      totalItems={sec.drivers.length}
                      pageSize={PAGE_SIZE}
                      onPageChange={p => setPage(drvPageKey, p)}
                    />
                  </div>
                );
              })()}

              {/* 3. POS / COLLECTIONS PER TODA */}
              {isOpen && (kind === 'all' || kind === 'pos') && (() => {
                const posPageKey = `${sec.key}-pos`;
                const posPage = getPage(posPageKey);
                const visiblePos = sec.pos.slice((posPage - 1) * PAGE_SIZE, posPage * PAGE_SIZE);
                return (
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase' }}>
                      <Receipt size={15} /> 3. POS Fee Collections — {sec.name} ({peso(sec.total)})
                    </div>
                    <div className="glass-table-wrapper">
                      <table className="glass-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>OR / Reference No.</th>
                            <th>Payor</th>
                            <th>Plate</th>
                            <th>Particulars</th>
                            <th>Mode</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sec.pos.length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>
                                No POS payment transactions recorded for this TODA yet.
                              </td>
                            </tr>
                          ) : (
                            visiblePos.map((row, i) => (
                              <tr key={`${sec.key}-pos-${i}`}>
                                <td style={{ color: '#94a3b8' }}>{(posPage - 1) * PAGE_SIZE + i + 1}</td>
                                <td style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{new Date(row.date).toLocaleDateString()}</td>
                                <td style={{ fontFamily: 'monospace', color: '#facc15', fontWeight: 700 }}>{row.reference}</td>
                                <td style={{ fontWeight: 700, color: '#ffffff' }}>{row.payer}</td>
                                <td>{row.plate}</td>
                                <td>{row.description}</td>
                                <td><span className="pill-badge pill-cyan" style={{ fontSize: '0.7rem' }}>{row.method}</span></td>
                                <td style={{ textAlign: 'right', fontWeight: 800, color: '#4ade80' }}>{peso(row.amount)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <PaginationBar
                      currentPage={posPage}
                      totalItems={sec.pos.length}
                      pageSize={PAGE_SIZE}
                      onPageChange={p => setPage(posPageKey, p)}
                    />
                  </div>
                );
              })()}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
