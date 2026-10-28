import { html, raw, money, monthKey, pct, PHONE_INTL } from './util.js';
import { L, getLang } from './i18n.js';
import { CATEGORIES } from './data.js';
import * as db from './db.js';
import { media, statusLabel } from './views-shop.js';

const he = () => getLang() === 'he';
const T = (h, e) => (he() ? h : e);
const m = (n) => money(n, getLang());
const dt = (d) => new Date(d).toLocaleString(he() ? 'he-IL' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' });
const monthName = (k) => { const [y, mo] = k.split('-'); return new Date(+y, +mo - 1, 1).toLocaleDateString(he() ? 'he-IL' : 'en-GB', { month: 'short', year: '2-digit' }); };
const lastMonths = (n) => { const out = []; const d = new Date(); for (let i = n - 1; i >= 0; i--) out.push(monthKey(new Date(d.getFullYear(), d.getMonth() - i, 1))); return out; };
const ICON = { dash: '◧', prod: '❒', rep: '▤', users: '◉', orders: '☰', truck: '➤', store: '⌂', out: '⎋' };

function shell(active, title, body, tools = '') {
  const u = db.me(); const role = u.role;
  const links = [
    ['admin', '#/admin', 'dash', T('לוח בקרה', 'Dashboard'), ['admin']],
    ['admin/products', '#/admin/products', 'prod', T('מוצרים', 'Products'), ['admin']],
    ['admin/reports', '#/admin/reports', 'rep', T('דוחות', 'Reports'), ['admin']],
    ['admin/users', '#/admin/users', 'users', T('משתמשים', 'Users'), ['admin']],
    ['orders', '#/orders', 'orders', T('הזמנות', 'Orders'), ['admin', 'orders']],
    ['courier', '#/courier', 'truck', T('משלוחים', 'Deliveries'), ['admin', 'orders', 'courier']],
  ].filter((l) => l[4].includes(role));
  const unread = db.notifications().filter((n) => !n.read).length;
  return html`<div class="bo">
    <nav class="bo-side" aria-label="${T('ניווט ניהול', 'Admin navigation')}">
      <a class="brand" href="#/"><b>SAY</b><small>BACK OFFICE</small></a>
      ${links.map(([k, href, ic, label]) => html`<a href="${href}" aria-current="${active === k ? 'page' : 'false'}"><span aria-hidden="true">${ICON[ic]}</span>${label}${k === 'orders' && unread ? html` <span class="badge" aria-label="${unread} ${T('חדשות', 'new')}">${unread}</span>` : ''}</a>`)}
      <span class="spacer"></span>
      <a href="#/"><span aria-hidden="true">${ICON.store}</span>${T('לאתר', 'Store')}</a>
      <button data-action="logout"><span aria-hidden="true">${ICON.out}</span>${T('יציאה', 'Sign out')}</button>
    </nav>
    <main class="bo-main" id="main" tabindex="-1">
      ${u.mustChange ? html`<div class="panel" role="alert"><b>${T('אבטחה:', 'Security:')}</b> ${T('יש להחליף את סיסמת ברירת המחדל.', 'Please change the default password.')} <button class="btn sm" data-action="chg-pass">${T('החלפת סיסמה', 'Change password')}</button></div>` : ''}
      <div class="bo-top"><h1>${title}</h1><div class="bo-filters">${tools}</div></div>
      ${body}
    </main></div>`;
}

// ---------- analytics helpers ----------
function stats(months) {
  const os = db.orders().filter((o) => o.status !== 'cancelled');
  const by = Object.fromEntries(months.map((k) => [k, { rev: 0, cost: 0, n: 0, units: 0 }]));
  const prod = {};
  for (const o of os) {
    const k = monthKey(o.date); const b = by[k]; if (!b) continue;
    b.rev += o.total; b.n++;
    for (const it of o.items) {
      b.cost += (it.cost || 0) * it.qty; b.units += it.qty;
      const p = (prod[it.pid] ||= { name: it.name, months: Object.fromEntries(months.map((x) => [x, { q: 0, r: 0 }])) });
      p.months[k].q += it.qty; p.months[k].r += it.price * it.qty;
    }
  }
  for (const k of months) by[k].profit = by[k].rev - by[k].cost - 0;
  return { by, prod };
}

function barChart(months, by, key = 'rev', key2 = 'profit') {
  const W = 720, H = 240, pad = 34; const max = Math.max(1, ...months.map((k) => by[k][key]));
  const bw = (W - pad * 2) / months.length;
  const order = he() ? months.slice().reverse() : months;
  return raw(`<svg viewBox="0 0 ${W} ${H + 24}" role="img" aria-label="${T('גרף הכנסות ורווח חודשי', 'Monthly revenue and profit chart')}">
    ${[0, .25, .5, .75, 1].map((f) => `<line x1="${pad}" x2="${W - pad}" y1="${H - f * (H - 20)}" y2="${H - f * (H - 20)}" stroke="#eee6da"/>`).join('')}
    ${order.map((k, i) => { const v = by[k][key], v2 = by[k][key2]; const h = (v / max) * (H - 20), h2 = (Math.max(0, v2) / max) * (H - 20); const x = pad + i * bw + bw * .18;
      return `<g><title>${monthName(k)}: ${Math.round(v)}₪ / ${Math.round(v2)}₪</title><rect x="${x}" y="${H - h}" width="${bw * .32}" height="${h}" fill="#16130F" rx="2"/><rect x="${x + bw * .34}" y="${H - h2}" width="${bw * .32}" height="${h2}" fill="#A9874F" rx="2"/><text x="${x + bw * .33}" y="${H + 16}" text-anchor="middle">${monthName(k)}</text></g>`; }).join('')}
  </svg>`);
}

const delta = (a, b) => { const p = pct(a, b); return html`<span class="delta ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}%</span>`; };

export function dashboard() {
  const months = lastMonths(12); const { by, prod } = stats(months);
  const cur = by[months.at(-1)], prev = by[months.at(-2)];
  const aov = (b) => (b.n ? b.rev / b.n : 0);
  const top = Object.entries(prod).map(([id, p]) => ({ id, ...p, q: p.months[months.at(-1)].q + p.months[months.at(-2)].q })).sort((a, b) => b.q - a.q).slice(0, 5);
  const recent = db.orders().slice(0, 6);
  const pending = db.orders().filter((o) => o.status === 'new').length;
  return shell('admin', T('לוח בקרה', 'Dashboard'), html`
    <div class="kpis">
      <div class="kpi"><small>${T('הכנסות החודש', 'Revenue this month')}</small><b>${m(cur.rev)}</b>${delta(cur.rev, prev.rev)}</div>
      <div class="kpi"><small>${T('רווח גולמי', 'Gross profit')}</small><b>${m(cur.profit)}</b>${delta(cur.profit, prev.profit)}</div>
      <div class="kpi"><small>${T('הזמנות', 'Orders')}</small><b>${cur.n}</b>${delta(cur.n, prev.n)}</div>
      <div class="kpi"><small>${T('סל ממוצע', 'Avg. order')}</small><b>${m(Math.round(aov(cur)))}</b>${delta(aov(cur), aov(prev))}</div>
    </div>
    <div class="panel chart"><div class="panel-head"><h2>${T('הכנסות ורווח — 12 חודשים', 'Revenue & profit — 12 months')}</h2><small><span aria-hidden="true">■</span> ${T('שחור: הכנסות · זהב: רווח', 'Black: revenue · Gold: profit')}</small></div>${barChart(months, by)}</div>
    <div class="row2">
      <div class="panel"><div class="panel-head"><h2>${T('מוצרים מובילים', 'Top products')}</h2><a href="#/admin/reports">${T('לדוח המלא', 'Full report')}</a></div>
        <table class="tbl"><tbody>${top.map((p) => html`<tr><td>${L(p.name)}</td><td>${p.months[months.at(-1)].q} ${T('יח׳', 'pcs')}</td><td>${delta(p.months[months.at(-1)].q, p.months[months.at(-2)].q)}</td></tr>`)}</tbody></table></div>
      <div class="panel"><div class="panel-head"><h2>${T('הזמנות אחרונות', 'Recent orders')}</h2><a href="#/orders">${pending} ${T('ממתינות', 'pending')}</a></div>
        <table class="tbl"><tbody>${recent.map((o) => html`<tr><td>#${o.num}</td><td>${o.customer.name}</td><td>${m(o.total)}</td><td><span class="pill st-${o.status}">${statusLabel(o.status)}</span></td></tr>`)}</tbody></table></div>
    </div>`);
}

export function reports(range = 6) {
  const months = lastMonths(range); const { by, prod } = stats(months);
  const rows = Object.entries(prod).map(([id, p]) => ({ id, ...p, total: months.reduce((a, k) => a + p.months[k].q, 0), rev: months.reduce((a, k) => a + p.months[k].r, 0) })).sort((a, b) => b.rev - a.rev);
  const sum = months.reduce((a, k) => ({ rev: a.rev + by[k].rev, profit: a.profit + by[k].profit, n: a.n + by[k].n }), { rev: 0, profit: 0, n: 0 });
  return shell('admin/reports', T('דוחות מכירות', 'Sales reports'), html`
    <div class="kpis">
      <div class="kpi"><small>${T('הכנסות בתקופה', 'Period revenue')}</small><b>${m(sum.rev)}</b></div>
      <div class="kpi"><small>${T('רווח גולמי', 'Gross profit')}</small><b>${m(sum.profit)}</b><small>${sum.rev ? Math.round((sum.profit / sum.rev) * 100) : 0}% ${T('מרווח', 'margin')}</small></div>
      <div class="kpi"><small>${T('הזמנות', 'Orders')}</small><b>${sum.n}</b></div>
      <div class="kpi"><small>${T('מוצרים שנמכרו', 'Products sold')}</small><b>${rows.reduce((a, r) => a + r.total, 0)}</b></div>
    </div>
    <div class="panel"><div class="panel-head"><h2>${T('סיכום חודשי', 'Monthly summary')}</h2></div><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>${T('חודש', 'Month')}</th><th>${T('הזמנות', 'Orders')}</th><th>${T('יחידות', 'Units')}</th><th>${T('הכנסות', 'Revenue')}</th><th>${T('רווח', 'Profit')}</th><th>${T('שינוי', 'Change')}</th></tr></thead>
      <tbody>${months.slice().reverse().map((k, i, arr) => html`<tr><td>${monthName(k)}</td><td>${by[k].n}</td><td>${by[k].units}</td><td>${m(by[k].rev)}</td><td>${m(by[k].profit)}</td><td>${arr[i + 1] ? delta(by[k].rev, by[arr[i + 1]].rev) : '—'}</td></tr>`)}</tbody></table></div></div>
    <div class="panel"><div class="panel-head"><h2>${T('רכישות לפי מוצר וחודש (יחידות · % שינוי)', 'Purchases by product & month (units · % change)')}</h2><button class="btn sm ghost" data-action="export-csv" data-range="${range}">CSV ⇩</button></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${T('מוצר', 'Product')}</th>${months.map((k) => html`<th>${monthName(k)}</th>`)}<th>${T('סה״כ', 'Total')}</th><th>${T('הכנסות', 'Revenue')}</th></tr></thead>
      <tbody>${rows.map((r) => html`<tr><td>${L(r.name)}</td>${months.map((k, i) => html`<td>${r.months[k].q}${i ? html`<br>${delta(r.months[k].q, r.months[months[i - 1]].q)}` : ''}</td>`)}<td><b>${r.total}</b></td><td>${m(r.rev)}</td></tr>`)}</tbody></table></div></div>`,
    html`<label class="sr-only" for="range">${T('טווח', 'Range')}</label><select class="input" id="range" data-input="range">${[3, 6, 12].map((n) => html`<option value="${n}" ${raw(n === range ? 'selected' : '')}>${n} ${T('חודשים', 'months')}</option>`)}</select><button class="btn sm ghost" data-action="print">${T('הדפסה', 'Print')}</button>`);
}

export function reportCSV(range) {
  const months = lastMonths(range); const { prod } = stats(months);
  const q = (s) => `"${String(s).replace(/"/g, '""').replace(/^[=+\-@]/, "'$&")}"`;
  const lines = [[T('מוצר', 'Product'), ...months, T('סה״כ', 'Total')].map(q).join(',')];
  for (const p of Object.values(prod)) lines.push([L(p.name), ...months.map((k) => p.months[k].q), months.reduce((a, k) => a + p.months[k].q, 0)].map(q).join(','));
  return '﻿' + lines.join('\n');
}

