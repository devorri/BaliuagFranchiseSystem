// ============================================
// Baliuag City Tricycle Franchise & MTOP System
// Type Definitions
// ============================================

export type UserRole = 'driver' | 'toda_president' | 'admin' | 'operator';

export type ApplicationStatus = 
  | 'draft' 
  | 'pending_inspection' 
  | 'inspection_passed' 
  | 'pending_treasurer_payment' 
  | 'pending_toda_approval' 
  | 'pending_admin_approval' 
  | 'approved' 
  | 'rejected' 
  | 'requires_revision';

export type FranchiseStatus = 'active' | 'expired' | 'suspended' | 'pending';

export type DriverStatus = 'active' | 'inactive' | 'suspended';

export type PaymentStatus = 'pending' | 'completed' | 'failed';

export type ApplicationType = 'new' | 'renewal';

export type DocumentType = 
  | 'or_cr' 
  | 'barangay_clearance' 
  | 'drivers_license' 
  | 'toda_cert' 
  | 'id_photo' 
  | 'other';

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
  todaName?: string;
  profilePhoto?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  fileName: string;
  uploadedAt: string;
  status: 'uploaded' | 'verified' | 'rejected';
  fileUrl?: string;
}

export interface InspectionRecord {
  id: string;
  applicationId: string;
  engineNumber: string;
  chassisNumber: string;
  engineVerified: boolean;
  chassisVerified: boolean;
  inspectorName: string;
  inspectedAt: string;
  status: 'pending' | 'passed' | 'failed';
  notes?: string;
}

export interface TodaApproval {
  approvedBy: string;
  approvedByName: string;
  todaName: string;
  approvedAt: string;
  routeFeePaid: boolean;
  membershipFeePaid: boolean;
  routeFeeAmount: number;
  membershipFeeAmount: number;
  orNumber?: string;
  remarks?: string;
}

export interface TreasurerPayment {
  paid: boolean;
  amount: number;
  orNumber: string;
  paidAt?: string;
  paymentMethod: 'cash' | 'gcash';
}

export interface Application {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: 'driver' | 'operator';
  type: ApplicationType;
  status: ApplicationStatus;
  
  // Driver / Vehicle Info
  driverName?: string;
  licenseNumber?: string;
  vehicleMake: string;
  vehicleModel: string;
  plateNumber: string;
  motorNumber: string;
  chassisNumber: string;
  vehicleColor: string;
  
  // Route / TODA Info
  todaName: string;
  routeArea: string;
  
  // Documents
  documents: Document[];
  
  // Workflow Steps Data
  inspection?: InspectionRecord;
  treasurerPayment?: TreasurerPayment;
  todaApproval?: TodaApproval;
  
  // Fee Info
  baseFee: number;
  todaFee: number;
  latePenalty: number;
  totalFee: number;
  
  // Admin Notes & Approval
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  mtopNumber?: string;
  qrCodeUrl?: string;
  
  submittedAt: string;
  updatedAt: string;
}

export interface Franchise {
  id: string;
  mtopNumber: string;
  applicationId: string;
  operatorId: string;
  operatorName: string;
  driverId: string;
  driverName: string;
  
  // Vehicle Info
  vehicleMake: string;
  vehicleModel: string;
  plateNumber: string;
  motorNumber: string;
  chassisNumber: string;
  vehicleColor: string;
  
  // Route
  todaName: string;
  routeArea: string;
  
  status: FranchiseStatus;
  issuedAt: string;
  expiresAt: string;
  renewalDate: string;
  qrCodeData: string;
}

export interface Penalty {
  id: string;
  driverId: string;
  driverName: string;
  plateNumber: string;
  todaName: string;
  violationType: 'Expired MTOP' | 'Out of Route Operation' | 'Overcharging' | 'Illegal Parking' | 'No License' | 'No TODA Cert';
  amount: number;
  status: 'unpaid' | 'paid';
  issuedDate: string;
  dueDate: string;
  paidAt?: string;
  remarks: string;
  issuedBy: string;
}

export interface SMSNotification {
  id: string;
  userId: string;
  recipientPhone: string;
  title: string;
  message: string;
  type: 'renewal_reminder' | 'expiration' | 'penalty_alert' | 'status_update' | 'toda_approval';
  sentAt: string;
  read: boolean;
}

export interface Payment {
  id: string;
  applicationId: string;
  payerId: string;
  payerName: string;
  amount: number;
  description: string;
  status: PaymentStatus;
  paymentMethod: 'gcash' | 'cash' | 'treasurer_office';
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

export interface FeeConfig {
  mtopBaseFee: number;
  todaRouteFee: number;
  todaMembershipFee: number;
  stencilingFee: number;
  latePenaltyPerMonth: number;
}
