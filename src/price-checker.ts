import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const PRODUCT_URL = 'https://www.invitalshop.sk/chihiros-led-wrgb-ii-30-33w-30-45cm-s-kontrolerom';

export async function fetchPrice(): Promise<string> {
  console.log(`[PriceChecker] Fetching price from: ${PRODUCT_URL}`);

  const isLocal = !process.env.RENDER;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 720 },
    executablePath: isLocal
      ? (process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/usr/bin/google-chrome')
      : await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
    await page.goto(PRODUCT_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    const html = await page.content();
    console.log(`[PriceChecker] Page loaded, HTML length: ${html.length}`);

    // 1. Try meta tag with itemprop="price"
    const metaPrice = await page.$eval('meta[itemprop="price"]', el => el.getAttribute('content')).catch(() => null);
    if (metaPrice && /\d/.test(metaPrice)) {
      console.log(`[PriceChecker] Found price via meta itemprop: ${metaPrice} €`);
      return `${metaPrice} €`;
    }

    // 2. Try price summary element
    const priceText = await page.$eval('[data-product-code]', el => el.textContent?.trim() ?? '').catch(() => '');
    if (priceText && /\d/.test(priceText)) {
      console.log(`[PriceChecker] Found price via data-product-code: ${priceText}`);
      return priceText.includes('€') ? priceText : `${priceText} €`;
    }

    // 3. Regex fallback on full HTML
    const match = html.match(/(\d{1,5}[,.]\d{2})\s*€/);
    if (match) {
      console.log(`[PriceChecker] Found price via regex: ${match[1]} €`);
      return `${match[1]} €`;
    }

    console.log(`[PriceChecker] DEBUG - First 2000 chars:\n${html.substring(0, 2000)}`);
    throw new Error('Could not find the product price on the page.');
  } finally {
    await browser.close();
  }
}
