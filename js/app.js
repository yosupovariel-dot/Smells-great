import { html, raw, render, $, $$, toast, trapFocus, debounce, valid, clean, PHONE_DISPLAY, PHONE_INTL, normPhone } from './util.js?v=261112194423';
import { t, getLang, setLang, applyLang } from './i18n.js?v=261112194423';
import { CATEGORIES } from './data.js?v=261112194423';
import * as db from './db.js?v=261112194423';
import * as S from './views-shop.js?v=261112194423';
import * as Lg from './views-legal.js?v=261112194423';
import * as A from './views-admin.js?v=261112194423';

// Clickjacking guard: GitHub Pages cannot send frame-ancestors, so refuse to run inside a foreign frame.
if (window.top !== window.self) { try { window.top.location = window.self.location.href; } catch { document.documentElement.innerHTML = ''; } throw new Error('framed'); }

const app = $('#app');
const state = { f: {}, sel: new Set(), pv: 'grid', finder: {}, q: '', sort: 'pop', authTab: 'login', range: 6, pcat: '', pq: '', uq: '', ur: '', ov: 'queue', om: 'all', metric: 'rev', os: '', oq: '', ctab: 'todo', lastOrder: null };
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
  const navLink = (href, label) => html`<a href="${href}" ${raw(route === href || (href === '#/' && !route.slice(2)) || (href !== '#/' && route.startsWith(href)) ? 'aria-current="page"' : '')}>${label}</a>`;
  const msgs = ['tick1', 'tick2', 'tick3', 'tick4', 'tick5'];
  return html`<a class="skip" href="#main">${t('skip')}</a>
  <div class="ticker" role="region" aria-label="${getLang() === 'he' ? 'הודעות' : 'Announcements'}"><div class="wrap">
    <div class="ticker-track" aria-live="off">${msgs.map((k, i) => html`<p class="ticker-msg ${i ? '' : 'on'}" ${raw(i ? 'aria-hidden="true"' : '')}>${k === 'tick5' ? html`<a href="tel:+${PHONE_INTL}">${t(k)}</a>` : k === 'tick1' ? html`<span>${t(k)}</span><a class="tk-more" href="#/terms">${getLang() === 'he' ? 'לפרטים' : 'Details'}</a>` : (k === 'tick3' || k === 'tick4') && !db.me() ? html`<button class="tk-join" data-action="join-club" type="button">${t(k)}<span>${getLang() === 'he' ? 'להצטרפות' : 'Join'}</span></button>` : html`<span>${t(k)}</span>`}</p>`)}</div></div></div>
  <header class="hdr"><div class="wrap">
    <button class="icon-btn menu-btn" data-action="menu" aria-label="${t('menu')}" aria-expanded="false" aria-controls="nav">${raw(ICONS.menu)}</button>
    <button class="icon-btn m-search" data-action="search-open" aria-label="${t('search')}" aria-haspopup="dialog">${raw(ICONS.search)}</button>
    <nav class="nav" id="nav" aria-label="${t('menu')}">
      <button class="icon-btn nav-close" data-action="menu-close" aria-label="${t('close')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
      <span class="mn-desk">${navLink('#/shop', t('shop'))}${CATEGORIES.slice(0, 2).map((c) => navLink('#/shop/' + c.id, c[getLang()]))}${navLink('#/finder', getLang() === 'he' ? 'מציאת הריח שלי' : 'Scent finder')}${navLink('#/wholesale', t('wholesale'))}</span>
      ${mobileMenu()}
    </nav>
    <div class="nav-bg" data-action="menu-close" aria-hidden="true"></div>
    <a class="brand logo" href="#/" aria-label="SAY Boutique — ${t('home')}"><img src="assets/img/logo-wide.webp" alt="SAY Boutique — Luxury Home Fragrances" width="923" height="350" fetchpriority="high"></a>
    <div class="tools">
      ${db.me() ? '' : html`<button class="join-pill" data-action="join-club" type="button">${getLang() === 'he' ? 'מועדון חברים · 15%' : 'Club · 15% off'}</button>`}<a class="tool-link" href="#/rental">${getLang() === 'he' ? 'השכרה' : 'Rental'}</a><a class="tool-link" href="#/reviews">${getLang() === 'he' ? 'ביקורות' : 'Reviews'}</a><a class="tool-link" href="#/contact">${t('contact')}</a>
      <button class="icon-btn lang-btn" data-action="lang" lang="${getLang() === 'he' ? 'en' : 'he'}" aria-label="${t('langLabel')}">${getLang() === 'he' ? 'EN' : 'עב'}</button>
      <button class="icon-btn" data-action="search-open" aria-label="${t('search')}" aria-haspopup="dialog">${raw(ICONS.search)}</button>
      <a class="icon-btn m-ws m-lab" href="#/wholesale" aria-label="${t('wholesale')}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/></svg><small>${t('wholesale')}</small></a><a class="icon-btn m-lab" href="#/account" aria-label="${t('account')}">${raw(ICONS.user)}<small>${getLang() === 'he' ? 'כניסה' : 'Sign in'}</small></a>
      <button class="icon-btn m-lab" data-action="cart-open" aria-label="${t('cart')} (${n})" aria-haspopup="dialog">${raw(ICONS.bag)}<small>${getLang() === 'he' ? 'סל' : 'Bag'}</small>${n ? html`<span class="badge" aria-hidden="true">${n}</span>` : ''}</button>
    </div></div></header>`;
}

