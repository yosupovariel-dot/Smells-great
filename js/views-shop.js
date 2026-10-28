import { html, raw, money, valid, clean, toast, PHONE_DISPLAY, PHONE_INTL, FREE_SHIP } from './util.js';
import { t, L, getLang } from './i18n.js';
import { CATEGORIES, COMPLEMENTS, artSVG, catIcon } from './data.js';
import * as db from './db.js';

const m = (n) => money(n, getLang());
export const media = (p, cls = '', eager = false) =>
  p.img
    ? html`<img src="${p.img}" alt="${L(p.name)}" width="800" height="1000" ${raw(eager ? 'fetchpriority="high"' : 'loading="lazy"')} decoding="async" class="${cls}">`
    : raw(artSVG(p, cls));
const catName = (id) => L(CATEGORIES.find((c) => c.id === id));
const active = () => db.products().filter((p) => p.active !== false);

export function card(p) {
  const u = db.me(); const s = p.sizes[0];
  const showWs = u?.role === 'wholesale' && s.wholesale;
  return html`<article class="card">
    <a class="card-media" href="#/product/${p.id}" tabindex="-1" aria-hidden="true">${media(p)}</a>
    ${p.tag ? html`<span class="card-tag">${t('tag_' + p.tag)}</span>` : ''}
    <div class="card-quick"><button class="btn block sm" data-action="quick-add" data-id="${p.id}" aria-label="${t('quickAdd')}: ${L(p.name)}">${t('quickAdd')}</button></div>
    <div class="card-body">
      <small class="muted">${catName(p.cat)}</small>
      <h3><a href="#/product/${p.id}">${L(p.name)}</a></h3>
      <span class="price">${p.sizes.length > 1 ? (getLang() === 'he' ? 'החל מ־' : 'From ') : ''}${m(showWs ? s.wholesale : s.price)}${showWs ? html`<s>${m(s.price)}</s>` : ''}</span>
    </div>
  </article>`;
}

export function home() {
  const all = active();
  const best = all.filter((p) => p.tag === 'best').concat(all).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
  const fresh = all.filter((p) => p.tag === 'new').concat(all.slice().reverse()).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
  const heroP = all.find((p) => p.cat === 'sticks') || all[0];
  const words = ['White Tea', 'Black Orchid', 'Royal Oud', 'Fig Tree', 'Santal', 'Amber Nights', 'Clean Linen'];
  return html`
  <section class="hero" aria-labelledby="hero-t">
    <div class="hero-copy">
      <p class="eyebrow latin">${t('heroEyebrow')}</p>
      <h1 id="hero-t">${t('heroTitle1')}<br><em>${t('heroTitle2')}</em></h1>
      <span class="rule"></span>
      <p>${t('heroText')}</p>
      <div class="hero-cta"><a class="btn" href="#/shop">${t('shopNow')}</a><a class="btn ghost" href="#/shop/oils">${t('discover')}</a></div>
    </div>
    <div class="hero-art" aria-hidden="true">
      <div class="arch"></div>
      <img class="hero-mark" src="assets/img/mark.webp" alt="" width="180" height="156">
      ${heroP?.img ? html`<img src="${heroP.img}" alt="" width="600" height="750" fetchpriority="high">` : raw(artSVG(heroP || { cat: 'sticks', name: {} }, 'hero-bottle').replace('preserveAspectRatio="xMidYMid slice"', '').replace(/<rect width="200" height="250"[^>]*\/>/, '').replace(/<path d="M40 250[^>]*\/>/, ''))}
    </div>
    <div class="hero-meta"><span>EST. 2024</span><span>TEL AVIV</span><span>${PHONE_DISPLAY}</span></div>
  </section>
  <div class="marquee" aria-hidden="true"><div>${[...words, ...words].map((w) => html`<span>${w}</span><span>✦</span>`)}</div></div>
  <section class="block" aria-labelledby="cats-t"><div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">SAY Boutique</p><h2 id="cats-t">${t('categories')}</h2></div></div>
    <nav class="cats" aria-label="${t('categories')}">${CATEGORIES.map((c) => html`<a class="cat" href="#/shop/${c.id}">${raw(catIcon(c.id))}<span>${L(c)}</span><small>${getLang() === 'he' ? c.descHe : c.descEn}</small></a>`)}</nav>
  </div></section>
  <section class="block" aria-labelledby="best-t"><div class="wrap">
    <div class="sec-head"><h2 id="best-t">${t('bestsellers')}</h2><a href="#/shop">${t('viewAll')} ←</a></div>
    <div class="grid">${best.map(card)}</div>
  </div></section>
  <div class="wrap"><div class="features">
    <div><b>${t('f1')}</b><span>${t('f1s')}</span></div><div><b>${t('f2')}</b><span>${t('f2s')}</span></div>
    <div><b>${t('f3')}</b><span>${t('f3s')}</span></div><div><b>${t('f4')}</b><span>${t('f4s')}</span></div>
  </div></div>
  <section class="block" aria-labelledby="story-t"><div class="wrap story">
    <div class="story-art" aria-hidden="true"><img src="assets/img/logo.webp" alt="" width="290" height="450" loading="lazy"></div>
    <div><p class="eyebrow">${t('storyEyebrow')}</p><h2 id="story-t">${t('storyTitle')}</h2><span class="rule"></span><p>${t('storyText')}</p><a class="btn ghost" href="#/about">${t('about')}</a></div>
  </div></section>
  <section class="block" aria-labelledby="new-t"><div class="wrap">
    <div class="sec-head"><h2 id="new-t">${t('newIn')}</h2><a href="#/shop">${t('viewAll')} ←</a></div>
    <div class="grid">${fresh.map(card)}</div>
  </div></section>
  ${clubBlock()}`;
}

