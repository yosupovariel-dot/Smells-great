import { html, raw, render, $, $$, toast, trapFocus, debounce, valid, clean, PHONE_DISPLAY, PHONE_INTL } from './util.js';
import { t, getLang, setLang, applyLang } from './i18n.js';
import { CATEGORIES } from './data.js';
import * as db from './db.js';
import * as S from './views-shop.js';
import * as Lg from './views-legal.js';
import * as A from './views-admin.js';

const app = $('#app');
const state = { finder: {}, q: '', sort: 'pop', authTab: 'login', range: 6, pcat: '', pq: '', uq: '', ur: '', ov: 'list', om: 'all', metric: 'rev', os: '', oq: '', ctab: 'todo', lastOrder: null };
const ICONS = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18"/></svg>',
  wa: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><path d="M16 3a13 13 0 00-11.2 19.6L3 29l6.6-1.7A13 13 0 1016 3zm0 23.6a10.6 10.6 0 01-5.4-1.5l-.4-.2-3.9 1 1-3.8-.2-.4A10.6 10.6 0 1116 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 01-4.3-3.8c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 00-.9.4 3.6 3.6 0 00-1.1 2.7 6.3 6.3 0 001.3 3.3 14.4 14.4 0 005.5 4.9c2 .9 2.9 1 3.9.8a3.3 3.3 0 002.2-1.5 2.7 2.7 0 00.2-1.5c-.1-.1-.3-.2-.6-.3z"/></svg>',
  a11y: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="12" cy="4" r="2"/><path d="M19 8.5l-5 1v4l2.5 7h-2l-2-5.5h-1l-2 5.5h-2L10 13.5v-4l-5-1 .4-1.8L12 8l6.6-1.3z"/></svg>',
};

// ---------- Layout ----------
function header() {
  const n = db.cart().reduce((a, l) => a + l.qty, 0); const route = location.hash;
  const navLink = (href, label) => html`<a href="${href}" ${raw(route === href || (href !== '#/' && route.startsWith(href)) ? 'aria-current="page"' : '')}>${label}</a>`;
  const msgs = ['tick1', 'tick2', 'tick3', 'tick4', 'tick5'];
  return html`<a class="skip" href="#main">${t('skip')}</a>
  <div class="ticker" role="region" aria-label="${getLang() === 'he' ? 'הודעות' : 'Announcements'}"><div class="wrap">
    <div class="ticker-track" aria-live="off">${msgs.map((k, i) => html`<p class="ticker-msg ${i ? '' : 'on'}" ${raw(i ? 'aria-hidden="true"' : '')}>${k === 'tick5' ? html`<a href="tel:+${PHONE_INTL}">${t(k)}</a>` : html`<span>${t(k)}</span>`}</p>`)}</div></div></div>
  <header class="hdr"><div class="wrap">
    <button class="icon-btn menu-btn" data-action="menu" aria-label="${t('menu')}" aria-expanded="false" aria-controls="nav">${raw(ICONS.menu)}</button>
    <nav class="nav" id="nav" aria-label="${t('menu')}">
      <button class="icon-btn nav-close" data-action="menu-close" aria-label="${t('close')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
      ${navLink('#/shop', t('shop'))}${CATEGORIES.slice(0, 2).map((c) => navLink('#/shop/' + c.id, c[getLang()]))}${navLink('#/finder', getLang() === 'he' ? 'מציאת הריח שלי' : 'Scent finder')}${navLink('#/wholesale', t('wholesale'))}${navLink('#/contact', t('contact'))}
    </nav>
    <a class="brand" href="#/" aria-label="SAY Boutique — ${t('home')}"><b>SAY</b><small>BOUTIQUE</small></a>
    <div class="tools">
      <button class="icon-btn lang-btn" data-action="lang" lang="${getLang() === 'he' ? 'en' : 'he'}" aria-label="${t('langLabel')}">${getLang() === 'he' ? 'EN' : 'עב'}</button>
      <button class="icon-btn" data-action="search-open" aria-label="${t('search')}" aria-haspopup="dialog">${raw(ICONS.search)}</button>
      <a class="icon-btn" href="#/account" aria-label="${t('account')}">${raw(ICONS.user)}</a>
      <button class="icon-btn" data-action="cart-open" aria-label="${t('cart')} (${n})" aria-haspopup="dialog">${raw(ICONS.bag)}${n ? html`<span class="badge" aria-hidden="true">${n}</span>` : ''}</button>
    </div></div></header>`;
}