export function productsAdmin(cat = '', q = '') {
  let list = db.products();
  if (cat) list = list.filter((p) => p.cat === cat);
  if (q) list = list.filter((p) => (p.name.he + p.name.en + p.id).toLowerCase().includes(q.toLowerCase()));
  return shell('admin/products', T('ניהול מוצרים', 'Products'), html`
    <div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>${T('מוצר', 'Product')}</th><th>${T('קטגוריה', 'Category')}</th><th>${T('גדלים ומחירים', 'Sizes & prices')}</th><th>${T('מלאי', 'Stock')}</th><th>${T('סטטוס', 'Status')}</th><th></th></tr></thead>
    <tbody>${list.map((p) => html`<tr><td><div class="thumb">${media(p)}</div></td><td><b>${L(p.name)}</b><br><small class="muted">${p.id}</small></td><td>${L(CATEGORIES.find((c) => c.id === p.cat))}</td>
      <td>${p.sizes.map((s) => html`<div><small>${s.label}: ${m(s.price)} · ${T('סיט׳', 'WS')} ${m(s.wholesale || 0)}</small></div>`)}</td><td>${p.stock ?? '—'}</td>
      <td><span class="pill ${p.active === false ? 'st-cancelled' : 'st-delivered'}">${p.active === false ? T('מוסתר', 'Hidden') : T('פעיל', 'Active')}</span></td>
      <td><button class="btn sm ghost" data-action="edit-product" data-id="${p.id}">${T('עריכה', 'Edit')}</button></td></tr>`)}</tbody></table></div></div>`,
    html`<label class="sr-only" for="pcat">${T('קטגוריה', 'Category')}</label><select class="input" id="pcat" data-input="pcat"><option value="">${T('כל הקטגוריות', 'All categories')}</option>${CATEGORIES.map((c) => html`<option value="${c.id}" ${raw(cat === c.id ? 'selected' : '')}>${L(c)}</option>`)}</select>
    <label class="sr-only" for="pq">${T('חיפוש', 'Search')}</label><input class="input" id="pq" type="search" value="${q}" placeholder="${T('חיפוש…', 'Search…')}" data-input="pq">
    <button class="btn sm" data-action="edit-product" data-id="">+ ${T('מוצר חדש', 'New product')}</button>`);
}

