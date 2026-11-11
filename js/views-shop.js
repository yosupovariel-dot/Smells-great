import { html, raw, money, valid, clean, toast, PHONE_DISPLAY, PHONE_INTL, FREE_SHIP, normPhone } from './util.js?v=261111234220';
import { t, L, getLang } from './i18n.js?v=261111234220';
import { CATEGORIES, COMPLEMENTS, artSVG, scentOf, STRENGTHS, NOTES } from './data.js?v=261111234220';
import * as db from './db.js?v=261111234220';

const m = (n) => money(n, getLang());
const he = () => getLang() === 'he';
const T = (a, b) => (he() ? a : b);
// Catalog images come in two sizes (name.webp ≤1400px, name-sm.webp ≤640px); cards/lists use the small one.
export const small = (src) => (/^assets\/products\/.+\.webp$/.test(src) && !src.endsWith('-sm.webp') ? src.replace(/\.webp$/, '-sm.webp') : src);
export const media = (p, cls = '', eager = false, src = p.img, full = false) =>
  src
    ? html`<img src="${full ? src : small(src)}" ${raw(full || small(src) === src ? '' : `srcset="${small(src)} 560w, ${src} 1400w" sizes="(max-width:600px) 50vw, 320px"`)} alt="${L(p.name)}" width="1200" height="900" ${raw(eager ? 'fetchpriority="high"' : 'loading="lazy"')} decoding="async" class="${cls}">`
    : raw(artSVG(p, cls));
const catName = (id) => L(CATEGORIES.find((c) => c.id === id));
// Display names drop the sheet's marketing tail ("ערכות התנסות – מומלץ…" → "ערכות התנסות").
export const subName = (s) => (he() ? s : db.SITE.site?.subEn?.[s] || s).split(/\s[–-]\s(?!\d)/)[0];
const active = () => db.products().filter((p) => p.active !== false);
const minPrice = (p, ws) => Math.min(...p.sizes.map((s) => (ws && s.wholesale ? s.wholesale : s.price)));
// Customer-facing WhatsApp links open an empty chat (no pre-written message).
const waLink = (msg) => `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(msg || T('שלום, הגעתי דרך אתר SAY BOUTIQUE ואשמח לעזרה', 'Hi, I came from the SAY BOUTIQUE website'))}`;

export function priceTag(p) {
  if (p.quote) return html`<span class="price">${T('מחיר בהתאמה אישית', 'Price on request')}</span>`;
  const ws = db.me()?.role === 'wholesale';
  const from = p.sizes.length > 1 ? T('החל מ־', 'From ') : '';
  const now = minPrice(p, ws); const was = !ws && p.was > now ? p.was : 0;
  return html`<span class="price">${was ? html`<s class="pt-was">${m(was)}</s>` : ''}<b class="pt-now">${from}${m(now)}</b>${ws ? html`<s>${m(minPrice(p, false))}</s>` : ''}</span>`;
}

// Card image: a consistent "packshot" (oil bottle / clean device front), with a second look on hover.
const cardImgs = (p) => {
  const main = p.pack || p.img;
  const alt = p.cat === 'oils' && p.pack ? p.img
    : p.options?.[0]?.values?.[1]?.imgs?.[0] || (p.pack && p.pack !== p.img ? p.img : '');
  const studio = p.fit === 'contain' && (p.pack || p.img) !== (p.cat === 'diffusers' && !p.pack && p.id === 'say-100' ? p.img : '');
  return { main, alt: alt !== main ? alt : '', studio: p.fit === 'contain' };
};
const FAMILY_TONE = { 'בתי מלון ויוקרה': 't-hotel', 'חנויות ורשתות מובילות': 't-shop', 'השראת בשמים יוקרתיים': 't-perfume', 'טבע וספא': 't-spa', 'ניחוחות קלאסיים': 't-classic', 'ניקיון ורעננות': 't-fresh', 'מאפים ומתוקים': 't-sweet' };
const plus = raw('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>');

// Oils: a perfume-label card — scene in an arched window, the bottle on hover.
function labelCard(p) {
  return html`<article class="card label ${FAMILY_TONE[p.sub] || ''}" data-pid="${p.id}">
    <a class="lbl" href="#/product/${p.id}">
      <img class="card-mark" src="assets/img/mark.webp" alt="" width="34" height="30" loading="lazy">
      <span class="lbl-fam latin">${(FAMILY_EN_SHORT[p.sub] || '').toUpperCase()}</span>
      <span class="lbl-arch full">${media(p, 'bgfill', false, p.img)}${media(p, 'm1', false, p.img)}</span>
      <span class="lbl-name">${L(p.name)}</span>
      <span class="lbl-sub">${subName(p.sub)}</span>
      <span class="lbl-rule" aria-hidden="true"></span>
      <span class="lbl-price">${priceTag(p)}</span>
    </a>
    <div class="lbl-buy">${buyRow(p)}</div>
  </article>`;
}
// Featured products: a wide editorial tile spanning two columns.
function featureCard(p) {
  const { main } = cardImgs(p);
  const blurb = (he() ? p.desc?.he : p.desc?.en || p.desc?.he || '').split('\n').map((x) => x.trim()).filter((x) => x.length > 40)[0] || '';
  return html`<article class="card feature ${p.fit === 'contain' ? 'studio' : 'photo'}">
    <a class="card-media" href="#/product/${p.id}" tabindex="-1" aria-hidden="true">${media(p, 'm1', false, main)}</a>
    <div class="ft-body">
      ${p.tag ? html`<span class="ft-tag">${t('tag_' + p.tag)}</span>` : ''}
      <h3><a href="#/product/${p.id}">${L(p.name)}</a></h3>
      ${blurb ? html`<p>${blurb.length > 150 ? blurb.slice(0, 150).replace(/\s\S*$/, '') + '…' : blurb}</p>` : ''}
      <div class="ft-foot">${priceTag(p)}<a class="u-link" href="#/product/${p.id}">${p.picks ? T('לבחירת הניחוחות', 'Choose your scents') : T('לפרטים', 'View')} <span aria-hidden="true">${he() ? '←' : '→'}</span></a></div>
    </div>
  </article>`;
}
const FAMILY_EN_SHORT = { 'בתי מלון ויוקרה': 'Hotel collection', 'חנויות ורשתות מובילות': 'Boutique collection', 'השראת בשמים יוקרתיים': 'Fine fragrance', 'טבע וספא': 'Nature & spa', 'ניחוחות קלאסיים': 'Classics', 'ניקיון ורעננות': 'Fresh & clean', 'מאפים ומתוקים': 'Gourmand' };

// One honest, concrete benefit per product (what the customer actually gets).
const BENEFIT = {
  'say-room-office': ['עד 20 מ"ר · סוללות או USB', 'Up to 20 m² · battery or USB'], 'say-car': ['נטען · חיישן תנועה', 'Rechargeable · motion sensor'],
  'say-100': ['עד 100 מ"ר · 3 מדבקות מתנה', 'Up to 100 m² · 3 free wraps'], 'say-150': ['עד 150 מ"ר · שליטה מהאפליקציה', 'Up to 150 m² · app control'],
  'say-300': ['עד 300 מ"ר · Wi-Fi · מכל ליטר', 'Up to 300 m² · Wi-Fi · 1L tank'], 'say-400': ['עד 2,000 מ"ק · אלומיניום', 'Up to 2,000 m³ · aluminium'],
  'kit-14': ['14 × 10 מ"ל · בוחרים בעצמכם', '14 × 10 ml · your choice'], 'kit-4': ['4 × 30 מ"ל · מארז מתנה', '4 × 30 ml · gift box'],
  'bundle-say100-1l': ['כולל: SAY 100 + תמצית 1 ליטר', 'Includes SAY 100 + 1L oil'], 'bundle-say150-1l': ['כולל: SAY 150 + תמצית 1 ליטר', 'Includes SAY 150 + 1L oil'],
  'bundle-say300-1l': ['כולל: SAY 300 + תמצית 1 ליטר', 'Includes SAY 300 + 1L oil'], 'bundle-5x100': ['כולל: 5 תמציות × 100 מ"ל', 'Includes 5 × 100 ml oils'],
  'bundle-car-kit': ['כולל: SAY Car + 14 תמציות', 'Includes SAY Car + 14 oils'],
};
// Quantity + add-to-cart right on the card.
function buyRow(p) {
  if (p.quote) return html`<a class="qa-wa" href="${waLink(T('שלום, אשמח להצעת מחיר עבור ', 'Hi, a quote for ') + L(p.name))}" target="_blank" rel="noopener noreferrer">${T('הצעת מחיר בוואטסאפ', 'Quote on WhatsApp')}</a>`;
  if (p.picks) return html`<a class="qa-go" href="#/product/${p.id}">${T('לבחירת הריחות', 'Choose scents')}</a>`;
  return html`<div class="qa" data-id="${p.id}"><div class="qa-q" role="group" aria-label="${t('qty')}"><button type="button" data-action="qa-step" data-d="1" aria-label="${t('increase')}">+</button><output class="qa-n" aria-live="polite">1</output><button type="button" data-action="qa-step" data-d="-1" aria-label="${t('decrease')}">−</button></div>
    <button type="button" class="qa-add" data-action="quick-add" data-id="${p.id}">${T('הוספה לסל', 'Add to bag')}</button></div>
    ${p.sizes.length > 1 ? html`<small class="qa-note">${p.sizes[0].label}${p.options?.length ? '' : ''} · <a href="#/product/${p.id}">${T('גדלים נוספים', 'More sizes')}</a></small>` : p.options?.length ? html`<small class="qa-note">${L(p.options[0].values[0])} · <a href="#/product/${p.id}">${T('צבעים נוספים', 'More colours')}</a></small>` : ''}`;
}

const swatch = (n) => /שחור.*לבן|לבן.*שחור/.test(n) ? 'sw-mix' : /לבן|white/i.test(n) ? 'sw-white' : /שחור|black/i.test(n) ? 'sw-black' : /ברונזה|נחושת|bronze/i.test(n) ? 'sw-bronze' : /כסף|כסוף|silver/i.test(n) ? 'sw-silver' : /זהב|gold/i.test(n) ? 'sw-gold' : /אפור|grey|gray/i.test(n) ? 'sw-grey' : 'sw-gold';
export function card(p, opts = {}) {
  if (opts.feature) return featureCard(p);
  if (p.cat === 'oils' && p.pack) return labelCard(p);
  const { main, alt, studio } = cardImgs(p);
  const direct = !(p.quote || p.picks || p.options?.length || p.sizes.length > 1);
  return html`<article class="card pc ${studio ? 'studio' : 'photo'}" data-pid="${p.id}">
    <img class="card-logo" src="assets/img/logo-wide.webp" alt="" width="923" height="350" loading="lazy">
    <a class="card-media" href="#/product/${p.id}" tabindex="-1" aria-hidden="true">
      ${media(p, 'm1', false, main)}${alt ? media(p, 'm2', false, alt) : ''}
      ${p.tag ? html`<span class="card-tag in-media">${t('tag_' + p.tag)}</span>` : ''}
    </a>
    <div class="card-body">
      <h3><a href="#/product/${p.id}">${L(p.name)}</a></h3>
      <small>${p.sub ? subName(p.sub) : catName(p.cat)}${p.options?.[0] ? html` · ${p.options[0].values.length} ${T('צבעים', 'colours')}` : ''}</small>
      ${BENEFIT[p.id] ? html`<span class="benefit">${T(...BENEFIT[p.id])}</span>` : ''}
      ${p.quote ? '' : priceTag(p)}
      ${buyRow(p)}
    </div>
  </article>`;
}

// ---------- Home ----------
export const HERO_SLIDES = [
  { pid: 'bundle-say300-1l', he: 'SAY 300 עם תמצית ליטר', en: 'SAY 300 with a litre of oil' },
  { pid: 'bundle-say150-1l', he: 'SAY 150 עם תמצית ליטר', en: 'SAY 150 with a litre of oil' },
  { pid: 'say-150', he: 'SAY 150, בשחור ובלבן', en: 'SAY 150, black and white' },
  { pid: 'bundle-car-kit', he: 'SAY Car וערכת התנסות', en: 'SAY Car and discovery kit' },
];
const FAMILY_EN = { 'בתי מלון ויוקרה': 'Hotels', 'חנויות ורשתות מובילות': 'Boutiques', 'השראת בשמים יוקרתיים': 'Fine fragrance', 'טבע וספא': 'Nature & spa', 'ניחוחות קלאסיים': 'Classics', 'ניקיון ורעננות': 'Fresh & clean', 'מאפים ומתוקים': 'Gourmand' };
const arrow = () => (he() ? '←' : '→');

// Circular seal text: one glyph per angle (textPath is unreliable inside RTL documents).
function sealSVG(text) {
  const ch = [...text]; const n = ch.length;
  return raw(`<svg viewBox="0 0 200 200" direction="ltr" aria-hidden="true">${ch.map((c, i) => `<text x="100" y="24" text-anchor="middle" transform="rotate(${(i * 360 / n).toFixed(2)} 100 100)">${c === ' ' ? '&#160;' : c}</text>`).join('')}</svg>`);
}

const subTiles = (cat) => { const c = CATEGORIES.find((x) => x.id === cat); const subs = (db.SITE.subs?.[c.he] || []).filter((s2) => active().some((p) => p.sub === s2));
  return html`<div class="hc-subs">${subs.map((s2) => html`<a class="hc-sub ${cat === 'diffusers' ? 'studio' : ''}" href="#/shop/${cat}/${encodeURIComponent(s2)}"><span class="hc-sub-img"><img src="${small(subImg(cat, s2))}" alt="" loading="lazy" width="400" height="300"></span><b>${subName(s2)}</b><small>${active().filter((p) => p.sub === s2).length} ${T('מוצרים', 'items')}</small></a>`)}</div>`; };
// Featured bundles: honest anchor = the real price of the same items bought separately.
const DEALS = [['bundle-say300-1l', [['say-300'], ['oil', '1 ליטר']]], ['bundle-say150-1l', [['say-150'], ['oil', '1 ליטר']]], ['bundle-say100-1l', [['say-100'], ['oil', '1 ליטר']]], ['bundle-car-kit', [['say-car'], ['kit-14']]], ['bundle-5x100', [['oil', '100 מ"ל', 5]]], ['kit-14', []]];
function dealsSection() {
  const anyOil = active().find((p) => p.cat === 'oils' && p.pack);
  const priceOf = ([id, size, n = 1]) => { const p = id === 'oil' ? anyOil : db.product(id); if (!p) return 0; const sz = size ? p.sizes.find((x) => x.label === size) : p.sizes[0]; return (sz?.price || 0) * n; };
  const items = DEALS.map(([id, parts]) => { const p = db.product(id); if (!p || p.active === false) return null; const now = minPrice(p); const sep = parts.reduce((a, x) => a + priceOf(x), 0) || p.was || 0; return { p, now, sep: sep > now ? sep : 0 }; }).filter(Boolean);
  if (!items.length) return '';
  return html`<section class="dl" aria-labelledby="dl-t"><div class="wrap">
    <header class="dl-h"><p class="hz-k">${T('הכי משתלם עכשיו', 'Best value now')}</p><h2 id="dl-t">${T('מארזים נבחרים', 'Featured bundles')}</h2><p>${T('מכשיר ותמצית יחד — מוכן לשימוש מהרגע שהחבילה מגיעה.', 'Device and oil together — ready the moment it arrives.')}</p></header>
    <div class="dl-grid">${items.map(({ p, now, sep }) => { const save = now && sep ? Math.round((1 - now / sep) * 100) : 0;
      return html`<article class="dl-card" data-pid="${p.id}"><a class="dl-img" href="#/product/${p.id}"><img src="${small(p.img)}" alt="" loading="lazy" width="500" height="500">${save >= 5 ? html`<em class="dl-badge">${T(`חוסכים ${save}%`, `Save ${save}%`)}</em>` : html`<em class="dl-badge soft">${p.picks ? T('מומלץ להתחלה', 'Best to start') : T('מארז', 'Bundle')}</em>`}</a>
        <div class="dl-body"><a class="dl-name" href="#/product/${p.id}"><b>${L(p.name)}</b></a>
          <span class="dl-price">${sep ? html`<s>${T('בנפרד', 'Separately')} ${m(sep)}</s>` : ''}${now ? html`<strong>${m(now)}</strong>` : html`<strong class="q">${T('מחיר מארז מיוחד', 'Special bundle price')}</strong>`}</span>
          ${buyRow(p)}</div></article>`; })}</div>
  </div></section>`;
}