// Mobile menu: guide, don't list. One clear next step, visual categories, social proof, reassurance.
function mobileMenu() {
  const he = getLang() === 'he'; const T2 = (a, b) => (he ? a : b);
  const all = db.products().filter((p) => p.active !== false);
  const cats = CATEGORIES.map((c) => ({ ...c, n: all.filter((p) => p.cat === c.id).length })).filter((c) => c.img).sort((a, b) => !!b.n - !!a.n);
  const best = all.filter((p) => p.tag === 'best').slice(0, 3);
  const sm = (x) => (x || '').replace(/(?<!-sm)\.webp$/, '-sm.webp');
  const hr = new Date().getHours();
  const hello = hr < 12 ? T2('בוקר טוב', 'Good morning') : hr < 18 ? T2('צהריים טובים', 'Good afternoon') : T2('ערב טוב', 'Good evening');
  const u = db.me();
  return html`<div class="mnp">
    <div class="mnp-top"><a class="mnp-logo" href="#/" aria-label="SAY Boutique"><img src="assets/img/logo-wide.webp" alt="SAY Boutique" width="923" height="350" loading="lazy"></a></div>
    <p class="mnp-hello">${hello}${u ? `, ${u.name.split(' ')[0]}` : ''} <span aria-hidden="true">✦</span></p>
    <h2 class="mnp-q">${T2('איזה ריח בא לכם היום?', 'What will you smell like today?')}</h2>
    <button class="mnp-search" data-action="search-open" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>${T2('חפשו מלון, בושם או מכשיר…', 'Search a hotel, perfume or device…')}</button>
    <a class="mnp-finder" href="#/finder"><span class="mnp-f-k">${T2('לא בטוחים?', 'Not sure?')}</span><b>${T2('מצאו את הריח שלכם ב־30 שניות', 'Find your scent in 30 seconds')}</b><i aria-hidden="true">${he ? '←' : '→'}</i></a>
    <p class="mnp-h">${T2('קטגוריות', 'Shop by category')}<a href="#/shop">${T2('לכל החנות', 'Shop all')}</a></p>
    <div class="mnp-cats">${cats.map((c, k) => html`<a class="mnp-cat" href="#/shop/${c.id}" style-d="${k}"><span class="mnp-ci"><img src="${sm(c.id === 'diffusers' ? 'assets/products/say-150-3.webp' : c.img)}" alt="" loading="lazy" width="200" height="200"></span><b>${c[getLang()]}</b><small>${c.n ? `${c.n} ${T2('מוצרים', 'items')}` : T2('בקרוב', 'Soon')}</small></a>`)}</div>
    <a class="mnp-deal" href="#/shop/bundles"><span class="mnp-deal-k">${T2('מבצעים', 'Deals')}</span><b>${T2('מארזים במחיר מיוחד', 'Bundles at a special price')}</b><small>${T2('+ 15% לחברי מועדון בהזמנה ראשונה', '+ 15% off a first order for members')}</small></a>
    ${best.length ? html`<p class="mnp-h">${T2('הכי אהובים עכשיו', 'Loved right now')}</p>
    <div class="mnp-best">${best.map((p) => html`<a href="#/product/${p.id}"><span><img src="${sm(p.img)}" alt="" loading="lazy" width="120" height="120"></span><b>${p.name?.[getLang()] || p.name?.he}</b><em>${T2('רב מכר', 'Bestseller')}</em></a>`)}</div>` : ''}
    <button class="mnp-lang" data-action="lang" type="button">${he ? 'English' : 'עברית'}</button>
    <button class="mnp-join" data-action="join-club" type="button"><span>✦</span>${T2('הצטרפות למועדון החברים — 15% הנחה', 'Join the club — 15% off')}</button>
    <nav class="mnp-links" aria-label="${T2('עוד', 'More')}"><a href="#/club">SAY CLUB</a><a href="#/business">SAY BUSINESS · ${T2('לעסקים', 'for business')}</a><a href="#/rental">${T2('מסלול שירות חודשי לעסקים', 'Monthly service for business')}</a><a href="#/wholesale">${T2('לעסקים וסיטונאים', 'For business')}</a><a href="#/reviews">${T2('לקוחות ממליצים', 'Reviews')}</a><a href="#/about">${t('about')}</a><a href="#/contact">${t('contact')}</a><a href="#/wholesale" class="mnp-sup">${T2('כניסה לספקים', 'Supplier login')}</a><a href="#/account">${u ? T2('החשבון שלי', 'My account') : T2('התחברות / הצטרפות למועדון', 'Sign in / join the club')}</a></nav>
    <ul class="mnp-trust"><li><b>${T2('משלוח חינם', 'Free shipping')}</b>${T2('מעל 299 ₪', 'over ₪299')}</li><li><b>${T2('14 יום', '14 days')}</b>${T2('להחזרה', 'returns')}</li><li><b>${T2('מחיר יבואן', 'Importer')}</b>${T2('ישר לצרכן', 'prices')}</li></ul>
    <a class="mnp-wa" href="https://wa.me/${PHONE_INTL}" target="_blank" rel="noopener noreferrer"><span class="mnp-dot" aria-hidden="true"></span><span><b>${T2('צריכים עזרה בבחירה?', 'Need help choosing?')}</b>${T2('כתבו לנו בוואטסאפ, אנחנו עונים מהר', 'WhatsApp us, we reply fast')}</span></a>
  </div>`;
}

function footNav() {
  const he = getLang() === 'he'; const T2 = (a, b) => (he ? a : b);
  const all = db.products().filter((p) => p.active !== false);
  const live = CATEGORIES.filter((c) => all.some((p) => p.cat === c.id));
  const soon = CATEGORIES.filter((c) => !live.includes(c));
  const col = (title, links) => html`<div class="fn-col"><h2>${title}</h2><ul>${links.map(([h, l]) => html`<li><a href="${h}"><span>${l}</span></a></li>`)}</ul></div>`;
  return html`<nav class="fn" aria-label="${T2('ניווט תחתון', 'Footer')}">
    <div class="fn-col fn-shop"><h2>${t('shop')}</h2>
      <ul class="fn-cats">${live.map((c) => html`<li><a href="#/shop/${c.id}">${c.img ? html`<img src="${c.img.replace(/\.webp$/, '-sm.webp')}" alt="" width="40" height="40" loading="lazy">` : ''}<span>${c[getLang()]}</span></a></li>`)}</ul>
      ${soon.length ? html`<p class="fn-soon"><b>${T2('בקרוב', 'Coming soon')}</b>${soon.map((c) => c[getLang()]).join(' · ')}</p>` : ''}</div>
    ${col(t('service'), [['#/contact', t('contact')], ['#/account', T2('האזור האישי שלי', 'My account')], ['#/club', 'SAY CLUB'], ['#/business', 'SAY BUSINESS'], ['#/wholesale', t('wholesale')], ['#/rental', T2('השכרה', 'Rental')], ['#/finder', T2('מציאת הריח שלי', 'Scent finder')]])}
    ${col(t('info'), [['#/about', t('about')], ['#/returns', t('returns')], ['#/terms', t('terms')], ['#/privacy', t('privacy')], ['#/accessibility', t('accessibility')]])}
  </nav>`;
}

