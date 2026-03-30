import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { FileText, Eye } from 'lucide-react';
import * as storage from '../../services/storageService';
import type { Application } from '../../types';

export function MyApplications() {
  const { user } = useAuth();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  if (!user) return null;

  const applications = storage.getApplicationsByUser(user.id)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return (
    <div className="page">
      <Header title="My Applications" subtitle="View and track your franchise applications" />

      <div className="page__content">
        {applications.length === 0 ? (
          <div className="card">
            <div className="card__body">
              <div className="card__empty">
                <FileText size={48} />
                <h3>No Applications Yet</h3>
                <p>You haven't submitted any franchise applications.</p>
                <a href="/dashboard/apply" className="btn btn--primary">Submit Application</a>
              </div>
            </div>
          </div>
        ) : (
          <div className="app-list">
            {applications.map(app => (
              <div key={app.id} className="app-card" onClick={() => setSelectedApp(app)}>
                <div className="app-card__left">
                  <div className="app-card__icon">
                    <FileText size={20} />
                  </div>
                  <div className="app-card__info">
                    <h4 className="app-card__title">
                      {app.type === 'new' ? 'New Registration' : 'Renewal'} — {app.plateNumber}
                    </h4>
                    <p className="app-card__sub">
                      {app.vehicleMake} {app.vehicleModel} • {app.todaName}
                    </p>
                    <p className="app-card__date">
                      Submitted: {new Date(app.submittedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="app-card__right">
                  <StatusBadge status={app.status} />
                  <button className="btn btn--ghost btn--sm">
                    <Eye size={14} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Details" size="lg">
          {selectedApp && (
            <div className="app-detail">
              <div className="app-detail__header">
                <div>
                  <h3>{selectedApp.type === 'new' ? 'New Registration' : 'Renewal'}</h3>
                  <p>ID: {selectedApp.id}</p>
                </div>
                <StatusBadge status={selectedApp.status} />
              </div>

              <div className="app-detail__grid">
                <div className="app-detail__section">
                  <h4>Vehicle Information</h4>
                  <p><strong>Make/Model:</strong> {selectedApp.vehicleMake} {selectedApp.vehicleModel}</p>
                  <p><strong>Plate Number:</strong> {selectedApp.plateNumber}</p>
                  <p><strong>Color:</strong> {selectedApp.vehicleColor}</p>
                  <p><strong>Motor #:</strong> {selectedApp.motorNumber}</p>
                  <p><strong>Chassis #:</strong> {selectedApp.chassisNumber}</p>
                </div>

                <div className="app-detail__section">
                  <h4>Route Info</h4>
                  <p><strong>TODA:</strong> {selectedApp.todaName}</p>
                  <p><strong>Route:</strong> {selectedApp.routeArea}</p>
                  <p><strong>Residency:</strong> {selectedApp.residency === 'resident' ? 'Resident' : 'Non-Resident'}</p>
                </div>

                <div className="app-detail__section">
                  <h4>Documents</h4>
                  {selectedApp.documents.map(doc => (
                    <div key={doc.id} className="app-detail__doc">
                      <span>{doc.name}</span>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>
                  ))}
                </div>

                <div className="app-detail__section">
                  <h4>Fee Summary</h4>
                  <p><strong>Base Fee:</strong> ₱{selectedApp.baseFee.toLocaleString()}</p>
                  {selectedApp.latePenalty > 0 && <p><strong>Late Penalty:</strong> ₱{selectedApp.latePenalty.toLocaleString()}</p>}
                  <p><strong>Total:</strong> ₱{selectedApp.totalFee.toLocaleString()}</p>
                </div>

                {selectedApp.adminNotes && (
                  <div className="app-detail__section app-detail__section--full">
                    <h4>Admin Notes</h4>
                    <p className="app-detail__notes">{selectedApp.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
