import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Shield, Search, AlertTriangle } from 'lucide-react';
import * as storage from '../../services/storageService';
import type { Franchise } from '../../types';

export function FranchiseRegistry() {
  const { showToast } = useToast();
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const allFranchises = storage.getFranchises();
  let franchises = statusFilter === 'all' ? allFranchises : allFranchises.filter(f => f.status === statusFilter);
  if (search) {
    const q = search.toLowerCase();
    franchises = franchises.filter(f =>
      f.operatorName.toLowerCase().includes(q) ||
      f.plateNumber.toLowerCase().includes(q) ||
      f.todaName.toLowerCase().includes(q)
    );
  }

  const handleStatusChange = (id: string, newStatus: Franchise['status']) => {
    storage.updateFranchise(id, { status: newStatus });
    showToast(`Franchise status updated to ${newStatus}.`, 'success');
    setSelectedFranchise(null);
  };

  // Check for expiring franchises
  const expiringCount = allFranchises.filter(f => {
    const daysUntil = (new Date(f.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return f.status === 'active' && daysUntil <= 90 && daysUntil > 0;
  }).length;

  return (
    <div className="page">
      <Header title="Franchise Registry" subtitle="Manage all registered franchises" />

      <div className="page__content">
        {expiringCount > 0 && (
          <div className="alert alert--warning">
            <AlertTriangle size={18} />
            <span><strong>{expiringCount}</strong> franchise(s) expiring within 90 days.</span>
          </div>
        )}

        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-bar__search">
            <Search size={16} />
            <input placeholder="Search by name, plate, TODA..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-bar__btns">
            {['all', 'active', 'expired', 'suspended', 'pending'].map(s => (
              <button key={s} className={`filter-btn ${statusFilter === s ? 'filter-btn--active' : ''}`} onClick={() => setStatusFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Franchise Cards */}
        {franchises.length === 0 ? (
          <div className="card">
            <div className="card__body">
              <div className="card__empty">
                <Shield size={48} />
                <h3>No Franchises Found</h3>
              </div>
            </div>
          </div>
        ) : (
          <div className="franchise-grid">
            {franchises.map(f => {
              const daysUntilExpiry = Math.ceil((new Date(f.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isExpiring = daysUntilExpiry <= 90 && daysUntilExpiry > 0;

              return (
                <div key={f.id} className={`franchise-card ${isExpiring ? 'franchise-card--expiring' : ''}`} onClick={() => setSelectedFranchise(f)}>
                  <div className="franchise-card__header">
                    <h4>{f.operatorName}</h4>
                    <StatusBadge status={f.status} size="sm" />
                  </div>
                  <div className="franchise-card__body">
                    <div className="franchise-card__row">
                      <span>Plate</span><span>{f.plateNumber}</span>
                    </div>
                    <div className="franchise-card__row">
                      <span>Vehicle</span><span>{f.vehicleMake} {f.vehicleModel}</span>
                    </div>
                    <div className="franchise-card__row">
                      <span>TODA</span><span>{f.todaName}</span>
                    </div>
                    <div className="franchise-card__row">
                      <span>Residency</span><span>{f.residency === 'resident' ? 'Resident' : 'Non-Resident'}</span>
                    </div>
                    <div className="franchise-card__row">
                      <span>Expires</span>
                      <span className={isExpiring ? 'text-warning' : ''}>
                        {new Date(f.expiresAt).toLocaleDateString()}
                        {isExpiring && ` (${daysUntilExpiry}d)`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        <Modal isOpen={!!selectedFranchise} onClose={() => setSelectedFranchise(null)} title="Franchise Details" size="md">
          {selectedFranchise && (
            <div className="franchise-detail">
              <div className="franchise-detail__header">
                <h3>{selectedFranchise.operatorName}</h3>
                <StatusBadge status={selectedFranchise.status} />
              </div>
              <div className="franchise-detail__grid">
                <p><strong>Franchise ID:</strong> {selectedFranchise.id}</p>
                <p><strong>Plate Number:</strong> {selectedFranchise.plateNumber}</p>
                <p><strong>Vehicle:</strong> {selectedFranchise.vehicleMake} {selectedFranchise.vehicleModel} ({selectedFranchise.vehicleColor})</p>
                <p><strong>Motor #:</strong> {selectedFranchise.motorNumber}</p>
                <p><strong>Chassis #:</strong> {selectedFranchise.chassisNumber}</p>
                <p><strong>TODA:</strong> {selectedFranchise.todaName}</p>
                <p><strong>Route:</strong> {selectedFranchise.routeArea}</p>
                <p><strong>Residency:</strong> {selectedFranchise.residency === 'resident' ? 'Resident' : 'Non-Resident'}</p>
                <p><strong>Issued:</strong> {new Date(selectedFranchise.issuedAt).toLocaleDateString()}</p>
                <p><strong>Expires:</strong> {new Date(selectedFranchise.expiresAt).toLocaleDateString()}</p>
                <p><strong>Renewal Date:</strong> {new Date(selectedFranchise.renewalDate).toLocaleDateString()}</p>
              </div>
              <div className="franchise-detail__actions">
                <h4>Change Status</h4>
                <div className="franchise-detail__btns">
                  {selectedFranchise.status !== 'active' && (
                    <button className="btn btn--success btn--sm" onClick={() => handleStatusChange(selectedFranchise.id, 'active')}>Set Active</button>
                  )}
                  {selectedFranchise.status !== 'suspended' && (
                    <button className="btn btn--warning btn--sm" onClick={() => handleStatusChange(selectedFranchise.id, 'suspended')}>Suspend</button>
                  )}
                  {selectedFranchise.status !== 'expired' && (
                    <button className="btn btn--danger btn--sm" onClick={() => handleStatusChange(selectedFranchise.id, 'expired')}>Mark Expired</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
