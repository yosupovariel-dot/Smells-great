// Import products from the Google Sheet (CSV export) + images folder into data/products.json.
// Usage:
//   1. Sheet: File → Download → CSV  → save as tools/products.csv
//   2. Drive folder: Download → unzip into tools/images/
//   3. node tools/import-products.mjs tools/products.csv tools/images
// Expected columns (Hebrew or English headers, any order):
//   שם מוצר|name, שם באנגלית|name_en, קטגוריה|category, גודל|size, מחיר|price,
//   מחיר סיטונאי|wholesale, עלות|cost, תיאור|description, תמונה|image, מלאי|stock
// Rows with the same product name become one product with several sizes.
// Images are matched by the "image" column, else by fuzzy filename ≈ product name, then optimised to WebP (needs: npm i sharp).
import fs from 'node:fs'; import path from 'node:path';
const [csvPath = 'tools/products.csv', imgDir = 'tools/images'] = process.argv.slice(2);
const CATS = { diffusers: ['מפיץ', 'מפיצי ריח', 'diffuser'], oils: ['תמצית', 'שמן', 'oil'], perfumes: ['בושם', 'בשמים', 'perfume', 'spray'], hair: ['שיער', 'hair'], sticks: ['מקלות', 'reed', 'stick'], candles: ['נר', 'candle'] };
function parseCSV(t) { const rows = []; let r = [], c = '', q = false; for (let i = 0; i < t.length; i++) { const ch = t[i];
  if (q) { if (ch === '"' && t[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; }
  else if (ch === '"') q = true; else if (ch === ',') { r.push(c); c = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(c); rows.push(r); r = []; c = ''; } else c += ch; }
  if (c || r.length) { r.push(c); rows.push(r); } return rows.filter((x) => x.some((y) => y.trim())); }
const H = { name: ['שם מוצר', 'שם', 'מוצר', 'name'], name_en: ['שם באנגלית', 'name_en', 'english'], cat: ['קטגוריה', 'category'], size: ['גודל', 'נפח', 'size'], price: ['מחיר', 'מחיר לצרכן', 'price'], wholesale: ['מחיר סיטונאי', 'סיטונאי', 'wholesale'], cost: ['עלות', 'cost'], desc: ['תיאור', 'description'], img: ['תמונה', 'image'], stock: ['מלאי', 'stock'] };
const rows = parseCSV(fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, ''));
const head = rows.shift().map((h) => h.trim().toLowerCase());
const col = Object.fromEntries(Object.entries(H).map(([k, names]) => [k, head.findIndex((h) => names.some((n) => h === n.toLowerCase()))]));
if (col.wholesale === col.price) col.wholesale = head.findIndex((h) => h.includes('סיטונ'));
const num = (s) => +String(s || '').replace(/[^\d.]/g, '') || 0;
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w֐-׿]+/g, '-').replace(/^-|-$/g, '');
const guessCat = (s) => Object.entries(CATS).find(([, ws]) => ws.some((w) => s.toLowerCase().includes(w)))?.[0] || 'oils';
const imgs = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter((f) => /\.(jpe?g|png|webp|heic)$/i.test(f)) : [];
const map = new Map();
for (const r of rows) {
  const g = (k) => (col[k] >= 0 ? (r[col[k]] || '').trim() : '');
  const name = g('name'); if (!name) continue;
  let p = map.get(name);
  if (!p) { p = { id: slug(g('name_en') || name).slice(0, 40) || 'p' + map.size, cat: guessCat(g('cat') + ' ' + name), name: { he: name, en: g('name_en') || name }, desc: { he: g('desc'), en: '' }, notes: [], sizes: [], img: '', imgSrc: g('img'), active: true, stock: num(g('stock')) || 20 }; map.set(name, p); }
  p.sizes.push({ label: g('size') || 'יחידה', price: num(g('price')), wholesale: num(g('wholesale')), cost: num(g('cost')) });
}
const norm = (s) => s.toLowerCase().replace(/\.[a-z]+$/, '').replace(/[\s_\-]+/g, '');
let sharp; try { sharp = (await import('sharp')).default; } catch { console.warn('! sharp not installed — copying images without optimisation'); }
fs.mkdirSync('assets/products', { recursive: true });
for (const p of map.values()) {
  const f = imgs.find((x) => p.imgSrc && norm(x) === norm(p.imgSrc)) || imgs.find((x) => norm(x).includes(norm(p.name.he)) || norm(x).includes(norm(p.name.en)) || norm(p.name.he).includes(norm(x)));
  if (f) {
    const out = `assets/products/${p.id}.webp`;
    if (sharp) await sharp(path.join(imgDir, f)).rotate().resize(1200, 1500, { fit: 'cover' }).webp({ quality: 84 }).toFile(out);
    else fs.copyFileSync(path.join(imgDir, f), out.replace('.webp', path.extname(f)));
    p.img = sharp ? out : out.replace('.webp', path.extname(f));
  } else console.warn('! no image for', p.name.he);
  delete p.imgSrc;
}
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/products.json', JSON.stringify([...map.values()], null, 2));
console.log(`✓ ${map.size} products → data/products.json`);
