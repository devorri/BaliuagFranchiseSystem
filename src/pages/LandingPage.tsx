import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Sparkles,
  Star,
  Wrench,
  QrCode,
  Search,
  ArrowRight,
  Phone,
  MapPin,
  Clock,
  Send,
  UserCheck,
  Users,
  CreditCard,
  CheckCircle2,
  User,
  Award,
  ClipboardList,
  Building,
  Megaphone
} from 'lucide-react';
import * as storage from '../services/storageService';
import * as supabaseService from '../services/supabaseService';
import type { Franchise, Advertisement, InformationItem } from '../types';

export function LandingPage() {
  const navigate = useNavigate();

  // Public MTOP Verification state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Franchise | null | 'not_found'>(null);
  const [franchises, setFranchises] = useState<Franchise[]>([]);

  // Dynamic Advertisements & Information state
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [informationItems, setInformationItems] = useState<InformationItem[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Public Feedback Form state
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackToda, setFeedbackToda] = useState('BASTODA');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Direct Inquiry state
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryContact, setInquiryContact] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  // Sample feedback items for display
  const [sampleReviews, setSampleReviews] = useState([
    {
      id: 'rev-1',
      name: 'Juan Manaloto',
      role: 'Tricycle Driver (BASTODA)',
      rating: 5,
      comment: 'The registration process is remarkably fast now! I used to wait in line all day at the Municipal Hall. Now my stenciling and TODA endorsement are processed online.',
      date: 'Recently',
    },
    {
      id: 'rev-2',
      name: 'Cap. Ernesto Santos',
      role: 'TODA President (BASTODA)',
      rating: 5,
      comment: 'Excellent digital portal for TODA Presidents. We can seamlessly endorse driver memberships right before forwarding them to the Municipal Admin.',
      date: '2 days ago',
    },
    {
      id: 'rev-3',
      name: 'Pedro Penduko',
      role: 'Franchise Operator (SMTODA)',
      rating: 5,
      comment: 'The GCash payment option and instant SMS reminders when the MTOP permit is nearing expiration make compliance effortless.',
      date: '1 week ago',
    }
  ]);

  useEffect(() => {
    storage.initializeData();
    const data = storage.getFranchises();
    setFranchises(data);

    // Load dynamic content from Supabase / Storage
    async function loadContent() {
      try {
        const [ads, info] = await Promise.all([
          supabaseService.getAdvertisementsAsync(),
          supabaseService.getInformationItemsAsync(),
        ]);
        setAdvertisements(ads.filter(a => a.isActive));
        setInformationItems(info.filter(i => i.isActive));
      } catch (err) {
        console.warn('Failed to load dynamic content:', err);
      }
    }
    loadContent();
  }, []);

  // Cycle dynamic advertisement
  useEffect(() => {
    if (advertisements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % advertisements.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [advertisements.length]);


  const handleVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    const found = franchises.find(f =>
      f.plateNumber.toLowerCase() === query ||
      f.mtopNumber.toLowerCase() === query ||
      f.driverName.toLowerCase().includes(query)
    );

    if (found) {
      setSearchResult(found);
    } else {
      setSearchResult('not_found');
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim() || !feedbackName.trim()) return;

    const newRev = {
      id: `rev-${Date.now()}`,
      name: feedbackName,
      role: `Driver / Member (${feedbackToda})`,
      rating: feedbackRating,
      comment: feedbackComment,
      date: 'Ngayon lang',
    };

    setSampleReviews([newRev, ...sampleReviews]);
    setFeedbackSubmitted(true);
    setFeedbackName('');
    setFeedbackComment('');
    setTimeout(() => setFeedbackSubmitted(false), 5000);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryMessage.trim()) return;

    setInquirySubmitted(true);
    setInquiryName('');
    setInquiryContact('');
    setInquiryMessage('');
    setTimeout(() => setInquirySubmitted(false), 5000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* TOP FLOATING GLASS NAVBAR */}
      <header style={{
        position: 'sticky',
        top: '1rem',
        zIndex: 100,
        maxWidth: '1320px',
        width: 'calc(100% - 2rem)',
        margin: '0 auto',
        padding: '0.75rem 1.5rem',
        borderRadius: '9999px',
        background: 'rgba(10, 24, 16, 0.65)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255,255,255,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <img src="/baliuag-logo.png" alt="Lungsod ng Baliwag" style={{ height: '42px', width: 'auto', filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.7))' }} />
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', display: 'block', lineHeight: 1.1 }}>
              Baliwag MTOP Portal
            </span>
            <span style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              City Government of Baliwag
            </span>
          </div>
        </div>

        <nav className="header-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a href="#top" style={{ padding: '0.45rem 0.85rem', color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            Home
          </a>
          <a href="#about-section" style={{ padding: '0.45rem 0.85rem', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            About Us
          </a>
          <a href="#workflow-section" style={{ padding: '0.45rem 0.85rem', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            Process Steps
          </a>
          <a href="#toda-directory" style={{ padding: '0.45rem 0.85rem', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            TODA Directory
          </a>
          <a href="#verification-section" style={{ padding: '0.45rem 0.85rem', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            Verify MTOP
          </a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/login" className="btn-glass" style={{ padding: '0.5rem 1.1rem', fontSize: '0.88rem' }}>
            <UserCheck size={16} /> Portal Login
          </Link>

          <Link to="/register" className="btn-glass btn-primary-glass" style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}>
            Register <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="top" style={{ padding: '3.5rem 1.25rem 2rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div className="glass-container animate-fade-in" style={{
          padding: '3.5rem 3rem',
          borderRadius: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>

            {/* Left Hero Text */}
            <div>
              <div className="pill-badge pill-cyan" style={{ marginBottom: '1.25rem', fontSize: '0.82rem', padding: '0.5rem 1.1rem' }}>
                <Sparkles size={14} /> CITY GOVERNMENT OF BALIWAG • MTOP SYSTEM
              </div>

              <h1 style={{ fontSize: '3.3rem', fontWeight: 800, lineHeight: '1.1', color: '#ffffff', marginBottom: '1.25rem' }}>
                Fast, Transparent & <span style={{ color: '#22c55e', fontStyle: 'italic' }}>Modern Online MTOP Franchise</span> Portal
              </h1>

              <p style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.65', marginBottom: '2rem' }}>
                The official web portal of the City of Baliwag for streamlined requirement submissions, stenciling inspection, Treasurer payment processing, TODA route approvals, and digital QR Code MTOP Permits.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                <button type="button" onClick={() => navigate('/register')} className="btn-glass btn-primary-glass" style={{ padding: '0.9rem 2.2rem', fontSize: '1.05rem' }}>
                  Get Started <ChevronRight size={20} />
                </button>
                <a href="#verification-section" className="btn-glass" style={{ padding: '0.9rem 1.75rem', fontSize: '1.05rem' }}>
                  <Search size={18} /> Verify Plate / MTOP
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <div>
                  <strong style={{ fontSize: '1.6rem', fontWeight: 800, color: '#22c55e', display: 'block', lineHeight: 1 }}>1,240+</strong>
                  <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Active Tricycle Franchises</span>
                </div>
                <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.15)' }} />
                <div>
                  <strong style={{ fontSize: '1.6rem', fontWeight: 800, color: '#eab308', display: 'block', lineHeight: 1 }}>18 TODA</strong>
                  <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Associations Synchronized</span>
                </div>
                <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.15)' }} />
                <div>
                  <strong style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', display: 'block', lineHeight: 1 }}>100%</strong>
                  <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Digital QR Permit Verified</span>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Widget Preview */}
            <div className="glass-card" style={{ padding: '2.25rem', background: 'rgba(10, 24, 16, 0.72)', border: '1px solid rgba(255,255,255,0.22)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
                <img src="/baliuag-logo.png" alt="Baliwag Seal" style={{ height: '56px', width: 'auto', filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.6))' }} />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Baliuag Municipal Portal</h3>
                  <span style={{ fontSize: '0.82rem', color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> Live System Active
                  </span>
                </div>
              </div>

              {/* Roles Quick Access Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>SYSTEM ROLE ACCESS</span>
                    <span className="pill-badge pill-emerald">4 Portals</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <Link to="/login" style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={15} /> Tricycle Driver
                    </Link>
                    <Link to="/login" style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Award size={15} /> TODA President
                    </Link>
                    <Link to="/login" style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ClipboardList size={15} /> Operator Portal
                    </Link>
                    <Link to="/login" style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Building size={15} /> Municipal Admin
                    </Link>
                  </div>
                </div>

                {/* DYNAMIC ANNOUNCEMENT / ADVERTISEMENT IN HERO CARD */}
                <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Megaphone size={14} /> {advertisements[currentAdIndex]?.category?.toUpperCase() || 'OFFICIAL NOTICE'}
                    </span>
                    {advertisements.length > 1 && (
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {currentAdIndex + 1}/{advertisements.length}
                      </span>
                    )}
                  </div>
                  <strong style={{ fontSize: '0.88rem', color: '#ffffff', display: 'block', marginBottom: '0.25rem' }}>
                    {advertisements[currentAdIndex]?.title || 'Annual MTOP Registration & Renewal'}
                  </strong>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {advertisements[currentAdIndex]?.description || 'You may now settle municipal franchising assessments via official GCash payment or at the City Treasury.'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* DYNAMIC ADVERTISEMENTS & CITY ADVISORIES SECTION */}
      {advertisements.length > 0 && (
        <section style={{ maxWidth: '1320px', width: '100%', margin: '0 auto', padding: '1rem 1.25rem' }}>
          <div className="glass-container" style={{ padding: '1.75rem 2rem', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <Megaphone size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                    Official Announcements and Public Advisories
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Managed through the City Government Admin Portal</span>
                </div>
              </div>
              <span className="pill-badge pill-cyan">{advertisements.length} Active Notices</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {advertisements.map((ad) => (
                <div key={ad.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className={`pill-badge ${ad.category === 'sponsor' ? 'pill-purple' : 'pill-cyan'}`} style={{ fontSize: '0.72rem' }}>
                        {ad.category.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {new Date(ad.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
                      {ad.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                      {ad.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ABOUT US / SYSTEM OVERVIEW SECTION */}
      <section id="about-section" style={{ padding: '4rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="pill-badge pill-emerald" style={{ marginBottom: '0.75rem' }}>Our Mission & Purpose</span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            About Baliwag MTOP System
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '700px', margin: '0 auto' }}>
            Engineered to deliver a fast, transparent, and hassle-free Motorized Tricycle Operator’s Permit (MTOP) issuance process for the City of Baliwag.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="icon-badge icon-badge-green">
              <Wrench size={22} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.6rem' }}>Stenciling & Inspection</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Direct physical verification of engine and chassis numbers at the City Stenciling Office to ensure passenger safety and OR/CR authenticity.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="icon-badge icon-badge-gold">
              <CreditCard size={22} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.6rem' }}>Treasurer & GCash Payment</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Settle prescribed MTOP fees directly at the Municipal Treasurer’s Office or via instant and secure GCash QR digital payment.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="icon-badge icon-badge-purple">
              <Users size={22} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.6rem' }}>TODA President Route Approval</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Online review and endorsement by the TODA President for route area authorization and driver membership before final Administrative grant.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="icon-badge icon-badge-blue">
              <QrCode size={22} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.6rem' }}>Instant QR Code Permit</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Automated generation of official digital MTOP Franchise permits equipped with cryptographic scannable QR Codes for quick digital inspection and verification.
            </p>
          </div>
        </div>
      </section>

      {/* WORKFLOW / STEP-BY-STEP PROCESS SECTION */}
      <section id="workflow-section" style={{ padding: '4rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div className="glass-container" style={{ padding: '3rem 2.5rem' }}>

          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="pill-badge pill-purple" style={{ marginBottom: '0.75rem' }}>Application Workflow</span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
              5 Steps to Obtain an MTOP Franchise
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
              Complete streamlined digital workflow from requirement submission to TODA endorsement and administrative MTOP issuance.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
              { step: '01', title: 'Submit Requirements', text: 'Upload OR/CR, Driver License, TODA Cert, and 2x2 Photo directly on the portal.', badge: 'Operator / Driver' },
              { step: '02', title: 'Inspection & Stenciling', text: 'Physical inspection of engine and chassis serial numbers to match registration records.', badge: 'Stenciling Office' },
              { step: '03', title: 'Payment of Fees', text: 'Pay prescribed franchise fees at the City Treasurer’s Office or via instant GCash QR.', badge: 'City Treasurer' },
              { step: '04', title: 'TODA Line Approval', text: 'TODA President verifies route eligibility and confirms association line endorsement.', badge: 'TODA President' },
              { step: '05', title: 'Admin Review & QR Permit', text: 'Municipal Licensing Administrator finalizes review and issues the official QR MTOP permit.', badge: 'Municipal Admin' },
            ].map((item, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'rgba(34, 197, 94, 0.4)', fontFamily: 'var(--font-heading)', display: 'block', lineHeight: 1, marginBottom: '0.5rem' }}>
                  {item.step}
                </span>
                <span className="pill-badge pill-emerald" style={{ fontSize: '0.7rem', padding: '0.2rem 0.65rem', marginBottom: '0.75rem' }}>
                  {item.badge}
                </span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>{item.title}</h4>
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.5' }}>{item.text}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button type="button" onClick={() => navigate('/register')} className="btn-glass btn-primary-glass" style={{ padding: '0.9rem 2.5rem', fontSize: '1rem' }}>
              Get Started Today <ChevronRight size={18} />
            </button>
          </div>

        </div>
      </section>

      {/* TODA DIRECTORY SECTION */}
      <section id="toda-directory" style={{ padding: '4rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="pill-badge pill-orange" style={{ marginBottom: '0.75rem' }}>Association Directory</span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            Accredited TODAs in the City of Baliwag
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
            Officially recognized tricycle associations cooperating with the City Government for organized route operations and standardized fares.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[
            { code: 'BASTODA', name: 'Baliuag Poblacion TODA', area: 'Poblacion - Public Market - Plaza Naning', fee: '₱500 / yr', pres: 'Cap. Ernesto Santos' },
            { code: 'SMTODA', name: 'Sabang Terminal TODA', area: 'Sabang - SM City Baliwag - DRT Highway', fee: '₱500 / yr', pres: 'Cap. Rodolfo Cruz' },
            { code: 'TARTODA', name: 'Tarcan Crossings TODA', area: 'Tarcan - Makinabang - Maharlika Highway', fee: '₱500 / yr', pres: 'Pres. Mario Dela Cruz' },
            { code: 'TANGTOD', name: 'Tangos Boundary TODA', area: 'Tangos - Concepcion - Sulivan Boundary', fee: '₱500 / yr', pres: 'Pres. Fernando Garcia' },
          ].map((toda, i) => (
            <div key={i} className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="pill-badge pill-cyan" style={{ fontSize: '0.8rem' }}>{toda.code}</span>
                <span style={{ fontSize: '0.82rem', color: '#22c55e', fontWeight: 700 }}>{toda.fee}</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>{toda.name}</h3>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                <MapPin size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Route:</strong> {toda.area}</span>
              </p>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                President: <strong style={{ color: '#ffffff' }}>{toda.pres}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DYNAMIC INFORMATION & PUBLIC GUIDELINES SECTION */}
      {informationItems.length > 0 && (
        <section style={{ padding: '4rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="pill-badge pill-emerald" style={{ marginBottom: '0.75rem' }}>Official Guidelines & Tariffs</span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
              City Ordinances & Public Advisories
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
              Managed via Admin Panel: latest passenger fare matrices, requirement checklists, and municipal transport regulations.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {informationItems.map(item => (
              <div key={item.id} className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="pill-badge pill-purple" style={{ fontSize: '0.75rem' }}>
                      {item.category === 'fare_matrix' ? 'Fare Matrix' :
                       item.category === 'guideline' ? 'Registration Guide' :
                       item.category === 'toda_info' ? 'TODA Information' : item.category.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {item.publishedDate}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.6rem' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PUBLIC VERIFICATION & QR LOOKUP SECTION */}
      <section id="verification-section" style={{ padding: '4rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div className="glass-container" style={{ padding: '3rem 2.5rem' }}>

          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="pill-badge pill-emerald" style={{ marginBottom: '0.75rem' }}>Public Verification</span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
              Verify MTOP Franchise Status & Plate Number
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
              Enter Plate Number (e.g. <strong style={{ color: '#22c55e' }}>123-XYZ</strong> or <strong style={{ color: '#22c55e' }}>456-ABC</strong>) or MTOP Permit Number to verify registration status.
            </p>
          </div>

          <form onSubmit={handleVerifySearch} style={{ maxWidth: '600px', margin: '0 auto 2rem auto', display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              className="glass-input"
              placeholder="Enter Plate Number or MTOP # (e.g. 456-ABC)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '0.9rem 1.25rem', fontSize: '1rem' }}
            />
            <button type="submit" className="btn-glass btn-primary-glass" style={{ padding: '0.9rem 1.75rem' }}>
              <Search size={18} /> Verify
            </button>
          </form>

          {/* Search Result Card */}
          {searchResult && searchResult !== 'not_found' && (
            <div className="glass-card animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto', padding: '2rem', border: '1px solid rgba(34, 197, 94, 0.4)', background: 'rgba(10, 24, 16, 0.85)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <span className="pill-badge pill-emerald" style={{ marginBottom: '0.5rem', gap: '0.4rem' }}><CheckCircle2 size={14} /> VALID & ACTIVE FRANCHISE</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>{searchResult.driverName}</h3>
                  <span style={{ fontSize: '0.9rem', color: '#22c55e', fontWeight: 700 }}>MTOP #: {searchResult.mtopNumber}</span>
                </div>
                <img src={searchResult.qrCodeData ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(searchResult.qrCodeData)}` : '/baliuag-logo.png'} alt="QR Code" style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px solid #22c55e' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '14px' }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Vehicle Plate Number</span>
                  <strong style={{ color: '#ffffff' }}>{searchResult.plateNumber}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>TODA Route</span>
                  <strong style={{ color: '#ffffff' }}>{searchResult.todaName}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Expiration Date</span>
                  <strong style={{ color: '#4ade80' }}>{new Date(searchResult.expiresAt).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Status</span>
                  <span className="pill-badge pill-emerald" style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}>{searchResult.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}

          {searchResult === 'not_found' && (
            <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fca5a5' }}>
              No active franchise records found matching <strong>"{searchQuery}"</strong>. Please verify the plate number and try again.
            </div>
          )}

        </div>
      </section>

      {/* CITIZEN REVIEWS & FEEDBACK SECTION */}
      <section id="feedback-section" style={{ padding: '4rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="pill-badge pill-purple" style={{ marginBottom: '0.75rem' }}>Citizen Voices</span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            Driver & Operator Testimonials
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
            Read experiences from tricycle operators and drivers utilizing the modern digital MTOP portal.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem', marginBottom: '3rem' }}>
          {sampleReviews.map(rev => (
            <div key={rev.id} className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.85rem' }}>
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <Star key={idx} size={18} fill="#eab308" color="#eab308" />
                  ))}
                </div>
                <p style={{ color: '#ffffff', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                  "{rev.comment}"
                </p>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#ffffff', fontSize: '0.92rem', display: 'block' }}>{rev.name}</strong>
                  <span style={{ fontSize: '0.78rem', color: '#22c55e' }}>{rev.role}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{rev.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Leave Feedback Form Box */}
        <div className="glass-container" style={{ padding: '2.5rem', maxWidth: '750px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            Submit Your Feedback
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '1.5rem' }}>
            Would you like to share your feedback or experience with the Baliwag MTOP System?
          </p>

          {feedbackSubmitted && (
            <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', border: '1px solid rgba(34, 197, 94, 0.4)', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> Thank you! Your feedback has been successfully submitted.
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Full Name *</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Juan Dela Cruz"
                  value={feedbackName}
                  onChange={e => setFeedbackName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Association / TODA</label>
                <select
                  className="glass-input glass-select"
                  value={feedbackToda}
                  onChange={e => setFeedbackToda(e.target.value)}
                >
                  <option value="BASTODA">BASTODA (Poblacion)</option>
                  <option value="SMTODA">SMTODA (Sabang)</option>
                  <option value="TARTODA">TARCAN TODA</option>
                  <option value="TANGTOD">TANGOS TODA</option>
                  <option value="COMMUTER">Commuter / Citizen</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Rating (1 - 5 Stars)</label>
              <div style={{ display: 'flex', gap: '0.5rem', cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <Star
                    key={num}
                    size={24}
                    fill={num <= feedbackRating ? '#eab308' : 'none'}
                    color={num <= feedbackRating ? '#eab308' : '#64748b'}
                    onClick={() => setFeedbackRating(num)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Your Comments / Feedback *</label>
              <textarea
                className="glass-input"
                rows={3}
                placeholder="Share your thoughts on the digital MTOP franchise experience..."
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-glass btn-primary-glass" style={{ padding: '0.85rem' }}>
              <Send size={18} /> Submit Feedback
            </button>
          </form>
        </div>
      </section>

      {/* DIRECT INQUIRY / CONTACT US SECTION */}
      <section id="contact-section" style={{ padding: '4rem 1.25rem 5rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div className="glass-container" style={{ padding: '3rem 2.5rem' }}>

          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="pill-badge pill-cyan" style={{ marginBottom: '0.75rem' }}>Direct Inquiries</span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
              Questions Regarding Your MTOP Application?
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
              Send an official inquiry directly to the Municipal Franchise & Licensing Office.
            </p>
          </div>

          {inquirySubmitted && (
            <div className="glass-panel" style={{ maxWidth: '650px', margin: '0 auto 1.5rem auto', padding: '1rem 1.25rem', border: '1px solid rgba(34, 197, 94, 0.4)', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> Thank you! Your inquiry has been forwarded to the Municipal Licensing Administrator.
            </div>
          )}

          <form onSubmit={handleInquirySubmit} style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Full Name *</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Juan Manaloto"
                  value={inquiryName}
                  onChange={e => setInquiryName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Email or Phone Number *</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="0918-123-4567 or email@gmail.com"
                  value={inquiryContact}
                  onChange={e => setInquiryContact(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Message or Question *</label>
              <textarea
                className="glass-input"
                rows={4}
                placeholder="Type your message regarding franchise requirements, stenciling schedule, etc..."
                value={inquiryMessage}
                onChange={e => setInquiryMessage(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-glass btn-primary-glass" style={{ padding: '0.9rem', fontSize: '1rem' }}>
              <Send size={18} /> Send Message
            </button>
          </form>
        </div>
      </section>

      {/* RICH FOOTER */}
      <footer style={{
        background: 'rgba(8, 20, 14, 0.85)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        padding: '3rem 1.5rem 2rem 1.5rem',
        marginTop: 'auto',
      }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
              <img src="/baliuag-logo.png" alt="Baliwag Seal" style={{ height: '44px', width: 'auto' }} />
              <div>
                <strong style={{ color: '#ffffff', fontSize: '1.1rem', display: 'block' }}>City of Baliwag</strong>
                <span style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: 700 }}>Tricycle Franchise & MTOP Office</span>
              </div>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6' }}>
              Streamlined, accessible public service for all tricycle operators, drivers, and TODA associations in Baliwag, Bulacan.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Office Information
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} style={{ color: '#22c55e' }} /> Baliuag Municipal Hall, Bulacan
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} style={{ color: '#22c55e' }} /> Monday - Friday: 8:00 AM - 5:00 PM
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} style={{ color: '#22c55e' }} /> Hotlines: (044) 798-0234 / 0918-123-4567
              </span>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>→ Operator & Driver Portal Login</Link>
              <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>→ TODA President Line Approvals</Link>
              <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>→ Municipal Administrator Review</Link>
              <Link to="/register" style={{ color: '#cbd5e1', textDecoration: 'none' }}>→ Register New Account</Link>
            </div>
          </div>

        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
          © 2026 City Government of Baliwag, Bulacan. All Rights Reserved. • Designed with Glassmorphism UI
        </div>
      </footer>

    </div>
  );
}
