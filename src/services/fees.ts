// Official Baliwag franchise fees. Keep all application and payment screens in sync.
export const FRANCHISE_FEES = {
  baliwagResident: 450,
  nonResident: 550,
  expiredFranchisePenalty: 125,
} as const;

export type Residency = 'baliwag_resident' | 'non_resident';

export function franchiseFeeFor(residency: Residency): number {
  return residency === 'baliwag_resident'
    ? FRANCHISE_FEES.baliwagResident
    : FRANCHISE_FEES.nonResident;
}

export function residencyLabel(residency: Residency): string {
  return residency === 'baliwag_resident' ? 'Baliwag resident' : 'Non-resident of Baliwag';
}
