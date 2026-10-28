#!/usr/bin/env python3
"""Build the SAY Boutique catalog from the Google Sheet + Google Drive folder.

  python3 tools/build_catalog.py            # downloads sheet + images, writes data/products.json and assets/
  python3 tools/build_catalog.py --cache DIR  # reuse an already-downloaded raw image folder

Re-run any time the sheet or the Drive folder changes. Requires Pillow (pip install pillow).
Prices for oil sizes come from OIL_PRICES below (the sheet gives a 10–999 range only) — edit there or in the admin.
"""
import csv, io, json, os, re, sys, html, urllib.request, concurrent.futures as cf
from PIL import Image

SHEET = '1bOHrF7RKlaNBBmm5G6NySvvmjQ5VspyUBwNGCqrXxt0'
GID = '461439708'
DRIVE_ROOT = '1LT4tJKeuQwIDzq-6rPZmNLS-2qu-sPs3'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_IMG = os.path.join(ROOT, 'assets', 'products')
OUT_SITE = os.path.join(ROOT, 'assets', 'img')

OIL_PRICES = [  # label, price, wholesale, estimated cost
    ('10 מ"ל', 19, 13, 6), ('30 מ"ל', 39, 27, 12), ('100 מ"ל', 89, 62, 28), ('250 מ"ל', 179, 125, 55),
    ('500 מ"ל', 299, 210, 95), ('1 ליטר', 499, 350, 160), ('5 ליטר', 999, 720, 380),
]
SUB_EN = {
    'לחדרים וחללים קטנים - עד 30 מ"ר': 'Small rooms — up to 30 m²', 'לבית וחללים בינונים - עד 150 מ"ר': 'Homes — up to 150 m²',
    'לעסקים וחללים גדולים - מעל 150 מ"ר': 'Business — over 150 m²', '⭐ ערכות התנסות – מומלץ ללקוחות חדשים!': '⭐ Discovery kits',
    '🏨 בתי מלון ויוקרה': '🏨 Hotels & luxury', '🛍️ חנויות ורשתות מובילות': '🛍️ Leading stores', '🔮 השראת בשמים יוקרתיים': '🔮 Fine-fragrance inspired',
    '🌿 טבע וספא': '🌿 Nature & spa', '⚜️ ניחוחות קלאסיים': '⚜️ Classics', '🧼 ניקיון ורעננות': '🧼 Clean & fresh', '🥐 מאפים ומתוקים': '🥐 Bakery & sweets',
}
EN = {'בראשית': 'Bereshit', "רויאל ביץ'": 'Royal Beach', 'פתאל': 'Fattal', 'כרמים': 'Kramim', 'לאונרדו בוטיק': 'Leonardo Boutique', "לקצ'ורי הוטל": 'Luxury Hotel',
      'יערות הכרמל': 'Carmel Forest', 'ריזורט': 'Resort', 'קינג דיוד': 'King David', 'הילטון': 'Hilton', 'מלכת שבא': 'Queen of Sheba', 'רנואר': 'Renuar',
      'דלתא': 'Delta', 'נאוטיקה': 'Nautica', 'גאנט': 'Gant', 'קסטרו': 'Castro', 'מאניה': 'Mania', 'פקטורי': 'Factory', 'SAY boutique': 'SAY Boutique Signature',
      'בוס': 'Boss', 'קלווין קליין': 'Calvin Klein', 'טומי': 'Tommy', 'בלו שאנל': 'Bleu Chanel', 'קריד': 'Creed', 'אברקומבי': 'Abercrombie', 'טום פורד': 'Tom Ford',
      'בקארט': 'Baccarat', 'פאקו ראבן': 'Paco Rabanne', 'תומס קוסמאלה': 'Thomas Kosmala', 'אל חרמין': 'Al Haramain', 'סקסי 212': '212 Sexy', 'קוקו שאנל': 'Coco Chanel',
      "דיור סוובאג'": 'Dior Sauvage', 'דיור ספורט': 'Dior Sport', 'ספא': 'Spa', 'תה ירוק': 'Green Tea', 'תה לבן': 'White Tea', 'למון-גראס': 'Lemongrass', 'מנטה': 'Mint',
      'לבנדר': 'Lavender', 'נרקיס': 'Narcissus', 'רויאל אמבר': 'Royal Amber', 'טיים רוז': 'Time Rose', 'גולדן': 'Golden', "וינטג'": 'Vintage', "גרנד הריטג'": 'Grand Heritage',
      'תותי פרוטי': 'Tutti Frutti', 'וניל טהור': 'Pure Vanilla', 'קפה וניל': 'Vanilla Coffee', 'בריזת ים': 'Sea Breeze', 'כותנה רכה': 'Soft Cotton', 'זנזיבר': 'Zanzibar',
      'באבלס': 'Bubbles', 'פיור ריין': 'Pure Rain'}
