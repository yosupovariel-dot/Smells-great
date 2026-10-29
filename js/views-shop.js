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
// Display names drop the sheet's marketing tail ("ערכות התנסות – מומלץ…" → "ערכות התנסות").
export const subName = (s) => (he() ? s : db.SITE.site?.subEn?.[s] || s).split(/\s[–-]\s(?!\d)/)[0];
const active = () => db.products().filter((p) => p.active !== false);
const minPrice = (p, ws) => Math.min(...p.sizes.map((s) => (ws && s.wholesale ? s.wholesale : s.price)));
// Customer-facing WhatsApp links open an empty chat (no pre-written message).
const waLink = () => `https://wa.me/${PHONE_INTL}`;

export function priceTag(p) {
  if (p.quote) return html`<span class="price">${T('מחיר בהתאמה אישית', 'Price on request')}</span>`;
  const ws = db.me()?.role === 'wholesale';
  const from = p.sizes.length > 1 ? T('החל מ־', 'From ') : '';
  return html`<span class="price">${from}${m(minPrice(p, ws))}${ws ? html`<s>${m(minPrice(p, false))}</s>` : ''}</span>`;
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
  return html`<article class="card label ${FAMILY_TONE[p.sub] || ''}">
    <a class="lbl" href="#/product/${p.id}">
      <span class="lbl-fam latin">${(FAMILY_EN_SHORT[p.sub] || '').toUpperCase()}</span>
      <span class="lbl-arch">${media(p, 'm1', false, p.img)}${p.pack ? media(p, 'm2', false, p.pack) : ''}</span>
      <span class="lbl-name">${L(p.name)}</span>
      <span class="lbl-sub">${subName(p.sub)}</span>
      <span class="lbl-rule" aria-hidden="true"></span>
      <span class="lbl-price">${priceTag(p)}</span>
    </a>
    <a class="card-add" href="#/product/${p.id}" aria-label="${T('לבחירת גודל', 'Choose a size')}: ${L(p.name)}">${plus}</a>
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

export function card(p, opts = {}) {
  if (opts.feature) return featureCard(p);
  if (p.cat === 'oils' && p.pack) return labelCard(p);
  const { main, alt, studio } = cardImgs(p);
  const direct = !(p.quote || p.picks || p.options?.length || p.sizes.length > 1);
  return html`<article class="card ${studio ? 'studio' : 'photo'}">
    <a class="card-media" href="#/product/${p.id}" tabindex="-1" aria-hidden="true">
      ${media(p, 'm1', false, main)}${alt ? media(p, 'm2', false, alt) : ''}
    </a>
    ${p.tag ? html`<span class="card-tag">${t('tag_' + p.tag)}</span>` : ''}
    ${p.quote ? '' : direct
      ? html`<button class="card-add" data-action="quick-add" data-id="${p.id}" aria-label="${t('quickAdd')}: ${L(p.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>`
      : html`<a class="card-add" href="#/product/${p.id}" aria-label="${T('לבחירת אפשרויות', 'Choose options')}: ${L(p.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></a>`}
    <div class="card-body">
      <h3><a href="#/product/${p.id}">${L(p.name)}</a></h3>
      <small>${p.sub ? subName(p.sub) : catName(p.cat)}${p.sizes.length > 1 ? html` · ${p.sizes.length} ${T('גדלים', 'sizes')}` : ''}${p.options?.[0] ? html` · ${p.options[0].values.length} ${T('צבעים', 'colours')}` : ''}</small>
      ${priceTag(p)}
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

export function home() {
  const all = active();
  const hero = (db.SITE.site?.hero || []).slice(0, 4);
  const promo = db.SITE.site?.hero?.[4];
  const banners = db.SITE.site?.subBanners || {};
  const diff = all.filter((p) => p.cat === 'diffusers' && !p.quote);
  const kit = all.find((p) => p.picks === 14);
  const families = Object.keys(banners).map((f) => ({ f, img: banners[f], n: all.filter((p) => p.sub === f).length })).filter((x) => x.n);
  return html`
  <section class="h-hero" aria-labelledby="hero-t">
    <div class="h-slides" role="region" aria-roledescription="carousel" aria-label="${T('מוצרים נבחרים', 'Featured')}">
      ${hero.map((src, i) => html`<figure class="slide ${i ? '' : 'on'}"><img src="${src}" alt="${HERO_SLIDES[i]?.[getLang()] || 'SAY Boutique'}" width="2000" height="968" ${raw(i ? 'loading="lazy"' : 'fetchpriority="high"')} decoding="async"></figure>`)}
    </div>
    <div class="h-hero-copy">
      <p class="kicker latin">Luxury Home Fragrances</p>
      <h1 id="hero-t"><span>${t('heroTitle1')}</span> <em>${t('heroTitle2')}</em></h1>
      <p class="h-hero-lead">${T('מפיצי ריח ותמציות שמן ברמת בתי המלון — במחיר של יבואן, עד הבית.', 'Hotel-grade diffusers and fragrance oils — at importer prices, to your door.')}</p>
      <nav class="h-cats2" aria-label="${t('categories')}"><p>${T('הקטגוריות שלנו', 'Our categories')}</p><div>${CATEGORIES.map((c) => { const n = all.filter((p) => p.cat === c.id).length; return html`<a href="#/shop/${c.id}" class="${n ? '' : 'soon'}"><span class="hc-img ${c.id === 'diffusers' ? 'studio' : ''}">${c.img ? html`<img src="${small(c.img)}" alt="" width="64" height="64">` : html`<img src="assets/img/mark.webp" alt="" width="64" height="56">`}</span>${L(c)}${n ? '' : html`<small>${T('בקרוב', 'soon')}</small>`}</a>`; })}</div></nav>
      <div class="h-hero-cta"><a class="btn" href="#/shop/diffusers">${T('לקולקציה', 'Explore')}</a><a class="u-link" href="#/finder">${T('מציאת הריח שלי', 'Find my scent')} <span aria-hidden="true">${arrow()}</span></a></div>
      ${hero.length ? html`<div class="h-count latin" aria-hidden="true"><b id="slide-n">01</b><span class="h-progress">${hero.map((_, i) => html`<i class="${i ? '' : 'on'}"></i>`)}</span><span>0${hero.length}</span></div>
      <div class="sr-only">${hero.map((_, i) => html`<button data-action="slide" data-i="${i}" aria-label="${T('שקופית', 'Slide')} ${i + 1}" aria-current="${i === 0}"></button>`)}</div>` : ''}
    </div>
    ${hero.length ? html`<a class="h-tag" id="slide-cap" href="#/product/${HERO_SLIDES[0].pid}">${HERO_SLIDES[0][getLang()]}</a>` : ''}
    <a class="seal" href="#/about" aria-label="${t('about')}">
      ${sealSVG('SAY BOUTIQUE · LUXURY HOME FRAGRANCES · ')}
      <img src="assets/img/mark.webp" alt="" width="90" height="78">
    </a>
  </section>

  <section class="h-collection" aria-labelledby="col-t"><div class="wrap">
    <header class="h-head"><h2 id="col-t">${T('המכשירים', 'The devices')}</h2><a class="u-link" href="#/shop/diffusers">${T('כל המפיצים', 'All diffusers')} <span aria-hidden="true">${arrow()}</span></a></header>
    <div class="h-col-grid">
      ${(() => { const f = db.product('say-300'); return f ? html`<a class="h-feature reveal" href="#/product/say-300"><span class="h-feature-arch">${media(f, '', false, f.img, true)}</span>
        <span class="h-feature-t"><b>SAY 300</b><small>${T('לחללים של עד 300 מ"ר · Wi-Fi ובלוטות׳', 'Up to 300 m² · Wi-Fi & Bluetooth')}</small>${priceTag(f)}</span></a>` : ''; })()}
      <div class="h-col-list reveal">${diff.filter((p) => p.id !== 'say-300').slice(0, 4).map((p) => html`<a class="h-item" href="#/product/${p.id}">
        <span class="h-item-img">${media(p, '', false, p.pack || p.img)}</span><span class="h-item-t"><b>${L(p.name)}</b><small>${subName(p.sub)}</small></span><span class="h-item-p">${m(minPrice(p))}</span></a>`)}</div>
    </div>
  </div></section>

  <section class="h-quiz" aria-labelledby="qz-t"><div class="wrap">
    <header class="qz-head"><p class="kicker latin">Scent finder</p><h2 id="qz-t">${T('איפה הריח שלכם יחיה?', 'Where will your scent live?')}</h2>
      <p>${T('בחרו חלל — ובעוד שתי שאלות קצרות תקבלו המלצה אישית למכשיר ולניחוחות.', 'Pick a space — two more quick questions and you get a personal match.')}</p>
      <ol class="qz-steps" aria-label="${T('שלבים', 'Steps')}"><li class="on">${T('חלל', 'Space')}</li><li>${T('תחושה', 'Feeling')}</li><li>${T('עוצמה', 'Strength')}</li></ol></header>
    <div class="qz-opts">${FINDER.space.map(([k, he_, en, pid, sHe, sEn]) => { const p = db.product(pid); return html`<button class="qz-opt" data-action="fq-start" data-v="${k}"><span class="qz-img">${p ? media(p, '', false, p.pack || p.img) : ''}</span><b>${T(he_, en)}</b><small>${T(sHe, sEn)}</small><span class="qz-go" aria-hidden="true">${he() ? '←' : '→'}</span></button>`; })}</div>
    <p class="qz-foot">${T('לוקח פחות מדקה · בלי הרשמה · אפשר לשנות בכל שלב', 'Under a minute · no sign-up · change anytime')}</p>
  </div></section>

  ${families.length ? html`<section class="h-library" aria-labelledby="lib-t"><div class="wrap">
    <header class="h-head"><h2 id="lib-t">${T('ספריית הניחוחות', 'The scent library')}</h2><a class="u-link" href="#/shop/oils">${T('כל התמציות', 'All oils')} <span aria-hidden="true">${arrow()}</span></a></header>
    <div class="h-lib">
      <ol class="h-lib-list">${families.map((x, i) => html`<li><a href="#/shop/oils/${encodeURIComponent(x.f)}" data-fam-img="${x.img}" class="${i ? '' : 'on'}">
        <span class="latin idx">${FAMILY_EN[x.f] || ''}</span><b>${subName(x.f)}</b><small>${x.n} ${T('ניחוחות', 'scents')}</small></a></li>`)}</ol>
      <figure class="h-lib-view" aria-hidden="true"><img id="fam-preview" src="${families[0].img}" alt="" loading="lazy" width="1600" height="700"></figure>
    </div>
  </div></section>` : ''}

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
    <div class="h-kit-copy reveal"><p class="kicker latin">Discovery</p><h2 id="kit-t">${T('ארבעה־עשר ניחוחות.', 'Fourteen scents.')}<br>${T('קופסה אחת.', 'One box.')}</h2>
      <p>${T('הדרך הנכונה להתחיל. בוחרים 14 תמציות של 10 מ"ל, מנסים במפיץ, ומגלים איזה ריח מרגיש כמו בית.', 'The right way to begin. Choose fourteen 10 ml oils, try them in your diffuser, and find the one that feels like home.')}</p>
      <p class="h-kit-price">${m(kit.sizes[0].price)}</p>
      <a class="btn" href="#/product/${kit.id}">${T('לבחירת הניחוחות', 'Choose your scents')}</a></div>
  </div></section>` : ''}

  ${promo ? html`<a class="h-promo reveal" href="#/shop/bundles"><img src="${promo}" alt="${T('חבילת ה-Luxury שלנו', 'Our Luxury bundle')}" loading="lazy" width="2000" height="968"></a>` : ''}

  <section class="h-service" aria-label="${T('שירות', 'Service')}"><div class="wrap">
    <div><b>${T('משלוח חינם', 'Free delivery')}</b><p>${T('בכל הזמנה מעל 299₪, עד הבית בתוך 3–5 ימי עסקים.', 'On orders over ₪299, at your door in 3–5 business days.')}</p></div>
    <div><b>${T('שנת אחריות', 'One-year warranty')}</b><p>${T('אחריות יבואן מלאה על כל מכשירי הבישום.', 'Full importer warranty on every device.')}</p></div>
    <div><b>${T('ליווי אישי', 'Personal advice')}</b><p>${T('לא בטוחים מה מתאים לחלל שלכם? כתבו לנו ונמליץ.', 'Not sure what suits your space? Message us.')} <a href="${waLink(T('שלום, אשמח להמלצה', 'Hello, I would like a recommendation'))}" target="_blank" rel="noopener noreferrer">WhatsApp</a></p></div>
    <div><b>${T('לעסקים', 'For business')}</b><p>${T('מחירון סיטונאי למלונות, משרדים וחנויות.', 'Wholesale pricing for hotels, offices and shops.')} <a href="#/wholesale">${T('לפרטים', 'Details')}</a></p></div>
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
const sortBar = (q, sort, n) => html`<div class="toolbar">
  <p class="count" aria-live="polite"><b>${n}</b> ${t('results')}</p>
  <div class="tools-r">
    <label class="search-f"><span class="sr-only">${t('search')}</span><input id="q" type="search" value="${q}" placeholder="${t('search')}" data-input="search" maxlength="60"></label>
    <label class="sort-f"><span>${t('sortBy')}</span><select id="sort" data-input="sort">
      ${[['pop', 'sortPop'], ['low', 'sortLow'], ['high', 'sortHigh'], ['name', 'sortName']].map(([v, k]) => html`<option value="${v}" ${raw(sort === v ? 'selected' : '')}>${t(k)}</option>`)}
    </select></label>
  </div></div>`;
const catTabs = (cat) => html`<nav class="cat-pills" aria-label="${t('categories')}">
  <a href="#/shop" aria-current="${!cat}">${t('all')}</a>
  ${CATEGORIES.map((x) => { const n = active().filter((p) => p.cat === x.id).length; return html`<a href="#/shop/${x.id}" aria-current="${cat === x.id}">${L(x)}${n ? html`<small>${n}</small>` : html`<small class="soon">${T('בקרוב', 'soon')}</small>`}</a>`; })}
</nav>`;

export function shop(cat, q = '', sort = 'pop', sub = '') {
  let list = active();
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
      <header class="sp-head wrap"><div class="sp-head-t">${crumbs}<p class="kicker latin">The collection</p><h1>${T('החנות', 'The shop')}</h1>
        <p class="lead">${T('מכשירי בישום, תמציות שמן ומארזים — הכל במחירי יבואן, עם משלוח חינם מעל 299₪.', 'Diffusers, fragrance oils and bundles — importer prices, free delivery over ₪299.')}</p></div>
        <div class="sp-cats">${cats.map((x) => html`<a href="#/shop/${x.id}" class="sp-cat"><span class="sp-cat-img ${x.id === 'diffusers' ? 'studio' : ''}"><img src="${small(x.img)}" alt="" width="320" height="400" loading="lazy"></span><b>${L(x)}</b><small>${active().filter((p) => p.cat === x.id).length} ${T('מוצרים', 'items')}</small></a>`)}</div>
      </header>
      <div class="wrap">${catTabs('')}
        ${cats.map((x) => { const items = active().filter((p) => p.cat === x.id); return html`<section class="rail-sec" aria-labelledby="r-${x.id}">
          <header class="rail-h"><div><h2 id="r-${x.id}">${L(x)}</h2><p>${T(...(CAT_LEAD[x.id] || ['', '']))}</p></div><a class="u-link" href="#/shop/${x.id}">${T('לכל ה', 'All ')}${L(x)} (${items.length}) <span aria-hidden="true">${he() ? '←' : '→'}</span></a></header>
          <div class="rail">${items.slice(0, 8).map((p) => card(p))}</div></section>`; })}
      </div></div><div class="block"></div>`;
  }

  const subs = (db.SITE.subs?.[c?.he] || []).filter((s2) => active().some((p) => p.sub === s2));
  const soon = c && !active().some((p) => p.cat === cat);
  const heroImg = sub ? subImg(cat, sub) : c?.img;
  const title = sub ? subName(sub) : cat ? catName(cat) : T('תוצאות חיפוש', 'Search results');
  return html`<div class="shop-page">
    <header class="sp-head cat wrap">
      <div class="sp-head-t">${crumbs}<p class="kicker latin">${cat ? (CATEGORIES.find((x) => x.id === cat)?.en || '') : 'Search'}</p><h1>${title}</h1>
        ${c && !soon ? html`<p class="lead">${T(...(CAT_LEAD[cat] || [c.descHe, c.descEn]))}</p>` : ''}</div>
      ${heroImg ? html`<figure class="sp-arch ${cat === 'diffusers' && !sub ? 'studio' : ''}"><img src="${heroImg}" alt="" width="900" height="1100" fetchpriority="high"></figure>` : html`<figure class="sp-arch empty"><img src="assets/img/mark.webp" alt="" width="180" height="156"></figure>`}
    </header>
    <div class="wrap">
      ${catTabs(cat)}
      ${subs.length > 1 ? html`<nav class="stories" aria-label="${T('תת־קטגוריות', 'Subcategories')}">
        <a href="#/shop/${cat}" aria-current="${!sub}"><span class="st-img all">${T('הכל', 'All')}</span><b>${T('הכל', 'All')}</b></a>
        ${subs.map((s2) => html`<a href="#/shop/${cat}/${encodeURIComponent(s2)}" aria-current="${s2 === sub}"><span class="st-img ${cat === 'diffusers' ? 'studio' : ''}"><img src="${small(subImg(cat, s2))}" alt="" width="160" height="160" loading="lazy"></span><b>${subName(s2)}</b></a>`)}
      </nav>` : ''}
      ${soon ? html`<div class="soon-box"><p class="eyebrow latin">Coming soon</p><h2>${T('הקולקציה תעלה בקרוב', 'The collection is coming soon')}</h2><p>${T('אנחנו מכינים עבורכם קולקציה חדשה. רוצים לשמוע ראשונים או להזמין כבר עכשיו?', 'A new collection is on its way. Want to hear first or order now?')}</p><a class="btn" href="${waLink()}" target="_blank" rel="noopener noreferrer">${T('לפרטים בוואטסאפ', 'Ask on WhatsApp')}</a></div>` : html`
      ${sortBar(q, sort, list.length)}
      ${list.length ? html`<div class="grid shop-grid">${list.map((p) => card(p, { feature: !q && !sub && (p.picks || p.id === 'say-300') }))}</div>` : html`<p class="empty">${t('noResults')}</p>`}`}
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
    // A short line with no sentence-ending period is a heading (the sheet's emoji markers are stripped).
    if ((/^\p{Extended_Pictographic}/u.test(line) || !/[.:]$/.test(line)) && line.length < 70 && !m2) { flush(); out.push(html`<h3 class="rt-h">${line}</h3>`); }
    else if (m2) list.push(html`<li><b>${m2[1]}:</b> ${m2[2]}</li>`);
    else { flush(); out.push(html`<p>${line}</p>`); }
  }
  flush(); return out;
}

