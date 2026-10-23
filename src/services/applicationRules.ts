import type { Document, DocumentType, Residency } from '../types';
import { franchiseFeeFor } from './fees';

export function getRequiredDocuments(type: 'new' | 'renewal' = 'new'): { key: DocumentType; title: string; requirement: string }[] {
  if (type === 'renewal') {
    return [
      { key: 'or_cr', title: 'OR / CR (Official Receipt & Certificate of Registration)', requirement: 'Latest LTO vehicle registration and official receipt' },
      { key: 'drivers_license', title: "Driver's License", requirement: 'Valid professional driver’s license' },
      { key: 'toda_cert', title: 'TODA Certification', requirement: 'Active TODA membership endorsement certificate' },
      { key: 'id_photo', title: '2×2 ID Photo', requirement: 'Recent passport or 2x2 photo with white background' },
    ];
  }

  return [
    { key: 'or_cr', title: 'OR / CR (Official Receipt & Certificate of Registration)', requirement: 'Vehicle official receipt and certificate of registration' },
    { key: 'barangay_clearance', title: 'Barangay Clearance', requirement: 'Proof of operator residency within Baliwag City' },
    { key: 'drivers_license', title: "Driver's License", requirement: 'Valid professional driver’s license' },
    { key: 'toda_cert', title: 'TODA Certification', requirement: 'Active TODA membership endorsement certificate' },
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


