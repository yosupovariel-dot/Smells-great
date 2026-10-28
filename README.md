# SAY Boutique — Luxury Home Fragrances

Online store (Hebrew/English) for diffusers, fragrance oils, home perfumes, hair care, reed diffusers and candles.
Built by [arielyosupov-webdesign](https://arielyosupov-webdesign.com).

## Stack
Plain HTML/CSS/ES modules. No build step and no dependencies, which keeps the site fast. Strict CSP, no inline scripts, and every value is escaped before it is rendered.

## Preview
GitHub Pages: `https://yosupovariel-dot.github.io/Smells-great/`
(Settings → Pages → Source: **GitHub Actions**, then run the "Deploy preview" workflow.)

## Demo staff accounts (preview only — change on first login)
| Role | Email | Password |
|---|---|---|
| Admin | admin@say-boutique.co.il | Say2026!demo |
| Orders manager | orders@say-boutique.co.il | Say2026!demo |
| Courier | courier@say-boutique.co.il | Say2026!demo |

## Catalog (Google Sheet + Drive)
The products and images come from the product sheet and the Drive folder. To update them:
```
pip install pillow
python3 tools/build_catalog.py
```
This writes `data/products.json` and `data/site.json`, plus optimized WebP images in `assets/products/`. All images are hosted on the site itself.
Oil prices per size (10ml–5L) are set in `OIL_PRICES` at the top of the script, because the sheet only gives a 10–999 range. Prices can also be edited per product in the admin.

## Before going live (requires hosting/backend)
The preview stores data in the browser (`js/db.js`). Each function there maps to an API endpoint. For production:
- Move users, orders and products to a server DB. Hash passwords server-side (argon2/bcrypt), use HttpOnly+Secure+SameSite session cookies, enforce roles server-side, add rate limiting and CSRF protection.
- Payment: use a hosted payment page or iframe from the provider (e.g. Tranzila / Cardcom / Meshulam), so card data never touches the site (PCI-DSS).
- Order alerts: send WhatsApp messages via the WhatsApp Cloud API and email via SMTP/Resend from the server when an order is created.
- Serve the security headers in `_headers` (Netlify/Cloudflare Pages).
