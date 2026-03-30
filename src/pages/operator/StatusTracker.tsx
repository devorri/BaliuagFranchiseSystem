import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CheckCircle, Clock, FileSearch, XCircle, AlertCircle } from 'lucide-react';
import * as storage from '../../services/storageService';

export function StatusTracker() {
  const { user } = useAuth();
  if (!user) return null;

  const applications = storage.getApplicationsByUser(user.id)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const statusSteps = [
    { key: 'pending', label: 'Submitted', icon: Clock, desc: 'Application received and queued' },
    { key: 'under_review', label: 'Under Review', icon: FileSearch, desc: 'Being reviewed by LGU staff' },
    { key: 'approved', label: 'Approved', icon: CheckCircle, desc: 'Application approved' },
  ];

  const getStepIndex = (status: string) => {
    if (status === 'rejected') return -1;
    if (status === 'requires_revision') return -2;
    return statusSteps.findIndex(s => s.key === status);
  };

  return (
    <div className="page">
      <Header title="Track Status" subtitle="Monitor the progress of your applications" />

      <div className="page__content">
        {applications.length === 0 ? (
          <div className="card">
            <div className="card__body">
              <div className="card__empty">
                <Clock size={48} />
                <h3>No Applications to Track</h3>
                <p>Submit an application to see its progress here.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="tracker-list">
            {applications.map(app => {
              const currentStepIndex = getStepIndex(app.status);
              const isRejected = app.status === 'rejected';
              const needsRevision = app.status === 'requires_revision';

              return (
                <div key={app.id} className="card tracker-card">
                  <div className="card__header">
                    <div>
                      <h3 className="card__title">
                        {app.type === 'new' ? 'New Registration' : 'Renewal'} — {app.plateNumber}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {app.vehicleMake} {app.vehicleModel} • {app.todaName}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="card__body">
                    {isRejected ? (
                      <div className="tracker-rejected">
                        <XCircle size={32} className="tracker-rejected__icon" />
                        <h4>Application Rejected</h4>
                        {app.adminNotes && <p>{app.adminNotes}</p>}
                      </div>
                    ) : needsRevision ? (
                      <div className="tracker-revision">
                        <AlertCircle size={32} className="tracker-revision__icon" />
                        <h4>Revision Required</h4>
                        {app.adminNotes && <p>{app.adminNotes}</p>}
                      </div>
                    ) : (
                      <div className="tracker-timeline">
                        {statusSteps.map((step, i) => {
                          const isCompleted = i <= currentStepIndex;
                          const isCurrent = i === currentStepIndex;
                          const StepIcon = step.icon;

                          return (
                            <div key={step.key} className={`tracker-step ${isCompleted ? 'tracker-step--done' : ''} ${isCurrent ? 'tracker-step--current' : ''}`}>
                              <div className="tracker-step__icon">
                                <StepIcon size={18} />
                              </div>
                              <div className="tracker-step__info">
                                <span className="tracker-step__label">{step.label}</span>
                                <span className="tracker-step__desc">{step.desc}</span>
                              </div>
                              {i < statusSteps.length - 1 && <div className="tracker-step__line"></div>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