export function home() {
  const all = active();
  const hero = (db.SITE.site?.hero || []).slice(0, 4);
  const promo = db.SITE.site?.hero?.[4];
  const banners = db.SITE.site?.subBanners || {};
  const diff = all.filter((p) => p.cat === 'diffusers' && !p.quote);
  const kit = all.find((p) => p.picks === 14);
  const families = Object.keys(banners).map((f) => ({ f, img: banners[f], n: all.filter((p) => p.sub === f).length })).filter((x) => x.n);
  return html`
  <section class="hx" aria-labelledby="hero-t">
    <div class="h-slides" role="region" aria-roledescription="carousel" aria-label="${T('מוצרים נבחרים', 'Featured')}">
      ${hero.map((src, i) => html`<figure class="slide ${i ? '' : 'on'}"><img src="${src}" alt="${HERO_SLIDES[i]?.[getLang()] || 'SAY Boutique'}" width="2000" height="968" ${raw(i ? 'fetchpriority="low"' : 'fetchpriority="high"')} decoding="async"></figure>`)}
    </div>
    <div class="hx-shade" aria-hidden="true"></div>
    <div class="hx-copy wrap">
      <p class="hx-k"><span class="hx-sale">SALE</span>Luxury Home Fragrances</p>
      <h1 id="hero-t">${T('יוקרה שמרגישים', 'Luxury you can feel')}<br><em>${T('בכל חלל.', 'in every space.')}</em></h1>
      <p class="hx-lead">${T('מפיצי ריח בעיצוב אישי, מבחר עצום של ניחוחות ותמציות שמן איכותיות – במחירי יבואן לצרכן.', 'Hotel-grade diffusers and fragrance oils for home and business, at importer prices.')}</p>
      <div class="hx-cta"><a class="hx-btn" href="#/shop">${T('לגלות את הקולקציה', 'Discover the collection')}</a><a class="hx-link" href="#/finder">${T('למצוא את הריח שלי', 'Find my scent')}</a></div>
    </div>
    ${hero.length ? html`<div class="h-offers">${HERO_SLIDES.slice(0, hero.length).map((sl, i) => { const p = db.product(sl.pid); const now = p ? minPrice(p) : 0; const was = p?.was > now ? p.was : 0;
      return html`<a class="h-offer ${i ? '' : 'on'}" href="#/product/${sl.pid}"><small class="h-k">${was ? html`<em class="h-sale">${T('מבצע', 'Sale')}</em>` : T('בחירת הבוטיק ✦', 'Boutique pick ✦')}</small><b>${sl[getLang()]}</b>
        <span class="h-price">${now ? html`${was ? html`<s>${m(was)}</s>` : ''}<strong>${m(now)}</strong>` : html`<strong>${T('מחיר מיוחד — בוואטסאפ', 'Special price on WhatsApp')}</strong>`}</span><i><span>${T('לפרטים והזמנה', 'View & order')}</span> ${arrow()}</i></a>`; })}</div>
    <div class="h-dots" aria-hidden="true">${hero.map((_, i) => html`<i class="${i ? '' : 'on'}"></i>`)}</div>
    <div class="sr-only">${hero.map((_, i) => html`<button data-action="slide" data-i="${i}" aria-label="${T('שקופית', 'Slide')} ${i + 1}" aria-current="${i === 0}"></button>`)}</div>` : ''}
  </section>

  <ul class="usp" aria-label="${T('למה SAY', 'Why SAY')}"><li><b>5</b>${T('שנות פעילות', 'years in business')}</li><li><b>₪</b>${T('מחירי יבואן לצרכן', 'importer prices')}</li><li><b>✦</b>${T('מבחר עצום של ניחוחות', 'a huge choice of scents')}</li><li><b>⌂</b>${T('שירות בפריסה ארצית', 'nationwide service')}</li></ul>

  <nav class="hxc" aria-label="${t('categories')}"><div class="wrap"><div class="hxc-row">${CATEGORIES.map((c) => { const n = all.filter((p) => p.cat === c.id).length; return html`<a href="#/shop/${c.id}" class="${n ? '' : 'soon'}"><span class="hxc-img"><img src="${small(c.id === 'diffusers' ? 'assets/products/say-150-3.webp' : c.img || 'assets/img/mark.webp')}" alt="" width="120" height="120" loading="lazy"></span><b>${L(c)}</b>${n ? '' : html`<small>${T('בקרוב', 'soon')}</small>`}</a>`; })}</div></div></nav>

  ${(() => { const best = [...all.filter((p) => p.tag === 'best'), ...['say-150', 'say-300', 'kit-14', 'say-100'].map((id) => db.product(id))].filter((p, i, a2) => p && p.active !== false && a2.indexOf(p) === i).slice(0, 8);
    return html`<section class="hxp" aria-labelledby="hxp-t"><div class="wrap"><header class="hxp-h"><h2 id="hxp-t">${T('הכי נמכרים', 'Best sellers')}</h2><a class="u-link" href="#/shop">${T('לכל המוצרים', 'All products')} <span aria-hidden="true">${arrow()}</span></a></header>
      <div class="grid shop-grid hxp-grid">${best.map((p) => card(p))}</div></div></section>`; })()}

  <section class="rl" aria-labelledby="rl-t"><div class="wrap rl-in">
    <figure class="rl-vid"><video src="assets/video/say-reel.mp4" poster="assets/video/say-reel-poster.webp" autoplay muted loop playsinline preload="metadata" width="720" height="900" aria-label="${T('סרטון קצר על מוצרי SAY', 'A short film about SAY products')}"></video>
      <button class="rl-toggle" data-action="reel-toggle" aria-label="${T('עצירת הסרטון', 'Pause video')}" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg></button></figure>
    <div class="rl-copy"><p class="hz-k">${T('15 שניות של SAY', '15 seconds of SAY')}</p>
      <h2 id="rl-t">${T('את הריח אי אפשר לצלם.', 'You cannot film a scent.')}<br><em>${T('אבל אפשר להרגיש אותו.', 'But you can feel it.')}</em></h2>
      <p>${T('מכשיר שקט, תמצית בהשראת המלון שאהבתם, ובית שמקבל אתכם כל ערב באותה תחושה של לובי יוקרתי.', 'A silent device, an oil inspired by the hotel you loved, and a home that greets you every evening like a luxury lobby.')}</p>
      <div class="rl-cta"><a class="btn" href="#/finder">${T('מצאו את הריח שלכם', 'Find your scent')}</a><a class="u-link" href="#/shop">${T('לכל המוצרים', 'Shop all')} <span aria-hidden="true">${arrow()}</span></a></div></div>
  </div></section>

  ${dealsSection()}
  <section class="hz hz-hair" aria-labelledby="hair-t"><div class="wrap">
    <header class="hz-head"><p class="hz-k">${T('שיער וטיפוח · בקרוב', 'Hair care · Coming soon')}</p><h2 id="hair-t">${T('הטיפוח שלכם, באותה רמה של הריח.', 'Your care, at the level of your scent.')}</h2>
      <p>${T('קולקציית טיפוח לשיער מגיעה בקרוב לבוטיק. רוצים לשמוע ראשונים?', 'A hair-care collection is coming soon. Want to hear first?')}</p></header>
    <div class="hz-grid four">${[1, 2, 3, 4].map((i) => html`<a class="hz-card hair" href="#/shop/hair"><span class="hz-img"><img src="assets/products/hair-${i}-sm.webp" alt="" loading="lazy" width="560" height="560"></span><span class="hz-foot"><em>${T('בקרוב בבוטיק', 'Coming soon')}</em><i aria-hidden="true">${he() ? '←' : '→'}</i></span></a>`)}</div>
    <p class="hz-help"><a href="${waLink(T('שלום, הגעתי דרך אתר SAY BOUTIQUE ואשמח לעדכון כשקולקציית השיער תעלה', 'Hi, please update me when the hair collection launches'))}" target="_blank" rel="noopener noreferrer">${T('עדכנו אותי בוואטסאפ כשהקולקציה עולה', 'Notify me on WhatsApp')}</a></p>
  </div></section>

  <section class="hw" aria-labelledby="oil-t"><div class="wrap">
    <div class="hw-in">
      <div class="hw-copy">
        <p class="hz-k">${T('תמציות שמן', 'Fragrance oils')}</p>
        <h2 id="oil-t">${T('בחרו מקום,', 'Choose a place,')}<br>${T('לא בקבוק.', 'not a bottle.')}</h2>
        <p>${T('כל תמצית נולדה מזיכרון של מקום — לובי של מלון, חנות שאהבתם, ספא שקט. בחרו את העולם שמרגיש לכם נכון, והבית יתחיל להריח כמוהו.', 'Every oil began as a memory of a place — a hotel lobby, a favourite store, a quiet spa. Pick the world that feels right and your home starts to smell like it.')}</p>
        ${kit ? html`<a class="hw-kit" href="#/product/${kit.id}"><span><b>${T('לא בטוחים איזה עולם?', 'Not sure which world?')}</b>${T('ערכת התנסות: 14 ריחות, מחליטים אחרי שמריחים', 'Discovery kit: 14 scents, decide after you smell')}</span><em>${m(minPrice(kit))}</em></a>` : ''}
        <a class="u-link" href="#/shop/oils">${T('לכל התמציות', 'All oils')} <span aria-hidden="true">${arrow()}</span></a>
      </div>
      <div class="hw-worlds">${(db.SITE.subs?.['תמציות שמן'] || []).filter((s2) => active().filter((p) => p.sub === s2 && !p.picks).length > 2).sort((x, y) => (y === 'בתי מלון ויוקרה') - (x === 'בתי מלון ויוקרה')).slice(0, 5).map((s2, i) => html`<a class="hw-w reveal" href="#/shop/oils/${encodeURIComponent(s2)}"><img src="${i ? small(subImg('oils', s2)) : subImg('oils', s2)}" alt="" loading="lazy" width="600" height="600"><span><b>${subName(s2)}</b><small>${active().filter((p) => p.sub === s2).length} ${T('ריחות', 'scents')}</small></span></a>`)}</div>
    </div>
  </div></section>





  <section class="h-how" aria-labelledby="how-t"><div class="wrap">
    <header class="h-head"><h2 id="how-t">${T('איך זה עובד', 'How it works')}</h2></header>
    <ol class="how">
      <li><span class="latin">I</span><b>${T('בוחרים מכשיר', 'Choose a device')}</b><p>${T('לפי גודל החלל — מרכב ועד לובי של 300 מ"ר. בלי מים, בלי חום, שקט לגמרי.', 'By the size of your space — from a car to a 300 m² lobby. No water, no heat, silent.')}</p></li>
      <li><span class="latin">II</span><b>${T('בוחרים ניחוח', 'Choose a scent')}</b><p>${T('54 תמציות בהשראת מלונות, בשמים וטבע. לא בטוחים? ערכת התנסות עושה את העבודה.', '54 oils inspired by hotels, perfumes and nature. Unsure? A discovery kit does the work.')}</p></li>
      <li><span class="latin">III</span><b>${T('מתזמנים ונהנים', 'Schedule & enjoy')}</b><p>${T('מגדירים שעות באפליקציה, והבית מריח כמו מלון בוטיק — כל יום, אוטומטית.', 'Set the hours in the app and your home smells like a boutique hotel — every day.')}</p></li>
    </ol>
  </div></section>

  ${kit ? html`<section class="h-kit" aria-labelledby="kit-t"><div class="wrap h-kit-in">
    <div class="h-kit-img reveal">${media(kit, '', false, kit.img, true)}</div>
    <div class="h-kit-copy reveal"><p class="kicker latin">Discovery</p><h2 id="kit-t">${T('ערכת התנסות — 14 תמציות', 'Discovery kit — 14 oils')}</h2>
      <p>${T('בוחרים 14 תמציות של 10 מ"ל ומנסים אותן במפיץ, כדי לגלות איזה ריח הכי מתאים לכם לפני שקונים בקבוק גדול.', 'Choose fourteen 10 ml oils and try them in your diffuser before buying a large bottle.')}</p>
      <p class="h-kit-price">${m(kit.sizes[0].price)}</p>
      <a class="btn" href="#/product/${kit.id}">${T('לבחירת הניחוחות', 'Choose your scents')}</a></div>
  </div></section>` : ''}

  ${promo ? html`<section class="h-offer wrap reveal" aria-labelledby="of-t"><a class="of-img" href="#/product/bundle-car-kit"><img src="${small(promo)}" srcset="${small(promo)} 560w, ${promo} 1400w" sizes="(max-width:760px) 100vw, 45vw" alt="${T('SAY Car וערכת התנסות', 'SAY Car and discovery kit')}" loading="lazy" width="1400" height="680"></a>
    <div class="of-t"><p class="kicker latin">Bundle</p><h2 id="of-t">${T('מארז ההיכרות: מכשיר + 14 ניחוחות', 'Starter bundle: device + 14 scents')}</h2>
      <p>${T('SAY Car לבחירה בשלושה צבעים, יחד עם ערכת התנסות של 14 תמציות — כל מה שצריך כדי להתחיל, במארז אחד ובמחיר משתלם.', 'SAY Car in three colours with a 14-oil discovery kit — everything to begin, in one box, for less.')}</p>
      <a class="btn" href="#/product/bundle-car-kit">${T('לפרטי המארז', 'View bundle')}</a></div></section>` : ''}

  <section class="h-service" aria-label="${T('שירות', 'Service')}"><div class="wrap">
    <div><b>${T('משלוח חינם', 'Free delivery')}</b><p>${T('בכל הזמנה מעל 299₪, עד הבית בתוך 7-10 ימים.', 'On orders over ₪299, at your door in 7–10 days.')}</p></div>
    <div><b>${T('אחריות יבואן', 'Importer warranty')}</b><p>${T('שנת אחריות יבואן על SAY 150, SAY 300 ו-SAY 400.', 'One-year importer warranty on SAY 150, 300 and 400.')}</p></div>
    <div><b>${T('ליווי אישי', 'Personal advice')}</b><p>${T('לא בטוחים מה מתאים לחלל שלכם? כתבו לנו ונמליץ.', 'Not sure what suits your space? Message us.')} <a href="${waLink(T('שלום, אשמח להמלצה', 'Hello, I would like a recommendation'))}" target="_blank" rel="noopener noreferrer">WhatsApp</a></p></div>
    <div><b>${T('לעסקים', 'For business')}</b><p>${T('מחירי סיטונאות והתקנת סטנדים.', 'Wholesale prices and stand installation.')} <a href="#/wholesale">${T('לפרטים', 'Details')}</a></p></div>
  </div></section>
  ${clubBlock()}`;
}

export const clubBlock = () => html`<section class="block club" aria-labelledby="club-t"><div class="wrap">
  <p class="eyebrow latin">Members Club</p><h2 id="club-t">${t('clubTitle')}</h2><p>${t('clubText')}</p>
  ${db.me() ? html`<a class="btn" href="#/account">${T('לאזור האישי', 'My account')}</a>` : html`<button class="btn club-join-btn" data-action="join-club" type="button">${T('הצטרפות למועדון — 15% הנחה', 'Join the club — 15% off')}</button>`}
  <p class="sr-only" aria-live="polite" id="club-msg"></p>
</div></section>`;