ALIAS = {'לאונרדו בוטיק': 'לאונרדו', 'בלו שאנל': 'בלו דה שאנל', 'אברקומבי': 'אמברקובי', 'בקארט': 'בקארט 540', 'קוקו שאנל': 'COCO שאנל', "דיור סוובאג'": 'דיור סוואג',
         'למון-גראס': 'למון גראס', 'מנטה': 'מנטה מרענן', 'לבנדר': 'לבנדר טהור', "גרנד הריטג'": "גראנד הריטאג'", 'תותי פרוטי': 'Tutti Frutti', 'וניל טהור': 'Pure Vanilla',
         'קפה וניל': 'Vanilla Coffee', 'באבלס': 'בועות סבון', 'פיור ריין': 'Pure Rain'}
SUB_FOLDER = {'🏨 בתי מלון ויוקרה': 'מלונות ויוקרה', '🛍️ חנויות ורשתות מובילות': 'חנויות ורשתות מובילות', '🔮 השראת בשמים יוקרתיים': 'השראת בשמים מובילים',
              '🌿 טבע וספא': 'טבע וספא', '⚜️ ניחוחות קלאסיים': 'ניחוחות קלאסיים', '🧼 ניקיון ורעננות': 'ניקיון ורעננות', '🥐 מאפים ומתוקים': 'מאפים ומתוקים'}
SUB_BANNER = {'🏨 בתי מלון ויוקרה': 'מלונות ויוקרה קטגוריה ראשית 1', '🛍️ חנויות ורשתות מובילות': 'חנויות ורשתות מובילות קטגוריה ראשית',
              '🔮 השראת בשמים יוקרתיים': 'השראת בשמים מובילים 1', '🌿 טבע וספא': 'טבע וספא  קטגוריה ראשית', '⚜️ ניחוחות קלאסיים': 'ניחוחות קלאסיים קטגוריה ראשית',
              '🧼 ניקיון ורעננות': 'ניקיון ורעננות קטגוריה ראשית 2', '🥐 מאפים ומתוקים': 'מאפים ומתוקים קטגוריה ראשית 2'}
