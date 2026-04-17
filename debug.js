const axios = require('axios');

async function inspect() {
  const { data: html } = await axios.get(
    'https://www.invitalshop.sk/chihiros-led-wrgb-ii-30-33w-30-45cm-s-kontrolerom',
    { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
  );

  const searches = ['119,48', '119.48', 'itemprop="price"', 'product:price', '"price"', 'priceAmount', 'price_gross'];
  for (const s of searches) {
    const i = html.indexOf(s);
    if (i >= 0) {
      console.log(`\n'${s}' FOUND at ${i}:`);
      console.log(html.substring(Math.max(0, i - 80), i + 200));
    } else {
      console.log(`'${s}' NOT FOUND`);
    }
  }
}

inspect().catch(console.error);