export const clubBlock = () => html`<section class="block club" aria-labelledby="club-t"><div class="wrap">
  <p class="eyebrow latin">Members Club</p><h2 id="club-t">${t('clubTitle')}</h2><p>${t('clubText')}</p>
  <form data-form="club" novalidate><label class="sr-only" for="club-email">${t('email')}</label>
  <input class="input" id="club-email" name="email" type="email" autocomplete="email" required placeholder="${t('email')}" maxlength="120">
  <button class="btn" type="submit">${t('clubBtn')}</button></form>
  <p class="sr-only" aria-live="polite" id="club-msg"></p>
</div></section>`;

export function shop(cat, q = '', sort = 'pop') {
  let list = active();
  if (cat) list = list.filter((p) => p.cat === cat);
  if (q) { const s = q.toLowerCase(); list = list.filter((p) => (p.name.he + ' ' + p.name.en + ' ' + (p.notes || []).join(' ')).toLowerCase().includes(s)); }
  const price = (p) => p.sizes[0].price;
  if (sort === 'low') list.sort((a, b) => price(a) - price(b));
  if (sort === 'high') list.sort((a, b) => price(b) - price(a));
  if (sort === 'name') list.sort((a, b) => L(a.name).localeCompare(L(b.name), getLang()));
  const count = (c) => active().filter((p) => !c || p.cat === c).length;
  return html`<div class="wrap">
    <div class="crumbs"><a href="#/">${t('home')}</a> / ${cat ? catName(cat) : t('shop')}</div>
    <h1>${cat ? catName(cat) : t('shop')}</h1>
    <div class="shop">
      <aside class="filters" aria-label="${t('categories')}"><h2>${t('categories')}</h2><ul>
        <li><a href="#/shop" aria-current="${!cat}">${t('all')} <span>${count()}</span></a></li>
        ${CATEGORIES.map((c) => html`<li><a href="#/shop/${c.id}" aria-current="${cat === c.id}">${L(c)} <span>${count(c.id)}</span></a></li>`)}
      </ul></aside>
      <div>
        <div class="toolbar">
          <div><label class="sr-only" for="q">${t('search')}</label><input class="input" id="q" type="search" value="${q}" placeholder="${t('search')}…" data-input="search" maxlength="60"></div>
          <div><label for="sort" class="muted">${t('sortBy')}: </label><select class="input" id="sort" data-input="sort">
            ${[['pop', 'sortPop'], ['low', 'sortLow'], ['high', 'sortHigh'], ['name', 'sortName']].map(([v, k]) => html`<option value="${v}" ${raw(sort === v ? 'selected' : '')}>${t(k)}</option>`)}
          </select></div>
        </div>
        <p class="muted" aria-live="polite">${list.length} ${t('results')}</p>
        ${list.length ? html`<div class="grid">${list.map(card)}</div>` : html`<p>${t('noResults')}</p>`}
      </div>
    </div></div><div class="block"></div>`;
}

