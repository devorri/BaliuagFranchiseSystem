const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async event => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) return json(503, { message: 'PayMongo is not configured on the server.' });

  const requestUrl = new URL(event.rawUrl || event.path, 'https://localhost');
  const marker = '/.netlify/functions/paymongo';
  const routeIndex = requestUrl.pathname.indexOf(marker);
  const endpoint = routeIndex >= 0
    ? requestUrl.pathname.slice(routeIndex + marker.length)
    : requestUrl.pathname.replace(/^\/api\/paymongo/, '');

  if (!/^\/v1\/(checkout_sessions|sources)(\/[A-Za-z0-9_-]+)?$/.test(endpoint)) {
    return json(404, { message: 'Unsupported PayMongo endpoint.' });
  }
  if (!['GET', 'POST'].includes(event.httpMethod)) return json(405, { message: 'Method not allowed.' });

  try {
    const upstream = await fetch(`https://api.paymongo.com${endpoint}${requestUrl.search}`, {
      method: event.httpMethod,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
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