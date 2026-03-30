import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StarRating } from '../../components/ui/StarRating';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { MessageSquare, Search } from 'lucide-react';
import * as storage from '../../services/storageService';
import type { Feedback } from '../../types';

export function FeedbackReview() {
  const { showToast } = useToast();
  const [selectedFb, setSelectedFb] = useState<Feedback | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminResponse, setAdminResponse] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const allFeedback = storage.getFeedback();
  let feedback = statusFilter === 'all' ? allFeedback : allFeedback.filter(f => f.status === statusFilter);
  if (search) {
    const q = search.toLowerCase();
    feedback = feedback.filter(f =>
      f.driverName.toLowerCase().includes(q) ||
      f.passengerName.toLowerCase().includes(q) ||
      f.comment.toLowerCase().includes(q)
    );
  }
  feedback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAction = (id: string, status: 'reviewed' | 'resolved') => {
    storage.updateFeedback(id, { status, adminResponse: adminResponse || undefined, reviewedAt: new Date().toISOString() });
    showToast(`Feedback ${status}.`, 'success');
    setSelectedFb(null);
    setAdminResponse('');
    setRefreshKey(k => k + 1);
  };

  const avgRating = allFeedback.length > 0
    ? Math.round((allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length) * 10) / 10 : 0;

  return (
    <div className="page" key={refreshKey}>
      <Header title="Feedback Review" subtitle="Review and manage passenger feedback" />
      <div className="page__content">
        <div className="driver-stats">
          <div className="driver-stats__item driver-stats__item--blue">
            <span className="driver-stats__value">{allFeedback.length}</span>
            <span className="driver-stats__label">Total</span>
          </div>
          <div className="driver-stats__item driver-stats__item--orange">
            <span className="driver-stats__value">{allFeedback.filter(f => f.status === 'pending').length}</span>
            <span className="driver-stats__label">Pending</span>
          </div>
          <div className="driver-stats__item driver-stats__item--green">
            <span className="driver-stats__value">{allFeedback.filter(f => f.status !== 'pending').length}</span>
            <span className="driver-stats__label">Reviewed</span>
          </div>
          <div className="driver-stats__item driver-stats__item--gold">
            <span className="driver-stats__value">⭐ {avgRating}</span>
            <span className="driver-stats__label">Avg Rating</span>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-bar__search">
            <Search size={16} />
            <input placeholder="Search feedback..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-bar__btns">
            {['all', 'pending', 'reviewed', 'resolved'].map(s => (
              <button key={s} className={`filter-btn ${statusFilter === s ? 'filter-btn--active' : ''}`} onClick={() => setStatusFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {feedback.length === 0 ? (
          <div className="card"><div className="card__body"><div className="card__empty"><MessageSquare size={48} /><h3>No Feedback Found</h3></div></div></div>
        ) : (
          <div className="feedback-list">
            {feedback.map(fb => (
              <div key={fb.id} className="feedback-card" onClick={() => { setSelectedFb(fb); setAdminResponse(fb.adminResponse || ''); }}>
                <div className="feedback-card__header">
                  <div><h4>{fb.passengerName}</h4><p className="feedback-card__driver">Driver: {fb.driverName}</p></div>
                  <div className="feedback-card__meta"><StatusBadge status={fb.status} size="sm" /><span className="feedback-card__date">{new Date(fb.createdAt).toLocaleDateString()}</span></div>
                </div>
                <div className="feedback-card__rating"><StarRating rating={fb.rating} size={16} /><span className="feedback-card__category">{fb.category}</span></div>
                <p className="feedback-card__comment">{fb.comment}</p>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={!!selectedFb} onClose={() => setSelectedFb(null)} title="Feedback Details" size="md">
          {selectedFb && (
            <div className="feedback-detail">
              <div className="feedback-detail__header"><StarRating rating={selectedFb.rating} size={24} /><StatusBadge status={selectedFb.status} /></div>
              <div className="feedback-detail__info">
                <p><strong>Passenger:</strong> {selectedFb.passengerName}</p>
                <p><strong>Driver:</strong> {selectedFb.driverName}</p>
                <p><strong>Category:</strong> {selectedFb.category}</p>
                <p><strong>Date:</strong> {new Date(selectedFb.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="feedback-detail__comment"><h4>Comment</h4><p>{selectedFb.comment}</p></div>
              <div className="form-group">
                <label className="form-label">Admin Response</label>
                <textarea className="form-input form-textarea" rows={3} value={adminResponse} onChange={e => setAdminResponse(e.target.value)} placeholder="Add response..." />
              </div>
              <div className="feedback-detail__actions">
                {selectedFb.status === 'pending' && <button className="btn btn--primary" onClick={() => handleAction(selectedFb.id, 'reviewed')}>Mark Reviewed</button>}
                {selectedFb.status !== 'resolved' && <button className="btn btn--success" onClick={() => handleAction(selectedFb.id, 'resolved')}>Resolve</button>}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