function footer() {
  const y = new Date().getFullYear();
  return html`<footer class="ftr"><div class="wrap">
    <div class="ftr-grid">
      <div><a class="brand logo" href="#/" aria-label="SAY Boutique"><img src="assets/img/logo-wide-light.webp" alt="SAY Boutique — Luxury Home Fragrances" width="923" height="350" loading="lazy"></a><p class="muted">${t('tick2')}</p>
        <p class="ftr-contact"><a class="fc-cta" href="#/contact">${getLang() === 'he' ? 'צור קשר' : 'Contact us'}</a><a class="fc-tel" href="tel:+${PHONE_INTL}" dir="ltr">${PHONE_DISPLAY}</a></p></div>
      ${footNav()}
    </div>
    <div class="ftr-bottom"><span>© ${y} SAY Boutique · ${t('rights')}</span>
      <a class="credit" href="https://arielyosupov-webdesign.com" target="_blank" rel="noopener noreferrer">${t('builtBy')}</a></div>
  </div></footer>
  <button class="fab fab-top" data-action="top" aria-label="${getLang() === 'he' ? 'חזרה לראש העמוד' : 'Back to top'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6"/></svg></button>
  ${db.me()?.role && db.me().role !== 'customer' ? '' : html`<button class="vipf" data-action="join-club" type="button" aria-label="SAY CLUB — ${getLang() === 'he' ? 'יש הפתעות ששמורות רק לחברים' : 'Surprises for members only'}"><span class="vc v1" aria-hidden="true"></span><span class="vc v2" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 18h18l-2-10-5 4-2-6-2 6-5-4z"/></svg><b>CLUB</b></span></button>`}
  <a class="fab fab-wa" href="https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(getLang() === 'he' ? 'שלום, הגעתי דרך אתר SAY BOUTIQUE ואשמח לעזרה' : 'Hi, I came from the SAY BOUTIQUE website')}" target="_blank" rel="noopener noreferrer" aria-label="${t('whatsapp')} ${PHONE_DISPLAY}">${raw(ICONS.wa)}</a>
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
  const cur = Math.max(0, ms.findIndex((m) => m.classList.contains('on')));
  tickIdx = (cur + d + ms.length) % ms.length;
  ms.forEach((m, k) => { m.classList.toggle('on', k === tickIdx); if (k === tickIdx) m.removeAttribute('aria-hidden'); else m.setAttribute('aria-hidden', 'true'); });
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
  // Never reveal a slide whose image hasn't finished loading — keep the current one instead.
  const img = ss[slideIdx].querySelector('img');
  if (img && !img.complete) { const prev = (slideIdx - 1 + ss.length) % ss.length; img.addEventListener('load', () => showSlide(slideIdx), { once: true }); slideIdx = prev; return; }
  ss.forEach((s, k) => s.classList.toggle('on', k === slideIdx));
  $$('.dots button').forEach((b, k) => b.setAttribute('aria-current', k === slideIdx));
  const n = $('#slide-n'); if (n) n.textContent = String(slideIdx + 1).padStart(2, '0');
  $$('.h-progress i, .h-dots i').forEach((b, k) => b.classList.toggle('on', k === slideIdx));
  $$('.h-offer').forEach((o, k) => o.classList.toggle('on', k === slideIdx));
  const cap = $('#slide-cap'); const sl = S.HERO_SLIDES?.[slideIdx];
  if (cap && sl) { cap.textContent = sl[getLang()]; cap.href = '#/product/' + sl.pid; }
}
// Swipe on the hero image (touch + mouse drag).
let mx = null;
document.addEventListener('mousedown', (e) => { if (e.target.closest('.h-slides')) { mx = e.clientX; e.preventDefault(); } });
document.addEventListener('mouseup', (e) => { if (mx === null) return; const dx = e.clientX - mx; mx = null; if (Math.abs(dx) < 40) return; showSlide(slideIdx + (dx < 0 ? 1 : -1)); clearInterval(slideTimer); });
let tx = null;
document.addEventListener('touchstart', (e) => { if (e.target.closest('.h-slides')) tx = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', (e) => {
  if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null;
  if (Math.abs(dx) < 40) return; showSlide(slideIdx + (dx < 0 ? 1 : -1)); clearInterval(slideTimer);
}, { passive: true });
// Category circles row: gentle auto-scroll on phones, pauses when touched.
let catTimer, catHold = 0;
function startCatRail() {
  clearInterval(catTimer);
  const r = $('.h-cats2 > div'); if (!r || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  r.addEventListener('touchstart', () => { catHold = Date.now() + 6000; }, { passive: true });
  catTimer = setInterval(() => {
    if (!document.body.contains(r)) return clearInterval(catTimer);
    if (Date.now() < catHold || r.scrollWidth <= r.clientWidth + 4 || document.documentElement.classList.contains('a11y-stop')) return;
    const dir = document.dir === 'rtl' ? -1 : 1; const step = (r.firstElementChild?.offsetWidth || 90) + 10;
    if (Math.abs(r.scrollLeft) + r.clientWidth >= r.scrollWidth - 4) r.scrollTo({ left: 0, behavior: 'smooth' });
    else r.scrollBy({ left: dir * step, behavior: 'smooth' });
  }, 2200);
}
function reelMotion() { const v = $('.rl-vid video'); if (v && (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-stop'))) { v.pause(); v.removeAttribute('autoplay'); } }
function floaters() {
  let hid = false; try { hid = !!sessionStorage.getItem('say_vipf'); } catch {}
  if (hid || /^#\/(checkout|account|done|club)/.test(location.hash)) $('.vipf')?.remove();
  const top = $('.fab-top'); if (top) { const f = () => top.classList.toggle('show', window.scrollY > 900); window.removeEventListener('scroll', window.__topf || f); window.__topf = f; window.addEventListener('scroll', f, { passive: true }); f(); }
}
function startSlides() {
  clearInterval(slideTimer); slideIdx = 0;
  if (!$('.slide') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  slideTimer = setInterval(() => { if (!tickPaused) showSlide(slideIdx + 1); }, 5500);
}

// ---------- Consent ----------
// ---------- Sign-up promo (glass), 7s after load, only for visitors who aren't signed in ----------
function maybePromo(delay = 7000, force = false) {
  setTimeout(function show() {
    if (db.me() || $('#promo') || (!force && /^#\/(account|admin|orders|courier|checkout)/.test(location.hash))) return;
    if (document.body.classList.contains('cart-open') || $('#modal') || $('#search-ov')) { setTimeout(show, 2500); return; }
    const he = getLang() === 'he';
    const w = document.createElement('div'); w.id = 'promo'; w.className = 'promo-bg';
    const I = (d) => raw(`<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`);
    render(w, html`<div class="supromo club-card cc3" role="dialog" aria-modal="true" aria-labelledby="pr-t">
      <button class="promo-x" hidden data-action="promo-close" aria-label="${t('close')}">${I('<path d="M6 6l12 12M18 6L6 18"/>')}</button>
      <figure class="c3-art" aria-hidden="true"><div class="mcard"><span class="mc-shine"></span><img class="mc-logo" src="assets/img/logo-wide-light.webp" alt="" width="923" height="350"><span class="mc-chip"></span><span class="mc-label">MEMBER</span><span class="mc-no" dir="ltr">SAY · CLUB · 0015</span><span class="mc-pct"><b>15%</b><small>${he ? 'הנחה' : 'OFF'}</small></span></div><figcaption>${he ? 'הכרטיס שלכם למועדון SAY' : 'Your SAY Club card'}</figcaption></figure>
      <div class="c3-body">
        <p class="c3-k">SAY CLUB</p>
        <h2 id="pr-t">${he ? 'נהנים יותר!' : 'Enjoy more!'}</h2>
        <p class="c3-sub">${he ? 'מצטרפים למועדון ונהנים מהטבות בלעדיות:' : 'Join the club for exclusive perks:'}</p>
        <ul class="c3-list">
          <li>${I('<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M12 9C10 5 6 5 7 8c.5 1.3 3 1 5 1zm0 0c2-4 6-4 5-1-.5 1.3-3 1-5 1z"/>')}<b>${he ? '15% הנחה מיידית לקנייה הראשונה!' : '15% off your first order!'}</b></li>
          <li>${I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z"/>')}<span>${he ? 'צבירת נקודות בכל רכישה (ששוות כסף בקניות הבאות)' : 'Earn points on every order (worth money next time)'}</span></li>
          <li>${I('<path d="M4 21h16M5 21v-7h14v7M8 14v-3h8v3M12 11V8M12 4.5c.8.9.8 1.8 0 2.5-.8-.7-.8-1.6 0-2.5z"/>')}<span>${he ? 'הטבה מפנקת במיוחד ביום ההולדת' : 'A special birthday treat'}</span></li>
        </ul>
        <form class="c3-form" data-form="club-join" novalidate>
          <label class="c3-in">${I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.2-6.5 8-6.5s7 2 8 6.5"/>')}<input name="name" autocomplete="name" required maxlength="80" placeholder="${he ? 'שם מלא *' : 'Full name *'}" aria-label="${he ? 'שם מלא' : 'Full name'}"></label>
          <label class="c3-in">${I('<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>')}<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required maxlength="15" placeholder="${he ? 'מספר טלפון *' : 'Phone *'}" aria-label="${he ? 'טלפון' : 'Phone'}"></label>
          <label class="c3-in">${I('<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6.5l8.5 6 8.5-6"/>')}<input name="email" type="email" autocomplete="email" required maxlength="120" placeholder="${he ? 'דואר אלקטרוני *' : 'Email *'}" aria-label="${he ? 'אימייל' : 'Email'}"></label>
          <label class="c3-in">${I('<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/>')}<input name="password" type="password" autocomplete="new-password" required maxlength="80" placeholder="${he ? 'בחרו סיסמה (8+ תווים, אות ומספר) *' : 'Choose a password *'}" aria-label="${he ? 'סיסמה' : 'Password'}"></label>
          <label class="cc-check c3-check"><input type="checkbox" name="agree" required><span>${he ? 'מאשר/ת הצטרפות למועדון וקבלת עדכונים בוואטסאפ ובמייל. מבטיחים לא לחפור – רק מבצעים שווים והטבות בלעדיות!' : 'I agree to join and get updates by WhatsApp and email. Only great offers.'}</span></label>
          <p class="cc-err" role="alert"></p>
          <button class="c3-go" type="submit">${he ? 'אני רוצה 15% הנחה והצטרפות!' : 'I want 15% off & join!'}</button>
        </form>
        <a class="c3-login" href="#/account" data-action="promo-close">${he ? 'כבר חברים? התחברות' : 'Already a member? Sign in'}</a>
      </div>
    </div>`);
    document.body.append(w); requestAnimationFrame(() => w.classList.add('in'));
    setTimeout(() => { const x = $('.promo-x', w); if (x) { x.hidden = false; x.classList.add('show'); } }, force ? 0 : 3000);
    w.addEventListener('click', (e) => { if (e.target === w && !$('.promo-x', w)?.hidden) closePromo(); });
    promoRelease = trapFocus(w.firstElementChild, closePromo);
  }, delay);
}
let promoRelease;
function closePromo() { const w = $('#promo'); if (!w) return; w.remove(); promoRelease?.(); promoRelease = null; }

function maybeConsent() {
  if (db.me() || location.hash.match(/^#\/(admin|orders|courier)/)) return;
  setTimeout(() => {
    if ($('.consent') || db.me() || /^#\/(admin|orders|courier)/.test(location.hash)) return;
    const d = document.createElement('div');
    d.className = 'consent'; d.setAttribute('role', 'region'); d.setAttribute('aria-labelledby', 'cs-t'); d.setAttribute('aria-live', 'polite');
    render(d, html`<button class="consent-x" data-action="consent" data-v="essential" aria-label="${t('close')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
      <span class="consent-ic" aria-hidden="true"><img src="assets/img/mark.webp" alt="" width="44" height="38"></span>
      <p><b id="cs-t">${t('consentTitle')}</b> ${t('consentText')}<a href="#/terms">${t('terms')}</a> ${getLang() === 'he' ? 'ואת' : 'and the'} <a href="#/privacy">${t('privacy')}</a>.</p>
      <div class="actions"><button class="btn sm" data-action="consent" data-v="all">${t('accept')}</button></div>`);
    document.body.append(d); requestAnimationFrame(() => document.documentElement.style.setProperty('--cs-h', d.offsetHeight + 'px'));
    d.addEventListener('click', (e) => { const b = e.target.closest('[data-action="consent"]'); if (!b) return; try { localStorage.setItem('say_consent', JSON.stringify({ v: b.dataset.v, at: Date.now() })); } catch {} d.classList.add('out'); setTimeout(() => d.remove(), 350); });
  }, 5000);
}

// ---------- Router ----------
const STAFF = { admin: ['admin', 'products'], orders: ['orders'], courier: ['courier', 'orders'] };
function route() {
  const parts = (location.hash.slice(2) || '').split('/').map(decodeURIComponent);
  const [a, b] = parts;
  const isBO = ['admin', 'orders', 'courier'].includes(a);
  document.body.classList.remove('cart-open'); closeModal(); closeSearch();
  if (isBO) {
    if (!db.can(STAFF[a])) { state.authTab = 'login'; location.hash = '#/account'; return; }
    let v;
    if (a === 'admin' && db.me().role === 'products' && b !== 'products') { location.hash = '#/admin/products'; return; }
    if (a === 'admin') v = b === 'products' ? A.productsAdmin(state.pcat, state.pq, state.pv) : b === 'reports' ? A.reports(state.range) : b === 'users' ? A.usersAdmin(state.uq, state.ur) : b === 'team' ? A.teamAdmin() : b === 'reviews' ? A.reviewsAdmin() : A.dashboard(state.metric);
    if (a === 'orders') v = A.ordersBoard({ view: state.ov, month: state.om, q: state.oq, status: state.os, sel: state.sel });
    if (a === 'courier') v = A.courierView(state.ctab);
    $('.consent')?.remove(); closePromo();
    render(app, v); applyStyleAttrs(); document.title = 'SAY · Back Office'; return;
  }
  let v, title = 'SAY Boutique';
  switch (a || '') {
    case '': v = S.home(); title = 'SAY Boutique | Luxury Home Fragrances'; break;
    case 'shop': v = S.shop(b, state.q, state.sort, parts[2] || '', state.f); title = `${t('shop')} | SAY Boutique`; break;
    case 'product': v = S.productPage(b); if (v) title = `${(db.product(b).name[getLang()])} | SAY Boutique`; break;
    case 'checkout': v = S.checkout(); break;
    case 'done': v = state.lastOrder ? S.orderDone(state.lastOrder) : S.home(); break;
    case 'account': if (b === 'register') state.authTab = 'register'; v = S.account(db.me() && ['orders', 'addresses', 'profile'].includes(b) ? b : state.authTab, b === 'ws' ? 'ws' : 'retail'); break;
    case 'club': v = S.clubPage(); break;
    case 'business': v = S.businessPage(b || ''); break;
    case 'contact': v = S.contact(); break;
    case 'about': v = S.about(); break;
    case 'wholesale': v = S.wholesalePage(); break;
    case 'rental': v = S.rentalPage(); break;
    case 'reviews': v = S.reviewsPage(); break;
    case 'guide': v = S.guide(); break;
    case 'staff': location.hash = '#/account'; return;
    case 'finder': v = S.finder(state.finder); title = (getLang() === 'he' ? 'מציאת הריח שלי' : 'Scent finder') + ' | SAY Boutique'; break;
    case 'terms': v = Lg.terms(); break;
    case 'returns': v = Lg.returns(); break;
    case 'privacy': v = Lg.privacy(); break;
    case 'accessibility': v = Lg.accessibility(); break;
  }
  if (!v) v = html`<div class="wrap legal"><h1>404</h1><p>${t('notFound')}</p><a class="btn" href="#/">${t('backHome')}</a></div>`;
  render(app, html`${header()}<main id="main" tabindex="-1">${v}</main>${footer()}`);
  document.title = title;
  if (matchMedia('(max-width:800px)').matches) $$('.ftr-col').forEach((d) => d.removeAttribute('open'));
  const sw = $('.swipe'); if (sw) {
    const mark = (i) => { $$('.swipe-dots i').forEach((d, k) => d.classList.toggle('on', k === i)); $$('.pg-rail button').forEach((b, k) => b.setAttribute('aria-pressed', k === i)); const n = $('#pg-n'); if (n) n.textContent = i + 1; };
    sw.addEventListener('scroll', () => { if (sw.scrollWidth > sw.clientWidth + 2) mark(Math.round(Math.abs(sw.scrollLeft) / sw.clientWidth)); }, { passive: true });
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting && sw.scrollWidth <= sw.clientWidth + 2) mark(+x.target.dataset.i); }), { rootMargin: '-45% 0px -45% 0px' }); $$('.pg-slide', sw).forEach((f) => io.observe(f)); }
  }
  applyA11y(); applyStyleAttrs(); startTicker(); bars(); startSlides(); startCatRail(); reelMotion(); floaters(); observeReveal(); observeBuy(); watchRails(); markCached();
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

  lastY = y;
}, { passive: true });

// Product page: pinned buy bar once the main button scrolls out of view.
let buyObs;
function observeBuy() {
  buyObs?.disconnect(); $('.buy-bar')?.remove();
  const btn = $('form[data-form="add"] [type="submit"]'); const p = location.hash.startsWith('#/product/') && db.product(location.hash.split('/')[2]);
  if (!btn || !p) return;
  const bar = document.createElement('div'); bar.className = 'buy-bar'; bar.setAttribute('aria-hidden', 'true');
  render(bar, html`<div class="wrap"><span class="bb-name">${p.name[getLang()]}</span><span class="bb-price" id="bb-price">${($('.pp-now') || $('#pdp-price'))?.textContent || ''}</span><button class="btn" data-action="buy-bar" tabindex="-1">${t('addToCart')}</button></div>`);
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
  $$('[style-h]', root).forEach((e) => e.style.setProperty('--h', e.getAttribute('style-h') / 100));
  $$('[style-d]', root).forEach((e) => e.style.setProperty('--d', e.getAttribute('style-d')));
}

// Images: mark loaded ones (fade-in, hover swaps only when ready) and retry a failed image once.
const fitArch = (i) => { const a = i.closest('.lbl-arch'); if (a && i.classList.contains('m1') && i.naturalWidth) a.classList.toggle('wide', i.naturalWidth / i.naturalHeight > 1.3); };
document.addEventListener('load', (e) => { if (e.target.tagName === 'IMG') { e.target.classList.add('ld'); fitArch(e.target); } }, true);
document.addEventListener('error', (e) => {
  const i = e.target; if (i.tagName !== 'IMG' || i.dataset.retry) return;
  i.dataset.retry = '1'; const src = i.getAttribute('src'); i.removeAttribute('srcset');
  setTimeout(() => { i.src = src + (src.includes('?') ? '&' : '?') + 'r=' + Date.now(); }, 400);
}, true);
// Images already in cache fire 'load' before listeners see them.
const markCached = () => $$('img').forEach((i) => { if (i.complete && i.naturalWidth) { i.classList.add('ld'); fitArch(i); } });
// Horizontal rails: native lazy-loading ignores sideways scrolling, so load a rail's images once it nears the viewport.
const railObs = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.querySelectorAll('img[loading="lazy"]').forEach((im) => (im.loading = 'eager')); railObs.unobserve(en.target); } }), { rootMargin: '300px' }) : null;
const watchRails = () => railObs && $$('.rail').forEach((r) => railObs.observe(r));

// ---------- Back-office command palette (Ctrl/⌘+K) ----------
let ckRelease;
function openPalette() {
  if ($('#cmdk')) return;
  const w = document.createElement('div'); w.id = 'cmdk'; w.className = 'cmdk-bg';
  render(w, html`<div class="cmdk" role="dialog" aria-modal="true" aria-label="${getLang() === 'he' ? 'חיפוש ופקודות' : 'Search & commands'}">
    <input id="ck-q" type="search" autocomplete="off" placeholder="${getLang() === 'he' ? 'מה לעשות? חפשו הזמנה, מוצר, לקוח או פעולה' : 'Search orders, products, customers or actions'}" data-input="ck-q">
    <div class="ck-list" id="ck-list">${A.palette('')}</div>
    <p class="ck-foot"><kbd>↑</kbd><kbd>↓</kbd> ${getLang() === 'he' ? 'ניווט' : 'navigate'} · <kbd>Enter</kbd> ${getLang() === 'he' ? 'בחירה' : 'select'} · <kbd>Esc</kbd> ${getLang() === 'he' ? 'סגירה' : 'close'}</p></div>`);
  document.body.append(w); markActive(0);
  ckRelease = trapFocus(w.firstElementChild, closePalette);
  setTimeout(() => $('#ck-q')?.focus(), 30);
}
function closePalette() { const w = $('#cmdk'); if (!w) return; w.remove(); ckRelease?.(); ckRelease = null; }
function markActive(i) { const it = $$('#ck-list .ck-i'); it.forEach((x, k) => x.classList.toggle('act', k === i)); it[i]?.scrollIntoView({ block: 'nearest' }); }
document.addEventListener('keydown', (e) => {
  const bo = /^#\/(admin|orders|courier)/.test(location.hash);
  if (bo && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#cmdk') ? closePalette() : openPalette(); return; }
  if (!$('#cmdk')) return;
  const it = $$('#ck-list .ck-i'); let i = it.findIndex((x) => x.classList.contains('act'));
  if (e.key === 'ArrowDown') { e.preventDefault(); markActive(Math.min(it.length - 1, i + 1)); }
  if (e.key === 'ArrowUp') { e.preventDefault(); markActive(Math.max(0, i - 1)); }
  if (e.key === 'Enter' && e.target.id === 'ck-q') { e.preventDefault(); it[i]?.click(); }
});

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

// ---------- Mobile menu drawer: locked page, inner scroll, swipe/backdrop/Esc to close, position restored ----------
let menuY = 0, menuRelease = null;
function openMenu() {
  const nav = $('#nav'); if (!nav || nav.classList.contains('open')) return;
  menuY = window.scrollY; document.body.style.top = `-${menuY}px`; document.body.classList.add('menu-open');
  nav.classList.add('open'); nav.scrollTop = 0; $('[data-action="menu"]')?.setAttribute('aria-expanded', 'true');
  menuRelease = trapFocus(nav, closeMenu);
}
function closeMenu() {
  const nav = $('#nav'); if (!nav || !nav.classList.contains('open')) return;
  nav.classList.remove('open'); document.body.classList.remove('menu-open'); document.body.style.top = '';
  window.scrollTo({ top: menuY, behavior: 'instant' }); $('[data-action="menu"]')?.setAttribute('aria-expanded', 'false'); menuRelease?.(); menuRelease = null;
}
// Drag-to-close: the drawer follows the finger from anywhere on screen; release past 30% (or a quick flick) closes it.
let drag = null;
document.addEventListener('touchstart', (e) => {
  const nav = $('#nav'); if (!nav?.classList.contains('open') || e.touches.length !== 1) return;
  drag = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), dx: 0, axis: null, w: nav.offsetWidth };
}, { passive: true });
document.addEventListener('touchmove', (e) => {
  if (!drag) return; const nav = $('#nav'); const bg = $('.nav-bg');
  const dx = e.touches[0].clientX - drag.x, dy = e.touches[0].clientY - drag.y;
  if (!drag.axis) { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; if (drag.axis === 'x') { nav.classList.add('dragging'); bg?.classList.add('dragging'); } }
  if (drag.axis !== 'x') { if (!e.target.closest('#nav')) e.preventDefault(); return; }
  e.preventDefault();
  const dir = document.dir === 'rtl' ? 1 : -1; const off = Math.max(0, dx * dir); drag.dx = off;
  nav.style.setProperty('transform', `translateX(${off * dir}px)`, 'important'); if (bg) bg.style.setProperty('opacity', String(Math.max(0, 1 - off / drag.w)), 'important');
}, { passive: false });
document.addEventListener('touchend', () => {
  if (!drag) return; const nav = $('#nav'); const bg = $('.nav-bg'); const d = drag; drag = null;
  if (d.axis !== 'x') return;
  nav.classList.remove('dragging'); bg?.classList.remove('dragging'); nav.style.removeProperty('transform'); bg?.style.removeProperty('opacity');
  const fast = d.dx / Math.max(1, Date.now() - d.t) > 0.5;
  if (d.dx > d.w * 0.3 || (fast && d.dx > 40)) closeMenu();
}, { passive: true });
window.addEventListener('hashchange', () => { if ($('#nav')?.classList.contains('open')) { menuY = 0; closeMenu(); } });