SUB_BLURB = {
    '🏨 בתי מלון ויוקרה': ('הניחוח שפוגש אתכם בלובי — עכשיו אצלכם בבית. תמצית בהשראת {n}, לחוויית בית מלון יוקרתית בכל יום.', 'The scent that greets you in the lobby, now at home. Inspired by {n}.'),
    '🛍️ חנויות ורשתות מובילות': ('הריח המוכר מהחנות שאתם אוהבים — תמצית בהשראת {n}, שמביאה את חוויית הקנייה הביתה.', 'The familiar in-store scent, inspired by {n}.'),
    '🔮 השראת בשמים יוקרתיים': ('תמצית שמן בהשראת הבושם האייקוני {n} — הופכת את החלל כולו לניחוח חתימה יוקרתי.', 'Inspired by the iconic {n} — turn your space into a signature scent.'),
    '🌿 טבע וספא': ('ניחוח {n} נקי ומרגיע, להרגשה של ספא פרטי בבית, בקליניקה או בחדר השינה.', 'Clean, calming {n} for a private-spa feeling.'),
    '⚜️ ניחוחות קלאסיים': ('{n} — ניחוח קלאסי, עשיר ועל-זמני שמתאים לכל חלל ולכל עונה.', '{n} — a rich, timeless classic.'),
    '🧼 ניקיון ורעננות': ('{n} — ניחוח נקי ורענן של בית מסודר וכביסה טרייה.', '{n} — the fresh scent of a clean home.'),
    '🥐 מאפים ומתוקים': ('{n} — ניחוח מתוק, חם ומפנק שעוטף את הבית באווירה ביתית.', '{n} — warm, sweet and comforting.'),
}
OIL_TIP = ('💡 טיפ מהמומחים שלנו: הריח בבקבוק אינו הריח בחלל. התמצית "נפתחת" כשהיא מתפזרת באוויר — '
           'הוסיפו כמה טיפות למפיץ הריח וגלו את עומק התווים האמיתי.\n\nתמצית שמן טהורה ומרוכזת, מיועדת למפיצי ריח חשמליים בטכנולוגיית אידוי קר. אין להוסיף מים.')

# Diffusers: folder, id, en name, primary-image rules per color
DIFF = {
    'SAY room & office': ('say-room-office', 'SAY Room & Office', {'לבן': r'白色', 'שחור': r'^Rad0(-\d)?\.jpg$'}),
    'SAY car': ('say-car', 'SAY Car', {'ברונזה': [1, 7, 10, 13, 16, 19], 'לבן': [2, 8, 11, 14, 17, 20], 'שחור': [0, 6, 9, 12, 15, 18]}),
    'SAY 100': ('say-100', 'SAY 100', {'לבן': r'白色|לוגו', 'אפור': r'灰色'}),
    'SAY 150': ('say-150', 'SAY 150', {'לבן': [0, 2, 3], 'שחור': [1, 4, 3]}),
    'SAY 300': ('say-300', 'SAY 300', {'לבן': [1, 3, 5, 7, 10], 'שחור': [0, 2, 4, 6, 8, 9, 11]}),
    'SAY 400': ('say-400', 'SAY 400', {}),
}
COLOR_EN = {'לבן': 'White', 'שחור': 'Black', 'ברונזה': 'Bronze', 'אפור': 'Grey'}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read()


def drive_ls(fid):
    h = get('https://drive.google.com/drive/folders/' + fid).decode('utf8')
    out = []
    for p in re.split(r'<tr data-selectable data-id="', h)[1:]:
        i = p[:p.find('"')]
        m = re.search(r'data-tooltip="([^"]+)"', p) or re.search(r'aria-label="([^"]+)"', p)
        n = html.unescape(m.group(1)) if m else '?'
        out.append((i, n))
    return out


def drive_walk(fid, path, acc):
    for i, n in drive_ls(fid):
        clean = re.sub(r'\s+(Shared folder|Image|Video|PDF)$', '', n).strip()
        if n.endswith('Shared folder') or n.endswith('folder'):
            drive_walk(i, path + [clean], acc)
        else:
            acc.append((i, path, clean))


def download_drive(cache):
    acc = []
    drive_walk(DRIVE_ROOT, [], acc)
    want = ('SAY ', 'תמציות שמן', 'תמונות רקע', 'תמונות לקטגוריות', 'תמונות לקרוסלה', 'מארזים')
    todo = [x for x in acc if x[1] and x[1][0].startswith(want) and re.search(r'\.(jpe?g|png|webp)$', x[2], re.I)]

    def dl(x):
        d = os.path.join(cache, *x[1]); os.makedirs(d, exist_ok=True); f = os.path.join(d, x[2])
        if not os.path.exists(f):
            open(f, 'wb').write(get('https://drive.google.com/uc?export=download&id=' + x[0]))
    with cf.ThreadPoolExecutor(8) as ex:
        list(ex.map(dl, todo))


