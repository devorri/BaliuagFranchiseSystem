import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="glass-container animate-fade-in" style={{ maxWidth: '600px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/baliuag-logo.png" alt="Baliuag Seal" style={{ height: '60px', width: 'auto', marginBottom: '0.75rem' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>Municipal Tricycle Feedback & Citation</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Lungsod ng Baliwag Public Citizen Portal</p>
        </div>

        {submitted ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <CheckCircle2 size={56} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>Salamat sa inyong Feedback!</h3>
            <p style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>
              Naisumite na ang inyong ulat sa Municipal Traffic Enforcement Office.
            </p>
            <Link to="/" className="btn-glass btn-primary-glass" style={{ display: 'inline-block', marginTop: '1.5rem', textDecoration: 'none' }}>
              Bumalik sa Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Driver / Operator Name</label>
              <input type="text" className="glass-input" value={driverName} onChange={e => setDriverName(e.target.value)} required placeholder="Pangalan ng Driver" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Plate / Body Number</label>
              <input type="text" className="glass-input" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} required placeholder="Halimbawa: 123-XYZ" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Pahayag o Komento (Feedback / Complaint Details)</label>
              <textarea className="glass-input" rows={4} value={comment} onChange={e => setComment(e.target.value)} required placeholder="Isulat ang inyong karanasan o komento..." />
            </div>

            <button type="submit" className="btn-glass btn-primary-glass" style={{ padding: '0.95rem', fontSize: '1rem' }}>
              <Send size={18} /> Submit Citizen Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
