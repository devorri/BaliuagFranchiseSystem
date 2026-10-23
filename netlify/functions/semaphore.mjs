const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'content-type': 'application/json',
    ...CORS_HEADERS,
  },
  body: JSON.stringify(body),
});

export const handler = async event => {
  // 1. Handle CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  const apiKey = process.env.SEMAPHORE_API_KEY || 
                 process.env.VITE_SEMAPHORE_API_KEY || 
                 'f18fe7eb9f2f4b5477776b98d8b55565';

  if (!apiKey) {
    return json(503, { message: 'Semaphore SMS API key is not configured.' });
  }

  const defaultSender = process.env.SEMAPHORE_SENDER_NAME || 
                        process.env.VITE_SEMAPHORE_SENDER_NAME || 
                        'SinagsCater';

  const requestUrl = new URL(event.rawUrl || event.path, 'https://localhost');
  const marker = '/.netlify/functions/semaphore';
  const routeIndex = requestUrl.pathname.indexOf(marker);
  const endpoint = routeIndex >= 0
    ? requestUrl.pathname.slice(routeIndex + marker.length)
    : requestUrl.pathname.replace(/^\/api\/semaphore/, '');

  if (!['GET', 'POST'].includes(event.httpMethod)) {
    return json(405, { message: 'Method not allowed.' });
  }

  // Parse incoming payload (supports both JSON and urlencoded)
  let params = new URLSearchParams();
  if (event.body) {
    try {
      const parsedJson = JSON.parse(event.body);
      for (const [key, val] of Object.entries(parsedJson)) {
        if (val !== undefined && val !== null) {
          params.set(key, String(val));
        }
      }
    } catch {
      params = new URLSearchParams(event.body);
    }
  }

  // Map common field names (e.g. recipientPhone -> number)
  if (!params.get('number') && params.get('recipientPhone')) {
    params.set('number', params.get('recipientPhone'));
  }

  // Format phone number to Philippine format (e.g. 0917... or 63917...)
  const rawNumber = params.get('number') || '';
  if (rawNumber) {
    let cleanNumber = rawNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('63') && (cleanNumber.length === 12 || cleanNumber.length === 11)) {
      cleanNumber = '0' + cleanNumber.substring(2);
    }
    params.set('number', cleanNumber);
  }

  // Set default sender if provided and not explicitly specified
  if (defaultSender && defaultSender !== 'SEMAPHORE' && !params.get('sendername')) {
    params.set('sendername', defaultSender);
  }

  params.set('apikey', apiKey);

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetPath = cleanEndpoint.startsWith('/api/v4') ? cleanEndpoint : `/api/v4${cleanEndpoint}`;

  const dispatchToSemaphore = async (useSender = true) => {
    const dispatchParams = new URLSearchParams(params);
    if (!useSender) {
      dispatchParams.delete('sendername');
    }

    const upstreamUrl = new URL(`https://api.semaphore.co${targetPath}`);
    if (event.httpMethod === 'GET') {
      upstreamUrl.searchParams.set('apikey', apiKey);
      for (const [k, v] of dispatchParams.entries()) {
        upstreamUrl.searchParams.set(k, v);
      }
      return fetch(upstreamUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    } else {
      return fetch(upstreamUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: dispatchParams.toString(),
      });
    }
  };

  try {
    let upstreamRes = await dispatchToSemaphore(true);
    let text = await upstreamRes.text();

    // If Semaphore returns an error related to sender name, auto-retry without sender name
    if (!upstreamRes.ok || (text.includes('sender') && text.includes('error'))) {
      try {
        const retryRes = await dispatchToSemaphore(false);
        const retryText = await retryRes.text();
        if (retryRes.ok) {
          upstreamRes = retryRes;
          text = retryText;
        }
      } catch {
        // preserve original response
      }
    }

    return {
      statusCode: upstreamRes.status,
      headers: {
        'content-type': upstreamRes.headers.get('content-type') || 'application/json',
        ...CORS_HEADERS,
      },
      body: text,
    };
  } catch (err) {
    return json(502, {
      message: 'Failed to communicate with Semaphore SMS service.',
      error: err instanceof Error ? err.message : String(err),
    });
  }
};