export function complements(p, n = 4) {
  const all = active().filter((x) => x.id !== p.id);
  const picks = [];
  for (const c of (p.related?.length ? [] : COMPLEMENTS[p.cat] || [])) {
    const x = all.find((y) => y.cat === c && !picks.includes(y)); if (x) picks.push(x);
  }
  for (const id of p.related || []) { const x = db.product(id); if (x) picks.push(x); }
  for (const x of all) if (picks.length < n && !picks.includes(x) && x.cat === p.cat) picks.push(x);
  return picks.slice(0, n);
}

export function productPage(id) {
  const p = db.product(id);
  if (!p || p.active === false) return null;
  const u = db.me(); const ws = u?.role === 'wholesale';
  const s0 = p.sizes[0];
  const notes = p.notes || [];
  return html`<div class="wrap"><div class="pdp">
    <div class="pdp-media" data-zoom>${media(p, '', true)}</div>
    <div>
      <div class="crumbs"><a href="#/">${t('home')}</a> / <a href="#/shop/${p.cat}">${catName(p.cat)}</a></div>
      <p class="eyebrow">${catName(p.cat)}</p>
      <h1>${L(p.name)}</h1>
      <p class="price" id="pdp-price" aria-live="polite">${m(ws && s0.wholesale ? s0.wholesale : s0.price)}${ws && s0.wholesale ? html`<s>${m(s0.price)}</s><span class="ws">${t('wsPrice')}</span>` : ''}</p>
      <p>${L(p.desc)}</p>
      ${notes.length >= 3 ? html`<div class="notes" aria-label="${t('notes')}"><div><b>${t('top')}</b>${notes[0]}</div><div><b>${t('heart')}</b>${notes[1]}</div><div><b>${t('base')}</b>${notes[2]}</div></div>` : ''}
      <form data-form="add" data-id="${p.id}">
        <fieldset class="sizes"><legend>${t('size')}</legend>
          ${p.sizes.map((s, i) => html`<label class="size-opt"><input type="radio" name="size" value="${s.label}" ${raw(i ? '' : 'checked')} data-input="size" data-price="${ws && s.wholesale ? s.wholesale : s.price}"><span>${s.label}</span></label>`)}
        </fieldset>
        <div class="buy-row">
          <div class="qty"><button type="button" data-action="qty" data-d="-1" aria-label="${t('decrease')}">−</button><label class="sr-only" for="qty">${t('qty')}</label><input id="qty" name="qty" inputmode="numeric" value="1" maxlength="2"><button type="button" data-action="qty" data-d="1" aria-label="${t('increase')}">+</button></div>
          <button class="btn" type="submit" ${raw(p.stock === 0 ? 'disabled' : '')}>${p.stock === 0 ? t('outStock') : t('addToCart')}</button>
        </div>
      </form>
      <ul class="perks"><li>${t('perk1')}</li><li>${t('perk2')}</li><li>${t('perk3')}</li></ul>
    </div>
  </div>
  <section class="block" aria-labelledby="comp-t"><h2 id="comp-t">${t('complements')}</h2><span class="rule"></span><div class="grid">${complements(p).map(card)}</div></section></div>`;
}

export function cartDrawer() {
  const tt = db.cartTotals();
  const left = Math.max(0, FREE_SHIP - (tt.subtotal - tt.discount));
  const ratio = Math.min(1, (tt.subtotal - tt.discount) / FREE_SHIP);
  const ups = tt.lines.length ? complements(tt.lines[0].p, 6).filter((x) => !tt.lines.some((l) => l.pid === x.id)).slice(0, 2) : [];
  return html`<header><h2 id="cart-t">${t('cart')}</h2><button class="icon-btn" data-action="cart-close" aria-label="${t('close')}">✕</button></header>
  <div class="drawer-body">
    ${tt.lines.length ? html`
      <p class="muted">${left ? t('toFree', { x: m(left) }) : t('gotFree')}</p>
      <div class="progress" aria-hidden="true"><i class="pbar" data-ratio="${ratio}"></i></div>
      ${tt.lines.map((l, i) => html`<div class="line">
        <div class="line-media">${media(l.p)}</div>
        <div><h3>${L(l.p.name)}</h3><small class="muted">${l.size}</small>
          <div class="qty"><button data-action="line-qty" data-i="${i}" data-d="-1" aria-label="${t('decrease')}">−</button><input aria-label="${t('qty')}" value="${l.qty}" readonly><button data-action="line-qty" data-i="${i}" data-d="1" aria-label="${t('increase')}">+</button></div></div>
        <div><b>${m(l.price * l.qty)}</b><br><button class="link-btn" data-action="line-rm" data-i="${i}">${t('remove')}</button></div>
      </div>`)}
      ${ups.length ? html`<div class="upsell"><h3>${t('youMayLike')}</h3>${ups.map((x) => html`<div class="mini"><div class="line-media">${media(x)}</div><div><a href="#/product/${x.id}">${L(x.name)}</a><br><small>${m(x.sizes[0].price)}</small></div><button class="btn sm ghost" data-action="quick-add" data-id="${x.id}" aria-label="${t('addToCart')}: ${L(x.name)}">+</button></div>`)}</div>` : ''}
    ` : html`<p>${t('cartEmpty')}</p><a class="btn ghost" href="#/shop" data-action="cart-close">${t('continueShop')}</a>`}
  </div>
  ${tt.lines.length ? html`<footer>${totalsBlock(tt)}<a class="btn block" href="#/checkout" data-action="cart-close">${t('checkout')}</a></footer>` : ''}`;
}

