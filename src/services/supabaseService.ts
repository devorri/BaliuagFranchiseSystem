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
} from '../types';
import { FRANCHISE_FEES } from './fees';

// ================= USER & AUTH =================
export async function getUsersAsync(): Promise<User[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data && data.length > 0) {
        return data.map(mapProfileToUser);
      }
    } catch (err) {
      console.warn('Supabase fetch profiles error, using storage fallback:', err);
    }
  }
  return storage.getUsers();
}

export async function loginAsync(username: string, password: string): Promise<{ user: User | null; error?: string }> {
  // If Supabase is configured, authenticate via profiles table
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) {
        return { user: null, error: 'Invalid username or password.' };
      }

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

      const user = mapProfileToUser({ ...data, current_session_id: sessionToken });
      localStorage.setItem('baliuag_current_user', JSON.stringify(user));
      localStorage.setItem('baliuag_active_session_token', sessionToken);
      return { user };
    } catch (err) {
      console.warn('Supabase login error, fallback to local storage:', err);
    }
  }

  // Local storage fallback
  return storage.login(username, password);
}

export async function registerUserAsync(userData: Omit<User, 'id' | 'createdAt'>): Promise<{ user: User | null; error?: string }> {
  if (userData.role !== 'driver' && userData.role !== 'operator') {
    return { user: null, error: 'Registration is restricted to Tricycle Drivers and Franchise Operators only.' };
  }

  const users = await getUsersAsync();
  const exists = users.find(u => u.username.toLowerCase() === userData.username.toLowerCase());
  if (exists) {
    return { user: null, error: 'This username is already taken. Please choose another.' };
  }

  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}`,
    accountStatus: 'pending', // Requires Security Admin approval
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          username: newUser.username,
          password_hash: newUser.password,
          role: newUser.role,
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          middle_name: newUser.middleName,
          email: newUser.email,
          phone: newUser.phone,
          address: newUser.address,
          toda_name: newUser.todaName,
          toda_payment_qr_url: newUser.todaPaymentQrUrl,
          account_status: 'pending',
          admin_permissions: newUser.adminPermissions || [],
        }])
        .select()
        .single();

      if (!error && data) {
        const created = mapProfileToUser(data);
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

export async function updateAccountStatusAsync(userId: string, status: 'approved' | 'rejected'): Promise<User | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('profiles')
        .update({ account_status: status, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase update account status error:', err);
    }
  }
  return storage.updateAccountStatus(userId, status);
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

export async function createPresidentAsync(
  presidentData: Omit<User, 'id' | 'createdAt' | 'role' | 'accountStatus'>
): Promise<User> {
  const users = await getUsersAsync();
  if (users.some(user => user.username.toLowerCase() === presidentData.username.toLowerCase())) {
    throw new Error('Username is already in use.');
  }

  const newPresident: User = {
    ...presidentData,
    id: crypto.randomUUID(),
    role: 'toda_president',
    accountStatus: 'approved',
    adminPermissions: ['president'],
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('profiles').insert({
      username: newPresident.username,
      password_hash: newPresident.password,
      role: newPresident.role,
      first_name: newPresident.firstName,
      last_name: newPresident.lastName,
      middle_name: newPresident.middleName,
      email: newPresident.email,
      phone: newPresident.phone,
      address: newPresident.address,
      toda_name: newPresident.todaName,
      toda_payment_qr_url: newPresident.todaPaymentQrUrl,
      account_status: 'approved',
      admin_permissions: ['president'],
    }).select().single();
    if (error) throw new Error(error.message);
    const created = mapProfileToUser(data);
    storage.saveUser(created);
    return created;
  }

  storage.saveUser(newPresident);
  return newPresident;
}

// ================= APPLICATIONS =================
export async function getApplicationsAsync(): Promise<Application[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapDbApplication);
      }
    } catch (err) {
      console.warn('Supabase getApplications error:', err);
    }
  }
  return storage.getApplications();
}

export async function saveApplicationAsync(app: Application, requireSupabaseSave = false): Promise<Application> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('applications').upsert({
        id: app.id,
        applicant_id: app.applicantId,
        applicant_name: app.applicantName,
        applicant_role: app.applicantRole,
        driver_id: app.driverId || null,
        type: app.type,
        residency: app.residency || 'baliwag_resident',
        status: app.status,
        driver_name: app.driverName,
        license_number: app.licenseNumber,
        vehicle_make: app.vehicleMake,
        vehicle_model: app.vehicleModel,
        plate_number: app.plateNumber,
        motor_number: app.motorNumber,
        chassis_number: app.chassisNumber,
        vehicle_color: app.vehicleColor,
        toda_name: app.todaName,
        route_area: app.routeArea,
        documents: app.documents,
        inspection: app.inspection,
        treasurer_payment: app.treasurerPayment,
        toda_approval: app.todaApproval,
        president_endorsed: app.presidentEndorsed || false,
        president_endorsed_at: app.presidentEndorsedAt,
        president_endorsed_by: app.presidentEndorsedBy,
        president_remarks: app.presidentRemarks,
        start_date: app.startDate,
        end_date: app.endDate,
        base_fee: app.baseFee,
        toda_fee: app.todaFee,
        late_penalty: app.latePenalty,
        total_fee: app.totalFee,
        admin_notes: app.adminNotes,
        reviewed_by: app.reviewedBy,
        reviewed_at: app.reviewedAt,
        mtop_number: app.mtopNumber,
        qr_code_url: app.qrCodeUrl,
        submitted_at: app.submittedAt,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase save application error:', err);
      if (requireSupabaseSave) {
        throw new Error('Hindi na-save sa shared application database. Pakisuri ang Supabase table access at subukang muli.');
      }
    }
  }
  return storage.saveApplication(app);
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
    const driverId = updated.driverId || (updated.applicantRole === 'driver' ? updated.applicantId : '');
    if (!driverId) throw new Error('Assign an approved driver before granting this franchise.');

    const existing = (await getFranchisesAsync()).find(item => item.applicationId === id);
    const mtopNumber = existing?.mtopNumber || `MTOP-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const effectiveStart = startDate || now.slice(0, 10);
    const effectiveEnd = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    updated.mtopNumber = mtopNumber;
    updated.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(mtopNumber)}`;
    franchiseToSave = {
      id: existing?.id || crypto.randomUUID(),
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
  return updated;
}

export async function endorseApplicationByPresidentAsync(
  appId: string, 
  presidentName: string, 
  remarks?: string
): Promise<Application | null> {
  const result = storage.endorseApplicationByPresident(appId, presidentName, remarks);
  if (isSupabaseConfigured() && supabase && result) {
    try {
      await supabase.from('applications').update({
        president_endorsed: true,
        president_endorsed_at: result.presidentEndorsedAt,
        president_endorsed_by: result.presidentEndorsedBy,
        president_remarks: result.presidentRemarks,
        status: 'pending_admin_approval',
        updated_at: new Date().toISOString(),
      }).eq('id', appId);
    } catch (err) {
      console.warn('Supabase president endorse error:', err);
    }
  }
  return result;
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

  const paidAt = new Date().toISOString();
  app.treasurerPayment = {
    paid: true,
    amount,
    orNumber,
    paidAt,
    paymentMethod,
  };

  if (app.status === 'inspection_passed' || app.status === 'pending_treasurer_payment' || app.status === 'draft') {
    app.status = 'pending_toda_approval';
  }

  // Update storage cache
  storage.recordTreasurerPayment(appId, amount, orNumber, paymentMethod);

  // Persist to Supabase
  const savedApp = await saveApplicationAsync(app, isSupabaseConfigured());

  // Record payment in payments ledger table
  try {
    const isUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
    const payerId = payer?.id || app.driverId || app.applicantId;
    const paymentRecord: Payment = {
      id: crypto.randomUUID(),
      applicationId: app.id,
      payerId: isUuid(payerId) ? (payerId as string) : '',
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

  return savedApp;
}

// ================= FRANCHISES =================
export async function getFranchisesAsync(): Promise<Franchise[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('franchises').select('*');
      if (!error && data && data.length > 0) {
        return data.map(mapDbFranchise);
      }
    } catch (err) {
      console.warn('Supabase getFranchises error:', err);
    }
  }
  return storage.getFranchises();
}

export async function saveFranchiseAsync(franchise: Franchise, requireSupabaseSave = false): Promise<Franchise> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('franchises').upsert({
      id: franchise.id,
      mtop_number: franchise.mtopNumber,
      application_id: franchise.applicationId || null,
      operator_id: franchise.operatorId || null,
      operator_name: franchise.operatorName,
      driver_id: franchise.driverId || null,
      driver_name: franchise.driverName,
      vehicle_make: franchise.vehicleMake,
      vehicle_model: franchise.vehicleModel,
      plate_number: franchise.plateNumber,
      motor_number: franchise.motorNumber,
      chassis_number: franchise.chassisNumber,
      vehicle_color: franchise.vehicleColor,
      toda_name: franchise.todaName,
      route_area: franchise.routeArea,
      status: franchise.status,
      start_date: franchise.startDate,
      end_date: franchise.endDate,
      issued_at: franchise.issuedAt,
      expires_at: franchise.expiresAt,
      renewal_date: franchise.renewalDate,
      qr_code_data: franchise.qrCodeData,
      slot_released_at: franchise.slotReleasedAt,
      updated_at: new Date().toISOString(),
    });
    if (error && requireSupabaseSave) throw new Error(error.message);
    if (error) console.warn('Supabase save franchise error:', error.message);
  }
  return storage.saveFranchise(franchise);
}

export async function getPaymentsAsync(): Promise<Payment[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (!error && data) return data.map(mapDbPayment);
    if (error) console.warn('Supabase get payments error:', error.message);
  }
  return storage.getPayments();
}

export async function savePaymentAsync(payment: Payment, requireSupabaseSave = false): Promise<Payment> {
  if (isSupabaseConfigured() && supabase) {
    const isUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
    const { error } = await supabase.from('payments').upsert({
      id: isUuid(payment.id) ? payment.id : crypto.randomUUID(),
      application_id: isUuid(payment.applicationId) ? payment.applicationId : null,
      payer_id: isUuid(payment.payerId) ? payment.payerId : null,
      payer_name: payment.payerName,
      amount: payment.amount,
      description: payment.description,
      status: payment.status,
      payment_method: payment.paymentMethod,
      reference_number: payment.referenceNumber,
      qr_code_data: payment.qrCodeData,
      paid_at: payment.paidAt,
      created_at: payment.createdAt,
    });
    if (error && requireSupabaseSave) throw new Error(error.message);
    if (error) console.warn('Supabase save payment error:', error.message);
  }
  return storage.savePayment(payment);
}

export async function updatePaymentStatusAsync(paymentId: string, status: Payment['status']): Promise<Payment> {
  const payment = (await getPaymentsAsync()).find(item => item.id === paymentId);
  if (!payment) throw new Error('Payment record not found.');
  const updated = { ...payment, status, paidAt: status === 'completed' ? new Date().toISOString() : undefined };
  return savePaymentAsync(updated, isSupabaseConfigured());
}

export async function getPenaltiesAsync(): Promise<Penalty[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('penalties').select('*').order('issued_date', { ascending: false });
    if (!error && data) return data.map(mapDbPenalty);
    if (error) console.warn('Supabase get penalties error:', error.message);
  }
  return storage.getPenalties();
}

export async function savePenaltyAsync(penalty: Penalty, requireSupabaseSave = false): Promise<Penalty> {
  const isNewPenalty = !storage.getPenalties().some(item => item.id === penalty.id);
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('penalties').upsert({
      id: penalty.id,
      driver_id: penalty.driverId || null,
      driver_name: penalty.driverName,
      plate_number: penalty.plateNumber,
      toda_name: penalty.todaName,
      violation_type: penalty.violationType,
      amount: penalty.amount,
      status: penalty.status,
      issued_date: penalty.issuedDate.slice(0, 10),
      due_date: penalty.dueDate.slice(0, 10),
      paid_at: penalty.paidAt,
      remarks: penalty.remarks,
      issued_by: penalty.issuedBy,
    });
    if (error && requireSupabaseSave) throw new Error(error.message);
    if (error) console.warn('Supabase save penalty error:', error.message);
  }
  const savedPenalty = storage.savePenalty(penalty);
  if (isNewPenalty && penalty.status === 'unpaid') {
    const recipient = (await getUsersAsync()).find(account => account.id === penalty.driverId);
    if (recipient) {
      const notification: SMSNotification = {
        id: crypto.randomUUID(),
        userId: recipient.id,
        recipientPhone: recipient.phone,
        title: `Penalty notice: ${penalty.violationType}`,
        message: `May penalty na ₱${penalty.amount.toFixed(2)} para sa ${penalty.plateNumber}. Due date: ${new Date(penalty.dueDate).toLocaleDateString()}.`,
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
  if (isSupabaseConfigured() && supabase) {
    let query = supabase.from('sms_notifications').select('*').order('sent_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (!error && data) return data.map(mapDbSMSNotification);
    if (error) console.warn('Supabase get notifications error:', error.message);
  }
  return storage.getSMSNotifications(userId);
}

export async function saveSMSNotificationAsync(notification: SMSNotification): Promise<SMSNotification> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('sms_notifications').upsert({
      id: notification.id,
      user_id: notification.userId,
      recipient_phone: notification.recipientPhone,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      sent_at: notification.sentAt,
      read: notification.read,
    });
    if (error) throw new Error(error.message);
  }
  return storage.saveSMSNotification(notification);
}

export async function processFranchiseLifecycleAsync(): Promise<void> {
  const [franchises, users, penalties] = await Promise.all([getFranchisesAsync(), getUsersAsync(), getPenaltiesAsync()]);
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const franchise of franchises) {
    const expiry = new Date(`${franchise.expiresAt.slice(0, 10)}T00:00:00Z`).getTime();
    if (!Number.isFinite(expiry)) continue;
    const daysUntilExpiry = Math.floor((expiry - today) / dayMs);

    if (franchise.status === 'active' && daysUntilExpiry < 0) {
      await saveFranchiseAsync({ ...franchise, status: 'expired' }, isSupabaseConfigured());
      const hasExpiryPenalty = penalties.some(penalty =>
        penalty.driverId === franchise.driverId
        && penalty.plateNumber === franchise.plateNumber
        && penalty.violationType === 'Expired MTOP'
      );
      if (!hasExpiryPenalty && franchise.driverId) {
        await savePenaltyAsync({
          id: crypto.randomUUID(), driverId: franchise.driverId, driverName: franchise.driverName,
          plateNumber: franchise.plateNumber, todaName: franchise.todaName,
          violationType: 'Expired MTOP', amount: FRANCHISE_FEES.expiredFranchisePenalty,
          status: 'unpaid', issuedDate: new Date().toISOString(), dueDate: new Date().toISOString(),
          remarks: 'Fixed penalty for an expired franchise.', issuedBy: 'Baliwag Franchise System',
        }, isSupabaseConfigured());
      }
      continue;
    }

    if (franchise.status === 'expired' && daysUntilExpiry <= -365) {
      await saveFranchiseAsync({
        ...franchise,
        status: 'available',
        operatorId: '',
        operatorName: 'Available for reassignment',
        driverId: '',
        driverName: 'Available slot',
        slotReleasedAt: new Date().toISOString(),
      }, isSupabaseConfigured());
      continue;
    }

    if (franchise.status !== 'active' || daysUntilExpiry < 0 || daysUntilExpiry > 30 || !franchise.driverId) continue;
    const driver = users.find(account => account.id === franchise.driverId);
    if (!driver) continue;

    const existing = await getSMSNotificationsAsync(driver.id);
    if (existing.some(item => item.type === 'renewal_reminder' && item.message.includes(franchise.mtopNumber))) continue;

    await saveSMSNotificationAsync({
      id: crypto.randomUUID(),
      userId: driver.id,
      recipientPhone: driver.phone,
      title: 'Renewal due in 30 days',
      message: `Paalala: mag-renew ng MTOP ${franchise.mtopNumber} para sa plate ${franchise.plateNumber}. Mag-e-expire ito sa ${new Date(franchise.expiresAt).toLocaleDateString()}.`,
      type: 'renewal_reminder',
      sentAt: new Date().toISOString(),
      read: false,
    });
  }
}

// ================= ADVERTISEMENTS =================
export async function getAdvertisementsAsync(): Promise<Advertisement[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map(mapDbAdvertisement);
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
        id: ad.id,
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
        return data.map(mapDbInformationItem);
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
        id: item.id,
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
    adminPermissions: p.admin_permissions || [],
    sessionId: p.current_session_id,
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
/**
 * Uploads a file to the Supabase 'Files' storage bucket and returns its public URL.
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

      if (error) {
        console.error('Error uploading file to Files bucket:', error.message);
        return { url: null, path: null, error: error.message };
      }

      const { data: publicData } = supabase.storage
        .from('Files')
        .getPublicUrl(filePath);

      return {
        url: publicData.publicUrl,
        path: data.path,
      };
    } catch (err: any) {
      console.error('Exception during file upload:', err);
      return { url: null, path: null, error: err?.message || 'Upload failed' };
    }
  }

  // Fallback mock URL if Supabase is offline or not configured
  const mockUrl = URL.createObjectURL(file);
  return { url: mockUrl, path: `local/${file.name}` };
}

