// ============================================
// Storage Service - LocalStorage Persistence
// ============================================

import type { User, Application, Franchise, Penalty, SMSNotification, FeeConfig, ApplicationStatus, Advertisement, InformationItem } from '../types';
import { seedUsers, seedApplications, seedFranchises, seedPenalties, seedSMSNotifications, seedFeeConfig, seedAdvertisements, seedInformationItems } from './seedData';

const KEYS = {
  USERS: 'baliuag_users',
  CURRENT_USER: 'baliuag_current_user',
  ACTIVE_SESSION_TOKEN: 'baliuag_active_session_token',
  APPLICATIONS: 'baliuag_applications',
  FRANCHISES: 'baliuag_franchises',
  PAYMENTS: 'baliuag_payments',
  RECEIPTS: 'baliuag_receipts',
  PENALTIES: 'baliuag_penalties',
  SMS: 'baliuag_sms_notifications',
  FEE_CONFIG: 'baliuag_fee_config',
  ADVERTISEMENTS: 'baliuag_advertisements',
  INFORMATION_ITEMS: 'baliuag_information_items',
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
  if (!localStorage.getItem(KEYS.ADVERTISEMENTS)) {
    localStorage.setItem(KEYS.ADVERTISEMENTS, JSON.stringify(seedAdvertisements));
  }
  if (!localStorage.getItem(KEYS.INFORMATION_ITEMS)) {
    localStorage.setItem(KEYS.INFORMATION_ITEMS, JSON.stringify(seedInformationItems));
  }
}

// ================= USER AUTH & SESSION =================
export function getUsers(): User[] {
  initializeData();
  const data = localStorage.getItem(KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function getCurrentSessionToken(): string | null {
  return localStorage.getItem(KEYS.ACTIVE_SESSION_TOKEN);
}

export function isCurrentSessionValid(): boolean {
  const currentUser = getCurrentUser();
  if (!currentUser) return true;
  const currentToken = localStorage.getItem(KEYS.ACTIVE_SESSION_TOKEN);
  if (!currentToken) return true; // Legacy or dev mode fallback
  const users = getUsers();
  const latest = users.find(u => u.id === currentUser.id);
  if (!latest || !latest.sessionId) return true;
  return latest.sessionId === currentToken;
}

export function login(username: string, password: string): { user: User | null; error?: string } {
  const users = getUsers();
  const found = users.find(u => 
    u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (!found) {
    return { user: null, error: 'Maling username o password.' };
  }

  // Check account status if set
  if (found.accountStatus === 'rejected') {
    return { user: null, error: 'Ang inyong account ay tinanggihan ng administrator.' };
  }
  if (found.accountStatus === 'pending') {
    return { user: null, error: 'Ang inyong account ay naghihintay pa ng pagsusuri ng Security Admin.' };
  }

  // Issue single session token
  const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  found.sessionId = sessionToken;
  saveUser(found);

  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(found));
  localStorage.setItem(KEYS.ACTIVE_SESSION_TOKEN, sessionToken);

  return { user: found };
}

export function logout(): void {
  const currentUser = getCurrentUser();
  if (currentUser) {
    // Clear user's session in users list
    const users = getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx >= 0) {
      users[idx].sessionId = undefined;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
  }
  localStorage.removeItem(KEYS.CURRENT_USER);
  localStorage.removeItem(KEYS.ACTIVE_SESSION_TOKEN);
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

export function updateAccountStatus(userId: string, status: 'approved' | 'rejected'): User | null {
  return updateUser(userId, { accountStatus: status });
}

export function updateApplicationStatus(
  id: string, 
  status: ApplicationStatus, 
  adminNotes?: string, 
  reviewedBy?: string,
  startDate?: string,
  endDate?: string
): Application | null {
  const apps = getApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index >= 0) {
    apps[index].status = status;
    if (adminNotes !== undefined) apps[index].adminNotes = adminNotes;
    if (reviewedBy) apps[index].reviewedBy = reviewedBy;
    if (startDate) apps[index].startDate = startDate;
    if (endDate) apps[index].endDate = endDate;
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
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        issuedAt: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        expiresAt: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
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

export function endorseApplicationByPresident(
  appId: string, 
  presidentName: string, 
  remarks?: string
): Application | null {
  const apps = getApplications();
  const index = apps.findIndex(a => a.id === appId);
  if (index >= 0) {
    apps[index].presidentEndorsed = true;
    apps[index].presidentEndorsedAt = new Date().toISOString();
    apps[index].presidentEndorsedBy = presidentName;
    if (remarks) apps[index].presidentRemarks = remarks;
    apps[index].status = 'pending_admin_approval';
    apps[index].updatedAt = new Date().toISOString();
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

  // Set President Endorsement & Pass to Admin for final review
  app.presidentEndorsed = true;
  app.presidentEndorsedAt = new Date().toISOString();
  app.presidentEndorsedBy = `${todaPresUser.firstName} ${todaPresUser.lastName}`;
  app.presidentRemarks = remarks;
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

// ================= DYNAMIC ADVERTISEMENTS =================
export function getAdvertisements(): Advertisement[] {
  initializeData();
  const data = localStorage.getItem(KEYS.ADVERTISEMENTS);
  return data ? JSON.parse(data) : [];
}

export function saveAdvertisement(ad: Advertisement): Advertisement {
  const ads = getAdvertisements();
  const index = ads.findIndex(a => a.id === ad.id);
  if (index >= 0) {
    ads[index] = ad;
  } else {
    ads.push(ad);
  }
  localStorage.setItem(KEYS.ADVERTISEMENTS, JSON.stringify(ads));
  return ad;
}

export function deleteAdvertisement(id: string): boolean {
  const ads = getAdvertisements();
  const filtered = ads.filter(a => a.id !== id);
  if (filtered.length !== ads.length) {
    localStorage.setItem(KEYS.ADVERTISEMENTS, JSON.stringify(filtered));
    return true;
  }
  return false;
}

// ================= DYNAMIC INFORMATION ITEMS =================
export function getInformationItems(): InformationItem[] {
  initializeData();
  const data = localStorage.getItem(KEYS.INFORMATION_ITEMS);
  return data ? JSON.parse(data) : [];
}

export function saveInformationItem(item: InformationItem): InformationItem {
  const items = getInformationItems();
  const index = items.findIndex(i => i.id === item.id);
  if (index >= 0) {
    items[index] = { ...item, updatedAt: new Date().toISOString() };
  } else {
    items.push(item);
  }
  localStorage.setItem(KEYS.INFORMATION_ITEMS, JSON.stringify(items));
  return item;
}

export function deleteInformationItem(id: string): boolean {
  const items = getInformationItems();
  const filtered = items.filter(i => i.id !== id);
  if (filtered.length !== items.length) {
    localStorage.setItem(KEYS.INFORMATION_ITEMS, JSON.stringify(filtered));
    return true;
  }
  return false;
}