// Price per ml and saving vs the smallest size — an honest comparison, computed from the real prices.
const ml = (label) => { const n = parseFloat(String(label).replace(/[^\d.]/g, '')); if (!n) return 0; return /ליטר|l\b/i.test(label) ? n * 1000 : n; };
function perUnit(p, s, priceOf) {
  const base = p.sizes.find((x) => ml(x.label)); const v = ml(s.label);
  if (!base || !v || s === base) return { save: 0 };
  const save = Math.round((1 - priceOf(s) / v / (priceOf(base) / ml(base.label))) * 100);
  return { save: save >= 5 ? save : 0 };
}

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
      <div class="pdp-media ${p.fit === 'contain' ? 'contain' : 'photo'}" data-zoom>${media(p, '', true, gallery[0], true)}</div>
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
          ${p.sizes.map((s, i) => { const v = perUnit(p, s, priceOf); return html`<label class="size-opt"><input type="radio" name="size" value="${s.label}" ${raw(i ? '' : 'checked')} data-input="size" data-price="${priceOf(s)}"><span>${s.label}${v.save ? html`<em>−${v.save}%</em>` : ''}</span></label>`; })}
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
      ${p.cat === 'oils' && p.sizes.length > 2 ? html`<p class="unit-note">${T('ככל שהבקבוק גדול יותר — המחיר למ"ל נמוך יותר. האחוז מציין את החיסכון לעומת 10 מ"ל.', 'Bigger bottles cost less per ml — the % shows the saving vs 10 ml.')}</p>` : ''}
      <ul class="trust" aria-label="${T('ההבטחה שלנו', 'Our promise')}"><li><b>${T('14 יום', '14 days')}</b><span>${T('להחזרה', 'to return')}</span></li><li><b>${p.cat === 'diffusers' ? T('שנה', '1 year') : T('3–5 ימים', '3–5 days')}</b><span>${p.cat === 'diffusers' ? T('אחריות יבואן', 'warranty') : T('עד הבית', 'delivery')}</span></li><li><b>SSL</b><span>${T('תשלום מאובטח', 'secure payment')}</span></li></ul>
      <ul class="perks"><li>${t('perk1')}</li><li>${t('perk2')}</li>${p.cat === 'diffusers' ? html`<li>${T('שנת אחריות יבואן', '1-year importer warranty')}</li><li><a href="#/guide">${T('מדריך שימוש ותחזוקה', 'Use & care guide')}</a></li>` : html`<li>${t('perk3')}</li>`}</ul>
    </div>
  </div>
  ${p.specs?.length ? html`<section class="specs" aria-labelledby="spec-t"><h2 id="spec-t">${T('מפרט טכני', 'Specifications')}</h2><table class="spec-tbl"><tbody>${p.specs.map(([k, v]) => html`<tr><th scope="row">${k}</th><td>${v}</td></tr>`)}</tbody></table></section>` : ''}
  ${!p.quote ? html`<section class="rich" aria-label="${T('תיאור המוצר', 'Product description')}">${he() || !p.desc.en ? richText(p.desc.he) : richText(p.desc.en)}</section>` : ''}
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
export function searchResults(q, popular = ['קינג דיוד', 'SAY 150', 'ערכת התנסות', 'וניל', 'בלו שאנל', 'SAY Car']) {
  const n = norm(q);
  if (!n) return html`<p class="so-label">${T('חיפושים פופולריים', 'Popular searches')}</p>
    <div class="so-chips">${popular.map((p) => html`<button type="button" data-action="search-term" data-q="${p}">${p}</button>`)}</div>
    <p class="so-label">${t('categories')}</p>
    <div class="so-cats">${CATEGORIES.filter((c) => c.img).map((c) => html`<a href="#/shop/${c.id}"><img src="${small(c.img)}" alt="" loading="lazy" width="320" height="240"><span>${L(c)}</span></a>`)}</div>`;
  const words = n.split(' ');
  const hay = (p) => norm(`${p.name.he} ${p.name.en} ${p.sub || ''} ${catName(p.cat)} ${(p.options?.[0]?.values || []).map((v) => v.he).join(' ')}`);
  const res = active().filter((p) => words.every((w) => hay(p).includes(w)))
    .sort((a, b) => (norm(L(b.name)).startsWith(n) ? 1 : 0) - (norm(L(a.name)).startsWith(n) ? 1 : 0));
  if (!res.length) return html`<p class="so-empty">${T('לא מצאנו תוצאות עבור', 'No results for')} “${q}”. ${T('נסו מילה אחרת, או', 'Try another word, or')} <a href="#/contact">${T('דברו איתנו', 'talk to us')}</a>.</p>`;
  return html`<p class="so-label">${res.length} ${T('תוצאות', 'results')}</p>
    <div class="so-grid">${res.slice(0, 12).map((p) => html`<a class="so-item" href="#/product/${p.id}"><span class="so-img ${p.fit === 'contain' ? 'contain' : ''}">${media(p)}</span>
      <span class="so-t"><small>${p.sub ? subName(p.sub) : catName(p.cat)}</small><b>${L(p.name)}</b>${priceTag(p)}</span></a>`)}</div>
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
  if (step === 1) body = html`${head(T('איפה הריח יחיה?', 'Where will the scent live?'), T('נתאים מכשיר לגודל החלל.', 'We will match a device to your space.'))}
    <div class="fd-opts five">${FINDER.space.map(([k, he_, en, pid, sHe, sEn]) => { const p = db.product(pid); return html`<button class="fd-opt studio" data-action="fq" data-k="space" data-v="${k}">${p ? media(p, '', false, p.pack || p.img) : ''}<b>${T(he_, en)}</b><small>${T(sHe, sEn)}</small></button>`; })}</div>`;
  else if (step === 2) body = html`${head(T('איזו תחושה אתם מחפשים?', 'What feeling are you after?'), T('בחרו את מה שהכי מדבר אליכם — אין תשובה לא נכונה.', 'Pick what speaks to you — there is no wrong answer.'))}
    <div class="fd-opts">${FINDER.mood.map(([k, he_, en]) => html`<button class="fd-opt photo" data-action="fq" data-k="mood" data-v="${k}">${banners[k] ? html`<img src="${small(banners[k])}" alt="" loading="lazy" width="640" height="300">` : ''}<b>${T(he_, en)}</b><small>${subName(k)}</small></button>`)}</div>`;
  else if (step === 3) body = html`${head(T('כמה נוכח שיהיה הריח?', 'How present should it be?'), T('את העוצמה אפשר תמיד לכוונן במכשיר.', 'You can always fine-tune the intensity.'))}
    <div class="fd-opts three">${FINDER.power.map(([k, he_, en], i) => html`<button class="fd-opt text" data-action="fq" data-k="power" data-v="${k}"><span class="fd-dots" aria-hidden="true">${[0, 1, 2].map((d) => html`<i class="${d <= i ? 'on' : ''}"></i>`)}</span><b>${T(he_, en)}</b></button>`)}</div>`;
  else {
    const sp = FINDER.space.find((x) => x[0] === f.space); const dev = db.product(sp[3]);
    const scents = active().filter((p) => p.sub === f.mood).slice(0, 3);
    const kit = db.product('kit-14');
    const tip = { soft: T('הפעלה של 10–15 שניות כל כמה דקות מספיקה לנוכחות עדינה.', 'Short bursts every few minutes give a subtle presence.'), mid: T('תזמנו עבודה בשעות שאתם בבית — ככה הריח נשאר רציף בלי בזבוז.', 'Schedule it for the hours you are home.'), strong: T('לריח חתימה, מקמו את המכשיר בגובה 1.2–1.5 מטר, הרחק מחלונות פתוחים.', 'For a signature scent, place it 1.2–1.5 m high, away from open windows.') }[f.power];
    body = html`<header class="fd-head"><p class="kicker latin">Your SAY ritual</p><h1>${T('ההתאמה שלכם', 'Your match')}</h1><p class="lead">${T('על סמך התשובות שלכם — זה השילוב שהיינו ממליצים עליו לחבר קרוב.', 'Based on your answers — the pairing we would recommend to a close friend.')}</p></header>
      <div class="fd-result">
        ${dev ? html`<a class="fd-dev studio" href="#/product/${dev.id}"><span class="fd-dev-img">${media(dev, '', false, dev.pack || dev.img)}</span><span><small>${T('המכשיר שלכם', 'Your device')}</small><b>${L(dev.name)}</b><em>${sp[T(4, 5)]}</em>${priceTag(dev)}</span></a>` : ''}
        <div class="fd-scents"><small>${T('הניחוחות שלכם', 'Your scents')} · ${subName(f.mood)}</small><div class="grid three">${scents.map(card)}</div></div>
      </div>
      <p class="fd-tip"><b>${T('טיפ:', 'Tip:')}</b> ${tip}</p>
      <div class="hero-cta">${kit ? html`<a class="btn" href="#/product/${kit.id}">${T('לא בטוחים? התחילו מערכת התנסות', 'Not sure? Start with a discovery kit')} · ${m(kit.sizes[0].price)}</a>` : ''}<button class="btn link" data-action="fq-reset">${T('להתחיל מחדש', 'Start over')}</button></div>`;
  }
  return html`<section class="finder wrap" aria-live="polite">${back}${body}</section><div class="block"></div>`;
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
  return html`<header><h2 id="cart-t">${t('cart')}</h2><button class="icon-btn" data-action="cart-close" aria-label="${t('close')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button></header>
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
      <p class="secure-note">${t('secure')}</p>
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
  const wa = waLink();
  return html`<div class="wrap legal" tabindex="-1" id="done"><p class="eyebrow">SAY Boutique</p><h1>${t('orderOk')}</h1><p>${t('orderNum')}: <b>#${o.num}</b></p><p>${t('orderOkText')}</p>
  <div class="hero-cta"><a class="btn" href="#/shop">${t('continueShop')}</a><a class="btn ghost" href="${wa}" target="_blank" rel="noopener noreferrer">${t('whatsapp')}</a></div></div>`;
}