export function productForm(p) {
  p ||= { id: '', cat: 'oils', name: { he: '', en: '' }, desc: { he: '', en: '' }, notes: [], sizes: [{ label: '100ml', price: 0, wholesale: 0, cost: 0 }], img: '', active: true, stock: 0 };
  const f = (n, l, v, type = 'text') => html`<div class="field"><label for="pf-${n}">${l}</label><input class="input" id="pf-${n}" name="${n}" type="${type}" value="${v}" maxlength="300"></div>`;
  return html`<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="pf-t"><h2 id="pf-t">${p.id ? T('עריכת מוצר', 'Edit product') : T('מוצר חדש', 'New product')}</h2>
    <form data-form="product" data-id="${p.id}">
      <div class="row2">${f('he', T('שם בעברית', 'Hebrew name'), p.name.he)}${f('en', T('שם באנגלית', 'English name'), p.name.en)}</div>
      <div class="row2"><div class="field"><label for="pf-cat">${T('קטגוריה', 'Category')}</label><select class="input" id="pf-cat" name="cat">${CATEGORIES.map((c) => html`<option value="${c.id}" ${raw(p.cat === c.id ? 'selected' : '')}>${L(c)}</option>`)}</select></div>${f('stock', T('מלאי', 'Stock'), p.stock ?? 0, 'number')}</div>
      <div class="field"><label for="pf-dhe">${T('תיאור בעברית', 'Hebrew description')}</label><textarea class="input" id="pf-dhe" name="dhe" rows="2" maxlength="800">${p.desc.he}</textarea></div>
      <div class="field"><label for="pf-den">${T('תיאור באנגלית', 'English description')}</label><textarea class="input" id="pf-den" name="den" rows="2" maxlength="800">${p.desc.en}</textarea></div>
      ${f('notes', T('תווי ריח (מופרדים בפסיק)', 'Notes (comma separated)'), (p.notes || []).join(', '))}
      ${f('img', T('נתיב תמונה (assets/products/…)', 'Image path (assets/products/…)'), p.img)}
      <div class="field"><label for="pf-sizes">${T('גדלים — שורה לכל גודל: גודל | מחיר | סיטונאי | עלות', 'Sizes — one per line: size | price | wholesale | cost')}</label>
        <textarea class="input" id="pf-sizes" name="sizes" rows="4" dir="ltr">${p.sizes.map((s) => `${s.label} | ${s.price} | ${s.wholesale || 0} | ${s.cost || 0}`).join('\n')}</textarea></div>
      <div class="row2"><div class="field"><label for="pf-tag">${T('תגית', 'Badge')}</label><select class="input" id="pf-tag" name="tag"><option value="">—</option><option value="new" ${raw(p.tag === 'new' ? 'selected' : '')}>${T('חדש', 'New')}</option><option value="best" ${raw(p.tag === 'best' ? 'selected' : '')}>${T('רב מכר', 'Bestseller')}</option></select></div>
      <label class="check"><input type="checkbox" name="active" ${raw(p.active !== false ? 'checked' : '')}><span>${T('מוצג באתר', 'Visible in store')}</span></label></div>
      <p class="err" id="pf-err" role="alert"></p>
      <div class="bo-filters"><button class="btn" type="submit">${T('שמירה', 'Save')}</button><button class="btn ghost" type="button" data-action="modal-close">${T('ביטול', 'Cancel')}</button>
      ${p.id ? html`<button class="btn ghost" type="button" data-action="del-product" data-id="${p.id}">${T('מחיקה', 'Delete')}</button>` : ''}</div>
    </form></div></div>`;
}

