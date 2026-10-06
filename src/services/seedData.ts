// ============================================
// Seed Data - Demo data for Baliuag Franchise System
// ============================================

import type { User, Application, Franchise, Penalty, SMSNotification, FeeConfig, Advertisement, InformationItem } from '../types';

const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

export const seedUsers: User[] = [
  {
    id: 'user-admin-01',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'admin@baliuag.gov.ph',
    phone: '0917-123-4567',
    address: 'Baliuag Municipal Hall, Bulacan',
    accountStatus: 'approved',
    adminPermissions: ['security', 'requirements', 'payment', 'analytics', 'president'],
    createdAt: oneYearAgo,
  },
  {
    id: 'user-driver-01',
    username: 'driver',
    password: 'driver123',
    role: 'driver',
    firstName: 'Juan',
    lastName: 'Manaloto',
    middleName: 'Reyes',
    email: 'jmanaloto@gmail.com',
    phone: '0918-555-0101',
    address: 'Brgy. Poblacion, Baliuag, Bulacan',
    todaName: 'BASTODA (Baliuag Poblacion TODA)',
    accountStatus: 'approved',
    createdAt: sixMonthsAgo,
  },
  {
    id: 'user-toda-01',
    username: 'todapres',
    password: 'toda123',
    role: 'president',
    firstName: 'Ernesto',
    lastName: 'Santos',
    middleName: 'Cruz',
    email: 'president@bastoda.org',
    phone: '0919-888-0202',
    address: 'BASTODA Terminal, Brgy. Poblacion, Baliuag',
    todaName: 'BASTODA (Baliuag Poblacion TODA)',
    accountStatus: 'approved',
    adminPermissions: ['president'],
    createdAt: oneYearAgo,
  },
  {
    id: 'user-operator-01',
    username: 'operator',
    password: 'operator123',
    role: 'operator',
    firstName: 'Juan',
    lastName: 'Cruz',
    middleName: 'Dela',
    email: 'jcruz@email.com',
    phone: '0920-777-0303',
    address: 'Brgy. Sabang, Baliuag, Bulacan',
    accountStatus: 'approved',
    createdAt: oneYearAgo,
  },
  {
    id: 'user-driver-02',
    username: 'driver2',
    password: 'driver123',
    role: 'driver',
    firstName: 'Pedro',
    lastName: 'Penduko',
    email: 'ppenduko@email.com',
    phone: '0921-444-0404',
    address: 'Brgy. Tangos, Baliuag, Bulacan',
    todaName: 'SMTODA (Sabang Terminal TODA)',
    accountStatus: 'approved',
    createdAt: oneMonthAgo,
  },
  {
    id: 'user-driver-pending',
    username: 'newapplicant',
    password: 'driver123',
    role: 'driver',
    firstName: 'Arnel',
    lastName: 'Bautista',
    email: 'abautista@gmail.com',
    phone: '0922-333-8899',
    address: 'Brgy. Concepcion, Baliuag, Bulacan',
    todaName: 'CONTODA (Concepcion TODA)',
    accountStatus: 'pending',
    createdAt: yesterday,
  }
];

export const seedApplications: Application[] = [];

export const seedFranchises: Franchise[] = [];

export const seedPenalties: Penalty[] = [];

export const seedSMSNotifications: SMSNotification[] = [];

export const seedFeeConfig: FeeConfig = {
  mtopBaseFee: 450,
  todaRouteFee: 500,
  todaMembershipFee: 300,
  stencilingFee: 150,
  latePenaltyPerMonth: 200,
};

export const seedAdvertisements: Advertisement[] = [
  {
    id: 'ad-001',
    title: 'City Traffic Advisory: Annual MTOP Renewal 2026',
    description: 'Ang taunang pagpaparehistro at renewal ng Tricycle Franchise para sa taong 2026 ay bukas na. Siguraduhing kumpleto ang mga requirements bago mag-submit.',
    category: 'announcement',
    isActive: true,
    displayOrder: 1,
    createdAt: oneMonthAgo,
  },
  {
    id: 'ad-002',
    title: 'BTTMO Inspection Safety Protocol',
    description: 'Pinaaalalahanan ang lahat ng TODA members na dalhin ang orihinal na OR/CR at siguraduhing maayos ang ilaw, preno, at emission ng traysikel para sa stenciling.',
    category: 'announcement',
    isActive: true,
    displayOrder: 2,
    createdAt: twoWeeksAgo,
  },
  {
    id: 'ad-003',
    title: 'Libreng Stenciling & Emission Assistance',
    description: 'Handog ng Lokal na Pamahalaan ng Baliuag katuwang ang BTTMO tuwing Lunes hanggang Biyernes, 8:00 AM - 4:00 PM sa City Hall Grounds.',
    category: 'sponsor',
    isActive: true,
    displayOrder: 3,
    createdAt: threeDaysAgo,
  }
];

export const seedInformationItems: InformationItem[] = [
  {
    id: 'info-001',
    title: 'Ordinansa Blg. 2024-08: Bagong Taripa ng Pamasahe',
    category: 'fare_matrix',
    content: 'Alinsunod sa City Ordinance, ang minimum regular fare para sa unang 2 kilometro ay Php 15.00 at Php 2.50 bawat dagdag na kilometro. 20% discount para sa Senior Citizen, PWD, at Estudyante.',
    isActive: true,
    publishedDate: '2026-01-15',
  },
  {
    id: 'info-002',
    title: 'Mga Kinakailangang Dokumento sa Pagpaparehistro',
    category: 'guideline',
    content: '1. Valid Driver\'s License (Professional) 2. Latest LTO Official Receipt & Certificate of Registration (OR/CR) 3. Barangay Clearance mula sa nasasakupang barangay 4. TODA Certificate of Endorsement 5. 2x2 ID Picture.',
    isActive: true,
    publishedDate: '2026-02-01',
  },
  {
    id: 'info-003',
    title: 'Direktoryo ng mga Akreditadong TODA sa Baliuag',
    category: 'toda_info',
    content: 'Kasalukuyang may 12 rehistradong TODA sa Baliuag City kabilang ang BASTODA (Poblacion), SMTODA (Sabang), CONTODA (Concepcion), TIBTODA (Tibag), at TARCTODA (Tarcan).',
    isActive: true,
    publishedDate: '2026-02-10',
  }
];

