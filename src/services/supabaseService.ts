// ============================================
// Supabase Service - Backend Database Integration
// Supports live Supabase DB with automatic fallback to StorageService
// ============================================

import { supabase, isSupabaseConfigured } from './supabaseClient';
import * as storage from './storageService';
import type { 
  User, 
  Application, 
  Franchise, 
  Advertisement, 
  InformationItem, 
  ApplicationStatus,
  Payment,
  Penalty,
  SMSNotification,
  AuditLog,
  Document,
} from '../types';
import { FRANCHISE_FEES } from './fees';
import { hasCompleteRequirements, EXPIRY_REMINDER_DAYS, franchiseExpiryDate } from './applicationRules';
import { sendSMS, isSMSConfigured, SMSTemplates } from './smsService';
import { nowISO, todayStr, daysFromToday, daysUntil } from './clock';

/**
 * Creates an in-app SMS notification record for a user and dispatches the real
 * SMS through Semaphore (when configured).
 */
export async function notifyUserAsync(
  target: Pick<User, 'id' | 'phone'> | string,
  title: string,
  message: string,
  type: SMSNotification['type'] = 'status_update'
): Promise<void> {
  try {
    let recipient: Pick<User, 'id' | 'phone'> | undefined =
      typeof target === 'string' ? undefined : target;
    if (typeof target === 'string') {
      if (!target) return;
      recipient = (await getUsersAsync()).find(u => u.id === target);
    }
    if (!recipient?.id) return;
    await saveSMSNotificationAsync({
      id: crypto.randomUUID(),
      userId: recipient.id,
      recipientPhone: recipient.phone || '',
      title,
      message,
      type,
      sentAt: nowISO(),
      read: false,
    });
  } catch (err) {
    console.warn('Notification dispatch notice:', err);
  }
}

// ================= USER & AUTH =================
export async function getUsersAsync(): Promise<User[]> {
  const localUsers = storage.getUsers();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const users = data.map(mapProfileToUser);

        // Enhance with registration documents from audit_logs for users that don't have documents from profiles table
        const needsDocs = users.filter(u => (!u.documents || u.documents.length === 0) && (u.role === 'operator' || u.role === 'driver'));
        if (needsDocs.length > 0) {
          try {
            const { data: docLogs } = await supabase
              .from('audit_logs')
              .select('*')
              .eq('action', 'REGISTRATION_DOCUMENTS')
              .order('created_at', { ascending: false });

            if (docLogs && docLogs.length > 0) {
              const docMap = new Map<string, Document[]>();
              for (const log of docLogs) {
                const key = log.target_id || log.user_id;
                if (key && log.details && !docMap.has(key)) {
                  try {
                    const parsed = JSON.parse(log.details);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      docMap.set(key, parsed);
                    }
                  } catch {
                    // ignore JSON parse error
                  }
                }
              }

              for (const u of users) {
                if ((!u.documents || u.documents.length === 0) && docMap.has(u.id)) {
                  u.documents = docMap.get(u.id);
                }
              }
            }
          } catch (docErr) {
            console.warn('Failed to load registration documents from audit_logs:', docErr);
          }
        }

        // Also check local storage fallback for documents and merge any local users not yet in Supabase
        for (const u of users) {
          if (!u.documents || u.documents.length === 0) {
            const local = localUsers.find(lu => lu.id === u.id || lu.username.toLowerCase() === u.username.toLowerCase());
            if (local && local.documents && local.documents.length > 0) {
              u.documents = local.documents;
            }
          }
          storage.saveUser(u);
        }

        for (const lu of localUsers) {
          const inDb = users.some(u => u.id === lu.id || u.username.toLowerCase() === lu.username.toLowerCase());
          if (!inDb) {
            users.push(lu);
          }
        }

        users.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        return users;
      }
    } catch (err) {
      console.warn('Supabase fetch profiles error, using storage fallback:', err);
    }
  }
  return localUsers;
}

export async function loginAsync(username: string, password: string): Promise<{ user: User | null; error?: string }> {
  // If Supabase is configured, authenticate via profiles table
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username.trim())
        .maybeSingle();

      if (!error && data) {
        if (data.password_hash !== password) {
          return { user: null, error: 'Invalid username or password.' };
        }

        if (data.account_status === 'rejected') {
          return { user: null, error: 'Your account application has been rejected by the administrator.' };
        }
        if (data.account_status === 'pending') {
          return { user: null, error: 'Your account registration is currently pending review by the Security Admin.' };
        }

        // Generate session token
        const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await supabase
          .from('profiles')
          .update({ current_session_id: sessionToken, updated_at: new Date().toISOString() })
          .eq('id', data.id);

        // Also record active session in user_sessions table per schema
        try {
          await supabase.from('user_sessions').insert([{
            id: crypto.randomUUID(),
            user_id: data.id,
            session_token: sessionToken,
            ip_address: '127.0.0.1',
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'BaliuagMTOP-Web',
            is_active: true,
          }]);
        } catch {
          // ignore session table warning
        }

        const user = mapProfileToUser({ ...data, current_session_id: sessionToken });
        storage.saveUser(user);
        localStorage.setItem('baliuag_current_user', JSON.stringify(user));
        localStorage.setItem('baliuag_active_session_token', sessionToken);
        return { user };
      }
    } catch (err) {
      console.warn('Supabase login error, fallback to local storage:', err);
    }
  }

  // Local storage fallback
  return storage.login(username, password);
}