function footer() {
  const y = new Date().getFullYear();
  return html`<footer class="ftr"><div class="wrap">
    <div class="ftr-grid">
      <div><a class="brand" href="#/" aria-label="SAY Boutique"><b>SAY</b><small>BOUTIQUE</small></a><p class="muted">Luxury Home Fragrances<br>${t('tick2')}</p>
        <p><a href="tel:+${PHONE_INTL}">${PHONE_DISPLAY}</a> · <a href="https://wa.me/${PHONE_INTL}" target="_blank" rel="noopener noreferrer">WhatsApp</a></p></div>
      <div><h2>${t('shop')}</h2><ul>${CATEGORIES.map((c) => html`<li><a href="#/shop/${c.id}">${c[getLang()]}</a></li>`)}</ul></div>
      <div><h2>${t('service')}</h2><ul><li><a href="#/contact">${t('contact')}</a></li><li><a href="#/account">${t('club')}</a></li><li><a href="#/wholesale">${t('wholesale')}</a></li><li><a href="#/returns">${t('returns')}</a></li></ul></div>
      <div><h2>${t('info')}</h2><ul><li><a href="#/terms">${t('terms')}</a></li><li><a href="#/privacy">${t('privacy')}</a></li><li><a href="#/accessibility">${t('accessibility')}</a></li><li><a href="#/about">${t('about')}</a></li></ul></div>
    </div>
    <div class="ftr-bottom"><span>© ${y} SAY Boutique · ${t('rights')}</span>
      <a class="credit" href="https://arielyosupov-webdesign.com" target="_blank" rel="noopener">${t('builtBy')}</a></div>
  </div></footer>
  <a class="fab fab-wa" href="https://wa.me/${PHONE_INTL}" target="_blank" rel="noopener noreferrer" aria-label="${t('whatsapp')} ${PHONE_DISPLAY}">${raw(ICONS.wa)}</a>
  <button class="fab fab-a11y" data-action="a11y" aria-label="${t('a11yTitle')}" aria-expanded="false" aria-controls="a11y-panel">${raw(ICONS.a11y)}</button>
  ${a11yPanel()}
  <div class="drawer-bg" data-action="cart-close"></div>
  <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="cart-t" id="drawer"></aside>`;
}

// ---------- Accessibility widget ----------
const A11Y = ['contrast', 'dark', 'gray', 'links', 'font', 'stop', 'cursor'];
const a11yState = (() => { try { return JSON.parse(localStorage.getItem('say_a11y')) || { fs: 0 }; } catch { return { fs: 0 }; } })();
function applyA11y() {
  const c = document.documentElement.classList;
  A11Y.forEach((k) => c.toggle('a11y-' + k, !!a11yState[k]));
  ['fs-1', 'fs-2', 'fs-3'].forEach((k, i) => c.toggle(k, a11yState.fs === i + 1));
  try { localStorage.setItem('say_a11y', JSON.stringify(a11yState)); } catch {}
}
function a11yPanel() {
  const labels = { contrast: 'contrast', dark: 'dark', gray: 'gray', links: 'links', font: 'readable', stop: 'stopAnim', cursor: 'bigCursor' };
  return html`<div class="a11y-panel" id="a11y-panel" role="dialog" aria-labelledby="a11y-t"><h2 id="a11y-t">${t('a11yTitle')}</h2><div class="a11y-grid">
    <button data-action="fs" data-d="1">A+ ${t('fontUp')}</button><button data-action="fs" data-d="-1">A− ${t('fontDown')}</button>
    ${A11Y.map((k) => html`<button data-action="a11y-t" data-k="${k}" aria-pressed="${!!a11yState[k]}">${t(labels[k])}</button>`)}
    <button data-action="a11y-reset">${t('reset')}</button></div>
    <p><a href="#/accessibility">${t('a11yStatement')}</a></p><button class="btn sm ghost" data-action="a11y">${t('close')}</button></div>`;
}

