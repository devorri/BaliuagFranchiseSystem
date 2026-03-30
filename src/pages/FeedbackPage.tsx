import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Send, CheckCircle } from 'lucide-react';
import { StarRating } from '../components/ui/StarRating';
import { useToast } from '../components/ui/Toast';
import * as storage from '../services/storageService';
import type { Feedback } from '../types';

export function FeedbackPage() {
  const { showToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [form, setForm] = useState({
    driverId: '',
    passengerName: '',
    passengerContact: '',
    comment: '',
    category: 'general' as Feedback['category'],
  });

  const drivers = storage.getDrivers().filter(d => d.status === 'active');

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showToast('Please select a rating.', 'error');
      return;
    }

    const driver = drivers.find(d => d.id === form.driverId);
    if (!driver) {
      showToast('Please select a driver.', 'error');
      return;
    }

    storage.createFeedback({
      driverId: form.driverId,
      driverName: `${driver.firstName} ${driver.lastName}`,
      passengerName: form.passengerName,
      passengerContact: form.passengerContact || undefined,
      rating,
      comment: form.comment,
      category: form.category,
    });

    setSubmitted(true);
    showToast('Thank you for your feedback!', 'success');
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-page__bg"></div>
        <div className="auth-card">
          <div className="feedback-success">
            <CheckCircle size={64} className="feedback-success__icon" />
            <h2>Thank You!</h2>
            <p>Your feedback has been submitted successfully. It will help us improve our services.</p>
            <div className="feedback-success__actions">
              <button className="btn btn--primary" onClick={() => { setSubmitted(false); setRating(0); setForm({ driverId: '', passengerName: '', passengerContact: '', comment: '', category: 'general' }); }}>
                Submit Another
              </button>
              <Link to="/" className="btn btn--glass">Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__bg"></div>
      <div className="auth-card auth-card--wide">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__brand">
            <Bike size={32} />
          </Link>
          <h1 className="auth-card__title">Passenger Feedback</h1>
          <p className="auth-card__subtitle">Help us improve tricycle services in Baliuag City</p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="driverId" className="form-label">Select Driver *</label>
            <select id="driverId" className="form-input" value={form.driverId} onChange={e => updateField('driverId', e.target.value)} required>
              <option value="">-- Choose a driver --</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName} — {d.plateNumber} ({d.todaName})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Your Rating *</label>
            <div className="feedback-rating">
              <StarRating rating={rating} interactive onRate={setRating} size={32} />
              <span className="feedback-rating__text">
                {rating === 0 ? 'Select a rating' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">Category</label>
            <select id="category" className="form-input" value={form.category} onChange={e => updateField('category', e.target.value)}>
              <option value="general">General</option>
              <option value="service">Service Quality</option>
              <option value="safety">Safety</option>
              <option value="cleanliness">Cleanliness</option>
              <option value="punctuality">Punctuality</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="passengerName" className="form-label">Your Name *</label>
              <input id="passengerName" type="text" className="form-input" placeholder="Your full name" value={form.passengerName} onChange={e => updateField('passengerName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="passengerContact" className="form-label">Contact (Optional)</label>
              <input id="passengerContact" type="text" className="form-input" placeholder="Phone or email" value={form.passengerContact} onChange={e => updateField('passengerContact', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="comment" className="form-label">Your Comment *</label>
            <textarea id="comment" className="form-input form-textarea" placeholder="Share your experience..." rows={4} value={form.comment} onChange={e => updateField('comment', e.target.value)} required />
          </div>

          <button type="submit" className="btn btn--primary btn--full">
            <Send size={18} /> Submit Feedback
          </button>
        </form>

        <div className="auth-card__footer">
          <p><Link to="/">← Back to Home</Link></p>
        </div>
      </div>
    </div>
  );
}
