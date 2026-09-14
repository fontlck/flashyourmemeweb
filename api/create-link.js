export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.OMISE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'OMISE_SECRET_KEY not configured' });
  }

  const { amount, title, description } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const credentials = Buffer.from(`${secretKey}:`).toString('base64');
    const response = await fetch('https://api.omise.co/links', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(parseFloat(amount) * 100), // THB → satang
        currency: 'thb',
        title: title || 'FLASHYOURMEME',
        description: description || '',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: data.message || 'Omise error' });
    }

    return res.status(200).json({
      payment_url: data.payment_url,
      amount: data.amount / 100,
      title: data.title,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
