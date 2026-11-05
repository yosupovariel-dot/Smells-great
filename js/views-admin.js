import { html, raw, money, monthKey, pct, PHONE_INTL } from './util.js?v=261105200347';
import { L, getLang } from './i18n.js?v=261105200347';
import { CATEGORIES, scentOf, STRENGTHS, NOTES } from './data.js?v=261105200347';
import * as db from './db.js?v=261105200347';
import { media, statusLabel, small, subName } from './views-shop.js?v=261105200347';

const he = () => getLang() === 'he';
const T = (h, e) => (he() ? h : e);
const m = (n) => money(n, getLang());
const dt = (d) => new Date(d).toLocaleString(he() ? 'he-IL' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' });
const monthName = (k) => { const [y, mo] = k.split('-'); return new Date(+y, +mo - 1, 1).toLocaleDateString(he() ? 'he-IL' : 'en-GB', { month: 'short', year: '2-digit' }); };
const lastMonths = (n) => { const out = []; const d = new Date(); for (let i = n - 1; i >= 0; i--) out.push(monthKey(new Date(d.getFullYear(), d.getMonth() - i, 1))); return out; };
const svg = (d) => raw(`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`);
const ICON = {
  dash: svg('<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>'),
  prod: svg('<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>'),
  rep: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 010 7M18.5 14.8c1.6.8 2.6 2.6 3 5.2"/>'),
  orders: svg('<path d="M6 3h12l1 18H5L6 3z"/><path d="M9 7a3 3 0 006 0"/>'),
  truck: svg('<path d="M2 6h12v10H2zM14 9h4l3 3v4h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'),
  store: svg('<path d="M3 10l9-7 9 7v10a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V10z"/>'),
  out: svg('<path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l-5-5 5-5M5 12h11"/>'),
  nav: svg('<path d="M3 11l18-8-8 18-2-8-8-2z"/>'),
  phone: svg('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z"/>'),
  box: svg('<path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4M12 11v10"/>'),
  check: svg('<path d="M4 12l5 5L20 6"/>'),
  team: svg('<circle cx="12" cy="7" r="3.5"/><path d="M5 21c.8-4 3.6-6 7-6s6.2 2 7 6"/><path d="M18.5 3.5l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L15.5 5.8l2-.3z"/>'),
  bell: svg('<path d="M6 16V11a6 6 0 0112 0v5l2 2H4l2-2zM10 21h4"/>'),
};

const ICON2 = {
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  alert: svg('<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  print: svg('<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z"/>'),
  wa: svg('<path d="M4 20l1.3-4A8 8 0 1112 20a8 8 0 01-4-1.1L4 20z"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),
  arrow: svg('<path d="M15 6l-6 6 6 6"/>'),
};
const initials = (n) => String(n || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('');
const avatar = (n) => html`<span class="av" aria-hidden="true">${initials(n)}</span>`;
const roleName = (r) => ({ customer: T('לקוח פרטי', 'Retail customer'), wholesale: T('סיטונאי', 'Wholesale'), courier: T('שליח', 'Courier'), orders: T('מנהל הזמנות', 'Orders manager'), products: T('מנהל מוצרים', 'Products manager'), admin: T('מנהל ראשי', 'Admin') })[r] || r;
const ROLE_DESC = { admin: ['גישה מלאה לכל המערכת', 'Full access'], products: ['עריכת מוצרים, מחירים ומלאי', 'Products, prices & stock'], orders: ['טיפול בהזמנות ושיבוץ שליחים', 'Orders & courier assignment'], courier: ['רשימת משלוחים בנייד', 'Delivery list on mobile'] };
const ago = (ts) => { const mn = Math.max(1, Math.round((Date.now() - ts) / 6e4)); if (mn < 60) return T(`לפני ${mn} דק׳`, `${mn}m ago`); const h = Math.round(mn / 60); if (h < 24) return T(`לפני ${h} ש׳`, `${h}h ago`); const d = Math.round(h / 24); return T(`לפני ${d} ימים`, `${d}d ago`); };
const statusPill = (s) => html`<span class="pill st-${s}"><i></i>${statusLabel(s)}</span>`;
const greeting = () => { const h = new Date().getHours(); return h < 12 ? T('בוקר טוב', 'Good morning') : h < 17 ? T('צהריים טובים', 'Good afternoon') : h < 21 ? T('ערב טוב', 'Good evening') : T('לילה טוב', 'Good night'); };

function shell(active, title, body, tools = '', sub = '') {
  const u = db.me(); const role = u.role;
  const links = [
    [T('ראשי', 'Main'), [
      ['admin', '#/admin', 'dash', T('לוח בקרה', 'Dashboard'), ['admin']],
      ['orders', '#/orders', 'orders', T('הזמנות', 'Orders'), ['admin', 'orders']],
      ['courier', '#/courier', 'truck', T('משלוחים', 'Deliveries'), ['admin', 'orders', 'courier']],
    ]],
    [T('קטלוג ולקוחות', 'Catalog & people'), [
      ['admin/products', '#/admin/products', 'prod', T('מוצרים', 'Products'), ['admin', 'products']],
      ['admin/users', '#/admin/users', 'users', T('לקוחות', 'Customers'), ['admin']],
      ['admin/reviews', '#/admin/reviews', 'users', T('ביקורות', 'Reviews'), ['admin']],
      ['admin/team', '#/admin/team', 'team', T('צוות והרשאות', 'Team & roles'), ['admin']],
      ['admin/reports', '#/admin/reports', 'rep', T('דוחות', 'Reports'), ['admin']],
    ]],
  ].map(([g, l]) => [g, l.filter((x) => x[4].includes(role))]).filter(([, l]) => l.length);
  const unread = db.notifications().filter((n) => !n.read).length;
  const today = new Date().toLocaleDateString(he() ? 'he-IL' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  return html`<div class="bo">
    <nav class="bo-side" aria-label="${T('ניווט ניהול', 'Admin navigation')}">
      <a class="bo-brand" href="#/admin"><img src="assets/img/logo-wide.webp" alt="SAY Boutique" width="923" height="350"><small>Back office</small></a>
      ${links.map(([g, l]) => html`<p class="bo-group">${g}</p>${l.map(([k, href, ic, label]) => html`<a href="${href}" aria-current="${active === k ? 'page' : 'false'}">${ICON[ic]}<span>${label}</span>${k === 'orders' && unread ? html`<em class="bo-count" aria-label="${unread} ${T('חדשות', 'new')}">${unread}</em>` : ''}</a>`)}`)}
      <span class="spacer"></span>
      <div class="bo-me">${avatar(u.name)}<span><b>${u.name}</b><small>${roleName(u.role)}</small></span><button data-action="logout" aria-label="${T('יציאה', 'Sign out')}" title="${T('יציאה', 'Sign out')}">${ICON.out}</button></div>
    </nav>
    <main class="bo-main" id="main" tabindex="-1">
      <header class="bo-bar">
        <button class="cmdk-btn" data-action="cmdk-open" aria-haspopup="dialog">${ICON2.search}<span>${T('חיפוש או פקודה…', 'Search or run a command…')}</span><kbd>Ctrl K</kbd></button>
        <div class="bo-bar-r"><a class="bo-bell" href="#/orders" aria-label="${unread} ${T('הזמנות חדשות', 'new orders')}">${ICON.bell}${unread ? html`<em>${unread}</em>` : ''}</a><a class="btn sm ghost" href="#/">${ICON.store}<span>${T('לאתר', 'Store')}</span></a></div>
      </header>
      ${u.mustChange ? html`<div class="bo-alert" role="alert">${ICON2.alert}<span>${T('מומלץ להחליף את סיסמת ברירת המחדל.', 'Please change the default password.')}</span><button class="link-btn" data-action="chg-pass">${T('החלפת סיסמה', 'Change password')}</button></div>` : ''}
      <div class="bo-top"><div><p class="bo-date">${sub || today}</p><h1>${title}</h1></div><div class="bo-filters">${tools}</div></div>
      ${body}
    </main></div>`;
}

export function palette(q = '') {
  const role = db.me().role; const isA = role === 'admin';
  const n = String(q).trim().toLowerCase();
  const pages = [
    ['#/admin', T('לוח בקרה', 'Dashboard'), ['admin']], ['#/orders', T('הזמנות', 'Orders'), ['admin', 'orders']], ['#/courier', T('משלוחים', 'Deliveries'), ['admin', 'orders', 'courier']],
    ['#/admin/products', T('מוצרים', 'Products'), ['admin', 'products']], ['#/admin/users', T('לקוחות', 'Customers'), ['admin']], ['#/admin/team', T('צוות והרשאות', 'Team & roles'), ['admin']], ['#/admin/reports', T('דוחות', 'Reports'), ['admin']], ['#/', T('מעבר לאתר', 'Open store'), ['admin', 'orders', 'products', 'courier']],
  ].filter((x) => x[2].includes(role));
  const acts = [
    [T('הזמנות חדשות לטיפול', 'New orders to handle'), 'goto-new', '', ['admin', 'orders']],
    [T('מוצר חדש', 'New product'), 'edit-product', '', ['admin', 'products']],
    [T('משתמש צוות חדש', 'New staff user'), 'staff-open', '', ['admin']],
    [T('ייצוא דוח מכירות (CSV)', 'Export sales report (CSV)'), 'export-csv', '6', ['admin']],
    [T('החלפת שפה', 'Switch language'), 'lang', '', ['admin', 'orders', 'products', 'courier']],
  ].filter((x) => x[3].includes(role));
  const hit = (str) => !n || String(str).toLowerCase().includes(n);
  const os = n && ['admin', 'orders'].includes(role) ? db.orders().filter((o) => hit(o.num + ' ' + o.customer.name + ' ' + o.customer.phone)).slice(0, 6) : [];
  const ps = n && ['admin', 'products'].includes(role) ? db.products().filter((p) => hit(p.name.he + ' ' + p.name.en)).slice(0, 6) : [];
  const us = n && isA ? db.users().filter((u) => ['customer', 'wholesale'].includes(u.role) && hit(u.name + ' ' + u.email + ' ' + (u.phone || ''))).slice(0, 5) : [];
  const grp = (t, items) => (items.length ? html`<p class="ck-h">${t}</p>${items}` : '');
  const out = html`
    ${grp(T('מעבר מהיר', 'Go to'), pages.filter((x) => hit(x[1])).map(([h, l]) => html`<a class="ck-i" href="${h}" data-action="cmdk-close">${ICON2.arrow}<span>${l}</span></a>`))}
    ${grp(T('פעולות', 'Actions'), acts.filter((x) => hit(x[0])).map(([l, a, d]) => html`<button class="ck-i" data-action="${a}" data-id="" data-range="${d}">${ICON2.plus}<span>${l}</span></button>`))}
    ${grp(T('הזמנות', 'Orders'), os.map((o) => html`<button class="ck-i" data-action="order-view" data-id="${o.id}"><b>#${o.num}</b><span>${o.customer.name}</span><small>${m(o.total)} · ${statusLabel(o.status)}</small></button>`))}
    ${grp(T('מוצרים', 'Products'), ps.map((p) => html`<button class="ck-i" data-action="edit-product" data-id="${p.id}"><span>${L(p.name)}</span><small>${p.quote ? '' : `${p.stock} ${T('במלאי', 'in stock')}`}</small></button>`))}
    ${grp(T('לקוחות', 'Customers'), us.map((u) => html`<button class="ck-i" data-action="cust-open" data-id="${u.id}"><span>${u.name}</span><small>${u.phone || u.email}</small></button>`))}`;
  return String(out).trim() ? out : html`<p class="ck-empty">${T('לא נמצאו תוצאות', 'No results')}</p>`;
}

export function boSearch(q) {
  q = String(q || '').trim().toLowerCase(); if (q.length < 2) return '';
  const os = db.orders().filter((o) => (String(o.num) + ' ' + o.customer.name + ' ' + o.customer.phone).toLowerCase().includes(q)).slice(0, 5);
  const ps = can('admin') ? db.products().filter((p) => (p.name.he + ' ' + p.name.en).toLowerCase().includes(q)).slice(0, 4) : [];
  const us = can('admin') ? db.users().filter((u) => (u.name + ' ' + u.email + ' ' + (u.phone || '')).toLowerCase().includes(q)).slice(0, 4) : [];
  if (!os.length && !ps.length && !us.length) return html`<p class="bo-r-empty">${T('לא נמצאו תוצאות', 'No results')}</p>`;
  return html`${os.length ? html`<p class="bo-r-h">${T('הזמנות', 'Orders')}</p>${os.map((o) => html`<button data-action="order-view" data-id="${o.id}">#${o.num} · ${o.customer.name}<small>${m(o.total)} · ${statusLabel(o.status)}</small></button>`)}` : ''}
    ${ps.length ? html`<p class="bo-r-h">${T('מוצרים', 'Products')}</p>${ps.map((p) => html`<button data-action="edit-product" data-id="${p.id}">${L(p.name)}<small>${L(CATEGORIES.find((c) => c.id === p.cat))}</small></button>`)}` : ''}
    ${us.length ? html`<p class="bo-r-h">${T('לקוחות', 'Customers')}</p>${us.map((u) => html`<button data-action="user-find" data-q="${u.email}">${u.name}<small>${u.email}</small></button>`)}` : ''}`;
}
const can = (r) => db.can(r);

// ---------- analytics helpers ----------
function stats(months) {
  const os = db.orders().filter((o) => o.status !== 'cancelled');
  const by = Object.fromEntries(months.map((k) => [k, { rev: 0, cost: 0, n: 0, units: 0 }]));
  const prod = {}; const cats = {};
  for (const o of os) {
    const k = monthKey(o.date); const b = by[k]; if (!b) continue;
    b.rev += o.total; b.n++;
    for (const it of o.items) {
      b.cost += (it.cost || 0) * it.qty; b.units += it.qty;
      const p = (prod[it.pid] ||= { name: it.name, months: Object.fromEntries(months.map((x) => [x, { q: 0, r: 0 }])) });
      p.months[k].q += it.qty; p.months[k].r += it.price * it.qty;
      const c = db.product(it.pid)?.cat || 'other'; cats[c] = (cats[c] || 0) + it.price * it.qty;
    }
  }
  for (const k of months) by[k].profit = by[k].rev - by[k].cost;
  return { by, prod, cats };
}
function mtdPrev() {
  const today = new Date(); const s = new Date(today.getFullYear(), today.getMonth() - 1, 1); const e = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate(), 23, 59);
  return db.orders().filter((o) => o.status !== 'cancelled' && o.date >= +s && o.date <= +e).reduce((a, o) => ({ rev: a.rev + o.total, n: a.n + 1, profit: a.profit + o.total - o.items.reduce((c, i) => c + (i.cost || 0) * i.qty, 0) }), { rev: 0, n: 0, profit: 0 });
}
const delta = (a, b) => { const p = pct(a, b); return html`<span class="delta ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '+' : '−'}${Math.abs(p)}%</span>`; };

function spark(vals) {
  const W = 120, H = 34, max = Math.max(1, ...vals), min = Math.min(...vals);
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * W, H - 3 - ((v - min) / Math.max(1, max - min)) * (H - 6)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return raw(`<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true" preserveAspectRatio="none"><path d="${d} L${W} ${H} L0 ${H}Z" class="sa"/><path d="${d}" class="sl"/></svg>`);
}

function areaChart(months, by, key) {
  const W = 760, H = 250, px = 10, top = 16;
  const vals = months.map((k) => by[k][key]); const max = Math.max(1, ...vals) * 1.1;
  const x = (i) => px + (i / (months.length - 1)) * (W - px * 2); const y = (v) => top + (1 - v / max) * (H - top);
  const pts = vals.map((v, i) => [x(i), y(v)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const fmt = (v) => (key === 'n' ? Math.round(v) : '₪' + Math.round(v).toLocaleString('he-IL'));
  return raw(`<svg class="area" viewBox="0 0 ${W} ${H + 26}" role="img" aria-label="${T('גרף', 'Chart')}">
    <defs><linearGradient id="ag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#A9874F" stop-opacity=".32"/><stop offset="1" stop-color="#A9874F" stop-opacity="0"/></linearGradient></defs>
    ${[0, .25, .5, .75, 1].map((f) => `<line x1="0" x2="${W}" y1="${top + f * (H - top)}" y2="${top + f * (H - top)}" class="gl"/>`).join('')}
    <path d="${line} L${x(months.length - 1)} ${H} L${x(0)} ${H}Z" fill="url(#ag)"/>
    <path d="${line}" class="ln"/>
    ${pts.map((p, i) => `<g class="pt"><rect x="${p[0] - (W / months.length) / 2}" y="0" width="${W / months.length}" height="${H}" fill="transparent"/><line x1="${p[0]}" x2="${p[0]}" y1="${top}" y2="${H}" class="vl"/><circle cx="${p[0]}" cy="${p[1]}" r="4.5"/><g class="tip" transform="translate(${Math.min(Math.max(p[0], 60), W - 60)} ${Math.max(p[1] - 16, 14)})"><rect x="-56" y="-26" width="112" height="24" rx="4"/><text y="-9" text-anchor="middle">${fmt(vals[i])}</text></g><text x="${p[0]}" y="${H + 20}" text-anchor="middle" class="xl">${monthName(months[i])}</text><title>${monthName(months[i])}: ${fmt(vals[i])}</title></g>`).join('')}
  </svg>`);
}

export function dashboard(metric = 'rev') {
  const months = lastMonths(12); const { by, prod, cats } = stats(months);
  const cur = by[months.at(-1)]; const prev = mtdPrev();
  const aov = (b) => (b.n ? b.rev / b.n : 0);
  const series = (k) => months.map((x) => (k === 'aov' ? aov(by[x]) : by[x][k]));
  const top = Object.entries(prod).map(([id, p]) => ({ id, ...p, q: p.months[months.at(-1)].q, pq: p.months[months.at(-2)].q, r: months.slice(-3).reduce((a, k) => a + p.months[k].r, 0) })).sort((a, b) => b.r - a.r).slice(0, 6);
  const topMax = Math.max(1, ...top.map((x) => x.r));
  const orders = db.orders();
  const todo = [
    [orders.filter((o) => o.status === 'new').length, T('הזמנות חדשות לטיפול', 'New orders to handle'), '#/orders', 'new'],
    [orders.filter((o) => o.status === 'processing').length, T('בהכנה', 'Being prepared'), '#/orders', 'processing'],
    [orders.filter((o) => o.status === 'ready').length, T('מוכנות לאיסוף שליח', 'Ready for courier'), '#/courier', 'ready'],
    [db.products().filter((p) => !p.quote && p.stock <= 12).length, T('מוצרים במלאי נמוך', 'Low-stock products'), '#/admin/products', 'low'],
  ];
  const catTotal = Object.values(cats).reduce((a, b) => a + b, 0) || 1;
  const metrics = [['rev', T('הכנסות', 'Revenue')], ['profit', T('רווח גולמי', 'Gross profit')], ['n', T('הזמנות', 'Orders')]];
  const recent = orders.slice(0, 7);
  return shell('admin', T('לוח בקרה', 'Dashboard'), html`
    ${orders.some((o) => o.demo) ? html`<div class="bo-alert soft">${ICON2.eye}<span>${T('מצב תצוגה — הנתונים מדמים שנת פעילות.', 'Preview mode — data simulates a year of trading.')}</span><button class="link-btn" data-action="clear-demo">${T('ניקוי נתוני דמו', 'Clear demo data')}</button></div>` : ''}
    <section class="kpis" aria-label="${T('מדדים', 'Metrics')}">
      ${[[T('הכנסות החודש', 'Revenue (MTD)'), m(cur.rev), delta(cur.rev, prev.rev), series('rev')],
         [T('רווח גולמי', 'Gross profit'), m(cur.profit), delta(cur.profit, prev.profit), series('profit')],
         [T('הזמנות', 'Orders'), cur.n, delta(cur.n, prev.n), series('n')],
         [T('סל ממוצע', 'Avg. order'), m(Math.round(aov(cur))), delta(aov(cur), prev.n ? prev.rev / prev.n : 0), series('aov')]].map(([l, v, d, s]) => html`
        <div class="kpi"><div class="kpi-h"><small>${l}</small>${d}</div><b>${v}</b>${spark(s)}</div>`)}
    </section>
    <p class="kpi-note">${T('השינוי מחושב מול אותם ימים בחודש הקודם', 'Change vs. the same days last month')}</p>
    <div class="dash-grid">
      <section class="panel chart-p" aria-labelledby="ch-t">
        <div class="panel-head"><h2 id="ch-t">${T('ביצועים — 12 חודשים', 'Performance — 12 months')}</h2>
          <div class="seg sm" role="group">${metrics.map(([k, l]) => html`<button aria-pressed="${metric === k}" data-action="metric" data-k="${k}">${l}</button>`)}</div></div>
        <div class="chart">${areaChart(months, by, metric)}</div>
      </section>
      <section class="panel todo-p" aria-labelledby="td-t"><div class="panel-head"><h2 id="td-t">${T('לטיפול עכשיו', 'To do now')}</h2></div>
        <ul class="todo">${todo.map(([n, l, href, k]) => html`<li><a href="${href}" class="${n ? '' : 'zero'}"><b class="t-${k}">${n}</b><span>${l}</span>${ICON2.arrow}</a></li>`)}</ul>
      </section>
    </div>
    <div class="dash-grid three">
      <section class="panel" aria-labelledby="tp-t"><div class="panel-head"><h2 id="tp-t">${T('מוצרים מובילים', 'Top products')}</h2><small class="muted">${T('3 חודשים', '3 months')}</small></div>
        <ol class="bars">${top.map((p) => html`<li><div class="bars-t"><span>${L(p.name)}</span><b>${m(p.r)}</b></div><div class="bar"><i style-w="${Math.round((p.r / topMax) * 100)}"></i></div><small>${p.q} ${T('יח׳ החודש', 'units this month')} ${delta(p.q, p.pq)}</small></li>`)}</ol>
      </section>
      <section class="panel" aria-labelledby="ct-t"><div class="panel-head"><h2 id="ct-t">${T('מכירות לפי קטגוריה', 'Sales by category')}</h2></div>
        <ul class="cat-split">${Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, v], i) => html`<li><span class="dot c${i}"></span><span>${L(CATEGORIES.find((x) => x.id === c)) || c}</span><b>${Math.round((v / catTotal) * 100)}%</b></li>`)}</ul>
        <div class="stack">${Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([, v], i) => html`<i class="c${i}" style-w="${((v / catTotal) * 100).toFixed(1)}"></i>`)}</div>
      </section>
      <section class="panel" aria-labelledby="ro-t"><div class="panel-head"><h2 id="ro-t">${T('הזמנות אחרונות', 'Latest orders')}</h2><a class="link-btn" href="#/orders">${T('לכל ההזמנות', 'All orders')}</a></div>
        <ul class="feed">${recent.map((o) => html`<li><button data-action="order-view" data-id="${o.id}">${avatar(o.customer.name)}<span><b>${o.customer.name}</b><small>#${o.num} · ${dt(o.date)}</small></span><span class="feed-r"><b>${m(o.total)}</b>${statusPill(o.status)}</span></button></li>`)}</ul>
      </section>
    </div>`);
}

export function reports(range = 6) {
  const months = lastMonths(range); const { by, prod } = stats(months);
  const rows = Object.entries(prod).map(([id, p]) => ({ id, ...p, total: months.reduce((a, k) => a + p.months[k].q, 0), rev: months.reduce((a, k) => a + p.months[k].r, 0) })).sort((a, b) => b.rev - a.rev);
  const sum = months.reduce((a, k) => ({ rev: a.rev + by[k].rev, profit: a.profit + by[k].profit, n: a.n + by[k].n }), { rev: 0, profit: 0, n: 0 });
  const heat = (q, mx) => (q ? Math.min(.85, .08 + (q / mx) * .8) : 0);
  const mx = Math.max(1, ...rows.flatMap((r) => months.map((k) => r.months[k].q)));
  return shell('admin/reports', T('דוחות מכירות', 'Sales reports'), html`
    <section class="kpis">
      <div class="kpi"><div class="kpi-h"><small>${T('הכנסות בתקופה', 'Period revenue')}</small></div><b>${m(sum.rev)}</b>${spark(months.map((k) => by[k].rev))}</div>
      <div class="kpi"><div class="kpi-h"><small>${T('רווח גולמי', 'Gross profit')}</small><span class="delta up">${sum.rev ? Math.round((sum.profit / sum.rev) * 100) : 0}% ${T('מרווח', 'margin')}</span></div><b>${m(sum.profit)}</b>${spark(months.map((k) => by[k].profit))}</div>
      <div class="kpi"><div class="kpi-h"><small>${T('הזמנות', 'Orders')}</small></div><b>${sum.n}</b>${spark(months.map((k) => by[k].n))}</div>
      <div class="kpi"><div class="kpi-h"><small>${T('יחידות שנמכרו', 'Units sold')}</small></div><b>${rows.reduce((a, r) => a + r.total, 0)}</b>${spark(months.map((k) => by[k].units))}</div>
    </section>
    <section class="panel"><div class="panel-head"><h2>${T('סיכום חודשי', 'Monthly summary')}</h2></div><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>${T('חודש', 'Month')}</th><th>${T('הזמנות', 'Orders')}</th><th>${T('יחידות', 'Units')}</th><th>${T('הכנסות', 'Revenue')}</th><th>${T('רווח', 'Profit')}</th><th>${T('מרווח', 'Margin')}</th><th>${T('שינוי בהכנסות', 'Revenue change')}</th></tr></thead>
      <tbody>${months.slice().reverse().map((k, i, arr) => html`<tr><td><b>${monthName(k)}</b></td><td>${by[k].n}</td><td>${by[k].units}</td><td>${m(by[k].rev)}</td><td>${m(by[k].profit)}</td><td>${by[k].rev ? Math.round((by[k].profit / by[k].rev) * 100) : 0}%</td><td>${arr[i + 1] ? delta(by[k].rev, by[arr[i + 1]].rev) : '—'}</td></tr>`)}</tbody></table></div></section>
    <section class="panel"><div class="panel-head"><h2>${T('רכישות לפי מוצר וחודש', 'Purchases by product & month')}</h2><small class="muted">${T('יחידות · צבע כהה = יותר מכירות', 'Units · darker = more sales')}</small></div>
      <div class="tbl-wrap"><table class="tbl heat"><thead><tr><th>${T('מוצר', 'Product')}</th>${months.map((k) => html`<th>${monthName(k)}</th>`)}<th>${T('סה״כ', 'Total')}</th><th>${T('הכנסות', 'Revenue')}</th></tr></thead>
      <tbody>${rows.map((r) => html`<tr><td><b>${L(r.name)}</b></td>${months.map((k, i) => html`<td><span class="hc" style-a="${heat(r.months[k].q, mx).toFixed(2)}">${r.months[k].q}</span>${i ? html`<small>${delta(r.months[k].q, r.months[months[i - 1]].q)}</small>` : ''}</td>`)}<td><b>${r.total}</b></td><td>${m(r.rev)}</td></tr>`)}</tbody></table></div></section>`,
    html`<div class="seg" role="group" aria-label="${T('טווח', 'Range')}">${[3, 6, 12].map((n) => html`<button aria-pressed="${n === range}" data-action="range" data-n="${n}">${n} ${T('חודשים', 'months')}</button>`)}</div>
    <button class="btn sm ghost" data-action="export-csv" data-range="${range}">${T('ייצוא לאקסל', 'Export CSV')}</button><button class="btn sm ghost" data-action="print">${ICON2.print}<span>${T('הדפסה', 'Print')}</span></button>`, T('ניתוח מכירות ורווחיות', 'Sales & profitability'));
}

export function reportCSV(range) {
  const months = lastMonths(range); const { prod } = stats(months);
  const q = (s) => `"${String(s).replace(/"/g, '""').replace(/^[=+\-@]/, "'$&")}"`;
  const lines = [[T('מוצר', 'Product'), ...months, T('סה״כ', 'Total')].map(q).join(',')];
  for (const p of Object.values(prod)) lines.push([L(p.name), ...months.map((k) => p.months[k].q), months.reduce((a, k) => a + p.months[k].q, 0)].map(q).join(','));
  return '﻿' + lines.join('\n');
}

// ---------- Products ----------
export function productsAdmin(cat = '', q = '', pv = 'grid') {
  const all = db.products();
  let list = all;
  if (cat) list = list.filter((p) => p.cat === cat);
  if (q) list = list.filter((p) => (p.name.he + p.name.en + p.id).toLowerCase().includes(q.toLowerCase()));
  const stockCls = (p) => (p.quote ? '' : p.stock === 0 ? 'out' : p.stock <= 12 ? 'low' : 'ok');
  const range = (p) => { const ps = p.sizes.map((s) => s.price).filter(Boolean); return !ps.length ? T('הצעת מחיר', 'Quote') : Math.min(...ps) === Math.max(...ps) ? m(ps[0]) : `${m(Math.min(...ps))} – ${m(Math.max(...ps))}`; };
  return shell('admin/products', T('מוצרים', 'Products'), html`
    <nav class="bo-tabs" aria-label="${T('קטגוריות', 'Categories')}"><button aria-pressed="${!cat}" data-action="pcat" data-c="">${T('הכל', 'All')} <em>${all.length}</em></button>
      ${CATEGORIES.filter((c) => all.some((p) => p.cat === c.id)).map((c) => html`<button aria-pressed="${cat === c.id}" data-action="pcat" data-c="${c.id}">${L(c)} <em>${all.filter((p) => p.cat === c.id).length}</em></button>`)}</nav>
    ${pv === 'table' ? html`<section class="panel flush"><div class="tbl-wrap"><table class="tbl ptbl">
      <thead><tr><th></th><th>${T('מוצר', 'Product')}</th><th>${T('מחיר בסיס ₪', 'Base price ₪')}</th><th>${T('מלאי', 'Stock')}</th><th>${T('מוצג', 'Live')}</th><th></th></tr></thead>
      <tbody>${list.map((p) => html`<tr class="${p.active === false ? 'off' : ''}">
        <td><span class="thumb">${media(p)}</span></td>
        <td><b>${L(p.name)}</b><small class="block">${p.sub ? subName(p.sub) : L(CATEGORIES.find((c) => c.id === p.cat))}${p.sizes.length > 1 ? ` · ${p.sizes.length} ${T('גדלים', 'sizes')}` : ''}</small></td>
        <td>${p.quote ? html`<small class="muted">${T('הצעת מחיר', 'Quote')}</small>` : html`<input class="cell" type="number" min="0" value="${p.sizes[0].price}" data-input="p-price" data-id="${p.id}" aria-label="${T('מחיר', 'Price')} ${L(p.name)}">`}</td>
        <td>${p.quote ? '' : html`<input class="cell ${stockCls(p)}" type="number" min="0" value="${p.stock}" data-input="p-stock" data-id="${p.id}" aria-label="${T('מלאי', 'Stock')} ${L(p.name)}">`}</td>
        <td><label class="switch"><input type="checkbox" data-input="p-active" data-id="${p.id}" ${raw(p.active !== false ? 'checked' : '')}><span></span><span class="sr-only">${T('מוצג', 'Live')}</span></label></td>
        <td><button class="link-btn" data-action="edit-product" data-id="${p.id}">${T('עריכה מלאה', 'Edit')}</button></td></tr>`)}</tbody></table></div></section>` : html`
    <div class="pgrid">${list.map((p) => html`<article class="pcard ${p.active === false ? 'off' : ''}">
      <button class="pcard-img ${p.fit === 'contain' ? 'contain' : ''}" data-action="edit-product" data-id="${p.id}" aria-label="${T('עריכת', 'Edit')} ${L(p.name)}">${media(p)}</button>
      <div class="pcard-b"><small>${p.sub ? subName(p.sub) : L(CATEGORIES.find((c) => c.id === p.cat))}</small><b>${L(p.name)}</b>
        <div class="pcard-m"><span>${range(p)}</span>${p.quote ? '' : html`<span class="stock ${stockCls(p)}">${p.stock === 0 ? T('אזל', 'Out') : `${p.stock} ${T('במלאי', 'in stock')}`}</span>`}</div></div>
      <div class="pcard-f"><label class="switch"><input type="checkbox" data-input="p-active" data-id="${p.id}" ${raw(p.active !== false ? 'checked' : '')}><span></span>${p.active !== false ? T('מוצג', 'Live') : T('מוסתר', 'Hidden')}</label>
        <button class="link-btn" data-action="edit-product" data-id="${p.id}">${T('עריכה', 'Edit')}</button></div>
    </article>`)}</div>`}`,
    html`<div class="seg" role="group" aria-label="${T('תצוגה', 'View')}"><button aria-pressed="${pv === 'grid'}" data-action="pv" data-v="grid">${T('כרטיסים', 'Cards')}</button><button aria-pressed="${pv === 'table'}" data-action="pv" data-v="table">${T('טבלה לעריכה מהירה', 'Quick-edit table')}</button></div>
    <label class="bo-field">${ICON2.search}<span class="sr-only">${T('חיפוש', 'Search')}</span><input id="pq" type="search" value="${q}" placeholder="${T('חיפוש מוצר', 'Search products')}" data-input="pq"></label>
    <button class="btn sm" data-action="edit-product" data-id="">${ICON2.plus}<span>${T('מוצר חדש', 'New product')}</span></button>`, `${list.length} ${T('מוצרים', 'products')}`);
}

export function productForm(p) {
  p ||= { id: '', cat: 'oils', name: { he: '', en: '' }, desc: { he: '', en: '' }, notes: [], sizes: [{ label: '100 מ"ל', price: 0, wholesale: 0, cost: 0 }], img: '', gallery: [], active: true, stock: 0 };
  const gallery = [...new Set([p.img, ...(p.gallery || [])].filter(Boolean))];
  const f = (n, l, v, type = 'text', extra = '') => html`<div class="field"><label for="pf-${n}">${l}</label><input class="input" id="pf-${n}" name="${n}" type="${type}" value="${v}" maxlength="300" ${raw(extra)}></div>`;
  const row = (s = {}) => html`<div class="srow"><input class="input" name="s_label" value="${s.label || ''}" aria-label="${T('גודל', 'Size')}" placeholder="${T('גודל', 'Size')}" maxlength="30"><input class="input" name="s_price" type="number" min="0" value="${s.price ?? ''}" aria-label="${T('מחיר', 'Price')}"><input class="input" name="s_ws" type="number" min="0" value="${s.wholesale ?? ''}" aria-label="${T('סיטונאי', 'Wholesale')}"><input class="input" name="s_cost" type="number" min="0" value="${s.cost ?? ''}" aria-label="${T('עלות', 'Cost')}"><button type="button" class="srow-x" data-action="size-rm" aria-label="${T('הסרת גודל', 'Remove size')}">×</button></div>`;
  return html`<div class="modal-bg"><aside class="bo-drawer wide" role="dialog" aria-modal="true" aria-labelledby="pf-t">
    <header class="dr-head"><div><p class="bo-date">${p.id ? L(CATEGORIES.find((c) => c.id === p.cat)) : T('הוספה לקטלוג', 'Add to catalog')}</p><h2 id="pf-t">${p.id ? L(p.name) : T('מוצר חדש', 'New product')}</h2></div><button class="icon-x" data-action="modal-close" aria-label="${T('סגירה', 'Close')}">×</button></header>
    <form data-form="product" data-id="${p.id}" class="dr-body">
      <section class="dr-sec"><h3>${T('פרטים', 'Details')}</h3>
        <div class="row2">${f('he', T('שם בעברית', 'Hebrew name'), p.name.he, 'text', 'required')}${f('en', T('שם באנגלית', 'English name'), p.name.en)}</div>
        <div class="row2"><div class="field"><label for="pf-cat">${T('קטגוריה', 'Category')}</label><select class="input" id="pf-cat" name="cat">${CATEGORIES.map((c) => html`<option value="${c.id}" ${raw(p.cat === c.id ? 'selected' : '')}>${L(c)}</option>`)}</select></div>
        <div class="field"><label for="pf-tag">${T('תגית', 'Badge')}</label><select class="input" id="pf-tag" name="tag"><option value="">${T('ללא', 'None')}</option><option value="new" ${raw(p.tag === 'new' ? 'selected' : '')}>${T('חדש', 'New')}</option><option value="best" ${raw(p.tag === 'best' ? 'selected' : '')}>${T('רב מכר', 'Bestseller')}</option></select></div></div>
      </section>
      <section class="dr-sec"><h3>${T('גדלים ומחירים', 'Sizes & pricing')}</h3>
        <div class="srow head" aria-hidden="true"><span>${T('גודל', 'Size')}</span><span>${T('מחיר ₪', 'Price ₪')}</span><span>${T('סיטונאי ₪', 'Wholesale ₪')}</span><span>${T('עלות ₪', 'Cost ₪')}</span><span></span></div>
        <div id="srows">${p.sizes.map(row)}</div>
        <button type="button" class="link-btn" data-action="size-add">+ ${T('הוספת גודל', 'Add size')}</button>
        <template id="srow-t">${row()}</template>
        <div class="row2">${f('was', T('מחיר לפני מבצע ₪ (ריק = אין מבצע)', 'Price before sale ₪ (empty = no sale)'), p.was || '', 'number', 'min="0"')}<span></span></div>
        <div class="row2">${f('stock', T('מלאי (יחידות)', 'Stock (units)'), p.stock ?? 0, 'number', 'min="0"')}<div class="field"><span class="lbl">${T('תצוגה באתר', 'Visibility')}</span><label class="switch big"><input type="checkbox" name="active" ${raw(p.active !== false ? 'checked' : '')}><span></span>${T('המוצר מוצג בחנות', 'Shown in store')}</label></div></div>
      </section>
      <section class="dr-sec"><h3>${T('פרופיל ריח (לסינון באתר)', 'Scent profile (shop filter)')}</h3>
        ${(() => { const sc = scentOf(p); return html`<div class="field"><span class="lbl">${T('עוצמה', 'Strength')}</span><div class="chips">${STRENGTHS.map(([v, h, e]) => html`<label class="chip"><input type="radio" name="strength" value="${v}" ${raw(sc.strength === v ? 'checked' : '')}><span>${T(h, e)}</span></label>`)}</div></div>
        <div class="field"><span class="lbl">${T('אופי', 'Character')}</span><div class="chips">${NOTES.map(([v, h, e]) => html`<label class="chip"><input type="checkbox" name="notes" value="${v}" ${raw(sc.notes.includes(v) ? 'checked' : '')}><span>${T(h, e)}</span></label>`)}</div></div>`; })()}
      </section>
      <section class="dr-sec"><h3>${T('תמונות', 'Images')}</h3>
        ${gallery.length ? html`<div class="img-pick" role="radiogroup" aria-label="${T('תמונה ראשית', 'Main image')}">${gallery.map((g) => html`<label><input type="radio" name="imgpick" value="${g}" ${raw(g === p.img ? 'checked' : '')}><img src="${small(g)}" alt="" width="120" height="120" loading="lazy"><span>${T('ראשית', 'Main')}</span></label>`)}</div>` : html`<p class="muted">${T('אין עדיין תמונות למוצר.', 'No images yet.')}</p>`}
        <details><summary>${T('נתיב תמונה ידני', 'Manual image path')}</summary>${f('img', T('נתיב (assets/products/…)', 'Path (assets/products/…)'), p.img)}</details>
      </section>
      <section class="dr-sec"><h3>${T('תיאור', 'Description')}</h3>
        <div class="field"><label for="pf-dhe">${T('עברית', 'Hebrew')}</label><textarea class="input" id="pf-dhe" name="dhe" rows="5" maxlength="4000">${p.desc.he}</textarea></div>
        <div class="field"><label for="pf-den">${T('אנגלית', 'English')}</label><textarea class="input" id="pf-den" name="den" rows="3" maxlength="4000">${p.desc.en}</textarea></div>
      </section>
      <p class="err" id="pf-err" role="alert"></p>
      <footer class="dr-foot">${p.id ? html`<button class="link-btn danger" type="button" data-action="del-product" data-id="${p.id}">${T('מחיקת מוצר', 'Delete product')}</button>` : html`<span></span>`}
        <div><button class="btn ghost sm" type="button" data-action="modal-close">${T('ביטול', 'Cancel')}</button><button class="btn sm" type="submit">${T('שמירה', 'Save')}</button></div></footer>
    </form></aside></div>`;
}

// ---------- Customers (retail / wholesale) ----------
const custStats = () => { const st = {}; for (const o of db.orders()) if (o.userId && o.status !== 'cancelled') { const x = (st[o.userId] ||= { n: 0, t: 0, last: 0 }); x.n++; x.t += o.total; x.last = Math.max(x.last, o.date); } return st; };
export function usersAdmin(q = '', tab = '') {
  const all = db.users().map(db.publicUser).filter((u) => ['customer', 'wholesale'].includes(u.role));
  tab = '';
  const groups = [['', T('לקוחות', 'Customers'), () => true]];
  const g = groups.find((x) => x[0] === tab) || groups[0];
  let list = all.filter(g[2]);
  if (q) list = list.filter((u) => (u.name + u.email + (u.phone || '') + (u.biz || '')).toLowerCase().includes(q.toLowerCase()));
  const st = custStats(); list.sort((a, b) => (st[b.id]?.t || 0) - (st[a.id]?.t || 0));
  const shown = list.slice(0, 120);
  const isWs = tab === 'wholesale';
  const sum = (fn) => all.filter(fn).reduce((a, u) => a + (st[u.id]?.t || 0), 0);
  return shell('admin/users', T('לקוחות', 'Customers'), html`
    <section class="kpis">
      <div class="kpi"><div class="kpi-h"><small>${T('לקוחות פרטיים', 'Retail customers')}</small></div><b>${all.filter((u) => u.role === 'customer').length}</b><small>${m(sum((u) => u.role === 'customer'))} ${T('רכישות', 'spent')}</small></div>
      <div class="kpi"><div class="kpi-h"><small>${T('נרשמים לדיוור', 'Newsletter')}</small></div><b>${all.filter((u) => u.newsletter).length + db.clubList().length}</b><small>&nbsp;</small></div>
    </section>
    <section class="panel flush"><div class="tbl-wrap"><table class="tbl users">
      <thead><tr><th>${T('לקוח', 'Customer')}</th><th>${T('טלפון', 'Phone')}</th><th>${T('הזמנות', 'Orders')}</th><th>${T('סה״כ רכישות', 'Total spent')}</th><th>${T('רכישה אחרונה', 'Last order')}</th><th></th></tr></thead>
      <tbody>${shown.map((u) => html`<tr class="clickable ${u.blocked ? 'blocked' : ''}" data-action="cust-open" data-id="${u.id}">
        <td><div class="who">${avatar(u.name)}<span><b>${u.name}</b><small>${u.email}</small></span></div></td>
        <td><small>${u.phone || '—'}</small></td><td>${st[u.id]?.n || 0}</td><td><b>${m(st[u.id]?.t || 0)}</b></td>
        <td><small>${st[u.id] ? new Date(st[u.id].last).toLocaleDateString(getLang()) : '—'}</small></td>
        <td class="row-acts"><span class="link-btn">${T('לכרטיס הלקוח', 'Open')}</span>${u.blocked ? html`<span class="tag red">${T('חסום', 'Blocked')}</span>` : ''}</td></tr>`)}</tbody></table></div>
      ${!shown.length ? html`<p class="muted pad">${T('אין לקוחות ברשימה זו', 'No customers here')}</p>` : ''}
      ${list.length > shown.length ? html`<p class="muted pad">${T('מוצגים', 'Showing')} ${shown.length} ${T('מתוך', 'of')} ${list.length} — ${T('השתמשו בחיפוש לצמצום', 'use search')}</p>` : ''}</section>`,
    html`<label class="bo-field">${ICON2.search}<span class="sr-only">${T('חיפוש', 'Search')}</span><input id="uq" type="search" value="${q}" placeholder="${T('שם, אימייל, טלפון או עסק', 'Name, email, phone or business')}" data-input="uq"></label>`,
    T('לחיצה על לקוח פותחת את הכרטיס שלו', 'Click a customer to open their card'));
}

export function customerDrawer(id) {
  const u = db.publicUser(db.users().find((x) => x.id === id)); if (!u) return '';
  const os = db.orders().filter((o) => o.userId === id);
  const st = custStats()[id] || { n: 0, t: 0 };
  const phone = (u.phone || '').replace(/\D/g, '').replace(/^0/, '');
  return html`<div class="modal-bg"><aside class="bo-drawer" role="dialog" aria-modal="true" aria-labelledby="cd-t">
    <header class="dr-head"><div class="who lg">${avatar(u.name)}<span><b id="cd-t">${u.name}</b><small>${roleName(u.role)} · ${T('הצטרף', 'Joined')} ${new Date(u.createdAt).toLocaleDateString(getLang())}</small></span></div><button class="icon-x" data-action="modal-close" aria-label="${T('סגירה', 'Close')}">×</button></header>
    <form class="dr-body" data-form="customer" data-id="${u.id}">
      <dl class="mini-stats"><div><dt>${T('הזמנות', 'Orders')}</dt><dd>${st.n}</dd></div><div><dt>${T('סה״כ רכישות', 'Spent')}</dt><dd>${m(st.t)}</dd></div><div><dt>${T('סל ממוצע', 'Avg.')}</dt><dd>${m(st.n ? Math.round(st.t / st.n) : 0)}</dd></div></dl>
      ${u.phone ? html`<div class="qa"><a class="btn sm ghost" href="tel:${u.phone}">${ICON.phone}<span>${u.phone}</span></a><a class="btn sm ghost" href="https://wa.me/972${phone}" target="_blank" rel="noopener noreferrer">${ICON2.wa}<span>WhatsApp</span></a></div>` : ''}
      <section class="dr-sec"><h3>${T('פרטים', 'Details')}</h3>
        <div class="row2"><div class="field"><label for="c-n">${T('שם', 'Name')}</label><input class="input" id="c-n" name="name" value="${u.name}" maxlength="80" required></div><div class="field"><label for="c-p">${T('טלפון', 'Phone')}</label><input class="input" id="c-p" name="phone" value="${u.phone || ''}" maxlength="20"></div></div>
        <div class="field"><label for="c-e">${T('אימייל', 'Email')}</label><input class="input" id="c-e" name="email" type="email" value="${u.email}" maxlength="120"></div>
        <div class="field"><label for="c-b">${T('שם עסק / ח.פ.', 'Business / VAT ID')}</label><input class="input" id="c-b" name="biz" value="${u.biz || ''}" maxlength="80"></div>
        <div class="field"><label for="c-note">${T('הערה פנימית', 'Internal note')}</label><textarea class="input" id="c-note" name="note" rows="2" maxlength="400">${u.note || ''}</textarea></div>
        <label class="switch big"><input type="checkbox" name="newsletter" ${raw(u.newsletter ? 'checked' : '')}><span></span>${T('מקבל דיוור', 'Newsletter')}</label>
      </section>
      <section class="dr-sec"><h3>${T('היסטוריית הזמנות', 'Order history')}</h3>
        ${os.length ? html`<ul class="feed">${os.slice(0, 12).map((o) => html`<li><button type="button" data-action="order-view" data-id="${o.id}"><span><b>#${o.num}</b><small>${dt(o.date)} · ${o.items.length} ${T('פריטים', 'items')}</small></span><span class="feed-r"><b>${m(o.total)}</b>${statusPill(o.status)}</span></button></li>`)}</ul>` : html`<p class="muted">${T('עדיין אין הזמנות', 'No orders yet')}</p>`}
      </section>
      <p class="err" id="cd-err" role="alert"></p>
      <footer class="dr-foot"><div><button type="button" class="link-btn" data-action="block-user" data-id="${u.id}">${u.blocked ? T('שחרור חסימה', 'Unblock') : T('חסימה', 'Block')}</button> <button type="button" class="link-btn danger" data-action="del-user" data-id="${u.id}">${T('מחיקה', 'Delete')}</button></div>
        <div><button class="btn ghost sm" type="button" data-action="modal-close">${T('ביטול', 'Cancel')}</button><button class="btn sm" type="submit">${T('שמירה', 'Save')}</button></div></footer>
    </form></aside></div>`;
}

// ---------- Team & roles ----------
export function teamAdmin() {
  const staff = db.users().map(db.publicUser).filter((u) => db.STAFF_ROLES.includes(u.role));
  const self = db.me();
  return shell('admin/team', T('צוות והרשאות', 'Team & roles'), html`
    <div class="roles">${db.STAFF_ROLES.map((r) => { const ppl = staff.filter((u) => u.role === r); return html`<section class="role-col">
      <header><b>${roleName(r)}</b><small>${T(...ROLE_DESC[r])}</small></header>
      ${ppl.map((u) => html`<button class="staff" data-action="staff-open" data-id="${u.id}">${avatar(u.name)}<span><b>${u.name}${u.id === self.id ? html` <em>(${T('את/ה', 'you')})</em>` : ''}</b><small>${u.email}</small></span>${u.blocked ? html`<span class="tag red">${T('מושבת', 'Disabled')}</span>` : ''}</button>`)}
      <button class="staff add" data-action="staff-open" data-id="" data-role="${r}">+ ${T('הוספת', 'Add')} ${roleName(r)}</button></section>`; })}</div>`,
    html`<button class="btn sm" data-action="staff-open" data-id="">${ICON2.plus}<span>${T('משתמש חדש', 'New user')}</span></button>`,
    T('מי יכול להיכנס לממשק ומה כל אחד רואה', 'Who can sign in and what each role sees'));
}

export function staffDrawer(id, role = 'orders') {
  const u = id ? db.publicUser(db.users().find((x) => x.id === id)) : { name: '', email: '', phone: '', role };
  const self = db.me(); const isSelf = u.id === self.id;
  return html`<div class="modal-bg"><aside class="bo-drawer" role="dialog" aria-modal="true" aria-labelledby="sd-t">
    <header class="dr-head"><div><p class="bo-date">${T('צוות', 'Team')}</p><h2 id="sd-t">${id ? u.name : T('משתמש חדש', 'New user')}</h2></div><button class="icon-x" data-action="modal-close" aria-label="${T('סגירה', 'Close')}">×</button></header>
    <form class="dr-body" data-form="staff" data-id="${id || ''}">
      <section class="dr-sec"><h3>${T('פרטים', 'Details')}</h3>
        <div class="field"><label for="s-n">${T('שם מלא', 'Full name')} *</label><input class="input" id="s-n" name="name" value="${u.name}" maxlength="80" required></div>
        <div class="row2"><div class="field"><label for="s-e">${T('אימייל (שם משתמש)', 'Email (login)')} *</label><input class="input" id="s-e" name="email" type="email" value="${u.email}" maxlength="120" required></div><div class="field"><label for="s-p">${T('טלפון', 'Phone')}</label><input class="input" id="s-p" name="phone" value="${u.phone || ''}" maxlength="20"></div></div></section>
      <section class="dr-sec"><h3>${T('תפקיד והרשאות', 'Role & access')}</h3>
        <div class="role-pick">${db.STAFF_ROLES.map((r) => html`<label><input type="radio" name="role" value="${r}" ${raw(u.role === r ? 'checked' : '')} ${raw(isSelf ? 'disabled' : '')}><span><b>${roleName(r)}</b><small>${T(...ROLE_DESC[r])}</small></span></label>`)}</div>
        ${isSelf ? html`<p class="muted"><small>${T('לא ניתן לשנות את התפקיד של עצמך.', 'You cannot change your own role.')}</small></p>` : ''}</section>
      <section class="dr-sec"><h3>${id ? T('איפוס סיסמה', 'Reset password') : T('סיסמה ראשונית', 'Initial password')}</h3>
        <div class="field"><label for="s-pw">${id ? T('סיסמה חדשה (השאירו ריק כדי לא לשנות)', 'New password (leave empty to keep)') : T('סיסמה', 'Password') + ' *'}</label><input class="input" id="s-pw" name="password" type="text" autocomplete="new-password" minlength="8" maxlength="128" ${raw(id ? '' : 'required')}><small class="muted">${T('לפחות 8 תווים, אות ומספר. המשתמש יתבקש להחליף בכניסה הראשונה.', 'At least 8 chars, a letter and a number. User must change it on first login.')}</small></div></section>
      <p class="err" id="sd-err" role="alert"></p>
      <footer class="dr-foot"><div>${id && !isSelf ? html`<button type="button" class="link-btn" data-action="block-user" data-id="${id}">${u.blocked ? T('הפעלה מחדש', 'Enable') : T('השבתת גישה', 'Disable access')}</button> <button type="button" class="link-btn danger" data-action="del-user" data-id="${id}">${T('מחיקה', 'Delete')}</button>` : ''}</div>
        <div><button class="btn ghost sm" type="button" data-action="modal-close">${T('ביטול', 'Cancel')}</button><button class="btn sm" type="submit">${id ? T('שמירה', 'Save') : T('יצירת משתמש', 'Create user')}</button></div></footer>
    </form></aside></div>`;
}

// ---------- Orders ----------
export function ordersBoard(state) {
  const { view = 'queue', month = 'all', q = '', status = '', sel = new Set() } = state;
  let list = db.orders();
  const months = [...new Set(list.map((o) => monthKey(o.date)))];
  if (month !== 'all') list = list.filter((o) => monthKey(o.date) === month);
  if (q) list = list.filter((o) => (o.num + ' ' + o.customer.name + ' ' + o.customer.phone + ' ' + o.customer.city).toLowerCase().includes(q.toLowerCase()));
  const counts = Object.fromEntries(db.STATUSES.map((s) => [s, list.filter((o) => o.status === s).length]));
  const shownAll = status ? list.filter((o) => o.status === status) : list;
  const shown = shownAll.slice(0, 150);
  const next = { new: 'processing', processing: 'ready', ready: 'shipped', shipped: 'delivered' };
  const nextLabel = { new: T('להכנה', 'Start'), processing: T('מוכן', 'Ready'), ready: T('נשלח', 'Shipped'), shipped: T('נמסר', 'Delivered') };
  const cols = ['new', 'processing', 'ready', 'shipped', 'delivered'];
  const ocard = (o) => html`<button class="ocard" data-action="order-view" data-id="${o.id}"><span class="oc-h"><b>#${o.num}</b><small>${dt(o.date)}</small></span><span class="oc-n">${o.customer.name}</span><span class="oc-f"><small>${o.customer.city} · ${o.items.reduce((a, i) => a + i.qty, 0)} ${T('פריטים', 'items')}</small><b>${m(o.total)}</b></span></button>`;
  const DAY = 864e5; const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const all = db.orders();
  const late = (o) => ['new', 'processing'].includes(o.status) && Date.now() - o.date > DAY;
  const doneToday = all.filter((o) => (o.history || []).some((h) => h.at >= +t0 && h.s !== 'new')).length;
  const openNow = all.filter((o) => ['new', 'processing', 'ready'].includes(o.status)).length;
  const ticket = (o) => { const n = next[o.status]; const units = o.items.reduce((a, i) => a + i.qty, 0); return html`<article class="ticket ${late(o) ? 'late' : ''}" data-action="order-view" data-id="${o.id}" tabindex="0">
      <header><span class="t-no">#${o.num}</span><span class="t-age">${ago(o.date)}</span></header>
      <p class="t-cust"><b>${o.customer.name}</b><span>${o.customer.city}</span></p>
      <ul class="t-items">${o.items.slice(0, 3).map((i) => html`<li><span class="t-q">×${i.qty}</span><span>${L(i.name)}</span><small>${i.size !== 'יחידה' && i.size !== 'מארז' ? i.size : ''}</small></li>`)}${o.items.length > 3 ? html`<li class="t-more">+${o.items.length - 3} ${T('פריטים נוספים', 'more')}</li>` : ''}</ul>
      ${o.customer.notes ? html`<p class="t-note">${o.customer.notes}</p>` : ''}
      <footer><span class="t-sum">${m(o.total)}<small>${units} ${T('יח׳', 'pcs')}${o.payment !== 'paid' ? ' · ' + T('ממתין לתשלום', 'unpaid') : ''}</small></span>
        ${n ? html`<button class="t-go" data-action="order-status" data-id="${o.id}" data-s="${n}">${nextLabel[o.status]} <span aria-hidden="true">←</span></button>` : ''}</footer>
    </article>`; };
  const lanes = [
    ['late', T('דורש טיפול עכשיו', 'Needs attention now'), T('ממתינות מעל 24 שעות', 'Waiting over 24 hours'), all.filter(late)],
    ['new', T('חדשות', 'New'), T('לאשר ולהתחיל להכין', 'Confirm and start'), all.filter((o) => o.status === 'new' && !late(o))],
    ['processing', T('בהכנה', 'Preparing'), T('לארוז ולסמן כמוכן', 'Pack and mark ready'), all.filter((o) => o.status === 'processing' && !late(o))],
    ['ready', T('מוכנות לשליח', 'Ready for courier'), T('ממתינות לאיסוף', 'Awaiting pickup'), all.filter((o) => o.status === 'ready')],
  ];
  const queue = html`<section class="q-hero">
      <div><p class="q-k">${T('תור העבודה של היום', "Today's queue")}</p><h2>${openNow ? html`<span class="q-n">${openNow}</span> ${T('הזמנות פתוחות', 'open orders')}` : T('הכל טופל. כל הכבוד.', 'All clear. Nice work.')}</h2></div>
      <div class="q-prog"><span>${T('טופלו היום', 'Handled today')} <b>${doneToday}</b></span><i><b style-w="${Math.round((doneToday / Math.max(1, doneToday + openNow)) * 100)}"></b></i></div>
    </section>
    <div class="lanes">${lanes.map(([k, h, sub, os]) => html`<section class="lane l-${k}" aria-labelledby="ln-${k}"><header><h3 id="ln-${k}">${h}<em>${os.length}</em></h3><small>${sub}</small></header>
      ${os.length ? os.slice(0, 20).map(ticket) : html`<p class="lane-empty">${T('אין כאן כלום כרגע', 'Nothing here right now')}</p>`}${os.length > 20 ? html`<button class="link-btn" data-action="ov" data-v="list">${T('לכל', 'All')} ${os.length} ${T('ברשימה', 'in list')}</button>` : ''}</section>`)}</div>`;
  const body = view === 'queue' ? queue : view === 'board'
    ? html`<div class="kanban">${cols.map((c) => { const os = list.filter((o) => o.status === c); return html`<section class="col" aria-label="${statusLabel(c)}"><h3>${statusPill(c)}<span>${os.length}</span></h3>${os.slice(0, 30).map(ocard)}</section>`; })}</div>`
    : html`<section class="panel flush"><div class="tbl-wrap"><table class="tbl orders">
      <thead><tr><th class="ck"><input type="checkbox" data-input="sel-all" aria-label="${T('בחירת כל ההזמנות המוצגות', 'Select all shown')}" ${raw(shown.length && shown.every((o) => sel.has(o.id)) ? 'checked' : '')}></th><th>${T('הזמנה', 'Order')}</th><th>${T('לקוח', 'Customer')}</th><th>${T('פריטים', 'Items')}</th><th>${T('סכום', 'Total')}</th><th>${T('סטטוס', 'Status')}</th><th>${T('פעולה', 'Action')}</th></tr></thead>
      <tbody>${shown.map((o) => { const open = ['new', 'processing'].includes(o.status); const late = open && Date.now() - o.date > 864e5; return html`<tr data-action="order-view" data-id="${o.id}" class="clickable ${sel.has(o.id) ? 'sel' : ''}">
        <td class="ck" data-action="noop"><input type="checkbox" data-input="sel" data-id="${o.id}" aria-label="${T('בחירת הזמנה', 'Select order')} ${o.num}" ${raw(sel.has(o.id) ? 'checked' : '')}></td>
        <td><b class="num">#${o.num}</b><small class="block">${open ? html`<span class="age ${late ? 'late' : ''}">${ago(o.date)}</span>` : dt(o.date)}</small></td>
        <td><div class="who">${avatar(o.customer.name)}<span><b>${o.customer.name}</b><small>${o.customer.city}</small></span></div></td>
        <td><small>${o.items.slice(0, 2).map((i) => L(i.name)).join(', ')}${o.items.length > 2 ? ` +${o.items.length - 2}` : ''}</small></td>
        <td><b>${m(o.total)}</b><small class="block">${o.payment === 'paid' ? T('שולם', 'Paid') : o.payment === 'refunded' ? T('זוכה', 'Refunded') : T('ממתין לתשלום', 'Awaiting payment')}</small></td>
        <td>${statusPill(o.status)}</td>
        <td>${next[o.status] ? html`<button class="btn sm ghost" data-action="order-status" data-id="${o.id}" data-s="${next[o.status]}">${nextLabel[o.status]}</button>` : ''}</td></tr>`; })}</tbody></table></div>
      <p class="muted pad">${shownAll.length} ${T('הזמנות', 'orders')} · ${m(shownAll.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + o.total, 0))}${shownAll.length > shown.length ? ` · ${T('מוצגות', 'showing')} ${shown.length}` : ''}</p></section>`;
  return shell('orders', T('הזמנות', 'Orders'), html`
    ${view === 'list' ? html`<nav class="bo-tabs" aria-label="${T('סטטוס', 'Status')}"><button aria-pressed="${!status}" data-action="os-tab" data-s="">${T('הכל', 'All')} <em>${list.length}</em></button>${db.STATUSES.map((s) => html`<button aria-pressed="${status === s}" data-action="os-tab" data-s="${s}" class="${s === 'new' && counts[s] ? 'hot' : ''}">${statusLabel(s)} <em>${counts[s]}</em></button>`)}</nav>` : ''}
    ${body}
    ${sel.size ? html`<div class="bulk" role="region" aria-label="${T('פעולות על הזמנות שנבחרו', 'Bulk actions')}"><b>${sel.size} ${T('נבחרו', 'selected')}</b>
      <label class="sr-only" for="bulk-st">${T('העברה לסטטוס', 'Move to status')}</label><select class="mini-sel" id="bulk-st" data-input="bulk-status"><option value="">${T('העברה לסטטוס…', 'Move to status…')}</option>${db.STATUSES.map((s) => html`<option value="${s}">${statusLabel(s)}</option>`)}</select>
      <button class="btn sm ghost" data-action="bulk-print">${ICON2.print}<span>${T('הדפסת תעודות משלוח', 'Print slips')}</span></button>
      <button class="link-btn" data-action="sel-clear">${T('ביטול בחירה', 'Clear')}</button></div>` : ''}`,
    html`<div class="seg" role="group" aria-label="${T('תצוגה', 'View')}"><button aria-pressed="${view === 'queue'}" data-action="ov" data-v="queue">${T('תור עבודה', 'Work queue')}</button><button aria-pressed="${view === 'list'}" data-action="ov" data-v="list">${T('רשימה', 'List')}</button><button aria-pressed="${view === 'board'}" data-action="ov" data-v="board">${T('לוח', 'Board')}</button></div>
    <label class="sr-only" for="om">${T('חודש', 'Month')}</label><select class="mini-sel" id="om" data-input="om"><option value="all">${T('כל התקופה', 'All time')}</option>${months.map((k) => html`<option value="${k}" ${raw(k === month ? 'selected' : '')}>${monthName(k)}</option>`)}</select>
    <label class="bo-field">${ICON2.search}<span class="sr-only">${T('חיפוש', 'Search')}</span><input id="oq" type="search" value="${q}" placeholder="${T('מספר, שם או טלפון', 'No., name or phone')}" data-input="oq"></label>`,
    T('ניהול, מעקב ומשלוח', 'Manage, track and ship'));
}

export function orderModal(id) {
  const o = db.orders().find((x) => x.id === id); if (!o) return '';
  const couriers = db.users().filter((u) => u.role === 'courier');
  const phone = o.customer.phone.replace(/\D/g, '').replace(/^0/, '');
  const waCust = `https://wa.me/972${phone}?text=${encodeURIComponent(`שלום ${o.customer.name}, כאן SAY Boutique לגבי הזמנה #${o.num}`)}`;
  const flow = ['new', 'processing', 'ready', 'shipped', 'delivered'];
  const at = flow.indexOf(o.status);
  const when = (s) => o.history.find((h) => h.s === s)?.at;
  return html`<div class="modal-bg"><aside class="bo-drawer" role="dialog" aria-modal="true" aria-labelledby="od-t">
    <header class="dr-head"><div><p class="bo-date">${dt(o.date)}</p><h2 id="od-t">${T('הזמנה', 'Order')} #${o.num}</h2></div><div class="dr-h-r">${statusPill(o.status)}<button class="icon-x" data-action="modal-close" aria-label="${T('סגירה', 'Close')}">×</button></div></header>
    <div class="dr-body">
      ${o.status !== 'cancelled' ? html`<ol class="stepper">${flow.map((s, i) => html`<li class="${i <= at ? 'done' : ''} ${i === at ? 'now' : ''}"><i></i><span>${statusLabel(s)}</span><small>${when(s) ? dt(when(s)) : ''}</small></li>`)}</ol>` : ''}
      <section class="dr-sec cust"><div class="who lg">${avatar(o.customer.name)}<span><b>${o.customer.name}</b><small>${o.customer.email}</small></span></div>
        <p>${o.customer.street}${o.customer.apt ? ', ' + o.customer.apt : ''}, ${o.customer.city}</p>
        ${o.customer.notes ? html`<p class="cnote">${T('הערה:', 'Note:')} ${o.customer.notes}</p>` : ''}
        <div class="qa"><a class="btn sm ghost" href="tel:${o.customer.phone}">${ICON.phone}<span>${o.customer.phone}</span></a><a class="btn sm ghost" href="${waCust}" target="_blank" rel="noopener noreferrer">${ICON2.wa}<span>WhatsApp</span></a></div></section>
      <section class="dr-sec"><h3>${T('פריטים', 'Items')}</h3>
        <ul class="o-items">${o.items.map((i) => { const p = db.product(i.pid); return html`<li><span class="thumb">${p ? media(p) : ''}</span><span><b>${L(i.name)}</b><small>${[i.size !== 'יחידה' && i.size !== 'מארז' ? i.size : '', i.opt].filter(Boolean).join(' · ')}</small></span><span class="q">×${i.qty}</span><b>${m(i.price * i.qty)}</b></li>`; })}</ul>
        <dl class="o-tot"><div><dt>${T('סכום ביניים', 'Subtotal')}</dt><dd>${m(o.subtotal)}</dd></div>${o.discount ? html`<div><dt>${T('הנחת מועדון', 'Club discount')}</dt><dd>−${m(o.discount)}</dd></div>` : ''}<div><dt>${T('משלוח', 'Shipping')}</dt><dd>${o.shipping ? m(o.shipping) : T('חינם', 'Free')}</dd></div><div class="g"><dt>${T('סה״כ', 'Total')}</dt><dd>${m(o.total)}</dd></div></dl></section>
      <section class="dr-sec"><h3>${T('ניהול', 'Manage')}</h3><div class="row2">
        <div class="field"><label for="m-st">${T('סטטוס', 'Status')}</label><select class="input" id="m-st" data-input="m-status" data-id="${o.id}">${db.STATUSES.map((s) => html`<option value="${s}" ${raw(o.status === s ? 'selected' : '')}>${statusLabel(s)}</option>`)}</select></div>
        <div class="field"><label for="m-c">${T('שליח', 'Courier')}</label><select class="input" id="m-c" data-input="m-courier" data-id="${o.id}"><option value="">${T('לא שובץ', 'Unassigned')}</option>${couriers.map((c) => html`<option value="${c.id}" ${raw(o.courierId === c.id ? 'selected' : '')}>${c.name}</option>`)}</select></div></div></section>
    </div>
    <footer class="dr-foot no-print"><button class="btn sm ghost" data-action="print">${ICON2.print}<span>${T('תעודת משלוח', 'Packing slip')}</span></button>
      ${({ new: 'processing', processing: 'ready', ready: 'shipped', shipped: 'delivered' })[o.status] ? html`<button class="btn sm" data-action="order-status" data-id="${o.id}" data-s="${({ new: 'processing', processing: 'ready', ready: 'shipped', shipped: 'delivered' })[o.status]}" data-keep="1">${T('העברה ל', 'Move to ')}${statusLabel(({ new: 'processing', processing: 'ready', ready: 'shipped', shipped: 'delivered' })[o.status])}</button>` : ''}</footer>
  </aside></div>`;
}

// ---------- Courier (mobile-first) ----------
export function courierView(tab = 'todo') {
  const u = db.me();
  let list = db.orders().filter((o) => ['ready', 'shipped'].includes(o.status) || (tab === 'done' && o.status === 'delivered'));
  if (u.role === 'courier') list = list.filter((o) => !o.courierId || o.courierId === u.id);
  const todo = list.filter((o) => o.status !== 'delivered');
  const done = list.filter((o) => o.status === 'delivered' && Date.now() - o.date < 7 * 864e5);
  const shown = tab === 'done' ? done : todo.sort((a, b) => a.customer.city.localeCompare(b.customer.city, 'he'));
  const addr = (o) => `${o.customer.street}, ${o.customer.city}`;
  return shell('courier', T('המשלוחים שלי', 'My deliveries'), html`<div class="courier">
    <div class="seg" role="group"><button aria-pressed="${tab === 'todo'}" data-action="ctab" data-t="todo">${T('לביצוע', 'To do')} (${todo.length})</button><button aria-pressed="${tab === 'done'}" data-action="ctab" data-t="done">${T('נמסרו השבוע', 'Delivered')}</button></div>
    ${tab === 'todo' && todo.length > 1 ? html`<p><a class="btn block ghost" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/dir/${todo.map((o) => encodeURIComponent(addr(o))).join('/')}">${T('מסלול לכל הכתובות (Google Maps)', 'Route all stops (Google Maps)')}</a></p>` : ''}
    ${shown.length ? shown.map((o) => html`<article class="dcard"><div class="panel-head"><h3>${o.customer.name}</h3><span class="pill st-${o.status}">${statusLabel(o.status)}</span></div>
      <div class="addr">${addr(o)}${o.customer.apt ? html` · ${o.customer.apt}` : ''}</div>
      <small class="muted">#${o.num} · ${o.items.reduce((a, i) => a + i.qty, 0)} ${T('פריטים', 'items')}${o.payment !== 'paid' ? html` · <b>${T('לגבות', 'Collect')} ${m(o.total)}</b>` : ''}</small>
      ${o.customer.notes ? html`<p class="cnote"><small>${T('הערה:', 'Note:')} ${o.customer.notes}</small></p>` : ''}
      ${tab === 'todo' ? html`<div class="big">
        <a href="https://waze.com/ul?q=${encodeURIComponent(addr(o))}&navigate=yes" target="_blank" rel="noopener noreferrer">${ICON.nav}Waze</a>
        <a href="tel:${o.customer.phone}">${ICON.phone}${T('חיוג', 'Call')}</a>
        ${o.status === 'ready' ? html`<button data-action="order-status" data-id="${o.id}" data-s="shipped">${ICON.box}${T('נאסף', 'Picked up')}</button>` : html`<button class="done" data-action="order-status" data-id="${o.id}" data-s="delivered">${ICON.check}${T('נמסר', 'Delivered')}</button>`}
      </div>` : ''}</article>`) : html`<p class="muted">${T('אין משלוחים כרגע', 'No deliveries right now')}</p>`}
  </div>`);
}

export const orderAlertLink = (o) => `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(`הזמנה חדשה #${o.num}\n${o.customer.name} · ${o.customer.phone}\n${o.customer.street}, ${o.customer.city}\nסה"כ: ${o.total}₪`)}`;

export function packingSlips(ids) {
  const os = db.orders().filter((o) => ids.includes(o.id));
  return html`${os.map((o) => html`<section class="slip"><header><img src="assets/img/logo-header.png" alt="" width="90" height="100"><div><h2>${T('תעודת משלוח', 'Packing slip')} #${o.num}</h2><p>${dt(o.date)}</p></div></header>
    <p><b>${o.customer.name}</b> · ${o.customer.phone}<br>${o.customer.street}${o.customer.apt ? ', ' + o.customer.apt : ''}, ${o.customer.city}${o.customer.notes ? html`<br>${T('הערה:', 'Note:')} ${o.customer.notes}` : ''}</p>
    <table><thead><tr><th>${T('פריט', 'Item')}</th><th>${T('גודל / פרטים', 'Size / details')}</th><th>${T('כמות', 'Qty')}</th></tr></thead><tbody>${o.items.map((i) => html`<tr><td>${L(i.name)}</td><td>${[i.size, i.opt].filter(Boolean).join(' · ')}</td><td>${i.qty}</td></tr>`)}</tbody></table></section>`)}`;
}

export function reviewsAdmin() {
  db.seedReviewDrafts();
  const order = { pending: 0, draft: 1, approved: 2, hidden: 3 };
  const l = db.reviews().sort((a, b) => order[a.status] - order[b.status] || b.at - a.at);
  const lab = { pending: T('ממתינה לאישור', 'Pending'), approved: T('מפורסמת באתר', 'Published'), hidden: T('מוסתרת', 'Hidden'), draft: T('טיוטה — לעריכה', 'Draft — edit me') };
  return shell('admin/reviews', html`<header class="bo-top"><h1>${T('ביקורות', 'Reviews')}</h1></header>
    <p class="rv-intro">${T('טיוטות הן תבניות כתיבה: החליפו בשם ובמילים של לקוח אמיתי (באישורו), שמרו ואשרו. ביקורות מהאתר מגיעות לכאן לאישור.', 'Drafts are writing templates: replace with a real customer\'s name and words (with consent), save and approve.')}</p>
    <div class="rv-admin">${l.map((r) => html`<form class="panel rv-edit ${r.status}" data-form="rv-edit" data-id="${r.id}">
      <div class="rv-edit-h"><span class="pill">${lab[r.status]}</span>${'★'.repeat(r.rating)}</div>
      <div class="row2"><div class="field"><label>${T('שם', 'Name')}</label><input class="input" name="name" value="${r.name}" maxlength="60"></div><div class="field"><label>${T('עיר', 'City')}</label><input class="input" name="city" value="${r.city || ''}" maxlength="40"></div></div>
      <div class="field"><label>${T('דירוג', 'Rating')}</label><select class="input" name="rating">${[5, 4, 3, 2, 1].map((n) => html`<option value="${n}" ${raw(r.rating === n ? 'selected' : '')}>${n}</option>`)}</select></div>
      <div class="field"><label>${T('טקסט', 'Text')}</label><textarea class="input" name="text" rows="3" maxlength="600">${r.text}</textarea></div>
      <div class="row-acts"><button class="btn sm ghost" type="submit">${T('שמירה', 'Save')}</button>${r.status !== 'approved' ? html`<button class="btn sm" type="button" data-action="rv-ok" data-id="${r.id}" ${raw(r.name === 'שם הלקוח' ? 'disabled title="יש להחליף את השם בשם הלקוח"' : '')}>${T('פרסום באתר', 'Publish')}</button>` : html`<button class="btn sm ghost" type="button" data-action="rv-hide" data-id="${r.id}">${T('הסתרה', 'Hide')}</button>`}<button class="link-btn danger" type="button" data-action="rv-del" data-id="${r.id}">${T('מחיקה', 'Delete')}</button></div>
    </form>`)}</div>`);
}
