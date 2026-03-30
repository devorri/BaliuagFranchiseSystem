import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StarRating } from '../../components/ui/StarRating';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Users, Search } from 'lucide-react';
import * as storage from '../../services/storageService';
import type { DriverProfile } from '../../types';

export function DriverMonitoring() {
  const { showToast } = useToast();
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const allDrivers = storage.getDrivers();
  let drivers = statusFilter === 'all' ? allDrivers : allDrivers.filter(d => d.status === statusFilter);
  if (search) {
    const q = search.toLowerCase();
    drivers = drivers.filter(d =>
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
      d.plateNumber.toLowerCase().includes(q) ||
      d.todaName.toLowerCase().includes(q) ||
      d.licenseNumber.toLowerCase().includes(q)
    );
  }

  const handleStatusChange = (id: string, newStatus: DriverProfile['status'], reason?: string) => {
    const updates: Partial<DriverProfile> = { status: newStatus };
    if (newStatus === 'suspended') {
      updates.suspendedAt = new Date().toISOString();
      updates.suspensionReason = reason || 'Administrative action';
    }
    storage.updateDriver(id, updates);
    showToast(`Driver status updated to ${newStatus}.`, 'success');
    setSelectedDriver(null);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="page" key={refreshKey}>
      <Header title="Driver Monitoring" subtitle="Track and manage active drivers" />

      <div className="page__content">
        {/* Stats Row */}
        <div className="driver-stats">
          <div className="driver-stats__item driver-stats__item--green">
            <span className="driver-stats__value">{allDrivers.filter(d => d.status === 'active').length}</span>
            <span className="driver-stats__label">Active</span>
          </div>
          <div className="driver-stats__item driver-stats__item--gray">
            <span className="driver-stats__value">{allDrivers.filter(d => d.status === 'inactive').length}</span>
            <span className="driver-stats__label">Inactive</span>
          </div>
          <div className="driver-stats__item driver-stats__item--orange">
            <span className="driver-stats__value">{allDrivers.filter(d => d.status === 'suspended').length}</span>
            <span className="driver-stats__label">Suspended</span>
          </div>
          <div className="driver-stats__item driver-stats__item--blue">
            <span className="driver-stats__value">{allDrivers.length}</span>
            <span className="driver-stats__label">Total Drivers</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-bar__search">
            <Search size={16} />
            <input placeholder="Search by name, plate, license..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-bar__btns">
            {['all', 'active', 'inactive', 'suspended'].map(s => (
              <button key={s} className={`filter-btn ${statusFilter === s ? 'filter-btn--active' : ''}`} onClick={() => setStatusFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Driver Cards */}
        {drivers.length === 0 ? (
          <div className="card">
            <div className="card__body">
              <div className="card__empty">
                <Users size={48} />
                <h3>No Drivers Found</h3>
              </div>
            </div>
          </div>
        ) : (
          <div className="driver-grid">
            {drivers.map(driver => (
              <div key={driver.id} className="driver-card" onClick={() => setSelectedDriver(driver)}>
                <div className="driver-card__avatar">
                  {driver.firstName[0]}{driver.lastName[0]}
                </div>
                <div className="driver-card__info">
                  <h4>{driver.firstName} {driver.lastName}</h4>
                  <p className="driver-card__plate">{driver.plateNumber}</p>
                  <p className="driver-card__toda">{driver.todaName}</p>
                  <div className="driver-card__rating">
                    <StarRating rating={Math.round(driver.averageRating)} size={14} />
                    <span>{driver.averageRating}</span>
                  </div>
                </div>
                <StatusBadge status={driver.status} size="sm" />
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <Modal isOpen={!!selectedDriver} onClose={() => setSelectedDriver(null)} title="Driver Details" size="md">
          {selectedDriver && (
            <div className="driver-detail">
              <div className="driver-detail__header">
                <div className="driver-detail__avatar">
                  {selectedDriver.firstName[0]}{selectedDriver.lastName[0]}
                </div>
                <div>
                  <h3>{selectedDriver.firstName} {selectedDriver.middleName ? selectedDriver.middleName + ' ' : ''}{selectedDriver.lastName}</h3>
                  <StatusBadge status={selectedDriver.status} />
                </div>
              </div>
              <div className="driver-detail__grid">
                <p><strong>License #:</strong> {selectedDriver.licenseNumber}</p>
                <p><strong>License Expiry:</strong> {new Date(selectedDriver.licenseExpiry).toLocaleDateString()}</p>
                <p><strong>Plate:</strong> {selectedDriver.plateNumber}</p>
                <p><strong>TODA:</strong> {selectedDriver.todaName}</p>
                <p><strong>Route:</strong> {selectedDriver.routeArea}</p>
                <p><strong>Phone:</strong> {selectedDriver.phone}</p>
                <p><strong>Email:</strong> {selectedDriver.email}</p>
                <p><strong>Address:</strong> {selectedDriver.address}</p>
                <p><strong>Rating:</strong> ⭐ {selectedDriver.averageRating} / 5</p>
                <p><strong>Registered:</strong> {new Date(selectedDriver.registeredAt).toLocaleDateString()}</p>
                {selectedDriver.suspensionReason && (
                  <p><strong>Suspension Reason:</strong> {selectedDriver.suspensionReason}</p>
                )}
              </div>
              <div className="driver-detail__actions">
                <h4>Manage Status</h4>
                <div className="driver-detail__btns">
                  {selectedDriver.status !== 'active' && (
                    <button className="btn btn--success btn--sm" onClick={() => handleStatusChange(selectedDriver.id, 'active')}>Activate</button>
                  )}
                  {selectedDriver.status !== 'inactive' && (
                    <button className="btn btn--outline btn--sm" onClick={() => handleStatusChange(selectedDriver.id, 'inactive')}>Deactivate</button>
                  )}
                  {selectedDriver.status !== 'suspended' && (
                    <button className="btn btn--warning btn--sm" onClick={() => handleStatusChange(selectedDriver.id, 'suspended', 'Administrative suspension')}>Suspend</button>
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
