import 'dotenv/config';
import cron from 'node-cron';
import { fetchPrice } from './price-checker';
import { notifyPrice } from './notifier';
import { sendPriceEmail } from './email-sender';

async function runCheck(): Promise<void> {
  console.log(`[App] Running price check at ${new Date().toISOString()}`);
  try {
    const price = await fetchPrice();
    console.log(`[App] Price fetched: ${price}`);
    await notifyPrice(price);
    await sendPriceEmail(price);
    console.log('[App] Check completed successfully.');
  } catch (error) {
    console.error('[App] Check failed:', error);
  }
}

// Run once immediately on startup
runCheck();

// Schedule daily at 08:00
cron.schedule('0 8 * * *', () => {
  runCheck();
});

console.log('[App] Price checker started. Scheduled daily at 08:00.');
