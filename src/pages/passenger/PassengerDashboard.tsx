import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { StarRating } from '../../components/ui/StarRating';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { QrCode, MessageSquare, Search, Star, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as storage from '../../services/storageService';
import type { DriverProfile } from '../../types';

import { Modal } from '../../components/ui/Modal';
import { QRScanner } from '../../components/passenger/QRScanner';

export function PassengerDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [scanInput, setScanInput] = useState('');
  const [scannedDriver, setScannedDriver] = useState<DriverProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) return null;

  // ... (keep existing feedback and drivers logic)
  const allFeedback = storage.getFeedback();
  const myFeedback = allFeedback.filter(f => 
    f.passengerName.toLowerCase() === `${user.firstName} ${user.lastName}`.toLowerCase()
  );

  const allDrivers = storage.getDrivers();
  let filteredDrivers = allDrivers.filter(d => d.status === 'active');
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredDrivers = filteredDrivers.filter(d =>
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
      d.plateNumber.toLowerCase().includes(q) ||
      d.todaName.toLowerCase().includes(q)
    );
  }

  const handleManualVerify = () => {
    if (!scanInput.trim()) {
      showToast('Please enter a driver ID or plate number.', 'error');
      return;
    }
    processScanResult(scanInput.trim());
  };

  const processScanResult = (result: string) => {
    // Result could be a URL like "http://.../driver/drv-123" or just "drv-123" or "MC-1234"
    let idOrPlate = result;
    if (result.includes('/driver/')) {
      idOrPlate = result.split('/driver/')[1];
    }

    const driver = allDrivers.find(d => 
      d.id.toLowerCase() === idOrPlate.toLowerCase() || 
      d.plateNumber.toLowerCase() === idOrPlate.toLowerCase() ||
      d.plateNumber.toLowerCase().replace('-', '') === idOrPlate.toLowerCase().replace('-', '')
    );
    
    if (driver) {
      setScannedDriver(driver);
      setIsModalOpen(true);
      showToast('Driver identified!', 'success');
    } else {
      showToast('No driver found with that ID or plate number.', 'error');
    }
  };

  const franchise = scannedDriver?.franchiseId 
    ? storage.getFranchiseById(scannedDriver.franchiseId) 
    : null;
  const isVerified = scannedDriver?.status === 'active' && franchise?.status === 'active';

  return (
    <div className="page">
      <Header title="Passenger Dashboard" subtitle="Scan drivers, give feedback, and browse TODA drivers" />

      <div className="page__content">
        {/* QR Scanner / Verification Section */}
        <div className="card qr-scanner-card">
          <div className="card__header">
            <h3 className="card__title"><QrCode size={18} /> Verify a Driver</h3>
          </div>
          <div className="card__body">
            <div className="verify-options">
              <div className="verify-option-cam">
                <button className="btn btn--primary btn--lg btn--full" onClick={() => setIsScannerOpen(true)}>
                  <QrCode size={24} />
                  <span>Open Camera to Scan QR</span>
                </button>
                <p className="verify-hint">Scan the QR code found on the side of the tricycle.</p>
              </div>
              
              <div className="verify-divider">
                <span>OR</span>
              </div>

              <div className="verify-option-input">
                <label className="form-label">Manual Plate Number Entry</label>
                <div className="scan-input-row">
                  <input 
                    className="form-input" 
                    placeholder="e.g. MC-1234" 
                    value={scanInput} 
                    onChange={e => setScanInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleManualVerify()}
                  />
                  <button className="btn btn--outline" onClick={handleManualVerify}>
                    Verify
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Scanner Component */}
        <QRScanner 
          isOpen={isScannerOpen} 
          onClose={() => setIsScannerOpen(false)} 
          onScan={(text) => {
            setIsScannerOpen(false);
            processScanResult(text);
          }}
        />

        {/* Verification Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Verification Result"
          size="md"
        >
          {scannedDriver && (
            <div className={`scan-result-modal ${isVerified ? 'scan-result-modal--verified' : 'scan-result-modal--unverified'}`}>
              <div className="scan-result-modal__banner">
                {isVerified ? (
                  <><CheckCircle size={24} /> <span>OFFICIALLY VERIFIED</span></>
                ) : (
                  <><XCircle size={24} /> <span>UNAUTHORIZED / SUSPENDED</span></>
                )}
              </div>
              
              <div className="scan-result-modal__header">
                <div className="scan-result-modal__avatar">
                  {scannedDriver.firstName[0]}{scannedDriver.lastName[0]}
                </div>
                <div className="scan-result-modal__title">
                  <h2>{scannedDriver.firstName} {scannedDriver.lastName}</h2>
                  <div className="scan-result-modal__badge">
                    <StatusBadge status={scannedDriver.status} />
                  </div>
                </div>
              </div>

              <div className="scan-result-modal__grid">
                <div className="scan-item">
                  <span className="scan-item__label">Plate Number</span>
                  <span className="scan-item__value scan-item__plate">{scannedDriver.plateNumber}</span>
                </div>
                <div className="scan-item">
                  <span className="scan-item__label">TODA / Route</span>
                  <span className="scan-item__value">{scannedDriver.todaName}</span>
                </div>
                <div className="scan-item">
                  <span className="scan-item__label">Driver Rating</span>
                  <div className="scan-item__rating">
                    <StarRating rating={Math.round(scannedDriver.averageRating)} size={16} />
                    <span>{scannedDriver.averageRating} / 5</span>
                  </div>
                </div>
                {franchise && (
                  <div className="scan-item">
                    <span className="scan-item__label">Vehicle Info</span>
                    <span className="scan-item__value">{franchise.vehicleMake} {franchise.vehicleModel} ({franchise.vehicleColor})</span>
                  </div>
                )}
              </div>

              <div className="scan-result-modal__footer">
                <Link to={`/passenger/feedback/${scannedDriver.id}`} className="btn btn--primary btn--full">
                  <MessageSquare size={18} /> Rate This Driver
                </Link>
                <button className="btn btn--ghost btn--full" onClick={() => setIsModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        <div className="page__grid">
          {/* My Feedback History */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title"><Star size={18} /> My Feedback History</h3>
            </div>
            <div className="card__body">
              {myFeedback.length === 0 ? (
                <div className="card__empty">
                  <MessageSquare size={40} />
                  <h3>No Feedback Yet</h3>
                  <p>Rate a driver to see your feedback history here.</p>
                </div>
              ) : (
                <div className="mini-list">
                  {[...myFeedback].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(fb => (
                    <div key={fb.id} className="mini-list__item">
                      <div className="mini-list__info">
                        <span className="mini-list__title">
                          {'⭐'.repeat(fb.rating)} — {fb.driverName}
                        </span>
                        <span className="mini-list__sub">
                          {fb.category} • {new Date(fb.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <StatusBadge status={fb.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Browse Drivers */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Active Drivers</h3>
            </div>
            <div className="card__body">
              <div className="data-table__search" style={{ marginBottom: '12px' }}>
                <Search size={16} />
                <input 
                  placeholder="Search by name, plate, TODA..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
              </div>
              <div className="driver-browse-list">
                {filteredDrivers.map(d => (
                  <div key={d.id} className="driver-browse-item">
                    <div className="driver-browse-item__avatar">
                      {d.firstName[0]}{d.lastName[0]}
                    </div>
                    <div className="driver-browse-item__info">
                      <span className="driver-browse-item__name">{d.firstName} {d.lastName}</span>
                      <span className="driver-browse-item__detail">{d.plateNumber} • {d.todaName}</span>
                    </div>
                    <div className="driver-browse-item__actions">
                      <StarRating rating={Math.round(d.averageRating)} size={12} />
                      <Link to={`/driver/${d.id}`} className="btn btn--ghost btn--sm">
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
