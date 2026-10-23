import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, ShieldAlert, CheckCircle2, Eye, EyeOff, 
  Upload, Check, X, Loader2 
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import * as supabaseService from '../services/supabaseService';
import type { Document, DocumentType, UserRole } from '../types';

export function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    address: '',
    todaName: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'operator' as UserRole,
  });

  const [uploadedFiles, setUploadedFiles] = useState<Partial<Record<DocumentType, { name: string; url: string }>>>({});
  const [uploadingDoc, setUploadingDoc] = useState<Partial<Record<DocumentType, boolean>>>({});

  // Password validation rules
  const password = form.password;
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const isMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (type: DocumentType, file?: File) => {
    if (!file) return;
    setUploadingDoc(prev => ({ ...prev, [type]: true }));
    try {
      const result = await supabaseService.uploadFileToBucketAsync(file, 'registration_documents');
      const url = result.url || URL.createObjectURL(file);
      setUploadedFiles(prev => ({
        ...prev,
        [type]: { name: file.name, url }
      }));
      showToast(`${file.name} attached successfully.`, 'success');
    } catch {
      showToast('Could not upload file. Using local file reference.', 'info');
      setUploadedFiles(prev => ({
        ...prev,
        [type]: { name: file.name, url: URL.createObjectURL(file) }
      }));
    } finally {
      setUploadingDoc(prev => ({ ...prev, [type]: false }));
    }
  };

  const requiredRegistrationDocs: { key: DocumentType; label: string; desc: string }[] = [
    { key: 'id_photo', label: '2x2 ID Photo / Valid Government ID', desc: 'Recent 2x2 photo or valid government-issued ID' },
    { key: 'barangay_clearance', label: 'Barangay Clearance', desc: 'Proof of residency within the City of Baliwag' },
    { key: 'drivers_license', label: "Driver's License", desc: 'Valid Professional Driver License (LTO)' },
    { key: 'or_cr', label: 'Proof of Unit Ownership (OR/CR)', desc: 'Official Receipt & Certificate of Registration' },
    { key: 'toda_cert', label: 'TODA Endorsement / Cert', desc: 'Certificate of TODA affiliation or membership' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      showToast('Please fulfill all password security requirements.', 'error');
      return;
    }

    if (!isMatch) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    // Convert attached files to Document array
    const documents: Document[] = Object.entries(uploadedFiles).map(([type, file], index) => ({
      id: `reg-doc-${Date.now()}-${index}`,
      name: requiredRegistrationDocs.find(d => d.key === type)?.label || type.toUpperCase(),
      type: type as DocumentType,
      fileName: file.name,
      fileUrl: file.url,
      status: 'uploaded',
      uploadedAt: new Date().toISOString()
    }));

    setLoading(true);
    try {
      const res = await supabaseService.registerUserAsync({
        username: form.username,
        password: form.password,
        role: form.role,
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName || undefined,
        email: form.email,
        phone: form.phone,
        address: form.address,
        todaName: form.todaName || undefined,
        documents: documents.length > 0 ? documents : undefined,
      });

      if (res.user) {
        setSubmitted(true);
        showToast('Registration submitted successfully! Awaiting administrator approval.', 'success');
      } else {
        showToast(res.error || 'Failed to process registration.', 'error');
      }
    } catch {
      showToast('An error occurred during registration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="glass-container animate-fade-in" style={{ maxWidth: '540px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <CheckCircle2 size={36} color="#4ade80" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            Registration Submitted Successfully!
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Your account request for <strong style={{ color: '#38bdf8' }}>{form.role === 'driver' ? 'Tricycle Driver' : 'Franchise Operator'}</strong> along with your submitted requirements is under review by the Local Government <strong>Security Administrator</strong>.
          </p>
          <div style={{ padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '10px', marginBottom: '1.75rem', textAlign: 'left', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <ShieldAlert size={20} color="#facc15" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '0.85rem', color: '#fef08a', lineHeight: '1.5' }}>
              You will be able to log in using your username and password once your account and submitted documents are verified and approved by the Security Admin.
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => navigate('/login')} 
            className="btn-glass btn-primary-glass" 
            style={{ width: '100%', padding: '0.85rem' }}
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem' }}>
      <div className="glass-container animate-fade-in" style={{ maxWidth: '720px', width: '100%', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img src="/baliuag-logo.png" alt="City of Baliwag Seal" style={{ height: '64px', width: 'auto', marginBottom: '0.75rem' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            Franchise Operator / Driver Registration
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>City of Baliwag Tricycle Franchise & MTOP Management System</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          
          {/* Account Type Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '0.9rem 1.15rem', borderRadius: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', flexShrink: 0 }}>
              <UserPlus size={20} />
            </div>
            <div>
              <strong style={{ color: '#4ade80', fontSize: '0.98rem', display: 'block' }}>Account Role: Franchise Operator / Driver</strong>
              <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>Official registration for motorized tricycle operators and drivers in the City of Baliwag</span>
            </div>
          </div>

          {/* Name Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>First Name *</label>
              <input type="text" className="glass-input" value={form.firstName} onChange={e => updateField('firstName', e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Last Name *</label>
              <input type="text" className="glass-input" value={form.lastName} onChange={e => updateField('lastName', e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Middle Name (Optional)</label>
              <input type="text" className="glass-input" value={form.middleName} onChange={e => updateField('middleName', e.target.value)} />
            </div>
          </div>

          {/* Contact Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Email Address *</label>
              <input type="email" className="glass-input" value={form.email} onChange={e => updateField('email', e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Phone Number *</label>
              <input type="tel" className="glass-input" placeholder="0917-000-0000" value={form.phone} onChange={e => updateField('phone', e.target.value)} required />
            </div>
          </div>

          {/* Address & TODA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Home Address *</label>
              <input type="text" className="glass-input" placeholder="Brgy. Poblacion, Baliwag" value={form.address} onChange={e => updateField('address', e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>TODA Affiliation (Optional)</label>
              <input type="text" className="glass-input" placeholder="e.g. BASTODA, SMTODA" value={form.todaName} onChange={e => updateField('todaName', e.target.value)} />
            </div>
          </div>

          {/* Account Credentials */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Username *</label>
            <input type="text" className="glass-input" placeholder="Choose a unique username" value={form.username} onChange={e => updateField('username', e.target.value)} required />
          </div>

          {/* Password & Confirm Password with Show/Hide toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="glass-input" 
                  style={{ paddingRight: '2.5rem' }}
                  placeholder="Enter secure password" 
                  value={form.password} 
                  onChange={e => updateField('password', e.target.value)} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  className="glass-input" 
                  style={{ paddingRight: '2.5rem' }}
                  placeholder="Re-type your password" 
                  value={form.confirmPassword} 
                  onChange={e => updateField('confirmPassword', e.target.value)} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Password Security Checklist */}
          {form.password && (
            <div className="glass-panel" style={{ padding: '0.85rem 1rem', fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>Password Requirements:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem' }}>
                <span style={{ color: hasMinLength ? '#4ade80' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {hasMinLength ? <Check size={14} /> : <X size={14} />} At least 8 characters
                </span>
                <span style={{ color: hasUpper ? '#4ade80' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {hasUpper ? <Check size={14} /> : <X size={14} />} 1 Uppercase letter (A-Z)
                </span>
                <span style={{ color: hasLower ? '#4ade80' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {hasLower ? <Check size={14} /> : <X size={14} />} 1 Lowercase letter (a-z)
                </span>
                <span style={{ color: hasNumber ? '#4ade80' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {hasNumber ? <Check size={14} /> : <X size={14} />} 1 Number digit (0-9)
                </span>
                <span style={{ color: hasSpecial ? '#4ade80' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {hasSpecial ? <Check size={14} /> : <X size={14} />} 1 Special character (!@#$)
                </span>
                {form.confirmPassword && (
                  <span style={{ color: isMatch ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {isMatch ? <Check size={14} /> : <X size={14} />} {isMatch ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Initial Requirements Submission Section */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Upload size={18} color="#38bdf8" />
              <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>
                Submit Required Verification Documents (Franchise Operator / Driver)
              </strong>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1rem' }}>
              Upload your initial requirements now so the Security Administrator can review and approve your account.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {requiredRegistrationDocs.map(doc => (
                <div key={doc.key} style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div>
                      <strong style={{ color: '#e2e8f0', fontSize: '0.86rem' }}>{doc.label}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>{doc.desc}</span>
                    </div>
                    {uploadingDoc[doc.key] ? (
                      <span style={{ color: '#38bdf8', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Loader2 size={13} className="spin-icon" /> Uploading...
                      </span>
                    ) : uploadedFiles[doc.key] ? (
                      <span style={{ color: '#4ade80', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                        <CheckCircle2 size={14} /> Attached: {uploadedFiles[doc.key]?.name}
                      </span>
                    ) : (
                      <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>Required</span>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="glass-input"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                    onChange={e => void handleFileUpload(doc.key, e.target.files?.[0])}
                    disabled={uploadingDoc[doc.key]}
                  />
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-glass btn-primary-glass" 
            style={{ padding: '0.95rem', fontSize: '1rem', marginTop: '0.5rem' }} 
            disabled={loading}
          >
            <UserPlus size={18} /> {loading ? 'Registering Account...' : 'Register Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: '#38bdf8', fontSize: '0.88rem', textDecoration: 'none' }}>
            Already have an account? Sign in here
          </Link>
        </div>

      </div>
    </div>
  );
}