export const totalsBlock = (tt) => html`<div class="totals">
  <div><span>${t('subtotal')}</span><span>${m(tt.subtotal)}</span></div>
  ${tt.discount ? html`<div><span>${t('discount')} (10%)</span><span>−${m(tt.discount)}</span></div>` : ''}
  <div><span>${t('shipping')}</span><span>${tt.shipping ? m(tt.shipping) : t('free')}</span></div>
  <div class="grand"><span>${t('total')}</span><span>${m(tt.total)}</span></div></div>`;

export function checkout() {
  const tt = db.cartTotals(); const u = db.me();
  if (!tt.lines.length) return html`<div class="wrap legal"><h1>${t('checkoutTitle')}</h1><p>${t('cartEmpty')}</p><a class="btn" href="#/shop">${t('continueShop')}</a></div>`;
  const f = (id, label, type = 'text', ac = '', req = true, val = '') => html`<div class="field"><label for="${id}">${label}${req ? ' *' : ''}</label><input class="input" id="${id}" name="${id}" type="${type}" autocomplete="${ac}" ${raw(req ? 'required aria-required="true"' : '')} value="${val}" maxlength="120" aria-describedby="${id}-e"><span class="err" id="${id}-e" aria-live="polite"></span></div>`;
  return html`<div class="wrap"><h1 class="sr-only">${t('checkoutTitle')}</h1><div class="checkout">
    <form data-form="checkout" novalidate>
      <h2>${t('details')}</h2>
      <div class="row2">${f('name', t('fullName'), 'text', 'name', true, u?.name || '')}${f('phone', t('phone'), 'tel', 'tel', true, u?.phone || '')}</div>
      ${f('email', t('email'), 'email', 'email', true, u?.email || '')}
      <div class="row2">${f('city', t('city'), 'text', 'address-level2')}${f('street', t('street'), 'text', 'street-address')}</div>
      ${f('apt', t('apt'), 'text', 'off', false)}
      <div class="field"><label for="notes">${t('notesF')}</label><textarea class="input" id="notes" name="notes" rows="2" maxlength="300"></textarea></div>
      <h2>${t('payment')}</h2><p class="muted">${t('payNote')}</p>
      <label class="check"><input type="checkbox" name="agree" required aria-describedby="agree-e"><span>${t('agree')}<a href="#/terms" target="_blank">${t('terms')}</a>${t('and')}<a href="#/privacy" target="_blank">${t('privacy')}</a> *</span></label>
      <span class="err" id="agree-e" aria-live="polite"></span>
      <button class="btn block gold" type="submit">${t('placeOrder')} · ${m(tt.total)}</button>
      <p class="secure-note"><span aria-hidden="true">🔒</span>${t('secure')}</p>
    </form>
    <aside class="summary" aria-label="${t('cart')}">${tt.lines.map((l) => html`<div class="mini"><div class="line-media">${media(l.p)}</div><div>${L(l.p.name)}<br><small class="muted">${l.size} × ${l.qty}</small></div><b>${m(l.price * l.qty)}</b></div>`)}<hr>${totalsBlock(tt)}</aside>
  </div></div>`;
}

