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
  ApplicationStatus 
} from '../types';

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
        return { user: null, error: 'Maling username o password.' };
      }

      if (data.password_hash !== password) {
        return { user: null, error: 'Maling username o password.' };
      }

      if (data.account_status === 'rejected') {
        return { user: null, error: 'Ang inyong account ay tinanggihan ng administrator.' };
      }
      if (data.account_status === 'pending') {
        return { user: null, error: 'Ang inyong account ay naghihintay pa ng pagsusuri ng Security Admin.' };
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
  const users = await getUsersAsync();
  const exists = users.find(u => u.username.toLowerCase() === userData.username.toLowerCase());
  if (exists) {
    return { user: null, error: 'Ang username na ito ay nagamit na.' };
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

export async function saveApplicationAsync(app: Application): Promise<Application> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('applications').upsert({
        id: app.id,
        applicant_id: app.applicantId,
        applicant_name: app.applicantName,
        applicant_role: app.applicantRole,
        type: app.type,
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
    } catch (err) {
      console.warn('Supabase save application error:', err);
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
  const result = storage.updateApplicationStatus(id, status, adminNotes, reviewedBy, startDate, endDate);
  if (isSupabaseConfigured() && supabase && result) {
    try {
      await supabase.from('applications').update({
        status: result.status,
        admin_notes: result.adminNotes,
        reviewed_by: result.reviewedBy,
        reviewed_at: result.reviewedAt,
        start_date: result.startDate,
        end_date: result.endDate,
        mtop_number: result.mtopNumber,
        qr_code_url: result.qrCodeUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    } catch (err) {
      console.warn('Supabase update status error:', err);
    }
  }
  return result;
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
    type: a.type,
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
    documents: a.documents || [],
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