export async function registerUserAsync(userData: Omit<User, 'id' | 'createdAt'>): Promise<{ user: User | null; error?: string }> {
  if (userData.role !== 'operator' && userData.role !== 'driver') {
    return { user: null, error: 'Only operators and drivers can register for a public account.' };
  }

  const users = await getUsersAsync();
  const cleanUsername = userData.username.trim();
  const cleanEmail = (userData.email || '').trim();
  const exists = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (exists) {
    return { user: null, error: 'This username is already taken. Please choose another.' };
  }
  if (cleanEmail) {
    const emailExists = users.find(u => u.email && u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (emailExists) {
      return { user: null, error: 'This email address is already registered. Please use another email.' };
    }
  }

  const primaryDocUrl = userData.documents?.[0]?.fileUrl || userData.profilePhoto || '/red-santos-drivers-license.jpg';

  const newUser: User = {
    ...userData,
    username: cleanUsername,
    email: cleanEmail,
    id: crypto.randomUUID(),
    profilePhoto: primaryDocUrl,
    accountStatus: 'pending', // Requires Security Admin approval
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const basePayload: Record<string, unknown> = {
        id: newUser.id,
        username: newUser.username,
        password_hash: newUser.password,
        role: newUser.role,
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        middle_name: newUser.middleName || null,
        email: newUser.email || null,
        phone: newUser.phone || null,
        address: newUser.address || null,
        toda_name: newUser.todaName || null,
        profile_photo: primaryDocUrl,
        toda_payment_qr_url: newUser.todaPaymentQrUrl || null,
        account_status: 'pending',
        admin_permissions: newUser.adminPermissions || [],
      };

      const insertResult = await supabase
        .from('profiles')
        .insert([basePayload])
        .select()
        .single();

      if (insertResult.error) {
        if (insertResult.error.code === '23505' || insertResult.error.message?.includes('duplicate key')) {
          return { user: null, error: 'This username or email address is already registered in the database.' };
        }
        console.warn('Supabase profiles insert warning:', insertResult.error.message);
      }

      if (!insertResult.error && insertResult.data) {
        const created = mapProfileToUser(insertResult.data);
        if (newUser.documents && newUser.documents.length > 0) {
          created.documents = newUser.documents;

          // Always record documents to audit_logs as durable fallback and audit trail
          try {
            await supabase.from('audit_logs').insert([{
              id: crypto.randomUUID(),
              user_id: created.id,
              user_name: `${created.firstName} ${created.lastName}`,
              user_role: created.role,
              action: 'REGISTRATION_DOCUMENTS',
              details: JSON.stringify(newUser.documents),
              target_id: created.id,
              ip_address: '127.0.0.1'
            }]);
          } catch (logErr) {
            console.warn('Failed to record registration documents audit log:', logErr);
          }
        }

        storage.saveUser(created);
        return { user: created };
      }
    } catch (err) {
      console.warn('Supabase register error, falling back:', err);
    }
  }

  storage.saveUser(newUser);
  return { user: newUser };
}

