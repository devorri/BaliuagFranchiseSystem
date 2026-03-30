import { Link } from 'react-router-dom';
import {
  Bike, FileText, QrCode, Shield, Calculator, LayoutDashboard,
  Receipt, Users, MessageSquare, ArrowRight, CheckCircle
} from 'lucide-react';

export function LandingPage() {
  const features = [
    { icon: FileText, title: 'Online Registration', desc: 'Submit applications and upload documents electronically — no more long queues.' },
    { icon: QrCode, title: 'QR Code Payment', desc: 'Pay franchise fees instantly via QR code — cashless, safe, and convenient.' },
    { icon: Shield, title: 'Franchise Tracking', desc: 'Monitor franchise status, validity, and compliance in real time.' },
    { icon: Calculator, title: 'Auto Fee Assessment', desc: 'Automatic fee calculation with late penalty assessment based on schedules.' },
    { icon: LayoutDashboard, title: 'Applicant Dashboard', desc: 'Track applications, view payment history, and manage your profile easily.' },
    { icon: Receipt, title: 'Digital Receipts', desc: 'Receive instant digital payment confirmations for your records.' },
    { icon: Users, title: 'Driver Monitoring', desc: 'Track active drivers to ensure only authorized operators are on the road.' },
    { icon: MessageSquare, title: 'Passenger Feedback', desc: 'Rate drivers and submit comments to improve service quality.' },
  ];

  const steps = [
    { num: '01', title: 'Create Account', desc: 'Register as a tricycle operator with your basic information.' },
    { num: '02', title: 'Submit Application', desc: 'Fill out the franchise application and upload required documents.' },
    { num: '03', title: 'Pay via QR Code', desc: 'Scan the QR code to pay your franchise fees electronically.' },
    { num: '04', title: 'Get Approved', desc: 'LGU staff reviews your application and you receive your franchise.' },
  ];

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing__nav">
        <div className="landing__nav-inner">
          <Link to="/" className="landing__brand">
            <Bike size={28} />
            <div>
              <span className="landing__brand-name">Baliuag City</span>
              <span className="landing__brand-sub">Tricycle Registration System</span>
            </div>
          </Link>
          <div className="landing__nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Link to="/feedback" className="landing__nav-feedback">Give Feedback</Link>
            <Link to="/login" className="btn btn--outline btn--sm">Login</Link>
            <Link to="/register" className="btn btn--primary btn--sm">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing__hero">
        <div className="landing__hero-bg"></div>
        <div className="landing__hero-content">
          <div className="landing__hero-badge">
            <CheckCircle size={14} /> Official LGU Digital Platform
          </div>
          <h1 className="landing__hero-title">
            Modernizing Tricycle
            <span className="landing__hero-highlight"> Franchise Management</span>
            <br />in Baliuag City
          </h1>
          <p className="landing__hero-desc">
            A web-based system that streamlines tricycle registration, enables cashless QR code payments,
            and efficiently monitors franchises for the Baliuag City Local Government Unit.
          </p>
          <div className="landing__hero-actions">
            <Link to="/register" className="btn btn--primary btn--lg">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn--glass btn--lg">
              Login to Dashboard
            </Link>
          </div>
          <div className="landing__hero-stats">
            <div className="landing__stat">
              <span className="landing__stat-value">500+</span>
              <span className="landing__stat-label">Registered Operators</span>
            </div>
            <div className="landing__stat">
              <span className="landing__stat-value">8</span>
              <span className="landing__stat-label">TODA Routes</span>
            </div>
            <div className="landing__stat">
              <span className="landing__stat-value">24/7</span>
              <span className="landing__stat-label">Online Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing__features" id="features">
        <div className="landing__section-inner">
          <div className="landing__section-header">
            <span className="landing__section-tag">System Features</span>
            <h2 className="landing__section-title">Everything You Need in One Platform</h2>
            <p className="landing__section-desc">
              From registration to payment, our system covers the complete franchise lifecycle.
            </p>
          </div>
          <div className="landing__features-grid">
            {features.map((feature, i) => (
              <div key={i} className="landing__feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="landing__feature-icon">
                  <feature.icon size={24} />
                </div>
                <h3 className="landing__feature-title">{feature.title}</h3>
                <p className="landing__feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing__how" id="how-it-works">
        <div className="landing__section-inner">
          <div className="landing__section-header">
            <span className="landing__section-tag">Process</span>
            <h2 className="landing__section-title">How It Works</h2>
            <p className="landing__section-desc">
              Get your tricycle franchise in four simple steps.
            </p>
          </div>
          <div className="landing__steps">
            {steps.map((step, i) => (
              <div key={i} className="landing__step">
                <div className="landing__step-num">{step.num}</div>
                <h3 className="landing__step-title">{step.title}</h3>
                <p className="landing__step-desc">{step.desc}</p>
                {i < steps.length - 1 && <div className="landing__step-connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing__cta">
        <div className="landing__section-inner">
          <div className="landing__cta-card">
            <h2>Ready to Register Your Franchise?</h2>
            <p>Join hundreds of tricycle operators who have already streamlined their franchise management.</p>
            <div className="landing__cta-actions">
              <Link to="/register" className="btn btn--primary btn--lg">
                Create Account <ArrowRight size={18} />
              </Link>
              <Link to="/feedback" className="btn btn--glass btn--lg">
                Give Driver Feedback
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <div className="landing__footer-inner">
          <div className="landing__footer-brand">
            <Bike size={24} />
            <span>Baliuag City Tricycle Registration System</span>
          </div>
          <p className="landing__footer-copy">
            © {new Date().getFullYear()} Baliuag City Local Government Unit. All rights reserved.
          </p>
          <p className="landing__footer-note">
            This is a demo system for the Baliuag City TODA Federation.
          </p>
        </div>
      </footer>
    </div>
  );
}
