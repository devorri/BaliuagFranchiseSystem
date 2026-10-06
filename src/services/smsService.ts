// ============================================
// Semaphore SMS Service - Real SMS API Integration
// Uses Semaphore (https://semaphore.co) for Philippine SMS
// ============================================

const SEMAPHORE_API_KEY = import.meta.env.VITE_SEMAPHORE_API_KEY as string || 'f18fe7eb9f2f4b5477776b98d8b55565';
const SEMAPHORE_SENDER_NAME = import.meta.env.VITE_SEMAPHORE_SENDER_NAME as string || 'SinagsCater';
const BASE_PROXY_URL = '/api/semaphore/api/v4';
const DIRECT_URL = 'https://api.semaphore.co/api/v4';

/**
 * Check if Semaphore SMS is configured
 */
export function isSMSConfigured(): boolean {
  return Boolean(SEMAPHORE_API_KEY && SEMAPHORE_API_KEY.length > 10);
}

/**
 * Check Semaphore account balance and details
 */
export async function getSMSAccount(): Promise<{ success: boolean; balance?: number; accountName?: string; error?: string }> {
  if (!isSMSConfigured()) {
    return { success: false, error: 'SMS API key not configured' };
  }

  const urls = [
    `${BASE_PROXY_URL}/account?apikey=${SEMAPHORE_API_KEY}`,
    `${DIRECT_URL}/account?apikey=${SEMAPHORE_API_KEY}`,
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        return {
          success: true,
          balance: data.credit_balance,
          accountName: data.account_name,
        };
      }
    } catch {
      // try next
    }
  }

  return { success: false, error: 'Failed to connect to Semaphore API' };
}

/**
 * Format Philippine phone number
 * Converts: 0918-555-0101, 09185550101, +639185550101 → 09185550101
 */
function formatPhoneNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length === 12) {
    digits = '0' + digits.substring(2);
  }
  if (digits.startsWith('63') && digits.length === 11) {
    digits = '0' + digits.substring(2);
  }
  return digits;
}

export interface SMSSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient?: string;
}

/**
 * Send an SMS message via Semaphore API
 * 
 * IMPORTANT: Do NOT start messages with "TEST" — Semaphore silently ignores them.
 */
export async function sendSMS(
  recipientPhone: string,
  message: string,
): Promise<SMSSendResult> {
  if (!isSMSConfigured()) {
    console.warn('[SMS] Semaphore API key not configured. SMS not sent.');
    return { success: false, error: 'SMS API key not configured.' };
  }

  const formattedNumber = formatPhoneNumber(recipientPhone);
  
  if (formattedNumber.length < 10 || formattedNumber.length > 13) {
    console.warn('[SMS] Invalid phone number:', recipientPhone);
    return { success: false, error: `Invalid phone number: ${recipientPhone}` };
  }

  const postMessage = async (useSenderName: boolean, url: string) => {
    const formData = new URLSearchParams();
    formData.append('apikey', SEMAPHORE_API_KEY);
    formData.append('number', formattedNumber);
    formData.append('message', message);
    if (useSenderName && SEMAPHORE_SENDER_NAME) {
      formData.append('sendername', SEMAPHORE_SENDER_NAME);
    }
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
  };

  const urls = [`${BASE_PROXY_URL}/messages`, `${DIRECT_URL}/messages`];

  for (const url of urls) {
    try {
      // First attempt with sender name
      let response = await postMessage(true, url);
      let text = await response.text();

      // If failed due to sender name, retry without sender name
      if (!response.ok && (text.toLowerCase().includes('sender') || response.status === 400)) {
        console.warn('[SMS] Sender name error, retrying without custom sender name...');
        response = await postMessage(false, url);
        text = await response.text();
      }

      if (!response.ok) {
        console.warn(`[SMS] Failed via ${url}: HTTP ${response.status}`, text);
        continue; // try next url
      }

      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        return { success: true, recipient: formattedNumber };
      }

      if (Array.isArray(result) && result.length > 0) {
        console.log('[SMS] ✅ Message sent successfully:', {
          messageId: result[0].message_id,
          to: formattedNumber,
          status: result[0].status,
        });
        return {
          success: true,
          messageId: String(result[0].message_id),
          recipient: formattedNumber,
        };
      }

      if (result.error || result.message) {
        return { success: false, error: result.error || result.message, recipient: formattedNumber };
      }

      return { success: true, recipient: formattedNumber };
    } catch (err) {
      console.warn(`[SMS] Request failed to ${url}:`, err);
    }
  }

  return { success: false, error: 'Network error communicating with Semaphore SMS API', recipient: formattedNumber };
}

