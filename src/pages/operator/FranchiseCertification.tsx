import { useEffect, useState } from 'react';
import { Award, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as supabaseService from '../../services/supabaseService';
import type { Franchise } from '../../types';

export function FranchiseCertification() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!user) return;
    void supabaseService.getFranchisesAsync().then(items => setFranchises(
      items
        .filter(item => item.operatorId === user.id)
        .sort((a, b) => new Date(b.issuedAt || b.startDate || 0).getTime() - new Date(a.issuedAt || a.startDate || 0).getTime())
    ));
  }, [user]);

  return <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
    <div className="glass-container no-print" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
      <span className="pill-badge pill-emerald"><Award size={14} /> Official certification</span>
      <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '.75rem 0 .5rem' }}>Franchise certification</h2>
      <p style={{ color: '#94a3b8' }}>Certificates are available only after a franchise is granted. Each one shows its exact effectivity period and expiration status.</p>
    </div>
    {franchises.length === 0 ? <div className="glass-panel" style={{ padding: '2rem', color: '#94a3b8' }}>No issued franchise yet. Certification is released after final admin approval.</div> : franchises.map(franchise => {
      const expired = franchise.status === 'expired' || new Date(franchise.expiresAt).getTime() < now;
      return <div key={franchise.id} className="glass-container printable-official-document" style={{ padding: '2.5rem', marginBottom: '1.5rem', background: '#fff', color: '#111827' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #111827', paddingBottom: '1rem' }}>
          <img src="/baliuag-logo.png" alt="Baliwag Seal" style={{ height: '60px' }} />
          <h2 style={{ margin: '.4rem 0', fontFamily: 'serif' }}>CITY GOVERNMENT OF BALIWAG</h2>
          <div style={{ fontWeight: 700 }}>TRICYCLE FRANCHISING BOARD</div>
        </div>
        <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
          <h1 style={{ fontFamily: 'serif', fontSize: '1.7rem', margin: 0 }}>CERTIFICATE OF FRANCHISE</h1>
          <p>This certifies that the following MTOP franchise has been issued.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', lineHeight: 1.5 }}>
          <div><strong>MTOP No.</strong><br />{franchise.mtopNumber}</div>
          <div><strong>Operator</strong><br />{franchise.operatorName}</div>
          <div><strong>Driver</strong><br />{franchise.driverName}</div>
          <div><strong>Plate / Unit</strong><br />{franchise.plateNumber}</div>
          <div><strong>TODA / Route</strong><br />{franchise.todaName}<br />{franchise.routeArea}</div>
          <div><strong>Validity</strong><br />{franchise.startDate || new Date(franchise.issuedAt).toLocaleDateString()} to {franchise.endDate || new Date(franchise.expiresAt).toLocaleDateString()}</div>
        </div>
        <div style={{ marginTop: '1.5rem', padding: '1rem', textAlign: 'center', fontWeight: 800, border: '1px solid', borderColor: expired ? '#dc2626' : '#15803d', color: expired ? '#b91c1c' : '#15803d' }}>
          {expired ? `EXPIRED — renewal required since ${new Date(franchise.expiresAt).toLocaleDateString()}` : `ACTIVE — valid until ${new Date(franchise.expiresAt).toLocaleDateString()}`}
        </div>
        <div className="no-print" style={{ textAlign: 'right', marginTop: '1.5rem' }}><button onClick={() => window.print()} className="btn-glass btn-primary-glass"><Printer size={17} /> Print certificate</button></div>
      </div>;
    })}
  </div>;
}