// ---------- Ticker ----------
let tickTimer, tickIdx = 0, tickPaused = false;
function stepTicker(d) {
  const ms = $$('.ticker-msg'); if (!ms.length) return;
  ms[tickIdx].classList.remove('on'); ms[tickIdx].setAttribute('aria-hidden', 'true');
  tickIdx = (tickIdx + d + ms.length) % ms.length; ms[tickIdx].classList.add('on'); ms[tickIdx].removeAttribute('aria-hidden');
}
function startTicker() {
  clearInterval(tickTimer);
  if (tickPaused || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  tickTimer = setInterval(() => {
    // Pauses while hovered/focused or when "stop animations" is on (WCAG 2.2.2).
    if (document.documentElement.classList.contains('a11y-stop') || $('.ticker:hover, .ticker:focus-within')) return;
    stepTicker(1);
  }, 4500);
}

// ---------- Hero slides ----------
let slideTimer, slideIdx = 0;
function showSlide(i) {
  const ss = $$('.slide'); if (!ss.length) return;
  slideIdx = (i + ss.length) % ss.length;
  ss.forEach((s, k) => s.classList.toggle('on', k === slideIdx));
  $$('.dots button').forEach((b, k) => b.setAttribute('aria-current', k === slideIdx));
  const n = $('#slide-n'); if (n) n.textContent = String(slideIdx + 1).padStart(2, '0');
  $$('.h-progress i').forEach((b, k) => b.classList.toggle('on', k === slideIdx));
  const cap = $('#slide-cap'); const sl = S.HERO_SLIDES?.[slideIdx];
  if (cap && sl) { cap.textContent = sl[getLang()]; cap.href = '#/product/' + sl.pid; }
}
function startSlides() {
  clearInterval(slideTimer); slideIdx = 0;
  if (!$('.slide') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  slideTimer = setInterval(() => { if (!tickPaused) showSlide(slideIdx + 1); }, 5500);
}

// ---------- Consent ----------
function maybeConsent() {
  let ok; try { ok = localStorage.getItem('say_consent'); } catch {}
  if (ok || location.hash.match(/^#\/(admin|orders|courier)/)) return;
  setTimeout(() => {
    if ($('.consent')) return;
    const d = document.createElement('div');
    d.className = 'consent'; d.setAttribute('role', 'region'); d.setAttribute('aria-labelledby', 'cs-t'); d.setAttribute('aria-live', 'polite');
    render(d, html`<button class="consent-x" data-action="consent" data-v="essential" aria-label="${t('close')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
      <div class="consent-head"><img src="assets/img/mark.webp" alt="" width="44" height="38"><h2 id="cs-t">${t('consentTitle')}</h2></div>
      <p>${t('consentText')}<a href="#/terms">${t('terms')}</a>${t('and')}<a href="#/privacy">${t('privacy')}</a>.</p>
      <div class="actions"><button class="btn sm" data-action="consent" data-v="all">${t('accept')}</button><button class="btn sm ghost" data-action="consent" data-v="essential">${t('essentialOnly')}</button></div>`);
    document.body.append(d);
    d.addEventListener('click', (e) => { const b = e.target.closest('[data-action="consent"]'); if (!b) return; try { localStorage.setItem('say_consent', JSON.stringify({ v: b.dataset.v, at: Date.now() })); } catch {} d.classList.add('out'); setTimeout(() => d.remove(), 350); });
  }, 5000);
}

// ---------- Router ----------
const STAFF = { admin: ['admin'], orders: ['orders'], courier: ['courier', 'orders'] };
function route() {
  const parts = (location.hash.slice(2) || '').split('/').map(decodeURIComponent);
  const [a, b] = parts;
  const isBO = ['admin', 'orders', 'courier'].includes(a);
  document.body.classList.remove('cart-open'); closeModal(); closeSearch();
  if (isBO) {
    if (!db.can(STAFF[a])) { state.authTab = 'login'; location.hash = '#/account'; return; }
    let v;
    if (a === 'admin') v = b === 'products' ? A.productsAdmin(state.pcat, state.pq) : b === 'reports' ? A.reports(state.range) : b === 'users' ? A.usersAdmin(state.uq, state.ur) : A.dashboard(state.metric);
    if (a === 'orders') v = A.ordersBoard({ view: state.ov, month: state.om, q: state.oq, status: state.os });
    if (a === 'courier') v = A.courierView(state.ctab);
    render(app, v); applyStyleAttrs(); document.title = 'SAY · Back Office'; return;
  }
  let v, title = 'SAY Boutique';
  switch (a || '') {
    case '': v = S.home(); title = 'SAY Boutique | Luxury Home Fragrances'; break;
    case 'shop': v = S.shop(b, state.q, state.sort, parts[2] || ''); title = `${t('shop')} | SAY Boutique`; break;
    case 'product': v = S.productPage(b); if (v) title = `${(db.product(b).name[getLang()])} | SAY Boutique`; break;
    case 'checkout': v = S.checkout(); break;
    case 'done': v = state.lastOrder ? S.orderDone(state.lastOrder) : S.home(); break;
    case 'account': if (b === 'register') state.authTab = 'register'; v = S.account(state.authTab); break;
    case 'contact': v = S.contact(); break;
    case 'about': v = S.about(); break;
    case 'wholesale': v = S.wholesalePage(); break;
    case 'guide': v = S.guide(); break;
    case 'finder': v = S.finder(state.finder); title = (getLang() === 'he' ? 'מציאת הריח שלי' : 'Scent finder') + ' | SAY Boutique'; break;
    case 'terms': v = Lg.terms(); break;
    case 'returns': v = Lg.returns(); break;
    case 'privacy': v = Lg.privacy(); break;
    case 'accessibility': v = Lg.accessibility(); break;
  }
  if (!v) v = html`<div class="wrap legal"><h1>404</h1><p>${t('notFound')}</p><a class="btn" href="#/">${t('backHome')}</a></div>`;
  render(app, html`${header()}<main id="main" tabindex="-1">${v}</main>${footer()}`);
  document.title = title;
  applyA11y(); startTicker(); bars(); startSlides(); observeReveal(); observeBuy();
}

// Fade-in on scroll (skipped when reduced motion / a11y "stop animations" is on).
let revealObs;
function observeReveal() {
  const els = $$('.reveal');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-stop');
  if (still || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  revealObs?.disconnect();
  revealObs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => revealObs.observe(e));
}
// Scent-library preview follows hover/focus.
const famPreview = (e) => { const a = e.target.closest?.('[data-fam-img]'); const img = $('#fam-preview'); if (!a || !img) return; img.src = a.dataset.famImg; $$('[data-fam-img]').forEach((x) => x.classList.toggle('on', x === a)); };
document.addEventListener('mouseover', famPreview); document.addEventListener('focusin', famPreview);
// Header tucks away while scrolling down and returns on scroll up.
let lastY = 0;
addEventListener('scroll', () => {
  const y = scrollY; const b = document.body;
  b.classList.toggle('scrolled', y > 40);
  b.classList.toggle('hdr-hide', y > 260 && y > lastY && !b.classList.contains('cart-open'));
  lastY = y;
}, { passive: true });

// Product page: pinned buy bar once the main button scrolls out of view.
let buyObs;
function observeBuy() {
  buyObs?.disconnect(); $('.buy-bar')?.remove();
  const btn = $('form[data-form="add"] [type="submit"]'); const p = location.hash.startsWith('#/product/') && db.product(location.hash.split('/')[2]);
  if (!btn || !p) return;
  const bar = document.createElement('div'); bar.className = 'buy-bar'; bar.setAttribute('aria-hidden', 'true');
  render(bar, html`<div class="wrap"><span class="bb-name">${p.name[getLang()]}</span><span class="bb-price" id="bb-price">${$('#pdp-price')?.textContent || ''}</span><button class="btn" data-action="buy-bar" tabindex="-1">${t('addToCart')}</button></div>`);
  document.body.append(bar);
  buyObs = new IntersectionObserver(([e]) => bar.classList.toggle('on', !e.isIntersecting && e.boundingClientRect.top < 0));
  buyObs.observe(btn);
}
function go() {
  const prevY = scrollY; route();
  if (!go.keep) { scrollTo(0, 0); $('#main')?.focus({ preventScroll: true }); } else scrollTo(0, prevY);
  go.keep = false;
}
const rerender = () => { go.keep = true; go(); };
const bars = () => $$('.pbar').forEach((b) => (b.style.transform = `scaleX(${b.dataset.ratio})`));

// ---------- Cart drawer ----------
let releaseDrawer;
function openCart() {
  const d = $('#drawer'); if (!d) return;
  render(d, S.cartDrawer()); bars();
  document.body.classList.add('cart-open');
  releaseDrawer = trapFocus(d, closeCart);
}
function closeCart() { document.body.classList.remove('cart-open'); releaseDrawer?.(); releaseDrawer = null; }
const refreshCart = () => { const d = $('#drawer'); if (d && document.body.classList.contains('cart-open')) { render(d, S.cartDrawer()); bars(); } const n = db.cart().reduce((a, l) => a + l.qty, 0); const btn = $('[data-action="cart-open"]'); if (btn) { btn.setAttribute('aria-label', `${t('cart')} (${n})`); $('.badge', btn)?.remove(); if (n) btn.insertAdjacentHTML('beforeend', `<span class="badge" aria-hidden="true">${n}</span>`); } };
document.addEventListener('cart', refreshCart);

// Bar widths / heat levels are passed as data attributes and applied through CSSOM (strict CSP: no inline style attributes).
function applyStyleAttrs(root = document) {
  $$('[style-w]', root).forEach((e) => (e.style.width = e.getAttribute('style-w') + '%'));
  $$('[style-a]', root).forEach((e) => e.style.setProperty('--a', e.getAttribute('style-a')));
}

// ---------- Search overlay ----------
let releaseSearch;
function openSearch() {
  closeSearch();
  const w = document.createElement('div'); w.className = 'search-ov'; w.id = 'search-ov';
  w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-label', t('search'));
  render(w, S.searchPanel());
  document.body.append(w); document.body.classList.add('no-scroll');
  requestAnimationFrame(() => w.classList.add('in'));
  releaseSearch = trapFocus(w, closeSearch);
  setTimeout(() => $('#sq')?.focus(), 60);
}
function closeSearch() {
  const w = $('#search-ov'); if (!w) return;
  document.body.classList.remove('no-scroll'); w.remove(); releaseSearch?.(); releaseSearch = null;
}
const runSearch = debounce((q) => { const r = $('#search-results'); if (r) render(r, S.searchResults(q)); }, 120);

// ---------- Modal ----------
let releaseModal;
function modal(tpl) { closeModal(); const w = document.createElement('div'); w.id = 'modal'; render(w, tpl); document.body.append(w); releaseModal = trapFocus(w.firstElementChild, closeModal); }
function closeModal() { $('#modal')?.remove(); releaseModal?.(); releaseModal = null; }

// ---------- Events (delegated; no inline handlers → strict CSP) ----------
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]'); if (!el) return;
  const { action, id } = el.dataset;
  switch (action) {
    case 'lang': setLang(getLang() === 'he' ? 'en' : 'he'); rerender(); break;
    case 'menu': $('#nav').classList.add('open'); el.setAttribute('aria-expanded', 'true'); trapFocus($('#nav'), () => $('[data-action="menu-close"]').click()); break;
    case 'menu-close': $('#nav').classList.remove('open'); $('[data-action="menu"]').setAttribute('aria-expanded', 'false'); $('[data-action="menu"]').focus(); break;
    case 'cart-open': openCart(); break;
    case 'search-open': openSearch(); break;
    case 'fq': state.finder = { ...state.finder, [el.dataset.k]: el.dataset.v }; go(); break;
    case 'fq-back': { const f = state.finder; if (f.mood) delete f.mood; else delete f.space; go(); break; }
    case 'fq-reset': state.finder = {}; go(); break;
    case 'fq-start': state.finder = { space: el.dataset.v }; location.hash = '#/finder'; break;
    case 'metric': state.metric = el.dataset.k; rerender(); break;
    case 'range': state.range = +el.dataset.n; rerender(); break;
    case 'pcat': state.pcat = el.dataset.c; rerender(); break;
    case 'utab': state.ur = el.dataset.t; rerender(); break;
    case 'os-tab': state.os = el.dataset.s; rerender(); break;
    case 'user-find': state.uq = el.dataset.q; state.ur = ''; location.hash = '#/admin/users'; rerender(); break;
    case 'approve-ws': db.updateUser(id, { role: 'wholesale', wsRequest: false }); toast(getLang() === 'he' ? 'החשבון אושר כסיטונאי' : 'Approved as wholesale'); rerender(); break;
    case 'size-add': { const tpl = $('#srow-t'); $('#srows').append(tpl.content.cloneNode(true)); $('#srows .srow:last-child input').focus(); break; }
    case 'size-rm': { const rows = $$('#srows .srow'); if (rows.length > 1) el.closest('.srow').remove(); break; }
    case 'buy-bar': $('form[data-form="add"] [type="submit"]')?.click(); break;
    case 'search-close': closeSearch(); break;
    case 'search-term': { const i = $('#sq'); i.value = el.dataset.q; runSearch(el.dataset.q); i.focus(); break; }
    case 'cart-close': closeCart(); break;
    case 'slide': showSlide(+el.dataset.i); clearInterval(slideTimer); break;
    case 'thumb': { const img = $('.pdp-media img'); if (img) img.src = el.dataset.src; $$('.thumbs button').forEach((b) => b.setAttribute('aria-pressed', b === el)); break; }
    case 'go-cart': closeModal(); openCart(); break;
    case 'quick-add': { const p = db.product(id); db.addToCart(id, p.sizes[0].label, 1); toast(`${t('added')}: ${p.name[getLang()]}`); if (!document.body.classList.contains('cart-open')) openCart(); break; }
    case 'qty': { const i = $('#qty'); i.value = Math.max(1, Math.min(99, (parseInt(i.value) || 1) + +el.dataset.d)); break; }
    case 'line-qty': { const c = db.cart(); const l = c[+el.dataset.i]; if (!l) break; l.qty += +el.dataset.d; if (l.qty < 1) c.splice(+el.dataset.i, 1); db.saveCart(c); break; }
    case 'line-rm': { const c = db.cart(); c.splice(+el.dataset.i, 1); db.saveCart(c); break; }
    case 'ticker-toggle': tickPaused = !tickPaused; el.setAttribute('aria-pressed', tickPaused); el.setAttribute('aria-label', tickPaused ? t('play') : t('pause'));  startTicker(); break;
    case 'tick-step': stepTicker(+el.dataset.d); startTicker(); break;
    case 'a11y': { const p = $('#a11y-panel'); const open = !p.classList.contains('open'); p.classList.toggle('open', open); $('.fab-a11y').setAttribute('aria-expanded', open); if (open) $('button', p).focus(); else $('.fab-a11y').focus(); break; }
    case 'fs': a11yState.fs = Math.max(0, Math.min(3, (a11yState.fs || 0) + +el.dataset.d)); applyA11y(); break;
    case 'a11y-t': a11yState[el.dataset.k] = !a11yState[el.dataset.k]; el.setAttribute('aria-pressed', a11yState[el.dataset.k]); applyA11y(); break;
    case 'a11y-reset': Object.keys(a11yState).forEach((k) => delete a11yState[k]); a11yState.fs = 0; applyA11y(); $$('[data-action="a11y-t"]').forEach((b) => b.setAttribute('aria-pressed', 'false')); break;
    case 'auth-tab': state.authTab = el.dataset.tab; rerender(); break;
    case 'logout': db.logout(); location.hash = '#/'; rerender(); break;
    // back office
    case 'edit-product': modal(A.productForm(id ? db.product(id) : null)); break;
    case 'del-product': if (confirm(getLang() === 'he' ? 'למחוק את המוצר?' : 'Delete product?')) { db.deleteProduct(id); closeModal(); rerender(); } break;
    case 'modal-close': closeModal(); break;
    case 'block-user': { const u = db.users().find((x) => x.id === id); db.updateUser(id, { blocked: !u.blocked }); rerender(); break; }
    case 'del-user': if (confirm(getLang() === 'he' ? 'למחוק את המשתמש לצמיתות?' : 'Delete user permanently?')) { db.deleteUser(id); rerender(); } break;
    case 'order-view': modal(A.orderModal(id)); break;
    case 'order-status': db.setOrderStatus(id, el.dataset.s, db.me()?.name); toast(getLang() === 'he' ? 'הסטטוס עודכן' : 'Status updated'); { const keep = el.dataset.keep; closeModal(); rerender(); if (keep) modal(A.orderModal(id)); } break;
    case 'clear-demo': if (confirm(getLang() === 'he' ? 'למחוק את כל לקוחות והזמנות הדמו? (מומלץ לפני העלייה לאוויר)' : 'Delete all demo customers and orders?')) { db.clearDemoData(); toast(getLang() === 'he' ? 'נשמר' : 'Saved'); rerender(); } break;
    case 'notes-read': db.markNotesRead(); rerender(); break;
    case 'ov': state.ov = el.dataset.v; rerender(); break;
    case 'ctab': state.ctab = el.dataset.t; rerender(); break;
    case 'print': print(); break;
    case 'export-csv': { const blob = new Blob([A.reportCSV(+el.dataset.range)], { type: 'text/csv;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `say-report-${Date.now()}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); break; }
    case 'chg-pass': {
      const pw = prompt(getLang() === 'he' ? 'סיסמה חדשה (8+ תווים, אות ומספר):' : 'New password (8+ chars, letter & number):');
      if (pw && valid.password(pw)) { await db.changePassword(db.me().id, pw); toast(getLang() === 'he' ? 'נשמר' : 'Saved'); rerender(); } else if (pw) toast(t('badPass'));
      break;
    }
  }
});

document.addEventListener('click', (e) => {
  const zoom = e.target.closest('[data-zoom]'); if (zoom && zoom.querySelector('img')) zoom.classList.toggle('zoom');
  if (e.target.classList?.contains('modal-bg')) closeModal();
  const p = $('#a11y-panel'); if (p?.classList.contains('open') && !e.target.closest('#a11y-panel,.fab-a11y')) { p.classList.remove('open'); $('.fab-a11y')?.setAttribute('aria-expanded', 'false'); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const p = $('#a11y-panel'); if (p?.classList.contains('open')) $('.fab-a11y').click(); } });

const searchDeb = debounce(() => rerender(), 250);
const boSearchDeb = debounce((v) => { const r = $('#bo-results'); if (!r) return; const out = A.boSearch(v); render(r, out); r.hidden = !v || v.length < 2; }, 120);
document.addEventListener('click', (e) => { const r = $('#bo-results'); if (r && !e.target.closest('.bo-search')) r.hidden = true; });
document.addEventListener('input', (e) => {
  const el = e.target; const k = el.dataset.input; if (!k) return;
  const v = clean(el.value, 60);
  if (k === 'search') { state.q = v; searchDeb(); keepFocus('#q'); }
  if (k === 'sq') runSearch(v);
  if (k === 'pq') { state.pq = v; searchDeb(); keepFocus('#pq'); }
  if (k === 'uq') { state.uq = v; searchDeb(); keepFocus('#uq'); }
  if (k === 'oq') { state.oq = v; searchDeb(); keepFocus('#oq'); }
  if (k === 'bo-q') boSearchDeb(v);
});
function keepFocus(sel) { setTimeout(() => { const i = $(sel); if (i && document.activeElement !== i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); }
document.addEventListener('change', (e) => {
  const el = e.target; const k = el.dataset.input; if (!k) return;
  const map = { sort: 'sort', range: 'range', pcat: 'pcat', ur: 'ur', om: 'om', os: 'os' };
  if (map[k]) { state[map[k]] = k === 'range' ? +el.value : el.value; rerender(); }
  if (k === 'size') { const pr = $('#pdp-price'); if (pr) pr.firstChild.textContent = new Intl.NumberFormat(getLang() === 'he' ? 'he-IL' : 'en-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(+el.dataset.price); }
  if (k === 'opt' && el.dataset.img) { const img = $('.pdp-media img'); if (img) img.src = el.dataset.img; }
  if (k === 'pick' || k === 'surprise') {
    const box = $('.pick-groups'); const max = +box.dataset.max; const sur = $('[data-input="surprise"]').checked;
    const picked = $$('[data-input="pick"]:checked');
    if (picked.length > max) { el.checked = false; toast(getLang() === 'he' ? `אפשר לבחור עד ${max} ניחוחות` : `Up to ${max} scents`); }
    $$('[data-input="pick"]').forEach((c) => (c.disabled = sur));
    $('#pick-count').textContent = sur ? (getLang() === 'he' ? 'נבחר' : 'Set') : `${$$('[data-input="pick"]:checked').length}/${max}`;
  }
  if (k === 'ws-toggle') $('#biz-f').hidden = !el.checked;
  if (k === 'p-active') { const p = db.product(el.dataset.id); db.saveProduct({ ...p, active: el.checked }); toast(el.checked ? (getLang() === 'he' ? 'המוצר מוצג באתר' : 'Product is live') : (getLang() === 'he' ? 'המוצר הוסתר' : 'Product hidden')); rerender(); }
  if (k === 'role') { db.updateUser(el.dataset.id, { role: el.value, wsRequest: el.value === 'wholesale' ? false : undefined }); toast(getLang() === 'he' ? 'נשמר' : 'Saved'); }
  if (k === 'm-status') { db.setOrderStatus(el.dataset.id, el.value, db.me()?.name); toast(getLang() === 'he' ? 'נשמר' : 'Saved'); closeModal(); rerender(); }
  if (k === 'm-courier') { db.assignCourier(el.dataset.id, el.value); toast(getLang() === 'he' ? 'נשמר' : 'Saved'); }
});

document.addEventListener('submit', async (e) => {
  if (e.target.id === 'search-form') { e.preventDefault(); const first = $('#search-results a'); if (first) location.hash = first.getAttribute('href'); return; }
  const f = e.target; const kind = f.dataset.form; if (!kind) return;
  e.preventDefault();
  const btn = f.querySelector('[type="submit"]'); if (btn?.disabled) return;
  if (kind === 'add') {
    const d = new FormData(f); const qty = Math.max(1, Math.min(99, parseInt(d.get('qty')) || 1));
    const p = db.product(f.dataset.id); let opt = clean(d.get('opt') || '', 40);
    if (p.picks) {
      const picks = d.getAll('pick').map((x) => clean(x, 40));
      if (d.get('surprise')) opt = getLang() === 'he' ? 'הפתיעו אותי' : 'Surprise me';
      else if (picks.length !== p.picks) { $('#add-err').textContent = getLang() === 'he' ? `יש לבחור ${p.picks} ניחוחות (נבחרו ${picks.length})` : `Please choose ${p.picks} scents (${picks.length} chosen)`; $('.picker').scrollIntoView({ block: 'center' }); return; }
      else opt = picks.join(', ');
    }
    $('#add-err').textContent = '';
    db.addToCart(f.dataset.id, d.get('size'), qty, opt); toast(t('added'));
    if (p.upsellKit && !db.cart().some((l) => db.product(l.pid)?.picks)) modal(S.kitUpsell()); else openCart();
  }
  if (kind === 'club') {
    const email = clean(f.email.value, 120);
    if (!valid.email(email)) { f.email.setAttribute('aria-invalid', 'true'); toast(t('badEmail')); f.email.focus(); return; }
    db.joinClub(email); f.reset(); toast(t('joined')); $('#club-msg') && ($('#club-msg').textContent = t('joined'));
  }
  if (kind === 'checkout') {
    btn.disabled = true;
    try { const o = S.checkoutSubmit(f); if (o) { state.lastOrder = o; location.hash = '#/done'; } } finally { btn.disabled = false; }
  }
  if (kind === 'login' || kind === 'register') {
    btn.disabled = true;
    const ok = await S.authSubmit(f, kind); btn.disabled = false;
    if (ok) { const u = db.me(); location.hash = { admin: '#/admin', orders: '#/orders', courier: '#/courier' }[u.role] || '#/account'; rerender(); }
  }
  if (kind === 'contact') {
    const d = Object.fromEntries(new FormData(f)); const err = $('#c-err');
    if (!valid.name(d.name) || !valid.phone(d.phone) || !clean(d.msg)) { err.textContent = `${t('required')} / ${t('badPhone')}`; return; }
    const txt = `פנייה מהאתר\nשם: ${clean(d.name, 80)}\nטלפון: ${clean(d.phone, 20)}\n${clean(d.msg, 1000)}`;
    window.open(`https://wa.me/${PHONE_INTL}`, '_blank', 'noopener');
    f.reset(); err.textContent = ''; toast(t('sent'));
  }
  if (kind === 'product') {
    const fd = new FormData(f); const d = Object.fromEntries(fd); const err = $('#pf-err');
    const multi = (s) => String(s ?? '').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, 4000); // keeps line breaks
    const L_ = fd.getAll('s_label'), P_ = fd.getAll('s_price'), W_ = fd.getAll('s_ws'), C_ = fd.getAll('s_cost');
    const sizes = L_.map((l, i) => ({ label: clean(l, 30), price: Math.max(0, +P_[i] || 0), wholesale: Math.max(0, +W_[i] || 0), cost: Math.max(0, +C_[i] || 0) })).filter((x) => x.label);
    const old = f.dataset.id ? db.product(f.dataset.id) : {};
    const quote = !!old.quote;
    if (!clean(d.he) || !sizes.length || (!quote && sizes.some((x) => !x.price))) { err.textContent = getLang() === 'he' ? 'יש למלא שם וגודל אחד לפחות עם מחיר' : 'Name and at least one priced size required'; return; }
    const img = clean(d.imgpick || d.img, 200);
    if (img && !/^(assets\/products\/[\w\-./]+|https:\/\/[\w\-./%?=&]+)$/.test(img)) { err.textContent = getLang() === 'he' ? 'נתיב התמונה אינו תקין' : 'Image path invalid'; return; }
    const id = f.dataset.id || (clean(d.en || d.he, 40).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'p') + '-' + Date.now().toString(36);
    db.saveProduct({ ...old, id, cat: CATEGORIES.some((c) => c.id === d.cat) ? d.cat : 'oils', name: { he: clean(d.he, 120), en: clean(d.en, 120) }, desc: { he: multi(d.dhe), en: multi(d.den) },
      sizes, img, gallery: old.gallery || (img ? [img] : []), tag: d.tag === 'new' || d.tag === 'best' ? d.tag : '', active: !!d.active, stock: Math.max(0, parseInt(d.stock) || 0) });
    closeModal(); toast(getLang() === 'he' ? 'המוצר נשמר' : 'Product saved'); rerender();
  }
});

// ---------- Boot ----------
applyLang(); applyA11y();
window.addEventListener('hashchange', go);
(async () => {
  await db.loadCatalog();
  go();
  await db.seedDemo();
  if (/^#\/(admin|orders|courier|account)/.test(location.hash)) rerender();
  maybeConsent();
})();