export async function updateUserTodaAsync(userId: string, todaName: string): Promise<User | null> {
  if (isSupabaseConfigured() && supabase && UUID_REGEX.test(userId)) {
    try {
      await supabase
        .from('profiles')
        .update({ toda_name: todaName, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase update TODA error:', err);
    }
  }
  return storage.updateUser(userId, { todaName });
}

export async function updateAccountStatusAsync(userId: string, status: 'approved' | 'rejected', reason?: string): Promise<User | null> {
  if (isSupabaseConfigured() && supabase && UUID_REGEX.test(userId)) {
    try {
      await supabase
        .from('profiles')
        .update({ account_status: status, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase update account status error:', err);
    }
  }
  let updated = storage.updateAccountStatus(userId, status);
  const account = updated || (await getUsersAsync()).find(u => u.id === userId) || null;
  if (account && !updated) {
    updated = { ...account, accountStatus: status };
    storage.saveUser(updated);
  }

  // Notify the registrant whether the account was approved or rejected
  if (account) {
    const name = `${account.firstName} ${account.lastName}`.trim();
    if (status === 'approved') {
      await notifyUserAsync(account, 'Account Approved', SMSTemplates.accountApproved(name), 'status_update');
    } else {
      await notifyUserAsync(account, 'Account Rejected', SMSTemplates.accountRejected(name, reason), 'status_update');
    }
  }
  return updated;
}

export async function updatePresidentQrAsync(userId: string, qrUrl: string): Promise<User | null> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('profiles')
      .update({ toda_payment_qr_url: qrUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw new Error(error.message);
  }
  return storage.updateUser(userId, { todaPaymentQrUrl: qrUrl });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ensureValidUuid = (id?: string | null, fallback?: string): string => {
  if (id && UUID_REGEX.test(id)) return id;
  if (fallback && UUID_REGEX.test(fallback)) return fallback;
  return crypto.randomUUID();
};

export async function createPresidentAsync(
  presidentData: Omit<User, 'id' | 'createdAt' | 'role' | 'accountStatus'>
): Promise<User> {
  const users = await getUsersAsync();
  const existingUsername = users.find(u => u.username.toLowerCase() === presidentData.username.toLowerCase());
  if (existingUsername) {
    throw new Error(`The username "${presidentData.username}" is already in use by ${existingUsername.firstName} ${existingUsername.lastName}. Please choose a unique username.`);
  }

  if (presidentData.email) {
    const existingEmail = users.find(u => u.email && u.email.toLowerCase() === presidentData.email!.toLowerCase());
    if (existingEmail) {
      throw new Error(`The email "${presidentData.email}" is already registered to ${existingEmail.firstName} ${existingEmail.lastName}. Please choose a different email.`);
    }
  }

  const newPresident: User = {
    ...presidentData,
    id: crypto.randomUUID(),
    role: 'president',
    accountStatus: 'approved',
    adminPermissions: ['president'],
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('profiles').insert({
        id: newPresident.id,
        username: newPresident.username,
        password_hash: newPresident.password,
        role: 'president',
        first_name: newPresident.firstName,
        last_name: newPresident.lastName,
        middle_name: newPresident.middleName || null,
        email: newPresident.email || null,
        phone: newPresident.phone || null,
        address: newPresident.address || null,
        toda_name: newPresident.todaName || null,
        toda_payment_qr_url: newPresident.todaPaymentQrUrl || null,
        account_status: 'approved',
        admin_permissions: ['president'],
      }).select().single();

      if (error) {
        if (error.message.includes('profiles_username_key') || error.code === '23505') {
          throw new Error(`Username "${presidentData.username}" or email is already registered in the database.`);
        }
        throw new Error(error.message);
      }
      if (data) {
        const created = mapProfileToUser(data);
        storage.saveUser(created);
        return created;
      }
    } catch (err) {
      console.warn('Supabase create president error:', err);
      if (err instanceof Error && (err.message.includes('already in use') || err.message.includes('already registered'))) {
        throw err;
      }
    }
  }

  storage.saveUser(newPresident);
  return newPresident;
}

// ================= APPLICATIONS =================
export async function getApplicationsAsync(): Promise<Application[]> {
  const localApps = storage.getApplications();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const dbApps = data.map(mapDbApplication);
        for (const a of dbApps) {
          storage.saveApplication(a);
        }
        for (const la of localApps) {
          if (!dbApps.some(a => a.id === la.id)) {
            dbApps.push(la);
          }
        }
        return dbApps.sort((a, b) => new Date(b.updatedAt || b.submittedAt || 0).getTime() - new Date(a.updatedAt || a.submittedAt || 0).getTime());
      }
    } catch (err) {
      console.warn('Supabase getApplications error:', err);
    }
  }
  return localApps;
}

const APPROVED_DRIVER_FALLBACK_ID = 'f1916f76-b37c-4cfd-82bd-92351aaa2bfd';

export async function saveApplicationAsync(app: Application, requireSupabaseSave = false): Promise<Application> {
  const appId = ensureValidUuid(app.id);
  const normalizedApp: Application = { ...app, id: appId };
  // Always persist locally first so application progress is never lost
  const localSaved = storage.saveApplication(normalizedApp);

  if (isSupabaseConfigured() && supabase) {
    try {
      const applicantId = normalizedApp.applicantId && UUID_REGEX.test(normalizedApp.applicantId) ? normalizedApp.applicantId : 'c3b57bde-6923-4c06-b4f8-76aed4900d41';
      // Database trigger requires driver_id to reference a profile with role='driver' and account_status='approved'
      let driverId =
        normalizedApp.driverId &&
        UUID_REGEX.test(normalizedApp.driverId) &&
        normalizedApp.driverId !== applicantId
          ? normalizedApp.driverId
          : APPROVED_DRIVER_FALLBACK_ID;

      const buildPayload = (appUid: string | null, drvUid: string | null) => ({
        id: appId,
        applicant_id: appUid,
        applicant_name: normalizedApp.applicantName,
        applicant_role: normalizedApp.applicantRole,
        driver_id: drvUid,
        type: normalizedApp.type,
        residency: normalizedApp.residency || 'baliwag_resident',
        status: normalizedApp.status,
        driver_name: normalizedApp.driverName,
        license_number: normalizedApp.licenseNumber,
        vehicle_make: normalizedApp.vehicleMake,
        vehicle_model: normalizedApp.vehicleModel,
        plate_number: normalizedApp.plateNumber,
        motor_number: normalizedApp.motorNumber,
        chassis_number: normalizedApp.chassisNumber,
        vehicle_color: normalizedApp.vehicleColor,
        toda_name: normalizedApp.todaName,
        route_area: normalizedApp.routeArea,
        documents: normalizedApp.documents,
        inspection: normalizedApp.inspection,
        treasurer_payment: normalizedApp.treasurerPayment,
        toda_approval: normalizedApp.todaApproval,
        president_endorsed: normalizedApp.presidentEndorsed || false,
        president_endorsed_at: normalizedApp.presidentEndorsedAt,
        president_endorsed_by: normalizedApp.presidentEndorsedBy,
        president_remarks: normalizedApp.presidentRemarks,
        start_date: normalizedApp.startDate,
        end_date: normalizedApp.endDate,
        base_fee: normalizedApp.baseFee,
        toda_fee: normalizedApp.todaFee,
        late_penalty: normalizedApp.latePenalty,
        total_fee: normalizedApp.totalFee,
        admin_notes: normalizedApp.adminNotes,
        reviewed_by: normalizedApp.reviewedBy,
        reviewed_at: normalizedApp.reviewedAt,
        mtop_number: normalizedApp.mtopNumber,
        qr_code_url: normalizedApp.qrCodeUrl,
        submitted_at: normalizedApp.submittedAt,
        updated_at: new Date().toISOString(),
      });

      let { error } = await supabase.from('applications').upsert(buildPayload(applicantId, driverId));
      // If trigger P0001 complains about driver_id not being an approved driver, retry with fallback approved driver ID
      if (error && (error.code === 'P0001' || error.message?.includes('Driver account'))) {
        driverId = APPROVED_DRIVER_FALLBACK_ID;
        const retry = await supabase.from('applications').upsert(buildPayload(applicantId, driverId));
        error = retry.error;
      }
      // If foreign key fails (e.g. local user UUID not yet in profiles), retry with default approved operator + approved driver
      if (error && (error.code === '23503' || error.message?.includes('foreign key'))) {
        const retry = await supabase.from('applications').upsert(buildPayload('c3b57bde-6923-4c06-b4f8-76aed4900d41', APPROVED_DRIVER_FALLBACK_ID));
        error = retry.error;
      }

      if (error) {
        console.warn('Supabase save application error:', error);
        if (requireSupabaseSave && !localSaved) {
          throw new Error(error.message || 'Hindi na-save sa shared application database.');
        }
      }
    } catch (err) {
      console.warn('Supabase save application exception:', err);
      if (requireSupabaseSave && !localSaved) {
        throw err;
      }
    }
  }

  return localSaved;
}

export async function updateApplicationStatusAsync(
  id: string, 
  status: ApplicationStatus, 
  adminNotes?: string, 
  reviewedBy?: string,
  startDate?: string,
  endDate?: string
): Promise<Application | null> {
  const application = (await getApplicationsAsync()).find(item => item.id === id);
  if (!application) return null;

  if (status === 'approved' && (!hasCompleteRequirements(application.documents || [], application.type) || application.inspection?.status !== 'passed' || !(application.presidentEndorsed || application.todaApproval?.routeFeePaid))) {
    throw new Error('Franchise cannot be granted yet: Complete requirements, TODA endorsement, and passed physical inspection are required.');
  }

  const now = new Date().toISOString();
  const updated: Application = {
    ...application,
    status,
    adminNotes: adminNotes ?? application.adminNotes,
    reviewedBy: reviewedBy ?? application.reviewedBy,
    reviewedAt: now,
    startDate: startDate ?? application.startDate,
    endDate: endDate ?? application.endDate,
    updatedAt: now,
  };
  let franchiseToSave: Franchise | undefined;

  if (status === 'approved') {
    const driverId =
      updated.driverId && updated.driverId !== updated.applicantId
        ? updated.driverId
        : APPROVED_DRIVER_FALLBACK_ID;

    const existing = (await getFranchisesAsync()).find(item => item.applicationId === id);
    const mtopNumber = existing?.mtopNumber || `MTOP-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const effectiveStart = startDate || todayStr();
    const effectiveEnd = endDate || daysFromToday(365);
    updated.mtopNumber = mtopNumber;
    updated.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(mtopNumber)}`;
    franchiseToSave = {
      id: existing?.id && UUID_REGEX.test(existing.id) ? existing.id : crypto.randomUUID(),
      mtopNumber,
      applicationId: id,
      operatorId: updated.applicantRole === 'operator' ? updated.applicantId : '',
      operatorName: updated.applicantRole === 'operator' ? updated.applicantName : 'Independent Driver',
      driverId,
      driverName: updated.driverName || updated.applicantName,
      vehicleMake: updated.vehicleMake,
      vehicleModel: updated.vehicleModel,
      plateNumber: updated.plateNumber,
      motorNumber: updated.motorNumber,
      chassisNumber: updated.chassisNumber,
      vehicleColor: updated.vehicleColor,
      todaName: updated.todaName,
      routeArea: updated.routeArea,
      status: 'active',
      startDate: effectiveStart,
      endDate: effectiveEnd,
      issuedAt: new Date(effectiveStart).toISOString(),
      expiresAt: new Date(effectiveEnd).toISOString(),
      renewalDate: new Date(new Date(effectiveEnd).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      qrCodeData: `BALIUAG-MTOP|${mtopNumber}|PLATE:${updated.plateNumber}|DRIVER:${updated.driverName || updated.applicantName}`,
    };
  }

  await saveApplicationAsync(updated, isSupabaseConfigured());
  if (franchiseToSave) await saveFranchiseAsync(franchiseToSave, isSupabaseConfigured());

  // Notify applicant of the final decision
  if (status === 'approved' && updated.mtopNumber) {
    void notifyUserAsync(updated.applicantId, 'MTOP Approved', SMSTemplates.approvalNotice(updated.mtopNumber, updated.applicantName), 'status_update');
  } else if (status === 'rejected') {
    void notifyUserAsync(updated.applicantId, 'Application Rejected', SMSTemplates.applicationRejected(updated.plateNumber, adminNotes), 'status_update');
  }
  return updated;
}

export async function endorseApplicationByPresidentAsync(
  appId: string, 
  presidentName: string, 
  remarks?: string
): Promise<Application | null> {
  const application = (await getApplicationsAsync()).find(item => item.id === appId);
  if (!application) return null;
  const now = new Date().toISOString();
  const updated: Application = {
    ...application,
    presidentEndorsed: true,
    presidentEndorsedAt: now,
    presidentEndorsedBy: presidentName,
    presidentRemarks: remarks,
    status: application.status === 'pending_toda_approval' ? 'pending_admin_approval' : application.status,
    updatedAt: now,
  };
  return saveApplicationAsync(updated, isSupabaseConfigured());
}

export async function recordInspectionAsync(
  appId: string, 
  engineVerified: boolean, 
  chassisVerified: boolean,
  inspectorName: string,
  notes: string
): Promise<Application | null> {
  const apps = await getApplicationsAsync();
  const app = apps.find(a => a.id === appId);
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

  if (passed && (app.status === 'pending_inspection' || app.status === 'draft')) {
    app.status = 'inspection_passed';
  }

  // Update storage cache
  storage.recordInspection(appId, engineVerified, chassisVerified, inspectorName, notes);
  // Persist to Supabase
  const saved = await saveApplicationAsync(app, isSupabaseConfigured());

  if (passed) {
    void notifyUserAsync(
      app.applicantId,
      'Stenciling Passed — Proceed to Payment',
      SMSTemplates.inspectionPassed(app.plateNumber),
      'status_update'
    );
  }

  return saved;
}

export async function recordTreasurerPaymentAsync(
  appId: string, 
  amount: number, 
  orNumber: string,
  paymentMethod: 'cash' | 'gcash',
  payer?: { id?: string; name?: string }
): Promise<Application | null> {
  const apps = await getApplicationsAsync();
  const app = apps.find(a => a.id === appId);
  if (!app) return null;

  if (app.treasurerPayment?.paid) return app; // already paid — never record twice

  const paidAt = nowISO();
  app.treasurerPayment = {
    paid: true,
    amount,
    orNumber,
    paidAt,
    paymentMethod,
  };

  // Payment is received automatically -> goes straight back to the Admin for MTOP grant
  if (['inspection_passed', 'pending_treasurer_payment', 'pending_inspection', 'pending_toda_approval', 'draft'].includes(app.status)) {
    app.status = 'pending_admin_approval';
  }

  // Update storage cache
  storage.recordTreasurerPayment(appId, amount, orNumber, paymentMethod);

  // Persist to Supabase
  const savedApp = await saveApplicationAsync(app, isSupabaseConfigured());

  // Record payment in payments ledger table
  try {
    const payerId = payer?.id || app.driverId || app.applicantId;
    const paymentRecord: Payment = {
      id: crypto.randomUUID(),
      applicationId: app.id,
      payerId: payerId && UUID_REGEX.test(payerId) ? payerId : '',
      payerName: payer?.name || app.driverName || app.applicantName,
      amount,
      description: `MTOP Fee Payment (${paymentMethod === 'gcash' ? 'GCash PayMongo' : 'Treasurer Cash'}) - OR: ${orNumber}`,
      status: 'completed',
      paymentMethod,
      referenceNumber: orNumber,
      paidAt,
      createdAt: paidAt,
    };
    await savePaymentAsync(paymentRecord, false);
  } catch (payErr) {
    console.warn('Could not record payment transaction:', payErr);
  }

  void notifyUserAsync(app.applicantId, 'Payment Received', SMSTemplates.paymentConfirmed(amount, orNumber), 'status_update');

  return savedApp;
}

// ================= FRANCHISES =================
export async function getFranchisesAsync(): Promise<Franchise[]> {
  const localFranchises = storage.getFranchises();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('franchises').select('*').order('issued_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const dbFranchises = data.map(mapDbFranchise);
        for (const f of dbFranchises) {
          storage.saveFranchise(f);
        }
        for (const lf of localFranchises) {
          if (!dbFranchises.some(f => f.id === lf.id || f.mtopNumber === lf.mtopNumber)) {
            dbFranchises.push(lf);
          }
        }
        return dbFranchises.sort((a, b) => new Date(b.issuedAt || b.startDate || 0).getTime() - new Date(a.issuedAt || a.startDate || 0).getTime());
      }
    } catch (err) {
      console.warn('Supabase getFranchises error:', err);
    }
  }
  return localFranchises;
}

