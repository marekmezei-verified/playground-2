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
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
    timeout: 30000,
    maxRedirects: 5,
  });

  console.log(`[PriceChecker] Response status: ${status}, HTML length: ${html.length}`);

  const $ = cheerio.load(html);

  // 1. Try meta tag with itemprop="price" (most reliable for this site)
  const metaPrice = $('meta[itemprop="price"]').attr('content');
  if (metaPrice && /\d/.test(metaPrice)) {
    console.log(`[PriceChecker] Found price via meta itemprop: ${metaPrice} €`);
    return `${metaPrice} €`;
  }

  // 2. Try price summary element
  const priceSummary = $('[data-product-code]').first().text().trim();
  if (priceSummary && /\d/.test(priceSummary)) {
    console.log(`[PriceChecker] Found price via data-product-code: ${priceSummary}`);
    return priceSummary.includes('€') ? priceSummary : `${priceSummary} €`;
  }

  // 3. Fallback: regex on raw HTML
  const pricePatterns = [
    /(\d{1,5}[,.]\d{2})\s*€/,
    /"price"\s*:\s*"?(\d+[.,]\d{2})"?/,
    /content="(\d+[.,]\d{2})"\s*itemprop="price"/,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      const price = `${match[1]} €`;
      console.log(`[PriceChecker] Found price via regex: ${price}`);
      return price;
    }
  }

  console.log(`[PriceChecker] DEBUG - First 2000 chars:\n${html.substring(0, 2000)}`);
  throw new Error('Could not find the product price on the page.');
}