export function usersAdmin(q = '', role = '') {
  let list = db.users().map(db.publicUser);
  if (role) list = list.filter((u) => u.role === role || (role === 'ws-req' && u.wsRequest && u.role === 'customer'));
  if (q) list = list.filter((u) => (u.name + u.email + u.phone).toLowerCase().includes(q.toLowerCase()));
  const roleName = (r) => ({ customer: T('לקוח/מועדון', 'Customer'), wholesale: T('סיטונאי', 'Wholesale'), courier: T('שליח', 'Courier'), orders: T('מנהל הזמנות', 'Orders manager'), admin: T('מנהל', 'Admin') })[r];
  const spent = (id) => db.orders().filter((o) => o.userId === id && o.status !== 'cancelled').reduce((a, o) => a + o.total, 0);
  const self = db.me();
  return shell('admin/users', T('ניהול משתמשים', 'Users'), html`
    <div class="kpis"><div class="kpi"><small>${T('משתמשים', 'Users')}</small><b>${db.users().length}</b></div><div class="kpi"><small>${T('חברי מועדון', 'Club members')}</small><b>${db.users().filter((u) => u.club).length + db.clubList().length}</b></div>
    <div class="kpi"><small>${T('סיטונאים', 'Wholesale')}</small><b>${db.users().filter((u) => u.role === 'wholesale').length}</b></div><div class="kpi"><small>${T('בקשות סיטונאי', 'WS requests')}</small><b>${db.users().filter((u) => u.wsRequest && u.role === 'customer').length}</b></div></div>
    <div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${T('שם', 'Name')}</th><th>${T('פרטי קשר', 'Contact')}</th><th>${T('תפקיד', 'Role')}</th><th>${T('רכישות', 'Spent')}</th><th>${T('הצטרף', 'Joined')}</th><th></th></tr></thead>
    <tbody>${list.map((u) => html`<tr><td><b>${u.name}</b>${u.biz ? html`<br><small>${u.biz}</small>` : ''}${u.wsRequest && u.role === 'customer' ? html`<br><span class="pill st-new">${T('ביקש סיטונאי', 'WS request')}</span>` : ''}${u.blocked ? html`<br><span class="pill st-cancelled">${T('חסום', 'Blocked')}</span>` : ''}</td>
      <td><small>${u.email}<br>${u.phone}</small></td>
      <td><label class="sr-only" for="role-${u.id}">${T('תפקיד', 'Role')}</label><select class="input" id="role-${u.id}" data-input="role" data-id="${u.id}" ${raw(u.id === self.id ? 'disabled' : '')}>${db.ROLES.map((r) => html`<option value="${r}" ${raw(u.role === r ? 'selected' : '')}>${roleName(r)}</option>`)}</select></td>
      <td>${m(spent(u.id))}</td><td><small>${new Date(u.createdAt).toLocaleDateString(getLang())}</small></td>
      <td>${u.id === self.id ? '' : html`<button class="btn sm ghost" data-action="block-user" data-id="${u.id}">${u.blocked ? T('שחרור', 'Unblock') : T('חסימה', 'Block')}</button> <button class="btn sm ghost" data-action="del-user" data-id="${u.id}">${T('מחיקה', 'Delete')}</button>`}</td></tr>`)}</tbody></table></div></div>`,
    html`<label class="sr-only" for="uq">${T('חיפוש', 'Search')}</label><input class="input" id="uq" type="search" value="${q}" placeholder="${T('חיפוש…', 'Search…')}" data-input="uq">
    <label class="sr-only" for="ur">${T('סינון', 'Filter')}</label><select class="input" id="ur" data-input="ur"><option value="">${T('כולם', 'All')}</option><option value="ws-req" ${raw(role === 'ws-req' ? 'selected' : '')}>${T('בקשות סיטונאי', 'WS requests')}</option>${db.ROLES.map((r) => html`<option value="${r}" ${raw(role === r ? 'selected' : '')}>${roleName(r)}</option>`)}</select>`);
}