// ---------- Modal ----------
let releaseModal;
function modal(tpl) { closeModal(); const w = document.createElement('div'); w.id = 'modal'; render(w, tpl); document.body.append(w); releaseModal = trapFocus(w.firstElementChild, closeModal); }
function closeModal() { $('#modal')?.remove(); releaseModal?.(); releaseModal = null; }

// ---------- Events (delegated; no inline handlers → strict CSP) ----------
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]'); if (!el) return;
  const { action, id } = el.dataset;
  if (el.closest('#cmdk') && action !== 'cmdk-close') closePalette();
  switch (action) {
    case 'lang': setLang(getLang() === 'he' ? 'en' : 'he'); rerender(); break;
    case 'menu': openMenu(); break;
    case 'menu-close': closeMenu(); break;
    case 'cart-open': openCart(); break;
    case 'search-open': if ($('#nav').classList.contains('open')) { $('#nav').classList.remove('open'); $('[data-action="menu"]').setAttribute('aria-expanded', 'false'); } openSearch(); break;
    case 'filter-open': modal(S.filterSheet(state.f, location.hash.split('/')[2] || '')); break;
    case 'filter-clear': state.f = {}; rerender(); break;
    case 'pk-fill': { const box = $('.pk-groups'); const max = +box.dataset.max; const all = $$('[data-input="pick"]'); let need = max - all.filter((c) => c.checked).length; if (need <= 0) break;
      const rank = (c) => (/מלון|hotel/i.test(c.closest('.pk-g')?.textContent || '') ? 0 : 1); const pool = all.filter((c) => !c.checked && !c.disabled).sort((a, b) => rank(a) - rank(b));
      if (pool.length < need) { toast(getLang() === 'he' ? 'לא הצלחנו להשלים את הערכה כרגע. בחרו ניחוח אחר או נסו שוב.' : 'Could not complete the kit.'); break; }
      pool.slice(0, need).forEach((c) => { c.checked = true; c.closest('.pk-chip')?.classList.add('auto'); c.closest('.pk-g')?.setAttribute('open', ''); });
      pool[need - 1].dispatchEvent(new Event('change', { bubbles: true })); toast(getLang() === 'he' ? 'השלמנו לכם את הערכה — אפשר להחליף כל ריח' : 'Kit completed — swap any scent'); break; }
    case 'vipf-x': try { sessionStorage.setItem('say_vipf', '1'); } catch {} document.querySelector('.vipf')?.remove(); break;
    case 'ad-def': case 'ad-del': { const cur = (db.profileOf().full.addresses || []).slice(); const i = +el.dataset.i; if (action === 'ad-del') cur.splice(i, 1); else cur.forEach((x, k) => (x.def = k === i)); if (cur.length && !cur.some((x) => x.def)) cur[0].def = true; db.updateMe({ addresses: cur }); rerender(); break; }
    case 'zoom': { const src = el.getAttribute('src').replace(/-sm\.webp$/, '.webp'); const w = document.createElement('div'); w.className = 'lbx'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-label', el.alt || 'image');
      render(w, html`<button class="lbx-x" data-action="lbx-close" aria-label="${t('close')}">×</button><div class="lbx-in"><img src="${src}" alt="${el.alt}"></div>`); document.body.append(w); document.body.classList.add('no-scroll'); const rel = trapFocus(w, () => $('.lbx-x')?.click()); w._rel = rel; break; }
    case 'lbx-close': { const w = $('.lbx'); w?._rel?.(); w?.remove(); document.body.classList.remove('no-scroll'); break; }
    case 'top': window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'join-club': e.preventDefault(); if (document.body.classList.contains('cart-open')) $('[data-action="cart-close"]')?.click(); if ($('#nav')?.classList.contains('open')) $('[data-action="menu-close"]')?.click(); if (db.me()) { location.hash = '#/club'; break; } maybePromo(0, true); break;
    case 'gd-jump': e.preventDefault(); document.getElementById(el.dataset.t)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
    case 'oil-add': { db.addToCart(id, el.dataset.size, 1); closeModal(); rerender(); if (!location.hash.startsWith('#/checkout')) openCart(); toast(getLang() === 'he' ? 'התמצית נוספה להזמנה' : 'Oil added'); break; }
    case 'oil-skip': { closeModal(); const f = $('form[data-form="checkout"]'); f?.requestSubmit(); break; }
    case 'reel-toggle': { const v = el.parentElement.querySelector('video'); const he = getLang() === 'he'; if (v.paused) { v.play(); el.setAttribute('aria-pressed', 'false'); el.setAttribute('aria-label', he ? 'עצירת הסרטון' : 'Pause video'); el.classList.remove('paused'); } else { v.pause(); el.setAttribute('aria-pressed', 'true'); el.setAttribute('aria-label', he ? 'הפעלת הסרטון' : 'Play video'); el.classList.add('paused'); } break; }
    case 'rv-ok': db.setReview(id, 'approved'); rerender(); break;
    case 'rv-hide': db.setReview(id, 'hidden'); rerender(); break;
    case 'rv-del': if (confirm(getLang() === 'he' ? 'למחוק את הביקורת?' : 'Delete review?')) { db.deleteReview(id); rerender(); } break;
    case 'mood': { const k = el.dataset.k; const cur = state.f.notes || []; state.f = { ...state.f, notes: cur.includes(k) ? cur.filter((x) => x !== k) : [k] }; rerender(); setTimeout(() => $('#oz-all')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); break; }
    case 'cmdk-open': openPalette(); break;
    case 'cmdk-close': closePalette(); break;
    case 'goto-new': closePalette(); state.os = 'new'; state.ov = 'queue'; location.hash = '#/orders'; rerender(); break;
    case 'pv': state.pv = el.dataset.v; rerender(); break;
    case 'noop': { const cb = el.querySelector('input'); if (cb && e.target !== cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change', { bubbles: true })); } break; }
    case 'sel-clear': state.sel.clear(); rerender(); break;
    case 'bulk-print': {
      let area = $('#print-area'); if (!area) { area = document.createElement('div'); area.id = 'print-area'; document.body.append(area); }
      render(area, A.packingSlips([...state.sel])); document.body.classList.add('printing');
      addEventListener('afterprint', () => document.body.classList.remove('printing'), { once: true }); print(); break;
    }
    case 'promo-close': closePromo(); break;
    case 'promo-join': closePromo(); state.authTab = 'register'; break;
    case 'fq': state.finder = { ...state.finder, [el.dataset.k]: el.dataset.v }; go(); break;
    case 'fq-back': { const f = state.finder; if (f.mood) delete f.mood; else delete f.space; go(); break; }
    case 'fq-reset': state.finder = {}; go(); break;
    case 'fq-start': state.finder = { space: el.dataset.v }; location.hash = '#/finder'; break;
    case 'metric': state.metric = el.dataset.k; rerender(); break;
    case 'range': state.range = +el.dataset.n; rerender(); break;
    case 'pcat': state.pcat = el.dataset.c; rerender(); break;
    case 'utab': state.ur = el.dataset.t; rerender(); break;
    case 'cust-open': if (e.target.closest('[data-action="approve-ws"]')) break; modal(A.customerDrawer(id)); break;
    case 'staff-open': modal(A.staffDrawer(id, el.dataset.role)); break;
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
    case 'slide-step': showSlide(slideIdx + +el.dataset.d); clearInterval(slideTimer); break;
    case 'thumb': { const f = $$('.pg-slide')[+el.dataset.i]; const sw = $('.swipe'); if (!f || !sw) break; if (sw.scrollWidth > sw.clientWidth + 2) sw.scrollTo({ left: f.offsetLeft - sw.offsetLeft, behavior: 'smooth' }); else window.scrollTo({ top: f.getBoundingClientRect().top + scrollY - 110, behavior: 'smooth' }); break; }
    case 'go-cart': closeModal(); openCart(); break;
    case 'qa-step': { const n = el.closest('.qa')?.querySelector('.qa-n'); if (n) n.textContent = Math.max(1, Math.min(20, (+n.textContent || 1) + +el.dataset.d)); break; }
    case 'quick-add': { const p = db.product(id); const n = Math.max(1, Math.min(20, +(el.closest('.qa')?.querySelector('.qa-n')?.textContent) || 1)); db.addToCart(id, p.sizes[0].label, n, p.options?.[0]?.values?.[0]?.he || ''); refreshCart?.(); toast(`${t('added')}: ${p.name[getLang()]}${n > 1 ? ` × ${n}` : ''}`); const q = el.closest('.qa')?.querySelector('.qa-n'); if (q) q.textContent = '1';
      if (p.cat === 'diffusers' && S.needsOil()) { modal(S.oilNudge('add')); break; }
      if (!document.body.classList.contains('cart-open')) openCart(); break; }
    case 'oil-later': closeModal(); openCart(); break;
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
    case 'block-user': { const u = db.users().find((x) => x.id === id); db.updateUser(id, { blocked: !u.blocked }); closeModal(); toast(getLang() === 'he' ? 'עודכן' : 'Updated'); rerender(); break; }
    case 'del-user': if (confirm(getLang() === 'he' ? 'למחוק את המשתמש לצמיתות?' : 'Delete user permanently?')) { db.deleteUser(id); closeModal(); rerender(); } break;
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
  if (e.target.id === 'promo') closePromo();
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
  if (k === 'oz-q') { let n = 0; $$('.ox-grid > .card').forEach((c) => { const p = db.product(c.dataset.pid); const ok = !v || (p && S.matchProduct(p, v)); c.hidden = !ok; if (ok) n++; }); const cnt = $('#oz-all .count b'); if (cnt) cnt.textContent = n; }
  if (k === 'pq') { state.pq = v; searchDeb(); keepFocus('#pq'); }
  if (k === 'uq') { state.uq = v; searchDeb(); keepFocus('#uq'); }
  if (k === 'oq') { state.oq = v; searchDeb(); keepFocus('#oq'); }
  if (k === 'bo-q') boSearchDeb(v);
  if (k === 'ck-q') { const l = $('#ck-list'); if (l) { render(l, A.palette(v)); markActive(0); } }
});
function keepFocus(sel) { setTimeout(() => { const i = $(sel); if (i && document.activeElement !== i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); }
document.addEventListener('change', (e) => {
  const el = e.target; const k = el.dataset.input; if (!k) return;
  const map = { sort: 'sort', range: 'range', pcat: 'pcat', ur: 'ur', om: 'om', os: 'os' };
  if (map[k]) { state[map[k]] = k === 'range' ? +el.value : el.value; rerender(); }
  if (k === 'size') {
    const fmt = (n) => new Intl.NumberFormat(getLang() === 'he' ? 'he-IL' : 'en-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);
    const now = $('.pp-now'), was = $('.pp-was'), note = $('.pp-note'), w = +el.dataset.was || 0;
    if (now) now.textContent = fmt(+el.dataset.price);
    if (was) { was.hidden = !w; $('s', was).textContent = w ? fmt(w) : ''; $('em', was).textContent = w ? `−${el.dataset.save}%` : ''; }
    if (note) note.hidden = !w;
    const k = $('.ml10'); if (k) k.hidden = !/^10\s*מ"ל$|^10\s*ml$/i.test(el.value.trim());
  }
  if (k === 'opt' && el.dataset.img) {
    const want = el.dataset.img.replace(/-sm\.webp$/, '.webp'); const slides = $$('.pg-slide'); let i = slides.findIndex((f) => f.querySelector('img').getAttribute('src').replace(/-sm\.webp$/, '.webp') === want);
    if (i < 0 && slides[0]) { slides[0].querySelector('img').src = el.dataset.img; i = 0; }
    $$('.pg-rail button')[i]?.click();
  }
  if (k === 'use-points') { db.setUsePoints(el.checked); rerender(); return; }
  if (k === 'pick' || k === 'surprise') {
    const box = $('.pick-groups'); const max = +box.dataset.max; const sur = $('[data-input="surprise"]').checked;
    const picked = $$('[data-input="pick"]:checked');
    if (picked.length > max) { el.checked = false; toast(getLang() === 'he' ? `אפשר לבחור עד ${max} ניחוחות` : `Up to ${max} scents`); }
    $$('[data-input="pick"]').forEach((c) => (c.disabled = sur));
    $('#pick-count').textContent = sur ? (getLang() === 'he' ? 'נבחר' : 'Set') : `${$$('[data-input="pick"]:checked').length}/${max}`;
    const n = $$('[data-input="pick"]:checked').length; const fill = $('#pk-fill'); const fb = $('.pk-fill'); if (fb) fb.hidden = sur || n === 0 || n >= max; if (fill) fill.style.width = (sur ? 100 : Math.round((n / max) * 100)) + '%';
    $('.pk')?.classList.toggle('done', sur || n === max); $('.pk-groups')?.classList.toggle('off', sur);
    $$('.pk-g-n').forEach((b) => { const c = $$(`[data-input="pick"][data-g="${b.dataset.g}"]:checked`).length; b.textContent = c ? c : ''; });
  }
  if (k === 'ws-toggle') $('#biz-f').hidden = !el.checked;
  if (k === 'sel') { el.checked ? state.sel.add(el.dataset.id) : state.sel.delete(el.dataset.id); rerender(); }
  if (k === 'sel-all') { $$('[data-input="sel"]').forEach((c) => (el.checked ? state.sel.add(c.dataset.id) : state.sel.delete(c.dataset.id))); rerender(); }
  if (k === 'bulk-status' && el.value) { const n = state.sel.size; state.sel.forEach((oid) => db.setOrderStatus(oid, el.value, db.me()?.name)); state.sel.clear(); toast(getLang() === 'he' ? `${n} הזמנות עודכנו` : `${n} orders updated`); rerender(); }
  if (k === 'p-stock') { const p = db.product(el.dataset.id); db.saveProduct({ ...p, stock: Math.max(0, parseInt(el.value) || 0) }); toast(getLang() === 'he' ? 'המלאי עודכן' : 'Stock updated'); }
  if (k === 'p-price') { const p = db.product(el.dataset.id); const v2 = Math.max(0, +el.value || 0); if (v2) { const sizes = p.sizes.map((x, i) => (i ? x : { ...x, price: v2 })); db.saveProduct({ ...p, sizes }); toast(getLang() === 'he' ? 'המחיר עודכן' : 'Price updated'); } }
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
    if (p.cat === 'diffusers' && S.needsOil()) modal(S.oilNudge('add')); else if (p.upsellKit && !db.cart().some((l) => db.product(l.pid)?.picks)) modal(S.kitUpsell()); else openCart();
  }
  if (kind === 'club') {
    const email = clean(f.email.value, 120);
    if (!valid.email(email)) { f.email.setAttribute('aria-invalid', 'true'); toast(t('badEmail')); f.email.focus(); return; }
    db.joinClub(email); f.reset(); toast(t('joined')); $('#club-msg') && ($('#club-msg').textContent = t('joined'));
  }
  if (kind === 'club-join') {
    const he = getLang() === 'he'; const err = $('.cc-err', f); const v = (n) => clean(f.elements[n].value, 160);
    const d = { name: v('name'), phone: normPhone(v('phone')), email: v('email'), password: f.elements.password.value };
    const bad = !valid.name(d.name) ? (he ? 'נא למלא שם מלא' : 'Please enter your name') : !valid.phone(d.phone) ? (he ? 'מספר טלפון לא תקין' : 'Invalid phone') : !valid.email(d.email) ? (he ? 'כתובת אימייל לא תקינה' : 'Invalid email') : !valid.password(d.password) ? (he ? 'סיסמה: לפחות 8 תווים, אות ומספר' : 'Password: 8+ chars, a letter and a digit') : !f.elements.agree.checked ? (he ? 'יש לאשר את ההצטרפות' : 'Please confirm') : '';
    if (bad) { err.textContent = bad; return; }
    btn.disabled = true;
    try { await db.register({ ...d, newsletter: true }); db.joinClub(d.email.toLowerCase()); }
    catch (x) { err.textContent = ['exists', 'phoneExists'].includes(x.message) ? t(x.message) : t('required'); btn.disabled = false; return; }
    render($('.c3-body, .cc-body'), html`<span class="cc-star" aria-hidden="true">✦</span><h2 id="pr-t">${he ? 'ברוכים הבאים למועדון!' : 'Welcome to the club!'}</h2>
      <p class="cc-sub">${he ? 'קוד הקופון שלכם:' : 'Your coupon code:'}</p><p class="cc-code">SAY15</p>
      <p class="cc-sub">${he ? '15% הנחה יופעלו אוטומטית בקופה בהזמנה הראשונה שלכם — אתם כבר מחוברים.' : '15% off applies automatically at checkout on your first order — you are signed in.'}</p>
      <button class="btn block cc-go" data-action="promo-close">${he ? 'לקניות' : 'Start shopping'}</button>`);
    $('.promo-x')?.removeAttribute('hidden'); rerender(); return;
  }
  if (kind === 'rv-edit') {
    const d = Object.fromEntries(new FormData(f));
    db.updateReview(f.dataset.id, { name: clean(d.name, 60), city: clean(d.city, 40), rating: Math.min(5, Math.max(1, parseInt(d.rating) || 5)), text: clean(d.text, 600) });
    toast(getLang() === 'he' ? 'נשמר' : 'Saved'); rerender(); return;
  }
  if (kind === 'review') {
    const d = Object.fromEntries(new FormData(f)); const err = $('#rv-err'); const he = getLang() === 'he';
    const r = { name: clean(d.name, 60), city: clean(d.city, 40), rating: Math.min(5, Math.max(1, parseInt(d.rating) || 0)), text: clean(d.text, 600) };
    if (!valid.name(r.name) || !d.rating || r.text.length < 10) { err.textContent = he ? 'נא למלא שם, דירוג וכמה מילים על החוויה' : 'Please add your name, a rating and a few words'; return; }
    db.addReview(r); f.innerHTML = `<p class="rv-thanks">${he ? 'תודה רבה! הביקורת תתפרסם אחרי אישור קצר.' : 'Thank you! Your review will appear after a quick check.'}</p>`; return;
  }
  if (kind === 'oil-search') { $('#oz-all')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  if (kind === 'checkout') {
    if (!state.oilAsked && S.needsOil()) { state.oilAsked = true; modal(S.oilNudge()); return; }
    btn.disabled = true;
    try { const o = S.checkoutSubmit(f); if (o) { state.lastOrder = o; location.hash = '#/done'; } } finally { btn.disabled = false; }
  }
  if (kind === 'login' || kind === 'register') {
    btn.disabled = true;
    const ok = await S.authSubmit(f, kind); btn.disabled = false;
    if (ok) { const u = db.me(); location.hash = { admin: '#/admin', products: '#/admin/products', orders: '#/orders', courier: '#/courier' }[u.role] || '#/account'; rerender(); }
  }
  if (kind === 'profile') {
    const d = Object.fromEntries(new FormData(f)); const err = $('#pf-err'); const he = getLang() === 'he';
    if (d.name && !valid.name(d.name)) { err.textContent = he ? 'נא למלא שם תקין' : 'Invalid name'; $('#pf-n').focus(); return; }
    if (d.phone && !valid.phone(d.phone)) { err.textContent = t('badPhone'); $('#pf-p').focus(); return; }
    const bd = /^\d{4}-\d{2}-\d{2}$/.test(d.birthday || '') ? d.birthday : '';
    db.updateMe({ name: clean(d.name, 80), phone: d.phone ? normPhone(d.phone) : '', ...(bd ? { birthday: bd } : {}), newsletter: !!d.newsletter });
    toast(he ? 'הפרטים נשמרו' : 'Saved'); location.hash = '#/account'; return;
  }
  if (kind === 'address') {
    const d = Object.fromEntries(new FormData(f)); const err = $('#ad-err');
    if (!clean(d.city) || !clean(d.street)) { err.textContent = t('required'); return; }
    const cur = db.profileOf().full.addresses || []; const a2 = { label: clean(d.label, 30), city: clean(d.city, 60), street: clean(d.street, 120), apt: clean(d.apt, 40), notes: clean(d.notes, 120), def: !cur.length };
    db.updateMe({ addresses: [...cur, a2].slice(0, 8) }); toast(getLang() === 'he' ? 'הכתובת נשמרה' : 'Saved'); rerender(); return;
  }
  if (kind === 'biz') {
    const d = Object.fromEntries(new FormData(f)); const err = $('#bz-err'); const he = getLang() === 'he';
    if (!clean(d.type) || !clean(d.city) || !valid.name(d.name) || !valid.phone(d.phone)) { err.textContent = `${t('required')} / ${t('badPhone')}`; return; }
    if (!d.agree) { err.textContent = t('mustAgree'); return; }
    const kinds = { wholesale: 'סיטונאות', branding: 'מיתוג אישי', stands: 'סטנד לחנות', rental: 'השכרת מפיצים' };
    const txt = `שלום, הגעתי דרך אתר SAY BOUTIQUE ואני מתעניין/ת ב${kinds[d.kind] || 'שיתוף פעולה עסקי'}\nסוג העסק: ${clean(d.type, 60)}\nעיר: ${clean(d.city, 60)}\nאיש קשר: ${clean(d.name, 80)}\nטלפון: ${normPhone(d.phone)}${clean(d.msg) ? `\n${clean(d.msg, 600)}` : ''}`;
    window.open(`https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener'); err.textContent = ''; toast(he ? 'ההודעה מוכנה בוואטסאפ' : 'Message ready in WhatsApp'); return;
  }
  if (kind === 'contact') {
    const d = Object.fromEntries(new FormData(f)); const err = $('#c-err');
    if (!valid.name(d.name) || !valid.phone(d.phone) || !clean(d.msg)) { err.textContent = `${t('required')} / ${t('badPhone')}`; return; }
    const txt = `שלום, הגעתי דרך אתר SAY BOUTIQUE\nשם: ${clean(d.name, 80)}\nטלפון: ${clean(d.phone, 20)}\n${clean(d.msg, 1000)}`;
    window.open(`https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
    f.reset(); err.textContent = ''; toast(t('sent'));
  }
  if (kind === 'filter') { const d = new FormData(f); const sp = String(d.get('space') || '').slice(0, 80), co = String(d.get('color') || ''); state.f = { str: ['strong', 'soft'].includes(d.get('str')) ? d.get('str') : '', notes: d.getAll('notes').filter((x) => ['sweet', 'fresh', 'floral', 'rich'].includes(x)), stock: !!d.get('stock'), space: (db.SITE.subs?.['מפיצי ריח'] || []).includes(sp) ? sp : '', color: ['לבן', 'שחור', 'ברונזה', 'כסף'].includes(co) ? co : '' }; closeModal(); rerender(); return; }
  if (kind === 'customer') {
    const d = Object.fromEntries(new FormData(f)); const err = $('#cd-err');
    if (!valid.name(d.name)) { err.textContent = t('required'); return; }
    if (d.email && !valid.email(d.email)) { err.textContent = t('badEmail'); return; }
    db.updateUser(f.dataset.id, { name: clean(d.name, 80), phone: normPhone(d.phone), email: clean(d.email, 120), biz: clean(d.biz, 80), note: clean(d.note, 400), newsletter: !!d.newsletter });
    closeModal(); toast(getLang() === 'he' ? 'פרטי הלקוח נשמרו' : 'Customer saved'); rerender();
  }
  if (kind === 'staff') {
    const d = Object.fromEntries(new FormData(f)); const err = $('#sd-err'); const id = f.dataset.id;
    if (!valid.name(d.name)) { err.textContent = t('required'); return; }
    if (!valid.email(d.email)) { err.textContent = t('badEmail'); return; }
    if ((!id || d.password) && !valid.password(d.password)) { err.textContent = t('badPass'); return; }
    try {
      if (id) { db.updateUser(id, { name: clean(d.name, 80), email: clean(d.email, 120), phone: normPhone(d.phone), ...(d.role ? { role: d.role } : {}) }); if (d.password) await db.setPassword(id, d.password); }
      else await db.addStaff({ name: clean(d.name, 80), email: clean(d.email, 120), phone: normPhone(d.phone), role: d.role, password: d.password });
    } catch (x) { err.textContent = ['exists', 'phoneExists'].includes(x.message) ? t(x.message) : t('required'); return; }
    closeModal(); toast(getLang() === 'he' ? 'המשתמש נשמר' : 'User saved'); rerender();
  }
  if (kind === 'product') {
    const fd = new FormData(f); const d = Object.fromEntries(fd); const err = $('#pf-err');
    const multi = (s) => String(s ?? '').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, 4000); // keeps line breaks
    const L_ = fd.getAll('s_label'), P_ = fd.getAll('s_price'), W_ = fd.getAll('s_ws'), C_ = fd.getAll('s_cost');
    const sizes = L_.map((l, i) => ({ label: clean(l, 30), price: Math.max(0, +P_[i] || 0), wholesale: Math.max(0, +W_[i] || 0), cost: Math.max(0, +C_[i] || 0) })).filter((x) => x.label);
    const old = f.dataset.id ? db.product(f.dataset.id) : {};
    const quote = !!old.quote && !sizes.some((x) => x.price > 0);
    if (!clean(d.he) || !sizes.length || (!quote && sizes.some((x) => !x.price))) { err.textContent = getLang() === 'he' ? 'יש למלא שם וגודל אחד לפחות עם מחיר' : 'Name and at least one priced size required'; return; }
    const img = clean(d.imgpick || d.img, 200);
    if (img && !/^(assets\/products\/[\w\-./]+|https:\/\/[\w\-./%?=&]+)$/.test(img)) { err.textContent = getLang() === 'he' ? 'נתיב התמונה אינו תקין' : 'Image path invalid'; return; }
    const id = f.dataset.id || (clean(d.en || d.he, 40).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'p') + '-' + Date.now().toString(36);
    db.saveProduct({ ...old, quote, id, cat: CATEGORIES.some((c) => c.id === d.cat) ? d.cat : 'oils', name: { he: clean(d.he, 120), en: clean(d.en, 120) }, desc: { he: multi(d.dhe), en: multi(d.den) },
      sizes, img, gallery: old.gallery || (img ? [img] : []), was: Math.max(0, +d.was || 0), strength: ['strong', 'soft'].includes(d.strength) ? d.strength : '', notes: fd.getAll('notes').filter((x) => ['sweet', 'fresh', 'floral', 'rich'].includes(x)), tag: d.tag === 'new' || d.tag === 'best' ? d.tag : '', active: !!d.active, stock: Math.max(0, parseInt(d.stock) || 0) });
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
  maybeConsent(); maybePromo();
})();
