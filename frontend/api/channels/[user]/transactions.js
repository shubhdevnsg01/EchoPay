const transactionsBaseUrl = process.env.TRANSACTIONS_API_BASE_URL;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }

  if (!transactionsBaseUrl) {
    return res.status(500).json({ error: 'TRANSACTIONS_API_BASE_URL is not configured' });
  }

  const user = req.query?.user;
  if (!user) {
    return res.status(400).json({ error: 'user is required' });
  }

  try {
    const upstream = await fetch(`${transactionsBaseUrl}/api/channels/${user}/transactions`, {
      method: 'GET'
    });

    const bodyText = await upstream.text();
    res.status(upstream.status);

    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    res.setHeader('Content-Type', contentType);
    return res.send(bodyText);
  } catch (error) {
    return res.status(502).json({ error: 'failed to reach transactions service' });
  }
}