export function account(tab = 'login') {
  const u = db.me();
  if (u) {
    const mine = db.orders().filter((o) => o.userId === u.id);
    const staff = { admin: '#/admin', orders: '#/orders', courier: '#/courier' }[u.role];
    return html`<div class="wrap legal"><p class="eyebrow">${t('clubMember')}</p><h1>${t('hello')}, ${u.name}</h1>
      ${u.wsRequest && u.role === 'customer' ? html`<p class="muted">${t('wsPending')}</p>` : ''}
      ${u.firstOrderDiscount && u.role === 'customer' ? html`<p class="note-gold">${t('tick3')}</p>` : ''}
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
  return html`<div class="wrap"><section class="block story"><div class="story-art" aria-hidden="true"><img src="assets/img/logo.webp" alt="" width="290" height="450"></div>
  <div><p class="eyebrow">${t('storyEyebrow')}</p><h1>${t('storyTitle')}</h1><span class="rule"></span><p>${t('storyText')}</p><a class="btn" href="#/shop">${t('shopNow')}</a></div></section></div>${clubBlock()}`;
}

export function wholesalePage() {
  return html`<div class="wrap legal"><p class="eyebrow latin">B2B</p><h1>${t('wsTitle')}</h1><span class="rule"></span><p>${t('wsText')}</p>
  <ul class="perks"><li>${getLang() === 'he' ? 'מחירון סיטונאי ייעודי באתר' : 'Dedicated wholesale price list'}</li><li>${getLang() === 'he' ? 'אריזות גדולות 500ml–5L' : 'Bulk sizes 500ml–5L'}</li><li>${getLang() === 'he' ? 'ליווי אישי ומיתוג לעסקים' : 'Personal account manager & branding'}</li></ul>
  <div class="hero-cta"><a class="btn" href="#/account/register">${t('wsCta')}</a><a class="btn ghost" href="${waLink()}" target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div>`;
}
