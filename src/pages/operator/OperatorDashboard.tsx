import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FileText, CreditCard, Shield, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as storage from '../../services/storageService';

export function OperatorDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const applications = storage.getApplicationsByUser(user.id);
  const franchises = storage.getFranchisesByUser(user.id);
  const payments = storage.getPaymentsByUser(user.id);
  const driver = storage.getDriverByUserId(user.id);

  const pendingApps = applications.filter(a => a.status === 'pending' || a.status === 'under_review').length;
  const activeFranchises = franchises.filter(f => f.status === 'active').length;
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  const recentApps = [...applications].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5);

  // Check for franchise expiring soon
  const expiringFranchises = franchises.filter(f => {
    const expires = new Date(f.expiresAt);
    const daysUntilExpiry = (expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return f.status === 'active' && daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  });

  return (
    <div className="page">
      <Header title="Dashboard" subtitle="Overview of your franchise status" />

      <div className="page__content">
        {/* Alerts */}
        {expiringFranchises.length > 0 && (
          <div className="alert alert--warning">
            <AlertTriangle size={18} />
            <div>
              <strong>Renewal Reminder:</strong> You have {expiringFranchises.length} franchise(s) expiring within 90 days. Please prepare your renewal documents.
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon={FileText} label="Total Applications" value={applications.length} color="blue" />
          <StatCard icon={Clock} label="Pending/Under Review" value={pendingApps} color="orange" />
          <StatCard icon={Shield} label="Active Franchises" value={activeFranchises} color="green" />
          <StatCard icon={CreditCard} label="Total Paid" value={`₱${totalPaid.toLocaleString()}`} color="gold" />
        </div>

        <div className="page__grid">
          {/* Recent Applications */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Recent Applications</h3>
              <Link to="/dashboard/applications" className="card__action">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card__body">
              {recentApps.length === 0 ? (
                <div className="card__empty">
                  <p>No applications yet.</p>
                  <Link to="/dashboard/apply" className="btn btn--primary btn--sm">Apply Now</Link>
                </div>
              ) : (
                <div className="mini-list">
                  {recentApps.map(app => (
                    <div key={app.id} className="mini-list__item">
                      <div className="mini-list__info">
                        <span className="mini-list__title">{app.type === 'new' ? 'New Registration' : 'Renewal'} — {app.plateNumber}</span>
                        <span className="mini-list__sub">{new Date(app.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <StatusBadge status={app.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Quick Actions</h3>
            </div>
            <div className="card__body">
              <div className="quick-actions">
                <Link to="/dashboard/apply" className="quick-action">
                  <FileText size={20} />
                  <span>New Application</span>
                </Link>
                <Link to="/dashboard/payments" className="quick-action">
                  <CreditCard size={20} />
                  <span>Make Payment</span>
                </Link>
                <Link to="/dashboard/status" className="quick-action">
                  <Clock size={20} />
                  <span>Track Status</span>
                </Link>
                <Link to="/dashboard/profile" className="quick-action">
                  <Shield size={20} />
                  <span>My Profile</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          {driver && (
            <div className="card">
              <div className="card__header">
                <h3 className="card__title">Driver Status</h3>
              </div>
              <div className="card__body">
                <div className="driver-info-card">
                  <div className="driver-info-card__avatar">
                    {driver.firstName[0]}{driver.lastName[0]}
                  </div>
                  <div className="driver-info-card__details">
                    <h4>{driver.firstName} {driver.lastName}</h4>
                    <p>License: {driver.licenseNumber}</p>
                    <p>Plate: {driver.plateNumber}</p>
                    <p>TODA: {driver.todaName}</p>
                    <p>Rating: ⭐ {driver.averageRating} / 5</p>
                    <StatusBadge status={driver.status} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Franchise Info */}
          {franchises.length > 0 && (
            <div className="card">
              <div className="card__header">
                <h3 className="card__title">My Franchises</h3>
              </div>
              <div className="card__body">
                <div className="mini-list">
                  {franchises.map(f => (
                    <div key={f.id} className="mini-list__item">
                      <div className="mini-list__info">
                        <span className="mini-list__title">{f.plateNumber} — {f.vehicleMake} {f.vehicleModel}</span>
                        <span className="mini-list__sub">Expires: {new Date(f.expiresAt).toLocaleDateString()}</span>
                      </div>
                      <StatusBadge status={f.status} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