// ---------- Orders manager ----------
export function ordersBoard(state) {
  const { view = 'board', month = monthKey(Date.now()), q = '', status = '' } = state;
  let list = db.orders();
  const months = [...new Set(list.map((o) => monthKey(o.date)))];
  if (!months.includes(monthKey(Date.now()))) months.unshift(monthKey(Date.now()));
  if (month !== 'all') list = list.filter((o) => monthKey(o.date) === month);
  if (status) list = list.filter((o) => o.status === status);
  if (q) list = list.filter((o) => (o.num + o.customer.name + o.customer.phone + o.customer.city).toLowerCase().includes(q.toLowerCase()));
  const newCount = db.orders().filter((o) => o.status === 'new').length;
  const cols = ['new', 'processing', 'ready', 'shipped', 'delivered'];
  const next = { new: 'processing', processing: 'ready', ready: 'shipped', shipped: 'delivered' };
  const ocard = (o) => html`<div class="ocard"><div class="panel-head"><b>#${o.num}</b><small>${dt(o.date)}</small></div>
    <div>${o.customer.name} · ${o.customer.city}</div><div><b>${m(o.total)}</b> · ${o.items.reduce((a, i) => a + i.qty, 0)} ${T('פריטים', 'items')}</div>
    <div class="acts"><button class="btn sm ghost" data-action="order-view" data-id="${o.id}">${T('פרטים', 'Details')}</button>${next[o.status] ? html`<button class="btn sm" data-action="order-status" data-id="${o.id}" data-s="${next[o.status]}">→ ${statusLabel(next[o.status])}</button>` : ''}</div></div>`;
  const body = view === 'board'
    ? html`<div class="kanban">${cols.map((c) => { const os = list.filter((o) => o.status === c); return html`<section class="col" aria-label="${statusLabel(c)}"><h3>${statusLabel(c)} <span>${os.length}</span></h3>${os.slice(0, 40).map(ocard)}</section>`; })}</div>`
    : html`<div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>${T('תאריך', 'Date')}</th><th>${T('לקוח', 'Customer')}</th><th>${T('עיר', 'City')}</th><th>${T('סכום', 'Total')}</th><th>${T('תשלום', 'Payment')}</th><th>${T('סטטוס', 'Status')}</th><th></th></tr></thead>
      <tbody>${list.map((o) => html`<tr><td>${o.num}</td><td>${dt(o.date)}</td><td>${o.customer.name}<br><small>${o.customer.phone}</small></td><td>${o.customer.city}</td><td>${m(o.total)}</td><td><small>${o.payment === 'paid' ? T('שולם', 'Paid') : o.payment === 'refunded' ? T('זוכה', 'Refunded') : T('ממתין', 'Pending')}</small></td><td><span class="pill st-${o.status}">${statusLabel(o.status)}</span></td><td><button class="btn sm ghost" data-action="order-view" data-id="${o.id}">${T('פרטים', 'Details')}</button></td></tr>`)}</tbody></table></div>
      <p class="muted">${list.length} ${T('הזמנות', 'orders')} · ${m(list.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + o.total, 0))}</p></div>`;
  return shell('orders', T('ניהול הזמנות', 'Orders'), html`
    ${newCount ? html`<div class="panel" role="status"><b>🔔 ${newCount} ${T('הזמנות חדשות ממתינות לטיפול', 'new orders waiting')}</b> <button class="btn sm ghost" data-action="notes-read">${T('סמן כנקרא', 'Mark read')}</button></div>` : ''}
    ${body}`,
    html`<div class="seg" role="group" aria-label="${T('תצוגה', 'View')}"><button aria-pressed="${view === 'board'}" data-action="ov" data-v="board">${T('לוח', 'Board')}</button><button aria-pressed="${view === 'list'}" data-action="ov" data-v="list">${T('רשימה', 'List')}</button></div>
    <label class="sr-only" for="om">${T('חודש', 'Month')}</label><select class="input" id="om" data-input="om"><option value="all">${T('כל החודשים', 'All months')}</option>${months.map((k) => html`<option value="${k}" ${raw(k === month ? 'selected' : '')}>${monthName(k)}</option>`)}</select>
    <label class="sr-only" for="os">${T('סטטוס', 'Status')}</label><select class="input" id="os" data-input="os"><option value="">${T('כל הסטטוסים', 'All statuses')}</option>${db.STATUSES.map((s) => html`<option value="${s}" ${raw(s === status ? 'selected' : '')}>${statusLabel(s)}</option>`)}</select>
    <label class="sr-only" for="oq">${T('חיפוש', 'Search')}</label><input class="input" id="oq" type="search" value="${q}" placeholder="${T('מספר / שם / טלפון', 'No. / name / phone')}" data-input="oq">`);
}