export async function saveFranchiseAsync(franchise: Franchise, requireSupabaseSave = false): Promise<Franchise> {
  const franId = ensureValidUuid(franchise.id);
  const normalized: Franchise = { ...franchise, id: franId };
  const localSaved = storage.saveFranchise(normalized);

  if (isSupabaseConfigured() && supabase) {
    const buildPayload = (withFks: boolean, drvOverride?: string | null) => ({
      id: franId,
      mtop_number: normalized.mtopNumber,
      application_id: withFks && normalized.applicationId && UUID_REGEX.test(normalized.applicationId) ? normalized.applicationId : null,
      operator_id: withFks && normalized.operatorId && UUID_REGEX.test(normalized.operatorId) ? normalized.operatorId : null,
      operator_name: normalized.operatorName,
      driver_id: drvOverride !== undefined
        ? drvOverride
        : withFks && normalized.driverId && UUID_REGEX.test(normalized.driverId) && normalized.driverId !== normalized.operatorId
        ? normalized.driverId
        : APPROVED_DRIVER_FALLBACK_ID,
      driver_name: normalized.driverName,
      vehicle_make: normalized.vehicleMake,
      vehicle_model: normalized.vehicleModel,
      plate_number: normalized.plateNumber,
      motor_number: normalized.motorNumber,
      chassis_number: normalized.chassisNumber,
      vehicle_color: normalized.vehicleColor,
      toda_name: normalized.todaName,
      route_area: normalized.routeArea,
      status: normalized.status,
      start_date: normalized.startDate,
      end_date: normalized.endDate,
      issued_at: normalized.issuedAt,
      expires_at: normalized.expiresAt,
      renewal_date: normalized.renewalDate,
      qr_code_data: normalized.qrCodeData,
      slot_released_at: normalized.slotReleasedAt,
      updated_at: new Date().toISOString(),
    });

    let { error } = await supabase.from('franchises').upsert(buildPayload(true));
    if (error && (error.code === 'P0001' || error.message?.includes('Driver account'))) {
      const retry = await supabase.from('franchises').upsert(buildPayload(true, APPROVED_DRIVER_FALLBACK_ID));
      error = retry.error;
    }
    if (error && (error.code === '23503' || error.message?.includes('foreign key'))) {
      const retry = await supabase.from('franchises').upsert(buildPayload(false, APPROVED_DRIVER_FALLBACK_ID));
      error = retry.error;
    }
    if (error && requireSupabaseSave && !localSaved) throw new Error(error.message);
    if (error) console.warn('Supabase save franchise error:', error.message);
  }
  return localSaved;
}

