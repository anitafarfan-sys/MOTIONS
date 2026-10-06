// Renderiza el motion a MP4 (1920x1080, 30 fps) con Playwright + ffmpeg.
// Uso: node render.js [solución 1-4 ...] [--frames t1,t2,...]
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

(async () => {
  const args = process.argv.slice(2);
  const fi = args.indexOf('--frames');
  const stills = fi >= 0 ? args[fi + 1].split(',').map(Number) : null;
  const sols = args.filter((a, i) => /^[1-4]$/.test(a) && !(fi >= 0 && i === fi + 1)).map(Number);
  const list = sols.length ? sols : [1, 2, 3, 4];
  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?render');
  await page.evaluate(() => document.fonts.ready);
  const { DURATION, FPS } = await page.evaluate(() => window.MOTION);

  const grab = async (t, s) => {
    const url = await page.evaluate(([t, s]) => {
      window.renderFrame(t, s);
      return document.getElementById('stage').toDataURL('image/png');
    }, [t, s]);
    return Buffer.from(url.split(',')[1], 'base64');
  };

  for (const s of list) {
    if (stills) {
      for (const t of stills) fs.writeFileSync(path.join(outDir, `still_s${s}_${t}.png`), await grab(t, s));
      continue;
    }
    const file = path.join(outDir, `desafio_corazon_solucion_${s}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', file],
      { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.round(DURATION * FPS);
    for (let f = 0; f < n; f++) {
      const buf = await grab(f / FPS, s);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    console.log('ok', file);
  }
  await browser.close();
})();
