// Safe HTML templating: every interpolated value is escaped unless wrapped in raw().
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"'`]/g, (c) => ESC[c]);

class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(s);
const fmt = (v) => (v instanceof Raw ? v.s : Array.isArray(v) ? v.map(fmt).join('') : v === false || v == null ? '' : esc(v));
export const html = (strings, ...vals) => raw(strings.reduce((a, s, i) => a + s + (i < vals.length ? fmt(vals[i]) : ''), ''));
export const render = (el, tpl) => { el.innerHTML = tpl instanceof Raw ? tpl.s : esc(tpl); };

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const PHONE = '0523233310';
export const PHONE_INTL = '972523233310';
export const PHONE_DISPLAY = '052-323-3310';
export const FREE_SHIP = 299;
export const SHIP_COST = 29;

export const money = (n, lang = 'he') =>
  new Intl.NumberFormat(lang === 'he' ? 'he-IL' : 'en-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

export const uid = (p = '') => p + crypto.getRandomValues(new Uint32Array(2)).reduce((a, n) => a + n.toString(36), '');

export const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// Validation
export const valid = {
  email: (s) => /^[^\s@<>]{1,64}@[^\s@<>]{1,255}\.[a-z]{2,}$/i.test(String(s).trim()),
  phone: (s) => /^0\d{8,9}$/.test(String(s).replace(/[\s-]/g, '')),
  name: (s) => String(s).trim().length >= 2 && String(s).length <= 80,
  password: (s) => String(s).length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s),
};
export const clean = (s, max = 200) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

export function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 3200);
}

// Trap focus inside a dialog element; returns release fn.
export function trapFocus(el, onEsc) {
  const prev = document.activeElement;
  const sel = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  const key = (e) => {
    if (e.key === 'Escape') { onEsc?.(); return; }
    if (e.key !== 'Tab') return;
    const f = $$(sel, el).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  };
  el.addEventListener('keydown', key);
  setTimeout(() => $(sel, el)?.focus(), 30);
  return () => { el.removeEventListener('keydown', key); prev?.focus?.(); };
}

export const monthKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; };
export const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);
