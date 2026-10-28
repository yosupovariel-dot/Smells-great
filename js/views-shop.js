import { html, raw, money, valid, clean, toast, PHONE_DISPLAY, PHONE_INTL, FREE_SHIP } from './util.js';
import { t, L, getLang } from './i18n.js';
import { CATEGORIES, COMPLEMENTS, artSVG } from './data.js';
import * as db from './db.js';

const m = (n) => money(n, getLang());
const he = () => getLang() === 'he';
const T = (a, b) => (he() ? a : b);
// Catalog images come in two sizes (name.webp ≤1400px, name-sm.webp ≤640px); cards/lists use the small one.
export const small = (src) => (/^assets\/products\/.+\.webp$/.test(src) && !src.endsWith('-sm.webp') ? src.replace(/\.webp$/, '-sm.webp') : src);
export const media = (p, cls = '', eager = false, src = p.img, full = false) =>
  src
    ? html`<img src="${full ? src : small(src)}" ${raw(full || small(src) === src ? '' : `srcset="${small(src)} 640w, ${src} 1400w" sizes="(max-width:600px) 50vw, 320px"`)} alt="${L(p.name)}" width="1200" height="900" ${raw(eager ? 'fetchpriority="high"' : 'loading="lazy"')} decoding="async" class="${cls}">`
    : raw(artSVG(p, cls));
const catName = (id) => L(CATEGORIES.find((c) => c.id === id));
export const subName = (s) => (he() ? s : db.SITE.site?.subEn?.[s] || s);
const active = () => db.products().filter((p) => p.active !== false);
const minPrice = (p, ws) => Math.min(...p.sizes.map((s) => (ws && s.wholesale ? s.wholesale : s.price)));
const waLink = (txt) => `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(txt)}`;

export function priceTag(p) {
  if (p.quote) return html`<span class="price">${T('מחיר בהתאמה אישית', 'Price on request')}</span>`;
  const ws = db.me()?.role === 'wholesale';
  const from = p.sizes.length > 1 ? T('החל מ־', 'From ') : '';
  return html`<span class="price">${from}${m(minPrice(p, ws))}${ws ? html`<s>${m(minPrice(p, false))}</s>` : ''}</span>`;
}

export function card(p) {
  const cls = `card${p.wide ? ' wide' : ''}`;
  const quick = p.quote || p.picks || p.options?.length || p.sizes.length > 1
    ? html`<a class="btn block sm" href="#/product/${p.id}">${p.quote ? T('לפרטים', 'Details') : T('לבחירה', 'Choose options')}</a>`
    : html`<button class="btn block sm" data-action="quick-add" data-id="${p.id}" aria-label="${t('quickAdd')}: ${L(p.name)}">${t('quickAdd')}</button>`;
  return html`<article class="${cls}">
    <a class="card-media ${p.fit === 'contain' ? 'contain' : ''}" href="#/product/${p.id}" tabindex="-1" aria-hidden="true">${media(p)}${p.gallery?.[1] && p.fit === 'contain' ? media(p, 'alt-img', false, p.gallery[1]) : ''}</a>
    ${p.tag ? html`<span class="card-tag">${t('tag_' + p.tag)}</span>` : ''}
    <div class="card-quick">${quick}</div>
    <div class="card-body">
      <small class="muted">${p.sub ? subName(p.sub) : catName(p.cat)}</small>
      <h3><a href="#/product/${p.id}">${L(p.name)}</a></h3>
      ${priceTag(p)}
    </div>
  </article>`;
}

