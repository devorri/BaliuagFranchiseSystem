import type { Document, DocumentType, Residency } from '../types';
import { franchiseFeeFor } from './fees';

export const REQUIRED_APPLICATION_DOCUMENTS: { key: DocumentType; title: string; requirement: string }[] = [
  { key: 'or_cr', title: 'OR / CR', requirement: 'Vehicle official receipt and certificate of registration' },
  { key: 'barangay_clearance', title: 'Barangay Clearance', requirement: 'Proof of the operator’s address' },
  { key: 'drivers_license', title: "Driver's License", requirement: 'Valid professional driver’s license' },
  { key: 'toda_cert', title: 'TODA Certification', requirement: 'Certification for the selected TODA' },
  { key: 'id_photo', title: '2×2 ID Photo', requirement: 'Current photo of the assigned driver' },
];

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

export function hasCompleteRequirements(documents: Document[]) {
  return REQUIRED_APPLICATION_DOCUMENTS.every(({ key }) => documents.some(document => document.type === key && document.status !== 'rejected'));
}
