const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async event => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY || process.env.VITE_PAYMONGO_SECRET_KEY || 'sk_test_c45YuqZKv46a1C22BDm5VbDB';
  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

  const requestUrl = new URL(event.rawUrl || event.path, 'https://localhost');
  const marker = '/.netlify/functions/paymongo';
  const routeIndex = requestUrl.pathname.indexOf(marker);
  const endpoint = routeIndex >= 0
    ? requestUrl.pathname.slice(routeIndex + marker.length)
    : requestUrl.pathname.replace(/^\/api\/paymongo/, '');

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      body = {};
    }
  }

  // 1. Generate QR Ph Dynamic Code
  if (endpoint === '/generate-qrph' && event.httpMethod === 'POST') {
    try {
      const amountMinor = Math.round((body.amount || 450) * 100);

      const piRes = await fetch('https://api.paymongo.com/v1/payment_intents', {
        method: 'POST',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: amountMinor,
              payment_method_allowed: ['qrph'],
              currency: 'PHP',
              description: body.description || 'Baliuag City Tricycle Franchise Fee',
              statement_descriptor: 'BALIUAG FRANCHISE',
            },
          },
        }),
      });
      const piData = await piRes.json();
      if (!piRes.ok) return json(piRes.status, { error: piData?.errors?.[0]?.detail || 'Failed to create payment intent' });

      const piId = piData.data.id;
      const clientKey = piData.data.attributes.client_key;

      const pmRes = await fetch('https://api.paymongo.com/v1/payment_methods', {
        method: 'POST',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { attributes: { type: 'qrph' } } }),
      });
      const pmData = await pmRes.json();
      if (!pmRes.ok) return json(pmRes.status, { error: pmData?.errors?.[0]?.detail || 'Failed to create QR payment method' });

      const pmId = pmData.data.id;

      const attachRes = await fetch(`https://api.paymongo.com/v1/payment_intents/${piId}/attach`, {
        method: 'POST',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: pmId,
              client_key: clientKey,
            },
          },
        }),
      });
      const attachData = await attachRes.json();
      if (!attachRes.ok) return json(attachRes.status, { error: attachData?.errors?.[0]?.detail || 'Failed to attach QR payment method' });

      const nextAction = attachData.data?.attributes?.next_action;
      return json(200, {
        success: true,
        payment_intent_id: piId,
        client_key: clientKey,
        qr_image: nextAction?.code?.image_url,
        expires_at: nextAction?.code?.expires_at,
      });
    } catch (err) {
      return json(500, { error: err instanceof Error ? err.message : 'Internal QR error' });
    }
  }

  // 2. Check Payment Intent Status
  if (endpoint === '/check-payment-intent' && event.httpMethod === 'POST') {
    try {
      const piId = body.paymentIntentId;
      if (!piId) return json(400, { error: 'paymentIntentId is required' });

      const checkRes = await fetch(`https://api.paymongo.com/v1/payment_intents/${encodeURIComponent(piId)}`, {
        headers: { Authorization: authHeader },
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) return json(checkRes.status, { error: 'Failed to check status' });

      const status = checkData.data?.attributes?.status;
      return json(200, {
        status,
        paid: status === 'succeeded',
        payments: checkData.data?.attributes?.payments || [],
      });
    } catch (err) {
      return json(500, { error: err instanceof Error ? err.message : 'Internal check error' });
    }
  }

  // Fallback to upstream proxy for legacy routes
  try {
    const upstream = await fetch(`https://api.paymongo.com${endpoint}${requestUrl.search}`, {
      method: event.httpMethod,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: event.httpMethod === 'GET' ? undefined : event.body,
    });
    return {
      statusCode: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
      body: await upstream.text(),
    };
  } catch {
    return json(502, { message: 'Could not reach PayMongo.' });
  }
};