// ---------- Home ----------
export function home() {
  const all = active();
  const hero = db.SITE.site?.hero || [];
  const diff = all.filter((p) => p.cat === 'diffusers');
  const kits = all.filter((p) => p.picks);
  const hotels = all.filter((p) => p.sub?.startsWith('🏨')).slice(0, 4);
  const words = ['King David', 'Royal Beach', 'Hilton', 'White Tea', 'Royal Amber', 'Pure Vanilla', 'Sea Breeze', 'Grand Heritage'];
  return html`
  <section class="hero" aria-labelledby="hero-t">
    <div class="hero-copy">
      <p class="eyebrow latin">${t('heroEyebrow')}</p>
      <h1 id="hero-t">${t('heroTitle1')}<br><em>${t('heroTitle2')}</em></h1>
      <span class="rule"></span>
      <p>${t('heroText')}</p>
      <div class="hero-cta"><a class="btn" href="#/shop/diffusers">${T('למפיצי הריח', 'Shop diffusers')}</a><a class="btn ghost" href="#/shop/oils">${t('discover')}</a></div>
    </div>
    <div class="hero-art">
      ${hero.length ? html`<div class="slides" role="region" aria-roledescription="carousel" aria-label="${T('מבצעים ומארזים', 'Featured')}">
        ${hero.map((src, i) => html`<img class="slide ${i ? '' : 'on'}" src="${src}" alt="${T('מפיצי ריח ותמציות SAY Boutique', 'SAY Boutique diffusers and oils')}" width="2000" height="1100" ${raw(i ? 'loading="lazy"' : 'fetchpriority="high"')} decoding="async">`)}
        <div class="dots">${hero.map((_, i) => html`<button data-action="slide" data-i="${i}" aria-label="${T('שקופית', 'Slide')} ${i + 1}" aria-current="${i === 0}"></button>`)}</div>
      </div>` : raw('<div class="arch"></div>')}
    </div>
    <div class="hero-meta"><span>LUXURY HOME FRAGRANCES</span><span>${PHONE_DISPLAY}</span></div>
  </section>
  <div class="marquee" aria-hidden="true"><div>${[...words, ...words].map((w) => html`<span>${w}</span><span>✦</span>`)}</div></div>
  <section class="block" aria-labelledby="cats-t"><div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">SAY Boutique</p><h2 id="cats-t">${t('categories')}</h2></div></div>
    <nav class="cat-tiles" aria-label="${t('categories')}">${CATEGORIES.map((c) => html`<a class="tile ${c.img ? '' : 'soon'}" href="#/shop/${c.id}">
      ${c.img ? html`<img src="${small(c.img)}" srcset="${small(c.img)} 640w, ${c.img} 1400w" sizes="(max-width:860px) 50vw, 40vw" alt="" loading="lazy" width="800" height="600">` : html`<img class="tile-mark" src="assets/img/mark.webp" alt="" loading="lazy" width="180" height="156">`}
      <span><b>${L(c)}</b><small>${he() ? c.descHe : c.descEn}</small></span></a>`)}</nav>
  </div></section>
  <section class="block tight" aria-labelledby="best-t"><div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">${T('טכנולוגיית אידוי קר', 'Cold-air technology')}</p><h2 id="best-t">${T('מפיצי הריח שלנו', 'Our diffusers')}</h2></div><a href="#/shop/diffusers">${t('viewAll')} ←</a></div>
    <div class="grid">${diff.slice(0, 4).map(card)}</div>
  </div></section>
  <div class="wrap"><div class="features">
    <div><b>${t('f1')}</b><span>${t('f1s')}</span></div><div><b>${t('f2')}</b><span>${t('f2s')}</span></div>
    <div><b>${T('שנת אחריות', '1-year warranty')}</b><span>${T('אחריות יבואן על המכשירים', 'Importer warranty on devices')}</span></div><div><b>${t('f4')}</b><span>${t('f4s')}</span></div>
  </div></div>
  ${kits.length ? html`<section class="block" aria-labelledby="kit-t"><div class="wrap story">
    <div class="story-art photo">${media(kits[0])}</div>
    <div><p class="eyebrow">${T('מומלץ ללקוחות חדשים', 'Recommended for newcomers')}</p><h2 id="kit-t">${T('לא בטוחים איזה ריח? תתנסו בכולם.', 'Not sure which scent? Try them all.')}</h2><span class="rule"></span>
      <p>${T('ערכות ההתנסות שלנו — 14 תמציות של 10 מ"ל או 4 תמציות של 30 מ"ל — במארז יוקרתי, ב־99₪ בלבד. בוחרים את הניחוחות, מגלים את ניחוח החתימה של הבית.', 'Our discovery kits — 14 × 10 ml or 4 × 30 ml — in a luxury box for just ₪99. Choose your scents and find your home’s signature.')}</p>
      <div class="hero-cta">${kits.map((k) => html`<a class="btn ${k.picks === 14 ? '' : 'ghost'}" href="#/product/${k.id}">${k.picks} ${T('תמציות', 'oils')}</a>`)}</div></div>
  </div></section>` : ''}
  <section class="block tight" aria-labelledby="new-t"><div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">${T('תמציות שמן', 'Fragrance oils')}</p><h2 id="new-t">${T('הניחוח של בתי המלון', 'The scent of hotels')}</h2></div><a href="#/shop/oils">${t('viewAll')} ←</a></div>
    <div class="grid wide-grid">${hotels.map(card)}</div>
  </div></section>
  <div class="wrap"><section class="story block" aria-labelledby="story-t">
    <div class="story-art" aria-hidden="true"><img src="assets/img/logo.webp" alt="" width="290" height="450" loading="lazy"></div>
    <div><p class="eyebrow">${t('storyEyebrow')}</p><h2 id="story-t">${t('storyTitle')}</h2><span class="rule"></span><p>${t('storyText')}</p><a class="btn ghost" href="#/about">${t('about')}</a></div>
  </section></div>
  ${clubBlock()}`;
}

