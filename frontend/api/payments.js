const backendBaseUrl = process.env.BACKEND_API_BASE_URL;

export default async function handler(req, res) {
  if (!backendBaseUrl) {
    return res.status(500).json({ error: 'BACKEND_API_BASE_URL is not configured' });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    const upstream = await fetch(`${backendBaseUrl}/api/payments`, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method === 'POST' ? JSON.stringify(req.body ?? {}) : undefined
    });

    const bodyText = await upstream.text();
    res.status(upstream.status);

    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    res.setHeader('Content-Type', contentType);
    return res.send(bodyText);
  } catch (error) {
    return res.status(502).json({ error: 'failed to reach backend service' });
  }
}
