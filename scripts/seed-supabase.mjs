// ============================================
// Supabase Test Data Seeder
// Run: node scripts/seed-supabase.mjs
// ============================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jauxmhmhyqkmestlhaln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphdXhtaG1oeXFrbWVzdGxoYWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMDAxMjgsImV4cCI6MjEwNjg3NjEyOH0.kUoo13qUucFG803DvTUPfUeaKwgpER-vbiUMu2bS79s';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// Helper Dates
// ============================================
const now = new Date();
const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
const tenMonthsLater = new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000).toISOString();

// ============================================
// 1. PROFILES (Users)
// ============================================
const profiles = [
  {
    username: 'admin',
    password_hash: 'admin123',
    role: 'admin',
    first_name: 'Maria',
    last_name: 'Garcia',
    middle_name: 'Santos',
    email: 'admin@baliuag.gov.ph',
    phone: '0917-123-4567',
    address: 'Baliuag Municipal Hall, Bulacan',
    toda_name: 'BTTMO Baliuag',
    account_status: 'approved',
    admin_permissions: JSON.stringify(['security', 'requirements', 'payment', 'analytics', 'president']),
    created_at: oneYearAgo,
  },
  {
    username: 'driver',
    password_hash: 'driver123',
    role: 'driver',
    first_name: 'Juan',
    last_name: 'Manaloto',
    middle_name: 'Reyes',
    email: 'jmanaloto@gmail.com',
    phone: '0918-555-0101',
    address: 'Brgy. Poblacion, Baliuag, Bulacan',
    toda_name: 'BASTODA (Baliuag Poblacion TODA)',
    account_status: 'approved',
    created_at: sixMonthsAgo,
  },
  {
    username: 'todapres',
    password_hash: 'toda123',
    role: 'president',
    first_name: 'Ernesto',
    last_name: 'Santos',
    middle_name: 'Cruz',
    email: 'president@bastoda.org',
    phone: '0919-888-0202',
    address: 'BASTODA Terminal, Brgy. Poblacion, Baliuag',
    toda_name: 'BASTODA (Baliuag Poblacion TODA)',
    account_status: 'approved',
    admin_permissions: JSON.stringify(['president']),
    created_at: oneYearAgo,
  },
  {
    username: 'operator',
    password_hash: 'operator123',
    role: 'operator',
    first_name: 'Juan',
    last_name: 'Cruz',
    middle_name: 'Dela',
    email: 'jcruz@email.com',
    phone: '0920-777-0303',
    address: 'Brgy. Sabang, Baliuag, Bulacan',
    toda_name: 'SMTODA (Sabang Terminal TODA)',
    account_status: 'approved',
    created_at: oneYearAgo,
  },
  {
    username: 'driver2',
    password_hash: 'driver123',
    role: 'driver',
    first_name: 'Pedro',
    last_name: 'Penduko',
    middle_name: null,
    email: 'ppenduko@email.com',
    phone: '0921-444-0404',
    address: 'Brgy. Tangos, Baliuag, Bulacan',
    toda_name: 'SMTODA (Sabang Terminal TODA)',
    account_status: 'approved',
    created_at: oneMonthAgo,
  },
  {
    username: 'driver3',
    password_hash: 'driver123',
    role: 'driver',
    first_name: 'Ricardo',
    last_name: 'Dalisay',
    middle_name: 'Magtanggol',
    email: 'rdalisay@gmail.com',
    phone: '0923-111-0505',
    address: 'Brgy. Tibag, Baliuag, Bulacan',
    toda_name: 'TIBTODA (Tibag TODA)',
    account_status: 'approved',
    created_at: threeMonthsAgo,
  },
  {
    username: 'operator2',
    password_hash: 'operator123',
    role: 'operator',
    first_name: 'Elena',
    last_name: 'Villanueva',
    middle_name: 'Reyes',
    email: 'evillanueva@email.com',
    phone: '0925-666-0606',
    address: 'Brgy. Concepcion, Baliuag, Bulacan',
    toda_name: 'CONTODA (Concepcion TODA)',
    account_status: 'approved',
    created_at: sixMonthsAgo,
  },
  {
    username: 'newapplicant',
    password_hash: 'driver123',
    role: 'driver',
    first_name: 'Arnel',
    last_name: 'Bautista',
    middle_name: null,
    email: 'abautista@gmail.com',
    phone: '0922-333-8899',
    address: 'Brgy. Concepcion, Baliuag, Bulacan',
    toda_name: 'CONTODA (Concepcion TODA)',
    account_status: 'pending',
    created_at: yesterday,
  },
];