norm = lambda s: re.sub(r"[\s'\"׳״\-_.()]", '', s).lower()


def find(folder, name):
    if not os.path.isdir(folder): return None
    fs = sorted(os.listdir(folder))
    for f in fs:
        if norm(os.path.splitext(f)[0]) == norm(name): return os.path.join(folder, f)
    for f in fs:
        if norm(name) and norm(name) in norm(f): return os.path.join(folder, f)
    return None


written = {}
def save(src, name, box=1400, q=82):
    if src in written: return written[src]
    im = Image.open(src)
    im = im.convert('RGBA') if im.mode in ('P', 'LA') else im
    if im.mode == 'RGBA':
        bg = Image.new('RGB', im.size, 'white'); bg.paste(im, mask=im.split()[3]); im = bg
    im = im.convert('RGB'); im.thumbnail((box, box), Image.LANCZOS)
    rel = f'assets/products/{name}.webp'
    im.save(os.path.join(ROOT, rel), 'WEBP', quality=q, method=6)
    sm = im.copy(); sm.thumbnail((640, 640), Image.LANCZOS)  # card/gallery size, see media() srcset
    sm.save(os.path.join(ROOT, rel.replace('.webp', '-sm.webp')), 'WEBP', quality=76, method=6)
    written[src] = rel
    return rel


def slug(s):
    s = EN.get(s.strip(), s)
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-') or 'p'


def specs_and_body(text):
    """Split the sheet description into a spec table + marketing body."""
    specs, body, mode = [], [], 'spec'
    for line in [l.strip() for l in text.splitlines()]:
        if not line: continue
        if line.startswith('🖤') or line.startswith('🎁') or line.startswith('מארז'): mode = 'body'
        if mode == 'spec':
            m = re.match(r'^([^:：]{2,30})[:：]\s*(.+)$', line)
            if m and not re.match(r'^[^\w\u0590-\u05ff]', m.group(1)): specs.append([m.group(1).strip(), m.group(2).strip()])
        else:
            body.append(line)
    if not specs: body = [l.strip() for l in text.splitlines() if l.strip()]
    return specs, '\n'.join(body)