// ---------- Shop ----------
// Image for a subcategory "story" circle.
function subImg(cat, sub) {
  const b = db.SITE.site?.subBanners?.[sub]; if (b) return b;
  const p = active().find((x) => x.sub === sub); return p ? p.pack || p.img : '';
}
const CAT_LEAD = {
  diffusers: ['מכשירי בישום שקטים בטכנולוגיית אידוי קר — מרכב ועד לובי של 300 מ"ר.', 'Silent cold-air diffusers — from your car to a 300 m² lobby.'],
  oils: ['54 תמציות בהשראת בתי מלון, בשמים אייקוניים וטבע — מ־10 מ"ל ועד 5 ליטר.', '54 oils inspired by hotels, iconic perfumes and nature — 10 ml to 5 L.'],
  bundles: ['מכשיר ומילוי במארז אחד, במחיר שמשתלם יותר.', 'A device and refill in one box, for less.'],
};
const PRICE_BANDS = [['', T('הכל', 'All')], ['0-100', T('עד 100₪', 'Up to ₪100')], ['100-300', '100–300₪'], ['300-9999', T('מעל 300₪', 'Over ₪300')]];
const sortBar = (q, sort, n, f = {}, scent = true) => { const active_ = (f.str ? 1 : 0) + (f.notes?.length || 0) + (f.stock ? 1 : 0); return html`<div class="toolbar2">
  <div class="tb-btns">
    ${scent ? '' : raw('<!--')}<button class="tb-btn" data-action="filter-open" aria-haspopup="dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4"/></svg><span>${T('סינון', 'Filter')}</span>${active_ ? html`<em>${active_}</em>` : ''}</button>${scent ? '' : raw('-->')}
    <label class="tb-btn sel"><span class="sr-only">${t('sortBy')}</span><select id="sort" data-input="sort">
      ${[['pop', T('מומלצים', 'Recommended')], ['low', t('sortLow')], ['high', t('sortHigh')], ['name', t('sortName')]].map(([v, l]) => html`<option value="${v}" ${raw(sort === v ? 'selected' : '')}>${l}</option>`)}
    </select><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg></label>
  </div>
  <p class="count" aria-live="polite"><b>${n}</b> ${t('results')}${active_ ? html` · <button class="link-btn" data-action="filter-clear">${T('ניקוי סינון', 'Clear filters')}</button>` : ''}</p></div>`; };

export function filterSheet(f = {}) {
  return html`<div class="modal-bg sheet-bg"><aside class="sheet" role="dialog" aria-modal="true" aria-labelledby="fs-t">
    <header><h2 id="fs-t">${T('סינון', 'Filter')}</h2><button class="icon-x" data-action="modal-close" aria-label="${t('close')}">×</button></header>
    <form data-form="filter">
      <fieldset><legend>${T('עוצמת הריח', 'Scent strength')}</legend><div class="fs-opts">${[['', 'הכל', 'All'], ...STRENGTHS].map(([v, h, e]) => html`<label><input type="radio" name="str" value="${v}" ${raw((f.str || '') === v ? 'checked' : '')}><span>${T(h, e)}</span></label>`)}</div></fieldset>
      <fieldset><legend>${T('אופי הריח', 'Scent character')} <small>${T('אפשר לבחור כמה', 'pick any')}</small></legend><div class="fs-opts">${NOTES.map(([v, h, e]) => html`<label><input type="checkbox" name="notes" value="${v}" ${raw(f.notes?.includes(v) ? 'checked' : '')}><span>${T(h, e)}</span></label>`)}</div></fieldset>
      <label class="switch big"><input type="checkbox" name="stock" ${raw(f.stock ? 'checked' : '')}><span></span>${T('במלאי בלבד', 'In stock only')}</label>
      <button class="btn block" type="submit">${T('הצגת תוצאות', 'Show results')}</button>
    </form></aside></div>`;
}

const catTabs = (cat) => html`<nav class="cat-pills" aria-label="${t('categories')}">
  <a href="#/shop" aria-current="${!cat}">${t('all')}</a>
  ${CATEGORIES.map((x) => { const n = active().filter((p) => p.cat === x.id).length; return html`<a href="#/shop/${x.id}" aria-current="${cat === x.id}">${L(x)}${n ? html`<small>${n}</small>` : html`<small class="soon">${T('בקרוב', 'soon')}</small>`}</a>`; })}
</nav>`;

export function shop(cat, q = '', sort = 'pop', sub = '', f = {}) {
  let list = active();
  if (f.str) list = list.filter((p) => p.cat !== 'oils' || scentOf(p).strength === f.str);
  if (f.notes?.length) list = list.filter((p) => p.cat !== 'oils' || scentOf(p).notes.some((n) => f.notes.includes(n)));
  if (f.stock) list = list.filter((p) => p.quote || p.stock > 0);
  if (cat) list = list.filter((p) => p.cat === cat);
  if (sub) list = list.filter((p) => p.sub === sub);
  if (q) { const s = q.toLowerCase(); list = list.filter((p) => (p.name.he + ' ' + p.name.en + ' ' + (p.sub || '')).toLowerCase().includes(s)); }
  if (sort === 'low') list.sort((a, b) => minPrice(a) - minPrice(b));
  if (sort === 'high') list.sort((a, b) => minPrice(b) - minPrice(a));
  if (sort === 'name') list.sort((a, b) => L(a.name).localeCompare(L(b.name), getLang()));
  const c = CATEGORIES.find((x) => x.id === cat);
  const crumbs = html`<nav class="crumbs" aria-label="${T('מיקום בעמוד', 'Breadcrumb')}"><a href="#/">${t('home')}</a><span aria-hidden="true">/</span>${cat ? html`<a href="#/shop">${t('shop')}</a>` : t('shop')}${sub ? html`<span aria-hidden="true">/</span><a href="#/shop/${cat}">${catName(cat)}</a>` : ''}</nav>`;

  // ---- Shop landing: curated rails per category ----
  if (!cat && !q) {
    const cats = CATEGORIES.filter((x) => active().some((p) => p.cat === x.id));
    return html`<div class="shop-page">
      <header class="sx"><div class="wrap sx-in">
        <div class="sx-copy">${crumbs}<p class="sx-k">The collection</p>
          <h1>${T('הבית שלכם,', 'Your home,')}<br><em>${T('בניחוח של מלון בוטיק.', 'scented like a boutique hotel.')}</em></h1>
          <p class="sx-lead">${T('מכשירי בישום, תמציות שמן ומארזים — במחירי יבואן, עד הבית. מאיפה תרצו להתחיל?', 'Diffusers, oils and bundles at importer prices. Where would you like to start?')}</p>
          <div class="sx-paths">
            <a href="#/shop/diffusers"><b>${T('אני מחפש/ת מכשיר', 'I need a device')}</b><small>${T('לפי גודל החלל', 'By space size')}</small></a>
            <a href="#/shop/oils"><b>${T('אני מחפש/ת ריח', 'I want a scent')}</b><small>${T(`${active().filter((p) => p.cat === 'oils' && !p.picks).length} ריחות`, 'Many scents')}</small></a>
            <a class="dark" href="#/finder"><b>${T('לא בטוחים? עזרו לי', 'Not sure? Help me')}</b><small>${T('3 שאלות, 30 שניות', '3 questions, 30 seconds')}</small></a>
          </div>
          <ul class="sx-stats"><li><b>${active().length}</b>${T('מוצרים', 'products')}</li><li><b>299 ₪</b>${T('משלוח חינם מעל', 'free shipping over')}</li><li><b>15%</b>${T('למצטרפים למועדון', 'for club members')}</li></ul>
        </div>
        <div class="sx-bento">${[['diffusers', 'assets/products/hero-1.webp'], ['oils', 'assets/products/cat-oils.webp'], ['bundles', 'assets/products/bundle-0.webp'], ['kit', 'assets/products/kit-14.webp']].map(([id, img], i) => { const c = CATEGORIES.find((x) => x.id === id); const n = id === 'kit' ? 0 : active().filter((p) => p.cat === id).length; const href = id === 'kit' ? '#/product/kit-14' : `#/shop/${id}`;
          return html`<a class="sx-t t${i}" href="${href}"><img src="${i ? small(img) : img}" alt="" width="800" height="800" ${raw(i ? 'loading="lazy"' : 'fetchpriority="high"')}><span><b>${c ? L(c) : T('ערכת התנסות', 'Discovery kit')}</b><small>${n ? `${n} ${T('מוצרים', 'items')}` : T('14 ריחות לבחירה', '14 scents to choose')}</small></span></a>`; })}</div>
      </div>
      ${CATEGORIES.some((x) => !cats.includes(x)) ? html`<p class="wrap sx-soon"><b>${T('בקרוב בבוטיק', 'Coming soon')}</b>${CATEGORIES.filter((x) => !cats.includes(x)).map((x) => html`<a href="#/shop/${x.id}">${L(x)}</a>`)}</p>` : ''}
      </header>
      <div class="wrap">${catTabs('')}
        ${cats.map((x) => { const items = active().filter((p) => p.cat === x.id); return html`<section class="rail-sec" aria-labelledby="r-${x.id}">
          <header class="rail-h"><div><h2 id="r-${x.id}">${L(x)}</h2><p>${T(...(CAT_LEAD[x.id] || ['', '']))}</p></div><a class="u-link" href="#/shop/${x.id}">${T('לכל ה', 'All ')}${L(x)} (${items.length}) <span aria-hidden="true">${he() ? '←' : '→'}</span></a></header>
          ${(() => { const subs = (db.SITE.subs?.[x.he] || []).filter((s2) => active().some((p) => p.sub === s2)); return subs.length > 1 ? html`<nav class="stories mini" aria-label="${T('תת־קטגוריות', 'Subcategories')} — ${L(x)}">${subs.map((s2) => html`<a href="#/shop/${x.id}/${encodeURIComponent(s2)}"><span class="st-img ${x.id === 'diffusers' ? 'studio' : ''}"><img src="${small(subImg(x.id, s2))}" alt="" width="120" height="120" loading="lazy"></span><b>${subName(s2)}</b></a>`)}</nav>` : ''; })()}
          <div class="rail">${items.slice(0, 8).map((p, i) => (i < 4 ? raw(String(card(p)).replace(/loading="lazy"/g, 'loading="eager"')) : card(p)))}</div></section>`; })}
      </div></div><div class="block"></div>`;
  }

  const subs = (db.SITE.subs?.[c?.he] || []).filter((s2) => active().some((p) => p.sub === s2));
  const soon = c && !active().some((p) => p.cat === cat);
  const heroImg = sub ? subImg(cat, sub) : cat === 'diffusers' ? 'assets/products/cat-diffusers-grid.webp' : c?.img;
  const title = sub ? subName(sub) : cat ? catName(cat) : T('תוצאות חיפוש', 'Search results');
  if (cat === 'oils' && !sub && !q) {
    const worlds = subs.map((s2) => ({ s2, n: active().filter((p) => p.sub === s2 && !p.picks).length })).filter((x) => x.n).sort((x, y) => (y.s2 === 'בתי מלון ויוקרה') - (x.s2 === 'בתי מלון ויוקרה'));
    const kit = active().find((p) => p.picks === 14);
    const moods = [['fresh', 'נקי ורגוע', 'Clean & calm', 'כמו מצעים של מלון, רגע אחרי שהחדר סודר.', 'Like hotel sheets, right after housekeeping.', 'ניקיון ורעננות'], ['sweet', 'מפנק ומתוק', 'Cosy & sweet', 'וניל, קפה ומאפה חם — הבית מחבק.', 'Vanilla, coffee, warm pastry — a hug.', 'מאפים ומתוקים'], ['floral', 'רך ופרחוני', 'Soft & floral', 'ורדים, פריחה ושקט של ספא.', 'Roses, blossom and spa calm.', 'טבע וספא'], ['rich', 'עמוק ויוקרתי', 'Rich & luxurious', 'הלובי של מלון חמישה כוכבים.', 'A five-star hotel lobby.', 'בתי מלון ויוקרה']];
    const items = list.filter((p) => !p.picks);
    return html`<div class="shop-page oz">
    <header class="oz-hero">
      <div class="oz-media"><span class="mist" aria-hidden="true"><i></i><i></i><i></i></span><img src="${c.img}" alt="" width="1600" height="1000" fetchpriority="high"></div>
      <div class="oz-card">${crumbs}
        <p class="oz-k">${T(`${items.length} תמציות שמן למפיצי ריח`, `${items.length} fragrance oils`)}</p>
        <h1>${T('נושמים פנימה.', 'Breathe in.')}<br><em>${T('ומרגישים במלון.', 'You are at the hotel.')}</em></h1>
        <p>${T('כל תמצית נולדה מזיכרון של מקום. ספרו לנו איך אתם רוצים שהבית ירגיש — ואנחנו נראה לכם מאיפה להתחיל.', 'Every oil began as a memory of a place. Tell us how home should feel — we show you where to start.')}</p>
      </div>
    </header>
    <div class="wrap">
      <form class="oz-search" role="search" data-form="oil-search"><label for="oz-q"><b>${T('מכירים כבר את הריח?', 'Already know the scent?')}</b>${T('חפשו לפי שם — מלון, בושם או ניחוח', 'Search by name — hotel, perfume or note')}</label>
        <div class="oz-sbox"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="oz-q" name="q" type="search" data-input="oz-q" maxlength="60" autocomplete="off" placeholder="${T('למשל: הילטון, וניל, טום פורד…', 'e.g. Hilton, vanilla, Tom Ford…')}"><button type="submit">${T('חיפוש', 'Search')}</button></div></form>
      <section class="oz-moods" aria-labelledby="oz-m"><h2 id="oz-m">${T('איך אתם רוצים שהבית ירגיש?', 'How should your home feel?')}</h2>
        <div class="oz-mgrid">${moods.map(([k, h, e, d, de, s2]) => html`<button type="button" class="oz-mood ${f.notes?.includes(k) ? 'on' : ''}" data-action="mood" data-k="${k}"><img src="${small(subImg('oils', s2))}" alt="" loading="lazy" width="500" height="500"><span><b>${T(h, e)}</b>${T(d, de)}</span></button>`)}</div>
        ${kit ? html`<a class="oz-kit" href="#/product/${kit.id}"><b>${T('עדיין לא בטוחים? אל תנחשו — תריחו.', 'Still unsure? Do not guess — smell.')}</b><span>${T('ערכת התנסות: 14 ריחות של 10 מ"ל', 'Discovery kit: 14 × 10 ml')} · ${m(minPrice(kit))}</span><i aria-hidden="true">${he() ? '←' : '→'}</i></a>` : ''}
      </section>
      <section class="oz-worlds" aria-labelledby="oz-w"><h2 id="oz-w">${T('או בחרו עולם', 'Or pick a world')}</h2>
        <div class="oz-wrail">${worlds.map(({ s2, n }) => html`<a class="oz-w" href="#/shop/oils/${encodeURIComponent(s2)}"><img src="${small(subImg('oils', s2))}" alt="" loading="lazy" width="500" height="650"><span><small>${n} ${T('ריחות', 'scents')}</small><b>${subName(s2)}</b></span></a>`)}</div>
      </section>
      <section id="oz-all" class="oz-all"><h2>${f.notes?.length ? T('הריחות שמתאימים לכם', 'Your matches') : T('כל התמציות', 'All oils')}</h2>
      ${sortBar(q, sort, items.length, f)}
      <div class="grid shop-grid ox-grid">${items.map((p) => card(p))}</div></section>
    </div></div><div class="block"></div>`;
  }
  return html`<div class="shop-page">
    ${cat === 'diffusers' && !sub && !q ? dxHead(crumbs) : html`    <header class="sp-head cat wrap">
      <div class="sp-head-t">${crumbs}<p class="kicker latin">${cat ? (CATEGORIES.find((x) => x.id === cat)?.en || '') : 'Search'}</p><h1>${title}</h1>
        ${c && !soon ? html`<p class="lead">${T(...(CAT_LEAD[cat] || [c.descHe, c.descEn]))}</p>` : ''}</div>
      ${heroImg ? html`<figure class="sp-arch ${cat === 'diffusers' && !sub ? 'studio' : ''}"><img src="${heroImg}" alt="" width="900" height="1100" fetchpriority="high"></figure>` : html`<figure class="sp-arch empty"><img src="assets/img/mark.webp" alt="" width="180" height="156"></figure>`}
    </header>`}
    <div class="wrap">
      ${catTabs(cat)}
      ${subs.length > 1 ? html`<nav class="stories" aria-label="${T('תת־קטגוריות', 'Subcategories')}">
        <a href="#/shop/${cat}" aria-current="${!sub}"><span class="st-img all">${T('הכל', 'All')}</span><b>${T('הכל', 'All')}</b></a>
        ${subs.map((s2) => html`<a href="#/shop/${cat}/${encodeURIComponent(s2)}" aria-current="${s2 === sub}"><span class="st-img ${cat === 'diffusers' ? 'studio' : ''}"><img src="${small(subImg(cat, s2))}" alt="" width="160" height="160" loading="lazy"></span><b>${subName(s2)}</b></a>`)}
      </nav>` : ''}
      ${soon ? html`<div class="soon-box"><p class="eyebrow latin">Coming soon</p><h2>${T('הקולקציה תעלה בקרוב', 'The collection is coming soon')}</h2><p>${T('אנחנו מכינים עבורכם קולקציה חדשה. רוצים לשמוע ראשונים או להזמין כבר עכשיו?', 'A new collection is on its way. Want to hear first or order now?')}</p><a class="btn" href="${waLink()}" target="_blank" rel="noopener noreferrer">${T('לפרטים בוואטסאפ', 'Ask on WhatsApp')}</a></div>` : html`
      ${sortBar(q, sort, list.length, f, cat === 'oils' || !!q)}
      ${list.length ? html`<div class="grid shop-grid">${list.map((p) => card(p, { feature: !q && !sub && (p.picks || p.id === 'say-300') }))}</div>` : html`<p class="empty">${t('noResults')}</p>`}`}
    </div></div><div class="block"></div>`;
}

// Diffusers: a lit "showroom" stage — every device side by side, sized to scale, each labelled with the space it covers.
function dxHead(crumbs) {
  const ids = [['say-car', 'רכב וחדר קטן', 'Car & small room', .34], ['say-room-office', 'עד 20 מ"ר', 'Up to 20 m²', .3], ['say-100', 'עד 100 מ"ר', 'Up to 100 m²', .45], ['say-150', 'עד 150 מ"ר', 'Up to 150 m²', .45], ['say-300', 'עד 300 מ"ר', 'Up to 300 m²', .5], ['say-400', 'לובי ואולם', 'Lobby & hall', 1]];
  const items = ids.map(([id, h, e, k]) => ({ p: db.product(id), h, e, k })).filter((x) => x.p && x.p.active !== false);
  return html`<header class="dx">
    <div class="dx-copy wrap">${crumbs}
      <p class="dx-k">${T('מפיצי ריח · טכנולוגיית אידוי קר', 'Diffusers · cold-air technology')}</p>
      <h1>${T('שקט. בלי מים. בלי חום.', 'Silent. No water. No heat.')}<br><em>${T('רק ריח של מלון.', 'Just a hotel scent.')}</em></h1>
      <p class="dx-lead">${T('מבחר מפיצי ריח לבית, למשרד, לעסק ולרכב — בחרו את הפתרון שמתאים לחלל שלכם.', 'Choose by the size of your space — smallest to largest. Tap one for details.')}</p>
    </div>
    <div class="wrap"><button type="button" class="qs" data-action="search-open"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><span><b>${T('יודעים מה אתם מחפשים?', 'Know what you want?')}</b>${T('הקליקו כאן וחפשו לפי דגם, חלל או ריח', 'Tap to search by model, space or scent')}</span><i>${T('חיפוש מהיר', 'Quick search')}</i></button></div>
  </header>`;
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
    // A short line with no sentence-ending period is a heading (the sheet's emoji markers are stripped).
    if ((/^\p{Extended_Pictographic}/u.test(line) || !/[.:]$/.test(line)) && line.length < 70 && !m2) { flush(); out.push(html`<h3 class="rt-h">${line}</h3>`); }
    else if (m2) list.push(html`<li><b>${m2[1]}:</b> ${m2[2]}</li>`);
    else { flush(); out.push(html`<p>${line}</p>`); }
  }
  flush(); return out;
}

// Price per ml and saving vs the smallest size — an honest comparison, computed from the real prices.
const ml = (label) => { const n = parseFloat(String(label).replace(/[^\d.]/g, '')); if (!n) return 0; return /ליטר|l\b/i.test(label) ? n * 1000 : n; };
// Honest compare price: oils vs the same amount in the smallest bottle; others only with a real before-sale price.
function cmpPrice(p, s, priceOf) {
  const now = priceOf(s);
  if (p.cat === 'oils') { const base = p.sizes.find((x) => ml(x.label)); const v = ml(s.label); if (base && v && s !== base) { const was = Math.round((priceOf(base) / ml(base.label)) * v); if (was > now) return { was, save: Math.round((1 - now / was) * 100) }; } return { was: 0, save: 0 }; }
  return p.was > now ? { was: p.was, save: Math.round((1 - now / p.was) * 100) } : { was: 0, save: 0 };
}
const FIT = {
  'say-car': ['רכב', 'חדר קטן', 'ארון בגדים', 'שירותים'], 'say-room-office': ['חדר שינה', 'משרד', 'חדר ילדים', 'שירותים', 'ארון'],
  'say-100': ['סלון', 'דירה', 'משרד', 'חנות קטנה', 'קליניקה'], 'say-150': ['סלון', 'בית', 'מסדרון', 'חדר שינה', 'קליניקה'],
  'say-300': ['לובי', 'משרד גדול', 'חנות', 'מסעדה', 'בית גדול'], 'say-400': ['לובי מלון', 'אולם', 'חנות גדולה', 'מסעדה', 'בניין משרדים'],
};
const spec = (p, ...keys) => { for (const k of keys) { const r = (p.specs || []).find(([a]) => a === k); if (r) return r[1]; } return ''; };
const shortV = (v) => String(v || '').replace(/\s*\(.*$/, '').replace(/^.*[–-]\s*(?=עד|\d)/, '').trim();
function specBoxes(p) {
  if (p.cat !== 'diffusers' || !p.specs?.length) return BENEFIT[p.id] ? html`<p class="pdp-benefit">${T(...BENEFIT[p.id])}</p>` : '';
  const cov = (spec(p, 'שטח כיסוי').match(/עד\s*[\d,]+\s*מ"[רק]/) || [shortV(spec(p, 'שטח כיסוי'))])[0];
  const ctl = spec(p, 'שליטה ובקרה', 'שליטה'); const ctlS = /wi-?fi/i.test(ctl) ? 'Wi-Fi + אפליקציה' : /אפליקציה|bluetooth/i.test(ctl) ? 'אפליקציה + Bluetooth' : shortV(ctl) || shortV(spec(p, 'חיישן חכם')) || 'לחצן הפעלה';
  const pow = shortV(spec(p, 'הספק', 'מקור כוח'));
  const fill = shortV(spec(p, 'קיבולת מכל שמן', 'קיבולת בקבוק שמן', 'קיבולת בקבוק מילוי'));
  const box = (ic, k, v) => v ? html`<li>${raw(`<svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg>`)}<span><small>${k}</small><b>${v}</b></span></li>` : '';
  return html`<ul class="pdp-specs">
    ${box('<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/>', T('כיסוי', 'Coverage'), cov)}
    ${box('<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>', T('שליטה', 'Control'), ctlS.length > 26 ? ctlS.slice(0, 24) + '…' : ctlS)}
    ${box('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', T('הספק', 'Power'), pow.length > 20 ? pow.slice(0, 18) + '…' : pow)}
    ${box('<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>', T('מילוי', 'Tank'), fill)}
  </ul>`;
}
const fitBlock = (p) => FIT[p.id] ? html`<div class="fit"><b>${T('מתאים ל:', 'Suits:')}</b>${FIT[p.id].map((x) => html`<span>${x}</span>`)}${(spec(p, 'שטח כיסוי').match(/עד\s*[\d,]+\s*מ"[רק]/) || [])[0] ? html`<em>${(spec(p, 'שטח כיסוי').match(/עד\s*[\d,]+\s*מ"[רק]/))[0]}</em>` : ''}</div>` : '';

