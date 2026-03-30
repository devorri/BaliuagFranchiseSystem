import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { useToast } from '../../components/ui/Toast';
import { ChevronRight, ChevronLeft, Upload, Check } from 'lucide-react';
import * as storage from '../../services/storageService';
import { todaRoutes } from '../../services/seedData';
import type { ApplicationType, ResidencyType, Document } from '../../types';

export function ApplicationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    type: 'new' as ApplicationType,
    residency: 'resident' as ResidencyType,
    vehicleMake: '',
    vehicleModel: '',
    plateNumber: '',
    motorNumber: '',
    chassisNumber: '',
    vehicleColor: '',
    todaIndex: 0,
  });

  const [docs, setDocs] = useState<{ name: string; type: Document['type']; fileName: string }[]>([]);

  const updateField = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addDocument = (docType: Document['type'], docName: string) => {
    if (docs.find(d => d.type === docType)) return;
    const fileName = `${docType}_${user?.username || 'user'}_${Date.now()}.pdf`;
    setDocs(prev => [...prev, { name: docName, type: docType, fileName }]);
    showToast(`${docName} uploaded successfully.`, 'success');
  };

  const removeDocument = (docType: Document['type']) => {
    setDocs(prev => prev.filter(d => d.type !== docType));
  };

  const feeInfo = storage.calculateFee(form.type, form.residency);
  const selectedRoute = todaRoutes[form.todaIndex];

  const canProceedStep1 = form.vehicleMake && form.vehicleModel && form.plateNumber && form.motorNumber && form.chassisNumber && form.vehicleColor;
  const canProceedStep2 = docs.length >= 2; // at least license + CTC

  const handleSubmit = () => {
    if (!user) return;
    setLoading(true);

    setTimeout(() => {
      const documents: Document[] = docs.map((d, i) => ({
        id: `doc-${Date.now()}-${i}`,
        name: d.name,
        type: d.type,
        fileName: d.fileName,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded' as const,
      }));

      storage.createApplication({
        applicantId: user.id,
        applicantName: `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`,
        type: form.type,
        status: 'pending',
        residency: form.residency,
        vehicleMake: form.vehicleMake,
        vehicleModel: form.vehicleModel,
        plateNumber: form.plateNumber,
        motorNumber: form.motorNumber,
        chassisNumber: form.chassisNumber,
        vehicleColor: form.vehicleColor,
        todaName: selectedRoute.name,
        routeArea: selectedRoute.route,
        documents,
        baseFee: feeInfo.baseFee,
        latePenalty: feeInfo.latePenalty,
        totalFee: feeInfo.totalFee,
      });

      showToast('Application submitted successfully!', 'success');
      navigate('/dashboard/applications');
      setLoading(false);
    }, 1000);
  };

  const requiredDocs: { type: Document['type']; name: string }[] = [
    { type: 'drivers_license', name: "Driver's License" },
    { type: 'community_tax_cert', name: 'Community Tax Certificate (CTC)' },
    { type: 'deed_of_sale', name: 'Deed of Sale' },
    { type: 'barangay_clearance', name: 'Barangay Clearance' },
    { type: 'vehicle_registration', name: 'Vehicle Registration (OR/CR)' },
  ];

  return (
    <div className="page">
      <Header title="New Application" subtitle="Submit a franchise registration application" />

      <div className="page__content">
        {/* Step Indicator */}
        <div className="stepper">
          {['Vehicle & Route', 'Documents', 'Fee Summary', 'Review & Submit'].map((label, i) => (
            <div key={i} className={`stepper__step ${step === i + 1 ? 'stepper__step--active' : ''} ${step > i + 1 ? 'stepper__step--done' : ''}`}>
              <div className="stepper__circle">{step > i + 1 ? <Check size={14} /> : i + 1}</div>
              <span className="stepper__label">{label}</span>
              {i < 3 && <div className="stepper__line"></div>}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card__body">
            {/* Step 1: Vehicle & Route */}
            {step === 1 && (
              <div className="form-section">
                <h3 className="form-section__title">Application Type</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={form.type} onChange={e => updateField('type', e.target.value)}>
                      <option value="new">New Registration</option>
                      <option value="renewal">Renewal</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Residency</label>
                    <select className="form-input" value={form.residency} onChange={e => updateField('residency', e.target.value)}>
                      <option value="resident">Baliuag Resident</option>
                      <option value="non_resident">Non-Resident</option>
                    </select>
                  </div>
                </div>

                <h3 className="form-section__title">Vehicle Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Vehicle Make *</label>
                    <input className="form-input" placeholder="e.g. Honda" value={form.vehicleMake} onChange={e => updateField('vehicleMake', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Model *</label>
                    <input className="form-input" placeholder="e.g. TMX 125" value={form.vehicleModel} onChange={e => updateField('vehicleModel', e.target.value)} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Plate Number *</label>
                    <input className="form-input" placeholder="e.g. MC-1234" value={form.plateNumber} onChange={e => updateField('plateNumber', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Color *</label>
                    <input className="form-input" placeholder="e.g. Blue" value={form.vehicleColor} onChange={e => updateField('vehicleColor', e.target.value)} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Motor Number *</label>
                    <input className="form-input" placeholder="Engine/Motor number" value={form.motorNumber} onChange={e => updateField('motorNumber', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chassis Number *</label>
                    <input className="form-input" placeholder="Chassis/Frame number" value={form.chassisNumber} onChange={e => updateField('chassisNumber', e.target.value)} required />
                  </div>
                </div>

                <h3 className="form-section__title">Route Assignment</h3>
                <div className="form-group">
                  <label className="form-label">TODA / Route Area</label>
                  <select className="form-input" value={form.todaIndex} onChange={e => updateField('todaIndex', parseInt(e.target.value))}>
                    {todaRoutes.map((r, i) => (
                      <option key={i} value={i}>{r.name} — {r.route}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Documents */}
            {step === 2 && (
              <div className="form-section">
                <h3 className="form-section__title">Upload Required Documents</h3>
                <p className="form-section__desc">Upload at least the Driver's License and Community Tax Certificate. Click "Upload" to simulate file upload.</p>

                <div className="doc-upload-list">
                  {requiredDocs.map(doc => {
                    const uploaded = docs.find(d => d.type === doc.type);
                    return (
                      <div key={doc.type} className={`doc-upload-item ${uploaded ? 'doc-upload-item--done' : ''}`}>
                        <div className="doc-upload-item__info">
                          <span className="doc-upload-item__name">{doc.name}</span>
                          {uploaded && <span className="doc-upload-item__file">{uploaded.fileName}</span>}
                        </div>
                        <div className="doc-upload-item__actions">
                          {uploaded ? (
                            <>
                              <span className="badge badge--green badge--sm">Uploaded</span>
                              <button className="btn btn--ghost btn--sm" onClick={() => removeDocument(doc.type)}>Remove</button>
                            </>
                          ) : (
                            <button className="btn btn--outline btn--sm" onClick={() => addDocument(doc.type, doc.name)}>
                              <Upload size={14} /> Upload
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Fee Summary */}
            {step === 3 && (
              <div className="form-section">
                <h3 className="form-section__title">Fee Assessment</h3>
                <div className="fee-summary">
                  <div className="fee-summary__row">
                    <span>Application Type</span>
                    <span>{form.type === 'new' ? 'New Registration' : 'Renewal'}</span>
                  </div>
                  <div className="fee-summary__row">
                    <span>Residency</span>
                    <span>{form.residency === 'resident' ? 'Baliuag Resident' : 'Non-Resident'}</span>
                  </div>
                  <div className="fee-summary__divider"></div>
                  <div className="fee-summary__row">
                    <span>Base Fee</span>
                    <span>₱{feeInfo.baseFee.toLocaleString()}.00</span>
                  </div>
                  {feeInfo.latePenalty > 0 && (
                    <div className="fee-summary__row fee-summary__row--penalty">
                      <span>Late Penalty</span>
                      <span>₱{feeInfo.latePenalty.toLocaleString()}.00</span>
                    </div>
                  )}
                  <div className="fee-summary__divider"></div>
                  <div className="fee-summary__row fee-summary__row--total">
                    <span>Total Amount Due</span>
                    <span>₱{feeInfo.totalFee.toLocaleString()}.00</span>
                  </div>
                </div>
                <p className="form-section__note">Payment will be processed after application submission via QR code.</p>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="form-section">
                <h3 className="form-section__title">Review Application</h3>
                <div className="review-grid">
                  <div className="review-section">
                    <h4>Application Info</h4>
                    <p><strong>Type:</strong> {form.type === 'new' ? 'New Registration' : 'Renewal'}</p>
                    <p><strong>Residency:</strong> {form.residency === 'resident' ? 'Resident' : 'Non-Resident'}</p>
                  </div>
                  <div className="review-section">
                    <h4>Vehicle Info</h4>
                    <p><strong>Vehicle:</strong> {form.vehicleMake} {form.vehicleModel}</p>
                    <p><strong>Plate:</strong> {form.plateNumber}</p>
                    <p><strong>Color:</strong> {form.vehicleColor}</p>
                    <p><strong>Motor #:</strong> {form.motorNumber}</p>
                    <p><strong>Chassis #:</strong> {form.chassisNumber}</p>
                  </div>
                  <div className="review-section">
                    <h4>Route</h4>
                    <p><strong>TODA:</strong> {selectedRoute.name}</p>
                    <p><strong>Route:</strong> {selectedRoute.route}</p>
                  </div>
                  <div className="review-section">
                    <h4>Documents ({docs.length})</h4>
                    {docs.map(d => <p key={d.type}>✓ {d.name}</p>)}
                  </div>
                  <div className="review-section">
                    <h4>Fee</h4>
                    <p><strong>Total:</strong> ₱{feeInfo.totalFee.toLocaleString()}.00</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="form-nav">
              {step > 1 && (
                <button className="btn btn--ghost" onClick={() => setStep(s => s - 1)}>
                  <ChevronLeft size={16} /> Previous
                </button>
              )}
              <div className="form-nav__spacer"></div>
              {step < 4 ? (
                <button
                  className="btn btn--primary"
                  onClick={() => setStep(s => s + 1)}
                  disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn btn--primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? <span className="btn__spinner"></span> : <><Check size={16} /> Submit Application</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
