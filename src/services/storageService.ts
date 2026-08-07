// ============================================
// Storage Service - LocalStorage Persistence
// ============================================

import type { User, Application, Franchise, Penalty, SMSNotification, FeeConfig, ApplicationStatus } from '../types';
import { seedUsers, seedApplications, seedFranchises, seedPenalties, seedSMSNotifications, seedFeeConfig } from './seedData';

const KEYS = {
  USERS: 'baliuag_users',
  CURRENT_USER: 'baliuag_current_user',
  APPLICATIONS: 'baliuag_applications',
  FRANCHISES: 'baliuag_franchises',
  PAYMENTS: 'baliuag_payments',
  RECEIPTS: 'baliuag_receipts',
  PENALTIES: 'baliuag_penalties',
  SMS: 'baliuag_sms_notifications',
  FEE_CONFIG: 'baliuag_fee_config',
};

export function initializeData(): void {
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(seedUsers));
  }
  if (!localStorage.getItem(KEYS.APPLICATIONS)) {
    localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(seedApplications));
  }
  if (!localStorage.getItem(KEYS.FRANCHISES)) {
    localStorage.setItem(KEYS.FRANCHISES, JSON.stringify(seedFranchises));
  }
  if (!localStorage.getItem(KEYS.PENALTIES)) {
    localStorage.setItem(KEYS.PENALTIES, JSON.stringify(seedPenalties));
  }
  if (!localStorage.getItem(KEYS.SMS)) {
    localStorage.setItem(KEYS.SMS, JSON.stringify(seedSMSNotifications));
  }
  if (!localStorage.getItem(KEYS.FEE_CONFIG)) {
    localStorage.setItem(KEYS.FEE_CONFIG, JSON.stringify(seedFeeConfig));
  }
}

// ================= USER AUTH =================
export function getUsers(): User[] {
  initializeData();
  const data = localStorage.getItem(KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function login(username: string, password: string): User | null {
  const users = getUsers();
  const found = users.find(u => 
    u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (found) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(found));
    return found;
  }
  return null;
}

export function logout(): void {
  localStorage.removeItem(KEYS.CURRENT_USER);
}

export function saveUser(user: User): User {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  return user;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index >= 0) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    const current = getCurrentUser();
    if (current && current.id === id) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(users[index]));
    }
    return users[index];
  }
  return null;
}

// ================= APPLICATIONS =================
export function getApplications(): Application[] {
  initializeData();
  const data = localStorage.getItem(KEYS.APPLICATIONS);
  return data ? JSON.parse(data) : [];
}

export function getApplicationById(id: string): Application | undefined {
  return getApplications().find(a => a.id === id);
}

export function saveApplication(app: Application): Application {
  const apps = getApplications();
  const index = apps.findIndex(a => a.id === app.id);
  if (index >= 0) {
    apps[index] = { ...app, updatedAt: new Date().toISOString() };
  } else {
    apps.push(app);
  }
  localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(apps));
  return app;
}

export function updateApplicationStatus(
  id: string, 
  status: ApplicationStatus, 
  adminNotes?: string, 
  reviewedBy?: string
): Application | null {
  const apps = getApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index >= 0) {
    apps[index].status = status;
    if (adminNotes !== undefined) apps[index].adminNotes = adminNotes;
    if (reviewedBy) apps[index].reviewedBy = reviewedBy;
    apps[index].reviewedAt = new Date().toISOString();
    apps[index].updatedAt = new Date().toISOString();
    
    // If approved, create MTOP and active franchise
    if (status === 'approved') {
      const app = apps[index];
      const mtopNo = `MTOP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      app.mtopNumber = mtopNo;
      app.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${mtopNo}-${app.applicantName.replace(/\s+/g, '-').toUpperCase()}`;
      
      const newFranchise: Franchise = {
        id: `FRAN-${Date.now()}`,
        mtopNumber: mtopNo,
        applicationId: app.id,
        operatorId: app.applicantId,
        operatorName: app.applicantName,
        driverId: app.applicantId,
        driverName: app.driverName || app.applicantName,
        vehicleMake: app.vehicleMake,
        vehicleModel: app.vehicleModel,
        plateNumber: app.plateNumber,
        motorNumber: app.motorNumber,
        chassisNumber: app.chassisNumber,
        vehicleColor: app.vehicleColor,
        todaName: app.todaName,
        routeArea: app.routeArea,
        status: 'active',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        renewalDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
        qrCodeData: `BALIUAG-MTOP|${mtopNo}|PLATE:${app.plateNumber}|DRIVER:${app.driverName || app.applicantName}`,
      };
      
      saveFranchise(newFranchise);
    }
    
    localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(apps));
    return apps[index];
  }
  return null;
}

// Inspection & Stenciling workflow update
export function recordInspection(
  appId: string, 
  engineVerified: boolean, 
  chassisVerified: boolean, 
  inspectorName: string, 
  notes?: string
): Application | null {
  const app = getApplicationById(appId);
  if (!app) return null;

  const passed = engineVerified && chassisVerified;
  app.inspection = {
    id: `insp-${Date.now()}`,
    applicationId: appId,
    engineNumber: app.motorNumber,
    chassisNumber: app.chassisNumber,
    engineVerified,
    chassisVerified,
    inspectorName,
    inspectedAt: new Date().toISOString(),
    status: passed ? 'passed' : 'failed',
    notes,
  };

  if (passed) {
    app.status = 'inspection_passed';
  }
  return saveApplication(app);
}

