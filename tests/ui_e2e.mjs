// Clicks through EditMe in Chrome against the LOCAL stack only:
//   npx supabase start && npx supabase db reset        (fresh seed data)
//   npx supabase functions serve --env-file supabase/functions/.env   (PAYMENTS_MODE=test)
//   npm run dev:local -- --port 5180
//   npm run test:ui
// It writes data (hires, payments, reviews), so it refuses to run if the
// site talks to anything but the local stack. Screenshots: tests/shots/.
// CHROME_PATH and E2E_BASE override the defaults below.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.E2E_BASE ?? 'http://localhost:5180';
const OUT = new URL('./shots/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--force-prefers-reduced-motion', '--window-size=1400,900'],
  defaultViewport: { width: 1400, height: 900 },
});
const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
page.on('request', (r) => {
  // Safety: this test writes data, so it must only ever talk to the local stack.
  if (r.url().includes('supabase.co')) { console.log('ABORT: request to the live project ' + r.url()); process.exit(2); }
});
page.on('response', (r) => {
  const u = r.url();
  if (r.status() >= 400 && !u.includes('ytimg') && !u.includes('/auth/v1/user')) problems.push(`HTTP ${r.status()} ${r.request().method()} ${u.replace(BASE, '')}`);
});

let step = 0;
const passed = [];
async function check(label, fn) {
  step++;
  try {
    await fn();
    passed.push(label);
    console.log(`ok   ${label}`);
  } catch (e) {
    await page.screenshot({ path: `${OUT}FAIL-${step}.png` });
    console.log(`FAIL ${label}: ${e.message}`);
    await browser.close();
    console.log('\nProblems seen:\n' + problems.join('\n'));
    process.exit(1);
  }
}
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png`, fullPage: false });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (t, scope = '') => page.locator(`${scope}::-p-text(${t})`);
const clickText = async (t, scope = '') => { await text(t, scope).setTimeout(8000).click(); };
const seeText = async (t) => { await page.waitForFunction((s) => document.body.innerText.includes(s), { timeout: 10000 }, t); };
const bodyHas = (s) => page.evaluate((x) => document.body.innerText.includes(x), s);

async function signIn(email) {
  await page.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle0' });
  await page.type('#email', email);
  await page.type('#password', 'editme-local-1');
  await clickText('Sign in', 'button');
  await page.waitForFunction(() => !location.pathname.startsWith('/sign-in'), { timeout: 10000 });
  await wait(800);
}
async function signOut() {
  await page.click('button[aria-label="Sign out"]');
  await seeText('Create account');
}

// ── Visitor ──
await check('Discover lists real editors first, then labelled samples', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await seeText('Ama Owusu');
  await seeText('Sample: VFX artist');
  const order = await page.evaluate(() => [...document.querySelectorAll('h3')].map((h) => h.textContent));
  const firstSample = order.findIndex((n) => n?.startsWith('Sample'));
  const lastReal = Math.max(...['Ama Owusu', 'Leo Park', 'Sara Lind', 'Omar Haddad'].map((n) => order.indexOf(n)));
  if (firstSample < lastReal) throw new Error(`samples before real editors: ${order.join(', ')}`);
  if (!(await bodyHas('4 editors · 2 samples'))) throw new Error('count line wrong');
  await shot('01-discover-visitor');
});

await check('Search filters editors', async () => {
  await page.type('input[aria-label="Search editors"]', 'resolve');
  await page.keyboard.press('Enter');
  await seeText('Results for');
  const names = await page.evaluate(() => [...document.querySelectorAll('h3')].map((h) => h.textContent));
  if (names.includes('Sara Lind') || !names.includes('Leo Park')) throw new Error(names.join(','));
  await page.goto(BASE, { waitUntil: 'networkidle0' });
});

await check('Sidebar categories open Discover on that category', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.click('#nav-categories a[href="/?category=colorist"]');
  await page.waitForFunction(() => location.search === '?category=colorist');
  await wait(500);
  const names = await page.evaluate(() => [...document.querySelectorAll('main h3')].map((h) => h.textContent));
  if (names.join() !== 'Leo Park') throw new Error(names.join());
  const current = await page.$eval('#nav-categories [aria-current=page]', (a) => a.textContent);
  if (current !== 'Colorist') throw new Error(`highlighted: ${current}`);
  await page.click('button[aria-label="Hide categories"]');
  if (await page.$('#nav-categories')) throw new Error('categories did not fold');
  await page.click('button[aria-label="Show categories"]');
});

await check('Filter groups fold open and closed', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  if (await page.evaluate(() => document.querySelector('aside')?.innerText.includes('Final Cut Pro'))) throw new Error('Software should start folded');
  await clickText('Software', 'aside button');
  await seeText('Final Cut Pro');
  await page.click('aside label ::-p-text(DaVinci Resolve)');
  await wait(300);
  const names = await page.evaluate(() => [...document.querySelectorAll('main h3')].map((h) => h.textContent));
  if (names.includes('Sara Lind') || !names.includes('Ama Owusu')) throw new Error(names.join());
  await clickText('Specialization', 'aside button');
  if (await page.$('aside button[aria-pressed]')) throw new Error('Specialization did not fold');
  await shot('17-filters-folded');
});

await check('Hiding the filter panel is remembered', async () => {
  await clickText('Hide filters', 'button');
  await page.reload({ waitUntil: 'networkidle0' });
  await seeText('Ama Owusu');
  if (await bodyHas('Hide filters')) throw new Error('panel came back open');
  await clickText('Filters', 'button[aria-expanded=false]');
  await seeText('Hide filters');
});

await check('How it works and Help pages (signed out)', async () => {
  await page.click('nav a[href="/how-it-works"]');
  await page.waitForFunction(() => document.querySelector('main')?.innerText.includes('The rules that protect both sides'));
  await seeText('EditMe currently charges no platform fee.');
  await shot('18-how-it-works');
  await page.click('nav a[href="/help"]');
  await page.waitForSelector('input[aria-label="Search questions"]');
  await page.type('input[aria-label="Search questions"]', 'refund');
  await clickText('Can I get a refund?');
  await seeText('in full, if the editor declines');
  await shot('19-help');
});

await check('Saving while signed out asks to sign in', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.click('button[aria-label="Save Ama Owusu"]');
  await page.waitForFunction(() => location.pathname === '/sign-in', { timeout: 8000 });
});

await check('An editor page shows plans, portfolio and reviews', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await clickText('Leo Park', 'h3');
  await seeText('Projects done');
  await clickText('reviews', 'button[role=tab]');
  await seeText('Beautiful look');
  await clickText('services', 'button[role=tab]');
  await seeText('Hire with this package');
  await shot('02-editor-page');
});

await check('Hiring signed out asks to sign in', async () => {
  await clickText('Hire with this package');
  await page.waitForFunction(() => location.pathname === '/sign-in', { timeout: 8000 });
  if (!(await page.evaluate(() => location.search.includes('next=%2Feditors%2F')))) throw new Error('next missing');
});

await check('Private pages redirect to sign-in', async () => {
  await page.goto(`${BASE}/wallet`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => location.pathname === '/sign-in', { timeout: 8000 });
});

await check('Wrong password is refused politely', async () => {
  await page.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle0' });
  await page.type('#email', 'client@editme.local');
  await page.type('#password', 'wrong-pass-1');
  await clickText('Sign in', 'button');
  await seeText('Wrong email or password.');
});

// ── Client ──
await check('Client signs in and returns to the page they wanted', async () => {
  await page.goto(`${BASE}/sign-in?next=%2Fprojects`, { waitUntil: 'networkidle0' });
  await page.type('#email', 'client@editme.local');
  await page.type('#password', 'editme-local-1');
  await clickText('Sign in', 'button');
  await page.waitForFunction(() => location.pathname === '/projects', { timeout: 10000 });
  await seeText('Product launch video');
  await seeText('Social cutdowns');
  await shot('03-projects-client');
});

await check('Open redirect is blocked (next=//evil.example)', async () => {
  await page.goto(`${BASE}/sign-in?next=%2F%2Fevil.example`, { waitUntil: 'networkidle0' });
  await wait(800);
  const url = page.url();
  if (!url.startsWith(BASE)) throw new Error(`left the site: ${url}`);
});

await check('Client hires an editor and pays into escrow (test payments)', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  const card = await page.waitForSelector('::-p-xpath(//h3[text()="Omar Haddad"]/ancestor::div[contains(@class,"group")])');
  const btn = await card.$('::-p-text(Hire Now)');
  await btn.click();
  await seeText('Hire Omar Haddad');
  await clickText('Continue', 'button');
  await page.type('#hire-title', 'Mascot animation');
  await page.type('#hire-desc', 'A 10-second looping mascot animation.');
  await clickText('Next', 'button');
  await seeText('Held in escrow');
  await shot('04-hire-review');
  await clickText('Pay into escrow', 'button');
  await seeText('Funds secured');
  await clickText('View project', 'button');
  await page.waitForFunction(() => location.pathname === '/projects', { timeout: 8000 });
  await seeText('Mascot animation');
});

await check('Client approves a delivery (editor is paid)', async () => {
  await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle0' });
  const card = await page.waitForSelector('::-p-xpath(//*[@data-slot="card-title" and contains(.,"Social cutdowns")]/ancestor::*[@data-slot="card"][1])');
  await (await card.$('::-p-text(Approve and pay)')).click();
  await seeText('Approve and release payment?');
  await clickText('Approve and pay', '[role=dialog] button');
  await seeText('Approved. The editor has been paid.');
});

await check('Client leaves a review', async () => {
  await wait(800);
  const card = await page.waitForSelector('::-p-xpath(//*[@data-slot="card-title" and contains(.,"Social cutdowns")]/ancestor::*[@data-slot="card"][1])');
  await (await card.$('::-p-text(Leave a review)')).click();
  await page.click('[aria-label="4 stars"]');
  await page.type('textarea', 'Quick and tidy cuts.');
  await clickText('Post review', '[role=dialog] button');
  await seeText('Thanks for your review');
});

await check('Project details show the history', async () => {
  const card = await page.waitForSelector('::-p-xpath(//*[@data-slot="card-title" and contains(.,"Product launch video")]/ancestor::*[@data-slot="card"][1])');
  await (await card.$('::-p-text(Details)')).click();
  await seeText('History');
  await seeText('Approved, payment released');
  await shot('05-project-details');
  await page.keyboard.press('Escape'); await wait(700);
});

await check('Client cancels an unpaid project', async () => {
  const card = await page.waitForSelector('::-p-xpath(//*[@data-slot="card-title" and contains(.,"Logo animation")]/ancestor::*[@data-slot="card"][1])');
  await (await card.$('::-p-text(Details)')).click();
  await clickText('Cancel', '[role=dialog] button');
  await seeText('Cancel this project?');
  await clickText('Cancel project', 'button');
  await seeText('Project cancelled');
});

await check('Chat: send a message', async () => {
  await page.goto(`${BASE}/chat`, { waitUntil: 'networkidle0' });
  await clickText('Music video grade');
  await page.waitForSelector('input[aria-label="Message"]');
  await page.waitForFunction(() => document.querySelector('[aria-live=polite]')?.innerText.includes('Sending a first look tonight.'));
  if (await page.evaluate(() => [...document.querySelectorAll('h3')].filter((h) => h.textContent === 'Sara Lind').length) !== 1)
    throw new Error('the cancelled unpaid project still has a chat');
  await page.type('input[aria-label="Message"]', 'Looking forward to it!');
  await page.click('button[aria-label="Send"]');
  await seeText('Looking forward to it!');
  await shot('06-chat');
});

await check('Wallet shows escrow and transactions', async () => {
  await page.goto(`${BASE}/wallet`, { waitUntil: 'networkidle0' });
  await seeText('In escrow for your projects');
  await seeText('Funds secured');
  await shot('07-wallet-client');
});

await check('Analytics renders charts from real data', async () => {
  await page.goto(`${BASE}/analytics`, { waitUntil: 'networkidle0' });
  await seeText('Projects by status');
  await page.waitForSelector('.recharts-surface');
  await shot('08-analytics-client');
});

await check('Profile (client) shows hired editors and reviews', async () => {
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle0' });
  await seeText('Editors hired');
  await clickText('editors', 'button[role=tab]');
  await seeText('Ama Owusu');
  await clickText('reviews', 'button[role=tab]');
  await seeText('Quick and tidy cuts.');
  await shot('09-profile-client');
});

await check('Settings: change the name', async () => {
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle0' });
  const input = await page.waitForSelector('#settings-name');
  await input.click();
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await input.type('Tech Corp Kenya');
  if ((await input.evaluate((el) => el.value)) !== 'Tech Corp Kenya') throw new Error('name field not replaced');
  await clickText('Save changes', 'button');
  await seeText('Saved'); await wait(300);
  await seeText('Tech Corp Kenya');
  await shot('10-settings');
});

await check('Save editors and see them on the Saved page', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.click('button[aria-label="Save Ama Owusu"]');
  await seeText('Saved Ama Owusu');
  await page.click('button[aria-label="Save Leo Park"]');
  await seeText('Saved Leo Park');
  const badge = await page.$eval('nav a[href="/saved"]', (a) => a.textContent);
  if (!badge.includes('2')) throw new Error(`sidebar: ${badge}`);
  await page.click('nav a[href="/saved"]');
  await seeText('Saved editors');
  await seeText('Leo Park');
  await shot('20-saved');
  await page.click('button[aria-label="Remove Leo Park from saved"]');
  await wait(600);
  const names = await page.evaluate(() => [...document.querySelectorAll('main h3')].map((h) => h.textContent));
  if (names.join() !== 'Ama Owusu') throw new Error(names.join());
  await page.reload({ waitUntil: 'networkidle0' });
  await seeText('Ama Owusu');
  if (await bodyHas('Leo Park')) throw new Error('un-save did not stick');
});

await check('Notifications page: list and mark all read', async () => {
  await page.click('nav a[href="/notifications"]');
  await seeText('unread');
  await shot('21-notifications-page');
  await clickText('Mark all read', 'button');
  await seeText('All caught up');
});

await check('Notifications bell lists project updates', async () => {
  await page.click('button[aria-label^="Notifications"]');
  await seeText('Notifications');
  await shot('11-notifications');
  await page.keyboard.press('Escape'); await wait(700);
  await signOut();
});

// ── Editor ──
await check('Editor accepts the new project', async () => {
  await signIn('omar@editme.local');
  await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle0' });
  await seeText('Mascot animation');
  await clickText('Accept project', 'button');
  await clickText('Accept', '[role=dialog] button');
  await seeText('Project accepted'); await wait(800);
});

await check('Editor delivers with a note', async () => {
  await wait(800);
  await clickText('Deliver work', 'button');
  await page.type('[role=dialog] textarea', 'Here it is: https://example.com/mascot.mp4');
  await clickText('Deliver', '[role=dialog] button');
  await seeText('Delivered. The client has been notified.');
  await shot('12-projects-editor');
});

await check('Editor profile: portfolio link, packages', async () => {
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle0' });
  await seeText('Add your first piece');
  await clickText('Add work', 'button');
  await page.type('#pf-url', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  await page.type('#pf-title', 'Bunny loop');
  await clickText('Add to portfolio', 'button');
  await seeText('is on your portfolio'); await wait(800);
  await clickText('services', 'button[role=tab]');
  await seeText('Edit package');
  await shot('13-profile-editor');
});

await check('Editor wallet: earnings not yet, withdraw disabled', async () => {
  await page.goto(`${BASE}/wallet`, { waitUntil: 'networkidle0' });
  await seeText('Available to withdraw');
  await seeText('Coming to you');
});

await check('Ama (paid) can withdraw', async () => {
  await signOut();
  await signIn('ama@editme.local');
  await page.goto(`${BASE}/wallet`, { waitUntil: 'networkidle0' });
  await clickText('Withdraw', 'button');
  await clickText('Withdraw everything');
  await clickText('Withdraw $', '[role=dialog] button');
  await seeText('requested'); await wait(800);
  await shot('14-wallet-editor');
});

await check('Sign up form validates the password', async () => {
  await signOut();
  await page.goto(`${BASE}/sign-up`, { waitUntil: 'networkidle0' });
  await page.type('#password', 'short');
  await seeText('Use at least 8 characters');
  await shot('15-sign-up');
});

await check('Mobile width: Discover has no sideways scroll', async () => {
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await seeText('Ama Owusu');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await shot('16-mobile-discover');
  if (overflow > 1) throw new Error(`page is ${overflow}px wider than the screen`);
});

await check('Mobile: filters open in a side panel', async () => {
  await clickText('Filters', 'main button');
  await seeText('Show results');
  await clickText('Motion Designer', '[role=dialog] button');
  await shot('22-mobile-filters');
  await clickText('Show results', 'button');
  await wait(700);
  const names = await page.evaluate(() => [...document.querySelectorAll('main h3')].map((h) => h.textContent));
  if (names.join() !== 'Sara Lind') throw new Error(names.join());
});

await browser.close();
console.log(`\nALL ${passed.length} UI CHECKS PASSED`);
console.log(problems.length ? '\nProblems seen:\n' + [...new Set(problems)].join('\n') : '\nNo console errors or failed requests.');
