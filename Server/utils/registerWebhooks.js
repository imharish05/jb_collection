const axios = require('axios');
const { shiprocketPost, shiprocketGet } = require('./shiprocket');

async function registerShiprocketWebhook() {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    console.log('[Webhook] APP_URL not set — skipping Shiprocket webhook registration');
    return;
  }

  const webhookUrl = `${appUrl}/api/returns/webhook/shiprocket-return`;

  try {
    // Check if already registered — idempotent
    const existing = await shiprocketGet('/webhooks').catch(() => ({ data: [] }));
    const list = existing?.data || [];
    const alreadyRegistered = list.some(w => w.url === webhookUrl);

    if (alreadyRegistered) {
      console.log('[Webhook] Shiprocket webhook already registered ✓');
      return;
    }

    await shiprocketPost('/webhooks', {
      url:    webhookUrl,
      events: ['shipment_status'],
    });
    console.log('[Webhook] Shiprocket webhook registered:', webhookUrl);
  } catch (err) {
    console.error('[Webhook] Shiprocket registration error:', err.message);
  }
}

async function registerRazorpayWebhook() {
  const appUrl  = process.env.APP_URL;
  const keyId   = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const secret  = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!appUrl || !keyId || !keySecret || !secret) {
    console.log('[Webhook] Missing env vars — skipping Razorpay webhook registration');
    return;
  }

  const webhookUrl = `${appUrl}/api/payment/webhook`;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    // Check if already registered — idempotent
    const existing = await axios.get('https://api.razorpay.com/v1/webhooks?count=100', {
      headers: { Authorization: `Basic ${auth}` },
    }).catch(() => ({ data: { items: [] } }));

    const items = existing?.data?.items || [];
    const alreadyRegistered = items.some(w => w.url === webhookUrl);

    if (alreadyRegistered) {
      console.log('[Webhook] Razorpay webhook already registered ✓');
      return;
    }

    await axios.post('https://api.razorpay.com/v1/webhooks', {
      url:    webhookUrl,
      secret: secret,
      alert_email: process.env.ADMIN_EMAIL || '',
      active: true,
      events: {
        'payment.captured': true,
        'order.paid':       true,
        'refund.processed': true,
        'refund.failed':    true,
      },
    }, {
      headers: { Authorization: `Basic ${auth}` },
    });
    console.log('[Webhook] Razorpay webhook registered:', webhookUrl);
  } catch (err) {
    // Log but never crash server startup
    console.error('[Webhook] Razorpay registration error:', err?.response?.data || err.message);
  }
}

async function registerWebhooks() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Webhook] Non-production env — skipping webhook registration');
    return;
  }
  await registerShiprocketWebhook();
  await registerRazorpayWebhook();
}

module.exports = { registerWebhooks };
