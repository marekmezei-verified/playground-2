import axios from 'axios';
import * as cheerio from 'cheerio';

const PRODUCT_URL = 'https://www.invitalshop.sk/chihiros-led-wrgb-ii-30-33w-30-45cm-s-kontrolerom';

export async function fetchPrice(): Promise<string> {
  console.log(`[PriceChecker] Fetching price from: ${PRODUCT_URL}`);

  const { data: html } = await axios.get<string>(PRODUCT_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'sk-SK,sk;q=0.9',
    },
  });

  const $ = cheerio.load(html);

  // Try common e-shop price selectors
  const selectors = [
    '.product-price .price',
    '.product-price',
    '.price-value',
    '.current-price',
    '[itemprop="price"]',
    '.woocommerce-Price-amount',
  ];

  for (const selector of selectors) {
    const el = $(selector).first();
    if (el.length) {
      const text = el.text().trim();
      if (text && text.includes('€')) {
        console.log(`[PriceChecker] Found price via selector "${selector}": ${text}`);
        return text;
      }
      // Check for content attribute (microdata)
      const content = el.attr('content');
      if (content) {
        console.log(`[PriceChecker] Found price via attribute on "${selector}": ${content} €`);
        return `${content} €`;
      }
    }
  }

  // Fallback: regex search for price pattern like "119,48 €"
  const priceMatch = html.match(/(\d{1,5}[,.]\d{2})\s*€/);
  if (priceMatch) {
    const price = `${priceMatch[1]} €`;
    console.log(`[PriceChecker] Found price via regex fallback: ${price}`);
    return price;
  }

  throw new Error('Could not find the product price on the page.');
}