function perUnit(p, s, priceOf) {
  const base = p.sizes.find((x) => ml(x.label)); const v = ml(s.label);
  if (!base || !v || s === base) return { save: 0 };
  const save = Math.round((1 - priceOf(s) / v / (priceOf(base) / ml(base.label))) * 100);
  return { save: save >= 5 ? save : 0 };
}

// Only models whose spec sheet states a 1-year importer warranty.
const WARRANTY = new Set(['say-150', 'say-300', 'say-400']);

export function productPage(id) {
  const p = db.product(id);
  if (!p || p.active === false) return null;
  const ws = db.me()?.role === 'wholesale';
  const gallery = [...new Set([p.pack, p.img, ...(p.gallery || [])].filter(Boolean))];
  const opt = p.options?.[0];
  const priceOf = (s) => (ws && s.wholesale ? s.wholesale : s.price);
  const pickList = p.picks ? (p.pickFrom || []).map((x) => db.product(x)).filter(Boolean) : [];
  const groups = [...new Set(pickList.map((x) => x.sub))];
  return html`<div class="wrap"><div class="pdp">
    <div class="pdp-gallery">
      ${gallery.length > 1 ? html`<div class="pg-rail" role="group" aria-label="${T('תמונות המוצר', 'Product images')}">${gallery.map((g, i) => html`<button data-action="thumb" data-i="${i}" aria-label="${T('תמונה', 'Image')} ${i + 1}" aria-pressed="${i === 0}"><img src="${small(g)}" alt="" loading="lazy" width="120" height="120"></button>`)}</div>` : ''}
      <div class="swipe ${p.fit === 'contain' ? 'contain' : ''}" aria-label="${T('תמונות המוצר', 'Product images')}">${gallery.map((g, i) => html`<figure class="pg-slide" data-i="${i}"><img src="${g}" alt="${L(p.name)} ${i + 1}" width="1000" height="1250" ${raw(i ? 'loading="lazy"' : 'fetchpriority="high"')} decoding="async"></figure>`)}</div>
      ${gallery.length > 1 ? html`<div class="pg-count" dir="ltr" aria-hidden="true"><b id="pg-n">1</b> / ${gallery.length}</div><div class="swipe-dots" aria-hidden="true">${gallery.map((_, i) => html`<i class="${i ? '' : 'on'}"></i>`)}</div>` : ''}
    </div>
    <div class="pdp-info">
      <div class="crumbs"><a href="#/">${t('home')}</a> / <a href="#/shop/${p.cat}">${catName(p.cat)}</a>${p.sub ? html` / <a href="#/shop/${p.cat}/${encodeURIComponent(p.sub)}">${subName(p.sub)}</a>` : ''}</div>
      <p class="eyebrow">${p.sub ? subName(p.sub) : catName(p.cat)}</p>
      <h1>${L(p.name)}</h1>
      ${specBoxes(p)}
      ${p.quote ? html`<p class="price big" id="pdp-price">${T('מחיר בהתאמה אישית', 'Price on request')}</p>` : (() => { const c = cmpPrice(p, p.sizes[0], priceOf); return html`<div class="pp" id="pdp-price" aria-live="polite">${c.was && p.cat !== 'oils' ? html`<span class="pp-sale">${T('מבצע', 'Sale')}</span>` : ''}<strong class="pp-now">${m(priceOf(p.sizes[0]))}</strong><span class="pp-was" ${raw(c.was ? '' : 'hidden')}><s>${c.was ? m(c.was) : ''}</s><em>${c.save ? `−${c.save}%` : ''}</em></span>${ws ? html`<span class="ws">${t('wsPrice')}</span>` : ''}</div>${p.cat === 'oils' ? html`<p class="pp-note" ${raw(c.was ? '' : 'hidden')}>${T('המחיר המחוק: אותה כמות בבקבוקי 10 מ"ל', 'Crossed price: the same amount in 10 ml bottles')}</p>` : ''}`; })()}
      ${p.quote ? html`<p>${he() ? p.desc.he.split('\n')[0] : p.desc.en || p.desc.he.split('\n')[0]}</p>
        <div class="q-row"><a class="q-wa" href="${waLink(T('שלום, אשמח להצעת מחיר עבור ', 'Hello, I would like a quote for ') + L(p.name))}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a15 15 0 01-5.6-4.9c-.7-1-1.2-2.1-1.2-3.2 0-1 .5-1.6.8-1.9.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.6-.1 1.1z" fill="currentColor"/></svg>${T('לקבלת הצעת מחיר בוואטסאפ', 'Get a quote on WhatsApp')}</a>
          <a class="q-tel" href="tel:+${PHONE_INTL}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2"/></svg>${T('או התקשרו', 'Or call')} <b dir="ltr">${PHONE_DISPLAY}</b></a></div>` : html`
      <form data-form="add" data-id="${p.id}" novalidate>
        ${p.sizes.length > 1 ? html`<fieldset class="sizes"><legend>${p.cat === 'oils' ? T('נפח', 'Volume') : t('size')}</legend>
          ${p.sizes.map((s, i) => { const v = perUnit(p, s, priceOf); return html`<label class="size-opt"><input type="radio" name="size" value="${s.label}" ${raw(i ? '' : 'checked')} data-input="size" data-price="${priceOf(s)}" data-was="${cmpPrice(p, s, priceOf).was}" data-save="${cmpPrice(p, s, priceOf).save}"><span>${s.label}${v.save ? html`<em>−${v.save}%</em>` : ''}</span></label>`; })}
        </fieldset>` : html`<input type="hidden" name="size" value="${p.sizes[0].label}">`}
        ${opt ? html`<fieldset class="sizes"><legend>${L(opt.name)}</legend>
          ${opt.values.map((v, i) => html`<label class="size-opt sw-opt"><input type="radio" name="opt" value="${v.he}" ${raw(i ? '' : 'checked')} data-input="opt" data-img="${v.imgs?.[0] || ''}"><span><i class="sw ${swatch(v.he)}" aria-hidden="true"></i>${L(v)}</span></label>`)}
        </fieldset>` : ''}
        ${p.picks ? html`<fieldset class="picker pk" aria-describedby="pick-count"><legend class="pk-head"><span><b>${T(`בחרו ${p.picks} ניחוחות`, `Choose ${p.picks} scents`)}</b><small>${T('פתחו עולם ריח וסמנו את מה שמסקרן אתכם', 'Open a scent world and tap what intrigues you')}</small></span><span id="pick-count" class="pk-count" aria-live="polite">0/${p.picks}</span></legend>
          <p class="pk-hint">${T('בחרו את הריחות שאתם כבר מכירים, ואנחנו נעזור לכם להשלים את הערכה.', 'Pick the scents you know; we will help complete the kit.')}</p>
          <button type="button" class="pk-fill" data-action="pk-fill" hidden>✦ ${T('השלימו לי את השאר', 'Complete the rest for me')}</button>
          <span class="pk-bar" aria-hidden="true"><i id="pk-fill"></i></span>
          <label class="pk-surprise"><input type="checkbox" name="surprise" data-input="surprise"><span><b>${T('הפתיעו אותי', 'Surprise me')}</b>${T('נבחר בשבילכם את 14 הניחוחות הכי אהובים', 'We pick our 14 most-loved scents')}</span></label>
          <div class="pick-groups pk-groups" data-max="${p.picks}">${groups.map((g, gi) => { const xs = pickList.filter((x) => x.sub === g); return html`<details class="pk-g" ${raw(gi ? '' : 'open')}><summary><span class="pk-g-img"><img src="${small(subImg('oils', g))}" alt="" loading="lazy" width="80" height="80"></span><span class="pk-g-t"><b>${subName(g)}</b><small>${xs.length} ${T('ריחות', 'scents')}</small></span><em class="pk-g-n" data-g="${gi}"></em><i aria-hidden="true"></i></summary>
            <div class="pk-chips">${xs.map((x) => html`<label class="pick pk-chip"><input type="checkbox" name="pick" value="${x.name.he}" data-input="pick" data-g="${gi}"><span>${L(x.name)}</span></label>`)}</div></details>`; })}</div>
        </fieldset>` : ''}
        <div class="buy-row">
          <div class="qty"><button type="button" data-action="qty" data-d="-1" aria-label="${t('decrease')}">−</button><label class="sr-only" for="qty">${t('qty')}</label><input id="qty" name="qty" inputmode="numeric" value="1" maxlength="2"><button type="button" data-action="qty" data-d="1" aria-label="${t('increase')}">+</button></div>
          <button class="btn" type="submit" ${raw(p.stock === 0 ? 'disabled' : '')}>${p.stock === 0 ? t('outStock') : t('addToCart')}</button>
        </div>
        <p class="err" id="add-err" role="alert"></p>
      </form>`}
      ${p.cat === 'oils' && db.product('kit-14') ? (() => { const kit = db.product('kit-14'); const per = Math.round(minPrice(kit) / 14); return html`<a class="ml10" href="#/product/${kit.id}" ${raw(ml(p.sizes[0].label) === 10 ? '' : 'hidden')}><span class="ml10-ic" aria-hidden="true">✦</span><span><b>${T('לוקחים 10 מ"ל כדי לנסות?', 'Trying a 10 ml?')}</b>${T(`הרכיבו ערכה של 14 ריחות לבחירתכם — ${m(minPrice(kit))} בלבד, כ־${per} ₪ לריח במקום ${m(p.sizes[0].price)}`, `Build a 14-scent kit — only ${m(minPrice(kit))}, about ₪${per} per scent`)}</span><i aria-hidden="true">${he() ? '←' : '→'}</i></a>`; })() : ''}
      ${p.cat === 'oils' && p.sizes.length > 2 ? html`<p class="unit-note">${T('ככל שהבקבוק גדול יותר — המחיר למ"ל נמוך יותר. האחוז מציין את החיסכון לעומת 10 מ"ל.', 'Bigger bottles cost less per ml — the % shows the saving vs 10 ml.')}</p>` : ''}
      <ul class="trust" aria-label="${T('ההבטחה שלנו', 'Our promise')}"><li><b>${T('14 יום', '14 days')}</b><span>${T('להחזרה', 'to return')}</span></li><li><b>${WARRANTY.has(p.id) ? T('שנה', '1 year') : T('7-10 ימים', '7–10 days')}</b><span>${WARRANTY.has(p.id) ? T('אחריות יבואן', 'warranty') : T('עד הבית', 'delivery')}</span></li><li><b>SSL</b><span>${T('תשלום מאובטח', 'secure payment')}</span></li></ul>
      <ul class="perks"><li>${t('perk1')}</li><li>${t('perk2')}</li>${WARRANTY.has(p.id) ? html`<li>${T('שנת אחריות יבואן', '1-year importer warranty')}</li>` : ''}${p.cat === 'diffusers' ? html`<li><a href="#/guide">${T('מדריך שימוש ותחזוקה', 'Use & care guide')}</a></li>` : html`<li>${t('perk3')}</li>`}</ul>
    </div>
  </div>
  ${p.specs?.length ? html`<section class="specs" aria-labelledby="spec-t"><h2 id="spec-t">${T('מפרט טכני', 'Specifications')}</h2><table class="spec-tbl"><tbody>${p.specs.map(([k, v]) => html`<tr><th scope="row">${k}</th><td>${v}</td></tr>`)}</tbody></table></section>` : ''}
  ${!p.quote ? html`<section class="rich" aria-label="${T('תיאור המוצר', 'Product description')}">${fitBlock(p)}${he() || !p.desc.en ? richText(p.desc.he) : richText(p.desc.en)}</section>` : ''}
  <section class="block" aria-labelledby="comp-t"><h2 id="comp-t">${t('complements')}</h2><span class="rule"></span><div class="grid">${complements(p).map(card)}</div></section></div>`;
}