export const clubBlock = () => html`<section class="block club" aria-labelledby="club-t"><div class="wrap">
  <p class="eyebrow latin">Members Club</p><h2 id="club-t">${t('clubTitle')}</h2><p>${t('clubText')}</p>
  <form data-form="club" novalidate><label class="sr-only" for="club-email">${t('email')}</label>
  <input class="input" id="club-email" name="email" type="email" autocomplete="email" required placeholder="${t('email')}" maxlength="120">
  <button class="btn" type="submit">${t('clubBtn')}</button></form>
  <p class="sr-only" aria-live="polite" id="club-msg"></p>
</div></section>`;

// ---------- Shop ----------
export function shop(cat, q = '', sort = 'pop', sub = '') {
  let list = active();
  if (cat) list = list.filter((p) => p.cat === cat);
  if (sub) list = list.filter((p) => p.sub === sub);
  if (q) { const s = q.toLowerCase(); list = list.filter((p) => (p.name.he + ' ' + p.name.en + ' ' + (p.sub || '')).toLowerCase().includes(s)); }
  if (sort === 'low') list.sort((a, b) => minPrice(a) - minPrice(b));
  if (sort === 'high') list.sort((a, b) => minPrice(b) - minPrice(a));
  if (sort === 'name') list.sort((a, b) => L(a.name).localeCompare(L(b.name), getLang()));
  const count = (c) => active().filter((p) => !c || p.cat === c).length;
  const c = CATEGORIES.find((x) => x.id === cat);
  const subs = (db.SITE.subs?.[c?.he] || []).filter((s) => active().some((p) => p.sub === s));
  const banner = sub && db.SITE.site?.subBanners?.[sub];
  const soon = c && !count(cat);
  return html`<div class="wrap">
    <div class="crumbs"><a href="#/">${t('home')}</a> / ${cat ? html`<a href="#/shop/${cat}">${catName(cat)}</a>` : t('shop')}${sub ? html` / ${subName(sub)}` : ''}</div>
    ${banner ? html`<div class="sub-banner"><img src="${banner}" alt="" width="1600" height="700"><h1>${subName(sub)}</h1></div>` : html`<h1>${sub ? subName(sub) : cat ? catName(cat) : t('shop')}</h1>`}
    ${subs.length > 1 ? html`<nav class="chips" aria-label="${T('תת־קטגוריות', 'Subcategories')}"><a href="#/shop/${cat}" aria-current="${!sub}">${t('all')}</a>${subs.map((s) => html`<a href="#/shop/${cat}/${encodeURIComponent(s)}" aria-current="${s === sub}">${subName(s)}</a>`)}</nav>` : ''}
    <div class="shop">
      <aside class="filters" aria-label="${t('categories')}"><h2>${t('categories')}</h2><ul>
        <li><a href="#/shop" aria-current="${!cat}">${t('all')} <span>${count()}</span></a></li>
        ${CATEGORIES.map((x) => html`<li><a href="#/shop/${x.id}" aria-current="${cat === x.id}">${L(x)} <span>${count(x.id) || T('בקרוב', 'soon')}</span></a></li>`)}
      </ul></aside>
      <div>
        ${soon ? html`<div class="soon-box"><img src="assets/img/mark.webp" alt="" width="180" height="156"><h2>${T('הקטגוריה תעלה בקרוב', 'Coming soon')}</h2><p>${T('אנחנו מכינים עבורכם קולקציה חדשה. רוצים לשמוע ראשונים או להזמין כבר עכשיו?', 'A new collection is on its way. Want to hear first or order now?')}</p><a class="btn" href="${waLink(T('שלום, אשמח לפרטים על ', 'Hello, I would like details about ') + catName(cat))}" target="_blank" rel="noopener noreferrer">WhatsApp</a></div>` : html`
        <div class="toolbar">
          <div><label class="sr-only" for="q">${t('search')}</label><input class="input" id="q" type="search" value="${q}" placeholder="${t('search')}…" data-input="search" maxlength="60"></div>
          <div><label for="sort" class="muted">${t('sortBy')}: </label><select class="input" id="sort" data-input="sort">
            ${[['pop', 'sortPop'], ['low', 'sortLow'], ['high', 'sortHigh'], ['name', 'sortName']].map(([v, k]) => html`<option value="${v}" ${raw(sort === v ? 'selected' : '')}>${t(k)}</option>`)}
          </select></div>
        </div>
        <p class="muted" aria-live="polite">${list.length} ${t('results')}</p>
        ${list.length ? html`<div class="grid ${list.every((p) => p.wide) ? 'wide-grid' : ''}">${list.map(card)}</div>` : html`<p>${t('noResults')}</p>`}`}
      </div>
    </div></div><div class="block"></div>`;
}

