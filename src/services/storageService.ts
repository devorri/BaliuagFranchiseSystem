// ============================================
// Storage Service - SessionStorage CRUD Operations
// ============================================

import type {
  User, Application, Franchise, Payment, Receipt,
  DriverProfile, Feedback, FeeConfig, Notification,
  ApplicationType, ResidencyType
} from '../types';
import {
  seedUsers, seedApplications, seedFranchises, seedPayments,
  seedReceipts, seedDrivers, seedFeedback, seedFeeConfig, seedNotifications
} from './seedData';

const KEYS = {
  INITIALIZED: 'baliuag_initialized',
  USERS: 'baliuag_users',
  APPLICATIONS: 'baliuag_applications',
  FRANCHISES: 'baliuag_franchises',
  PAYMENTS: 'baliuag_payments',
  RECEIPTS: 'baliuag_receipts',
  DRIVERS: 'baliuag_drivers',
  FEEDBACK: 'baliuag_feedback',
  FEE_CONFIG: 'baliuag_fee_config',
  NOTIFICATIONS: 'baliuag_notifications',
  CURRENT_USER: 'baliuag_current_user',
};

// ---- Helpers ----
function get<T>(key: string): T[] {
  const data = sessionStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function set<T>(key: string, data: T[]): void {
  sessionStorage.setItem(key, JSON.stringify(data));
}

function getOne<T>(key: string): T | null {
  const data = sessionStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function setOne<T>(key: string, data: T): void {
  sessionStorage.setItem(key, JSON.stringify(data));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

function generateRefNumber(): string {
  const num = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `REF-${new Date().getFullYear()}-${num}`;
}

function generateReceiptNumber(): string {
  const num = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `OR-${new Date().getFullYear()}-${num}`;
}

// ---- Initialization ----
export function initializeData(): void {
  const isInitialized = sessionStorage.getItem(KEYS.INITIALIZED);
  
  // If not initialized at all, set everything
  if (!isInitialized) {
    set(KEYS.USERS, seedUsers);
    set(KEYS.APPLICATIONS, seedApplications);
    set(KEYS.FRANCHISES, seedFranchises);
    set(KEYS.PAYMENTS, seedPayments);
    set(KEYS.RECEIPTS, seedReceipts);
    set(KEYS.DRIVERS, seedDrivers);
    set(KEYS.FEEDBACK, seedFeedback);
    setOne(KEYS.FEE_CONFIG, seedFeeConfig);
    set(KEYS.NOTIFICATIONS, seedNotifications);
    sessionStorage.setItem(KEYS.INITIALIZED, 'true');
    return;
  }

  // Self-healing: Check if passengers are missing from the users list
  // (Happens if the user's browser was initialized before the passenger role was added)
  const users = get<User>(KEYS.USERS);
  const hasPassenger = users.some(u => u.role === 'passenger');
  
  if (!hasPassenger) {
    // Re-seed users to include passengers
    // We merge to preserve any local changes to existing users if possible, 
    // but for demo purposes, just resetting users is safer.
    set(KEYS.USERS, seedUsers);
    console.log('StorageService: Re-seeded users to include passenger role');
  }
}

// ---- Auth ----
export function login(username: string, password: string): User | null {
  const users = get<User>(KEYS.USERS);
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    setOne(KEYS.CURRENT_USER, user);
  }
  return user || null;
}

export function logout(): void {
  sessionStorage.removeItem(KEYS.CURRENT_USER);
}

export function getCurrentUser(): User | null {
  return getOne<User>(KEYS.CURRENT_USER);
}

// ---- Users ----
export function getUsers(): User[] {
  return get<User>(KEYS.USERS);
}

export function getUserById(id: string): User | null {
  return get<User>(KEYS.USERS).find(u => u.id === id) || null;
}

export function createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
  const users = get<User>(KEYS.USERS);
  const newUser: User = {
    ...userData,
    id: generateId('user'),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  set(KEYS.USERS, users);
  return newUser;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = get<User>(KEYS.USERS);
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  set(KEYS.USERS, users);
  
  // Update current user if it's the same
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === id) {
    setOne(KEYS.CURRENT_USER, users[index]);
  }
  return users[index];
}

export function usernameExists(username: string): boolean {
  return get<User>(KEYS.USERS).some(u => u.username === username);
}

// ---- Applications ----
export function getApplications(): Application[] {
  return get<Application>(KEYS.APPLICATIONS);
}

export function getApplicationById(id: string): Application | null {
  return get<Application>(KEYS.APPLICATIONS).find(a => a.id === id) || null;
}

export function getApplicationsByUser(userId: string): Application[] {
  return get<Application>(KEYS.APPLICATIONS).filter(a => a.applicantId === userId);
}

export function createApplication(appData: Omit<Application, 'id' | 'submittedAt' | 'updatedAt'>): Application {
  const apps = get<Application>(KEYS.APPLICATIONS);
  const newApp: Application = {
    ...appData,
    id: generateId('app'),
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  apps.push(newApp);
  set(KEYS.APPLICATIONS, apps);
  return newApp;
}

export function updateApplication(id: string, updates: Partial<Application>): Application | null {
  const apps = get<Application>(KEYS.APPLICATIONS);
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) return null;
  apps[index] = { ...apps[index], ...updates, updatedAt: new Date().toISOString() };
  set(KEYS.APPLICATIONS, apps);
  return apps[index];
}

// ---- Franchises ----
export function getFranchises(): Franchise[] {
  return get<Franchise>(KEYS.FRANCHISES);
}

export function getFranchiseById(id: string): Franchise | null {
  return get<Franchise>(KEYS.FRANCHISES).find(f => f.id === id) || null;
}

export function getFranchisesByUser(userId: string): Franchise[] {
  return get<Franchise>(KEYS.FRANCHISES).filter(f => f.operatorId === userId);
}

export function createFranchise(franchData: Omit<Franchise, 'id'>): Franchise {
  const franchises = get<Franchise>(KEYS.FRANCHISES);
  const newFranch: Franchise = {
    ...franchData,
    id: generateId('fran'),
  };
  franchises.push(newFranch);
  set(KEYS.FRANCHISES, franchises);
  return newFranch;
}

export function updateFranchise(id: string, updates: Partial<Franchise>): Franchise | null {
  const franchises = get<Franchise>(KEYS.FRANCHISES);
  const index = franchises.findIndex(f => f.id === id);
  if (index === -1) return null;
  franchises[index] = { ...franchises[index], ...updates };
  set(KEYS.FRANCHISES, franchises);
  return franchises[index];
}

// ---- Payments ----
export function getPayments(): Payment[] {
  return get<Payment>(KEYS.PAYMENTS);
}

export function getPaymentsByUser(userId: string): Payment[] {
  return get<Payment>(KEYS.PAYMENTS).filter(p => p.payerId === userId);
}

export function createPayment(payData: Omit<Payment, 'id' | 'referenceNumber' | 'createdAt'>): Payment {
  const payments = get<Payment>(KEYS.PAYMENTS);
  const newPay: Payment = {
    ...payData,
    id: generateId('pay'),
    referenceNumber: generateRefNumber(),
    createdAt: new Date().toISOString(),
  };
  payments.push(newPay);
  set(KEYS.PAYMENTS, payments);
  return newPay;
}

export function updatePayment(id: string, updates: Partial<Payment>): Payment | null {
  const payments = get<Payment>(KEYS.PAYMENTS);
  const index = payments.findIndex(p => p.id === id);
  if (index === -1) return null;
  payments[index] = { ...payments[index], ...updates };
  set(KEYS.PAYMENTS, payments);
  return payments[index];
}

// ---- Receipts ----
export function getReceipts(): Receipt[] {
  return get<Receipt>(KEYS.RECEIPTS);
}

export function getReceiptsByUser(userId: string): Receipt[] {
  const userPayments = getPaymentsByUser(userId);
  const paymentIds = userPayments.map(p => p.id);
  return get<Receipt>(KEYS.RECEIPTS).filter(r => paymentIds.includes(r.paymentId));
}

export function createReceipt(receiptData: Omit<Receipt, 'id' | 'receiptNumber' | 'issuedAt'>): Receipt {
  const receipts = get<Receipt>(KEYS.RECEIPTS);
  const newReceipt: Receipt = {
    ...receiptData,
    id: generateId('rcpt'),
    receiptNumber: generateReceiptNumber(),
    issuedAt: new Date().toISOString(),
  };
  receipts.push(newReceipt);
  set(KEYS.RECEIPTS, receipts);
  return newReceipt;
}

// ---- Drivers ----
export function getDrivers(): DriverProfile[] {
  return get<DriverProfile>(KEYS.DRIVERS);
}

export function getDriverById(id: string): DriverProfile | null {
  return get<DriverProfile>(KEYS.DRIVERS).find(d => d.id === id) || null;
}

export function getDriverByUserId(userId: string): DriverProfile | null {
  return get<DriverProfile>(KEYS.DRIVERS).find(d => d.userId === userId) || null;
}

export function createDriver(driverData: Omit<DriverProfile, 'id' | 'registeredAt'>): DriverProfile {
  const drivers = get<DriverProfile>(KEYS.DRIVERS);
  const newDriver: DriverProfile = {
    ...driverData,
    id: generateId('drv'),
    registeredAt: new Date().toISOString(),
  };
  drivers.push(newDriver);
  set(KEYS.DRIVERS, drivers);
  return newDriver;
}

export function updateDriver(id: string, updates: Partial<DriverProfile>): DriverProfile | null {
  const drivers = get<DriverProfile>(KEYS.DRIVERS);
  const index = drivers.findIndex(d => d.id === id);
  if (index === -1) return null;
  drivers[index] = { ...drivers[index], ...updates };
  set(KEYS.DRIVERS, drivers);
  return drivers[index];
}

// ---- Feedback ----
export function getFeedback(): Feedback[] {
  return get<Feedback>(KEYS.FEEDBACK);
}

export function getFeedbackByDriver(driverId: string): Feedback[] {
  return get<Feedback>(KEYS.FEEDBACK).filter(f => f.driverId === driverId);
}

export function createFeedback(fbData: Omit<Feedback, 'id' | 'createdAt' | 'status'>): Feedback {
  const feedback = get<Feedback>(KEYS.FEEDBACK);
  const newFb: Feedback = {
    ...fbData,
    id: generateId('fb'),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  feedback.push(newFb);
  set(KEYS.FEEDBACK, feedback);
  
  // Update driver's average rating
  const driverFeedbacks = [...feedback.filter(f => f.driverId === fbData.driverId), newFb];
  const avgRating = driverFeedbacks.reduce((sum, f) => sum + f.rating, 0) / driverFeedbacks.length;
  updateDriver(fbData.driverId, { averageRating: Math.round(avgRating * 10) / 10 });
  
  return newFb;
}

export function updateFeedback(id: string, updates: Partial<Feedback>): Feedback | null {
  const feedback = get<Feedback>(KEYS.FEEDBACK);
  const index = feedback.findIndex(f => f.id === id);
  if (index === -1) return null;
  feedback[index] = { ...feedback[index], ...updates };
  set(KEYS.FEEDBACK, feedback);
  return feedback[index];
}

// ---- Fee Config ----
export function getFeeConfig(): FeeConfig {
  return getOne<FeeConfig>(KEYS.FEE_CONFIG) || {
    newRegistrationResident: 500,
    newRegistrationNonResident: 1000,
    renewalResident: 300,
    renewalNonResident: 600,
    latePenaltyPerMonth: 50,
    maxLatePenaltyMonths: 12,
  };
}

export function updateFeeConfig(updates: Partial<FeeConfig>): FeeConfig {
  const config = getFeeConfig();
  const updated = { ...config, ...updates };
  setOne(KEYS.FEE_CONFIG, updated);
  return updated;
}

export function calculateFee(type: ApplicationType, residency: ResidencyType, monthsLate: number = 0): { baseFee: number; latePenalty: number; totalFee: number } {
  const config = getFeeConfig();
  let baseFee: number;

  if (type === 'new') {
    baseFee = residency === 'resident' ? config.newRegistrationResident : config.newRegistrationNonResident;
  } else {
    baseFee = residency === 'resident' ? config.renewalResident : config.renewalNonResident;
  }

  const cappedMonths = Math.min(monthsLate, config.maxLatePenaltyMonths);
  const latePenalty = cappedMonths * config.latePenaltyPerMonth;

  return {
    baseFee,
    latePenalty,
    totalFee: baseFee + latePenalty,
  };
}

// ---- Notifications ----
export function getNotifications(userId: string): Notification[] {
  return get<Notification>(KEYS.NOTIFICATIONS).filter(n => n.userId === userId);
}

export function getUnreadNotificationCount(userId: string): number {
  return getNotifications(userId).filter(n => !n.read).length;
}

export function createNotification(notifData: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
  const notifs = get<Notification>(KEYS.NOTIFICATIONS);
  const newNotif: Notification = {
    ...notifData,
    id: generateId('notif'),
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifs.push(newNotif);
  set(KEYS.NOTIFICATIONS, notifs);
  return newNotif;
}

export function markNotificationRead(id: string): void {
  const notifs = get<Notification>(KEYS.NOTIFICATIONS);
  const index = notifs.findIndex(n => n.id === id);
  if (index !== -1) {
    notifs[index].read = true;
    set(KEYS.NOTIFICATIONS, notifs);
  }
}

export function markAllNotificationsRead(userId: string): void {
  const notifs = get<Notification>(KEYS.NOTIFICATIONS);
  notifs.forEach(n => {
    if (n.userId === userId) n.read = true;
  });
  set(KEYS.NOTIFICATIONS, notifs);
}

export function deleteNotification(id: string): void {
  const notifs = get<Notification>(KEYS.NOTIFICATIONS);
  const filtered = notifs.filter(n => n.id !== id);
  set(KEYS.NOTIFICATIONS, filtered);
}

// ---- Dashboard Stats ----
export function getAdminStats() {
  const apps = getApplications();
  const franchises = getFranchises();
  const drivers = getDrivers();
  const payments = getPayments();
  const feedback = getFeedback();

  return {
    totalApplications: apps.length,
    pendingApplications: apps.filter(a => a.status === 'pending').length,
    underReviewApplications: apps.filter(a => a.status === 'under_review').length,
    approvedApplications: apps.filter(a => a.status === 'approved').length,
    rejectedApplications: apps.filter(a => a.status === 'rejected').length,
    totalFranchises: franchises.length,
    activeFranchises: franchises.filter(f => f.status === 'active').length,
    expiredFranchises: franchises.filter(f => f.status === 'expired').length,
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter(d => d.status === 'active').length,
    inactiveDrivers: drivers.filter(d => d.status === 'inactive').length,
    suspendedDrivers: drivers.filter(d => d.status === 'suspended').length,
    totalPayments: payments.length,
    completedPayments: payments.filter(p => p.status === 'completed').length,
    totalRevenue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    totalFeedback: feedback.length,
    pendingFeedback: feedback.filter(f => f.status === 'pending').length,
    averageRating: feedback.length > 0 ? Math.round((feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length) * 10) / 10 : 0,
  };
}