// ---------- Search ----------
const norm = (x) => String(x || '').toLowerCase().replace(/["'׳״\-–]/g, '').replace(/\s+/g, ' ').trim();
export function searchPanel() {
  const popular = ['קינג דיוד', 'SAY 150', 'ערכת התנסות', 'וניל', 'בלו שאנל', 'SAY Car'];
  return html`<div class="so-top"><div class="wrap">
      <form id="search-form" role="search" class="so-form"><label class="sr-only" for="sq">${t('search')}</label>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input id="sq" type="search" autocomplete="off" placeholder="${T('מה תרצו להריח היום?', 'What would you like to smell today?')}" data-input="sq" maxlength="60">
        <button type="button" class="so-close" data-action="search-close" aria-label="${t('close')}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
      </form></div></div>
    <div class="wrap so-body" id="search-results" aria-live="polite">${searchResults('', popular)}</div>`;
}
// ---------- Smart search: typos, final letters, quotes/hyphens, synonyms, model numbers ----------
const FINAL = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const SYN = [[/מפזר(י|ים)?/g, 'מפיצ'], [/מבשמ(ים)?/g, 'מפיצ'], [/דיפיוזר(ים)?/g, 'מפיצ'], [/diffusers?/g, 'מפיצ'], [/שמנ(י|ים)? ריח/g, 'תמצית'], [/\boils?\b/g, 'תמצית'], [/סייי|ספ /g, 'say ']];
export const snorm = (x) => String(x || '').toLowerCase().normalize('NFKD').replace(/[֑-ׇ]/g, '').replace(/[ךםןףץ]/g, (c) => FINAL[c]).replace(/["'׳״`´’\-–_.,/()]/g, ' ').replace(/([a-z])(\d)/g, '$1 $2').replace(/(\d)([a-z])/g, '$1 $2').replace(/\s+/g, ' ').trim();
const qnorm = (q) => { let n = snorm(q); for (const [r, w] of SYN) n = n.replace(r, w); return n.replace(/\s+/g, ' ').trim(); };
const lev = (a, b) => { if (Math.abs(a.length - b.length) > 2) return 9; const d = Array.from({ length: b.length + 1 }, (_, i) => i); for (let i = 1; i <= a.length; i++) { let prev = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t2 = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t2; } } return d[b.length]; };
const hayOf = (p) => snorm(`${p.name.he} ${p.name.en} ${p.sub || ''} ${catName(p.cat)} ${p.cat === 'diffusers' ? 'מפיצ מפיצי ריח' : p.cat === 'oils' ? 'תמצית תמציות שמנ' : ''} ${(p.options?.[0]?.values || []).map((v) => v.he).join(' ')}`);
// score: 0 = no match, 2 = exact words, 1 = fuzzy
export function matchProduct(p, q) {
  const n = qnorm(q); if (!n) return 2; const hay = hayOf(p); const hw = hay.split(' ');
  let fuzzy = false;
  for (const w of n.split(' ')) {
    if (hay.includes(w)) continue;
    const tol = w.length >= 6 ? 2 : w.length >= 3 ? 1 : 0;
    if (tol && hw.some((h) => lev(w, h.slice(0, w.length + 1)) <= tol || lev(w, h) <= tol)) { fuzzy = true; continue; }
    return 0;
  }
  return fuzzy ? 1 : 2;
}
export function searchResults(q, popular = ['קינג דיוד', 'SAY 150', 'ערכת התנסות', 'וניל', 'בלו שאנל', 'SAY Car']) {
  const n = qnorm(q);
  if (!n) return html`<p class="so-label">${T('חיפושים פופולריים', 'Popular searches')}</p>
    <div class="so-chips">${popular.map((p) => html`<button type="button" data-action="search-term" data-q="${p}">${p}</button>`)}</div>
    <p class="so-label">${t('categories')}</p>
    <div class="so-cats">${CATEGORIES.filter((c) => c.img).map((c) => html`<a href="#/shop/${c.id}"><img src="${small(c.img)}" alt="" loading="lazy" width="320" height="240"><span>${L(c)}</span></a>`)}</div>`;
  const scored = active().map((p) => [p, matchProduct(p, q)]).filter(([, sc]) => sc);
  const exact = scored.filter(([, sc]) => sc === 2).map(([p]) => p);
  const res = (exact.length ? exact : scored.map(([p]) => p)).sort((a, b) => (snorm(L(b.name)).startsWith(n) ? 1 : 0) - (snorm(L(a.name)).startsWith(n) ? 1 : 0));
  const item = (p) => html`<a class="so-item" href="#/product/${p.id}"><span class="so-img ${p.fit === 'contain' ? 'contain' : ''}">${media(p)}</span><span class="so-t"><small>${p.sub ? subName(p.sub) : catName(p.cat)}</small><b>${L(p.name)}</b>${priceTag(p)}</span></a>`;
  if (!res.length) { const alt = active().filter((p) => p.tag === 'best').slice(0, 6);
    return html`<p class="so-empty">${T('לא מצאנו התאמה מדויקת. אולי אחד מהמוצרים האלה יתאים לכם?', 'No exact match. Maybe one of these?')}</p><div class="so-grid">${alt.map(item)}</div>`; }
  return html`<p class="so-label">${exact.length ? html`${res.length} ${T('תוצאות', 'results')}` : html`${T('אולי התכוונת:', 'Did you mean:')} <b>${L(res[0].name)}</b>`}</p>
    <div class="so-grid">${res.slice(0, 12).map(item)}</div>
    ${res.length > 12 ? html`<p><a class="u-link" href="#/shop">${T('לכל התוצאות בחנות', 'See all in the shop')}</a></p>` : ''}`;
}

export function kitUpsell() {
  const kits = active().filter((p) => p.picks);
  if (!kits.length) return '';
  return html`<div class="modal-bg"><div class="modal shop-modal" role="dialog" aria-modal="true" aria-labelledby="up-t">
    <p class="eyebrow">${T('נוסף לסל', 'Added to cart')}</p>
    <h2 id="up-t">${T('ומה תפיצו בו? השלימו עם ערכת התנסות', 'What will you diffuse? Add a discovery kit')}</h2>
    <p class="muted">${T('המכשיר עובד עם תמציות שמן בלבד. ערכת התנסות היא הדרך הכי טובה למצוא את הניחוח שלכם.', 'The device works with fragrance oils only. A discovery kit is the best way to find your scent.')}</p>
    <div class="up-grid">${kits.map((k) => html`<a class="up" href="#/product/${k.id}" data-action="modal-close">${media(k)}<b>${L(k.name)}</b><span>${m(k.sizes[0].price)}</span></a>`)}</div>
    <div class="bo-filters"><button class="btn ghost" data-action="modal-close">${T('המשך קנייה', 'Continue shopping')}</button><button class="btn" data-action="go-cart">${T('לסל הקניות', 'View cart')}</button></div>
  </div></div>`;
}

// ---------- Scent finder (3 questions → personal recommendation) ----------
const FINDER = {
  space: [
    ['room', 'חדר שינה או קליניקה', 'Bedroom or clinic', 'say-room-office', 'עד 20 מ"ר', 'Up to 20 m²'],
    ['home', 'סלון ובית', 'Living room & home', 'say-150', 'עד 150 מ"ר', 'Up to 150 m²'],
    ['office', 'משרד או חנות', 'Office or shop', 'say-100', 'עד 100 מ"ר', 'Up to 100 m²'],
    ['big', 'לובי, אולם או עסק גדול', 'Lobby or large venue', 'say-300', 'עד 300 מ"ר', 'Up to 300 m²'],
    ['car', 'רכב', 'Car', 'say-car', 'נייד ונטען', 'Portable'],
  ],
  mood: [
    ['בתי מלון ויוקרה', 'כמו לובי של מלון יוקרה', 'Like a luxury hotel lobby'],
    ['השראת בשמים יוקרתיים', 'בושם אייקוני שאני אוהב', 'An iconic perfume I love'],
    ['טבע וספא', 'רוגע, טבע וספא', 'Calm, nature & spa'],
    ['ניקיון ורעננות', 'נקי, רענן ואוורירי', 'Clean, fresh & airy'],
    ['מאפים ומתוקים', 'חם, מתוק ועוטף', 'Warm, sweet & cosy'],
    ['ניחוחות קלאסיים', 'קלאסי ועל־זמני', 'Classic & timeless'],
  ],
  power: [['soft', 'עדין — שירגישו כשנכנסים', 'Subtle — noticed on entry'], ['mid', 'מאוזן — נוכח כל הזמן', 'Balanced — always present'], ['strong', 'עוצמתי — ריח חתימה', 'Strong — a signature scent']],
};
export function finder(f = {}) {
  const step = !f.space ? 1 : !f.mood ? 2 : !f.power ? 3 : 4;
  const banners = db.SITE.site?.subBanners || {};
  const back = step > 1 && step < 4 ? html`<button class="u-link fd-back" data-action="fq-back">${T('חזרה', 'Back')}</button>` : '';
  const head = (q, sub) => html`<header class="fd-head"><p class="kicker latin">Scent finder · ${step}/3</p><div class="fd-bar" aria-hidden="true"><i class="s${step}"></i></div><h1>${q}</h1><p class="lead">${sub}</p></header>`;
  let body;
  if (step === 1) body = html`${head(T('איפה תרצו להשתמש במפיץ?', 'Where will you use the diffuser?'), T('נתאים מכשיר לגודל החלל.', 'We will match a device to your space.'))}
    <div class="fd-opts five">${FINDER.space.map(([k, he_, en, pid, sHe, sEn]) => { const p = db.product(pid); return html`<button class="fd-opt studio" data-action="fq" data-k="space" data-v="${k}">${p ? media(p, '', false, p.pack || p.img) : ''}<b>${T(he_, en)}</b><small>${T(sHe, sEn)}</small></button>`; })}</div>`;
  else if (step === 2) body = html`${head(T('איזה סוג ריח אתם אוהבים?', 'What kind of scent do you like?'), T('בחרו את הסגנון שהכי מתאים לכם.', 'Pick the style that suits you best.'))}
    <div class="fd-opts">${FINDER.mood.map(([k, he_, en]) => html`<button class="fd-opt photo" data-action="fq" data-k="mood" data-v="${k}">${banners[k] ? html`<img src="${small(banners[k])}" alt="" loading="lazy" width="640" height="300">` : ''}<b>${T(he_, en)}</b><small>${subName(k)}</small></button>`)}</div>`;
  else if (step === 3) body = html`${head(T('כמה חזק תרצו שהריח יהיה?', 'How strong should the scent be?'), T('את העוצמה אפשר תמיד לכוונן במכשיר.', 'You can always fine-tune the intensity.'))}
    <div class="fd-opts three">${FINDER.power.map(([k, he_, en], i) => html`<button class="fd-opt text" data-action="fq" data-k="power" data-v="${k}"><span class="fd-dots" aria-hidden="true">${[0, 1, 2].map((d) => html`<i class="${d <= i ? 'on' : ''}"></i>`)}</span><b>${T(he_, en)}</b></button>`)}</div>`;
  else {
    const sp = FINDER.space.find((x) => x[0] === f.space); const dev = db.product(sp[3]);
    const scents = active().filter((p) => p.sub === f.mood).slice(0, 3);
    const kit = db.product('kit-14');
    const tip = { soft: T('הפעלה של 10–15 שניות כל כמה דקות מספיקה לנוכחות עדינה.', 'Short bursts every few minutes give a subtle presence.'), mid: T('תזמנו עבודה בשעות שאתם בבית — ככה הריח נשאר רציף בלי בזבוז.', 'Schedule it for the hours you are home.'), strong: T('לריח חתימה, מקמו את המכשיר בגובה 1.2–1.5 מטר, הרחק מחלונות פתוחים.', 'For a signature scent, place it 1.2–1.5 m high, away from open windows.') }[f.power];
    body = html`<header class="fd-head"><p class="kicker latin">Your SAY ritual</p><h1>${T('ההמלצה שלנו בשבילכם', 'Our recommendation')}</h1><p class="lead">${T('לפי התשובות שלכם, אלה המכשיר והתמציות שמתאימים לכם.', 'Based on your answers, this device and these oils suit you.')}</p></header>
      <div class="fd-result">
        ${dev ? html`<a class="fd-dev studio" href="#/product/${dev.id}"><span class="fd-dev-img">${media(dev, '', false, dev.pack || dev.img)}</span><span><small>${T('המכשיר שלכם', 'Your device')}</small><b>${L(dev.name)}</b><em>${sp[T(4, 5)]}</em>${priceTag(dev)}</span></a>` : ''}
        <div class="fd-scents"><small>${T('הניחוחות שלכם', 'Your scents')} · ${subName(f.mood)}</small><div class="grid three">${scents.map(card)}</div></div>
      </div>
      <p class="fd-tip"><b>${T('טיפ:', 'Tip:')}</b> ${tip}</p>
      <div class="hero-cta">${kit ? html`<a class="btn" href="#/product/${kit.id}">${T('לא בטוחים? התחילו מערכת התנסות', 'Not sure? Start with a discovery kit')} · ${m(kit.sizes[0].price)}</a>` : ''}<button class="btn link" data-action="fq-reset">${T('להתחיל מחדש', 'Start over')}</button></div>`;
  }
  return html`<section class="finder wrap" aria-live="polite">${back}${body}</section><div class="block"></div>`;
}

const GUIDE = [
  ['place', ['איפה למקם את המפיץ', 'Where to place it'], [
    ['גובה', 'במקום גבוה ופתוח — מדף, שידה או קיר — כך שהערפל מתפזר באוויר ולא נבלע ברהיטים.', 'High and open — a shelf, sideboard or wall — so the mist spreads instead of hitting furniture.'],
    ['זרימת אוויר', 'ליד מעבר אוויר טבעי (כניסה, מסדרון, פתח מיזוג) — האוויר "סוחב" את הריח לכל החלל.', 'Near natural airflow (entrance, hallway, AC vent) — moving air carries the scent through the room.'],
    ['מה להימנע', 'לא צמוד לקיר או לווילון, לא מול חלון פתוח, ולא בשמש ישירה או ליד מקור חום.', 'Not against a wall or curtain, not facing an open window, not in direct sun or near heat.'],
    ['גודל החלל', 'התאימו מכשיר לגודל החלל: רכב וחדר קטן — SAY Car / room & office; בית — SAY 100 / 150; עסק ולובי — SAY 300 / 400.', 'Match the device to the space: car/small room — SAY Car or room & office; home — SAY 100/150; business — SAY 300/400.']]],
  ['use', ['הפעלה ומילוי', 'Use & refilling'], [
    ['מילוי', 'מוזגים את התמצית ישירות לבקבוק המכשיר — בלי מים ובלי דילול. לא ממלאים מעל הקו המסומן.', 'Pour the oil straight into the device bottle — no water, no dilution. Do not fill above the line.'],
    ['עוצמה ושעות', 'מתחילים בעוצמה נמוכה ומעלים בהדרגה. מומלץ להגדיר פעולה לסירוגין (למשל 30 שניות פעולה / 2 דקות הפסקה) ושעות פעילות באפליקציה או בלחצנים.', 'Start low and increase gradually. Use on/off cycles (e.g. 30s on / 2 min off) and set hours in the app or buttons.'],
    ['"הריח נפתח באוויר"', 'הריח בבקבוק אינו הריח בחלל — תנו למכשיר לעבוד 15–30 דקות לפני ששופטים את הניחוח.', 'The bottle is not the room — give it 15–30 minutes before judging the scent.'],
    ['החלפת ריח', 'לפני מעבר לתמצית אחרת — מרוקנים את השארית ומריצים את המכשיר כמה דקות ריק, כדי שהריחות לא יתערבבו.', 'Before switching oils, empty the rest and run the device empty for a few minutes so scents do not mix.']]],
  ['care', ['תחזוקה ושמירה', 'Care & maintenance'], [
    ['ניקוי', 'פעם בחודש — מנגבים את החלק החיצוני במטלית יבשה. אם הפיזור נחלש, מנקים את פתח הפיזור לפי הוראות היצרן המצורפות למכשיר.', 'Monthly — wipe the outside with a dry cloth. If output weakens, clean the outlet per the included instructions.'],
    ['אחסון התמצית', 'סוגרים היטב את הבקבוק ושומרים במקום קריר ומוצל, הרחק מהישג ידם של ילדים וחיות.', 'Close the bottle tightly; store cool and shaded, away from children and pets.'],
    ['בטיחות', 'התמצית מיועדת לפיזור באוויר בלבד — לא לשתייה ולא למריחה על העור. במגע עם העיניים — שוטפים במים.', 'For air diffusion only — not for drinking or skin. If it touches the eyes, rinse with water.'],
    ['צריכים עזרה?', 'שאלה על מיקום, עוצמה או בחירת ריח? כתבו לנו בוואטסאפ — נשמח לעזור.', 'A question about placement, strength or scent? WhatsApp us.']]],
];
export function guide() {
  const g = db.SITE.guide || '';
  if (g) return html`<div class="wrap legal rich"><p class="eyebrow">SAY Boutique</p><h1>${T('מדריך שימוש, מיקום ותחזוקה', 'Use, placement & care guide')}</h1>${richText(g)}</div><div class="block"></div>`;
  const ico = { place: '<path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>', use: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>', care: '<path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>' };
  return html`<div class="gd"><header class="gd-h wrap"><p class="c3-k">SAY Boutique</p><h1>${T('מדריך שימוש, מיקום ותחזוקה', 'Use, placement & care guide')}</h1>
    <p>${T('כמה דקות קריאה — ותקבלו מהמכשיר את הריח הכי טוב, הכי אחיד והכי ארוך.', 'A few minutes of reading for the best, most even and longest-lasting scent.')}</p>
    <nav class="gd-toc">${GUIDE.map(([id, t2]) => html`<a href="#/guide" data-action="gd-jump" data-t="gd-${id}">${T(...t2)}</a>`)}</nav></header>
    <div class="wrap gd-in">${GUIDE.map(([id, t2, items], i) => html`<section class="gd-sec" id="gd-${id}"><h2><span>${raw(`<svg viewBox="0 0 24 24" aria-hidden="true">${ico[id]}</svg>`)}</span>${i + 1}. ${T(...t2)}</h2>
      <div class="gd-grid">${items.map(([h, he_, en]) => html`<article><b>${h}</b><p>${T(he_, en)}</p></article>`)}</div></section>`)}
      <p class="gd-wa"><a class="btn" href="${waLink(T('שלום, יש לי שאלה על המפיץ', 'Hi, I have a question about my diffuser'))}" target="_blank" rel="noopener noreferrer">${T('שאלה? כתבו לנו בוואטסאפ', 'Questions? WhatsApp us')}</a></p></div></div><div class="block"></div>`;
}

const TRUST = () => html`<ul class="trust3"><li><b>${T('14 יום', '14 days')}</b>${T('להחזרה', 'to return')}</li><li><b>${T('7-10 ימים', '7–10 days')}</b>${T('עד הבית', 'delivery')}</li><li><b>${T('וואטסאפ', 'WhatsApp')}</b>${T('תמיכה אישית', 'support')}</li></ul>`;
const isDirect = (p) => !(p.quote || p.picks || p.options?.length || p.sizes.length > 1);
export function cartDrawer() {
  const tt = db.cartTotals(); const u = db.me();
  const net = tt.subtotal - tt.discount;
  const left = Math.max(0, FREE_SHIP - net);
  const ratio = Math.min(1, net / FREE_SHIP);
  const count = tt.lines.reduce((a, l) => a + l.qty, 0);
  const pool = tt.lines.length ? complements(tt.lines[0].p, 8).filter((x) => !x.quote && !tt.lines.some((l) => l.pid === x.id)) : [];
  // Best add-on: the cheapest one that unlocks free shipping, else the first suggestion.
  const kit14 = db.product('kit-14'); const has10 = tt.lines.some((l) => ml(l.size) === 10) && kit14 && !tt.lines.some((l) => l.pid === kit14.id);
  const up = has10 ? kit14 : left ? (pool.filter((x) => minPrice(x) >= left).sort((a, b) => minPrice(a) - minPrice(b))[0] || pool[0]) : pool[0];
  return html`<header class="cd-head"><h2 id="cart-t">${t('cart')} <span>${count ? `(${count})` : ''}</span></h2><button class="icon-btn" data-action="cart-close" aria-label="${t('close')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button></header>
  <div class="drawer-body">
    ${tt.lines.length ? html`
      <div class="cd-ship ${left ? '' : 'done'}"><p>${left ? html`${T('עוד', 'Add')} <b>${m(left)}</b> ${T('ומשלוח חינם עד הבית', 'for free delivery')}` : html`<b>${T('יש! המשלוח עלינו', 'Free delivery unlocked')}</b>`}</p>
        <div class="progress" aria-hidden="true"><i class="pbar" data-ratio="${ratio}"></i></div></div>
      ${tt.lines.map((l, i) => html`<div class="line cd-line">
        <a class="line-media" href="#/product/${l.p.id}" data-action="cart-close" tabindex="-1">${media(l.p)}</a>
        <div class="cd-info"><h3>${L(l.p.name)}</h3><small class="muted">${l.size === 'יחידה' || l.size === 'מארז' ? '' : l.size}${l.opt ? html` · ${l.opt.length > 40 ? l.opt.slice(0, 40) + '…' : l.opt}` : ''}</small>
          <div class="cd-row"><div class="qty"><button data-action="line-qty" data-i="${i}" data-d="-1" aria-label="${t('decrease')}">−</button><input aria-label="${t('qty')}" value="${l.qty}" readonly><button data-action="line-qty" data-i="${i}" data-d="1" aria-label="${t('increase')}">+</button></div><b>${m(l.price * l.qty)}</b></div>
          <button class="link-btn cd-rm" data-action="line-rm" data-i="${i}">${t('remove')}</button></div>
      </div>`)}
      ${up ? html`<div class="cd-up"><p class="cd-up-k">${has10 ? T('לוקחים 10 מ"ל? הרכיבו ערכה של 14 ריחות במחיר מוזל', 'Taking 10 ml? Build a 14-scent kit for less') : left && minPrice(up) >= left ? T('מוסיפים את זה — והמשלוח חינם', 'Add this and delivery is free') : T('לקוחות הוסיפו גם', 'Customers also added')}</p>
        <div class="cd-up-row"><span class="line-media">${media(up)}</span><span><b>${L(up.name)}</b><small>${m(minPrice(up))}</small></span>
        ${isDirect(up) ? html`<button class="cd-add" data-action="quick-add" data-id="${up.id}">${T('הוספה', 'Add')} +</button>` : html`<a class="cd-add" href="#/product/${up.id}" data-action="cart-close">${T('לבחירה', 'Choose')}</a>`}</div></div>` : ''}
      ${!u && !tt.discount ? html`<a class="cd-club" href="#/account/register" data-action="join-club"><span aria-hidden="true">🎁</span><span><b>${T('מגיע לכם 15% הנחה על ההזמנה הזאת', 'You deserve 15% off this order')}</b>${T(`חוסכים ${m(Math.round(tt.subtotal * 0.15))} — הצטרפות חינם למועדון, 20 שניות`, `Save ${m(Math.round(tt.subtotal * 0.15))} — free to join, 20 seconds`)}</span></a>` : ''}
    ` : html`<div class="cd-empty"><span aria-hidden="true">🛍️</span><p><b>${T('העגלה עדיין ריקה', 'Your bag is empty')}</b>${T('בואו נמצא לכם ריח שתתאהבו בו.', 'Let us find a scent you will love.')}</p><a class="btn" href="#/finder" data-action="cart-close">${T('מציאת הריח שלי', 'Find my scent')}</a><a class="u-link" href="#/shop" data-action="cart-close">${t('continueShop')}</a></div>`}
  </div>
  ${tt.lines.length ? html`<footer class="cd-foot">${totalsBlock(tt)}
    <a class="btn block cd-go" href="#/checkout" data-action="cart-close"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>${T('לתשלום מאובטח', 'Secure checkout')} · ${m(tt.total)}</a>
    ${TRUST()}<button class="link-btn cd-cont" data-action="cart-close">${t('continueShop')}</button></footer>` : ''}`;
}

export const totalsBlock = (tt) => html`<div class="totals">
  <div><span>${t('subtotal')}</span><span>${m(tt.subtotal)}</span></div>
  ${tt.discount ? html`<div><span>${t('discount')} (15%)</span><span>−${m(tt.discount)}</span></div>` : ''}
  ${tt.pointsOff ? html`<div><span>${T(`מימוש ${tt.pointsUsed} נקודות`, `${tt.pointsUsed} points`)}</span><span>−${m(tt.pointsOff)}</span></div>` : ''}
  <div><span>${t('shipping')}</span><span>${tt.shipping ? m(tt.shipping) : t('free')}</span></div>
  <div class="grand"><span>${t('total')}</span><span>${m(tt.total)}</span></div></div>`;

export function checkout() {
  const tt = db.cartTotals(); const u = db.me();
  if (!tt.lines.length) return html`<div class="wrap legal"><h1>${t('checkoutTitle')}</h1><p>${t('cartEmpty')}</p><a class="btn" href="#/shop">${t('continueShop')}</a></div>`;
  const f = (id, label, type = 'text', ac = '', req = true, val = '', ph = '') => html`<div class="field"><label for="${id}">${label}${req ? '' : html` <small>${T('(רשות)', '(optional)')}</small>`}</label><input class="input" id="${id}" name="${id}" type="${type}" autocomplete="${ac}" ${raw(req ? 'required aria-required="true"' : '')} value="${val}" placeholder="${ph}" maxlength="120" aria-describedby="${id}-e"><span class="err" id="${id}-e" aria-live="polite"></span></div>`;
  const left = Math.max(0, FREE_SHIP - (tt.subtotal - tt.discount));
  return html`<div class="co-page"><div class="wrap">
    <ol class="co-steps" aria-label="${T('שלבי ההזמנה', 'Order steps')}"><li class="done">${T('עגלה', 'Bag')}</li><li class="on" aria-current="step">${T('פרטים ומשלוח', 'Details & delivery')}</li><li>${T('אישור', 'Confirmation')}</li></ol>
    <h1 class="co-h">${T('עוד רגע והריח בדרך אליכם', 'Almost there — your scent is on its way')}</h1>
    <div class="checkout co">
    <form data-form="checkout" novalidate>
      ${!u ? html`<p class="co-login">${T('כבר חברי מועדון?', 'Already a member?')} <a href="#/account">${T('התחברו', 'Sign in')}</a> · <a href="#/account/register" data-action="join-club">${T('או הצטרפו וקבלו 15% הנחה', 'or join for 15% off')}</a></p>` : ''}
      <section class="co-box"><h2><span>1</span>${T('איך ניצור קשר?', 'How do we reach you?')}</h2>
        <div class="row2">${f('name', t('fullName'), 'text', 'name', true, u?.name || '')}${f('phone', t('phone'), 'tel', 'tel', true, u?.phone || '', '050-0000000')}</div>
        ${f('email', t('email'), 'email', 'email', true, u?.email || '', T('לשליחת אישור ההזמנה', 'For your order confirmation'))}</section>
      <section class="co-box"><h2><span>2</span>${T('לאן לשלוח?', 'Where to deliver?')}</h2>
        <div class="row2">${f('city', t('city'), 'text', 'address-level2')}${f('street', t('street'), 'text', 'street-address')}</div>
        ${f('apt', t('apt'), 'text', 'off', false)}
        <details class="co-notes"><summary>${T('הוספת הערה לשליח', 'Add a note for the courier')}</summary><textarea class="input" id="notes" name="notes" rows="2" maxlength="300"></textarea></details>
        <p class="co-eta">${T('משלוח עד הבית תוך 7-10 ימים', 'Home delivery in 7–10 days')}${left ? '' : html` · <b>${T('חינם', 'free')}</b>`}</p></section>
      ${tt.pointsAvail >= 100 ? html`<label class="co-pts"><input type="checkbox" data-input="use-points" ${raw(db.usingPoints() ? 'checked' : '')}><span><b>${T(`יש לכם ${tt.pointsAvail} נקודות`, `You have ${tt.pointsAvail} points`)}</b>${T('לממש אותן בהזמנה הזאת (כל 100 נקודות = 10 ₪)', 'Use them on this order (100 points = ₪10)')}</span></label>` : u && u.role !== 'wholesale' ? html`<p class="co-pts-earn">${T(`על ההזמנה הזאת תצברו ${Math.floor(tt.total - tt.shipping)} נקודות`, `This order earns ${Math.floor(tt.total - tt.shipping)} points`)}</p>` : ''}
      <section class="co-box"><h2><span>3</span>${t('payment')}</h2><p class="muted">${t('payNote')}</p>
        <label class="check"><input type="checkbox" name="agree" required aria-describedby="agree-e"><span>${t('agree')}<a href="#/terms" target="_blank" rel="noopener noreferrer">${t('terms')}</a>${t('and')}<a href="#/privacy" target="_blank" rel="noopener noreferrer">${t('privacy')}</a></span></label>
        <span class="err" id="agree-e" aria-live="polite"></span>
        <button class="btn block co-go" type="submit"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>${t('placeOrder')} · ${m(tt.total)}</button>
        <p class="secure-note">${t('secure')}</p>${TRUST()}</section>
    </form>
    <aside class="summary co-sum" aria-label="${t('cart')}"><h2>${T('ההזמנה שלכם', 'Your order')}</h2>${tt.lines.map((l) => html`<div class="mini"><div class="line-media">${media(l.p)}<em>${l.qty}</em></div><div>${L(l.p.name)}<br><small class="muted">${l.size === 'יחידה' || l.size === 'מארז' ? '' : l.size}${l.opt ? html` ${l.opt}` : ''}</small></div><b>${m(l.price * l.qty)}</b></div>`)}<hr>${totalsBlock(tt)}
      <a class="co-help" href="${waLink(T('שלום, יש לי שאלה לגבי ההזמנה', 'Hi, I have a question about my order'))}" target="_blank" rel="noopener noreferrer">${T('שאלה לפני שמזמינים? כתבו לנו בוואטסאפ', 'A question first? WhatsApp us')}</a></aside>
  </div></div></div>`;
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
  const customer = { name: clean(d.name, 80), phone: normPhone(d.phone), email: clean(d.email, 120), city: clean(d.city, 60), street: clean(d.street, 120), apt: clean(d.apt, 40), notes: clean(d.notes, 300) };
  return db.placeOrder(customer);
}

export function orderDone(o) {
  return html`<div class="wrap od" tabindex="-1" id="done"><span class="od-ok" aria-hidden="true">✓</span><h1>${T('תודה על ההזמנה!', 'Thank you for your order!')}</h1>
    <p class="od-sub">${T('ההזמנה התקבלה. את פרטי ההזמנה והעדכונים תוכלו למצוא באזור האישי.', 'Your order was received. Details and updates are in your account.')}</p>
    <div class="od-card"><div class="od-row"><span>${t('orderNum')}</span><b dir="ltr">#${o.num}</b></div><div class="od-row"><span>${T('סטטוס', 'Status')}</span><b>${T('התקבלה', 'Received')}</b></div>
      <ul class="od-items">${o.items.map((x) => html`<li><span>${L(x.name)}${x.size && x.size !== 'יחידה' && x.size !== 'מארז' ? ` · ${x.size}` : ''}${x.opt ? ` · ${x.opt}` : ''} × ${x.qty}</span><b>${m(x.price * x.qty)}</b></li>`)}</ul>
      <div class="od-row tot"><span>${t('total')}</span><b>${m(o.total)}</b></div>
      <p class="od-addr">${o.customer.name} · ${o.customer.street}, ${o.customer.city}</p></div>
    <div class="od-cta"><a class="btn" href="#/account">${T('ההזמנות שלי', 'My orders')}</a><a class="btn ghost" href="#/">${T('חזרה לדף הבית', 'Back home')}</a></div>
    <p class="od-help"><a href="${waLink(T(`שלום, הגעתי דרך אתר SAY BOUTIQUE ויש לי שאלה על הזמנה #${o.num}`, `Hi, a question about order #${o.num}`))}" target="_blank" rel="noopener noreferrer">${T('שאלה על ההזמנה? כתבו לנו בוואטסאפ', 'Question? WhatsApp us')}</a></p></div><div class="block"></div>`;
}

export function account(tab = 'login', aud = 'retail') {
  const u = db.me();
  if (u) {
    const mine = db.orders().filter((o) => o.userId === u.id);
    const staff = { admin: '#/admin', products: '#/admin/products', orders: '#/orders', courier: '#/courier' }[u.role];
    return html`<div class="wrap legal"><p class="eyebrow">${t('clubMember')}</p><h1>${t('hello')}, ${u.name}</h1>
      ${u.firstOrderDiscount && u.role === 'customer' ? html`<p class="note-gold">${t('tick3')}</p>` : ''}
      ${u.role === 'customer' ? html`<div class="acc-pts"><span>✨</span><p><b>${db.pointsOf(u)} ${T('נקודות מועדון', 'club points')}</b>${T(`שווים ${m(Math.floor(db.pointsOf(u) / 100) * 10)} בהזמנה הבאה · כל ₪1 = נקודה, כל 100 נקודות = 10 ₪`, `Worth ${m(Math.floor(db.pointsOf(u) / 100) * 10)} on your next order`)}</p></div>` : ''}
      ${staff ? html`<p><a class="btn gold" href="${staff}">${t('backoffice')}</a></p>` : ''}
      <h2>${t('myOrders')}</h2>
      ${mine.length ? html`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>${getLang() === 'he' ? 'תאריך' : 'Date'}</th><th>${t('total')}</th><th>${getLang() === 'he' ? 'סטטוס' : 'Status'}</th></tr></thead><tbody>
        ${mine.map((o) => html`<tr><td>${o.num}</td><td>${new Date(o.date).toLocaleDateString(getLang())}</td><td>${m(o.total)}</td><td><span class="pill st-${o.status}">${statusLabel(o.status)}</span></td></tr>`)}</tbody></table></div>` : html`<p class="muted">${t('noOrders')}</p>`}
      <p><button class="btn ghost" data-action="logout">${t('logout')}</button></p></div>`;
  }
  const isLogin = tab === 'login';
  return html`<div class="auth-page"><div class="auth glass">
    <h1 class="auth-h">${T('כניסת לקוחות', 'Customer sign-in')}</h1>
    <p class="auth-sub">${T('חברי מועדון: התחברו כדי לראות הזמנות והטבות. הצטרפות חינם עם 15% הנחה לקנייה הראשונה.', 'Club members: sign in for orders and perks. Free to join, 15% off your first order.')}</p>
    <div class="tabs" role="tablist"><button role="tab" aria-selected="${isLogin}" data-action="auth-tab" data-tab="login">${t('login')}</button><button role="tab" aria-selected="${!isLogin}" data-action="auth-tab" data-tab="register">${t('register')}</button></div>
    <form data-form="${isLogin ? 'login' : 'register'}" novalidate>
      ${isLogin ? '' : html`<div class="field"><label for="r-name">${t('fullName')} *</label><input class="input" id="r-name" name="name" autocomplete="name" required maxlength="80"></div>
        
        <div class="field"><label for="r-phone">${t('phone')} *</label><input class="input" id="r-phone" name="phone" type="tel" autocomplete="tel" required maxlength="20"></div>`}
      <div class="field"><label for="a-email">${isLogin ? T('אימייל או שם משתמש', 'Email or username') : t('email')} *</label><input class="input" id="a-email" name="email" type="${isLogin ? 'text' : 'email'}" autocomplete="${isLogin ? 'username' : 'email'}" autocapitalize="none" spellcheck="false" required maxlength="120"></div>
      <div class="field"><label for="a-pass">${t('password')} *</label><input class="input" id="a-pass" name="password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required minlength="${isLogin ? 1 : 8}" maxlength="128" aria-describedby="a-pass-h"><small id="a-pass-h" class="muted">${isLogin ? '' : t('badPass')}</small></div>
      ${isLogin ? '' : html`
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
    if (kind === 'login' || kind === 'staff-login') {
      if (!String(d.email).trim() || !d.password) throw new Error('fail');
      await db.login(d.email, d.password);
      const role = db.me()?.role;

    } else {
      if (!valid.name(d.name)) throw new Error('name');
      if (!valid.phone(d.phone)) throw new Error('phone');
      if (!valid.email(d.email)) throw new Error('email');
      if (!valid.password(d.password)) throw new Error('pass');
      if (!d.agree) throw new Error('agree');
      await db.register({ name: clean(d.name, 80), phone: normPhone(d.phone), email: clean(d.email, 120), password: d.password, wholesale: !!d.wholesale, biz: clean(d.biz, 80), newsletter: !!d.newsletter });
    }
    return true;
  } catch (e) {
    err.textContent = { 'not-ws': T('החשבון הזה הוא חשבון לקוח פרטי. אם ביקשתם חשבון סיטונאי — הוא ממתין לאישור.', 'This is a retail account. Wholesale requests await approval.'), 'use-staff': T('זהו חשבון צוות — היכנסו דרך "כניסת צוות".', 'This is a staff account — use Staff sign-in.'), 'use-customer': T('זהו חשבון לקוח — היכנסו דרך "כניסת לקוחות".', 'This is a customer account — use Customer sign-in.'), fail: t('loginFail'), locked: t('locked'), exists: t('exists'), name: t('fullName') + ': ' + t('required'), phone: t('badPhone'), email: t('badEmail'), pass: t('badPass'), biz: t('bizName') + ': ' + t('required'), agree: t('mustAgree') }[e.message] || t('loginFail');
    return false;
  }
}

export function contact() {
  const topics = [
    [T('ייעוץ בבחירת ריח', 'Choosing a scent'), T('לא בטוחים איזה ניחוח מתאים לבית, למשרד או לעסק? ספרו לנו על החלל ונמליץ.', 'Tell us about your space and we will recommend a scent.'), T('שלום, אשמח להמלצה על ניחוח', 'Hello, I would like a scent recommendation')],
    [T('התאמת מכשיר לחלל', 'Matching a device'), T('גודל החלל, תקרה, מיזוג — נעזור לבחור את המפיץ הנכון ואת עוצמת הפיזור.', 'Room size, ceiling, A/C — we will help you pick the right diffuser.'), T('שלום, אשמח לעזרה בבחירת מפיץ ריח', 'Hello, I need help choosing a diffuser')],
    [T('הזמנה קיימת', 'An existing order'), T('מעקב משלוח, שינוי כתובת או כל שאלה על הזמנה. ציינו את מספר ההזמנה.', 'Tracking, address changes or any order question — include your order number.'), T('שלום, יש לי שאלה לגבי הזמנה מספר ', 'Hello, I have a question about order #')],
    [T('לעסקים וסיטונאים', 'Business & wholesale'), T('מלונות, משרדים, חנויות וספא — מחירון סיטונאי, מיתוג וליווי אישי.', 'Hotels, offices, shops and spas — wholesale pricing and branding.'), T('שלום, אשמח לפרטים על רכישה לעסק', 'Hello, I would like details for a business purchase')],
  ];
  return html`<div class="contact-page">
    <header class="shop-head wrap"><nav class="crumbs" aria-label="${T('מיקום בעמוד', 'Breadcrumb')}"><a href="#/">${t('home')}</a><span aria-hidden="true">/</span>${t('contact')}</nav>
      <h1>${T('נשמח לדבר איתכם', 'Let’s talk')}</h1>
      <p class="lead">${T('אנחנו זמינים בוואטסאפ לכל שאלה — מבחירת הניחוח הראשון ועד הזמנה לעסק.', 'We are on WhatsApp for anything — from your first scent to a business order.')}</p></header>
    <div class="wrap">
      <div class="topics">${topics.map(([h, p, msg]) => html`<a class="topic" href="${waLink(msg)}" target="_blank" rel="noopener noreferrer"><b>${h}</b><p>${p}</p><span class="u-link">${T('לשיחה בוואטסאפ', 'Chat on WhatsApp')} <span aria-hidden="true">${he() ? '←' : '→'}</span></span></a>`)}</div>
      <p class="contact-cta"><a class="btn" href="${waLink(T('שלום SAY Boutique, אשמח לעזרה', 'Hello SAY Boutique'))}" target="_blank" rel="noopener noreferrer">${T('פתיחת שיחה בוואטסאפ', 'Open WhatsApp chat')}</a></p>
    </div></div><div class="block"></div>`;
}

export function about() {
  return html`<div class="wrap"><section class="block story"><div class="story-art" aria-hidden="true"><img src="assets/img/logo-full.png" alt="" width="360" height="478"></div>
  <div><p class="eyebrow">${t('storyEyebrow')}</p><h1>${t('storyTitle')}</h1><span class="rule"></span><p>${t('storyText')}</p><a class="btn" href="#/shop">${t('shopNow')}</a></div></section></div>${clubBlock()}`;
}

export function wholesalePage() {
  const banners = db.SITE.site?.subBanners || {};
  const P = 'assets/products/';
  const gal = [
    [P + 'hero-1.webp', T('עמדת קבלה במלון', 'Hotel reception')], [P + 'say-400-5.webp', T('עמוד ריח ללובי', 'Lobby scent tower')],
    [P + 'hero-3.webp', T('תצוגה בחנות', 'In-store display')], [P + 'say-300-3.webp', T('מכשיר לחלל גדול', 'Large-space unit')],
    [P + 'say-100-12.webp', T('פינת המתנה', 'Waiting corner')], [P + 'say-room-office-11.webp', T('משרד וחדר ישיבות', 'Office & boardroom')],
    [P + 'hero-0.webp', T('ספא וחדר טיפולים', 'Spa & treatment room')], [P + 'say-400-0.webp', T('סטנד עומד בכניסה', 'Entrance stand')],
  ];
  const seg = [
    [T('מלונות וצימרים', 'Hotels & B&Bs'), T('האורח זוכר את הריח עוד לפני החדר.', 'Guests remember the scent before the room.'), banners['בתי מלון ויוקרה']],
    [T('חנויות ורשתות', 'Shops & chains'), T('לקוח שנעים לו — נשאר יותר זמן.', 'Comfortable shoppers stay longer.'), banners['חנויות ורשתות מובילות']],
    [T('קליניקות וספא', 'Clinics & spas'), T('רוגע מתחיל כבר בדלת.', 'Calm starts at the door.'), banners['טבע וספא']],
    [T('משרדים', 'Offices'), T('צוות רענן, פגישות נעימות.', 'Fresh team, pleasant meetings.'), banners['ניקיון ורעננות']],
  ];
  const steps = [
    [T('מדברים', 'We talk'), T('הודעה קצרה בוואטסאפ: איזה עסק, כמה מטרים, איזו אווירה.', 'A quick WhatsApp: business type, size, vibe.')],
    [T('מריחים', 'You sniff'), T('שולחים לכם דוגמיות — בוחרים את הריח שיהיה החתימה שלכם.', 'We send samples — pick your signature scent.')],
    [T('מתקינים', 'We install'), T('מגיעים, מתקינים את הסטנד ומכוונים עוצמה ושעות.', 'We arrive, install and tune intensity and hours.')],
    [T('נהנים', 'You enjoy'), T('ממלאים תמציות במחיר סיטונאי — ואנחנו זמינים תמיד.', 'Refills at wholesale prices — we are always here.')],
  ];
  return html`<div class="ws-page">
  <header class="wsx">
    <div class="wsx-in wrap">
      <div class="wsx-copy">
        <p class="wsx-k">${T('SAY לעסקים', 'SAY for business')}</p>
        <h1>${T('הרושם הראשון', 'The first impression')}<br><em>${T('מתחיל באוויר.', 'is in the air.')}</em></h1>
        <p class="wsx-lead">${T('לקוחות שוכחים מה אמרתם להם, אבל זוכרים איך הרגישו אצלכם. ריח חתימה הופך כניסה רגילה לחוויה של מלון יוקרה — ואנחנו דואגים לכל השאר.', 'Customers forget what you said, but remember how they felt. A signature scent turns an ordinary entrance into a luxury-hotel moment — we handle the rest.')}</p>
        <div class="wsx-cta">
          <a class="wsx-btn" href="${waLink()}" target="_blank" rel="noopener noreferrer">${T('לקבלת הצעה בוואטסאפ', 'Get a quote on WhatsApp')}</a>
          <a class="wsx-link" href="#/wholesale" data-action="gd-jump" data-t="ws-gal">${T('ראו סטנדים בשטח', 'See stands in action')}</a>
        </div>
        <p class="wsx-note2">${T('שיחה קצרה, בלי התחייבות. אתם מריחים קודם — מחליטים אחר כך.', 'A short chat, no commitment. You smell first, decide later.')}</p>
        <ul class="wsx-facts">
          <li><b>${T('התקנה', 'Installed')}</b><span>${T('אצלכם בעסק', 'at your place')}</span></li>
          <li><b>${T('דוגמיות', 'Samples')}</b><span>${T('לפני שמחליטים', 'before you decide')}</span></li>
          <li><b>${T('עד 5 ליטר', 'Up to 5 L')}</b><span>${T('מילוי במחיר סיטונאי', 'wholesale refills')}</span></li>
        </ul>
      </div>
      <figure class="wsx-art"><img src="${P}hero-1.webp" alt="${T('מפיצי SAY בעמדת קבלה', 'SAY diffusers at a reception desk')}" width="1400" height="1000"></figure>
    </div>
  </header>
  <section class="wrap ws-sec" id="ws-gal"><p class="kicker">${T('סטנדים בשטח', 'Stands in action')}</p><h2>${T('ככה זה נראה אצלכם', 'How it looks at your place')}</h2>
    <div class="ws-gallery">${gal.map(([src, cap]) => html`<figure><img src="${src}" alt="${cap}" loading="lazy"><figcaption>${cap}</figcaption></figure>`)}</div></section>
  <section class="wrap ws-sec"><h2>${T('ארבעה צעדים, אפס כאב ראש', 'Four steps, zero hassle')}</h2>
    <ol class="ws-steps">${steps.map(([h, d], i) => html`<li><span>${i + 1}</span><b>${h}</b><p>${d}</p></li>`)}</ol></section>
  <section class="wrap ws-sec"><h2>${T('למי זה מתאים', 'Who it is for')}</h2>
    <div class="ws-seg">${seg.map(([h, d, img]) => html`<div class="ws-card">${img ? html`<span class="ws-img"><img src="${small(img)}" alt="" loading="lazy" width="320" height="240"></span>` : ''}<b>${h}</b><p>${d}</p></div>`)}</div></section>
  <section class="wrap ws-cta"><h2>${T('איזה ריח יהיה החתימה של העסק שלכם?', 'What will your signature scent be?')}</h2><p>${T('הודעה אחת — ואנחנו לוקחים את זה מכאן.', 'One message — we take it from there.')}</p>
    <a class="btn wa-btn" href="${waLink()}" target="_blank" rel="noopener noreferrer">WhatsApp · ${PHONE_DISPLAY}</a></section>
  </div><div class="block"></div>`;
}

export function rentalPage() {
  const P = 'assets/products/';
  const wa = waLink(T('שלום, אשמח לפרטים על השכרת מפיץ ריח לעסק', 'Hi, I would like details about diffuser rental'));
  const who = [['חנויות', 'Shops', 'לקוח שנעים לו — נשאר יותר.', 'Comfortable shoppers stay longer.', P + 'hero-3.webp'], ['מסעדות ובתי קפה', 'Restaurants & cafés', 'אווירה נקייה מהרגע שנכנסים.', 'A clean feel from the door.', P + 'sub-bakery-sweets.webp'], ['בניינים ולובאים', 'Buildings & lobbies', 'כניסה שמריחה כמו מלון.', 'An entrance that smells like a hotel.', P + 'sub-hotels-luxury.webp'], ['משרדים', 'Offices', 'צוות רענן, פגישות נעימות.', 'Fresh team, nicer meetings.', P + 'say-room-office-11.webp']];
  const steps = [['נפגשים ומריחים', 'We visit and sniff', 'מגיעים לעסק, מודדים את החלל ומביאים דוגמיות.', 'We measure your space and bring samples.'], ['מתקינים', 'We install', 'טכנאי מתקין את המכשיר על הקיר ומכוון עוצמה ושעות.', 'A technician mounts and tunes the device.'], ['מגיעים כל חודש', 'We come monthly', 'ביקור קבוע עם ריח חדש ומפתיע, מילוי ותחזוקה מלאה — בלי שתצטרכו לזכור כלום.', 'A regular visit with a new scent, refill and full maintenance.']];
  return html`<div class="rt">
  <header class="rt-hero">
    <div class="rt-copy">
      <p class="rt-k">${T('מסלול שירות חודשי לעסקים', 'Monthly scent service for business')}</p>
      <h1>${T('לקוחות לא זוכרים', 'Customers forget')}<br>${T('מה הם קנו.', 'what they bought.')}<br><em>${T('הם זוכרים איך הרגיש.', 'They remember how it felt.')}</em></h1>
      <p class="rt-lead">${T('חבילה חודשית שמותאמת לעסק שלכם: אנחנו מגיעים פעם בחודש עם ריח חדש ומפתיע, המכשיר עלינו — כולל תחזוקה מלאה. אתם רק נהנים מהמחמאות.', 'A monthly package tailored to your business: we visit once a month with a new scent, the device is on us — full maintenance included. You just enjoy the compliments.')}</p>
      <div class="rt-cta"><a class="rt-btn" href="${wa}" target="_blank" rel="noopener noreferrer">${T('לתיאום ביקור והרחה', 'Book a scent visit')}</a><span>${T('בלי התחייבות · בלי לקנות מכשיר', 'No commitment · no device to buy')}</span></div>
    </div>
    <div class="rt-art"><figure><img src="${P}say-400-5.webp" alt="" width="1200" height="1200"></figure>
      <p class="rt-tag"><b>${T('ביקור אחת לחודש', 'A visit every month')}</b>${T('ריח חדש · מכשיר · תחזוקה מלאה', 'New scent · device · full maintenance')}</p></div>
  </header>

  <section class="rt-vs wrap"><h2>${T('לקנות לבד או מסלול חודשי?', 'Buy alone or a monthly plan?')}</h2>
    <div class="rt-cmp">
      <div><h3>${T('קונים לבד', 'Buying alone')}</h3><ul><li>${T('הוצאה גדולה מראש', 'A big upfront cost')}</li><li>${T('צריך לזכור למלא', 'You must remember refills')}</li><li>${T('תקלה? מסתדרים לבד', 'A fault? You sort it out')}</li></ul></div>
      <div class="on"><h3>${T('מסלול השירות של SAY', 'The SAY service plan')}</h3><ul><li>${T('תשלום חודשי קבוע וידוע', 'A fixed, known monthly fee')}</li><li>${T('ביקור חודשי עם ריח חדש', 'A monthly visit with a new scent')}</li><li>${T('תקלה? מחליפים מכשיר', 'A fault? We swap the device')}</li></ul></div>
    </div></section>

  <section class="rt-who wrap"><h2>${T('איפה זה עובד הכי טוב', 'Where it works best')}</h2>
    <div class="rt-wgrid">${who.map(([h, e, d, de, img]) => html`<a class="rt-w" href="${wa}" target="_blank" rel="noopener noreferrer"><img src="${small(img)}" alt="" loading="lazy" width="600" height="600"><span><b>${T(h, e)}</b>${T(d, de)}</span></a>`)}</div></section>

  <section class="rt-steps wrap"><h2>${T('שלושה צעדים. אחר כך זה פשוט עובד.', 'Three steps. Then it just works.')}</h2>
    <ol>${steps.map(([h, e, d, de], i) => html`<li><span>${i + 1}</span><b>${T(h, e)}</b><p>${T(d, de)}</p></li>`)}</ol></section>

  <section class="rt-end"><div class="wrap"><h2>${T('איזה ריח יקבל את הלקוחות שלכם מחר בבוקר?', 'Which scent will greet your customers tomorrow?')}</h2>
    <a class="rt-btn light" href="${wa}" target="_blank" rel="noopener noreferrer">${T('בואו נדבר בוואטסאפ', 'Chat on WhatsApp')}</a><p>${PHONE_DISPLAY}</p></div></section>
  </div>`;
}

const stars = (n) => html`<span class="stars" aria-label="${n} ${T('מתוך 5', 'of 5')}">${[1, 2, 3, 4, 5].map((i) => html`<i class="${i <= n ? 'on' : ''}">★</i>`)}</span>`;
export function reviewsPage() {
  const list = db.approvedReviews();
  const avg = list.length ? (list.reduce((a, r) => a + r.rating, 0) / list.length) : 0;
  return html`<div class="rv">
  <header class="rv-hero wrap"><p class="rt-k">${T('לקוחות ממליצים', 'Customer reviews')}</p>
    <h1>${T('הבית שלהם כבר מריח כמו מלון.', 'Their homes already smell like a hotel.')}</h1>
    ${list.length ? html`<p class="rv-avg">${stars(Math.round(avg))}<b>${avg.toFixed(1)}</b> ${T(`מתוך ${list.length} ביקורות`, `from ${list.length} reviews`)}</p>` : html`<p class="rv-sub">${T('כאן יופיעו החוויות של הלקוחות שלנו. קניתם אצלנו? נשמח לשמוע איך הריח מרגיש אצלכם.', 'Customer experiences will appear here. Bought from us? We would love to hear how it feels at home.')}</p>`}
  </header>
  <div class="wrap">
    ${list.length ? html`<div class="rv-grid">${list.map((r) => html`<figure class="rv-card">${stars(r.rating)}<blockquote>${r.text}</blockquote><figcaption><span class="rv-av" aria-hidden="true">${(r.name || '?').trim()[0]}</span><b>${r.name}</b>${r.city ? html`<small>${r.city}</small>` : ''}</figcaption></figure>`)}</div>` : ''}
    <section class="rv-form-box"><h2>${T('ספרו לנו על החוויה שלכם', 'Tell us about your experience')}</h2>
      <form data-form="review" novalidate class="rv-form">
        <fieldset class="rv-rate"><legend>${T('איך היה?', 'How was it?')}</legend>${[5, 4, 3, 2, 1].map((n) => html`<input type="radio" id="rv${n}" name="rating" value="${n}"><label for="rv${n}" title="${n}">★</label>`)}</fieldset>
        <div class="row2"><div class="field"><label for="rv-name">${T('שם', 'Name')}</label><input class="input" id="rv-name" name="name" maxlength="60" autocomplete="name"></div>
        <div class="field"><label for="rv-city">${T('עיר', 'City')} <small>${T('(רשות)', '(optional)')}</small></label><input class="input" id="rv-city" name="city" maxlength="40"></div></div>
        <div class="field"><label for="rv-text">${T('מה הכי אהבתם?', 'What did you love most?')}</label><textarea class="input" id="rv-text" name="text" rows="4" maxlength="600"></textarea></div>
        <p class="err" id="rv-err" role="alert"></p>
        <button class="btn" type="submit">${T('שליחת ביקורת', 'Send review')}</button>
      </form></section>
  </div></div><div class="block"></div>`;
}

// Checkout: a device without an oil to fill it.
export const needsOil = () => { const ls = db.cartTotals().lines; return ls.some((l) => l.p.cat === 'diffusers') && !ls.some((l) => l.p.cat === 'oils' || l.p.picks || /1l|5x100|kit/.test(l.p.id)); };
export function oilNudge(ctx = 'checkout') {
  const pick = ['oil-king-david', 'oil-hilton', 'oil-white-tea'].map((id) => db.product(id)).filter((p) => p && p.active !== false);
  const kit = db.product('kit-14');
  const sz = (p) => p.sizes.find((x) => x.label === '100 מ"ל') || p.sizes[0];
  return html`<div class="modal-bg on-bg"><div class="oln" role="dialog" aria-modal="true" aria-labelledby="on-t">
    <button class="on-x" data-action="modal-close" aria-label="${t('close')}">×</button>
    <p class="c3-k">${ctx === 'add' ? T('נוסף לסל ✓ · מוצר משלים', 'Added ✓ · goes well with') : T('רגע לפני שמסיימים', 'One moment')}</p>
    <h2 id="on-t">${T('המכשיר מגיע בלי תמצית', 'The device comes without oil')}</h2>
    <p class="on-sub">${T('כדי שתוכלו להפעיל אותו כבר ביום שהחבילה מגיעה — הוסיפו שמן למילוי:', 'So you can use it the day it arrives — add an oil:')}</p>
    <div class="on-list">${pick.map((p) => html`<div class="on-it"><span class="on-img">${media(p, '', false, p.img)}</span><span class="on-t"><b>${L(p.name)}</b><small>${sz(p).label} · ${m(sz(p).price)}</small></span><button class="on-add" data-action="oil-add" data-id="${p.id}" data-size="${sz(p).label}">${T('הוספה', 'Add')} +</button></div>`)}
      ${kit ? html`<div class="on-it kit"><span class="on-img">${media(kit, '', false, kit.img)}</span><span class="on-t"><b>${T('לא בטוחים איזה ריח?', 'Not sure which scent?')}</b><small>${T('ערכת 14 ריחות', '14-scent kit')} · ${m(minPrice(kit))}</small></span><a class="on-add" href="#/product/${kit.id}" data-action="modal-close">${T('לבחירה', 'Choose')}</a></div>` : ''}</div>
    <button class="on-skip" data-action="${ctx === 'add' ? 'oil-later' : 'oil-skip'}">${ctx === 'add' ? T('אולי אחר כך — להמשיך לקנות', 'Maybe later — keep shopping') : T('להמשיך בלי תמצית', 'Continue without oil')}</button>
  </div></div>`;
}