async function seedProfiles() {
  console.log('\n📋 Seeding PROFILES...');

  // Delete existing data first (clean slate)
  const { error: delErr } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.warn('  ⚠ Delete profiles warning:', delErr.message);

  const { data, error } = await supabase.from('profiles').insert(profiles).select();
  if (error) {
    console.error('  ❌ Error inserting profiles:', error.message);
    return [];
  }
  console.log(`  ✅ Inserted ${data.length} profiles`);
  return data;
}

// ============================================
// 2. APPLICATIONS (various stages)
// ============================================
function buildApplications(profileMap) {
  const driverId = profileMap['driver'];
  const driver2Id = profileMap['driver2'];
  const driver3Id = profileMap['driver3'];
  const operatorId = profileMap['operator'];
  const operator2Id = profileMap['operator2'];

  return [
    // APP 1: APPROVED (full flow completed) - driver Juan
    {
      applicant_id: driverId,
      applicant_name: 'Juan Manaloto',
      applicant_role: 'driver',
      type: 'new',
      status: 'approved',
      driver_name: 'Juan Reyes Manaloto',
      license_number: 'N01-23-456789',
      vehicle_make: 'Honda',
      vehicle_model: 'TMX 155',
      plate_number: 'MC-1234',
      motor_number: 'HN155-2024-00123',
      chassis_number: 'HNCH-2024-00123',
      vehicle_color: 'Blue/White',
      toda_name: 'BASTODA (Baliuag Poblacion TODA)',
      route_area: 'Poblacion - Market - City Hall - Terminal',
      documents: JSON.stringify([
        { name: 'Drivers License', url: 'https://placehold.co/400x300?text=License', uploadedAt: sixMonthsAgo },
        { name: 'OR/CR', url: 'https://placehold.co/400x300?text=OR-CR', uploadedAt: sixMonthsAgo },
        { name: 'Barangay Clearance', url: 'https://placehold.co/400x300?text=Clearance', uploadedAt: sixMonthsAgo },
      ]),
      inspection: JSON.stringify({
        id: 'insp-001',
        applicationId: 'app-1',
        engineNumber: 'HN155-2024-00123',
        chassisNumber: 'HNCH-2024-00123',
        engineVerified: true,
        chassisVerified: true,
        inspectorName: 'Maria Garcia',
        inspectedAt: threeMonthsAgo,
        status: 'passed',
        notes: 'All clear. Vehicle in good condition.',
      }),
      treasurer_payment: JSON.stringify({
        paid: true,
        amount: 450,
        orNumber: 'OR-2026-00101',
        paidAt: threeMonthsAgo,
        paymentMethod: 'cash',
      }),
      toda_approval: JSON.stringify({
        approvedBy: profileMap['todapres'],
        approvedByName: 'Ernesto Santos',
        todaName: 'BASTODA (Baliuag Poblacion TODA)',
        approvedAt: threeMonthsAgo,
        routeFeePaid: true,
        membershipFeePaid: true,
        routeFeeAmount: 500,
        membershipFeeAmount: 300,
        orNumber: 'TODA-OR-001',
        remarks: 'Active member in good standing.',
      }),
      president_endorsed: true,
      president_endorsed_at: threeMonthsAgo,
      president_endorsed_by: 'Ernesto Santos',
      president_remarks: 'Recommended for MTOP approval.',
      start_date: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date(now.getTime() + 275 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      base_fee: 450,
      toda_fee: 800,
      late_penalty: 0,
      total_fee: 1250,
      admin_notes: 'All requirements complete. MTOP granted.',
      reviewed_by: 'Maria Garcia',
      reviewed_at: threeMonthsAgo,
      mtop_number: 'MTOP-2026-1001',
      qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=MTOP-2026-1001-JUAN-MANALOTO',
      submitted_at: sixMonthsAgo,
    },

    // APP 2: PENDING PAYMENT (inspection passed, waiting treasurer) - operator Juan Cruz
    {
      applicant_id: operatorId,
      applicant_name: 'Juan Cruz',
      applicant_role: 'operator',
      type: 'new',
      status: 'inspection_passed',
      driver_name: 'Marco Dela Cruz',
      license_number: 'N02-34-567890',
      vehicle_make: 'Yamaha',
      vehicle_model: 'YTX 125',
      plate_number: 'MC-5678',
      motor_number: 'YM125-2024-00456',
      chassis_number: 'YMCH-2024-00456',
      vehicle_color: 'Red/Black',
      toda_name: 'SMTODA (Sabang Terminal TODA)',
      route_area: 'Sabang - Market - Baliuag Proper',
      documents: JSON.stringify([
        { name: 'Drivers License', url: 'https://placehold.co/400x300?text=License', uploadedAt: oneMonthAgo },
        { name: 'OR/CR', url: 'https://placehold.co/400x300?text=OR-CR', uploadedAt: oneMonthAgo },
        { name: 'Barangay Clearance', url: 'https://placehold.co/400x300?text=Clearance', uploadedAt: oneMonthAgo },
      ]),
      inspection: JSON.stringify({
        id: 'insp-002',
        applicationId: 'app-2',
        engineNumber: 'YM125-2024-00456',
        chassisNumber: 'YMCH-2024-00456',
        engineVerified: true,
        chassisVerified: true,
        inspectorName: 'Maria Garcia',
        inspectedAt: twoWeeksAgo,
        status: 'passed',
        notes: 'Vehicle meets safety standards.',
      }),
      treasurer_payment: null,
      toda_approval: null,
      president_endorsed: false,
      start_date: null,
      end_date: null,
      base_fee: 450,
      toda_fee: 800,
      late_penalty: 0,
      total_fee: 1250,
      submitted_at: oneMonthAgo,
    },

    // APP 3: PENDING TODA APPROVAL (paid, waiting TODA president) - driver Pedro
    {
      applicant_id: driver2Id,
      applicant_name: 'Pedro Penduko',
      applicant_role: 'driver',
      type: 'new',
      status: 'pending_toda_approval',
      driver_name: 'Pedro Penduko',
      license_number: 'N03-45-678901',
      vehicle_make: 'Suzuki',
      vehicle_model: 'Raider 150',
      plate_number: 'MC-9012',
      motor_number: 'SZ150-2024-00789',
      chassis_number: 'SZCH-2024-00789',
      vehicle_color: 'Green/Silver',
      toda_name: 'SMTODA (Sabang Terminal TODA)',
      route_area: 'Sabang - Tangos - Baliuag Terminal',
      documents: JSON.stringify([
        { name: 'Drivers License', url: 'https://placehold.co/400x300?text=License', uploadedAt: twoWeeksAgo },
        { name: 'OR/CR', url: 'https://placehold.co/400x300?text=OR-CR', uploadedAt: twoWeeksAgo },
      ]),
      inspection: JSON.stringify({
        id: 'insp-003',
        applicationId: 'app-3',
        engineNumber: 'SZ150-2024-00789',
        chassisNumber: 'SZCH-2024-00789',
        engineVerified: true,
        chassisVerified: true,
        inspectorName: 'Maria Garcia',
        inspectedAt: oneWeekAgo,
        status: 'passed',
      }),
      treasurer_payment: JSON.stringify({
        paid: true,
        amount: 450,
        orNumber: 'OR-2026-00201',
        paidAt: oneWeekAgo,
        paymentMethod: 'gcash',
      }),
      toda_approval: null,
      president_endorsed: false,
      start_date: null,
      end_date: null,
      base_fee: 450,
      toda_fee: 800,
      late_penalty: 0,
      total_fee: 1250,
      submitted_at: twoWeeksAgo,
    },

    // APP 4: PENDING ADMIN APPROVAL (TODA president approved, waiting admin) - driver Ricardo
    {
      applicant_id: driver3Id,
      applicant_name: 'Ricardo Dalisay',
      applicant_role: 'driver',
      type: 'new',
      status: 'pending_admin_approval',
      driver_name: 'Ricardo Magtanggol Dalisay',
      license_number: 'N04-56-789012',
      vehicle_make: 'Honda',
      vehicle_model: 'XRM 125',
      plate_number: 'MC-3456',
      motor_number: 'HN125-2024-01010',
      chassis_number: 'HNCH-2024-01010',
      vehicle_color: 'Black/Red',
      toda_name: 'TIBTODA (Tibag TODA)',
      route_area: 'Tibag - Baliuag Market - City Hall',
      documents: JSON.stringify([
        { name: 'Drivers License', url: 'https://placehold.co/400x300?text=License', uploadedAt: oneMonthAgo },
        { name: 'OR/CR', url: 'https://placehold.co/400x300?text=OR-CR', uploadedAt: oneMonthAgo },
        { name: 'Barangay Clearance', url: 'https://placehold.co/400x300?text=Clearance', uploadedAt: oneMonthAgo },
        { name: 'TODA Endorsement', url: 'https://placehold.co/400x300?text=TODA-Cert', uploadedAt: oneWeekAgo },
      ]),
      inspection: JSON.stringify({
        id: 'insp-004',
        applicationId: 'app-4',
        engineNumber: 'HN125-2024-01010',
        chassisNumber: 'HNCH-2024-01010',
        engineVerified: true,
        chassisVerified: true,
        inspectorName: 'Maria Garcia',
        inspectedAt: twoWeeksAgo,
        status: 'passed',
        notes: 'Passed stenciling inspection.',
      }),
      treasurer_payment: JSON.stringify({
        paid: true,
        amount: 450,
        orNumber: 'OR-2026-00301',
        paidAt: twoWeeksAgo,
        paymentMethod: 'cash',
      }),
      toda_approval: JSON.stringify({
        approvedBy: profileMap['todapres'],
        approvedByName: 'Ernesto Santos',
        todaName: 'TIBTODA (Tibag TODA)',
        approvedAt: oneWeekAgo,
        routeFeePaid: true,
        membershipFeePaid: true,
        routeFeeAmount: 500,
        membershipFeeAmount: 300,
        orNumber: 'TODA-OR-004',
        remarks: 'Active member, all TODA fees paid.',
      }),
      president_endorsed: true,
      president_endorsed_at: oneWeekAgo,
      president_endorsed_by: 'Ernesto Santos',
      president_remarks: 'Endorsed for MTOP issuance.',
      start_date: null,
      end_date: null,
      base_fee: 450,
      toda_fee: 800,
      late_penalty: 0,
      total_fee: 1250,
      submitted_at: oneMonthAgo,
    },

    // APP 5: DRAFT (not yet submitted) - operator Elena
    {
      applicant_id: operator2Id,
      applicant_name: 'Elena Villanueva',
      applicant_role: 'operator',
      type: 'new',
      status: 'draft',
      driver_name: 'Antonio Villanueva',
      license_number: 'N05-67-890123',
      vehicle_make: 'Honda',
      vehicle_model: 'Wave 110',
      plate_number: 'MC-7890',
      motor_number: 'HN110-2024-02020',
      chassis_number: 'HNCH-2024-02020',
      vehicle_color: 'White/Blue',
      toda_name: 'CONTODA (Concepcion TODA)',
      route_area: 'Concepcion - Baliuag Market - Terminal',
      documents: JSON.stringify([]),
      inspection: null,
      treasurer_payment: null,
      toda_approval: null,
      president_endorsed: false,
      start_date: null,
      end_date: null,
      base_fee: 450,
      toda_fee: 800,
      late_penalty: 0,
      total_fee: 1250,
      submitted_at: yesterday,
    },

    // APP 6: SUBMITTED (pending review) - renewal for driver Juan
    {
      applicant_id: driverId,
      applicant_name: 'Juan Manaloto',
      applicant_role: 'driver',
      type: 'renewal',
      status: 'submitted',
      driver_name: 'Juan Reyes Manaloto',
      license_number: 'N01-23-456789',
      vehicle_make: 'Honda',
      vehicle_model: 'TMX 155',
      plate_number: 'MC-1234',
      motor_number: 'HN155-2024-00123',
      chassis_number: 'HNCH-2024-00123',
      vehicle_color: 'Blue/White',
      toda_name: 'BASTODA (Baliuag Poblacion TODA)',
      route_area: 'Poblacion - Market - City Hall - Terminal',
      documents: JSON.stringify([
        { name: 'Drivers License', url: 'https://placehold.co/400x300?text=License-Renewed', uploadedAt: threeDaysAgo },
        { name: 'OR/CR (2026)', url: 'https://placehold.co/400x300?text=OR-CR-2026', uploadedAt: threeDaysAgo },
      ]),
      inspection: null,
      treasurer_payment: null,
      toda_approval: null,
      president_endorsed: false,
      start_date: null,
      end_date: null,
      base_fee: 450,
      toda_fee: 800,
      late_penalty: 200,
      total_fee: 1450,
      submitted_at: threeDaysAgo,
    },
  ];
}

async function seedApplications(profileMap) {
  console.log('\n📝 Seeding APPLICATIONS...');

  const { error: delErr } = await supabase.from('applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.warn('  ⚠ Delete applications warning:', delErr.message);

  const apps = buildApplications(profileMap);
  const { data, error } = await supabase.from('applications').insert(apps).select();
  if (error) {
    console.error('  ❌ Error inserting applications:', error.message);
    return [];
  }
  console.log(`  ✅ Inserted ${data.length} applications`);
  return data;
}

// ============================================
// 3. FRANCHISES (for approved applications)
// ============================================
function buildFranchises(profileMap, appData) {
  const approvedApp = appData.find(a => a.status === 'approved');
  if (!approvedApp) return [];

  const startDate = approvedApp.start_date || now.toISOString().split('T')[0];
  const endDate = approvedApp.end_date || new Date(now.getTime() + 275 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return [
    {
      mtop_number: 'MTOP-2026-1001',
      application_id: approvedApp.id,
      operator_id: profileMap['driver'],
      operator_name: 'Juan Manaloto',
      driver_id: profileMap['driver'],
      driver_name: 'Juan Reyes Manaloto',
      vehicle_make: 'Honda',
      vehicle_model: 'TMX 155',
      plate_number: 'MC-1234',
      motor_number: 'HN155-2024-00123',
      chassis_number: 'HNCH-2024-00123',
      vehicle_color: 'Blue/White',
      toda_name: 'BASTODA (Baliuag Poblacion TODA)',
      route_area: 'Poblacion - Market - City Hall - Terminal',
      status: 'active',
      start_date: startDate,
      end_date: endDate,
      issued_at: threeMonthsAgo,
      expires_at: oneYearLater,
      renewal_date: tenMonthsLater,
      qr_code_data: 'BALIUAG-MTOP|MTOP-2026-1001|PLATE:MC-1234|DRIVER:Juan Reyes Manaloto',
    },
  ];
}

async function seedFranchises(profileMap, appData) {
  console.log('\n🏢 Seeding FRANCHISES...');

  const { error: delErr } = await supabase.from('franchises').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.warn('  ⚠ Delete franchises warning:', delErr.message);

  const franchises = buildFranchises(profileMap, appData);
  if (franchises.length === 0) {
    console.log('  ⚠ No approved applications found, skipping franchises.');
    return [];
  }

  const { data, error } = await supabase.from('franchises').insert(franchises).select();
  if (error) {
    console.error('  ❌ Error inserting franchises:', error.message);
    return [];
  }
  console.log(`  ✅ Inserted ${data.length} franchises`);
  return data;
}

// ============================================
// 4. PAYMENTS
// ============================================
function buildPayments(profileMap, appData) {
  const payments = [];

  // Payment for the approved app
  const approvedApp = appData.find(a => a.status === 'approved');
  if (approvedApp) {
    payments.push({
      application_id: approvedApp.id,
      payer_id: profileMap['driver'],
      payer_name: 'Juan Manaloto',
      amount: 450.00,
      description: 'MTOP Registration Fee - New Application',
      status: 'completed',
      payment_method: 'cash',
      reference_number: 'OR-2026-00101',
      paid_at: threeMonthsAgo,
    });
  }

  // Payment for the pending_toda_approval app (already paid)
  const todaApp = appData.find(a => a.status === 'pending_toda_approval');
  if (todaApp) {
    payments.push({
      application_id: todaApp.id,
      payer_id: profileMap['driver2'],
      payer_name: 'Pedro Penduko',
      amount: 450.00,
      description: 'MTOP Registration Fee - New Application (GCash)',
      status: 'completed',
      payment_method: 'gcash',
      reference_number: 'OR-2026-00201',
      paid_at: oneWeekAgo,
    });
  }

  // Payment for pending_admin_approval app
  const adminApp = appData.find(a => a.status === 'pending_admin_approval');
  if (adminApp) {
    payments.push({
      application_id: adminApp.id,
      payer_id: profileMap['driver3'],
      payer_name: 'Ricardo Dalisay',
      amount: 450.00,
      description: 'MTOP Registration Fee - New Application',
      status: 'completed',
      payment_method: 'cash',
      reference_number: 'OR-2026-00301',
      paid_at: twoWeeksAgo,
    });
  }

  // A pending payment for the inspection_passed app
  const inspApp = appData.find(a => a.status === 'inspection_passed');
  if (inspApp) {
    payments.push({
      application_id: inspApp.id,
      payer_id: profileMap['operator'],
      payer_name: 'Juan Cruz',
      amount: 450.00,
      description: 'MTOP Registration Fee - Pending Payment',
      status: 'pending',
      payment_method: 'gcash',
      reference_number: `REF-PENDING-${Date.now()}`,
    });
  }

  return payments;
}

async function seedPayments(profileMap, appData) {
  console.log('\n💰 Seeding PAYMENTS...');

  const { error: delErr } = await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.warn('  ⚠ Delete payments warning:', delErr.message);

  const payments = buildPayments(profileMap, appData);
  if (payments.length === 0) {
    console.log('  ⚠ No payment data to insert.');
    return [];
  }

  const { data, error } = await supabase.from('payments').insert(payments).select();
  if (error) {
    console.error('  ❌ Error inserting payments:', error.message);
    return [];
  }
  console.log(`  ✅ Inserted ${data.length} payments`);
  return data;
}

// ============================================
// 5. PENALTIES
// ============================================
function buildPenalties(profileMap) {
  return [
    {
      driver_id: profileMap['driver2'],
      driver_name: 'Pedro Penduko',
      plate_number: 'MC-9012',
      toda_name: 'SMTODA (Sabang Terminal TODA)',
      violation_type: 'Overloading',
      amount: 500.00,
      status: 'unpaid',
      issued_date: twoWeeksAgo.split('T')[0],
      due_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remarks: 'Exceeded maximum passenger capacity.',
      issued_by: 'BTTMO Enforcer - Jose Villanueva',
    },
    {
      driver_id: profileMap['driver'],
      driver_name: 'Juan Manaloto',
      plate_number: 'MC-1234',
      toda_name: 'BASTODA (Baliuag Poblacion TODA)',
      violation_type: 'Expired MTOP Sticker',
      amount: 300.00,
      status: 'paid',
      issued_date: oneMonthAgo.split('T')[0],
      due_date: twoWeeksAgo.split('T')[0],
      paid_at: twoWeeksAgo,
      remarks: 'Expired sticker found during routine inspection.',
      issued_by: 'BTTMO Enforcer - Andres Garcia',
    },
    {
      driver_id: profileMap['driver3'],
      driver_name: 'Ricardo Dalisay',
      plate_number: 'MC-3456',
      toda_name: 'TIBTODA (Tibag TODA)',
      violation_type: 'Illegal Parking at Designated No-Parking Zone',
      amount: 750.00,
      status: 'unpaid',
      issued_date: threeDaysAgo.split('T')[0],
      due_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remarks: 'Parked on pedestrian walkway near market entrance.',
      issued_by: 'BTTMO Enforcer - Jose Villanueva',
    },
  ];
}

async function seedPenalties(profileMap) {
  console.log('\n🚨 Seeding PENALTIES...');

  const { error: delErr } = await supabase.from('penalties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.warn('  ⚠ Delete penalties warning:', delErr.message);

  const penalties = buildPenalties(profileMap);
  const { data, error } = await supabase.from('penalties').insert(penalties).select();
  if (error) {
    console.error('  ❌ Error inserting penalties:', error.message);
    return [];
  }
  console.log(`  ✅ Inserted ${data.length} penalties`);
  return data;
}

// ============================================
// 6. SMS NOTIFICATIONS
// ============================================
function buildNotifications(profileMap) {
  return [
    {
      user_id: profileMap['driver'],
      recipient_phone: '0918-555-0101',
      title: 'MTOP Approved - MTOP-2026-1001',
      message: 'Congratulations! Ang inyong MTOP Application ay APRUBADO na. MTOP Number: MTOP-2026-1001. Makukuha po ang inyong sticker sa BTTMO Office.',
      type: 'approval',
      sent_at: threeMonthsAgo,
      read: true,
    },
    {
      user_id: profileMap['driver2'],
      recipient_phone: '0921-444-0404',
      title: 'Payment Confirmed',
      message: 'Ang inyong bayad na PHP 450.00 para sa MTOP Registration via GCash ay natanggap na. OR Number: OR-2026-00201.',
      type: 'payment_confirmed',
      sent_at: oneWeekAgo,
      read: false,
    },
    {
      user_id: profileMap['driver2'],
      recipient_phone: '0921-444-0404',
      title: 'Penalty Notice: Overloading',
      message: 'ABISO: Mayroon kayong na-record na penalty para sa Overloading (PHP 500.00). Mangyaring bayaran sa Treasurers Office.',
      type: 'penalty_alert',
      sent_at: twoWeeksAgo,
      read: false,
    },
    {
      user_id: profileMap['driver3'],
      recipient_phone: '0923-111-0505',
      title: 'TODA President Approval Received',
      message: 'Ang inyong TODA Route Approval at Membership Fee para sa TODA: TIBTODA ay APRUBADO na ni Ernesto Santos. Ipinasa na ito sa City Admin para sa final MTOP Approval.',
      type: 'toda_approval',
      sent_at: oneWeekAgo,
      read: false,
    },
  ];
}

async function seedNotifications(profileMap) {
  console.log('\n📱 Seeding SMS NOTIFICATIONS...');

  const { error: delErr } = await supabase.from('sms_notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.warn('  ⚠ Delete notifications warning:', delErr.message);

  const notifs = buildNotifications(profileMap);
  const { data, error } = await supabase.from('sms_notifications').insert(notifs).select();
  if (error) {
    console.error('  ❌ Error inserting notifications:', error.message);
    return [];
  }
  console.log(`  ✅ Inserted ${data.length} notifications`);
  return data;
}

// ============================================
// 7. FEE CONFIG
// ============================================
async function seedFeeConfig() {
  console.log('\n⚙️  Seeding FEE CONFIG...');

  const { error: delErr } = await supabase.from('fee_configs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.warn('  ⚠ Delete fee_configs warning:', delErr.message);

  const { data, error } = await supabase.from('fee_configs').insert({
    mtop_base_fee: 450.00,
    toda_route_fee: 500.00,
    toda_membership_fee: 300.00,
    stenciling_fee: 150.00,
    late_penalty_per_month: 200.00,
  }).select();

  if (error) {
    console.error('  ❌ Error inserting fee config:', error.message);
    return null;
  }
  console.log('  ✅ Fee config inserted');
  return data;
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('🚀 =======================================');
  console.log('   Baliuag Franchise System - Supabase Seeder');
  console.log('   =======================================\n');
  console.log(`   Target: ${SUPABASE_URL}`);
  console.log(`   Time:   ${now.toISOString()}\n`);

  // Step 1: Profiles
  const profileData = await seedProfiles();
  if (profileData.length === 0) {
    console.error('\n❌ No profiles created. Cannot proceed. Check your Supabase connection & RLS policies.');
    process.exit(1);
  }

  // Build profile lookup map: username -> uuid
  const profileMap = {};
  for (const p of profileData) {
    profileMap[p.username] = p.id;
  }
  console.log('\n   Profile ID Map:');
  for (const [uname, uid] of Object.entries(profileMap)) {
    console.log(`     ${uname.padEnd(15)} -> ${uid}`);
  }

  // Step 2: Fee Config
  await seedFeeConfig();

  // Step 3: Applications
  const appData = await seedApplications(profileMap);

  // Step 4: Franchises
  await seedFranchises(profileMap, appData);

  // Step 5: Payments
  await seedPayments(profileMap, appData);

  // Step 6: Penalties
  await seedPenalties(profileMap);

  // Step 7: SMS Notifications
  await seedNotifications(profileMap);

  console.log('\n\n =======================================');
  console.log('   SEEDING COMPLETE!');
  console.log('   =======================================');
  console.log('\n   Test Accounts:');
  console.log('   ─────────────────────────────────────');
  console.log('   Admin:      admin / admin123');
  console.log('   Driver:     driver / driver123');
  console.log('   Driver 2:   driver2 / driver123');
  console.log('   Driver 3:   driver3 / driver123');
  console.log('   Operator:   operator / operator123');
  console.log('   Operator 2: operator2 / operator123');
  console.log('   TODA Pres:  todapres / toda123');
  console.log('   Pending:    newapplicant / driver123');
  console.log('   ─────────────────────────────────────\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