def main():
    cache = sys.argv[sys.argv.index('--cache') + 1] if '--cache' in sys.argv else os.path.join(ROOT, 'tools', '.cache')
    os.makedirs(OUT_IMG, exist_ok=True)
    if '--cache' not in sys.argv: download_drive(cache)
    rows = list(csv.reader(io.StringIO(get(f'https://docs.google.com/spreadsheets/d/{SHEET}/gviz/tq?tqx=out:csv&gid={GID}').decode('utf8'))))
    oils_root = os.path.join(cache, 'תמונות רקע לתת קטגוריות תמציות שמן')
    banners = os.path.join(cache, 'תמונות לקטגוריות ראשיות')
    products, guide, subs = [], '', {}
    for r in rows[1:]:
        r = (r + [''] * 12)[:12]
        cat, sub, name, desc, price, _, attr, opts, sku, img, note = [x.strip() for x in r[:11]]
        if not name and desc and not cat:
            guide = desc; continue
        if not name: continue
        if cat == 'מפיצי ריח':
            key = next(k for k in DIFF if k.lower().strip() == name.lower().strip())
            pid, en, colors = DIFF[key]
            folder = os.path.join(cache, next(d for d in os.listdir(cache) if d.lower() == key.lower()))
            files = sorted(f for f in os.listdir(folder) if re.search(r'\.(jpe?g|png|webp)$', f, re.I))
            gallery = [save(os.path.join(folder, f), f'{pid}-{i}') for i, f in enumerate(files)]
            # primary: logo shot if present, else first
            order = sorted(range(len(files)), key=lambda i: 0 if 'לוגו' in files[i] else 1)
            gallery = [gallery[i] for i in order]; files = [files[i] for i in order]
            color_vals = [c.strip() for c in re.split(r'[,،]', opts) if c.strip()] if opts else []
            if pid == 'say-room-office': color_vals = ['לבן קלאסי', 'שחור קלאסי']
            color_imgs = {}
            for c, rule in colors.items():
                idx = rule if isinstance(rule, list) else [i for i, f in enumerate(files) if re.search(rule, f)]
                if isinstance(rule, list): idx = [order.index(i) for i in rule if i < len(files)]
                color_imgs[c] = [gallery[i] for i in idx]
            options = []
            if color_vals:
                vals = []
                for c in color_vals:
                    base = next((k for k in colors if k in c), None)
                    vals.append({'he': c, 'en': ' '.join(COLOR_EN.get(w, w) for w in re.findall(r'\w+', c)), 'imgs': color_imgs.get(base, [])[:1]})
                options.append({'name': {'he': 'צבע', 'en': 'Color'}, 'values': vals})
            if options and options[0]['values'][0]['imgs']:  # main image = first color's device shot
                first = options[0]['values'][0]['imgs'][0]; gallery = [first] + [g for g in gallery if g != first]
            specs, body = specs_and_body(desc)
            p = num(price)
            products.append({'id': pid, 'cat': 'diffusers', 'sub': sub, 'name': {'he': name.strip(), 'en': en}, 'desc': {'he': body, 'en': ''}, 'specs': specs,
                             'sizes': [{'label': 'יחידה', 'price': p, 'wholesale': round(p * .75), 'cost': round(p * .45)}], 'quote': not p, 'options': options,
                             'img': gallery[0], 'gallery': gallery[:10], 'fit': 'contain', 'upsellKit': True, 'active': True, 'stock': 25,
                             'tag': 'best' if pid in ('say-150', 'say-car') else 'new' if pid == 'say-400' else ''})
        elif sub.startswith('⭐'):
            n = 14 if '14' in name else 4
            src = find(os.path.join(cache, 'תמציות שמן', 'ערכות התנסות'), img) or find(os.path.join(cache, 'תמציות שמן', 'ערכות התנסות'), str(n))
            pid = f'kit-{n}'
            body = desc.strip()
            products.append({'id': pid, 'cat': 'oils', 'sub': sub, 'name': {'he': name, 'en': f'Discovery Kit — {n} oils ({"10" if n == 14 else "30"} ml)'},
                             'desc': {'he': body, 'en': ''}, 'specs': [], 'sizes': [{'label': 'מארז', 'price': num(price), 'wholesale': round(num(price) * .75), 'cost': 40}],
                             'picks': n, 'img': save(src, pid) if src else '', 'gallery': [], 'fit': 'cover', 'wide': False, 'active': True, 'stock': 50, 'tag': 'best'})
        elif cat == 'תמציות שמן':
            folder = os.path.join(oils_root, SUB_FOLDER.get(sub, ''))
            src = find(folder, ALIAS.get(name, name)) or find(folder, name) or find(os.path.join(oils_root, 'ניחוחות קלאסיים'), ALIAS.get(name, name))
            if not src: src = find(banners, SUB_BANNER.get(sub, ''))
            pid = 'oil-' + slug(name)
            he_b, en_b = SUB_BLURB.get(sub, ('{n}', '{n}'))
            products.append({'id': pid, 'cat': 'oils', 'sub': sub, 'name': {'he': name, 'en': EN.get(name, name)},
                             'desc': {'he': he_b.format(n=name) + '\n\n' + OIL_TIP, 'en': en_b.format(n=EN.get(name, name))}, 'specs': [],
                             'sizes': [{'label': l, 'price': p, 'wholesale': w, 'cost': c} for l, p, w, c in OIL_PRICES],
                             'img': save(src, pid, box=1200) if src else '', 'gallery': [], 'fit': 'cover', 'wide': True, 'active': True, 'stock': 100})
        subs.setdefault(cat, [])
        if sub and sub not in subs[cat]: subs[cat].append(sub)
    # Site imagery
    site = {}
    for f in sorted(os.listdir(os.path.join(cache, 'תמונות לקרוסלה'))):
        site.setdefault('hero', []).append(save(os.path.join(cache, 'תמונות לקרוסלה', f), 'hero-' + str(len(site.get('hero', []))), box=2000, q=80))
    for sub, b in SUB_BANNER.items():
        src = find(banners, b)
        if src: site.setdefault('subBanners', {})[sub] = save(src, 'sub-' + slug(SUB_EN[sub]), box=1600, q=80)
    oil_hero = find(os.path.join(cache, 'תמציות שמן'), 'Gemini_Generated_Image_rbvai6rbvai6rbva')
    if oil_hero: site['oils'] = save(oil_hero, 'cat-oils', box=1600, q=80)
    bundles = os.path.join(cache, 'מארזים משתלמים')
    site['bundles'] = [save(os.path.join(bundles, f), 'bundle-' + str(i), box=1600, q=80) for i, f in enumerate(sorted(os.listdir(bundles)))]
    site['subEn'] = SUB_EN
    BUNDLES = [('SAY100 + 1 ליטר', 'bundle-say100-1l', 'SAY 100 + 1L oil', 'מארזים משתלמים', 'SAY100 + 1ליטר עם רקע'),
               ('SAY150 + 1 ליטר', 'bundle-say150-1l', 'SAY 150 + 1L oil', 'תמונות לקרוסלה', 'SAY150 + 1 ליטר'),
               ('SAY 300 + 1 ליטר', 'bundle-say300-1l', 'SAY 300 + 1L oil', 'תמונות לקרוסלה', 'SAY 300 +1 ליטר'),
               ('מארז 5 בקבוקים 100 מ"ל', 'bundle-5x100', '5 × 100 ml oils bundle', 'מארזים משתלמים', 'מארז 5 בקבוקים 100 מל'),
               ('מארז SAY CAR + ערכת התנסות 14 תמציות', 'bundle-car-kit', 'SAY Car + 14-oil discovery kit', 'מארזים משתלמים', 'מארז SAY CAR+ ערכת התנסות 14 תמציות שמן לבחירה')]
    for he, pid, en, folder, fname in BUNDLES:
        src = find(os.path.join(cache, folder), fname)
        if not src: continue
        products.append({'id': pid, 'cat': 'bundles', 'sub': 'מכשירי בישום + מילוי', 'name': {'he': he, 'en': en},
                         'desc': {'he': 'מארז משתלם במחיר מיוחד. לפרטים, בחירת ניחוחות והצעת מחיר — דברו איתנו בוואטסאפ ונתאים לכם את המארז.', 'en': 'Special value bundle — message us on WhatsApp for pricing and scent choice.'},
                         'specs': [], 'sizes': [{'label': 'מארז', 'price': 0, 'wholesale': 0, 'cost': 0}], 'quote': True,
                         'img': save(src, pid, box=1600, q=80), 'gallery': [], 'fit': 'cover', 'wide': True, 'active': True, 'stock': 20})
    oils = [p['id'] for p in products if p['cat'] == 'oils' and not p.get('picks')]
    for p in products:
        if p.get('picks'): p['pickFrom'] = oils
    json.dump(products, open(os.path.join(ROOT, 'data', 'products.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump({'site': site, 'subs': subs, 'guide': guide}, open(os.path.join(ROOT, 'data', 'site.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'{len(products)} products, {len(written)} images')


num = lambda s: int(re.sub(r'[^\d]', '', s) or 0) if not re.search(r'\d+\s*-\s*\d+', s or '') else 0

if __name__ == '__main__':
    main()
