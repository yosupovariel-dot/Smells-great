// Data layer. Currently backed by browser storage (demo / preview mode).
// Every function here maps 1:1 to a future server API endpoint — swap the bodies for fetch() calls
// when hosting is connected. Never trust the client for prices/roles in production: the server must re-validate.
import { SEED_PRODUCTS } from './data.js?v=261031164042';
import { uid, monthKey, FREE_SHIP, SHIP_COST } from './util.js?v=261031164042';

const K = (k) => 'say8_' + k;
const read = (k, d) => { try { const v = localStorage.getItem(K(k)); return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(K(k), JSON.stringify(v)); } catch {} };

// ---------- Crypto (PBKDF2-SHA256, 210k iterations, per-user salt) ----------
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
async function hashPw(pw, saltB64) {
  const salt = saltB64 ? Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210000 }, key, 256);
  return { salt: b64(salt), hash: b64(bits) };
}
const safeEq = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };

// ---------- Products ----------
export let SITE = { site: {}, subs: {}, guide: '' };
export async function loadCatalog() {
  try { const r = await fetch('data/site.json'); if (r.ok) SITE = await r.json(); } catch {}
  if (read('products', null)) return;
  let list = SEED_PRODUCTS;
  try {
    const r = await fetch('data/products.json');
    if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j.length) list = j; }
  } catch {}
  write('products', list);
}
export const products = () => read('products', SEED_PRODUCTS);
export const product = (id) => products().find((p) => p.id === id);
export const saveProduct = (p) => { const l = products(); const i = l.findIndex((x) => x.id === p.id); i >= 0 ? (l[i] = p) : l.unshift(p); write('products', l); };
export const deleteProduct = (id) => write('products', products().filter((p) => p.id !== id));

// ---------- Users & auth ----------
export const ROLES = ['customer', 'wholesale', 'courier', 'orders', 'products', 'admin'];
export const STAFF_ROLES = ['admin', 'products', 'orders', 'courier'];
export const users = () => read('users', []);
const saveUsers = (l) => write('users', l);
export const publicUser = (u) => u && (({ salt, hash, ...rest }) => rest)(u);

export async function register({ name, email, phone, password, wholesale, biz, newsletter }) {
  const l = users(); email = email.toLowerCase().trim();
  if (l.some((u) => u.email === email)) throw new Error('exists');
  const { salt, hash } = await hashPw(password);
  const u = { id: uid('u_'), name, email, phone, role: 'customer', wsRequest: !!wholesale, biz: biz || '', newsletter: !!newsletter, club: true, blocked: false, firstOrderDiscount: true, createdAt: Date.now(), salt, hash };
  l.push(u); saveUsers(l); setSession(u.id); return publicUser(u);
}

