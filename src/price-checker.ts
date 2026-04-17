import axios from 'axios';
import * as cheerio from 'cheerio';

const PRODUCT_URL = 'https://www.invitalshop.sk/chihiros-led-wrgb-ii-30-33w-30-45cm-s-kontrolerom';

export async function fetchPrice(): Promise<string> {
  console.log(`[PriceChecker] Fetching price from: ${PRODUCT_URL}`);

  const scraperApiKey = process.env.SCRAPER_API_KEY;
  const scrapingBeeKey = process.env.SCRAPINGBEE_API_KEY;

  let fetchUrl: string;
  let label: string;

  if (scrapingBeeKey) {
    fetchUrl = `https://app.scrapingbee.com/api/v1?api_key=${scrapingBeeKey}&url=${encodeURIComponent(PRODUCT_URL)}&render_js=true&premium_proxy=true`;
    label = 'ScrapingBee';
  } else if (scraperApiKey) {
    fetchUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(PRODUCT_URL)}&render=true&premium=true`;
    label = 'ScraperAPI';
  } else {
    fetchUrl = PRODUCT_URL;
    label = 'direct fetch';
  }

  console.log(`[PriceChecker] Using ${label}`);

  const { data: html, status } = await axios.get<string>(fetchUrl, {
    headers: (scraperApiKey || scrapingBeeKey) ? {} : {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept-Language': 'sk-SK,sk;q=0.9',
    },
    timeout: 120000,
  });

  console.log(`[PriceChecker] Response status: ${status}, HTML length: ${html.length}`);

  const $ = cheerio.load(html);

  // 1. Try meta tag with itemprop="price"
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

  // 3. Regex fallback
  const match = html.match(/(\d{1,5}[,.]\d{2})\s*€/);
  if (match) {
    console.log(`[PriceChecker] Found price via regex: ${match[1]} €`);
    return `${match[1]} €`;
  }

  console.log(`[PriceChecker] DEBUG - First 2000 chars:\n${html.substring(0, 2000)}`);
  throw new Error('Could not find the product price on the page.');
}