/**
 * Send bulk SMS to multiple recipients
 */
export async function sendBulkSMS(
  recipients: string[],
  message: string,
): Promise<SMSSendResult[]> {
  if (!isSMSConfigured()) {
    return recipients.map(r => ({ success: false, error: 'SMS not configured', recipient: r }));
  }

  // Semaphore supports comma-separated numbers in a single call (up to 1000)
  const formattedNumbers = recipients.map(formatPhoneNumber).join(',');
  const urls = [`${BASE_PROXY_URL}/messages`, `${DIRECT_URL}/messages`];

  for (const url of urls) {
    try {
      const formData = new URLSearchParams();
      formData.append('apikey', SEMAPHORE_API_KEY);
      formData.append('number', formattedNumbers);
      formData.append('message', message);
      if (SEMAPHORE_SENDER_NAME) {
        formData.append('sendername', SEMAPHORE_SENDER_NAME);
      }

      let response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      let text = await response.text();

      // Retry without sender name if it caused the error
      if (!response.ok && (text.toLowerCase().includes('sender') || response.status === 400)) {
        const retryData = new URLSearchParams();
        retryData.append('apikey', SEMAPHORE_API_KEY);
        retryData.append('number', formattedNumbers);
        retryData.append('message', message);
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: retryData.toString(),
        });
        text = await response.text();
      }

      if (!response.ok) {
        continue; // try next URL
      }

      const result = JSON.parse(text);
      if (Array.isArray(result)) {
        return result.map((r: any) => ({
          success: true,
          messageId: String(r.message_id),
          recipient: r.recipient || formatPhoneNumber(r.number || ''),
        }));
      }

      return recipients.map(r => ({ success: true, recipient: r }));
    } catch {
      // try next URL
    }
  }

  return recipients.map(r => ({ success: false, error: 'Network error', recipient: r }));
}

// ============================================
// Pre-built SMS Templates for the Franchise System
// ============================================

export const SMSTemplates = {
  /** MTOP Application Approved */
  approvalNotice: (mtopNumber: string, driverName: string) =>
    `BALIUAG CITY: Magandang balita, ${driverName}! Ang iyong MTOP application ay APRUBADO na. MTOP No: ${mtopNumber}. Kunin ang sticker sa BTTMO Office. - Lungsod ng Baliwag`,

  /** Payment Confirmation */
  paymentConfirmed: (amount: number, orNumber: string) =>
    `BALIUAG CITY: Natanggap na ang iyong bayad na PHP ${amount.toFixed(2)} para sa MTOP Registration. OR/Ref No: ${orNumber}. Salamat! - Lungsod ng Baliwag`,

  /** TODA President Endorsement */
  todaEndorsed: (todaName: string, presidentName: string) =>
    `BALIUAG CITY: Ang iyong TODA Route Approval sa ${todaName} ay aprubado na ni ${presidentName}. Ipinasa na sa Admin para sa final MTOP approval. - Lungsod ng Baliwag`,

  /** Penalty Notice */
  penaltyIssued: (violationType: string, amount: number, dueDate: string) =>
    `BALIUAG CITY ABISO: May penalty ka para sa ${violationType} (PHP ${amount.toFixed(2)}). Bayaran bago ${dueDate} sa Treasurer's Office. - BTTMO Baliuag`,

  /** Renewal Reminder */
  renewalReminder: (mtopNumber: string, expiryDate: string) =>
    `BALIUAG CITY: Paalala - Ang iyong MTOP ${mtopNumber} ay mag-e-expire sa ${expiryDate}. Mag-renew na sa BTTMO portal. - Lungsod ng Baliwag`,

  /** Inspection Passed */
  inspectionPassed: (plateNumber: string) =>
    `BALIUAG CITY: Ang iyong sasakyan (${plateNumber}) ay PUMASA sa inspection/stenciling. Magbayad na sa Treasurer's Office para sa susunod na hakbang. - BTTMO`,

  /** Account Approved */
  accountApproved: (name: string) =>
    `BALIUAG CITY: Magandang araw, ${name}! Ang iyong account sa Tricycle Registration System ay APRUBADO na. Mag-login na sa portal. - Lungsod ng Baliwag`,
};