const ATTEMPTS = 5, LOCK_MS = 5 * 60 * 1000;
export async function login(email, password) {
  email = email.toLowerCase().trim();
  const lock = read('lock', {});
  const rec = lock[email] || { n: 0, until: 0 };
  if (rec.until > Date.now()) throw new Error('locked');
  const u = users().find((x) => x.email === email);
  // Always run the hash to keep timing uniform.
  const h = await hashPw(password, u?.salt || 'AAAAAAAAAAAAAAAAAAAAAA==');
  if (!u || u.blocked || !safeEq(h.hash, u.hash)) {
    rec.n++; if (rec.n >= ATTEMPTS) { rec.until = Date.now() + LOCK_MS; rec.n = 0; }
    lock[email] = rec; write('lock', lock); throw new Error('fail');
  }
  delete lock[email]; write('lock', lock);
  setSession(u.id); return publicUser(u);
}
export async function changePassword(id, pw) {
  const l = users(); const u = l.find((x) => x.id === id); if (!u) return;
  Object.assign(u, await hashPw(pw), { mustChange: false }); saveUsers(l);
}
const SESSION_TTL = 8 * 3600 * 1000;
function setSession(id) { try { sessionStorage.setItem(K('sess'), JSON.stringify({ id, exp: Date.now() + SESSION_TTL })); } catch {} }
export function logout() { try { sessionStorage.removeItem(K('sess')); } catch {} }
export function me() {
  try {
    const s = JSON.parse(sessionStorage.getItem(K('sess')) || 'null');
    if (!s || s.exp < Date.now()) return null;
    const u = users().find((x) => x.id === s.id);
    return u && !u.blocked ? publicUser(u) : null;
  } catch { return null; }
}
export const can = (role) => { const u = me(); if (!u) return false; if (u.role === 'admin') return true; return Array.isArray(role) ? role.includes(u.role) : u.role === role; };
export function updateUser(id, patch) {
  const l = users(); const u = l.find((x) => x.id === id); if (!u) return;
  const allowed = ['name', 'phone', 'role', 'blocked', 'wsRequest', 'club', 'biz', 'note', 'newsletter'];
  if (patch.email) { const e = String(patch.email).toLowerCase().trim(); if (!l.some((x) => x.email === e && x.id !== id)) u.email = e; }
  for (const k of allowed) if (k in patch) u[k] = patch[k];
  if (patch.role && !ROLES.includes(patch.role)) u.role = 'customer';
  saveUsers(l);
}
export async function addStaff({ name, email, phone, role, password }) {
  const l = users(); email = email.toLowerCase().trim();
  if (l.some((u) => u.email === email)) throw new Error('exists');
  if (!STAFF_ROLES.includes(role)) throw new Error('role');
  const { salt, hash } = await hashPw(password);
  l.push({ id: uid('u_'), name, email, phone, role, club: false, blocked: false, mustChange: false, createdAt: Date.now(), salt, hash }); saveUsers(l);
}
export async function setPassword(id, pw) { const l = users(); const u = l.find((x) => x.id === id); if (!u) return; Object.assign(u, await hashPw(pw), { mustChange: false }); saveUsers(l); }
export const deleteUser = (id) => saveUsers(users().filter((u) => u.id !== id));

// ---------- Newsletter / club signups ----------
export function joinClub(email) { const l = read('club', []); if (!l.includes(email)) l.push(email); write('club', l); }
export const clubList = () => read('club', []);

// ---------- Cart ----------
export const cart = () => read('cart', []);
export const saveCart = (c) => { write('cart', c); document.dispatchEvent(new CustomEvent('cart')); };
export function addToCart(pid, size, qty = 1, opt = '') {
  const c = cart(); const l = c.find((x) => x.pid === pid && x.size === size && (x.opt || '') === opt);
  l ? (l.qty = Math.min(99, l.qty + qty)) : c.push({ pid, size, qty, opt });
  saveCart(c);
}
export function priceOf(p, sizeLabel, user = me()) {
  const s = p.sizes.find((x) => x.label === sizeLabel) || p.sizes[0];
  return user?.role === 'wholesale' && s.wholesale ? s.wholesale : s.price;
}
export function cartTotals(user = me()) {
  const lines = cart().map((l) => { const p = product(l.pid); return p ? { ...l, p, price: priceOf(p, l.size, user) } : null; }).filter(Boolean);
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const discount = user && user.firstOrderDiscount && user.role !== 'wholesale' ? Math.round(subtotal * 0.1) : 0;
  const shipping = !lines.length || subtotal - discount >= FREE_SHIP ? 0 : SHIP_COST;
  return { lines, subtotal, discount, shipping, total: subtotal - discount + shipping };
}