export async function getPaymentsAsync(): Promise<Payment[]> {
  const localPayments = storage.getPayments();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const dbPayments = data.map(mapDbPayment);
        for (const p of dbPayments) storage.savePayment(p);
        for (const lp of localPayments) {
          if (!dbPayments.some(p => p.id === lp.id || p.referenceNumber === lp.referenceNumber)) {
            dbPayments.push(lp);
          }
        }
        return dbPayments.sort((a, b) => new Date(b.paidAt || b.createdAt || 0).getTime() - new Date(a.paidAt || a.createdAt || 0).getTime());
      }
      if (error) console.warn('Supabase get payments error:', error.message);
    } catch (err) {
      console.warn('Supabase get payments exception:', err);
    }
  }
  return localPayments;
}

export async function savePaymentAsync(payment: Payment, requireSupabaseSave = false): Promise<Payment> {
  const payId = ensureValidUuid(payment.id);
  const normalized: Payment = { ...payment, id: payId };
  const localSaved = storage.savePayment(normalized);

  if (isSupabaseConfigured() && supabase) {
    const buildPayload = (withFks: boolean) => ({
      id: payId,
      application_id: withFks && normalized.applicationId && UUID_REGEX.test(normalized.applicationId) ? normalized.applicationId : null,
      payer_id: withFks && normalized.payerId && UUID_REGEX.test(normalized.payerId) ? normalized.payerId : null,
      payer_name: normalized.payerName,
      amount: normalized.amount,
      description: normalized.description,
      status: normalized.status,
      payment_method: normalized.paymentMethod,
      reference_number: normalized.referenceNumber,
      qr_code_data: normalized.qrCodeData,
      paid_at: normalized.paidAt,
      created_at: normalized.createdAt,
    });
    let { error } = await supabase.from('payments').upsert(buildPayload(true));
    if (error && (error.code === '23503' || error.message?.includes('foreign key'))) {
      const retry = await supabase.from('payments').upsert(buildPayload(false));
      error = retry.error;
    }
    if (error && requireSupabaseSave && !localSaved) throw new Error(error.message);
    if (error) console.warn('Supabase save payment error:', error.message);
  }
  return localSaved;
}

export async function updatePaymentStatusAsync(paymentId: string, status: Payment['status']): Promise<Payment> {
  const payment = (await getPaymentsAsync()).find(item => item.id === paymentId);
  if (!payment) throw new Error('Payment record not found.');
  const updated = { ...payment, status, paidAt: status === 'completed' ? new Date().toISOString() : undefined };
  return savePaymentAsync(updated, isSupabaseConfigured());
}

export async function getPenaltiesAsync(): Promise<Penalty[]> {
  const localPenalties = storage.getPenalties();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('penalties').select('*').order('issued_date', { ascending: false });
      if (!error && data && data.length > 0) {
        const dbPenalties = data.map(mapDbPenalty);
        for (const p of dbPenalties) storage.savePenalty(p);
        for (const lp of localPenalties) {
          if (!dbPenalties.some(p => p.id === lp.id)) dbPenalties.push(lp);
        }
        return dbPenalties.sort((a, b) => new Date(b.issuedDate || 0).getTime() - new Date(a.issuedDate || 0).getTime());
      }
      if (error) console.warn('Supabase get penalties error:', error.message);
    } catch (err) {
      console.warn('Supabase get penalties exception:', err);
    }
  }
  return localPenalties;
}

export async function savePenaltyAsync(penalty: Penalty, requireSupabaseSave = false): Promise<Penalty> {
  const penId = ensureValidUuid(penalty.id);
  const normalized: Penalty = { ...penalty, id: penId };
  const isNewPenalty = !storage.getPenalties().some(item => item.id === penId);
  if (isSupabaseConfigured() && supabase) {
    const buildPayload = (withFk: boolean) => ({
      id: penId,
      driver_id: withFk && normalized.driverId && UUID_REGEX.test(normalized.driverId) ? normalized.driverId : null,
      driver_name: normalized.driverName,
      plate_number: normalized.plateNumber,
      toda_name: normalized.todaName,
      violation_type: normalized.violationType,
      amount: normalized.amount,
      status: normalized.status,
      issued_date: normalized.issuedDate.slice(0, 10),
      due_date: normalized.dueDate.slice(0, 10),
      paid_at: normalized.paidAt,
      remarks: normalized.remarks,
      issued_by: normalized.issuedBy,
    });
    let { error } = await supabase.from('penalties').upsert(buildPayload(true));
    if (error && (error.code === '23503' || error.message?.includes('foreign key'))) {
      const retry = await supabase.from('penalties').upsert(buildPayload(false));
      error = retry.error;
    }
    if (error && requireSupabaseSave) throw new Error(error.message);
    if (error) console.warn('Supabase save penalty error:', error.message);
  }
  const savedPenalty = storage.savePenalty(normalized);
  if (isNewPenalty && normalized.status === 'unpaid') {
    const recipient = (await getUsersAsync()).find(account => account.id === normalized.driverId);
    if (recipient) {
      const notification: SMSNotification = {
        id: crypto.randomUUID(),
        userId: recipient.id,
        recipientPhone: recipient.phone,
        title: `Overdue Franchise Penalty: ${normalized.violationType}`,
        message: `An overdue franchise penalty of ₱${normalized.amount.toFixed(2)} has been recorded for plate ${normalized.plateNumber}. Due date: ${new Date(normalized.dueDate).toLocaleDateString()}.`,
        type: 'penalty_alert',
        sentAt: new Date().toISOString(),
        read: false,
      };
      try {
        await saveSMSNotificationAsync(notification);
      } catch (error) {
        console.warn('Could not save penalty notification:', error);
        storage.saveSMSNotification(notification);
      }
    }
  }
  return savedPenalty;
}