export function complements(p, n = 4) {
  const picks = [];
  for (const id of p.related || COMPLEMENTS[p.cat] || []) { const x = db.product(id); if (x && x.id !== p.id && x.active !== false) picks.push(x); }
  for (const x of active()) if (picks.length < n && !picks.includes(x) && x.id !== p.id && x.sub === p.sub) picks.push(x);
  return picks.slice(0, n);
}

// Renders the sheet's rich description (emoji headings, "title: text" bullets).
function richText(text) {
  const out = []; let list = [];
  const flush = () => { if (list.length) { out.push(html`<ul class="feat">${list}</ul>`); list = []; } };
  for (const line of String(text || '').split('\n').map((l) => l.trim()).filter(Boolean)) {
    const m2 = line.match(/^([^:]{2,40}):\s*(.+)$/);
    if (/^\p{Extended_Pictographic}/u.test(line) && line.length < 90) { flush(); out.push(html`<h3 class="rt-h">${line}</h3>`); }
    else if (m2) list.push(html`<li><b>${m2[1]}:</b> ${m2[2]}</li>`);
    else { flush(); out.push(html`<p>${line}</p>`); }
  }
  flush(); return out;
}

export function productPage(id) {
  const p = db.product(id);
  if (!p || p.active === false) return null;
  const ws = db.me()?.role === 'wholesale';
  const gallery = [...new Set([p.img, ...(p.gallery || [])].filter(Boolean))];
  const opt = p.options?.[0];
  const priceOf = (s) => (ws && s.wholesale ? s.wholesale : s.price);
  const pickList = p.picks ? (p.pickFrom || []).map((x) => db.product(x)).filter(Boolean) : [];
  const groups = [...new Set(pickList.map((x) => x.sub))];
  return html`<div class="wrap"><div class="pdp">
    <div class="pdp-gallery">
      <div class="pdp-media ${p.fit === 'contain' ? 'contain' : ''}" data-zoom>${media(p, '', true, gallery[0], true)}</div>
      ${gallery.length > 1 ? html`<div class="thumbs" role="group" aria-label="${T('תמונות המוצר', 'Product images')}">${gallery.map((g, i) => html`<button data-action="thumb" data-src="${g}" aria-label="${T('תמונה', 'Image')} ${i + 1}" aria-pressed="${i === 0}"><img src="${small(g)}" alt="" loading="lazy" width="120" height="120"></button>`)}</div>` : ''}
    </div>
    <div>
      <div class="crumbs"><a href="#/">${t('home')}</a> / <a href="#/shop/${p.cat}">${catName(p.cat)}</a>${p.sub ? html` / <a href="#/shop/${p.cat}/${encodeURIComponent(p.sub)}">${subName(p.sub)}</a>` : ''}</div>
      <p class="eyebrow">${p.sub ? subName(p.sub) : catName(p.cat)}</p>
      <h1>${L(p.name)}</h1>
      <p class="price big" id="pdp-price" aria-live="polite">${p.quote ? T('מחיר בהתאמה אישית', 'Price on request') : m(priceOf(p.sizes[0]))}${!p.quote && ws ? html` <s>${m(p.sizes[0].price)}</s> <span class="ws">${t('wsPrice')}</span>` : ''}</p>
      ${p.quote ? html`<p>${he() ? p.desc.he.split('\n')[0] : p.desc.en || p.desc.he.split('\n')[0]}</p>
        <div class="buy-row"><a class="btn gold" href="${waLink(T('שלום, אשמח להצעת מחיר עבור ', 'Hello, I would like a quote for ') + L(p.name))}" target="_blank" rel="noopener noreferrer">${T('לקבלת הצעת מחיר בוואטסאפ', 'Get a quote on WhatsApp')}</a><a class="btn ghost" href="tel:+${PHONE_INTL}">${PHONE_DISPLAY}</a></div>` : html`
      <form data-form="add" data-id="${p.id}" novalidate>
        ${p.sizes.length > 1 ? html`<fieldset class="sizes"><legend>${p.cat === 'oils' ? T('נפח', 'Volume') : t('size')}</legend>
          ${p.sizes.map((s, i) => html`<label class="size-opt"><input type="radio" name="size" value="${s.label}" ${raw(i ? '' : 'checked')} data-input="size" data-price="${priceOf(s)}"><span>${s.label}</span></label>`)}
        </fieldset>` : html`<input type="hidden" name="size" value="${p.sizes[0].label}">`}
        ${opt ? html`<fieldset class="sizes"><legend>${L(opt.name)}</legend>
          ${opt.values.map((v, i) => html`<label class="size-opt"><input type="radio" name="opt" value="${v.he}" ${raw(i ? '' : 'checked')} data-input="opt" data-img="${v.imgs?.[0] || ''}"><span>${L(v)}</span></label>`)}
        </fieldset>` : ''}
        ${p.picks ? html`<fieldset class="picker" aria-describedby="pick-count"><legend>${T(`בחרו ${p.picks} ניחוחות`, `Choose ${p.picks} scents`)} <span id="pick-count" class="pill st-new" aria-live="polite">0/${p.picks}</span></legend>
          <label class="check"><input type="checkbox" name="surprise" data-input="surprise"><span>${T('הפתיעו אותי — תבחרו בשבילי את הניחוחות הכי אהובים', 'Surprise me — pick the favourites for me')}</span></label>
          <div class="pick-groups" data-max="${p.picks}">${groups.map((g) => html`<div><h3>${subName(g)}</h3>${pickList.filter((x) => x.sub === g).map((x) => html`<label class="pick"><input type="checkbox" name="pick" value="${x.name.he}" data-input="pick"><span>${L(x.name)}</span></label>`)}</div>`)}</div>
        </fieldset>` : ''}
        <div class="buy-row">
          <div class="qty"><button type="button" data-action="qty" data-d="-1" aria-label="${t('decrease')}">−</button><label class="sr-only" for="qty">${t('qty')}</label><input id="qty" name="qty" inputmode="numeric" value="1" maxlength="2"><button type="button" data-action="qty" data-d="1" aria-label="${t('increase')}">+</button></div>
          <button class="btn" type="submit" ${raw(p.stock === 0 ? 'disabled' : '')}>${p.stock === 0 ? t('outStock') : t('addToCart')}</button>
        </div>
        <p class="err" id="add-err" role="alert"></p>
      </form>`}
      <ul class="perks"><li>${t('perk1')}</li><li>${t('perk2')}</li>${p.cat === 'diffusers' ? html`<li>${T('שנת אחריות יבואן', '1-year importer warranty')}</li><li><a href="#/guide">${T('מדריך שימוש ותחזוקה', 'Use & care guide')}</a></li>` : html`<li>${t('perk3')}</li>`}</ul>
    </div>
  </div>
  ${p.specs?.length ? html`<section class="specs" aria-labelledby="spec-t"><h2 id="spec-t">${T('מפרט טכני', 'Specifications')}</h2><table class="spec-tbl"><tbody>${p.specs.map(([k, v]) => html`<tr><th scope="row">${k}</th><td>${v}</td></tr>`)}</tbody></table></section>` : ''}
  ${!p.quote ? html`<section class="rich" aria-label="${T('תיאור המוצר', 'Product description')}">${he() || !p.desc.en ? richText(p.desc.he) : richText(p.desc.en)}</section>` : ''}
  <section class="block" aria-labelledby="comp-t"><h2 id="comp-t">${t('complements')}</h2><span class="rule"></span><div class="grid">${complements(p).map(card)}</div></section></div>`;
}

