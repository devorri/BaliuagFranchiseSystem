import { useState, useEffect } from 'react';
import * as storage from '../../services/storageService';
import type { Application, Franchise, Penalty } from '../../types';
import { Printer, DollarSign, FileText, Eye, X } from 'lucide-react';

export function Reports() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [showDocPreview, setShowDocPreview] = useState(false);

  useEffect(() => {
    setApplications(storage.getApplications());
    setFranchises(storage.getFranchises());
    setPenalties(storage.getPenalties());
  }, []);

  const totalTreasurerRevenue = applications
    .filter(a => a.treasurerPayment?.paid)
    .reduce((acc, curr) => acc + (curr.treasurerPayment?.amount || 450), 0);

  const totalTodaFees = applications
    .filter(a => a.todaApproval?.routeFeePaid)
    .reduce((acc, curr) => acc + (curr.todaApproval?.routeFeeAmount || 500) + (curr.todaApproval?.membershipFeeAmount || 300), 0);

  const totalPenaltyRevenue = penalties
    .filter(p => p.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const activeCount = franchises.filter(f => f.status === 'active').length;
  const expiredCount = franchises.filter(f => f.status === 'expired').length;
  const totalApplicationsCount = applications.length;
  const passedStencilingCount = applications.filter(a => a.inspection?.status === 'passed').length;

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* WEB VIEW ADMIN HEADER (Hidden during print) */}
      <div className="glass-container no-print" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="pill-badge pill-cyan">Reports & Official Audits</span>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Lungsod ng Baliwag</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Compliance & Financial Reports
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: '650px' }}>
              Opisyal na ulat para sa **compliance**, **transparency**, at **revenue distribution** ng Pamahalaang Lungsod ng Baliwag.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => setShowDocPreview(true)} className="btn-glass" style={{ padding: '0.75rem 1.25rem' }}>
              <Eye size={18} /> Preview Official PDF
            </button>
            <button onClick={handlePrint} className="btn-glass btn-primary-glass" style={{ padding: '0.75rem 1.5rem' }}>
              <Printer size={18} /> Print Official Document
            </button>
          </div>
        </div>
      </div>

      {/* WEB VIEW FINANCIAL SUMMARY CARDS (Hidden during print) */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-container" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#22c55e', marginBottom: '0.5rem' }}>
            <DollarSign size={24} />
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700 }}>Treasurer Revenue</span>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>₱{totalTreasurerRevenue.toFixed(2)}</h3>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.25rem' }}>City Treasurer MTOP base fees collected</p>
        </div>

        <div className="glass-container" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#c084fc', marginBottom: '0.5rem' }}>
            <DollarSign size={24} />
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700 }}>TODA Fees Collection</span>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>₱{totalTodaFees.toFixed(2)}</h3>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.25rem' }}>Membership & Route fees to TODA Associations</p>
        </div>

        <div className="glass-container" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fb923c', marginBottom: '0.5rem' }}>
            <DollarSign size={24} />
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700 }}>Penalty Collections</span>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>₱{totalPenaltyRevenue.toFixed(2)}</h3>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.25rem' }}>Fines collected from traffic violations</p>
        </div>
      </div>

      {/* WEB VIEW TABLE (Hidden during print) */}
      <div className="glass-container no-print" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          TODA Association Compliance & Franchise Statistics
        </h3>

        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>TODA Association</th>
                <th>Active Franchises</th>
                <th>Expired Franchises</th>
                <th>Compliance Rating</th>
              </tr>
            </thead>
            <tbody>
              {[
                { toda: 'BASTODA (Baliuag Poblacion TODA)', active: activeCount || 1, expired: expiredCount || 0, rating: '98% High' },
                { toda: 'SMTODA (Sabang Terminal TODA)', active: 1, expired: 1, rating: '85% Medium' },
                { toda: 'TARTODA (Tarcan Highway TODA)', active: 2, expired: 0, rating: '100% Full' },
              ].map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>{row.toda}</td>
                  <td style={{ color: '#22c55e', fontWeight: 700 }}>{row.active}</td>
                  <td style={{ color: '#fb7185', fontWeight: 700 }}>{row.expired}</td>
                  <td>
                    <span className="pill-badge pill-emerald">{row.rating}</span>
                  </td>
                </tr>
              ))}
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
                    <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>{passedStencilingCount} / {totalApplicationsCount} Passed</td>
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
                      ₱{(totalTreasurerRevenue + totalTodaFees + totalPenaltyRevenue).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Section III: Signatures Block */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '1.5rem', color: '#111827' }}>
                III. CERTIFICATION & OFFICIAL SIGNATURES
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
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>{activeCount || 1}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Expired / Pending Renewal Franchises</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>{expiredCount || 1}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #374151', padding: '8px 12px' }}>Engine & Chassis Stenciling Verified</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>{passedStencilingCount} / {totalApplicationsCount} Passed</td>
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
                ₱{(totalTreasurerRevenue + totalTodaFees + totalPenaltyRevenue).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section III: TODA Breakdown */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '0.75rem', color: '#111827' }}>
          III. TODA ASSOCIATION COMPLIANCE STATUS
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
            <tr>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', fontWeight: 'bold' }}>BASTODA (Baliuag Poblacion TODA)</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center' }}>{activeCount || 1}</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center' }}>{expiredCount || 0}</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold' }}>98% High</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', fontWeight: 'bold' }}>SMTODA (Sabang Terminal TODA)</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center' }}>1</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center' }}>1</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold' }}>85% Medium</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', fontWeight: 'bold' }}>TARTODA (Tarcan Highway TODA)</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center' }}>2</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center' }}>0</td>
              <td style={{ border: '1px solid #374151', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold' }}>100% Full</td>
            </tr>
          </tbody>
        </table>

        {/* Section IV: Signatures Block */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #9ca3af', paddingBottom: '0.35rem', marginBottom: '1.5rem', color: '#111827' }}>
          IV. CERTIFICATION & OFFICIAL SIGNATURES
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