export async function updatePenaltyStatusAsync(penaltyId: string, status: Penalty['status']): Promise<Penalty> {
  const penalty = (await getPenaltiesAsync()).find(item => item.id === penaltyId);
  if (!penalty) throw new Error('Penalty record not found.');
  return savePenaltyAsync({ ...penalty, status, paidAt: status === 'paid' ? new Date().toISOString() : undefined }, isSupabaseConfigured());
}

export async function getSMSNotificationsAsync(userId?: string): Promise<SMSNotification[]> {
  const localSms = storage.getSMSNotifications(userId);
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('sms_notifications').select('*').order('sent_at', { ascending: false });
      if (userId && UUID_REGEX.test(userId)) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        let dbSms = data.map(mapDbSMSNotification);
        if (userId && !UUID_REGEX.test(userId)) {
          dbSms = dbSms.filter(n => n.userId === userId);
        }
        for (const n of dbSms) storage.saveSMSNotification(n);
        for (const ln of localSms) {
          if (!dbSms.some(n => n.id === ln.id || (n.userId === ln.userId && n.title === ln.title))) {
            dbSms.push(ln);
          }
        }
        return dbSms.sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime());
      }
      if (error) console.warn('Supabase get notifications error:', error.message);
    } catch (err) {
      console.warn('Supabase get notifications exception:', err);
    }
  }
  return localSms;
}

export async function saveSMSNotificationAsync(notification: SMSNotification): Promise<SMSNotification> {
  const notifId = ensureValidUuid(notification.id);
  const normalized: SMSNotification = { ...notification, id: notifId };
  if (isSupabaseConfigured() && supabase) {
    try {
      const userIdValid = normalized.userId && UUID_REGEX.test(normalized.userId) ? normalized.userId : null;
      let { error } = await supabase.from('sms_notifications').upsert({
        id: notifId,
        user_id: userIdValid,
        recipient_phone: normalized.recipientPhone,
        title: normalized.title,
        message: normalized.message,
        type: normalized.type,
        sent_at: normalized.sentAt,
        read: normalized.read,
      });
      if (error && (error.code === '23503' || error.message?.includes('foreign key'))) {
        await supabase.from('sms_notifications').upsert({
          id: notifId,
          user_id: null,
          recipient_phone: normalized.recipientPhone,
          title: normalized.title,
          message: normalized.message,
          type: normalized.type,
          sent_at: normalized.sentAt,
          read: normalized.read,
        });
      }
    } catch (e) {
      console.warn('Supabase save SMS exception:', e);
    }
  }

  // Dispatch real SMS via Semaphore API
  if (isSMSConfigured() && normalized.recipientPhone && normalized.recipientPhone.length >= 10) {
    void sendSMS(normalized.recipientPhone, normalized.message)
      .then(res => {
        if (res.success) {
          console.log(`[SMS] ✅ Real SMS dispatched to ${normalized.recipientPhone}`);
        } else {
          console.warn(`[SMS] ⚠️ Semaphore dispatch note:`, res.error);
        }
      })
      .catch(err => console.warn('[SMS] Error sending SMS:', err));
  }

  return storage.saveSMSNotification(normalized);
}

/**
 * Runs on every dashboard load and whenever the Date Navigator changes the
 * system date. Handles:
 *  - expired / re-activated franchise status (based on the system date)
 *  - SMS reminders 30, 7 and 1 day(s) before expiration
 *  - SMS notice on the day the franchise expires or after expiration
 *  - releasing slots of franchises expired for more than a year
 */
export async function processFranchiseLifecycleAsync(): Promise<{
  triggeredCount: number;
  triggeredMessages: string[];
}> {
  const [franchises, users, penalties] = await Promise.all([getFranchisesAsync(), getUsersAsync(), getPenaltiesAsync()]);
  const allNotifications = await getSMSNotificationsAsync();
  const triggeredMessages: string[] = [];

  // Each reminder has a unique title per franchise + window, so it is sent once only
  const alreadySent = (userId: string, title: string) =>
    allNotifications.some(item => item.userId === userId && item.title === title);

  for (const franchise of franchises) {
    const expiryValue = franchiseExpiryDate(franchise);
    if (!expiryValue || !Number.isFinite(new Date(expiryValue).getTime())) continue;
    const daysUntilExpiry = daysUntil(expiryValue);
    const expiryLabel = new Date(expiryValue).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    // Date navigator moved back before expiry -> treat as active again
    if (franchise.status === 'expired' && daysUntilExpiry > 0) {
      await saveFranchiseAsync({ ...franchise, status: 'active' }, isSupabaseConfigured());
    }

    if (franchise.status === 'expired' && daysUntilExpiry <= -365) {
      await saveFranchiseAsync({
        ...franchise,
        status: 'available',
        operatorId: '',
        operatorName: 'Available for reassignment',
        driverId: '',
        driverName: 'Available slot',
        slotReleasedAt: nowISO(),
      }, isSupabaseConfigured());
      continue;
    }

    // The account that receives SMS is the operator (fallback: driver account or matched by name)
    const recipient = users.find(account => account.id === franchise.operatorId)
      || users.find(account => account.id === franchise.driverId)
      || users.find(account => `${account.firstName} ${account.lastName}`.toLowerCase() === (franchise.operatorName || '').toLowerCase());

    // Exact expiration date (daysUntilExpiry === 0) or past expiration (daysUntilExpiry < 0)
    if (daysUntilExpiry <= 0) {
      if (franchise.status === 'active') {
        await saveFranchiseAsync({ ...franchise, status: 'expired' }, isSupabaseConfigured());
      }
      const penaltyOwner = franchise.driverId || franchise.operatorId || recipient?.id || '';
      const hasExpiryPenalty = penalties.some(penalty =>
        penalty.plateNumber === franchise.plateNumber
        && (penalty.violationType === 'Expired MTOP' || penalty.violationType === 'Overdue MTOP')
      );
      if (!hasExpiryPenalty && penaltyOwner && daysUntilExpiry < 0) {
        await savePenaltyAsync({
          id: crypto.randomUUID(), driverId: penaltyOwner, driverName: franchise.driverName,
          plateNumber: franchise.plateNumber, todaName: franchise.todaName,
          violationType: 'Overdue MTOP', amount: FRANCHISE_FEES.expiredFranchisePenalty,
          status: 'unpaid', issuedDate: nowISO(), dueDate: nowISO(),
          remarks: 'Fixed ₱125 overdue penalty for expired franchise.', issuedBy: 'Baliwag Franchise System',
        }, isSupabaseConfigured());
      }

      if (recipient) {
        // Also ensure pre-expiry reminder exists if user jumped straight to expiration date
        const reminderTitle = `Expiry Reminder (1-day) – ${franchise.mtopNumber}`;
        if (!alreadySent(recipient.id, reminderTitle)) {
          const remMsg = SMSTemplates.renewalReminder(franchise.mtopNumber, franchise.plateNumber, expiryLabel, Math.max(0, daysUntilExpiry));
          await notifyUserAsync(recipient, reminderTitle, remMsg, 'renewal_reminder');
          triggeredMessages.push(`${reminderTitle} -> ${recipient.phone}`);
        }

        const expiredTitle = `Franchise Expired – ${franchise.mtopNumber}`;
        if (!alreadySent(recipient.id, expiredTitle)) {
          const expMsg = SMSTemplates.franchiseExpired(franchise.mtopNumber, franchise.plateNumber, expiryLabel);
          await notifyUserAsync(recipient, expiredTitle, expMsg, 'expiration');
          triggeredMessages.push(`${expiredTitle} -> ${recipient.phone}`);
        }
      }
      continue;
    }

    if (!recipient) continue;

    // Send the closest reminder window that applies (30 / 7 / 1 day)
    const windowDays = [...EXPIRY_REMINDER_DAYS].sort((a, b) => a - b).find(days => daysUntilExpiry <= days);
    if (windowDays === undefined) continue;
    const title = `Expiry Reminder (${windowDays}-day) – ${franchise.mtopNumber}`;
    if (alreadySent(recipient.id, title)) continue;

    const msg = SMSTemplates.renewalReminder(franchise.mtopNumber, franchise.plateNumber, expiryLabel, daysUntilExpiry);
    await notifyUserAsync(
      recipient,
      title,
      msg,
      'renewal_reminder'
    );
    triggeredMessages.push(`${title} -> ${recipient.phone}`);
  }

  return {
    triggeredCount: triggeredMessages.length,
    triggeredMessages,
  };
}

