import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { StarRating } from '../../components/ui/StarRating';
import { useToast } from '../../components/ui/Toast';
import { Send, CheckCircle } from 'lucide-react';
import * as storage from '../../services/storageService';

export function PassengerFeedback() {
  const { user } = useAuth();
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('general');
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;

  const drivers = storage.getDrivers().filter(d => d.status === 'active');
  const [selectedDriverId, setSelectedDriverId] = useState(driverId || '');

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { showToast('Please select a rating.', 'error'); return; }
    if (!selectedDriverId) { showToast('Please select a driver.', 'error'); return; }
    if (!comment.trim()) { showToast('Please enter a comment.', 'error'); return; }

    const driver = drivers.find(d => d.id === selectedDriverId);
    if (!driver) return;

    storage.createFeedback({
      driverId: selectedDriverId,
      driverName: `${driver.firstName} ${driver.lastName}`,
      passengerName: `${user.firstName} ${user.lastName}`,
      passengerContact: user.phone,
      rating,
      comment,
      category: category as 'service' | 'safety' | 'cleanliness' | 'punctuality' | 'general',
    });

    setSubmitted(true);
    showToast('Feedback submitted successfully!', 'success');
  };

  if (submitted) {
    return (
      <div className="page">
        <Header title="Feedback Submitted" subtitle="" />
        <div className="page__content">
          <div className="card">
            <div className="card__body">
              <div className="feedback-success">
                <CheckCircle size={64} className="feedback-success__icon" />
                <h2>Thank You!</h2>
                <p>Your feedback has been submitted and will help improve tricycle services.</p>
                <div className="feedback-success__actions">
                  <button className="btn btn--primary" onClick={() => { setSubmitted(false); setRating(0); setComment(''); setSelectedDriverId(''); }}>
                    Submit Another
                  </button>
                  <button className="btn btn--outline" onClick={() => navigate('/passenger')}>
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Header title="Rate a Driver" subtitle="Share your experience with a tricycle driver" />

      <div className="page__content">
        <div className="card" style={{ maxWidth: '640px' }}>
          <div className="card__body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Driver *</label>
                <select className="form-input" value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)} required>
                  <option value="">-- Choose a driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName} — {d.plateNumber} ({d.todaName})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDriver && (
                <div className="scan-result scan-result--verified" style={{ marginBottom: 'var(--space-lg)' }}>
                  <div className="scan-result__body" style={{ padding: 'var(--space-md)' }}>
                    <div className="scan-result__avatar">
                      {selectedDriver.firstName[0]}{selectedDriver.lastName[0]}
                    </div>
                    <div className="scan-result__info">
                      <h4>{selectedDriver.firstName} {selectedDriver.lastName}</h4>
                      <p>{selectedDriver.plateNumber} • {selectedDriver.todaName}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Your Rating *</label>
                <div className="feedback-rating">
                  <StarRating rating={rating} interactive onRate={setRating} size={32} />
                  <span className="feedback-rating__text">
                    {rating === 0 ? 'Tap a star' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="general">General</option>
                  <option value="service">Service Quality</option>
                  <option value="safety">Safety</option>
                  <option value="cleanliness">Cleanliness</option>
                  <option value="punctuality">Punctuality</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Your Comment *</label>
                <textarea className="form-input form-textarea" rows={4} placeholder="Share your ride experience..." value={comment} onChange={e => setComment(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn--primary btn--full">
                <Send size={18} /> Submit Feedback
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
