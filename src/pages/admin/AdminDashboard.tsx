import { Header } from '../../components/layout/Header';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  FileText, Users, Shield, CreditCard, MessageSquare, Star,
  Clock, CheckCircle, ArrowRight, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import * as storage from '../../services/storageService';

export function AdminDashboard() {
  const stats = storage.getAdminStats();
  const recentApps = storage.getApplications()
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5);

  const recentFeedback = storage.getFeedback()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="page">
      <Header title="Admin Dashboard" subtitle="Franchise management overview" />

      <div className="page__content">
        {/* Stats */}
        <div className="stats-grid stats-grid--admin">
          <StatCard icon={FileText} label="Total Applications" value={stats.totalApplications} color="blue" />
          <StatCard icon={Clock} label="Pending Review" value={stats.pendingApplications + stats.underReviewApplications} color="orange" />
          <StatCard icon={Shield} label="Active Franchises" value={stats.activeFranchises} color="green" />
          <StatCard icon={Users} label="Active Drivers" value={stats.activeDrivers} color="purple" />
          <StatCard icon={CreditCard} label="Total Revenue" value={`₱${stats.totalRevenue.toLocaleString()}`} color="gold" />
          <StatCard icon={Star} label="Avg. Rating" value={`${stats.averageRating}/5`} color="gold" />
        </div>

        <div className="page__grid">
          {/* Recent Applications */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Recent Applications</h3>
              <Link to="/admin/applications" className="card__action">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card__body">
              <div className="mini-list">
                {recentApps.map(app => (
                  <div key={app.id} className="mini-list__item">
                    <div className="mini-list__info">
                      <span className="mini-list__title">{app.applicantName}</span>
                      <span className="mini-list__sub">{app.plateNumber} • {app.todaName}</span>
                    </div>
                    <StatusBadge status={app.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Application Breakdown</h3>
            </div>
            <div className="card__body">
              <div className="chart-bars">
                <div className="chart-bar">
                  <div className="chart-bar__label">Pending</div>
                  <div className="chart-bar__track">
                    <div className="chart-bar__fill chart-bar__fill--orange" style={{ width: `${stats.totalApplications > 0 ? (stats.pendingApplications / stats.totalApplications) * 100 : 0}%` }}></div>
                  </div>
                  <div className="chart-bar__value">{stats.pendingApplications}</div>
                </div>
                <div className="chart-bar">
                  <div className="chart-bar__label">Under Review</div>
                  <div className="chart-bar__track">
                    <div className="chart-bar__fill chart-bar__fill--blue" style={{ width: `${stats.totalApplications > 0 ? (stats.underReviewApplications / stats.totalApplications) * 100 : 0}%` }}></div>
                  </div>
                  <div className="chart-bar__value">{stats.underReviewApplications}</div>
                </div>
                <div className="chart-bar">
                  <div className="chart-bar__label">Approved</div>
                  <div className="chart-bar__track">
                    <div className="chart-bar__fill chart-bar__fill--green" style={{ width: `${stats.totalApplications > 0 ? (stats.approvedApplications / stats.totalApplications) * 100 : 0}%` }}></div>
                  </div>
                  <div className="chart-bar__value">{stats.approvedApplications}</div>
                </div>
                <div className="chart-bar">
                  <div className="chart-bar__label">Rejected</div>
                  <div className="chart-bar__track">
                    <div className="chart-bar__fill chart-bar__fill--red" style={{ width: `${stats.totalApplications > 0 ? (stats.rejectedApplications / stats.totalApplications) * 100 : 0}%` }}></div>
                  </div>
                  <div className="chart-bar__value">{stats.rejectedApplications}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Feedback */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Recent Feedback</h3>
              <Link to="/admin/feedback" className="card__action">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card__body">
              <div className="mini-list">
                {recentFeedback.map(fb => (
                  <div key={fb.id} className="mini-list__item">
                    <div className="mini-list__info">
                      <span className="mini-list__title">{fb.passengerName} → {fb.driverName}</span>
                      <span className="mini-list__sub">{'⭐'.repeat(fb.rating)} • {fb.category}</span>
                    </div>
                    <StatusBadge status={fb.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Driver Summary */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Driver Summary</h3>
              <Link to="/admin/drivers" className="card__action">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card__body">
              <div className="driver-summary">
                <div className="driver-summary__stat">
                  <TrendingUp size={16} />
                  <span className="driver-summary__num">{stats.activeDrivers}</span>
                  <span>Active</span>
                </div>
                <div className="driver-summary__stat">
                  <Clock size={16} />
                  <span className="driver-summary__num">{stats.inactiveDrivers}</span>
                  <span>Inactive</span>
                </div>
                <div className="driver-summary__stat">
                  <CheckCircle size={16} />
                  <span className="driver-summary__num">{stats.totalFeedback}</span>
                  <span>Feedbacks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
