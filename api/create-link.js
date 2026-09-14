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

    // Create a charge with internet banking / promptpay source
    const response = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: Math.round(parseFloat(amount) * 100).toString(),
        currency: 'thb',
        description: `${title}${description ? ' — ' + description : ''}`,
        return_uri: 'https://flashyourmeme.com',
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: data.message || 'Omise error' });
    }

    // Omise charge URL for customer to pay
    const paymentUrl = data.authorize_uri || data.source?.flow_url || null;

    return res.status(200).json({
      payment_url: paymentUrl,
      charge_id: data.id,
      amount: data.amount / 100,
      title: title,
      status: data.status,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