export function kitUpsell() {
  const kits = active().filter((p) => p.picks);
  if (!kits.length) return '';
  return html`<div class="modal-bg"><div class="modal shop-modal" role="dialog" aria-modal="true" aria-labelledby="up-t">
    <p class="eyebrow">${T('נוסף לסל ✓', 'Added to cart ✓')}</p>
    <h2 id="up-t">${T('ומה תפיצו בו? השלימו עם ערכת התנסות', 'What will you diffuse? Add a discovery kit')}</h2>
    <p class="muted">${T('המכשיר עובד עם תמציות שמן בלבד. ערכת התנסות היא הדרך הכי טובה למצוא את הניחוח שלכם.', 'The device works with fragrance oils only. A discovery kit is the best way to find your scent.')}</p>
    <div class="up-grid">${kits.map((k) => html`<a class="up" href="#/product/${k.id}" data-action="modal-close">${media(k)}<b>${L(k.name)}</b><span>${m(k.sizes[0].price)}</span></a>`)}</div>
    <div class="bo-filters"><button class="btn ghost" data-action="modal-close">${T('המשך קנייה', 'Continue shopping')}</button><button class="btn" data-action="go-cart">${T('לסל הקניות', 'View cart')}</button></div>
  </div></div>`;
}

export function guide() {
  const g = db.SITE.guide || '';
  return html`<div class="wrap legal rich"><p class="eyebrow">SAY Boutique</p><h1>${T('מדריך שימוש, מיקום ותחזוקה', 'Use, placement & care guide')}</h1>${richText(g)}</div>`;
}

