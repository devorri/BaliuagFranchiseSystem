/**
 * PayMongo Payment Gateway Service (Client-Side GCash Source Integration)
 *
 * Uses PayMongo Sources API (/v1/sources) with Public Key (pk_test_...)
 * which is officially supported for browser/frontend GCash checkouts.
 *
 * API Reference: https://developers.paymongo.com/reference/create-a-source
 */

const PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY as string || 'pk_test_imhxYJMD1aHRKtDvNjFTNFUK';

// Proxy URL in Vite dev server (or fallback direct URL)
const BASE_URL = '/api/paymongo';

function getPublicAuthHeaders(): Record<string, string> {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa(PAYMONGO_PUBLIC_KEY + ':')}`,
  };
}

export interface PayMongoSourceResponse {
  id: string;
  type: string;
  attributes: {
    amount: number;
    currency: string;
    status: string;
    type: string;
    redirect: {
      checkout_url: string;
      failed: string;
      success: string;
    };
    created_at: number;
    updated_at: number;
  };
}

/**
 * Create a PayMongo GCash Source (Frontend Compatible with pk_test_...)
 *
 * @param params.amount - Amount in PHP (e.g. 600 for ₱600.00)
 * @param params.successUrl - Redirect URL after GCash authorization
 * @param params.failedUrl - Redirect URL if GCash authorization fails
 */
export async function createGCashSource(params: {
  amount: number;
  successUrl: string;
  failedUrl: string;
}): Promise<PayMongoSourceResponse> {
  const amountInCentavos = Math.round(params.amount * 100);

  console.log('[PayMongo] Creating GCash Source with Public Key...', { amount: params.amount, amountInCentavos });

  // Try proxy first, fallback to direct API if proxy is not active
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/v1/sources`, {
      method: 'POST',
      headers: getPublicAuthHeaders(),
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'gcash',
            amount: amountInCentavos,
            currency: 'PHP',
            redirect: {
              success: params.successUrl,
              failed: params.failedUrl,
            },
          },
        },
      }),
    });
  } catch {
    // Fallback direct request if dev proxy is offline
    response = await fetch('https://api.paymongo.com/v1/sources', {
      method: 'POST',
      headers: getPublicAuthHeaders(),
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'gcash',
            amount: amountInCentavos,
            currency: 'PHP',
            redirect: {
              success: params.successUrl,
              failed: params.failedUrl,
            },
          },
        },
      }),
    });
  }

  const text = await response.text();

  if (!response.ok || !text) {
    let errorDetail = `PayMongo HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.errors && parsed.errors[0]) {
        errorDetail = parsed.errors[0].detail || errorDetail;
      }
    } catch {
      // html or empty
    }
    throw new Error(errorDetail);
  }

  const data = JSON.parse(text);
  return data.data as PayMongoSourceResponse;
}

/**
 * Retrieve GCash Source by ID to check status
 */
export async function getGCashSource(sourceId: string): Promise<PayMongoSourceResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/v1/sources/${sourceId}`, {
      method: 'GET',
      headers: getPublicAuthHeaders(),
    });
  } catch {
    response = await fetch(`https://api.paymongo.com/v1/sources/${sourceId}`, {
      method: 'GET',
      headers: getPublicAuthHeaders(),
    });
  }

  const text = await response.text();
  if (!response.ok || !text) {
    throw new Error(`Failed to retrieve PayMongo source (HTTP ${response.status})`);
  }

  const data = JSON.parse(text);
  return data.data as PayMongoSourceResponse;
}

export function isPayMongoConfigured(): boolean {
  return true;
}
