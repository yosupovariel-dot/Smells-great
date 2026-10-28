// Data layer. Currently backed by browser storage (demo / preview mode).
// Every function here maps 1:1 to a future server API endpoint — swap the bodies for fetch() calls
// when hosting is connected. Never trust the client for prices/roles in production: the server must re-validate.
import { SEED_PRODUCTS } from './data.js';
import { uid, monthKey, FREE_SHIP, SHIP_COST } from './util.js';

const K = (k) => 'say2_' + k;
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
export const ROLES = ['customer', 'wholesale', 'courier', 'orders', 'admin'];
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
  const allowed = ['name', 'phone', 'role', 'blocked', 'wsRequest', 'club', 'biz'];
  for (const k of allowed) if (k in patch) u[k] = patch[k];
  if (patch.role && !ROLES.includes(patch.role)) u.role = 'customer';
  saveUsers(l);
}
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
  const staff = [
    ['מנהל ראשי', 'admin@say-boutique.co.il', 'admin'],
    ['מנהל הזמנות', 'orders@say-boutique.co.il', 'orders'],
    ['שליח', 'courier@say-boutique.co.il', 'courier'],
  ];
  const l = users();
  for (const [name, email, role] of staff) {
    if (l.some((u) => u.email === email)) continue;
    const { salt, hash } = await hashPw('Say2026!demo');
    l.push({ id: uid('u_'), name, email, phone: '0523233310', role, club: false, blocked: false, mustChange: true, createdAt: Date.now(), salt, hash });
  }
  saveUsers(l);
  // Historical orders across the last 12 months so reports have data.
  const prods = products().filter((p) => !p.quote && p.sizes[0].price); const names = ['דנה כהן', 'יוסי לוי', 'מיכל אברהם', 'אבי מזרחי', 'רונית פרץ', 'עומר ביטון', 'נועה דהן', 'איתי שלום'];
  const cities = ['תל אביב', 'רמת גן', 'חולון', 'ראשון לציון', 'פתח תקווה', 'הרצליה', 'נתניה', 'ירושלים'];
  const courier = l.find((u) => u.role === 'courier');
  const ol = []; let num = 1000; const now = new Date();
  for (let m = 11; m >= 0; m--) {
    const count = 8 + Math.round((11 - m) * 1.6 + Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1 + Math.floor(Math.random() * 27), 9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));
      if (d > now) continue;
      const items = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => {
        const p = prods[Math.floor(Math.random() * prods.length)]; const s = p.sizes[Math.floor(Math.random() * p.sizes.length)];
        return { pid: p.id, name: p.name, size: s.label, qty: 1 + Math.floor(Math.random() * 2), price: s.price, cost: s.cost || 0 };
      });
      const subtotal = items.reduce((a, x) => a + x.price * x.qty, 0); const shipping = subtotal >= FREE_SHIP ? 0 : SHIP_COST;
      const age = now - d; const status = age < 864e5 ? 'new' : age < 2 * 864e5 ? 'processing' : age < 3 * 864e5 ? (Math.random() > .5 ? 'ready' : 'shipped') : Math.random() > .04 ? 'delivered' : 'cancelled';
      const n = names[Math.floor(Math.random() * names.length)];
      ol.push({ id: uid('o_'), num: ++num, date: +d, status, payment: status === 'cancelled' ? 'refunded' : 'paid', userId: null, courierId: courier?.id,
        customer: { name: n, phone: '05' + Math.floor(20000000 + Math.random() * 79999999), email: 'demo@example.com', city: cities[Math.floor(Math.random() * cities.length)], street: 'הרצל ' + (1 + Math.floor(Math.random() * 120)), apt: '', notes: '' },
        items, subtotal, discount: 0, shipping, total: subtotal + shipping, history: [{ s: status, at: +d }], demo: true });
    }
  }
  saveOrders(ol.sort((a, b) => b.date - a.date));
  write('seeded', true);
}
export function resetDemo() { for (const k of ['products', 'users', 'orders', 'seeded', 'notify', 'cart', 'lock', 'club']) try { localStorage.removeItem(K(k)); } catch {} }
export { monthKey };