// Treasurer Payment workflow update
export function recordTreasurerPayment(
  appId: string, 
  amount: number, 
  orNumber: string,
  paymentMethod: 'cash' | 'gcash'
): Application | null {
  const app = getApplicationById(appId);
  if (!app) return null;

  app.treasurerPayment = {
    paid: true,
    amount,
    orNumber,
    paidAt: new Date().toISOString(),
    paymentMethod,
  };

  if (app.status === 'inspection_passed' || app.status === 'pending_treasurer_payment') {
    app.status = 'pending_toda_approval';
  }

  return saveApplication(app);
}

// TODA President Line Approval workflow update
export function approveTodaLine(
  appId: string,
  todaPresUser: User,
  orNumber: string,
  remarks?: string
): Application | null {
  const app = getApplicationById(appId);
  if (!app) return null;

  app.todaApproval = {
    approvedBy: todaPresUser.id,
    approvedByName: `${todaPresUser.firstName} ${todaPresUser.lastName}`,
    todaName: todaPresUser.todaName || app.todaName,
    approvedAt: new Date().toISOString(),
    routeFeePaid: true,
    membershipFeePaid: true,
    routeFeeAmount: 500,
    membershipFeeAmount: 300,
    orNumber,
    remarks,
  };

  // Pass to Admin for final review
  app.status = 'pending_admin_approval';

  // Send SMS Notification to Driver/Applicant
  addSMSNotification({
    id: `sms-${Date.now()}`,
    userId: app.applicantId,
    recipientPhone: '0918-555-0101',
    title: 'TODA President Approval Received',
    message: `Ang inyong TODA Route Approval at Membership Fee para sa TODA: ${app.todaName} ay APRUBADO na ni ${todaPresUser.firstName} ${todaPresUser.lastName}. Ipinasa na ito sa City Admin para sa final MTOP Approval.`,
    type: 'toda_approval',
    sentAt: new Date().toISOString(),
    read: false,
  });

  return saveApplication(app);
}

// ================= FRANCHISES =================
export function getFranchises(): Franchise[] {
  initializeData();
  const data = localStorage.getItem(KEYS.FRANCHISES);
  return data ? JSON.parse(data) : [];
}

export function saveFranchise(franchise: Franchise): Franchise {
  const list = getFranchises();
  const index = list.findIndex(f => f.id === franchise.id);
  if (index >= 0) {
    list[index] = franchise;
  } else {
    list.push(franchise);
  }
  localStorage.setItem(KEYS.FRANCHISES, JSON.stringify(list));
  return franchise;
}

// ================= PENALTIES =================
export function getPenalties(): Penalty[] {
  initializeData();
  const data = localStorage.getItem(KEYS.PENALTIES);
  return data ? JSON.parse(data) : [];
}

export function addPenalty(penalty: Penalty): Penalty {
  const list = getPenalties();
  list.unshift(penalty);
  localStorage.setItem(KEYS.PENALTIES, JSON.stringify(list));
  
  // Send SMS Notification
  addSMSNotification({
    id: `sms-${Date.now()}`,
    userId: penalty.driverId,
    recipientPhone: '0918-555-0101',
    title: `Penalty Violation Notice: ${penalty.violationType}`,
    message: `ABISO: Mayroon kayong na-record na penalty para sa ${penalty.violationType} (PHP ${penalty.amount.toFixed(2)}). Mangyaring bayaran sa Treasurer’s Office bago mag ${new Date(penalty.dueDate).toLocaleDateString()}.`,
    type: 'penalty_alert',
    sentAt: new Date().toISOString(),
    read: false,
  });

  return penalty;
}

export function payPenalty(penaltyId: string): Penalty | null {
  const list = getPenalties();
  const index = list.findIndex(p => p.id === penaltyId);
  if (index >= 0) {
    list[index].status = 'paid';
    list[index].paidAt = new Date().toISOString();
    localStorage.setItem(KEYS.PENALTIES, JSON.stringify(list));
    return list[index];
  }
  return null;
}

// ================= SMS NOTIFICATIONS =================
export function getSMSNotifications(userId?: string): SMSNotification[] {
  initializeData();
  const data = localStorage.getItem(KEYS.SMS);
  const list: SMSNotification[] = data ? JSON.parse(data) : [];
  if (userId) {
    return list.filter(n => n.userId === userId || n.userId === 'all');
  }
  return list;
}

export function addSMSNotification(notif: SMSNotification): SMSNotification {
  const list = getSMSNotifications();
  list.unshift(notif);
  localStorage.setItem(KEYS.SMS, JSON.stringify(list));
  return notif;
}

export function markSMSAsRead(id: string): void {
  const list = getSMSNotifications();
  const found = list.find(n => n.id === id);
  if (found) {
    found.read = true;
    localStorage.setItem(KEYS.SMS, JSON.stringify(list));
  }
}

// ================= FEE CONFIG =================
export function getFeeConfig(): FeeConfig {
  initializeData();
  const data = localStorage.getItem(KEYS.FEE_CONFIG);
  return data ? JSON.parse(data) : seedFeeConfig;
}