export function checkoutSubmit(form) {
  const d = Object.fromEntries(new FormData(form));
  const errs = {};
  if (!valid.name(d.name)) errs.name = t('required');
  if (!valid.phone(d.phone)) errs.phone = t('badPhone');
  if (!valid.email(d.email)) errs.email = t('badEmail');
  if (!clean(d.city)) errs.city = t('required');
  if (!clean(d.street)) errs.street = t('required');
  if (!d.agree) errs.agree = t('mustAgree');
  form.querySelectorAll('.err').forEach((e) => (e.textContent = ''));
  form.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
  const keys = Object.keys(errs);
  if (keys.length) {
    keys.forEach((k) => { form.querySelector(`#${k}-e`).textContent = errs[k]; form.elements[k]?.setAttribute('aria-invalid', 'true'); });
    form.elements[keys[0]]?.focus(); return null;
  }
  const customer = { name: clean(d.name, 80), phone: clean(d.phone, 20), email: clean(d.email, 120), city: clean(d.city, 60), street: clean(d.street, 120), apt: clean(d.apt, 40), notes: clean(d.notes, 300) };
  return db.placeOrder(customer);
}

export function orderDone(o) {
  const wa = `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(`הזמנה חדשה #${o.num} — ${o.customer.name}, ${o.customer.phone}, סה"כ ${o.total}₪`)}`;
  return html`<div class="wrap legal" tabindex="-1" id="done"><p class="eyebrow">✦</p><h1>${t('orderOk')}</h1><p>${t('orderNum')}: <b>#${o.num}</b></p><p>${t('orderOkText')}</p>
  <div class="hero-cta"><a class="btn" href="#/shop">${t('continueShop')}</a><a class="btn ghost" href="${wa}" target="_blank" rel="noopener noreferrer">${t('whatsapp')}</a></div></div>`;
}

export function account(tab = 'login') {
  const u = db.me();
  if (u) {
    const mine = db.orders().filter((o) => o.userId === u.id);
    const staff = { admin: '#/admin', orders: '#/orders', courier: '#/courier' }[u.role];
    return html`<div class="wrap legal"><p class="eyebrow">${t('clubMember')}</p><h1>${t('hello')}, ${u.name}</h1>
      ${u.wsRequest && u.role === 'customer' ? html`<p class="muted">${t('wsPending')}</p>` : ''}
      ${u.firstOrderDiscount && u.role === 'customer' ? html`<p>✦ ${t('tick3')}</p>` : ''}
      ${staff ? html`<p><a class="btn gold" href="${staff}">${t('backoffice')}</a></p>` : ''}
      <h2>${t('myOrders')}</h2>
      ${mine.length ? html`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>${getLang() === 'he' ? 'תאריך' : 'Date'}</th><th>${t('total')}</th><th>${getLang() === 'he' ? 'סטטוס' : 'Status'}</th></tr></thead><tbody>
        ${mine.map((o) => html`<tr><td>${o.num}</td><td>${new Date(o.date).toLocaleDateString(getLang())}</td><td>${m(o.total)}</td><td><span class="pill st-${o.status}">${statusLabel(o.status)}</span></td></tr>`)}</tbody></table></div>` : html`<p class="muted">${t('noOrders')}</p>`}
      <p><button class="btn ghost" data-action="logout">${t('logout')}</button></p></div>`;
  }
  const isLogin = tab === 'login';
  return html`<div class="wrap"><div class="auth">
    <div class="tabs" role="tablist"><button role="tab" aria-selected="${isLogin}" data-action="auth-tab" data-tab="login">${t('login')}</button><button role="tab" aria-selected="${!isLogin}" data-action="auth-tab" data-tab="register">${t('register')}</button></div>
    <h1 class="sr-only">${isLogin ? t('login') : t('register')}</h1>
    <form data-form="${isLogin ? 'login' : 'register'}" novalidate>
      ${isLogin ? '' : html`<div class="field"><label for="r-name">${t('fullName')} *</label><input class="input" id="r-name" name="name" autocomplete="name" required maxlength="80"></div>
        <div class="field"><label for="r-phone">${t('phone')} *</label><input class="input" id="r-phone" name="phone" type="tel" autocomplete="tel" required maxlength="20"></div>`}
      <div class="field"><label for="a-email">${t('email')} *</label><input class="input" id="a-email" name="email" type="email" autocomplete="email" required maxlength="120"></div>
      <div class="field"><label for="a-pass">${t('password')} *</label><input class="input" id="a-pass" name="password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required minlength="8" maxlength="128" aria-describedby="a-pass-h"><small id="a-pass-h" class="muted">${isLogin ? '' : t('badPass')}</small></div>
      ${isLogin ? '' : html`
        <label class="check"><input type="checkbox" name="wholesale" data-input="ws-toggle"><span>${t('wsRequest')}</span></label>
        <div class="field" id="biz-f" hidden><label for="r-biz">${t('bizName')}</label><input class="input" id="r-biz" name="biz" maxlength="80"></div>
        <label class="check"><input type="checkbox" name="newsletter"><span>${t('newsletter')}</span></label>
        <label class="check"><input type="checkbox" name="agree" required><span>${t('agree')}<a href="#/terms">${t('terms')}</a>${t('and')}<a href="#/privacy">${t('privacy')}</a> *</span></label>`}
      <p class="err" id="auth-err" role="alert"></p>
      <button class="btn block" type="submit">${isLogin ? t('login') : t('register')}</button>
    </form></div></div>`;
}

