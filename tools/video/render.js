// Renders reel.html frame-by-frame by seeking every CSS animation, then ffmpeg encodes.
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2]; const FPS = 24, DUR = 16;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 720, height: 900 } });
  await p.goto('file://' + path.join(__dirname, 'reel.html')); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  await p.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
  for (let f = 0; f < FPS * DUR; f++) {
    const t = (f / FPS) * 1000;
    await p.evaluate((t) => document.getAnimations().forEach((a) => (a.currentTime = t)), t);
    await p.screenshot({ path: `${out}/f${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  await b.close();
})();
