/**
 * EmailJS Client Integration Service
 * Sends automated MTOP receipts, certificates, and status notifications.
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_n9l8cyt';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'gqOxMblb4S_c_zUNq';
const RECEIPT_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_RECEIPT_TEMPLATE_ID || 'template_aah6vje';
const MTOP_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_MTOP_TEMPLATE_ID || 'template_lh05vrl';

export interface PaymentReceiptEmailParams {
  toEmail: string;
  applicantName: string;
  orNumber: string;
  amount: number;
  paymentMethod: 'gcash' | 'cash' | 'treasurer_office';
  plateNumber: string;
  mtopNumber?: string;
  todaName?: string;
  applicationType?: 'new' | 'renewal';
  paidAt?: string;
}

export interface MtopCertificateEmailParams {
  toEmail: string;
  applicantName: string;
  plateNumber: string;
  mtopNumber: string;
  todaName: string;
  validUntil: string;
  certificateUrl?: string;
}

/**
 * Send Payment Official Receipt Email via EmailJS
 */
export async function sendPaymentReceiptEmail(params: PaymentReceiptEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!params.toEmail || !params.toEmail.includes('@')) {
    console.warn('[EmailJS] Invalid or missing recipient email:', params.toEmail);
    return { success: false, error: 'Recipient email is missing or invalid' };
  }

  const payload = {
    service_id: SERVICE_ID,
    template_id: RECEIPT_TEMPLATE_ID,
    user_id: PUBLIC_KEY,
    template_params: {
      email: params.toEmail,
      to_email: params.toEmail,
      applicant_name: params.applicantName,
      or_number: params.orNumber,
      amount_paid: `PHP ${params.amount.toFixed(2)}`,
      payment_method: params.paymentMethod === 'gcash' ? 'GCash / Dynamic QR Ph' : "City Treasurer's Office (Cash)",
      plate_number: params.plateNumber,
      mtop_number: params.mtopNumber || 'Assigned upon Admin Approval',
      toda_name: params.todaName || 'Baliwag TODA Association',
      application_type: params.applicationType === 'renewal' ? 'Franchise Renewal' : 'New Franchise Application',
      payment_date: params.paidAt ? new Date(params.paidAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      status: 'CLEARED & VERIFIED',
    },
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn('[EmailJS] Receipt email send response error:', response.status, text);
      return { success: false, error: `EmailJS error ${response.status}: ${text}` };
    }

    console.log(`[EmailJS] ✅ Receipt sent successfully to ${params.toEmail} (OR: ${params.orNumber})`);
    return { success: true };
  } catch (err) {
    console.error('[EmailJS] Network error sending receipt email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

/**
 * Send MTOP Franchise Certificate Release Email via EmailJS
 */
export async function sendMtopCertificateEmail(params: MtopCertificateEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!params.toEmail || !params.toEmail.includes('@')) {
    return { success: false, error: 'Recipient email is missing or invalid' };
  }

  const payload = {
    service_id: SERVICE_ID,
    template_id: MTOP_TEMPLATE_ID,
    user_id: PUBLIC_KEY,
    template_params: {
      email: params.toEmail,
      to_email: params.toEmail,
      applicant_name: params.applicantName,
      mtop_number: params.mtopNumber,
      plate_number: params.plateNumber,
      toda_name: params.todaName,
      valid_until: params.validUntil,
      certificate_url: params.certificateUrl || window.location.origin + '/dashboard',
    },
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `EmailJS error ${response.status}: ${text}` };
    }

    console.log(`[EmailJS] ✅ MTOP Certificate notice sent to ${params.toEmail}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}