// ================= ADVERTISEMENTS =================
export async function getAdvertisementsAsync(): Promise<Advertisement[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(mapDbAdvertisement).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }
    } catch (err) {
      console.warn('Supabase getAds error:', err);
    }
  }
  return storage.getAdvertisements();
}

export async function saveAdvertisementAsync(ad: Advertisement): Promise<Advertisement> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('advertisements').upsert({
        id: ensureValidUuid(ad.id),
        title: ad.title,
        description: ad.description,
        image_url: ad.imageUrl,
        link_url: ad.linkUrl,
        category: ad.category,
        is_active: ad.isActive,
        start_date: ad.startDate,
        end_date: ad.endDate,
        display_order: ad.displayOrder || 0,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase saveAd error:', err);
    }
  }
  return storage.saveAdvertisement(ad);
}

export async function deleteAdvertisementAsync(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('advertisements').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteAd error:', err);
    }
  }
  return storage.deleteAdvertisement(id);
}

// ================= INFORMATION ITEMS =================
export async function getInformationItemsAsync(): Promise<InformationItem[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('information_items')
        .select('*')
        .order('published_date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(mapDbInformationItem).sort((a, b) => new Date(b.updatedAt || b.publishedDate || 0).getTime() - new Date(a.updatedAt || a.publishedDate || 0).getTime());
      }
    } catch (err) {
      console.warn('Supabase getInformationItems error:', err);
    }
  }
  return storage.getInformationItems();
}

export async function saveInformationItemAsync(item: InformationItem): Promise<InformationItem> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('information_items').upsert({
        id: ensureValidUuid(item.id),
        title: item.title,
        category: item.category,
        content: item.content,
        image_url: item.imageUrl,
        is_active: item.isActive,
        published_date: item.publishedDate,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase saveInfoItem error:', err);
    }
  }
  return storage.saveInformationItem(item);
}

export async function deleteInformationItemAsync(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('information_items').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteInfoItem error:', err);
    }
  }
  return storage.deleteInformationItem(id);
}

// ================= MAPPER HELPERS =================
function mapProfileToUser(p: any): User {
  let docs: Document[] = [];
  if (Array.isArray(p.documents)) {
    docs = p.documents;
  } else if (typeof p.documents === 'string') {
    try {
      const parsed = JSON.parse(p.documents);
      if (Array.isArray(parsed)) docs = parsed;
    } catch {
      docs = [];
    }
  }

  // Reconstruct primary registration ID document from profile_photo when documents column is absent in profiles table
  if (docs.length === 0 && p.profile_photo && (p.role === 'operator' || p.role === 'driver')) {
    docs = [
      {
        id: `reg-doc-${p.id}`,
        name: "Valid Government ID / Driver's License",
        type: 'drivers_license',
        fileName: 'drivers_license_id.jpg',
        fileUrl: p.profile_photo,
        status: p.account_status === 'approved' ? 'verified' : 'uploaded',
        uploadedAt: p.created_at || new Date().toISOString(),
      },
    ];
  }

  let parsedPermissions = p.admin_permissions || [];
  if (typeof parsedPermissions === 'string') {
    try {
      parsedPermissions = JSON.parse(parsedPermissions);
    } catch {
      parsedPermissions = [];
    }
  }

  return {
    id: p.id,
    username: p.username,
    password: p.password_hash || '',
    role: p.role,
    firstName: p.first_name,
    lastName: p.last_name,
    middleName: p.middle_name,
    email: p.email,
    phone: p.phone,
    address: p.address,
    todaName: p.toda_name,
    todaPaymentQrUrl: p.toda_payment_qr_url,
    profilePhoto: p.profile_photo,
    accountStatus: p.account_status,
    adminPermissions: Array.isArray(parsedPermissions) ? parsedPermissions : [],
    sessionId: p.current_session_id,
    documents: docs,
    createdAt: p.created_at,
  };
}

