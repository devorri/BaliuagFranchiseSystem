// ============================================
// Baliuag City Tricycle Registration System
// Type Definitions
// ============================================

export type UserRole = 'operator' | 'admin' | 'passenger';

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'requires_revision';

export type FranchiseStatus = 'active' | 'expired' | 'suspended' | 'pending';

export type DriverStatus = 'active' | 'inactive' | 'suspended';

export type PaymentStatus = 'pending' | 'completed' | 'failed';

export type ApplicationType = 'new' | 'renewal';

export type ResidencyType = 'resident' | 'non_resident';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  address: string;
  profilePhoto?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'drivers_license' | 'community_tax_cert' | 'deed_of_sale' | 'barangay_clearance' | 'vehicle_registration' | 'other';
  fileName: string;
  uploadedAt: string;
  status: 'uploaded' | 'verified' | 'rejected';
}

export interface Application {
  id: string;
  applicantId: string;
  applicantName: string;
  type: ApplicationType;
  status: ApplicationStatus;
  residency: ResidencyType;
  
  // Vehicle Info
  vehicleMake: string;
  vehicleModel: string;
  plateNumber: string;
  motorNumber: string;
  chassisNumber: string;
  vehicleColor: string;
  
  // Route Info
  todaName: string;
  routeArea: string;
  
  // Documents
  documents: Document[];
  
  // Fee Info
  baseFee: number;
  latePenalty: number;
  totalFee: number;
  
  // Admin Notes
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  
  submittedAt: string;
  updatedAt: string;
}

export interface Franchise {
  id: string;
  applicationId: string;
  operatorId: string;
  operatorName: string;
  
  // Vehicle
  vehicleMake: string;
  vehicleModel: string;
  plateNumber: string;
  motorNumber: string;
  chassisNumber: string;
  vehicleColor: string;
  
  // Route
  todaName: string;
  routeArea: string;
  
  residency: ResidencyType;
  status: FranchiseStatus;
  
  issuedAt: string;
  expiresAt: string;
  renewalDate: string;
}

export interface Payment {
  id: string;
  applicationId: string;
  payerId: string;
  payerName: string;
  amount: number;
  baseFee: number;
  latePenalty: number;
  status: PaymentStatus;
  paymentMethod: 'qr_code' | 'cash';
  referenceNumber: string;
  qrCodeData?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  paymentId: string;
  applicationId: string;
  receiptNumber: string;
  payerName: string;
  amount: number;
  description: string;
  issuedAt: string;
  issuedBy: string;
}

export interface DriverProfile {
  id: string;
  userId: string;
  franchiseId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  licenseNumber: string;
  licenseExpiry: string;
  address: string;
  phone: string;
  email: string;
  todaName: string;
  routeArea: string;
  plateNumber: string;
  status: DriverStatus;
  authorizedAt?: string;
  suspendedAt?: string;
  suspensionReason?: string;
  profilePhoto?: string;
  averageRating: number;
  totalTrips: number;
  registeredAt: string;
}

export interface Feedback {
  id: string;
  driverId: string;
  driverName: string;
  passengerName: string;
  passengerContact?: string;
  rating: number; // 1-5
  comment: string;
  category: 'service' | 'safety' | 'cleanliness' | 'punctuality' | 'general';
  status: 'pending' | 'reviewed' | 'resolved';
  adminResponse?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface FeeConfig {
  newRegistrationResident: number;
  newRegistrationNonResident: number;
  renewalResident: number;
  renewalNonResident: number;
  latePenaltyPerMonth: number;
  maxLatePenaltyMonths: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
