import type { Application, Document, DocumentType, Franchise, Residency } from '../types';
import { franchiseFeeFor } from './fees';
import { daysUntil } from './clock';

/**
 * Registration requirement: the ONLY document asked before an account is created
 * is a valid government ID or driver's license (stored as `drivers_license`).
 */
export const REGISTRATION_REQUIRED_DOC: { key: DocumentType; title: string; requirement: string } = {
  key: 'drivers_license',
  title: "Valid Government ID / Driver's License",
  requirement: "Any valid government-issued ID or LTO driver's license (front side, clear photo or PDF)",
};

export function getRequiredDocuments(type: 'new' | 'renewal' = 'new'): { key: DocumentType; title: string; requirement: string }[] {
  if (type === 'renewal') {
    return [
      { key: 'or_cr', title: 'OR / CR (Official Receipt & Certificate of Registration)', requirement: 'Latest LTO vehicle registration and official receipt' },
      { key: 'drivers_license', title: "Driver's License", requirement: 'Valid professional driver’s license' },
      { key: 'id_photo', title: '2×2 ID Photo', requirement: 'Recent passport or 2x2 photo with white background' },
    ];
  }

  return [
    { key: 'or_cr', title: 'OR / CR (Official Receipt & Certificate of Registration)', requirement: 'Vehicle official receipt and certificate of registration' },
    { key: 'barangay_clearance', title: 'Barangay Clearance', requirement: 'Proof of operator residency within Baliwag City' },
    { key: 'drivers_license', title: "Driver's License", requirement: 'Valid professional driver’s license' },
    { key: 'id_photo', title: '2×2 ID Photo', requirement: 'Recent passport or 2x2 photo with white background' },
  ];
}

export const REQUIRED_APPLICATION_DOCUMENTS = getRequiredDocuments('new');

export const TODA_ROUTES: Record<string, string> = {
  'BASTODA (Baliuag Poblacion TODA)': 'Baliuag Poblacion – Public Market – Municipal Hall',
  'SMTODA (Sabang Terminal TODA)': 'Sabang Terminal – Baliuag Town Proper',
  'TARTODA (Tarcan Highway TODA)': 'Tarcan – National Highway – Baliuag Town Proper',
  'PAGTODA (Pagala Commercial TODA)': 'Pagala Commercial Area – Baliuag Town Proper',
};

export function residencyFromAddress(address?: string): Residency {
  const normalized = (address || '').toLowerCase();
  return /\bbaliwag\b|\bbaliuag\b/.test(normalized) ? 'baliwag_resident' : 'non_resident';
}

export function feeForAddress(address?: string) {
  const residency = residencyFromAddress(address);
  return { residency, amount: franchiseFeeFor(residency) };
}

/** Statuses that count as an application still in process (blocks a second submission). */
export const ACTIVE_APPLICATION_STATUSES: Application['status'][] = [
  'draft',
  'pending_driver_requirements',
  'pending_inspection',
  'inspection_passed',
  'pending_treasurer_payment',
  'pending_toda_approval',
  'pending_admin_approval',
  'requires_revision',
];

export function isActiveApplication(app: Application): boolean {
  return ACTIVE_APPLICATION_STATUSES.includes(app.status);
}

/**
 * Renewal is only allowed once the franchise has expired.
 * Set to e.g. 30 to allow renewal 30 days before expiration instead.
 */
export const RENEWAL_WINDOW_DAYS = 0;

/** Days before expiration when SMS reminders are sent. */
export const EXPIRY_REMINDER_DAYS = [30, 7, 1];

export function franchiseExpiryDate(franchise: Pick<Franchise, 'expiresAt' | 'endDate'>): string {
  return franchise.endDate || franchise.expiresAt;
}

export function isFranchiseExpired(franchise: Pick<Franchise, 'expiresAt' | 'endDate' | 'status'>): boolean {
  return daysUntil(franchiseExpiryDate(franchise)) < 0;
}

export function canRenewFranchise(franchise: Pick<Franchise, 'expiresAt' | 'endDate' | 'status'>): boolean {
  if (franchise.status === 'available' || franchise.status === 'suspended') return false;
  return daysUntil(franchiseExpiryDate(franchise)) < RENEWAL_WINDOW_DAYS;
}

/**
 * Returns the list of things still missing before the applicant can pay.
 * Payment is only opened once every item is cleared.
 */
export function getPaymentBlockers(app: Application): string[] {
  const blockers: string[] = [];
  const requiredFields: [keyof Application, string][] = [
    ['driverName', 'Driver name'],
    ['licenseNumber', 'Driver license number'],
    ['vehicleMake', 'Vehicle make'],
    ['vehicleModel', 'Vehicle model'],
    ['plateNumber', 'Plate number'],
    ['motorNumber', 'Engine / motor number'],
    ['chassisNumber', 'Chassis number'],
    ['vehicleColor', 'Vehicle color'],
    ['todaName', 'TODA'],
  ];
  const missingFields = requiredFields.filter(([key]) => !String(app[key] ?? '').trim()).map(([, label]) => label);
  if (missingFields.length) blockers.push(`Missing application data: ${missingFields.join(', ')}`);

  const required = getRequiredDocuments(app.type);
  const docs = app.documents || [];
  const missingDocs = required.filter(({ key }) => !docs.some(doc => doc.type === key));
  if (missingDocs.length) blockers.push(`Missing requirements: ${missingDocs.map(doc => doc.title).join(', ')}`);
  if (docs.some(doc => doc.status === 'rejected')) blockers.push('A requirement was rejected by the Admin — re-upload it first');
  else if (!missingDocs.length && !required.every(({ key }) => docs.some(doc => doc.type === key && doc.status === 'verified'))) {
    blockers.push('Requirements are still being checked by the Municipal Admin');
  }
  if (app.inspection?.status !== 'passed') blockers.push('Stenciling / physical inspection not yet passed');
  if (!app.totalFee || app.totalFee <= 0) blockers.push('Fee has not been assessed yet');
  return blockers;
}

export function hasCompleteRequirements(documents: Document[], type: 'new' | 'renewal' = 'new') {
  const required = getRequiredDocuments(type);
  return required.every(({ key }) => documents.some(document => document.type === key && document.status !== 'rejected'));
}

/**
 * GCash / QR Ph Transaction Reference Number Rules:
 * Strict 10- to 13-character alphanumeric code automatically generated
 * for every successful transaction, serving as primary proof of payment
 * and tracking identifier.
 */
export const GCASH_REF_REGEX = /^[A-Za-z0-9]{10,13}$/;

export function isValidGcashReference(ref?: string | null): boolean {
  if (!ref) return false;
  return GCASH_REF_REGEX.test(ref.trim());
}

export function sanitizeGcashReference(input: string): string {
  // Keeps only alphanumeric characters and truncates to max 13 characters
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 13);
}

export function generateStandardGcashReference(): string {
  // Generates an official-looking 12-digit GCash transaction reference number (e.g. 902184918204)
  const prefix = Math.floor(1000 + Math.random() * 9000).toString();
  const suffix = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${prefix}${suffix}`;
}


