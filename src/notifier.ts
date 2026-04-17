import notifier from 'node-notifier';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.resolve(__dirname, '..', 'price-history.csv');

export async function notifyPrice(price: string): Promise<void> {
  const now = new Date().toISOString();

  // 1. Append to CSV price history log
  const header = 'timestamp,price\n';
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, header, 'utf-8');
  }
  fs.appendFileSync(LOG_FILE, `${now},"${price}"\n`, 'utf-8');
  console.log(`[Notifier] Price logged to ${LOG_FILE}`);

  // 2. Show Windows desktop notification
  notifier.notify({
    title: '💡 Chihiros LED WRGB II – Price Update',
    message: `Current price: ${price}`,
    sound: true,
    wait: false,
  });

  console.log(`[Notifier] Desktop notification sent.`);
}