export const statusLabel = (s) => ({
  he: { new: 'חדשה', processing: 'בטיפול', ready: 'מוכנה למשלוח', shipped: 'בדרך', delivered: 'נמסרה', cancelled: 'בוטלה' },
  en: { new: 'New', processing: 'Processing', ready: 'Ready', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' },
})[getLang()][s] || s;

export async function authSubmit(form, kind) {
  const d = Object.fromEntries(new FormData(form)); const err = form.querySelector('#auth-err');
  err.textContent = '';
  try {
    if (kind === 'login') {
      if (!valid.email(d.email) || !d.password) throw new Error('fail');
      await db.login(d.email, d.password);
    } else {
      if (!valid.name(d.name)) throw new Error('name');
      if (!valid.phone(d.phone)) throw new Error('phone');
      if (!valid.email(d.email)) throw new Error('email');
      if (!valid.password(d.password)) throw new Error('pass');
      if (!d.agree) throw new Error('agree');
      await db.register({ name: clean(d.name, 80), phone: clean(d.phone, 20), email: clean(d.email, 120), password: d.password, wholesale: !!d.wholesale, biz: clean(d.biz, 80), newsletter: !!d.newsletter });
    }
    return true;
  } catch (e) {
    err.textContent = { fail: t('loginFail'), locked: t('locked'), exists: t('exists'), name: t('fullName') + ': ' + t('required'), phone: t('badPhone'), email: t('badEmail'), pass: t('badPass'), agree: t('mustAgree') }[e.message] || t('loginFail');
    return false;
  }
}

export function contact() {
  return html`<div class="wrap legal"><p class="eyebrow">${t('contact')}</p><h1>${t('contactTitle')}</h1><p>${t('contactText')}</p>
  <p><a href="tel:${PHONE_INTL.replace('972', '+972')}">${PHONE_DISPLAY}</a> · <a href="https://wa.me/${PHONE_INTL}" target="_blank" rel="noopener noreferrer">WhatsApp</a></p>
  <form data-form="contact" novalidate>
    <div class="row2"><div class="field"><label for="c-name">${t('fullName')} *</label><input class="input" id="c-name" name="name" required maxlength="80" autocomplete="name"></div>
    <div class="field"><label for="c-phone">${t('phone')} *</label><input class="input" id="c-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel"></div></div>
    <div class="field"><label for="c-msg">${t('message')} *</label><textarea class="input" id="c-msg" name="msg" rows="5" required maxlength="1000"></textarea></div>
    <p class="err" id="c-err" role="alert"></p>
    <button class="btn" type="submit">${t('send')}</button></form></div>`;
}

export function about() {
  return html`<div class="wrap"><section class="block story"><div class="story-art" aria-hidden="true"><img src="assets/img/logo.webp" alt="" width="290" height="450"></div>
  <div><p class="eyebrow">${t('storyEyebrow')}</p><h1>${t('storyTitle')}</h1><span class="rule"></span><p>${t('storyText')}</p><a class="btn" href="#/shop">${t('shopNow')}</a></div></section></div>${clubBlock()}`;
}

export function wholesalePage() {
  return html`<div class="wrap legal"><p class="eyebrow latin">B2B</p><h1>${t('wsTitle')}</h1><span class="rule"></span><p>${t('wsText')}</p>
  <ul class="perks"><li>${getLang() === 'he' ? 'מחירון סיטונאי ייעודי באתר' : 'Dedicated wholesale price list'}</li><li>${getLang() === 'he' ? 'אריזות גדולות 500ml–5L' : 'Bulk sizes 500ml–5L'}</li><li>${getLang() === 'he' ? 'ליווי אישי ומיתוג לעסקים' : 'Personal account manager & branding'}</li></ul>
  <div class="hero-cta"><a class="btn" href="#/account/register">${t('wsCta')}</a><a class="btn ghost" href="https://wa.me/${PHONE_INTL}?text=${encodeURIComponent('שלום, אשמח לפרטים על הזמנה סיטונאית')}" target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div>`;
}
