import { useState, useEffect } from 'react';
import * as storage from '../../services/storageService';
import type { Franchise } from '../../types';
import { Search } from 'lucide-react';

export function FranchiseRegistry() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');

  useEffect(() => {
    setFranchises(storage.getFranchises());
  }, []);

  const filteredFranchises = franchises.filter(f => {
    const matchesSearch = 
      f.mtopNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.todaName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-container" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="pill-badge pill-cyan">Franchise Registry</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Lungsod ng Baliwag</span>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Franchise Monitoring & Registry
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Mino-monitor at minamasdan ang lahat ng **Active** at **Expired** tricycle franchises sa Lungsod ng Baliwag.
        </p>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="glass-input"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="Mag-search ayon sa MTOP #, Driver Name, Plate #, o TODA..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="glass-input glass-select"
            style={{ width: '200px' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Lahat ng Franchise Status</option>
            <option value="active">Active Franchises Only</option>
            <option value="expired">Expired Franchises Only</option>
          </select>
        </div>
      </div>

      {/* Registry Table Card */}
      <div className="glass-container" style={{ padding: '1.75rem' }}>
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>MTOP Number</th>
                <th>Driver / Operator</th>
                <th>Plate Number</th>
                <th>TODA Route</th>
                <th>Issued Date</th>
                <th>Expiration Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredFranchises.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                    Walang nahanap na record sa registry.
                  </td>
                </tr>
              ) : (
                filteredFranchises.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 800, color: '#38bdf8' }}>{f.mtopNumber}</td>
                    <td>
                      <strong style={{ color: '#ffffff', display: 'block' }}>{f.driverName}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Op: {f.operatorName}</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{f.plateNumber}</td>
                    <td style={{ fontSize: '0.85rem' }}>{f.todaName}</td>
                    <td style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{new Date(f.issuedAt).toLocaleDateString()}</td>
                    <td style={{ fontSize: '0.82rem', color: f.status === 'expired' ? '#fb7185' : '#cbd5e1', fontWeight: f.status === 'expired' ? 700 : 400 }}>
                      {new Date(f.expiresAt).toLocaleDateString()}
                    </td>
                    <td>
                      {f.status === 'active' ? (
                        <span className="pill-badge pill-emerald">ACTIVE</span>
                      ) : (
                        <span className="pill-badge pill-rose">EXPIRED</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
