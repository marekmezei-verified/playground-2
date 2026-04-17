import { Resend } from 'resend';

export async function sendPriceEmail(price: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.EMAIL_TO;

  if (!apiKey || !to) {
    throw new Error('Missing config. Set RESEND_API_KEY and EMAIL_TO in .env');
  }

  const resend = new Resend(apiKey);
  const today = new Date().toLocaleDateString('sk-SK');

  await resend.emails.send({
    from: 'Price Checker <onboarding@resend.dev>',
    to,
    subject: `💡 Chihiros LED WRGB II – Price Update (${today})`,
    html: `
      <h2>Chihiros LED WRGB II 30 – Daily Price Check</h2>
      <p><strong>Current price: ${price}</strong></p>
      <p><a href="https://www.invitalshop.sk/chihiros-led-wrgb-ii-30-33w-30-45cm-s-kontrolerom">View product</a></p>
      <p><small>Checked on ${today}</small></p>
    `,
  });

  console.log(`[EmailSender] Price email sent to ${to}`);
}

