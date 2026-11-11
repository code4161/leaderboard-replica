// Shared harness: one browser context per site, both fed the SAME recorded network responses,
// so any difference in what is rendered is a difference in the code, never in the data.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
export const ORIGINAL = process.env.ORIGINAL || 'https://predicting.top';
export const REPLICA = process.env.REPLICA || 'http://localhost:4173';
export const OUT = 'evals/out';
const FIX = path.join(OUT, 'fixtures');
fs.mkdirSync(FIX, { recursive: true });
const mem = new Map();
const BLOCK = /googletagmanager|google-analytics|posthog|replit\.com|doubleclick/;

// One still, transparent pixel. An animated GIF shows a different frame at each screenshot, on both sites,
// so the harness serves this in its place to both (declared waiver W2).
const STILL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const still = (hit) => (hit.body.length > 6 && hit.body.subarray(0, 4).toString('latin1') === 'GIF8' && hit.body.includes(Buffer.from('NETSCAPE2.0')) ? { ...hit, body: STILL, contentType: 'image/gif' } : hit);

// Both sites ask for the same resource at the same moment, so the in-flight promise is shared, not only the result.
function recorded(key, url) {
  if (!mem.has(key)) mem.set(key, load(key, url));
  return mem.get(key);
}
async function load(key, url) {
  const file = path.join(FIX, crypto.createHash('sha1').update(key).digest('hex'));
  let hit;
  if (fs.existsSync(file + '.json') && fs.existsSync(file + '.bin')) {
    const meta = JSON.parse(fs.readFileSync(file + '.json', 'utf8'));
    hit = { ...meta, body: fs.readFileSync(file + '.bin') };
  } else {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 replica-evals' }, signal: AbortSignal.timeout(40000) });
      hit = { status: r.status, contentType: r.headers.get('content-type') || 'application/octet-stream', body: Buffer.from(await r.arrayBuffer()) };
    } catch { hit = { status: 504, contentType: 'text/plain', body: Buffer.from('') }; }
    fs.writeFileSync(file + '.bin', hit.body);
    fs.writeFileSync(file + '.json', JSON.stringify({ key, status: hit.status, contentType: hit.contentType }));
  }
  return still(hit);
}

export async function openSite(browser, origin, viewport, { theme = 'dark' } = {}) {
  const ctx = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: 'reduce', timezoneId: 'UTC', locale: 'en-US' });
  await ctx.route('**/*', async (route) => {
    const req = route.request(); const u = new URL(req.url());
    if (BLOCK.test(u.href)) return route.abort();
    const sameOrigin = u.origin === origin;
    if (sameOrigin && u.pathname.startsWith('/api/')) {
      if (req.method() !== 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      const hit = await recorded('api ' + u.pathname + u.search, ORIGINAL + u.pathname + u.search);
      return route.fulfill({ status: hit.status, contentType: hit.contentType, body: hit.body });
    }
    if (!sameOrigin && req.resourceType() === 'image') {
      const hit = await recorded('img ' + u.href, u.href);
      return route.fulfill({ status: hit.status, contentType: hit.contentType, body: hit.body });
    }
    return route.continue();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push(m.text()); });
  return { ctx, page, errors };
}

export async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}[data-replica-notice]{display:none!important}' }).catch(() => {});
  await page.waitForTimeout(600);
}

export async function runSteps(page, steps = []) {
  for (const s of steps) {
    const loc = s.testid ? page.getByTestId(s.testid).first() : s.text ? page.getByText(s.text, { exact: s.exact ?? true }).first() : s.css ? page.locator(s.css).first() : null;
    if (s.do === 'click') await loc.click({ timeout: 8000 });
    else if (s.do === 'fill') await loc.fill(s.value, { timeout: 8000 });
    else if (s.do === 'hover') await loc.hover({ timeout: 8000 });
    else if (s.do === 'press') await page.keyboard.press(s.key);
    else if (s.do === 'scroll') await page.evaluate((y) => window.scrollTo(0, y), s.y ?? 99999);
    else if (s.do === 'wait') await page.waitForTimeout(s.ms ?? 500);
    else throw new Error('unknown step ' + JSON.stringify(s));
    await page.waitForTimeout(250);
  }
  await settle(page);
}

// A normalised, line-per-element rendering of the page: tag, sorted classes, the attributes a user or a test can observe, own text.
export async function domLines(page) {
  return page.evaluate(() => {
    const ATTRS = ['data-testid', 'href', 'title', 'placeholder', 'alt', 'type', 'value', 'aria-label', 'role', 'disabled', 'target', 'name', 'id', 'colspan', 'style'];
    const lines = [];
    const walk = (el, depth) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style') return;
      if (el.hasAttribute('data-replica-notice')) return; // declared waiver W1: the notice is hidden for pixels and skipped here
      const inSvg = el.namespaceURI === 'http://www.w3.org/2000/svg';
      const cls = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean).filter((c) => !/^recharts-/.test(c) || true).sort().join(' ');
      const attrs = ATTRS.map((a) => {
        let v = el.getAttribute(a); if (v == null) return null;
        if (a === 'id' && (inSvg || /^(radix-|:r)/.test(v))) return null;
        if (a === 'href' || a === 'value' || a === 'style') v = v.replace(location.origin, '').replace(/\s+/g, ' ').trim();
        if (v.length > 160) v = v.slice(0, 160) + '…';
        return `${a}=${JSON.stringify(v)}`;
      }).filter(Boolean).join(' ');
      let own = '';
      for (const n of el.childNodes) if (n.nodeType === 3) own += n.textContent;
      own = own.replace(/\s+/g, ' ').trim();
      let extra = '';
      if (tag === 'img') { const s = el.getAttribute('src') || ''; extra = ' src=' + (s.startsWith('data:') ? 'data:' + s.length : s.replace(location.origin, '')); }
      if (inSvg && tag !== 'svg') {
        const g = ['d', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'width', 'height', 'fill', 'stroke', 'points', 'transform'].map((a) => { const v = el.getAttribute(a); return v == null ? null : `${a}=${v.length > 60 ? v.length + 'ch' : v}`; }).filter(Boolean).join(' ');
        extra += ' ' + g;
      }
      lines.push(`${' '.repeat(Math.min(depth, 40))}<${tag}${cls ? ' .' + cls.replace(/ /g, '.') : ''}${attrs ? ' ' + attrs : ''}${extra}>${own ? ' ' + JSON.stringify(own) : ''}`);
      for (const c of el.children) walk(c, depth + 1);
    };
    const root = document.querySelector('#root') || document.body;
    for (const c of root.children) walk(c, 0);
    return lines;
  });
}

// Geometry and computed style of every element that carries a test id (first 400), plus headings and buttons.
export async function styleProbe(page) {
  return page.evaluate(() => {
    const pick = ['fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'color', 'backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderRadius', 'paddingTop', 'paddingLeft', 'display', 'textAlign'];
    const els = [...document.querySelectorAll('[data-testid],h1,h2,h3,button,th,footer a')].slice(0, 400);
    return els.map((el, i) => {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      const o = { key: `${i}:${el.tagName.toLowerCase()}${el.dataset.testid ? '#' + el.dataset.testid : ''}`, x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
      for (const p of pick) o[p] = cs[p];
      return o;
    });
  });
}