export function orderModal(id) {
  const o = db.orders().find((x) => x.id === id); if (!o) return '';
  const couriers = db.users().filter((u) => u.role === 'courier');
  const waCust = `https://wa.me/972${o.customer.phone.replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`שלום ${o.customer.name}, כאן SAY Boutique לגבי הזמנה #${o.num}`)}`;
  return html`<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="om-t">
    <div class="panel-head"><h2 id="om-t">${T('הזמנה', 'Order')} #${o.num}</h2><span class="pill st-${o.status}">${statusLabel(o.status)}</span></div>
    <p><b>${o.customer.name}</b> · <a href="tel:${o.customer.phone}">${o.customer.phone}</a> · ${o.customer.email}<br>${o.customer.street}${o.customer.apt ? ', ' + o.customer.apt : ''}, ${o.customer.city}${o.customer.notes ? html`<br><small>${T('הערות', 'Notes')}: ${o.customer.notes}</small>` : ''}</p>
    <table class="tbl"><tbody>${o.items.map((i) => html`<tr><td>${L(i.name)}</td><td>${i.size}</td><td>×${i.qty}</td><td>${m(i.price * i.qty)}</td></tr>`)}
      ${o.discount ? html`<tr><td colspan="3">${T('הנחה', 'Discount')}</td><td>−${m(o.discount)}</td></tr>` : ''}<tr><td colspan="3">${T('משלוח', 'Shipping')}</td><td>${m(o.shipping)}</td></tr><tr><td colspan="3"><b>${T('סה״כ', 'Total')}</b></td><td><b>${m(o.total)}</b></td></tr></tbody></table>
    <div class="row2"><div class="field"><label for="m-st">${T('סטטוס', 'Status')}</label><select class="input" id="m-st" data-input="m-status" data-id="${o.id}">${db.STATUSES.map((s) => html`<option value="${s}" ${raw(o.status === s ? 'selected' : '')}>${statusLabel(s)}</option>`)}</select></div>
    <div class="field"><label for="m-c">${T('שליח', 'Courier')}</label><select class="input" id="m-c" data-input="m-courier" data-id="${o.id}"><option value="">—</option>${couriers.map((c) => html`<option value="${c.id}" ${raw(o.courierId === c.id ? 'selected' : '')}>${c.name}</option>`)}</select></div></div>
    <details><summary>${T('היסטוריה', 'History')}</summary><ul>${o.history.map((h) => html`<li>${dt(h.at)} — ${statusLabel(h.s)}</li>`)}</ul></details>
    <div class="bo-filters no-print"><a class="btn sm" href="${waCust}" target="_blank" rel="noopener noreferrer">WhatsApp ${T('ללקוח', 'customer')}</a><button class="btn sm ghost" data-action="print">${T('הדפסת תעודת משלוח', 'Print slip')}</button><button class="btn sm ghost" data-action="modal-close">${T('סגירה', 'Close')}</button></div>
  </div></div>`;
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
      ${o.customer.notes ? html`<p><small>📝 ${o.customer.notes}</small></p>` : ''}
      ${tab === 'todo' ? html`<div class="big">
        <a href="https://waze.com/ul?q=${encodeURIComponent(addr(o))}&navigate=yes" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">🧭</span>Waze</a>
        <a href="tel:${o.customer.phone}"><span aria-hidden="true">📞</span>${T('חיוג', 'Call')}</a>
        ${o.status === 'ready' ? html`<button data-action="order-status" data-id="${o.id}" data-s="shipped"><span aria-hidden="true">📦</span>${T('נאסף', 'Picked up')}</button>` : html`<button class="done" data-action="order-status" data-id="${o.id}" data-s="delivered"><span aria-hidden="true">✓</span>${T('נמסר', 'Delivered')}</button>`}
      </div>` : ''}</article>`) : html`<p class="muted">${T('אין משלוחים כרגע', 'No deliveries right now')} ✦</p>`}
  </div>`);
}

export const orderAlertLink = (o) => `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(`🔔 הזמנה חדשה #${o.num}\n${o.customer.name} · ${o.customer.phone}\n${o.customer.street}, ${o.customer.city}\nסה"כ: ${o.total}₪`)}`;
