// Renders the icon and link-preview images from brand/ into public/.
//   node scripts/make-brand-assets.mjs        (CHROME_PATH overrides Chrome)
// Only needed after changing brand/*.svg or brand/og.html; the outputs are committed.
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const file = (p) => new URL(p, root);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();

async function png(svgPath, size) {
  const svg = readFileSync(file(svgPath), 'utf8');
  await page.setViewport({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

// An .ico file whose images are PNGs (supported by every current browser).
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e); header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8); header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

copyFileSync(file('brand/mark.svg'), file('public/favicon.svg'));
const icoSizes = [16, 32, 48];
writeFileSync(file('public/favicon.ico'), ico(await Promise.all(icoSizes.map(async (size) => ({ size, data: await png('brand/mark.svg', size) })))));
writeFileSync(file('public/apple-touch-icon.png'), await png('brand/mark-fullbleed.svg', 180));
writeFileSync(file('public/icon-192.png'), await png('brand/mark.svg', 192));
writeFileSync(file('public/icon-512.png'), await png('brand/mark.svg', 512));
writeFileSync(file('public/icon-maskable-512.png'), await png('brand/mark-fullbleed.svg', 512));

await page.setViewport({ width: 1200, height: 630 });
await page.goto(pathToFileURL(new URL('brand/og.html', root).pathname.replace(/^\/([A-Za-z]:)/, '$1')).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
writeFileSync(file('public/og-image.png'), await page.screenshot({ type: 'png' }));

await browser.close();
console.log('Wrote favicon.svg/.ico, apple-touch-icon, icon-192/512, icon-maskable-512, og-image to public/');
