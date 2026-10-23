// ============================================
// Semaphore SMS Service - Real SMS API Integration
// Uses Semaphore (https://semaphore.co) for Philippine SMS
// ============================================

const SMS_ENABLED = import.meta.env.VITE_SMS_ENABLED === 'true' || Boolean(import.meta.env.VITE_SEMAPHORE_API_KEY) || true;
const SEMAPHORE_SENDER_NAME = (import.meta.env.VITE_SEMAPHORE_SENDER_NAME as string || 'SinagsCater').trim();
const BASE_PROXY_URL = '/api/semaphore/api/v4';

/**
 * Check if Semaphore SMS is configured
 */
export function isSMSConfigured(): boolean {
  return SMS_ENABLED;
}

/**
 * Check Semaphore account balance and details
 */
export async function getSMSAccount(): Promise<{ success: boolean; balance?: number; accountName?: string; error?: string }> {
  try {
    const response = await fetch(`${BASE_PROXY_URL}/account`);
    if (!response.ok) return { success: false, error: `Semaphore HTTP ${response.status}` };
    const data = await response.json();
    return { success: true, balance: data.credit_balance, accountName: data.account_name };
  } catch {
    return { success: false, error: 'Failed to connect to Semaphore API' };
  }
}

/**
 * Format Philippine phone number
 * Converts: 0918-555-0101, 09185550101, +639185550101 → 09185550101
 */
function formatPhoneNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('63') && (digits.length === 12 || digits.length === 11)) {
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
  const formattedNumber = formatPhoneNumber(recipientPhone);
  
  if (formattedNumber.length < 10 || formattedNumber.length > 13) {
    console.warn('[SMS] Invalid phone number:', recipientPhone);
    return { success: false, error: `Invalid phone number: ${recipientPhone}` };
  }

  const postMessage = async (url: string, withSender = true) => {
    const formData = new URLSearchParams();
    formData.append('number', formattedNumber);
    formData.append('message', message);
    if (withSender && SEMAPHORE_SENDER_NAME && SEMAPHORE_SENDER_NAME !== 'SEMAPHORE') {
      formData.append('sendername', SEMAPHORE_SENDER_NAME);
    }
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
  };

  try {
    let response = await postMessage(`${BASE_PROXY_URL}/messages`, true);
    let text = await response.text();

    // Auto-retry without sender name if custom sender name is rejected by Semaphore
    if (!response.ok && SEMAPHORE_SENDER_NAME) {
      try {
        const retry = await postMessage(`${BASE_PROXY_URL}/messages`, false);
        if (retry.ok) {
          response = retry;
          text = await retry.text();
        }
      } catch {
        // preserve original
      }
    }

    if (!response.ok) {
      return { success: false, error: `Semaphore HTTP ${response.status}: ${text}`, recipient: formattedNumber };
    }

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      result = text;
    }

    if (Array.isArray(result) && result.length > 0) {
      return { success: true, messageId: String(result[0].message_id), recipient: formattedNumber };
    }
    return { success: false, error: result?.error || result?.message || 'Semaphore did not confirm the message.', recipient: formattedNumber };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error communicating with Semaphore SMS API', recipient: formattedNumber };
  }
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

  // Semaphore supports comma-separated numbers in a single call (up to 1000).
  const formattedNumbers = recipients.map(formatPhoneNumber).join(',');
  const formData = new URLSearchParams({ number: formattedNumbers, message });
  if (SEMAPHORE_SENDER_NAME) formData.append('sendername', SEMAPHORE_SENDER_NAME);
  try {
    const response = await fetch(`${BASE_PROXY_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
    if (!response.ok) return recipients.map(recipient => ({ success: false, error: `Semaphore HTTP ${response.status}`, recipient }));
    const result = await response.json();
    if (Array.isArray(result)) {
      return result.map((item: any) => ({ success: true, messageId: String(item.message_id), recipient: item.recipient || formatPhoneNumber(item.number || '') }));
    }
    return recipients.map(recipient => ({ success: false, error: 'Semaphore did not confirm the message.', recipient }));
  } catch {
    return recipients.map(recipient => ({ success: false, error: 'Network error', recipient }));
  }
}

// ============================================
// Pre-built SMS Templates for the Franchise System
// ============================================

export const SMSTemplates = {
  /** MTOP Application Approved */
  approvalNotice: (mtopNumber: string, driverName: string) =>
    `BALIUAG CITY: Great news, ${driverName}! Your MTOP application has been APPROVED. MTOP No: ${mtopNumber}. Please claim your official sticker at the BTTMO Office. - City of Baliwag`,

  /** Payment Confirmation */
  paymentConfirmed: (amount: number, orNumber: string) =>
    `BALIUAG CITY: Your payment of PHP ${amount.toFixed(2)} for MTOP Registration has been received. OR/Ref No: ${orNumber}. Thank you! - City of Baliwag`,

  /** TODA President Endorsement */
  todaEndorsed: (todaName: string, presidentName: string) =>
    `BALIUAG CITY: Your TODA Route Approval for ${todaName} has been endorsed by ${presidentName} and forwarded to Municipal Admin for final approval. - City of Baliwag`,

  /** Penalty Notice */
  penaltyIssued: (violationType: string, amount: number, dueDate: string) =>
    `BALIUAG CITY NOTICE: A penalty has been issued for ${violationType} (PHP ${amount.toFixed(2)}). Please settle before ${dueDate} at the City Treasurer's Office. - BTTMO Baliuag`,

  /** Renewal Reminder */
  renewalReminder: (mtopNumber: string, expiryDate: string) =>
    `BALIUAG CITY: Reminder - Your MTOP franchise ${mtopNumber} will expire on ${expiryDate}. Please renew early on the BTTMO portal. - City of Baliwag`,

  /** Inspection Passed */
  inspectionPassed: (plateNumber: string) =>
    `BALIUAG CITY: Your vehicle (${plateNumber}) has PASSED physical stenciling inspection. Please proceed to payment at the City Treasurer's Office. - BTTMO`,

  /** Account Approved */
  accountApproved: (name: string) =>
    `BALIUAG CITY: Welcome, ${name}! Your account in the Tricycle Registration System has been APPROVED. You may now log in to the portal. - City of Baliwag`,
};
