export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.OMISE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'OMISE_SECRET_KEY not configured' });
  }

  const { token, amount, title, description } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const credentials = Buffer.from(`${secretKey}:`).toString('base64');
    const body = new URLSearchParams({
      amount: Math.round(parseFloat(amount) * 100).toString(),
      currency: 'thb',
      description: `${title}${description ? ' — ' + description : ''}`,
      return_uri: 'https://flashyourmeme.com/pay?paid=1',
    });

    if (token) body.set('card', token);

    const response = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: data.message || 'Omise error' });
    }

    return res.status(200).json({
      authorize_uri: data.authorize_uri || null,
      charge_id: data.id,
      amount: data.amount / 100,
      status: data.status,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