export function cartDrawer() {
  const tt = db.cartTotals();
  const left = Math.max(0, FREE_SHIP - (tt.subtotal - tt.discount));
  const ratio = Math.min(1, (tt.subtotal - tt.discount) / FREE_SHIP);
  const ups = tt.lines.length ? complements(tt.lines[0].p, 6).filter((x) => !x.quote && !tt.lines.some((l) => l.pid === x.id)).slice(0, 2) : [];
  return html`<header><h2 id="cart-t">${t('cart')}</h2><button class="icon-btn" data-action="cart-close" aria-label="${t('close')}">✕</button></header>
  <div class="drawer-body">
    ${tt.lines.length ? html`
      <p class="muted">${left ? t('toFree', { x: m(left) }) : t('gotFree')}</p>
      <div class="progress" aria-hidden="true"><i class="pbar" data-ratio="${ratio}"></i></div>
      ${tt.lines.map((l, i) => html`<div class="line">
        <div class="line-media">${media(l.p)}</div>
        <div><h3>${L(l.p.name)}</h3><small class="muted">${l.size === 'יחידה' || l.size === 'מארז' ? '' : l.size}${l.opt ? html` · ${l.opt.length > 40 ? l.opt.slice(0, 40) + '…' : l.opt}` : ''}</small>
          <div class="qty"><button data-action="line-qty" data-i="${i}" data-d="-1" aria-label="${t('decrease')}">−</button><input aria-label="${t('qty')}" value="${l.qty}" readonly><button data-action="line-qty" data-i="${i}" data-d="1" aria-label="${t('increase')}">+</button></div></div>
        <div><b>${m(l.price * l.qty)}</b><br><button class="link-btn" data-action="line-rm" data-i="${i}">${t('remove')}</button></div>
      </div>`)}
      ${ups.length ? html`<div class="upsell"><h3>${t('youMayLike')}</h3>${ups.map((x) => html`<div class="mini"><div class="line-media">${media(x)}</div><div><a href="#/product/${x.id}">${L(x.name)}</a><br><small>${m(Math.min(...x.sizes.map((s) => s.price)))}</small></div><a class="btn sm ghost" href="#/product/${x.id}" data-action="cart-close" aria-label="${L(x.name)}">←</a></div>`)}</div>` : ''}
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
    <aside class="summary" aria-label="${t('cart')}">${tt.lines.map((l) => html`<div class="mini"><div class="line-media">${media(l.p)}</div><div>${L(l.p.name)}<br><small class="muted">${l.size} × ${l.qty}${l.opt ? html`<br>${l.opt}` : ''}</small></div><b>${m(l.price * l.qty)}</b></div>`)}<hr>${totalsBlock(tt)}</aside>
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