// ---------- Orders ----------
export const STATUSES = ['new', 'processing', 'ready', 'shipped', 'delivered', 'cancelled'];
export const orders = () => read('orders', []);
const saveOrders = (l) => write('orders', l);
export function placeOrder(customer) {
  const u = me(); const tt = cartTotals(u);
  if (!tt.lines.length) throw new Error('empty');
  const l = orders();
  const num = 1000 + l.length + 1;
  const o = {
    id: uid('o_'), num, date: Date.now(), status: 'new', payment: 'pending', userId: u?.id || null, customer,
    items: tt.lines.map((x) => ({ pid: x.pid, name: x.p.name, size: x.size, opt: x.opt || '', qty: x.qty, price: x.price, cost: (x.p.sizes.find((s) => s.label === x.size) || {}).cost || 0 })),
    subtotal: tt.subtotal, discount: tt.discount, shipping: tt.shipping, total: tt.total, history: [{ s: 'new', at: Date.now() }],
  };
  l.unshift(o); saveOrders(l);
  if (u && tt.discount) { const all = users(); const x = all.find((y) => y.id === u.id); if (x) { x.firstOrderDiscount = false; saveUsers(all); } }
  saveCart([]);
  const notes = read('notify', []); notes.unshift({ id: o.id, num, at: Date.now(), read: false }); write('notify', notes.slice(0, 100));
  return o;
}
export function setOrderStatus(id, status, by) {
  if (!STATUSES.includes(status)) return;
  const l = orders(); const o = l.find((x) => x.id === id); if (!o) return;
  o.status = status; o.history.push({ s: status, at: Date.now(), by: by || '' }); saveOrders(l);
}
export function assignCourier(id, courierId) { const l = orders(); const o = l.find((x) => x.id === id); if (o) { o.courierId = courierId; saveOrders(l); } }
export const notifications = () => read('notify', []);
export const markNotesRead = () => write('notify', notifications().map((n) => ({ ...n, read: true })));

