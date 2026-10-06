// Renderiza el motion "Los desafíos de DA hoy" a MP4 (1920x1080, 30 fps) con Playwright + ffmpeg.
// Uso: node render.js [--frames t1,t2,...]   (--frames guarda PNG sueltos en out/)
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

(async () => {
  const args = process.argv.slice(2);
  const fi = args.indexOf('--frames');
  const stills = fi >= 0 ? args[fi + 1].split(',').map(Number) : null;
  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?render');
  await page.evaluate(() => Promise.all([document.fonts.ready, window.MOTION.ready]));
  const FPS = await page.evaluate(() => window.MOTION.FPS);

  const grab = async (t) => {
    const url = await page.evaluate((t) => {
      window.renderFrame(t);
      return document.getElementById('stage').toDataURL('image/png');
    }, t);
    return Buffer.from(url.split(',')[1], 'base64');
  };

  if (stills) {
    for (const t of stills) fs.writeFileSync(path.join(outDir, `still_${t}.png`), await grab(t));
  } else {
    const file = path.join(outDir, 'desafios_da_hoy.mp4');
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', file],
      { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.round((await page.evaluate(() => window.MOTION.duration)) * FPS);
    for (let f = 0; f < n; f++) {
      const buf = await grab(f / FPS);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    console.log('ok', file);
  }
  await browser.close();
})();
