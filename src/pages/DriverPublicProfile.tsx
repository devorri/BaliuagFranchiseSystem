import { useParams, Link } from 'react-router-dom';
import { Bike, Shield, Star, MapPin, Phone, Mail, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { StarRating } from '../components/ui/StarRating';
import { StatusBadge } from '../components/ui/StatusBadge';
import * as storage from '../services/storageService';

export function DriverPublicProfile() {
  const { driverId } = useParams<{ driverId: string }>();
  
  if (!driverId) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-page__bg"></div>
        <div className="public-profile-card public-profile-card--error">
          <XCircle size={48} />
          <h2>Driver Not Found</h2>
          <p>The driver profile you're looking for doesn't exist.</p>
          <Link to="/" className="btn btn--primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const driver = storage.getDriverById(driverId);
  const feedbackList = storage.getFeedbackByDriver(driverId);
  const franchise = driver?.franchiseId ? storage.getFranchiseById(driver.franchiseId) : null;

  if (!driver) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-page__bg"></div>
        <div className="public-profile-card public-profile-card--error">
          <XCircle size={48} />
          <h2>Driver Not Found</h2>
          <p>This driver profile could not be found in our system.</p>
          <Link to="/" className="btn btn--primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const isVerified = driver.status === 'active' && franchise?.status === 'active';
  const recentFeedback = [...feedbackList].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  return (
    <div className="public-profile-page">
      <div className="public-profile-page__bg"></div>
      
      {/* Top Nav */}
      <nav className="public-profile-nav">
        <Link to="/" className="landing__brand">
          <Bike size={24} />
          <div>
            <span className="landing__brand-name">Baliuag City</span>
            <span className="landing__brand-sub">Tricycle Registration System</span>
          </div>
        </Link>
      </nav>

      <div className="public-profile-container">
        {/* Main Profile Card */}
        <div className="public-profile-card">
          {/* Verification Banner */}
          <div className={`verification-banner ${isVerified ? 'verification-banner--verified' : 'verification-banner--unverified'}`}>
            {isVerified ? (
              <>
                <CheckCircle size={20} />
                <span>Verified & Authorized Driver</span>
              </>
            ) : (
              <>
                <XCircle size={20} />
                <span>{driver.status === 'suspended' ? 'Driver Suspended' : 'Not Verified'}</span>
              </>
            )}
          </div>

          {/* Avatar & Name */}
          <div className="public-profile-header">
            <div className="public-profile-avatar">
              {driver.firstName[0]}{driver.lastName[0]}
            </div>
            <h1 className="public-profile-name">
              {driver.firstName} {driver.middleName ? driver.middleName + ' ' : ''}{driver.lastName}
            </h1>
            <div className="public-profile-rating">
              <StarRating rating={Math.round(driver.averageRating)} size={22} />
              <span className="public-profile-rating-text">{driver.averageRating} / 5</span>
              <span className="public-profile-rating-count">({feedbackList.length} reviews)</span>
            </div>
          </div>

          {/* Info Grid */}
          <div className="public-profile-info">
            <div className="public-profile-info-item">
              <Shield size={16} />
              <div>
                <span className="public-profile-info-label">Status</span>
                <StatusBadge status={driver.status} />
              </div>
            </div>
            <div className="public-profile-info-item">
              <MapPin size={16} />
              <div>
                <span className="public-profile-info-label">TODA / Route</span>
                <span className="public-profile-info-value">{driver.todaName}</span>
                <span className="public-profile-info-sub">{driver.routeArea}</span>
              </div>
            </div>
            <div className="public-profile-info-item">
              <Bike size={16} />
              <div>
                <span className="public-profile-info-label">Plate Number</span>
                <span className="public-profile-info-value public-profile-plate">{driver.plateNumber}</span>
              </div>
            </div>
          </div>

          {/* Franchise Info */}
          {franchise && (
            <div className="public-profile-franchise">
              <h3>Franchise Details</h3>
              <div className="public-profile-franchise-grid">
                <div>
                  <span className="public-profile-info-label">Vehicle</span>
                  <span className="public-profile-info-value">{franchise.vehicleMake} {franchise.vehicleModel}</span>
                </div>
                <div>
                  <span className="public-profile-info-label">Color</span>
                  <span className="public-profile-info-value">{franchise.vehicleColor}</span>
                </div>
                <div>
                  <span className="public-profile-info-label">Franchise Status</span>
                  <StatusBadge status={franchise.status} />
                </div>
                <div>
                  <span className="public-profile-info-label">Valid Until</span>
                  <span className="public-profile-info-value">{new Date(franchise.expiresAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          )}

          {/* CTA: Give Feedback */}
          <div className="public-profile-cta">
            <Link to={`/feedback/${driverId}`} className="btn btn--primary btn--lg btn--full">
              <MessageSquare size={18} />
              Rate This Driver
            </Link>
          </div>
        </div>

        {/* Recent Reviews */}
        {recentFeedback.length > 0 && (
          <div className="public-profile-card">
            <h3 className="public-profile-reviews-title">
              <Star size={18} /> Recent Reviews
            </h3>
            <div className="public-profile-reviews">
              {recentFeedback.map(fb => (
                <div key={fb.id} className="public-review">
                  <div className="public-review__header">
                    <StarRating rating={fb.rating} size={14} />
                    <span className="public-review__date">{new Date(fb.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="public-review__comment">{fb.comment}</p>
                  <span className="public-review__author">— {fb.passengerName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="public-profile-card public-profile-contact">
          <h3>Contact Information</h3>
          <div className="public-profile-contact-list">
            <a href={`tel:${driver.phone}`} className="public-profile-contact-item">
              <Phone size={16} /> {driver.phone}
            </a>
            <a href={`mailto:${driver.email}`} className="public-profile-contact-item">
              <Mail size={16} /> {driver.email}
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="public-profile-footer">
        <p>Baliuag City Tricycle Registration System © {new Date().getFullYear()}</p>
        <p>Scan the driver's QR code to verify their authorization status.</p>
      </footer>
    </div>
  );
}
