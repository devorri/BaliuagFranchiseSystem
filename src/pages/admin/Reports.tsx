import { Header } from '../../components/layout/Header';
import { BarChart3 } from 'lucide-react';
import * as storage from '../../services/storageService';

export function Reports() {
  const stats = storage.getAdminStats();
  const payments = storage.getPayments().filter(p => p.status === 'completed');
  const feedback = storage.getFeedback();
  const franchises = storage.getFranchises();

  // Rating distribution
  const ratingDist = [1, 2, 3, 4, 5].map(r => feedback.filter(f => f.rating === r).length);
  const maxRatingCount = Math.max(...ratingDist, 1);

  // TODA distribution
  const todaCounts: Record<string, number> = {};
  franchises.forEach(f => { todaCounts[f.todaName] = (todaCounts[f.todaName] || 0) + 1; });
  const maxTodaCount = Math.max(...Object.values(todaCounts), 1);

  // Category distribution
  const catCounts: Record<string, number> = {};
  feedback.forEach(f => { catCounts[f.category] = (catCounts[f.category] || 0) + 1; });

  return (
    <div className="page">
      <Header title="Reports & Analytics" subtitle="System-wide statistics and insights" />
      <div className="page__content">
        {/* Summary Cards */}
        <div className="report-summary">
          <div className="report-summary__card">
            <h4>Total Revenue</h4>
            <span className="report-summary__value">₱{stats.totalRevenue.toLocaleString()}</span>
          </div>
          <div className="report-summary__card">
            <h4>Total Applications</h4>
            <span className="report-summary__value">{stats.totalApplications}</span>
          </div>
          <div className="report-summary__card">
            <h4>Active Franchises</h4>
            <span className="report-summary__value">{stats.activeFranchises}</span>
          </div>
          <div className="report-summary__card">
            <h4>Active Drivers</h4>
            <span className="report-summary__value">{stats.activeDrivers}</span>
          </div>
        </div>

        <div className="page__grid">
          {/* Application Status Chart */}
          <div className="card">
            <div className="card__header"><h3 className="card__title"><BarChart3 size={18} /> Application Status</h3></div>
            <div className="card__body">
              <div className="chart-bars">
                {[
                  { label: 'Pending', value: stats.pendingApplications, color: 'orange' },
                  { label: 'Under Review', value: stats.underReviewApplications, color: 'blue' },
                  { label: 'Approved', value: stats.approvedApplications, color: 'green' },
                  { label: 'Rejected', value: stats.rejectedApplications, color: 'red' },
                ].map(item => (
                  <div key={item.label} className="chart-bar">
                    <div className="chart-bar__label">{item.label}</div>
                    <div className="chart-bar__track">
                      <div className={`chart-bar__fill chart-bar__fill--${item.color}`} style={{ width: `${stats.totalApplications > 0 ? (item.value / stats.totalApplications) * 100 : 0}%` }}></div>
                    </div>
                    <div className="chart-bar__value">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="card">
            <div className="card__header"><h3 className="card__title">⭐ Rating Distribution</h3></div>
            <div className="card__body">
              <div className="chart-bars">
                {[5, 4, 3, 2, 1].map(r => (
                  <div key={r} className="chart-bar">
                    <div className="chart-bar__label">{r} Star{r > 1 ? 's' : ''}</div>
                    <div className="chart-bar__track">
                      <div className="chart-bar__fill chart-bar__fill--gold" style={{ width: `${(ratingDist[r - 1] / maxRatingCount) * 100}%` }}></div>
                    </div>
                    <div className="chart-bar__value">{ratingDist[r - 1]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TODA Distribution */}
          <div className="card">
            <div className="card__header"><h3 className="card__title">Franchises by TODA</h3></div>
            <div className="card__body">
              <div className="chart-bars">
                {Object.entries(todaCounts).map(([toda, count]) => (
                  <div key={toda} className="chart-bar">
                    <div className="chart-bar__label">{toda}</div>
                    <div className="chart-bar__track">
                      <div className="chart-bar__fill chart-bar__fill--blue" style={{ width: `${(count / maxTodaCount) * 100}%` }}></div>
                    </div>
                    <div className="chart-bar__value">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback Categories */}
          <div className="card">
            <div className="card__header"><h3 className="card__title">Feedback by Category</h3></div>
            <div className="card__body">
              <div className="chart-bars">
                {Object.entries(catCounts).map(([cat, count]) => (
                  <div key={cat} className="chart-bar">
                    <div className="chart-bar__label">{cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
                    <div className="chart-bar__track">
                      <div className="chart-bar__fill chart-bar__fill--green" style={{ width: `${feedback.length > 0 ? (count / feedback.length) * 100 : 0}%` }}></div>
                    </div>
                    <div className="chart-bar__value">{count}</div>
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
