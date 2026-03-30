import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { DataTable } from '../../components/ui/DataTable';
import { CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';
import * as storage from '../../services/storageService';
import type { Application } from '../../types';

export function ApplicationReview() {
  const { showToast } = useToast();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const allApps = storage.getApplications();
  const apps = filter === 'all' ? allApps : allApps.filter(a => a.status === filter);

  const handleAction = (appId: string, action: 'approved' | 'rejected' | 'under_review' | 'requires_revision') => {
    const app = storage.updateApplication(appId, {
      status: action,
      adminNotes: adminNotes || undefined,
      reviewedBy: 'admin-001',
      reviewedAt: new Date().toISOString(),
    });

    if (app && action === 'approved') {
      // Create franchise
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const renewalDate = new Date(now.getTime() + 275 * 24 * 60 * 60 * 1000);

      storage.createFranchise({
        applicationId: appId,
        operatorId: app.applicantId,
        operatorName: app.applicantName,
        vehicleMake: app.vehicleMake,
        vehicleModel: app.vehicleModel,
        plateNumber: app.plateNumber,
        motorNumber: app.motorNumber,
        chassisNumber: app.chassisNumber,
        vehicleColor: app.vehicleColor,
        todaName: app.todaName,
        routeArea: app.routeArea,
        residency: app.residency,
        status: 'active',
        issuedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        renewalDate: renewalDate.toISOString(),
      });

      // Create driver profile
      const user = storage.getUserById(app.applicantId);
      if (user) {
        const existing = storage.getDriverByUserId(user.id);
        if (!existing) {
          storage.createDriver({
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            middleName: user.middleName,
            licenseNumber: `N-${Math.random().toString().substring(2, 12)}`,
            licenseExpiry: expiresAt.toISOString(),
            address: user.address,
            phone: user.phone,
            email: user.email,
            todaName: app.todaName,
            routeArea: app.routeArea,
            plateNumber: app.plateNumber,
            status: 'active',
            authorizedAt: now.toISOString(),
            averageRating: 0,
            totalTrips: 0,
          });
        }
      }
    }

    const labels = { approved: 'approved', rejected: 'rejected', under_review: 'marked for review', requires_revision: 'sent back for revision' };
    showToast(`Application ${labels[action]}.`, action === 'approved' ? 'success' : action === 'rejected' ? 'error' : 'info');
    setSelectedApp(null);
    setAdminNotes('');
    setRefreshKey(k => k + 1);
  };

  const columns = [
    { key: 'applicantName', label: 'Applicant' },
    { key: 'plateNumber', label: 'Plate #' },
    { key: 'type', label: 'Type', render: (item: Application) => item.type === 'new' ? 'New' : 'Renewal' },
    { key: 'todaName', label: 'TODA' },
    { key: 'residency', label: 'Residency', render: (item: Application) => item.residency === 'resident' ? 'Resident' : 'Non-Resident' },
    { key: 'totalFee', label: 'Fee', render: (item: Application) => `₱${item.totalFee.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (item: Application) => <StatusBadge status={item.status} size="sm" /> },
    { key: 'submittedAt', label: 'Submitted', render: (item: Application) => new Date(item.submittedAt).toLocaleDateString() },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (item: Application) => (
        <button className="btn btn--ghost btn--sm" onClick={(e) => { e.stopPropagation(); setSelectedApp(item); setAdminNotes(item.adminNotes || ''); }}>
          <Eye size={14} /> Review
        </button>
      ),
    },
  ];

  return (
    <div className="page" key={refreshKey}>
      <Header title="Application Review" subtitle="Review and process franchise applications" />

      <div className="page__content">
        {/* Filter */}
        <div className="filter-bar">
          {['all', 'pending', 'under_review', 'approved', 'rejected', 'requires_revision'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'under_review' ? 'Under Review' : f === 'requires_revision' ? 'Needs Revision' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && <span className="filter-btn__count">{allApps.filter(a => a.status === f).length}</span>}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="card__body">
            <DataTable
              columns={columns}
              data={apps}
              keyField="id"
              searchPlaceholder="Search by name, plate, TODA..."
              onRowClick={(item: Application) => { setSelectedApp(item); setAdminNotes(item.adminNotes || ''); }}
              emptyMessage="No applications found"
            />
          </div>
        </div>

        {/* Detail Modal */}
        <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Review" size="lg">
          {selectedApp && (
            <div className="app-detail">
              <div className="app-detail__header">
                <div>
                  <h3>{selectedApp.applicantName}</h3>
                  <p>ID: {selectedApp.id} • Submitted: {new Date(selectedApp.submittedAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={selectedApp.status} />
              </div>

              <div className="app-detail__grid">
                <div className="app-detail__section">
                  <h4>Application</h4>
                  <p><strong>Type:</strong> {selectedApp.type === 'new' ? 'New Registration' : 'Renewal'}</p>
                  <p><strong>Residency:</strong> {selectedApp.residency === 'resident' ? 'Resident' : 'Non-Resident'}</p>
                </div>
                <div className="app-detail__section">
                  <h4>Vehicle</h4>
                  <p><strong>Vehicle:</strong> {selectedApp.vehicleMake} {selectedApp.vehicleModel}</p>
                  <p><strong>Plate:</strong> {selectedApp.plateNumber}</p>
                  <p><strong>Color:</strong> {selectedApp.vehicleColor}</p>
                  <p><strong>Motor #:</strong> {selectedApp.motorNumber}</p>
                  <p><strong>Chassis #:</strong> {selectedApp.chassisNumber}</p>
                </div>
                <div className="app-detail__section">
                  <h4>Route</h4>
                  <p><strong>TODA:</strong> {selectedApp.todaName}</p>
                  <p><strong>Route:</strong> {selectedApp.routeArea}</p>
                </div>
                <div className="app-detail__section">
                  <h4>Documents ({selectedApp.documents.length})</h4>
                  {selectedApp.documents.map(doc => (
                    <div key={doc.id} className="app-detail__doc">
                      <span>{doc.name}</span>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>
                  ))}
                </div>
                <div className="app-detail__section">
                  <h4>Fee</h4>
                  <p><strong>Base Fee:</strong> ₱{selectedApp.baseFee.toLocaleString()}</p>
                  <p><strong>Late Penalty:</strong> ₱{selectedApp.latePenalty.toLocaleString()}</p>
                  <p><strong>Total:</strong> ₱{selectedApp.totalFee.toLocaleString()}</p>
                </div>
              </div>

              <div className="app-detail__action-section">
                <div className="form-group">
                  <label className="form-label">Admin Notes</label>
                  <textarea
                    className="form-input form-textarea"
                    rows={3}
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this application..."
                  />
                </div>
                <div className="app-detail__actions">
                  <button className="btn btn--success" onClick={() => handleAction(selectedApp.id, 'approved')}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button className="btn btn--outline" onClick={() => handleAction(selectedApp.id, 'under_review')}>
                    <Eye size={16} /> Mark Review
                  </button>
                  <button className="btn btn--warning" onClick={() => handleAction(selectedApp.id, 'requires_revision')}>
                    <AlertCircle size={16} /> Request Revision
                  </button>
                  <button className="btn btn--danger" onClick={() => handleAction(selectedApp.id, 'rejected')}>
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
