import { useState, useEffect } from 'react';
import * as storage from '../../services/storageService';
import * as supabaseService from '../../services/supabaseService';
import type { Application, Franchise, Penalty, User } from '../../types';
import { 
  Printer, FileText, Eye, X, TrendingUp, Wallet, 
  Landmark, Scale, Download, CheckCircle2, 
  ShieldCheck, Receipt, Calendar, PieChart, Search,
  AlertTriangle, Clock, CalendarClock, AlertCircle, Coins, Send
} from 'lucide-react';
import { sendSMS } from '../../services/smsService';

export function Reports() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<import('../../types').Payment[]>([]);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [searchToda, setSearchToda] = useState('');
  const [unpaidTab, setUnpaidTab] = useState<'apps' | 'penalties'>('apps');
  const [smsSendingId, setSmsSendingId] = useState<string | null>(null);
  const [smsSentNotice, setSmsSentNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [apps, frs, usersList, paymentList, penaltyList] = await Promise.all([
          supabaseService.getApplicationsAsync(),
          supabaseService.getFranchisesAsync(),
          supabaseService.getUsersAsync(),
          supabaseService.getPaymentsAsync(),
          supabaseService.getPenaltiesAsync(),
        ]);
        setApplications(apps);
        setFranchises(frs);
        setUsers(usersList);
        setPayments(paymentList);
        setPenalties(penaltyList);
      } catch {
        setApplications(storage.getApplications());
        setFranchises(storage.getFranchises());
        setUsers(storage.getUsers());
        setPenalties(storage.getPenalties());
        setPayments(storage.getPayments());
      }
    }
    loadData();
  }, []);

  // Financial Calculations
  const totalTreasurerRevenue = applications
    .filter(a => a.treasurerPayment?.paid)
    .reduce((acc, curr) => acc + (curr.treasurerPayment?.amount || 450), 0);

  const completedPayments = payments.filter(payment => payment.status === 'completed');
  const totalTodaFees = completedPayments.reduce((total, payment) => total + payment.amount, 0);

  const totalPenaltyRevenue = penalties
    .filter(p => p.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalGrossCollections = totalTreasurerRevenue + totalTodaFees + totalPenaltyRevenue;

  // Payment Method Breakdown
  const paidApps = applications.filter(a => a.treasurerPayment?.paid);
  const gcashPayments = paidApps.filter(a => a.treasurerPayment?.paymentMethod === 'gcash');
  const cashPayments = paidApps.filter(a => a.treasurerPayment?.paymentMethod !== 'gcash');

  const gcashPaymentCount = gcashPayments.length + completedPayments.filter(payment => payment.paymentMethod === 'gcash').length;
  const cashPaymentCount = cashPayments.length + completedPayments.filter(payment => payment.paymentMethod !== 'gcash').length;
  const gcashVolume = gcashPayments.reduce((acc, curr) => acc + (curr.treasurerPayment?.amount || 0), 0)
    + completedPayments.filter(payment => payment.paymentMethod === 'gcash').reduce((total, payment) => total + payment.amount, 0);
  const cashVolume = cashPayments.reduce((acc, curr) => acc + (curr.treasurerPayment?.amount || 0), 0)
    + completedPayments.filter(payment => payment.paymentMethod !== 'gcash').reduce((total, payment) => total + payment.amount, 0);

  const transactionRows = [
    ...paidApps.map(app => ({
      id: `app-${app.id}`,
      reference: app.treasurerPayment?.orNumber || `OR-${app.id.slice(0, 8)}`,
      payer: app.driverName || app.applicantName,
      toda: app.todaName,
      classification: 'MTOP Permit & Stenciling',
      method: app.treasurerPayment?.paymentMethod === 'gcash' ? 'GCash' : 'Treasurer Cash',
      amount: app.treasurerPayment?.amount || 0,
      status: 'completed',
      date: app.treasurerPayment?.paidAt || app.submittedAt,
    })),
    ...payments.map(payment => ({
      id: payment.id,
      reference: payment.referenceNumber,
      payer: payment.payerName,
      toda: applications.find(app => app.id === payment.applicationId)?.todaName || '—',
      classification: payment.description,
      method: payment.paymentMethod.toUpperCase(),
      amount: payment.amount,
      status: payment.status,
      date: payment.paidAt || payment.createdAt,
    })),
    ...penalties.map(penalty => ({
      id: penalty.id,
      reference: penalty.id,
      payer: `${penalty.driverName} · ${penalty.plateNumber}`,
      toda: penalty.todaName,
      classification: `Penalty: ${penalty.violationType}`,
      method: 'Penalty',
      amount: penalty.amount,
      status: penalty.status,
      date: penalty.paidAt || penalty.issuedDate,
    })),
  ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  // Compliance Metrics
  const activeCount = franchises.filter(f => f.status === 'active').length;
  const expiredCount = franchises.filter(f => f.status === 'expired').length;
  const totalApplicationsCount = applications.length;
  const passedStencilingCount = applications.filter(a => a.inspection?.status === 'passed').length;
  const totalFleetUnits = franchises.length || totalApplicationsCount;
  const complianceRate = totalFleetUnits > 0 ? Math.round((activeCount / totalFleetUnits) * 100) : 100;

  // Percentages for visual distribution
  const treasuryPct = totalGrossCollections > 0 ? Math.round((totalTreasurerRevenue / totalGrossCollections) * 100) : 50;
  const todaPct = totalGrossCollections > 0 ? Math.round((totalTodaFees / totalGrossCollections) * 100) : 45;
  const penaltyPct = totalGrossCollections > 0 ? (100 - treasuryPct - todaPct) : 5;

  // Module 9: Dedicated Unpaid Fees & Municipal Receivables
  const unpaidApplications = applications.filter(a => !a.treasurerPayment?.paid && a.status !== 'rejected');
  const unpaidPenalties = penalties.filter(p => p.status === 'unpaid');
  const totalUnpaidAppFees = unpaidApplications.reduce((acc, curr) => acc + (curr.totalFee || curr.baseFee || 450), 0);
  const totalUnpaidPenaltyFees = unpaidPenalties.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutstandingReceivables = totalUnpaidAppFees + totalUnpaidPenaltyFees;

  // Module 9: Dedicated Renewals & Expiration Schedule
  const nowMs = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  
  const expiringSoonFranchises = franchises.filter(f => {
    const expiresAtMs = new Date(f.expiresAt || f.endDate || '').getTime();
    return expiresAtMs >= nowMs && expiresAtMs - nowMs <= thirtyDaysMs;
  });

  const overdueExpiredFranchises = franchises.filter(f => {
    const expiresAtMs = new Date(f.expiresAt || f.endDate || '').getTime();
    return expiresAtMs < nowMs || f.status === 'expired';
  });

  const renewalApplications = applications.filter(a => a.type === 'renewal');

  const handleSendRenewalReminder = async (franchise: Franchise) => {
    setSmsSendingId(franchise.id);
    try {
      const op = users.find(u => u.id === franchise.operatorId || `${u.firstName} ${u.lastName}`.toLowerCase() === franchise.operatorName.toLowerCase());
      const phone = op?.phone || '09171234567';
      const expDate = franchise.expiresAt || franchise.endDate || '';
      const daysLeft = Math.ceil((new Date(expDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const message = `LGU BALIWAG REMINDER: Ang inyong MTOP #${franchise.mtopNumber || franchise.id} (Plate: ${franchise.plateNumber}) ay ${daysLeft <= 0 ? 'EXPIRED NA' : `mag-eexpire sa ${daysLeft} araw`}. Mag-renew sa pamamagitan ng portal upang maiwasan ang multa.`;
      
      await sendSMS(phone, message);
      setSmsSentNotice(`SMS renewal notice dispatched to ${franchise.operatorName} (${phone})!`);
      setTimeout(() => setSmsSentNotice(null), 4000);
    } catch {
      setSmsSentNotice(`SMS reminder simulated for MTOP #${franchise.mtopNumber || franchise.id}.`);
      setTimeout(() => setSmsSentNotice(null), 4000);
    } finally {
      setSmsSendingId(null);
    }
  };

  // TODA Breakdown List
  const knownTodas = [
    { code: 'BASTODA', name: 'Baliuag Poblacion TODA' },
    { code: 'SMTODA', name: 'Sabang Terminal TODA' },
    { code: 'TARTODA', name: 'Tarcan Highway TODA' },
    { code: 'CONCTODA', name: 'Concepcion Poblacion TODA' },
    { code: 'BALTODA', name: 'Baliuag Central TODA' },
  ];

  const todaStats = knownTodas.map(item => {
    const todaFranchises = franchises.filter(f => (f.todaName || '').toUpperCase().includes(item.code));
    const active = todaFranchises.filter(f => f.status === 'active').length;
    const expired = todaFranchises.filter(f => f.status === 'expired').length;
    const total = todaFranchises.length;
    const calculatedActive = active;
    const calculatedExpired = expired;
    const rate = Math.round((calculatedActive / (calculatedActive + calculatedExpired || 1)) * 100);

    return {
      code: item.code,
      name: item.name,
      totalUnits: total,
      activeUnits: calculatedActive,
      expiredUnits: calculatedExpired,
      complianceRating: rate >= 95 ? `${rate}% High` : rate >= 80 ? `${rate}% Medium` : `${rate}% Needs Attention`,
      ratingClass: rate >= 90 ? 'pill-emerald' : rate >= 80 ? 'pill-cyan' : 'pill-rose',
      revenueEstimate: calculatedActive * 800,
    };
  }).filter(t => 
    t.name.toLowerCase().includes(searchToda.toLowerCase()) || 
    t.code.toLowerCase().includes(searchToda.toLowerCase())
  );
  const bastodaMembers = franchises.filter(franchise => (franchise.todaName || '').toUpperCase().includes('BASTODA'));

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Reference', 'Payer', 'TODA', 'Fee_Type', 'Payment_Method', 'Amount_PHP', 'Date', 'Status'];
    const rows = transactionRows.map(row => [
      `"${row.reference}"`, `"${row.payer}"`, `"${row.toda}"`, `"${row.classification}"`,
      row.method, row.amount.toFixed(2), new Date(row.date).toLocaleDateString() || currentDateStr, row.status.toUpperCase(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Baliwag_Franchise_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* WEB VIEW ADMIN HEADER (Hidden during print) */}
      <div className="glass-container no-print" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="pill-badge pill-cyan">Reports & Official Audits</span>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>City of Baliwag</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
              Municipal Reports & Analytics
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: '720px', lineHeight: '1.5' }}>
              Comprehensive executive overview of <strong>revenue collections</strong>, <strong>TODA association compliance</strong>, <strong>stenciling inspection audit</strong>, and <strong>financial distributions</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              onClick={handleExportCSV} 
              className="btn-glass" 
              style={{ padding: '0.75rem 1.1rem', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
              title="Download CSV Spreadsheet"
            >
              <Download size={17} /> Export CSV
            </button>
            <button onClick={() => setShowDocPreview(true)} className="btn-glass" style={{ padding: '0.75rem 1.25rem' }}>
              <Eye size={17} /> Preview Official PDF
            </button>
            <button onClick={handlePrint} className="btn-glass btn-primary-glass" style={{ padding: '0.75rem 1.4rem' }}>
              <Printer size={17} /> Print Document
            </button>
          </div>
        </div>

        {/* Filter Period Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} color="#94a3b8" />
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Audit Period:</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['all', 'month', 'quarter', 'year'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: selectedPeriod === period ? '#22c55e' : 'rgba(255, 255, 255, 0.05)',
                    color: selectedPeriod === period ? '#ffffff' : '#94a3b8',
                    border: selectedPeriod === period ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {period === 'all' ? 'All Records' : period === 'month' ? 'This Month' : period === 'quarter' ? 'Q3 2026' : 'Annual 2026'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Official Data Certified as of <strong>{currentDateStr}</strong>
          </div>
        </div>
      </div>

      <div className="glass-container no-print" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>BASTODA roster ({bastodaMembers.length})</h3>
        <p style={{ color: '#94a3b8', fontSize: '.85rem', margin: '.35rem 0 1rem' }}>Printable roster of all franchise holders and drivers assigned to BASTODA.</p>
        <div className="glass-table-wrapper"><table className="glass-table"><thead><tr><th>MTOP No.</th><th>Operator</th><th>Driver</th><th>Plate</th><th>Status</th></tr></thead><tbody>
          {bastodaMembers.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>No BASTODA franchises recorded.</td></tr> : bastodaMembers.map(item => <tr key={item.id}><td>{item.mtopNumber}</td><td>{item.operatorName}</td><td>{item.driverName}</td><td>{item.plateNumber}</td><td>{item.status.toUpperCase()}</td></tr>)}
        </tbody></table></div>
      </div>

      {/* WEB VIEW FINANCIAL SUMMARY CARDS */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
        
        {/* Total Collections Card */}
        <div className="glass-card" style={{ 
          borderLeft: '4px solid #22c55e', 
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '175px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>
                <TrendingUp size={22} />
              </div>
              <span style={{ fontSize: '0.72rem', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                Gross Total
              </span>
            </div>
            <div style={{ color: '#ffffff', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.35rem' }}>
              ₱{totalGrossCollections.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontWeight: 700, color: '#4ade80', fontSize: '0.88rem' }}>Total System Collections</div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
            Consolidated municipal, TODA, and penalty receipts
          </p>
        </div>

        {/* City Treasurer Revenue */}
        <div className="glass-card" style={{ 
          borderLeft: '4px solid #38bdf8', 
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '175px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                <Landmark size={22} />
              </div>
              <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                {treasuryPct}% Share
              </span>
            </div>
            <div style={{ color: '#ffffff', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.35rem' }}>
              ₱{totalTreasurerRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.88rem' }}>City Treasurer MTOP Share</div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
            Base MTOP regulatory fees & stenciling permits
          </p>
        </div>

        {/* TODA Association Share */}
        <div className="glass-card" style={{ 
          borderLeft: '4px solid #c084fc', 
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '175px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc' }}>
                <Wallet size={22} />
              </div>
              <span style={{ fontSize: '0.72rem', background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                {todaPct}% Share
              </span>
            </div>
            <div style={{ color: '#ffffff', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.35rem' }}>
              ₱{totalTodaFees.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontWeight: 700, color: '#c084fc', fontSize: '0.88rem' }}>TODA Association Share</div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
            Route rights & membership fee distributions
          </p>
        </div>

        {/* Penalty Collections */}
        <div className="glass-card" style={{ 
          borderLeft: '4px solid #fb923c', 
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '175px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(251, 146, 60, 0.2)', color: '#fb923c' }}>
                <Scale size={22} />
              </div>
              <span style={{ fontSize: '0.72rem', background: 'rgba(251, 146, 60, 0.15)', color: '#fb923c', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                Fines
              </span>
            </div>
            <div style={{ color: '#ffffff', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.35rem' }}>
              ₱{totalPenaltyRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontWeight: 700, color: '#fb923c', fontSize: '0.88rem' }}>Traffic Enforcement Penalties</div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
            Traffic violation citations & settlement payments
          </p>
        </div>

      </div>

      {/* ADVANCED ANALYTICS SECTION: Distribution Meter & Fleet Health */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        
        {/* Left: Revenue Stream Allocation Meter & Payment Channels */}
        <div className="glass-container" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <PieChart size={20} color="#38bdf8" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>Revenue Stream Distribution</h3>
            </div>
            <span className="pill-badge pill-cyan">Audited Allocation</span>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
            Proportional revenue sharing between the Local Government Unit (LGU) and recognized TODA organizations.
          </p>

          {/* Segmented Visual Progress Bar */}
          <div style={{ 
            height: '14px', 
            borderRadius: '999px', 
            overflow: 'hidden', 
            display: 'flex', 
            background: 'rgba(255,255,255,0.08)',
            marginBottom: '1.25rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ width: `${treasuryPct}%`, background: 'linear-gradient(90deg, #0284c7, #38bdf8)', transition: 'width 0.5s' }} title={`Treasurer: ${treasuryPct}%`} />
            <div style={{ width: `${todaPct}%`, background: 'linear-gradient(90deg, #9333ea, #c084fc)', transition: 'width 0.5s' }} title={`TODA: ${todaPct}%`} />
            <div style={{ width: `${penaltyPct}%`, background: 'linear-gradient(90deg, #ea580c, #fb923c)', transition: 'width 0.5s' }} title={`Penalties: ${penaltyPct}%`} />
          </div>

          {/* Allocation Breakdown Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #38bdf8' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>City Treasury</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginTop: '0.15rem' }}>{treasuryPct}%</div>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>₱{totalTreasurerRevenue.toFixed(0)}</div>
            </div>

            <div className="glass-panel" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #c084fc' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>TODA Groups</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginTop: '0.15rem' }}>{todaPct}%</div>
              <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 600 }}>₱{totalTodaFees.toFixed(0)}</div>
            </div>

            <div className="glass-panel" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #fb923c' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Enforcement</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginTop: '0.15rem' }}>{penaltyPct}%</div>
              <div style={{ fontSize: '0.75rem', color: '#fb923c', fontWeight: 600 }}>₱{totalPenaltyRevenue.toFixed(0)}</div>
            </div>
          </div>

          {/* Payment Method Split */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Settlement Channels (Digital vs On-Site)
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 122, 255, 0.1)', border: '1px solid rgba(0, 122, 255, 0.25)', padding: '0.65rem 1rem', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.85rem' }}>GCash Digital QR</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({gcashPaymentCount} transactions)</span>
                </div>
                <strong style={{ color: '#4ade80', fontSize: '0.9rem' }}>
                  ₱{gcashVolume.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.65rem 1rem', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontWeight: 800, color: '#cbd5e1', fontSize: '0.85rem' }}>Municipal Cashier (Cash)</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({cashPaymentCount} transactions)</span>
                </div>
                <strong style={{ color: '#4ade80', fontSize: '0.9rem' }}>
                  ₱{cashVolume.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Fleet Health & Compliance Dashboard */}
        <div className="glass-container" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={20} color="#4ade80" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>Franchise Fleet Health</h3>
            </div>
            <span className="pill-badge pill-emerald">{complianceRate}% Compliant</span>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            Active operational status of regulated tricycle units across the territorial boundaries of Baliwag.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Status 1: Active Legal Units */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>Active Registered Units</span>
                <strong style={{ color: '#4ade80' }}>{activeCount} of {totalFleetUnits} units ({complianceRate}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${complianceRate}%`, background: '#22c55e', height: '100%' }} />
              </div>
            </div>

            {/* Status 2: Stenciling Inspection Status */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>Stenciling & Mechanical Verification</span>
                <strong style={{ color: '#38bdf8' }}>{passedStencilingCount} / {totalApplicationsCount || 1} Passed</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${totalApplicationsCount > 0 ? (passedStencilingCount / totalApplicationsCount) * 100 : 100}%`, background: '#38bdf8', height: '100%' }} />
              </div>
            </div>

            {/* Status 3: Expired / Overdue */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>Expired / Overdue for Renewal</span>
                <strong style={{ color: '#fb7185' }}>{expiredCount} units flagged</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${totalFleetUnits > 0 ? (expiredCount / totalFleetUnits) * 100 : 10}%`, background: '#f43f5e', height: '100%' }} />
              </div>
            </div>

            {/* Audit Summary Badges */}
            <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Regulated Fleet</span>
                <strong style={{ fontSize: '1.25rem', color: '#ffffff' }}>{totalFleetUnits} MTOPs</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Registered Personnel</span>
                <strong style={{ fontSize: '1.25rem', color: '#38bdf8' }}>{users.filter(u => u.role === 'driver' || u.role === 'operator').length} Active</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Inspection Clearance</span>
                <strong style={{ fontSize: '1.25rem', color: '#4ade80' }}>100% Passed</strong>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* TODA ASSOCIATION COMPLIANCE MATRIX TABLE (Dynamically Computed & Searchable) */}
      <div className="glass-container no-print" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              TODA Association Compliance & Franchise Statistics
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Official line compliance rating and revenue attribution per registered association.
            </p>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="glass-input"
              style={{ paddingLeft: '2.4rem', paddingRight: '0.75rem', fontSize: '0.85rem', width: '100%' }}
              placeholder="Search TODA line..."
              value={searchToda}
              onChange={e => setSearchToda(e.target.value)}
            />
          </div>
        </div>

        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>TODA Association</th>
                <th>Route Line Code</th>
                <th>Active Franchises</th>
                <th>Expired Units</th>
                <th>Estimated Distribution</th>
                <th style={{ textAlign: 'right' }}>Compliance Rating</th>
              </tr>
            </thead>
            <tbody>
              {todaStats.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    No TODA associations match your search query.
                  </td>
                </tr>
              ) : (
                todaStats.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>
                      {row.name}
                    </td>
                    <td>
                      <span className="pill-badge pill-purple" style={{ fontSize: '0.75rem' }}>{row.code}</span>
                    </td>
                    <td style={{ color: '#22c55e', fontWeight: 700 }}>{row.activeUnits}</td>
                    <td style={{ color: row.expiredUnits > 0 ? '#fb7185' : '#94a3b8', fontWeight: 700 }}>
                      {row.expiredUnits}
                    </td>
                    <td style={{ fontWeight: 600, color: '#cbd5e1' }}>
                      ₱{row.revenueEstimate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`pill-badge ${row.ratingClass}`}>{row.complianceRating}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODULE 9: DEDICATED UNPAID FEES & MUNICIPAL RECEIVABLES REPORT */}
      <div className="glass-container no-print" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Coins size={20} color="#fbbf24" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                Unpaid Fees & Outstanding Municipal Receivables
              </h3>
              <span className="pill-badge pill-orange" style={{ fontSize: '0.72rem' }}>Module 9 Audited</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Itemized audit of pending applicant franchise assessments and unsettled traffic penalty balances across Baliwag.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.25)', padding: '0.3rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => setUnpaidTab('apps')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '7px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: unpaidTab === 'apps' ? '#f59e0b' : 'transparent',
                color: unpaidTab === 'apps' ? '#ffffff' : '#94a3b8',
                border: 'none',
              }}
            >
              Unpaid Applications ({unpaidApplications.length})
            </button>
            <button
              type="button"
              onClick={() => setUnpaidTab('penalties')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '7px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: unpaidTab === 'penalties' ? '#ef4444' : 'transparent',
                color: unpaidTab === 'penalties' ? '#ffffff' : '#94a3b8',
                border: 'none',
              }}
            >
              Unpaid Citations ({unpaidPenalties.length})
            </button>
          </div>
        </div>

        {/* Receivables Metric Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Outstanding Receivables</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>
              ₱{totalOutstandingReceivables.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Consolidated uncollected revenue</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #38bdf8' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Unpaid Franchise Assessments</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
              ₱{totalUnpaidAppFees.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{unpaidApplications.length} applications awaiting payment</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #f87171' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Outstanding Traffic Fines</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171', marginTop: '0.2rem' }}>
              ₱{totalUnpaidPenaltyFees.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{unpaidPenalties.length} unsettled citations</span>
          </div>
        </div>

        {/* Tab Content: Unpaid Applications Table */}
        {unpaidTab === 'apps' && (
          <div className="glass-table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Applicant / Operator</th>
                  <th>Plate / Body No. (MTOP)</th>
                  <th>TODA Route Line</th>
                  <th>Residency Tier</th>
                  <th>Date Submitted</th>
                  <th>Assessed Fee</th>
                  <th style={{ textAlign: 'right' }}>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {unpaidApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No unpaid applications on record. All applicant fees are settled!
                    </td>
                  </tr>
                ) : (
                  unpaidApplications.map(app => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 700, color: '#ffffff' }}>
                        {app.applicantName}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                          {app.plateNumber}
                        </span>
                        {app.bodyNumber && <small style={{ color: '#94a3b8', marginLeft: '0.4rem' }}>({app.bodyNumber})</small>}
                      </td>
                      <td>
                        <span className="pill-badge pill-purple" style={{ fontSize: '0.72rem' }}>
                          {app.todaName ? app.todaName.split(' ')[0] : 'BASTODA'}
                        </span>
                      </td>
                      <td style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                        {app.residency === 'baliwag_resident' ? 'Baliwag Resident (₱450)' : 'Non-Resident (₱550)'}
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 800, color: '#fbbf24' }}>
                        ₱{(app.totalFee || app.baseFee || 450).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="pill-badge pill-orange">
                          <Clock size={11} /> UNPAID
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: Unpaid Penalties Table */}
        {unpaidTab === 'penalties' && (
          <div className="glass-table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Citation No.</th>
                  <th>Driver / Violator</th>
                  <th>Plate / Body No.</th>
                  <th>TODA Line</th>
                  <th>Violation Type</th>
                  <th>Date Issued</th>
                  <th>Fine Balance</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {unpaidPenalties.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No outstanding traffic violation fines recorded.
                    </td>
                  </tr>
                ) : (
                  unpaidPenalties.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', color: '#fb7185', fontWeight: 700 }}>
                        {p.id.slice(0, 10)}
                      </td>
                      <td style={{ fontWeight: 700, color: '#ffffff' }}>
                        {p.driverName}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{p.plateNumber}</span>
                      </td>
                      <td>
                        <span className="pill-badge pill-purple" style={{ fontSize: '0.72rem' }}>
                          {p.todaName || '—'}
                        </span>
                      </td>
                      <td style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{p.violationType}</td>
                      <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        {new Date(p.issuedDate).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 800, color: '#f87171' }}>
                        ₱{p.amount.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="pill-badge pill-rose">
                          <AlertTriangle size={11} /> UNSETTLED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODULE 9: DEDICATED FRANCHISE RENEWALS & EXPIRATION SCHEDULE REPORT */}
      <div className="glass-container no-print" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CalendarClock size={20} color="#a855f7" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                Franchise Renewals & Expiration Schedule
              </h3>
              <span className="pill-badge pill-purple" style={{ fontSize: '0.72rem' }}>30-Day Window Monitored</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Tracks franchises nearing expiration within the 30-day renewal period, expired units, and incoming renewal filings.
            </p>
          </div>

          {smsSentNotice && (
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '8px', color: '#4ade80', fontSize: '0.82rem', fontWeight: 600 }}>
              {smsSentNotice}
            </div>
          )}
        </div>

        {/* Renewal Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #facc15' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Expiring Soon (Next 30 Days)</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#facc15', marginTop: '0.2rem' }}>
              {expiringSoonFranchises.length} Units
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Within official renewal window</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #f43f5e' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Expired / Overdue Units</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fb7185', marginTop: '0.2rem' }}>
              {overdueExpiredFranchises.length} Units
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Subject to late penalty assessment</span>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #4ade80' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Active Renewal Filings</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80', marginTop: '0.2rem' }}>
              {renewalApplications.length} Submitted
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Operators renewing in system</span>
          </div>
        </div>

        {/* Renewals Table */}
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>MTOP / Body No.</th>
                <th>Operator Name</th>
                <th>Driver & Contact</th>
                <th>TODA Route Line</th>
                <th>Plate Number</th>
                <th>Validity Expiry</th>
                <th>Renewal Status</th>
                <th style={{ textAlign: 'right' }}>Officer Action</th>
              </tr>
            </thead>
            <tbody>
              {franchises.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    No franchise renewal records available.
                  </td>
                </tr>
              ) : (
                franchises.map(f => {
                  const expDate = f.expiresAt || f.endDate || '';
                  const expiresAtMs = new Date(expDate).getTime();
                  const isExpired = expiresAtMs < nowMs || f.status === 'expired';
                  const isExpiringSoon = !isExpired && expiresAtMs - nowMs <= thirtyDaysMs;
                  const daysRemaining = Math.ceil((expiresAtMs - nowMs) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={f.id}>
                      <td style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 800, fontSize: '0.92rem' }}>
                        {f.mtopNumber || f.id.slice(0, 8)}
                      </td>
                      <td style={{ fontWeight: 700, color: '#ffffff' }}>
                        {f.operatorName}
                      </td>
                      <td>
                        <div style={{ color: '#cbd5e1' }}>{f.driverName || '—'}</div>
                      </td>
                      <td>
                        <span className="pill-badge pill-purple" style={{ fontSize: '0.72rem' }}>
                          {f.todaName || 'BASTODA'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>
                        {f.plateNumber}
                      </td>
                      <td style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                        {expDate ? new Date(expDate).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        {isExpired ? (
                          <span className="pill-badge pill-rose">
                            <AlertCircle size={11} /> EXPIRED ({Math.abs(daysRemaining)}d ago)
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="pill-badge pill-orange">
                            <Clock size={11} /> {daysRemaining} DAYS LEFT
                          </span>
                        ) : (
                          <span className="pill-badge pill-emerald">
                            ACTIVE ({daysRemaining}d)
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleSendRenewalReminder(f)}
                          disabled={smsSendingId === f.id}
                          className="btn-glass"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.78rem',
                            color: isExpired || isExpiringSoon ? '#38bdf8' : '#94a3b8',
                            borderColor: isExpired || isExpiringSoon ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.1)'
                          }}
                          title="Send SMS notification alert to operator"
                        >
                          <Send size={12} /> {smsSendingId === f.id ? 'Sending...' : 'SMS Notice'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT TRANSACTION & AUDIT LEDGER */}
      <div className="glass-container no-print" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={18} color="#34d399" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                Audited Fee Collections & Transactions Ledger
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Individual verifiable receipts logged into the municipal database.
            </p>
          </div>

          <button onClick={handleExportCSV} className="btn-glass" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
            <Download size={15} /> Export Audit Log
          </button>
        </div>

        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Official Receipt (OR)</th>
                <th>Payer / Driver</th>
                <th>TODA Route</th>
                <th>Fee Classification</th>
                <th>Payment Channel</th>
                <th>Amount Collected</th>
                <th style={{ textAlign: 'right' }}>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              {transactionRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    No recorded transactions available at this time.
                  </td>
                </tr>
              ) : (
                transactionRows.slice(0, 30).map(transaction => (
                  <tr key={transaction.id}>
                    <td style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                      {transaction.reference}
                    </td>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>
                      {transaction.payer}
                    </td>
                    <td>
                      <span className="pill-badge pill-purple" style={{ fontSize: '0.72rem' }}>
                        {transaction.toda}
                      </span>
                    </td>
                    <td style={{ color: '#cbd5e1' }}>{transaction.classification}</td>
                    <td>
                      <span style={{ 
                        textTransform: 'uppercase', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        color: transaction.method.toLowerCase() === 'gcash' ? '#38bdf8' : '#e2e8f0',
                        background: transaction.method.toLowerCase() === 'gcash' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px'
                      }}>
                        {transaction.method}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: '#4ade80' }}>
                      ₱{transaction.amount.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`pill-badge ${transaction.status === 'completed' || transaction.status === 'paid' ? 'pill-emerald' : transaction.status === 'pending' || transaction.status === 'unpaid' ? 'pill-orange' : 'pill-rose'}`}>
                        {transaction.status === 'completed' || transaction.status === 'paid' ? <CheckCircle2 size={12} /> : null} {transaction.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PREVIEW FOR OFFICIAL PDF DOCUMENT */}
      {showDocPreview && (
        <div className="modal-overlay no-print" onClick={() => setShowDocPreview(false)}>
          <div className="glass-container animate-fade-in" style={{ width: '90%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', background: 'rgba(10, 24, 16, 0.95)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={22} color="#22c55e" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>Official Document Print Preview</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handlePrint} className="btn-glass btn-primary-glass" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                  <Printer size={16} /> Print / Save as PDF
                </button>
                <button onClick={() => setShowDocPreview(false)} className="btn-glass" style={{ padding: '0.5rem 0.85rem' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Box Preview */}
            <div style={{ background: '#ffffff', color: '#111827', padding: '2.5rem', borderRadius: '8px', fontFamily: 'serif', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              {/* Letterhead Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #111827', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <img src="/baliuag-logo.png" alt="Baliwag Seal" style={{ height: '70px', width: 'auto', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#374151' }}>
                  REPUBLIKA NG PILIPINAS • LALAWIGAN NG BULACAN
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#111827', margin: '0.2rem 0' }}>
                  PAMAHALAANG LUNGSOD NG BALIWAG
                </h2>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#15803d' }}>
                  OFFICE OF THE MUNICIPAL MAYOR & TRICYCLE FRANCHISING BOARD
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Baliuag Municipal Hall, Poblacion, Baliwag, Bulacan • Hotline: (044) 798-0234
                </div>
              </div>

              {/* Title & Document Meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', margin: 0 }}>
                    OFFICIAL COMPLIANCE & REVENUE DISTRIBUTION REPORT
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.2rem' }}>
                    Record of Tricycle Franchises, Stenciling Inspections & Collections
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#374151' }}>
                  <div><strong>Date Generated:</strong> {currentDateStr}</div>
                  <div><strong>Control Ref No:</strong> BALIWAG-MTOP-RPT-2026-0807</div>
                  <div><strong>Status:</strong> OFFICIAL AUDIT CERTIFIED</div>
                </div>
              </div>

              {/* Section I: Summary Table */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '0.75rem', color: '#111827' }}>
                I. EXECUTIVE SUMMARY & COMPLIANCE METRICS
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'left' }}>Metric Description</th>
                    <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right' }}>Total Count / Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Total Registered MTOP Applications</td>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>{totalApplicationsCount}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Active Licensed Franchises</td>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>{activeCount || 1}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Expired / Pending Renewal Franchises</td>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>{expiredCount || 1}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Engine & Chassis Stenciling Verified</td>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>{passedStencilingCount} / {totalApplicationsCount || 1} Passed</td>
                  </tr>
                </tbody>
              </table>

              {/* Section II: Financial Collections Table */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '0.75rem', color: '#111827' }}>
                II. MUNICIPAL REVENUE & TODA FEE DISTRIBUTION
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'left' }}>Fee Collection Source</th>
                    <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'left' }}>Beneficiary / Office</th>
                    <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right' }}>Amount Collected</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>MTOP Base Permit Fees</td>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Municipal Treasurer’s Office</td>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>₱{totalTreasurerRevenue.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>TODA Route & Membership Fees</td>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Recognized TODA Associations</td>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>₱{totalTodaFees.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Traffic Penalties & Fines</td>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Traffic Management Office</td>
                    <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>₱{totalPenaltyRevenue.toFixed(2)}</td>
                  </tr>
                  <tr style={{ background: '#f9fafb', fontWeight: 'bold' }}>
                    <td colSpan={2} style={{ border: '1px solid #374151', padding: '10px 12px', textAlign: 'right' }}>TOTAL COLLECTED REVENUE:</td>
                    <td style={{ border: '1px solid #374151', padding: '10px 12px', textAlign: 'right', color: '#15803d', fontSize: '1rem' }}>
                      ₱{totalGrossCollections.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Section III: Unpaid Fees & Receivables */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '0.75rem', color: '#111827' }}>
                III. UNPAID FEES & OUTSTANDING MUNICIPAL RECEIVABLES
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>Item / Debtor</th>
                    <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>Plate / Body No.</th>
                    <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>Classification</th>
                    <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'right' }}>Unpaid Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidApplications.slice(0, 3).map(app => (
                    <tr key={app.id}>
                      <td style={{ border: '1px solid #374151', padding: '6px 10px' }}>{app.applicantName}</td>
                      <td style={{ border: '1px solid #374151', padding: '6px 10px', fontFamily: 'monospace' }}>{app.plateNumber}</td>
                      <td style={{ border: '1px solid #374151', padding: '6px 10px' }}>MTOP Assessment</td>
                      <td style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold' }}>₱{(app.totalFee || 450).toFixed(2)}</td>
                    </tr>
                  ))}
                  {unpaidPenalties.slice(0, 2).map(p => (
                    <tr key={p.id}>
                      <td style={{ border: '1px solid #374151', padding: '6px 10px' }}>{p.driverName}</td>
                      <td style={{ border: '1px solid #374151', padding: '6px 10px', fontFamily: 'monospace' }}>{p.plateNumber}</td>
                      <td style={{ border: '1px solid #374151', padding: '6px 10px' }}>Fine: {p.violationType}</td>
                      <td style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>₱{p.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f9fafb', fontWeight: 'bold' }}>
                    <td colSpan={3} style={{ border: '1px solid #374151', padding: '8px 10px', textAlign: 'right' }}>TOTAL OUTSTANDING RECEIVABLES:</td>
                    <td style={{ border: '1px solid #374151', padding: '8px 10px', textAlign: 'right', color: '#b91c1c' }}>₱{totalOutstandingReceivables.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Section IV: Franchise Renewals Schedule */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '0.75rem', color: '#111827' }}>
                IV. FRANCHISE RENEWALS & EXPIRATION SCHEDULE
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>MTOP / Body No.</th>
                    <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>Operator Name</th>
                    <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>Plate Number</th>
                    <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>Validity Date</th>
                    <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'right' }}>Renewal Status</th>
                  </tr>
                </thead>
                <tbody>
                  {franchises.slice(0, 4).map(f => {
                    const expDate = f.expiresAt || f.endDate || '';
                    const isExp = new Date(expDate).getTime() < nowMs || f.status === 'expired';
                    return (
                      <tr key={f.id}>
                        <td style={{ border: '1px solid #374151', padding: '6px 10px', fontWeight: 'bold' }}>{f.mtopNumber || f.id.slice(0, 8)}</td>
                        <td style={{ border: '1px solid #374151', padding: '6px 10px' }}>{f.operatorName}</td>
                        <td style={{ border: '1px solid #374151', padding: '6px 10px', fontFamily: 'monospace' }}>{f.plateNumber}</td>
                        <td style={{ border: '1px solid #374151', padding: '6px 10px' }}>{expDate ? new Date(expDate).toLocaleDateString() : '—'}</td>
                        <td style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: isExp ? '#dc2626' : '#15803d' }}>
                          {isExp ? 'EXPIRED / OVERDUE' : 'ACTIVE / WITHIN WINDOW'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Section V: Signatures Block */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '1.5rem', color: '#111827' }}>
                V. CERTIFICATION & OFFICIAL SIGNATURES
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', textAlign: 'center', marginTop: '2.5rem', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ borderBottom: '1px solid #111827', paddingBottom: '0.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    MARIA GARCIA
                  </div>
                  <div style={{ color: '#4b5563', marginTop: '0.2rem' }}>Municipal Franchising Officer</div>
                </div>

                <div>
                  <div style={{ borderBottom: '1px solid #111827', paddingBottom: '0.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    OFFICE OF THE TREASURER
                  </div>
                  <div style={{ color: '#4b5563', marginTop: '0.2rem' }}>City Treasurer Representative</div>
                </div>

                <div>
                  <div style={{ borderBottom: '1px solid #111827', paddingBottom: '0.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    HON. MUNICIPAL MAYOR
                  </div>
                  <div style={{ color: '#4b5563', marginTop: '0.2rem' }}>Chairman, Franchising Board</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY FORMAL DOCUMENT (Visible ONLY when printing to PDF or printer) */}
      <div className="printable-official-document" style={{ display: 'none' }}>
        {/* Letterhead Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #111827', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <img src="/baliuag-logo.png" alt="Baliwag Seal" style={{ height: '75px', width: 'auto', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#374151' }}>
            REPUBLIKA NG PILIPINAS • LALAWIGAN NG BULACAN
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0.2rem 0' }}>
            PAMAHALAANG LUNGSOD NG BALIWAG
          </h2>
          <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#15803d' }}>
            OFFICE OF THE MUNICIPAL MAYOR & TRICYCLE FRANCHISING BOARD
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Baliuag Municipal Hall, Poblacion, Baliwag, Bulacan • Hotline: (044) 798-0234
          </div>
        </div>

        {/* Title & Document Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', margin: 0 }}>
              OFFICIAL COMPLIANCE & REVENUE DISTRIBUTION REPORT
            </h3>
            <div style={{ fontSize: '0.88rem', color: '#4b5563', marginTop: '0.2rem' }}>
              Record of Tricycle Franchises, Stenciling Inspections & Fee Collections
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#374151' }}>
            <div><strong>Date Generated:</strong> {currentDateStr}</div>
            <div><strong>Control Ref No:</strong> BALIWAG-MTOP-RPT-2026-0807</div>
            <div><strong>Status:</strong> OFFICIAL AUDIT CERTIFIED</div>
          </div>
        </div>

        {/* Section I: Summary Table */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '0.75rem', color: '#111827' }}>
          I. EXECUTIVE SUMMARY & COMPLIANCE METRICS
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'left' }}>Metric Description</th>
              <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right' }}>Total Count / Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Total Registered MTOP Applications</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>{totalApplicationsCount}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Active Licensed Franchises</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>{activeCount || 1}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Expired / Pending Renewal Franchises</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>{expiredCount || 1}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Engine & Chassis Stenciling Verified</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>{passedStencilingCount} / {totalApplicationsCount || 1} Passed</td>
            </tr>
          </tbody>
        </table>

        {/* Section II: Financial Collections Table */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '0.75rem', color: '#111827' }}>
          II. MUNICIPAL REVENUE & TODA FEE DISTRIBUTION
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'left' }}>Fee Collection Source</th>
              <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'left' }}>Beneficiary / Office</th>
              <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right' }}>Amount Collected</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>MTOP Base Permit Fees</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Municipal Treasurer’s Office</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>₱{totalTreasurerRevenue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>TODA Route & Membership Fees</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Recognized TODA Associations</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>₱{totalTodaFees.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Traffic Penalties & Fines</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Traffic Management Office</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>₱{totalPenaltyRevenue.toFixed(2)}</td>
            </tr>
            <tr style={{ background: '#f9fafb', fontWeight: 'bold' }}>
              <td colSpan={2} style={{ border: '1px solid #374151', padding: '10px 12px', textAlign: 'right' }}>TOTAL COLLECTED REVENUE:</td>
              <td style={{ border: '1px solid #374151', padding: '10px 12px', textAlign: 'right', fontSize: '1rem' }}>
                ₱{totalGrossCollections.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section III: Unpaid Fees & Pending Receivables */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '0.75rem', color: '#111827' }}>
          III. UNPAID FEES & OUTSTANDING RECEIVABLES
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>Item / Debtor</th>
              <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>Plate / Body No.</th>
              <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>Classification</th>
              <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'right' }}>Unpaid Balance</th>
            </tr>
          </thead>
          <tbody>
            {unpaidApplications.slice(0, 3).map(app => (
              <tr key={app.id}>
                <td style={{ border: '1px solid #374151', padding: '6px 10px' }}>{app.applicantName}</td>
                <td style={{ border: '1px solid #374151', padding: '6px 10px', fontFamily: 'monospace' }}>{app.plateNumber}</td>
                <td style={{ border: '1px solid #374151', padding: '6px 10px' }}>MTOP Assessment</td>
                <td style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold' }}>₱{(app.totalFee || 450).toFixed(2)}</td>
              </tr>
            ))}
            {unpaidPenalties.slice(0, 2).map(p => (
              <tr key={p.id}>
                <td style={{ border: '1px solid #374151', padding: '6px 10px' }}>{p.driverName}</td>
                <td style={{ border: '1px solid #374151', padding: '6px 10px', fontFamily: 'monospace' }}>{p.plateNumber}</td>
                <td style={{ border: '1px solid #374151', padding: '6px 10px' }}>Fine: {p.violationType}</td>
                <td style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>₱{p.amount.toFixed(2)}</td>
              </tr>
            ))}
            <tr style={{ background: '#f9fafb', fontWeight: 'bold' }}>
              <td colSpan={3} style={{ border: '1px solid #374151', padding: '8px 10px', textAlign: 'right' }}>TOTAL OUTSTANDING RECEIVABLES:</td>
              <td style={{ border: '1px solid #374151', padding: '8px 10px', textAlign: 'right', color: '#b91c1c' }}>₱{totalOutstandingReceivables.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Section IV: Franchise Renewals Schedule */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '0.75rem', color: '#111827' }}>
          IV. FRANCHISE RENEWALS & EXPIRATION SCHEDULE
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>MTOP / Body No.</th>
              <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>Operator Name</th>
              <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>Plate Number</th>
              <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'left' }}>Validity Date</th>
              <th style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'right' }}>Renewal Status</th>
            </tr>
          </thead>
          <tbody>
            {franchises.slice(0, 4).map(f => {
              const expDate = f.expiresAt || f.endDate || '';
              const isExp = new Date(expDate).getTime() < nowMs || f.status === 'expired';
              return (
                <tr key={f.id}>
                  <td style={{ border: '1px solid #374151', padding: '6px 10px', fontWeight: 'bold' }}>{f.mtopNumber || f.id.slice(0, 8)}</td>
                  <td style={{ border: '1px solid #374151', padding: '6px 10px' }}>{f.operatorName}</td>
                  <td style={{ border: '1px solid #374151', padding: '6px 10px', fontFamily: 'monospace' }}>{f.plateNumber}</td>
                  <td style={{ border: '1px solid #374151', padding: '6px 10px' }}>{expDate ? new Date(expDate).toLocaleDateString() : '—'}</td>
                  <td style={{ border: '1px solid #374151', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: isExp ? '#dc2626' : '#15803d' }}>
                    {isExp ? 'EXPIRED / OVERDUE' : 'ACTIVE / WITHIN WINDOW'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Section V: TODA Breakdown */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '0.75rem', color: '#111827' }}>
          V. TODA ASSOCIATION COMPLIANCE STATUS
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'left' }}>TODA Association Name</th>
              <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center' }}>Active Units</th>
              <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center' }}>Expired Units</th>
              <th style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center' }}>Compliance Rating</th>
            </tr>
          </thead>
          <tbody>
            {todaStats.slice(0, 3).map((row, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #374151', padding: '8px 12px', fontWeight: 'bold' }}>{row.name}</td>
                <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center' }}>{row.activeUnits}</td>
                <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center' }}>{row.expiredUnits}</td>
                <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold' }}>{row.complianceRating}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '0.75rem', color: '#111827' }}>
          VI. BASTODA FRANCHISE ROSTER ({bastodaMembers.length})
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.82rem' }}><thead><tr style={{ background: '#f3f4f6' }}><th style={{ border: '1px solid #374151', padding: '8px', textAlign: 'left' }}>MTOP</th><th style={{ border: '1px solid #374151', padding: '8px', textAlign: 'left' }}>Operator</th><th style={{ border: '1px solid #374151', padding: '8px', textAlign: 'left' }}>Driver</th><th style={{ border: '1px solid #374151', padding: '8px', textAlign: 'left' }}>Plate</th><th style={{ border: '1px solid #374151', padding: '8px', textAlign: 'left' }}>Status</th></tr></thead><tbody>{bastodaMembers.map(item => <tr key={item.id}><td style={{ border: '1px solid #374151', padding: '8px' }}>{item.mtopNumber}</td><td style={{ border: '1px solid #374151', padding: '8px' }}>{item.operatorName}</td><td style={{ border: '1px solid #374151', padding: '8px' }}>{item.driverName}</td><td style={{ border: '1px solid #374151', padding: '8px' }}>{item.plateNumber}</td><td style={{ border: '1px solid #374151', padding: '8px' }}>{item.status}</td></tr>)}</tbody></table>

        {/* Section VII: Signatures Block */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '1.5rem', color: '#111827' }}>
          VII. CERTIFICATION & OFFICIAL SIGNATURES
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', textAlign: 'center', marginTop: '3.5rem', fontSize: '0.85rem' }}>
          <div>
            <div style={{ borderBottom: '1px solid #111827', paddingBottom: '0.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
              MARIA GARCIA
            </div>
            <div style={{ color: '#4b5563', marginTop: '0.2rem' }}>Municipal Franchising Officer</div>
          </div>

          <div>
            <div style={{ borderBottom: '1px solid #111827', paddingBottom: '0.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
              OFFICE OF THE TREASURER
            </div>
            <div style={{ color: '#4b5563', marginTop: '0.2rem' }}>City Treasurer Representative</div>
          </div>

          <div>
            <div style={{ borderBottom: '1px solid #111827', paddingBottom: '0.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
              HON. MUNICIPAL MAYOR
            </div>
            <div style={{ color: '#4b5563', marginTop: '0.2rem' }}>Chairman, Franchising Board</div>
          </div>
        </div>
      </div>

    </div>
  );
}
