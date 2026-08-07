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
  Building
} from 'lucide-react';
import * as storage from '../services/storageService';
import type { Franchise } from '../types';

export function LandingPage() {
  const navigate = useNavigate();
  
  // Public MTOP Verification state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Franchise | null | 'not_found'>(null);
  const [franchises, setFranchises] = useState<Franchise[]>([]);

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
      comment: 'Napakabilis na ng proseso! Dati mag-hapon ako pumipila sa Municipal Hall. Ngayon naberipika agad ang stenciling at TODA route fee ko sa cellphone.',
      date: 'Kamakailan lamang',
    },
    {
      id: 'rev-2',
      name: 'Cap. Ernesto Santos',
      role: 'TODA President (BASTODA)',
      rating: 5,
      comment: 'Magandang sistema para sa aming mga TODA President. Madali naming naaaprubahan ang route membership ng driver bago ipadala sa Municipal Admin.',
      date: '2 araw ang nakalipas',
    },
    {
      id: 'rev-3',
      name: 'Pedro Penduko',
      role: 'Franchise Operator (SMTODA)',
      rating: 5,
      comment: 'May GCash payment option na at instant SMS reminder pa kapag malapit na mag-expire ang MTOP permit. Napakalaking tulong!',
      date: '1 linggo ang nakalipas',
    }
  ]);

  useEffect(() => {
    storage.initializeData();
    const data = storage.getFranchises();
    setFranchises(data);
  }, []);

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
              Pamahalaang Lungsod ng Baliwag
            </span>
          </div>
        </div>

        <nav className="header-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a href="#top" style={{ padding: '0.45rem 0.85rem', color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            Home
          </a>
          <a href="#about-section" style={{ padding: '0.45rem 0.85rem', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            Sino Kami
          </a>
          <a href="#workflow-section" style={{ padding: '0.45rem 0.85rem', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            Mga Hakbang
          </a>
          <a href="#toda-directory" style={{ padding: '0.45rem 0.85rem', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            Direktoryo ng TODA
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
            Mag-rehistro <ArrowRight size={16} />
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
                <Sparkles size={14} /> PAMAHALAANG LUNGSOD NG BALIWAG • MTOP SYSTEM
              </div>

              <h1 style={{ fontSize: '3.3rem', fontWeight: 800, lineHeight: '1.1', color: '#ffffff', marginBottom: '1.25rem' }}>
                Mabilis, Transparante, at <span style={{ color: '#22c55e', fontStyle: 'italic' }}>Modernong MTOP Franchise</span> Online
              </h1>

              <p style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.65', marginBottom: '2rem' }}>
                Ang opisyal na web portal ng Lungsod ng Baliwag para sa mas mabilis na pagpasa ng requirements, stenciling inspection, Treasurer payment, TODA route approval, at instant digital QR Code MTOP Permit.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                <button type="button" onClick={() => navigate('/register')} className="btn-glass btn-primary-glass" style={{ padding: '0.9rem 2.2rem', fontSize: '1.05rem' }}>
                  Magsimula ng Aplikasyon <ChevronRight size={20} />
                </button>
                <a href="#verification-section" className="btn-glass" style={{ padding: '0.9rem 1.75rem', fontSize: '1.05rem' }}>
                  <Search size={18} /> Suriin ang Plaka / MTOP
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

                <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>OFFICIAL ANNOUNCEMENT</span>
                  <p style={{ fontSize: '0.88rem', color: '#ffffff', lineHeight: 1.4 }}>
                    Maaari na kayong magbayad sa Municipal Treasurer sa pamamagitan ng <strong>GCash cashless transaction</strong>.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ABOUT US / SYSTEM OVERVIEW SECTION */}
      <section id="about-section" style={{ padding: '4rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="pill-badge pill-emerald" style={{ marginBottom: '0.75rem' }}>Sino Kami at Layunin</span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            Tungkol sa Baliwag MTOP System
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '700px', margin: '0 auto' }}>
            Dinisenyo upang gawing mabilis, ligtas, at walang abala ang proseso ng pagkuha ng Motorized Tricycle Operator’s Permit (MTOP) sa Lungsod ng Baliwag.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="icon-badge icon-badge-green">
              <Wrench size={22} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.6rem' }}>Stenciling & Inspection</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Direktang beripikasyon ng makina at chassis number sa City Stenciling Office upang matiyak ang kaligtasan at pagpapatunay ng OR/CR.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="icon-badge icon-badge-gold">
              <CreditCard size={22} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.6rem' }}>Treasurer & GCash Payment</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Magbayad ng batayang MTOP fee sa Municipal Treasurer’s Office o sa pamamagitan ng mabilis at ligtas na GCash QR payment.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="icon-badge icon-badge-purple">
              <Users size={22} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.6rem' }}>TODA President Route Approval</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Online review at approval ng TODA President para sa route fee at membership ng driver bago ang pinal na pag-apruba ng Admin.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="icon-badge icon-badge-blue">
              <QrCode size={22} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.6rem' }}>Instant QR Code Permit</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Awtomatikong pag-generate ng digital MTOP Franchise permit na may scannable QR Code para sa mabilis na pagberipika ng traffic enforcers.
            </p>
          </div>
        </div>
      </section>

      {/* WORKFLOW / STEP-BY-STEP PROCESS SECTION */}
      <section id="workflow-section" style={{ padding: '4rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div className="glass-container" style={{ padding: '3rem 2.5rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="pill-badge pill-purple" style={{ marginBottom: '0.75rem' }}>Proseso ng Aplikasyon</span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
              5 Hakbang sa Pagkuha ng MTOP Franchise
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
              Kumpletong workflow mula sa Driver application hanggang sa TODA at Admin MTOP approval.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
              { step: '01', title: 'Submit Requirements', text: 'I-upload ang OR/CR, Barangay Clearance, Lisensya, TODA Cert, at ID photo sa portal.', badge: 'Driver Role' },
              { step: '02', title: 'Inspection & Stenciling', text: 'Sinusuri ang makina at chassis number sa Stenciling Office upang tumugma sa rehistro.', badge: 'Inspector Office' },
              { step: '03', title: 'Payment of Fees', text: 'Binabayaran ang batayang MTOP fee sa Treasurer’s Office o GCash cashless option.', badge: 'Treasurer Office' },
              { step: '04', title: 'TODA Line Approval', text: 'Aprobahan ng TODA President ang linya at tumatanggap ng route & membership fee.', badge: 'TODA President' },
              { step: '05', title: 'Admin Review & QR Permit', text: 'Fina-finalize ng Municipal Admin at inaaprubahan ang MTOP QR Permit certificate.', badge: 'Admin Role' },
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
              Magsimula Na Ngayon <ChevronRight size={18} />
            </button>
          </div>

        </div>
      </section>

      {/* TODA DIRECTORY SECTION */}
      <section id="toda-directory" style={{ padding: '4rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="pill-badge pill-orange" style={{ marginBottom: '0.75rem' }}>Direktoryo ng Asosasyon</span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            Rehistradong TODA sa Lungsod ng Baliwag
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
            Sumasang-ayon at kinikilala ng Pamahalaang Lungsod para sa proteksyon at pagsasaayos ng linya at pasahe.
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
                <span><strong>Ruta:</strong> {toda.area}</span>
              </p>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                President: <strong style={{ color: '#ffffff' }}>{toda.pres}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PUBLIC VERIFICATION & QR LOOKUP SECTION */}
      <section id="verification-section" style={{ padding: '4rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div className="glass-container" style={{ padding: '3rem 2.5rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="pill-badge pill-emerald" style={{ marginBottom: '0.75rem' }}>Public Verification</span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
              Suriin ang Status ng MTOP Franchise / Plaka
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
              I-type ang Plate Number (hal. <strong style={{ color: '#22c55e' }}>123-XYZ</strong> o <strong style={{ color: '#22c55e' }}>456-ABC</strong>) o MTOP Permit Number para suriin ang aktibong estado.
            </p>
          </div>

          <form onSubmit={handleVerifySearch} style={{ maxWidth: '600px', margin: '0 auto 2rem auto', display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              className="glass-input"
              placeholder="I-type ang Plate Number o MTOP # (hal. 456-ABC)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '0.9rem 1.25rem', fontSize: '1rem' }}
            />
            <button type="submit" className="btn-glass btn-primary-glass" style={{ padding: '0.9rem 1.75rem' }}>
              <Search size={18} /> Suriin
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
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Plaka ng Sasakyan</span>
                  <strong style={{ color: '#ffffff' }}>{searchResult.plateNumber}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>TODA Route</span>
                  <strong style={{ color: '#ffffff' }}>{searchResult.todaName}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Petsa ng Pag-expire</span>
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
              Walang nahanap na aktibong rehistro para sa query na <strong>"{searchQuery}"</strong>. Mangyaring suriin ang plaka at sumubok muli.
            </div>
          )}

        </div>
      </section>

      {/* CITIZEN REVIEWS & FEEDBACK SECTION */}
      <section id="feedback-section" style={{ padding: '4rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="pill-badge pill-purple" style={{ marginBottom: '0.75rem' }}>Mensahe ng Mamamayan</span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            Mga Komento at Feedback
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
            Tingnan ang karanasan ng mga driver at operator sa bagong digital MTOP portal.
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
            Mag-iwan ng Komento o Feedback
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '1.5rem' }}>
            Nais mo bang magbahagi ng karanasan ukol sa online MTOP system?
          </p>

          {feedbackSubmitted && (
            <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', border: '1px solid rgba(34, 197, 94, 0.4)', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> Maraming salamat! Ang inyong feedback ay matagumpay na naidagdag.
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Pangalan *</label>
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
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Asosasyon / TODA</label>
                <select
                  className="glass-input glass-select"
                  value={feedbackToda}
                  onChange={e => setFeedbackToda(e.target.value)}
                >
                  <option value="BASTODA">BASTODA (Poblacion)</option>
                  <option value="SMTODA">SMTODA (Sabang)</option>
                  <option value="TARTODA">TARCAN TODA</option>
                  <option value="TANGTOD">TANGOS TODA</option>
                  <option value="COMMUTER">Pasahero / Mamamayan</option>
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
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Inyong Komento / Mungkahi *</label>
              <textarea
                className="glass-input"
                rows={3}
                placeholder="Ibahagi ang inyong karanasan sa paggamit ng Baliwag MTOP System..."
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-glass btn-primary-glass" style={{ padding: '0.85rem' }}>
              <Send size={18} /> I-post ang Feedback
            </button>
          </form>
        </div>
      </section>

      {/* DIRECT INQUIRY / CONTACT US SECTION */}
      <section id="contact-section" style={{ padding: '4rem 1.25rem 5rem 1.25rem', maxWidth: '1320px', width: '100%', margin: '0 auto' }}>
        <div className="glass-container" style={{ padding: '3rem 2.5rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="pill-badge pill-cyan" style={{ marginBottom: '0.75rem' }}>Direktang Pagtatanong</span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
              May Tanong Ukol sa Inyong MTOP Application?
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
              Magpadala ng direktang mensahe sa Municipal Franchise & License Office.
            </p>
          </div>

          {inquirySubmitted && (
            <div className="glass-panel" style={{ maxWidth: '650px', margin: '0 auto 1.5rem auto', padding: '1rem 1.25rem', border: '1px solid rgba(34, 197, 94, 0.4)', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> Maraming salamat! Ang inyong mensahe ay naipadala na sa Municipal Franchise Admin.
            </div>
          )}

          <form onSubmit={handleInquirySubmit} style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Buong Pangalan *</label>
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
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Email o Telepono *</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="0918-123-4567 o email@gmail.com"
                  value={inquiryContact}
                  onChange={e => setInquiryContact(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Mensahe o Katanungan *</label>
              <textarea
                className="glass-input"
                rows={4}
                placeholder="Isulat dito ang inyong katanungan ukol sa franchise requirements, stenciling schedule, o iba pa..."
                value={inquiryMessage}
                onChange={e => setInquiryMessage(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-glass btn-primary-glass" style={{ padding: '0.9rem', fontSize: '1rem' }}>
              <Send size={18} /> Ipadala ang Mensahe
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
                <strong style={{ color: '#ffffff', fontSize: '1.1rem', display: 'block' }}>Lungsod ng Baliwag</strong>
                <span style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: 700 }}>Tricycle Franchise & MTOP Office</span>
              </div>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6' }}>
              Pinapadali at pinapabilis ang serbisyo publiko para sa lahat ng tricycle drivers, operators, at TODA associations sa Baliwag, Bulacan.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Impormasyon sa Opisina
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} style={{ color: '#22c55e' }} /> Baliuag Municipal Hall, Bulacan
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} style={{ color: '#22c55e' }} /> Lunes - Biyernes: 8:00 AM - 5:00 PM
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} style={{ color: '#22c55e' }} /> Hotlines: (044) 798-0234 / 0918-123-4567
              </span>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mabilis na Link
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>→ Driver Portal Login</Link>
              <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>→ TODA President Approvals</Link>
              <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>→ Municipal Admin Review</Link>
              <Link to="/register" style={{ color: '#cbd5e1', textDecoration: 'none' }}>→ Mag-rehistro ng Bagong Account</Link>
            </div>
          </div>

        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
          © 2026 Pamahalaang Lungsod ng Baliwag, Bulacan. All Rights Reserved. • Designed with Glassmorphism UI
        </div>
      </footer>

    </div>
  );
}
