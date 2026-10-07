const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async event => {
  const apiKey = process.env.SEMAPHORE_API_KEY;
  if (!apiKey) return json(503, { message: 'SMS is not configured on the server.' });

  const requestUrl = new URL(event.rawUrl || event.path, 'https://localhost');
  const marker = '/.netlify/functions/semaphore';
  const routeIndex = requestUrl.pathname.indexOf(marker);
  const endpoint = routeIndex >= 0
    ? requestUrl.pathname.slice(routeIndex + marker.length)
    : requestUrl.pathname.replace(/^\/api\/semaphore/, '');

  if (!/^\/api\/v4\/(account|messages)$/.test(endpoint)) {
    return json(404, { message: 'Unsupported SMS endpoint.' });
  }
  if (!['GET', 'POST'].includes(event.httpMethod)) return json(405, { message: 'Method not allowed.' });

  const upstreamUrl = new URL(`https://api.semaphore.co${endpoint}`);
  upstreamUrl.searchParams.set('apikey', apiKey);
  let body;
  if (event.httpMethod === 'POST') {
    const form = new URLSearchParams(event.body || '');
    form.set('apikey', apiKey);
    body = form.toString();
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: event.httpMethod,
      headers: event.httpMethod === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
      body,
    });
    return {
      statusCode: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
      body: await upstream.text(),
    };
  } catch {
    return json(502, { message: 'Could not reach Semaphore.' });
  }
};