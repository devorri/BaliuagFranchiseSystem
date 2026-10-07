/**
 * PayMongo Payment Gateway Service
 * Supports:
 * - Dynamic QR Ph & GCash via PayMongo Checkout Sessions API (/v1/checkout_sessions)
 * - GCash Direct via Sources API (/v1/sources)
 *
 * Uses Secret Key (sk_test_...) for Checkout Sessions and Public Key (pk_test_...)
 */

const BASE_URL = '/api/paymongo';
const PAYMONGO_ENABLED = import.meta.env.VITE_PAYMONGO_ENABLED === 'true';

function getHeaders(): Record<string, string> {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}

export interface PayMongoCheckoutResponse {
  id: string;
  type: string;
  attributes: {
    checkout_url: string;
    status: 'active' | 'paid' | 'cancelled' | 'expired';
    payment_method_types: string[];
    payments: Array<{
      id: string;
      type: string;
      attributes: {
        amount: number;
        currency: string;
        status: string;
        source?: {
          type: string;
        };
      };
    }>;
    line_items: Array<{
      name: string;
      amount: number;
      currency: string;
      quantity: number;
    }>;
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
 * Create a dynamic QR Ph + GCash Checkout Session
 * Generates dynamic QR Ph code automatically for the exact transaction amount
 */
export async function createCheckoutSession(params: {
  amount: number;
  name?: string;
  description?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<PayMongoCheckoutResponse> {
  const amountInCentavos = Math.round(params.amount * 100);

  const payload = {
    data: {
      attributes: {
        send_email_receipt: false,
        show_description: true,
        show_line_items: true,
        description: params.description || 'Baliuag City Tricycle Franchise Fee Payment',
        line_items: [
          {
            name: params.name || 'MTOP Franchise Application Fee',
            amount: amountInCentavos,
            currency: 'PHP',
            quantity: 1,
          },
        ],
        payment_method_types: ['qrph', 'gcash'],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
      },
    },
  };

  const response = await fetch(`${BASE_URL}/v1/checkout_sessions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok || !text) {
    let errorDetail = `PayMongo HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.errors && parsed.errors[0]) {
        errorDetail = parsed.errors[0].detail || errorDetail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const data = JSON.parse(text);
  return data.data as PayMongoCheckoutResponse;
}

/**
 * Retrieve PayMongo Checkout Session to verify payment status
 */
export async function getCheckoutSession(sessionId: string): Promise<PayMongoCheckoutResponse> {
  const response = await fetch(`${BASE_URL}/v1/checkout_sessions/${encodeURIComponent(sessionId)}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const text = await response.text();
  if (!response.ok || !text) {
    throw new Error(`Failed to retrieve checkout session (HTTP ${response.status})`);
  }

  const data = JSON.parse(text);
  return data.data as PayMongoCheckoutResponse;
}

/**
 * Create a PayMongo GCash Source (Legacy support)
 */
export async function createGCashSource(params: {
  amount: number;
  successUrl: string;
  failedUrl: string;
}): Promise<PayMongoSourceResponse> {
  const amountInCentavos = Math.round(params.amount * 100);

  const response = await fetch(`${BASE_URL}/v1/sources`, {
    method: 'POST',
    headers: getHeaders(),
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

  const text = await response.text();
  if (!response.ok || !text) {
    let errorDetail = `PayMongo HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.errors && parsed.errors[0]) {
        errorDetail = parsed.errors[0].detail || errorDetail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const data = JSON.parse(text);
  return data.data as PayMongoSourceResponse;
}

/**
 * Retrieve GCash Source by ID
 */
export async function getGCashSource(sourceId: string): Promise<PayMongoSourceResponse> {
  const response = await fetch(`${BASE_URL}/v1/sources/${encodeURIComponent(sourceId)}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const text = await response.text();
  if (!response.ok || !text) {
    throw new Error(`Failed to retrieve PayMongo source (HTTP ${response.status})`);
  }

  const data = JSON.parse(text);
  return data.data as PayMongoSourceResponse;
}

export function isPayMongoConfigured(): boolean {
  return PAYMONGO_ENABLED;
}
