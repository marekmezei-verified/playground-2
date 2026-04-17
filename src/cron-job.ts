import 'dotenv/config';
import { fetchPrice } from './price-checker';
import { notifyPrice } from './notifier';
import { sendPriceEmail } from './email-sender';
import { APP_VERSION } from './version';

async function runCheck(): Promise<void> {
  console.log(`[App] v${APP_VERSION} — Running price check at ${new Date().toISOString()}`);
  try {
    const price = await fetchPrice();
    console.log(`[App] Price fetched: ${price}`);
    await notifyPrice(price);
    await sendPriceEmail(price);
    console.log('[App] Check completed successfully.');
  } catch (error) {
    console.error('[App] Check failed:', error);
    process.exit(1);
  }
}

// Single run — Render Cron handles scheduling
runCheck().then(() => process.exit(0));

