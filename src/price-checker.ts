import axios from 'axios';
import * as cheerio from 'cheerio';

const PRODUCT_URL = 'https://www.invitalshop.sk/chihiros-led-wrgb-ii-30-33w-30-45cm-s-kontrolerom';

export async function fetchPrice(): Promise<string> {
  console.log(`[PriceChecker] Fetching price from: ${PRODUCT_URL}`);

  const { data: html, status } = await axios.get<string>(PRODUCT_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'sk-SK,sk;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
    timeout: 30000,
    maxRedirects: 5,
  });

  console.log(`[PriceChecker] Response status: ${status}, HTML length: ${html.length}`);

  const $ = cheerio.load(html);

  // Try common e-shop price selectors
  const selectors = [
    '[itemprop="price"]',
    '.product-price .price',
    '.product-price',
    '.price-value',
    '.current-price',
    '.woocommerce-Price-amount',
    '.product-detail-price',
    '.price--default',
    '#product-detail-price',
    '.product-detail-price-container .price',
    'meta[property="product:price:amount"]',
  ];

  for (const selector of selectors) {
    const el = $(selector).first();
    if (el.length) {
      const text = el.text().trim();
      if (text && /\d/.test(text)) {
        const cleaned = text.replace(/[^\d,.\s€]/g, '').trim();
        console.log(`[PriceChecker] Found price via selector "${selector}": ${cleaned}`);
        return cleaned.includes('€') ? cleaned : `${cleaned} €`;
      }
      // Check content attribute (microdata / meta tags)
      const content = el.attr('content');
      if (content && /\d/.test(content)) {
        console.log(`[PriceChecker] Found price via attribute on "${selector}": ${content} €`);
        return `${content} €`;
      }
    }
  }

  // Fallback: regex search for price patterns
  const pricePatterns = [
    /(\d{1,5}[,.]\d{2})\s*€/,
    /"price"\s*:\s*"?(\d+[.,]\d{2})"?/,
    /content="(\d+[.,]\d{2})"/,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      const price = `${match[1]} €`;
      console.log(`[PriceChecker] Found price via regex fallback: ${price}`);
      return price;
    }
  }

  // Debug: log a snippet of the HTML to help diagnose
  console.log(`[PriceChecker] DEBUG - First 2000 chars of HTML:\n${html.substring(0, 2000)}`);

  throw new Error('Could not find the product price on the page.');
}