// ---------- Demo seed (preview only) ----------
export async function seedDemo() {
  if (read('seeded', false)) return;
  // Demo staff for the client preview — simple usernames, password 1234.
  const staff = [
    ['מנהל', 'admin', 'admin'],
    ['אחראי הזמנות', 'orders', 'orders'],
    ['אחראי מוצרים', 'products', 'products'],
    ['שליח', 'courier', 'courier'],
  ];
  const l = users().filter((u) => !STAFF_ROLES.includes(u.role));
  for (const [name, email, role] of staff) {
    const { salt, hash } = await hashPw('1234');
    l.push({ id: uid('u_'), name, email, phone: '0523233310', role, club: false, blocked: false, mustChange: false, createdAt: Date.now(), salt, hash });
  }
  saveUsers(l);
  // A simulated first year of trading (deterministic, so every viewer sees the same store).
  let seed = 20251028;
  const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const weighted = (a) => { const tot = a.reduce((x, y) => x + y.w, 0); let r = rnd() * tot; for (const x of a) if ((r -= x.w) < 0) return x; return a[0]; };
  const now = new Date(); const DAY = 864e5;
  const first = ['דנה', 'יוסי', 'מיכל', 'אבי', 'רונית', 'עומר', 'נועה', 'איתי', 'שירה', 'אלון', 'הילה', 'רועי', 'מורן', 'גיל', 'ליאת', 'עידו', 'קרן', 'משה', 'אורית', 'דניאל', 'יעל', 'אריאל', 'סיון', 'נדב', 'טל', 'אסף', 'רחל', 'שמעון', 'אפרת', 'יונתן', 'חן', 'ברק', 'ענבל', 'אליהו', 'מאיה', 'שלומי'];
  const last = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'דהן', 'אברהם', 'פרידמן', 'שלום', 'אזולאי', 'יוסף', 'חדד', 'גבאי', 'עמר', 'אוחיון', 'בן דוד', 'קליין', 'רוזן', 'שפירא', 'אלמוג', 'נחום', 'סויסה', 'טל', 'ברגר'];
  const cities = [['תל אביב', 14], ['רמת גן', 7], ['ראשון לציון', 8], ['חולון', 6], ['פתח תקווה', 7], ['הרצליה', 5], ['נתניה', 6], ['ירושלים', 8], ['חיפה', 6], ['באר שבע', 4], ['רעננה', 4], ['מודיעין', 4], ['אשדוד', 5], ['כפר סבא', 4], ['בת ים', 3], ['רחובות', 4]].map(([c, w]) => ({ c, w }));
  const streets = ['הרצל', 'ויצמן', 'ז׳בוטינסקי', 'בן גוריון', 'רוטשילד', 'העצמאות', 'הנביאים', 'סוקולוב', 'אחד העם', 'ביאליק', 'הגפן', 'התאנה', 'הדקל', 'ההגנה', 'יגאל אלון', 'אבן גבירול'];
  const biz = ['מלון בוטיק הים', 'קליניקת אסתטיקה גלואו', 'משרדי עו״ד לוינסון', 'ספא אורן', 'חנות עיצוב Nordic', 'אולם אירועים גני הדר', 'משרדי הייטק Pixelo', 'מספרת סטודיו 54'];
  const courier = l.find((u) => u.role === 'courier');
  // Customers who joined over the year (preview accounts — no password, cannot sign in).
  const cust = [];
  for (let i = 0; i < 230; i++) {
    const daysAgo = Math.floor(Math.pow(rnd(), 0.75) * 360);
    const f = pick(first), ln = pick(last), ws = i < biz.length;
    cust.push({ id: 'u_demo' + i, name: ws ? biz[i] : `${f} ${ln}`, email: `client${i + 1}@example.com`, phone: '05' + String(Math.floor(20000000 + rnd() * 79999999)),
      role: ws ? 'wholesale' : 'customer', biz: ws ? biz[i] : '', wsRequest: !ws && i < biz.length + 3, club: true, newsletter: rnd() > .35, blocked: false,
      firstOrderDiscount: false, createdAt: +now - daysAgo * DAY - Math.floor(rnd() * DAY), salt: '', hash: '', demo: true, city: weighted(cities).c });
  }
  saveUsers([...l, ...cust]);
  write('club', Array.from({ length: 140 }, (_, i) => `subscriber${i + 1}@example.com`));
  // Product popularity
  const prods = products().filter((p) => !p.quote && p.sizes[0].price);
  const pop = { 'say-150': 9, 'say-car': 8, 'say-100': 6, 'say-room-office': 6, 'say-300': 3, 'kit-14': 10, 'kit-4': 7, 'oil-king-david': 6, 'oil-luxury-hotel': 6, 'oil-white-tea': 6, 'oil-hilton': 5, 'oil-royal-beach': 5, 'oil-bleu-chanel': 5, 'oil-pure-vanilla': 4, 'oil-sea-breeze': 4, 'oil-tom-ford': 4, 'oil-dior-sauvage': 4, 'oil-zara': 3 };
  const pool = prods.map((p) => ({ p, w: pop[p.id] || (p.cat === 'oils' ? 1.6 : 2) }));
  const oilSizes = (ws) => (ws ? [{ i: 4, w: 3 }, { i: 5, w: 4 }, { i: 6, w: 2 }] : [{ i: 0, w: 1 }, { i: 1, w: 2 }, { i: 2, w: 6 }, { i: 3, w: 4 }, { i: 4, w: 2 }, { i: 5, w: 1 }]);
  const oilNames = prods.filter((p) => p.cat === 'oils' && !p.picks).map((p) => p.name.he);
  const ol = []; let num = 1000;
  for (let m = 11; m >= 0; m--) {
    const mDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const month = mDate.getMonth();
    const season = { 10: 1.3, 11: 1.5, 0: .85, 1: .95, 8: 1.05, 9: 1.15, 3: 1.15 }[month] || 1; // Nov–Dec gifting, Tishrei holidays, Pesach
    const count = Math.round((30 + (11 - m) * 9) * season * (0.9 + rnd() * .2));
    const daysIn = new Date(mDate.getFullYear(), month + 1, 0).getDate();
    for (let i = 0; i < count; i++) {
      const d = new Date(mDate.getFullYear(), month, 1 + Math.floor(rnd() * daysIn), 8 + Math.floor(rnd() * 15), Math.floor(rnd() * 60));
      if (d > now) continue;
      const eligible = cust.filter((c) => c.createdAt <= +d);
      const c = eligible.length && rnd() > .3 ? pick(eligible) : null;
      const ws = c?.role === 'wholesale';
      const items = [];
      const nItems = ws ? 2 + Math.floor(rnd() * 4) : 1 + Math.floor(rnd() * rnd() * 4);
      for (let k = 0; k < nItems; k++) {
        const p = weighted(pool).p;
        const si = p.cat === 'oils' && !p.picks ? weighted(oilSizes(ws)).i : 0;
        const s = p.sizes[Math.min(si, p.sizes.length - 1)];
        let opt = '';
        if (p.options?.length) opt = pick(p.options[0].values).he;
        if (p.picks) opt = rnd() > .3 ? Array.from({ length: p.picks }, () => pick(oilNames)).filter((v, j, a) => a.indexOf(v) === j).join(', ') : 'הפתיעו אותי';
        const qty = ws ? 2 + Math.floor(rnd() * 6) : rnd() > .85 ? 2 : 1;
        const price = ws && s.wholesale ? s.wholesale : s.price;
        const ex = items.find((x) => x.pid === p.id && x.size === s.label && x.opt === opt);
        ex ? (ex.qty += qty) : items.push({ pid: p.id, name: p.name, size: s.label, opt, qty, price, cost: s.cost || 0 });
      }
      const subtotal = items.reduce((a, x) => a + x.price * x.qty, 0);
      const discount = c && !ws && Math.abs(+d - c.createdAt) < 3 * DAY ? Math.round(subtotal * .1) : 0;
      const shipping = subtotal - discount >= FREE_SHIP ? 0 : SHIP_COST;
      const age = now - d;
      const status = age < .6 * DAY ? 'new' : age < 1.5 * DAY ? 'processing' : age < 2.5 * DAY ? 'ready' : age < 3.5 * DAY ? 'shipped' : rnd() > .03 ? 'delivered' : 'cancelled';
      const hist = [{ s: 'new', at: +d }];
      const steps = ['processing', 'ready', 'shipped', 'delivered'];
      for (let k = 0; k < steps.indexOf(status) + 1; k++) hist.push({ s: steps[k], at: +d + (k + 1) * (0.5 + rnd()) * DAY * .8 });
      if (status === 'cancelled') hist.push({ s: 'cancelled', at: +d + DAY * rnd() });
      const name = c ? c.name : `${pick(first)} ${pick(last)}`;
      ol.push({ id: uid('o_'), num: 0, date: +d, status, payment: status === 'cancelled' ? 'refunded' : 'paid', userId: c?.id || null, courierId: courier?.id,
        customer: { name, phone: c?.phone || '05' + String(Math.floor(20000000 + rnd() * 79999999)), email: c?.email || `guest${num}@example.com`, city: c?.city || weighted(cities).c,
          street: `${pick(streets)} ${1 + Math.floor(rnd() * 140)}`, apt: rnd() > .5 ? `דירה ${1 + Math.floor(rnd() * 30)}` : '', notes: rnd() > .85 ? pick(['להשאיר ליד הדלת', 'להתקשר לפני הגעה', 'קומה 3 ללא מעלית', 'מתנה — בלי חשבונית בחבילה']) : '' },
        items, subtotal, discount, shipping, total: subtotal - discount + shipping, history: hist, demo: true });
    }
  }
  ol.sort((a, b) => a.date - b.date).forEach((o) => (o.num = ++num));
  saveOrders(ol.reverse());
  write('notify', ol.filter((o) => o.status === 'new').map((o) => ({ id: o.id, num: o.num, at: o.date, read: false })));
  // Stock levels that reflect a year of sales
  const sold = {}; ol.forEach((o) => o.items.forEach((it) => (sold[it.pid] = (sold[it.pid] || 0) + it.qty)));
  write('products', products().map((p) => (p.quote ? p : { ...p, stock: Math.max(0, Math.round((p.cat === 'diffusers' ? 60 : 140) - (sold[p.id] || 0) * .18 + rnd() * 20)) })));
  write('seeded', true);
}
export function resetDemo() { for (const k of ['products', 'users', 'orders', 'seeded', 'notify', 'cart', 'lock', 'club']) try { localStorage.removeItem(K(k)); } catch {} }
// Remove simulated customers/orders but keep staff and the catalog (use before going live).
export function clearDemoData() {
  saveUsers(users().filter((u) => !u.demo)); saveOrders(orders().filter((o) => !o.demo));
  write('notify', []); write('club', []); write('seeded', true);
}
export { monthKey };