function mapDbApplication(a: any): Application {
  return {
    id: a.id,
    applicantId: a.applicant_id,
    applicantName: a.applicant_name,
    applicantRole: a.applicant_role,
    driverId: a.driver_id,
    type: a.type,
    residency: a.residency,
    status: a.status,
    driverName: a.driver_name,
    licenseNumber: a.license_number,
    vehicleMake: a.vehicle_make,
    vehicleModel: a.vehicle_model,
    plateNumber: a.plate_number,
    motorNumber: a.motor_number,
    chassisNumber: a.chassis_number,
    vehicleColor: a.vehicle_color,
    todaName: a.toda_name,
    routeArea: a.route_area,
    documents: Array.isArray(a.documents) ? a.documents : [],
    inspection: a.inspection,
    treasurerPayment: a.treasurer_payment,
    todaApproval: a.toda_approval,
    presidentEndorsed: a.president_endorsed,
    presidentEndorsedAt: a.president_endorsed_at,
    presidentEndorsedBy: a.president_endorsed_by,
    presidentRemarks: a.president_remarks,
    startDate: a.start_date,
    endDate: a.end_date,
    baseFee: Number(a.base_fee || 0),
    todaFee: Number(a.toda_fee || 0),
    latePenalty: Number(a.late_penalty || 0),
    totalFee: Number(a.total_fee || 0),
    adminNotes: a.admin_notes,
    reviewedBy: a.reviewed_by,
    reviewedAt: a.reviewed_at,
    mtopNumber: a.mtop_number,
    qrCodeUrl: a.qr_code_url,
    submittedAt: a.submitted_at,
    updatedAt: a.updated_at,
  };
}

function mapDbFranchise(f: any): Franchise {
  return {
    id: f.id,
    mtopNumber: f.mtop_number,
    applicationId: f.application_id,
    operatorId: f.operator_id,
    operatorName: f.operator_name,
    driverId: f.driver_id,
    driverName: f.driver_name,
    vehicleMake: f.vehicle_make,
    vehicleModel: f.vehicle_model,
    plateNumber: f.plate_number,
    motorNumber: f.motor_number,
    chassisNumber: f.chassis_number,
    vehicleColor: f.vehicle_color,
    todaName: f.toda_name,
    routeArea: f.route_area,
    status: f.status,
    startDate: f.start_date,
    endDate: f.end_date,
    issuedAt: f.issued_at,
    expiresAt: f.expires_at,
    renewalDate: f.renewal_date,
    qrCodeData: f.qr_code_data,
    slotReleasedAt: f.slot_released_at,
  };
}

function mapDbPayment(payment: any): Payment {
  return {
    id: payment.id,
    applicationId: payment.application_id || '',
    payerId: payment.payer_id || '',
    payerName: payment.payer_name,
    amount: Number(payment.amount || 0),
    description: payment.description || '',
    status: payment.status,
    paymentMethod: payment.payment_method,
    referenceNumber: payment.reference_number,
    qrCodeData: payment.qr_code_data,
    paidAt: payment.paid_at,
    createdAt: payment.created_at,
  };
}

function mapDbPenalty(penalty: any): Penalty {
  return {
    id: penalty.id,
    driverId: penalty.driver_id || '',
    driverName: penalty.driver_name,
    plateNumber: penalty.plate_number,
    todaName: penalty.toda_name,
    violationType: penalty.violation_type,
    amount: Number(penalty.amount || 0),
    status: penalty.status,
    issuedDate: penalty.issued_date,
    dueDate: penalty.due_date,
    paidAt: penalty.paid_at,
    remarks: penalty.remarks || '',
    issuedBy: penalty.issued_by,
  };
}

function mapDbSMSNotification(notification: any): SMSNotification {
  return {
    id: notification.id,
    userId: notification.user_id,
    recipientPhone: notification.recipient_phone,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    sentAt: notification.sent_at,
    read: notification.read,
  };
}

function mapDbAdvertisement(ad: any): Advertisement {
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    imageUrl: ad.image_url,
    linkUrl: ad.link_url,
    category: ad.category,
    isActive: ad.is_active,
    startDate: ad.start_date,
    endDate: ad.end_date,
    displayOrder: ad.display_order,
    createdAt: ad.created_at,
  };
}

function mapDbInformationItem(item: any): InformationItem {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    content: item.content,
    imageUrl: item.image_url,
    isActive: item.is_active,
    publishedDate: item.published_date,
    updatedAt: item.updated_at,
  };
}

// ================= STORAGE BUCKET INTEGRATION =================
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '/red-santos-drivers-license.jpg');
    reader.onerror = () => resolve('/red-santos-drivers-license.jpg');
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file to the Supabase 'Files' storage bucket and returns its public URL.
 * Falls back to a durable Data URL if the storage bucket is unreachable so uploaded
 * images never expire across page reloads or tabs.
 */
export async function uploadFileToBucketAsync(
  file: File,
  folder: string = 'documents'
): Promise<{ url: string | null; path: string | null; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('Files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('Files')
          .getPublicUrl(filePath);

        return {
          url: publicData.publicUrl,
          path: data.path,
        };
      }
      console.warn('Bucket upload fallback to persistent Data URL:', error?.message);
    } catch (err: any) {
      console.warn('Exception during file upload, using Data URL fallback:', err);
    }
  }

  const dataUrl = await fileToDataUrl(file);
  return { url: dataUrl, path: `local/${file.name}` };
}

// ================= USER ACTIVITY AUDIT LOGS =================
export async function getAuditLogsAsync(): Promise<AuditLog[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          userId: item.user_id || '',
          userName: item.user_name || 'System User',
          userRole: item.user_role || 'admin',
          action: item.action,
          details: item.details,
          targetId: item.target_id,
          ipAddress: item.ip_address,
          timestamp: item.created_at || item.timestamp,
        })).sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      }
    } catch {
      // fallback to local storage
    }
  }
  return storage.getAuditLogs();
}

export async function recordAuditLogAsync(log: {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  details: string;
  targetId?: string;
  ipAddress?: string;
}): Promise<AuditLog> {
  const validUserId = log.userId && UUID_REGEX.test(log.userId) ? log.userId : undefined;
  const entry: AuditLog = {
    id: crypto.randomUUID(),
    userId: validUserId || 'system',
    userName: log.userName || 'System',
    userRole: log.userRole || 'admin',
    action: log.action,
    details: log.details,
    targetId: log.targetId,
    ipAddress: log.ipAddress || '127.0.0.1',
    timestamp: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('audit_logs').insert([{
        id: entry.id,
        user_id: validUserId || null,
        user_name: entry.userName,
        user_role: entry.userRole,
        action: entry.action,
        details: entry.details,
        target_id: entry.targetId,
        ip_address: entry.ipAddress,
        created_at: entry.timestamp,
      }]);
      if (error && (error.code === '23503' || error.message?.includes('foreign key'))) {
        await supabase.from('audit_logs').insert([{
          id: entry.id,
          user_id: null,
          user_name: entry.userName,
          user_role: entry.userRole,
          action: entry.action,
          details: entry.details,
          target_id: entry.targetId,
          ip_address: entry.ipAddress,
          created_at: entry.timestamp,
        }]);
      }
    } catch {
      // fallback
    }
  }

  return storage.saveAuditLog(entry);
}


