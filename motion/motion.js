// Motion "El corazón de Desafío Ambiente"
// El plástico problemático entra una sola vez a la caja Desafío; luego se
// escanean los problemas uno tras otro y cada uno sale como una solución.
//
// Uso:
//   index.html?s=0             -> vista previa de las 4 soluciones seguidas
//   index.html?s=1..4          -> vista previa de una sola solución
//   window.renderFrame(t, s)   -> dibuja el frame en el segundo t (lo usa render.js)
//   window.MOTION.duration(s)  -> duración en segundos de la versión s

(() => {
  const W = 1920, H = 1080;
  const FPS = 30;

  // ---------- Línea de tiempo ----------
  // 0 – R0: entrada única de envases y proceso. Luego una ronda de RL s por
  // problema (escaneo -> solución) y al final el cierre con el logo.
  const R0 = 7.4, RL = 7.8, OUTRO = 3.4;
  const TL = 14.5; // duración de la intro con la línea de tiempo
  // s = 0: intro con la línea de tiempo + las 4 soluciones; 1-4: una solución;
  // 5: solo la línea de tiempo.
  const makeSched = (rounds, intro) => ({ rounds, intro, outro: R0 + rounds.length * RL, dur: intro + R0 + rounds.length * RL + OUTRO });
  const schedFor = (s) => (s === 5 ? { ...makeSched([0], TL), dur: TL } : makeSched(s >= 1 && s <= 4 ? [s - 1] : [0, 1, 2, 3], s === 0 ? TL : 0));
  let SCHED = schedFor(0);
  function roundAt(t) {
    if (t < R0) return null;
    const j = Math.min(SCHED.rounds.length - 1, Math.floor((t - R0) / RL));
    return { j, i: SCHED.rounds[j], lt: t - R0 - j * RL };
  }

  // ---------- Logo ----------
  const LOGO = {};
  const logosReady = Promise.all(['mark', 'text_dark', 'text_light', 'hist_desafio_2015', 'hist_aislapet', 'hist_everwood'].map((k) => new Promise((res) => {
    const img = new Image();
    img.onload = () => res();
    img.onerror = () => res();
    img.src = window.DA_LOGOS[k];
    LOGO[k] = img;
  })));
  // Lockup horizontal original: isotipo 207 px + texto 406 px, alto 283 px.
  function drawLogo(ctx, x, y, h, textKey, pulse = 0) {
    const k = h / 283;
    const mw = 207 * k, tw = 406 * k;
    ctx.save();
    ctx.translate(x + mw / 2, y + h / 2);
    ctx.scale(1 + pulse, 1 + pulse);
    ctx.drawImage(LOGO.mark, -mw / 2, -h / 2, mw, h);
    ctx.restore();
    ctx.drawImage(LOGO[textKey], x + mw, y, tw, h);
    return mw + tw;
  }

  // ---------- Paleta (ajustar a la marca si corresponde) ----------
  const C = {
    bg1: '#071a15',
    bg2: '#0f3a2e',
    grid: 'rgba(182,227,90,0.05)',
    green: '#2bb673',
    lime: '#b6e35a',
    teal: '#1fb6a6',
    brand: '#08a2a7',      // turquesa del logo Desafío Ambiente
    brandDark: '#067d81',
    cream: '#f4f1e8',
    muted: 'rgba(244,241,232,0.62)',
    red: '#ff5a4e',
    orange: '#ff9f43',
    card: 'rgba(255,255,255,0.06)',
    cardLine: 'rgba(244,241,232,0.16)',
  };
  const FONT = 'Inter, "Liberation Sans", sans-serif';

  // ---------- Contenido por solución ----------
  const SOLUTIONS = [
    {
      title: 'Construcción',
      sub: 'Madera plástica · tablas 1×4',
      problem: 'Una obra necesita madera durable y de bajo impacto',
      result: 'Madera plástica: tablas, vigas y postes',
    },
    {
      title: 'Equipamiento urbano',
      sub: 'Mobiliario para espacios públicos',
      problem: 'Una plaza necesita mobiliario durable',
      result: 'Bancas y jardineras para la ciudad',
    },
    {
      title: 'Proyecto I+D',
      sub: 'Investigación y nuevos materiales',
      problem: 'Un residuo plástico sin solución conocida',
      result: 'Nuevo material validado en laboratorio',
    },
    {
      title: 'Solución digital',
      sub: 'Problema normativo y sostenible',
      problem: 'Una empresa debe cumplir la Ley REP',
      result: 'Trazabilidad y cumplimiento en una plataforma',
    },
  ];

  // ---------- Utilidades ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const easeIn = (k) => k * k * k;
  const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const easeBack = (k) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
  };
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  const R = rng(7);
  const PELLETS = Array.from({ length: 46 }, () => ({
    a: R() * Math.PI * 2, v: 160 + R() * 220, d: R() * 1.2, r: 4 + R() * 5,
    c: [C.green, C.lime, C.teal, '#7fe0b0'][Math.floor(R() * 4)],
  }));
  const FLOW = Array.from({ length: 30 }, () => ({
    p: R(), r: 5 + R() * 5, c: [C.green, C.lime, C.teal][Math.floor(R() * 3)], o: (R() - 0.5) * 10,
  }));
  const SPECKS = Array.from({ length: 200 }, () => ({
    x: R(), y: R(), c: ['#4aa3ff', '#ffd23f', '#ff6b6b', '#ffffff', '#1d6f4f'][Math.floor(R() * 5)],
  }));

  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(' ');
    let line = '';
    let yy = y;
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, yy);
        line = w;
        yy += lh;
      } else line = test;
    }
    ctx.fillText(line, x, yy);
    return yy;
  }

  function bez(p0, p1, p2, p3, u) {
    const m = 1 - u;
    return {
      x: m * m * m * p0.x + 3 * m * m * u * p1.x + 3 * m * u * u * p2.x + u * u * u * p3.x,
      y: m * m * m * p0.y + 3 * m * m * u * p1.y + 3 * m * u * u * p2.y + u * u * u * p3.y,
    };
  }

  function pill(ctx, x, y, text, bg, fg, size = 18) {
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + size * 1.4;
    const h = size * 1.9;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + size * 0.7, y + h / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    return w;
  }

  // ---------- Plásticos problemáticos ----------
  function drawBottle(ctx, s) {
    ctx.fillStyle = 'rgba(120,190,255,0.85)';
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18 * s, 0);
    ctx.lineTo(-18 * s, -70 * s);
    ctx.quadraticCurveTo(-18 * s, -88 * s, -8 * s, -96 * s);
    ctx.lineTo(-8 * s, -108 * s);
    ctx.lineTo(8 * s, -108 * s);
    ctx.lineTo(8 * s, -96 * s);
    ctx.quadraticCurveTo(18 * s, -88 * s, 18 * s, -70 * s);
    ctx.lineTo(18 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff5a4e';
    ctx.fillRect(-10 * s, -118 * s, 20 * s, 11 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(-18 * s, -55 * s, 36 * s, 18 * s);
  }
  function drawBag(ctx, s) {
    ctx.fillStyle = 'rgba(245,245,245,0.9)';
    ctx.strokeStyle = 'rgba(180,180,180,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-38 * s, 0);
    ctx.lineTo(-32 * s, -62 * s);
    ctx.lineTo(-22 * s, -62 * s);
    ctx.quadraticCurveTo(-24 * s, -92 * s, -10 * s, -88 * s);
    ctx.lineTo(-12 * s, -62 * s);
    ctx.lineTo(12 * s, -62 * s);
    ctx.lineTo(10 * s, -88 * s);
    ctx.quadraticCurveTo(24 * s, -92 * s, 22 * s, -62 * s);
    ctx.lineTo(32 * s, -62 * s);
    ctx.lineTo(38 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(160,160,160,0.7)';
    ctx.beginPath();
    ctx.moveTo(-20 * s, -40 * s); ctx.lineTo(-5 * s, -20 * s);
    ctx.moveTo(10 * s, -45 * s); ctx.lineTo(20 * s, -15 * s);
    ctx.stroke();
  }
  function drawCup(ctx, s) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#c9c9c9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20 * s, 0);
    ctx.lineTo(-28 * s, -70 * s);
    ctx.lineTo(28 * s, -70 * s);
    ctx.lineTo(20 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(-26 * s, -52 * s, 52 * s, 10 * s);
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(-30 * s, -76 * s, 60 * s, 7 * s);
  }
  function drawPacket(ctx, s) {
    ctx.fillStyle = '#c84bd8';
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-30 * s, 0);
    ctx.lineTo(-34 * s, -80 * s);
    for (let i = 0; i <= 6; i++) ctx.lineTo(-34 * s + i * 11.3 * s, -80 * s - (i % 2 ? 6 : 0) * s);
    ctx.lineTo(30 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(0, -42 * s, 15 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(-22 * s, -70 * s, 6 * s, 50 * s);
  }
  function drawTray(ctx, s) {
    ctx.fillStyle = '#ff9f43';
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-40 * s, -30 * s);
    ctx.lineTo(40 * s, -30 * s);
    ctx.lineTo(32 * s, 0);
    ctx.lineTo(-32 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-30 * s, -25 * s, 60 * s, 5 * s);
  }
  const ITEMS = [
    { draw: drawBag, x: 170, rot: -0.08 },
    { draw: drawBottle, x: 285, rot: 0.1 },
    { draw: drawPacket, x: 400, rot: -0.12 },
    { draw: drawCup, x: 515, rot: 0.06 },
    { draw: drawTray, x: 630, rot: 0 },
  ];

  // ---------- Íconos de soluciones (trazo) ----------
  function iconConstruction(ctx, x, y, s, col) {
    // pila de tablas vista desde la testa
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    const bw = 16 * s, bh = 7 * s, dx = 14 * s, dy = -10 * s;
    const x0 = -30 * s, y0 = 20 * s;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) ctx.strokeRect(x0 + c * bw, y0 - (r + 1) * bh, bw, bh);
    }
    const top = y0 - 3 * bh, right = x0 + 3 * bw;
    ctx.beginPath();
    ctx.moveTo(x0, top); ctx.lineTo(x0 + dx, top + dy); ctx.lineTo(right + dx, top + dy);
    ctx.lineTo(right + dx, y0 + dy); ctx.lineTo(right, y0);
    ctx.moveTo(right, top); ctx.lineTo(right + dx, top + dy);
    ctx.stroke();
    ctx.restore();
  }
  function iconBench(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-28 * s, -20 * s); ctx.lineTo(28 * s, -20 * s);
    ctx.moveTo(-28 * s, -10 * s); ctx.lineTo(28 * s, -10 * s);
    ctx.moveTo(-30 * s, 2 * s); ctx.lineTo(30 * s, 2 * s);
    ctx.moveTo(-22 * s, 2 * s); ctx.lineTo(-22 * s, 20 * s);
    ctx.moveTo(22 * s, 2 * s); ctx.lineTo(22 * s, 20 * s);
    ctx.moveTo(-22 * s, -20 * s); ctx.lineTo(-22 * s, 2 * s);
    ctx.moveTo(22 * s, -20 * s); ctx.lineTo(22 * s, 2 * s);
    ctx.stroke();
    ctx.restore();
  }
  function iconFlask(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-8 * s, -26 * s);
    ctx.lineTo(-8 * s, -8 * s);
    ctx.lineTo(-24 * s, 20 * s);
    ctx.lineTo(24 * s, 20 * s);
    ctx.lineTo(8 * s, -8 * s);
    ctx.lineTo(8 * s, -26 * s);
    ctx.moveTo(-12 * s, -26 * s); ctx.lineTo(12 * s, -26 * s);
    ctx.moveTo(-16 * s, 6 * s); ctx.lineTo(16 * s, 6 * s);
    ctx.stroke();
    ctx.restore();
  }
  function iconDigital(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.roundRect(-28 * s, -22 * s, 56 * s, 36 * s, 4 * s);
    ctx.moveTo(-10 * s, 24 * s); ctx.lineTo(10 * s, 24 * s);
    ctx.moveTo(0, 14 * s); ctx.lineTo(0, 24 * s);
    ctx.moveTo(-10 * s, -4 * s); ctx.lineTo(-3 * s, 3 * s); ctx.lineTo(12 * s, -11 * s);
    ctx.stroke();
    ctx.restore();
  }
  const ICONS = [iconConstruction, iconBench, iconFlask, iconDigital];

  // ---------- Layout ----------
  const BOX = { cx: 960, cy: 560, s: 300, dx: 62, dy: -52 };
  const BELT_Y = BOX.cy + 118;
  const CARD = { x: 1400, w: 450, h: 128, y0: 232, gap: 156 };
  const PANEL = { x: 1250, y: 210, w: 600, h: 640 };

  function cardRect(i) {
    return { x: CARD.x, y: CARD.y0 + i * CARD.gap, w: CARD.w, h: CARD.h };
  }
  const outlet = () => ({ x: BOX.cx + BOX.s / 2 + BOX.dx / 2, y: BOX.cy + BOX.dy / 2 + 10 });

  // ---------- Escena ----------
  function drawBackground(ctx, t) {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.52, 80, W * 0.5, H * 0.5, W * 0.75);
    g.addColorStop(0, C.bg2);
    g.addColorStop(1, C.bg1);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    const off = (t * 12) % 60;
    ctx.beginPath();
    for (let x = -60 + off; x < W; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y < H; y += 60) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  }

  function drawTitle(ctx, t) {
    const a = easeOut(prog(t, 0.1, 0.9));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(0, (1 - a) * -20);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.cream;
    ctx.font = `800 54px ${FONT}`;
    ctx.fillText('El corazón de Desafío Ambiente', W / 2, 100);
    ctx.fillStyle = C.lime;
    ctx.font = `500 26px ${FONT}`;
    ctx.fillText('Entra un problema · sale una solución hecha de plástico problemático', W / 2, 145);
    ctx.restore();
  }

  function problemCards() {
    const n = SCHED.rounds.length;
    const cards = [{
      s: 1.0, e: R0, tag: 'MATERIA PRIMA', tagCol: C.orange,
      head: 'Plástico problemático', sub: 'Films, multicapa, PS y mezclas que hoy no se reciclan',
    }];
    SCHED.rounds.forEach((i, j) => cards.push({
      s: R0 + j * RL + 0.1, e: j < n - 1 ? R0 + (j + 1) * RL : 1e9,
      tag: n > 1 ? `PROBLEMA ${j + 1} / ${n}` : 'PROBLEMA', tagCol: C.red,
      head: SOLUTIONS[i].problem, sub: 'Lo resolvemos con el plástico ya reconvertido',
    }));
    return cards;
  }

  function drawProblemCard(ctx, t) {
    const x = 110, y = 232, w = 600, h = 236;
    for (const c of problemCards()) {
      const inn = easeOut(prog(t, c.s, c.s + 0.5));
      const out = prog(t, c.e - 0.2, c.e + 0.3);
      const a = inn * (1 - out) * (1 - 0.45 * prog(t, SCHED.outro, SCHED.outro + 0.4));
      if (a <= 0.01) continue;
      const red = c.tagCol === C.red;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate((1 - inn) * -40 - easeIn(out) * 60, 0);
      ctx.fillStyle = red ? 'rgba(255,90,78,0.10)' : 'rgba(255,159,67,0.10)';
      ctx.strokeStyle = red ? 'rgba(255,90,78,0.55)' : 'rgba(255,159,67,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 22);
      ctx.fill();
      ctx.stroke();
      pill(ctx, x + 28, y + 26, c.tag, c.tagCol, '#fff', 18);
      ctx.fillStyle = C.cream;
      ctx.font = `800 34px ${FONT}`;
      const last = wrapText(ctx, c.head, x + 28, y + 110, w - 56, 42);
      ctx.fillStyle = C.muted;
      ctx.font = `500 21px ${FONT}`;
      wrapText(ctx, c.sub, x + 28, last + 40, w - 56, 28);
      ctx.restore();
    }
  }

  // El problema de cada ronda viaja como "ticket" desde la tarjeta a la caja.
  function drawTicket(ctx, t) {
    const r = roundAt(t);
    if (!r) return;
    const k = prog(r.lt, 0.5, 1.15);
    if (k <= 0 || k >= 1) return;
    const e = easeInOut(k);
    const p = bez({ x: 690, y: 400 }, { x: 790, y: 380 }, { x: 760, y: 560 }, { x: BOX.cx - BOX.s / 2 + 10, y: BOX.cy + 20 }, e);
    const sc = lerp(1, 0.45, e);
    ctx.save();
    ctx.globalAlpha = 1 - prog(k, 0.85, 1);
    ctx.translate(p.x, p.y);
    ctx.scale(sc, sc);
    ctx.shadowColor = 'rgba(255,90,78,0.6)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.roundRect(-46, -26, 92, 52, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = `900 30px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(r.j + 1), 0, 11);
    ctx.restore();
  }

  function drawBelt(ctx, t) {
    const a = easeOut(prog(t, 0.6, 1.3));
    const x0 = 100, x1 = BOX.cx - BOX.s / 2 + 4;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#1c2b27';
    ctx.beginPath();
    ctx.roundRect(x0, BELT_Y, x1 - x0, 26, 13);
    ctx.fill();
    ctx.strokeStyle = 'rgba(244,241,232,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // rodillos en movimiento
    const moving = t > 2.8 && t < 5.2;
    const off = moving ? ((t - 2.8) * 140) % 40 : 0;
    ctx.fillStyle = 'rgba(244,241,232,0.35)';
    for (let x = x0 + 16 + off; x < x1 - 8; x += 40) {
      ctx.beginPath();
      ctx.arc(x, BELT_Y + 13, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // patas
    ctx.fillStyle = '#16231f';
    ctx.fillRect(x0 + 40, BELT_Y + 26, 12, 60);
    ctx.fillRect(x1 - 80, BELT_Y + 26, 12, 60);
    ctx.restore();
  }

  function drawItems(ctx, t) {
    const mouth = BOX.cx - BOX.s / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, mouth + 2, H);
    ctx.clip();
    ITEMS.forEach((it, i) => {
      const td = 1.4 + i * 0.18;
      const drop = prog(t, td, td + 0.55);
      if (drop <= 0) return;
      const y = lerp(BELT_Y - 520, BELT_Y, easeBack(drop) > 1 ? 1 - (easeBack(drop) - 1) * 0.6 : easeBack(drop));
      const ts = 2.8 + (4 - i) * 0.32;
      const mv = easeInOut(prog(t, ts, ts + 1.15));
      const x = lerp(it.x, mouth + 90, mv);
      const wob = Math.sin(t * 9 + i) * 0.05 * (mv > 0 && mv < 1 ? 1 : 0);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(it.rot + wob);
      it.draw(ctx, 1.05);
      ctx.restore();
    });
    ctx.restore();
  }

  function pulseIn(t, a, b) {
    // latido doble cada 0.9 s dentro de la ventana [a, b]
    if (t <= a || t >= b) return 0;
    const ph = ((t - a) % 0.9) / 0.9;
    const b1 = Math.exp(-Math.pow((ph - 0.08) / 0.05, 2));
    const b2 = Math.exp(-Math.pow((ph - 0.28) / 0.06, 2)) * 0.7;
    return b1 + b2;
  }
  function beat(t) {
    const r = roundAt(t);
    return Math.max(pulseIn(t, 4.3, 7.2), r ? pulseIn(r.lt, 1.0, 1.85) : 0);
  }

  function drawBox(ctx, t) {
    const { cx, cy, s, dx, dy } = BOX;
    const a = easeBack(prog(t, 0.3, 1.1));
    if (a <= 0) return;
    const b = beat(t);
    const proc = prog(t, 4.3, 7.2);
    const busy = (proc > 0 && proc < 1) || (roundAt(t) && roundAt(t).lt < 2.0);
    const glow = (busy ? 0.5 + 0.5 * b : 0) + (t > R0 ? 0.35 : 0);
    const shake = busy ? Math.sin(t * 60) * 1.6 * b : 0;
    ctx.save();
    ctx.translate(cx + shake, cy);
    ctx.scale(a, a);
    ctx.translate(-cx, -cy);
    const L = cx - s / 2, T = cy - s / 2, Rr = cx + s / 2, B = cy + s / 2;

    // halo turquesa (color de marca)
    if (glow > 0) {
      const hg = ctx.createRadialGradient(cx, cy, s * 0.2, cx, cy, s * 1.15);
      hg.addColorStop(0, `rgba(8,162,167,${0.45 * glow})`);
      hg.addColorStop(1, 'rgba(8,162,167,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(cx - s * 1.3, cy - s * 1.3, s * 2.6, s * 2.6);
    }
    // cara superior
    ctx.fillStyle = '#e3eeee';
    ctx.beginPath();
    ctx.moveTo(L, T); ctx.lineTo(Rr, T); ctx.lineTo(Rr + dx, T + dy); ctx.lineTo(L + dx, T + dy);
    ctx.closePath();
    ctx.fill();
    // cara lateral (turquesa de marca)
    ctx.fillStyle = C.brandDark;
    ctx.beginPath();
    ctx.moveTo(Rr, T); ctx.lineTo(Rr + dx, T + dy); ctx.lineTo(Rr + dx, B + dy); ctx.lineTo(Rr, B);
    ctx.closePath();
    ctx.fill();
    // cara frontal blanca con el logo
    const fg = ctx.createLinearGradient(L, T, Rr, B);
    fg.addColorStop(0, '#ffffff');
    fg.addColorStop(1, '#e9f1f1');
    ctx.fillStyle = fg;
    ctx.fillRect(L, T, s, s);
    ctx.fillStyle = C.brand;
    ctx.fillRect(L, B - 12, s, 12);
    // boca de entrada (izquierda) y salida (lateral)
    ctx.fillStyle = '#0b2b20';
    ctx.fillRect(L - 4, BELT_Y - 150, 14, 176);
    ctx.beginPath();
    ctx.ellipse(Rr + dx / 2, cy + dy / 2 + 10, 10, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // logo: el isotipo late como el corazón de Desafío
    const lh = 118;
    const lw = (613 / 283) * lh;
    drawLogo(ctx, cx - lw / 2, cy - 92, lh, 'text_dark', 0.12 * b);

    // barra de proceso
    if (proc > 0) {
      ctx.fillStyle = 'rgba(8,162,167,0.15)';
      ctx.beginPath();
      ctx.roundRect(L + 40, B - 56, s - 80, 10, 5);
      ctx.fill();
      ctx.fillStyle = C.brand;
      ctx.beginPath();
      ctx.roundRect(L + 40, B - 56, (s - 80) * easeInOut(proc), 10, 5);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawProcessSteps(ctx, t) {
    const a = easeOut(prog(t, 4.0, 4.6));
    if (a <= 0) return;
    const steps = ['Recolectar', 'Clasificar', 'Reconvertir'];
    const y = BOX.cy + BOX.s / 2 + 60;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `700 22px ${FONT}`;
    const widths = steps.map((s) => ctx.measureText(s).width + 36);
    const total = widths.reduce((p, c) => p + c, 0) + 2 * 46;
    let x = BOX.cx - total / 2;
    steps.forEach((s, i) => {
      const on = prog(t, 4.5 + i * 0.85, 4.8 + i * 0.85);
      const bg = on > 0 ? `rgba(182,227,90,${0.15 + 0.85 * on})` : 'rgba(255,255,255,0.08)';
      const fg = on > 0.5 ? '#0b2b20' : C.muted;
      pill(ctx, x, y, s, bg, fg, 22);
      x += widths[i];
      if (i < steps.length - 1) {
        ctx.fillStyle = on > 0.5 ? C.lime : C.muted;
        ctx.font = `700 26px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('→', x + 23, y + 30);
        ctx.textAlign = 'left';
        x += 46;
      }
    });
    ctx.restore();
  }

  function drawPellets(ctx, t) {
    // estallido de pellets reconvertidos sobre la caja
    const base = 5.0;
    if (t < base || t > 8.6) return;
    const top = { x: BOX.cx + BOX.dx / 2, y: BOX.cy - BOX.s / 2 + BOX.dy / 2 };
    PELLETS.forEach((p) => {
      const lt = ((t - base - p.d) % 1.4 + 1.4) % 1.4;
      if (t - base < p.d) return;
      const fade = 1 - prog(t, 7.6, 8.6);
      const vx = Math.cos(p.a) * p.v * 0.45;
      const vy = -Math.abs(Math.sin(p.a)) * p.v - 120;
      const x = top.x + vx * lt;
      const y = top.y + vy * lt + 0.5 * 520 * lt * lt;
      if (y > top.y + 20) return;
      ctx.globalAlpha = fade * clamp(1 - lt / 1.4);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // ---------- Selección y tarjetas ----------
  // Tiempos locales de cada ronda (segundos desde su inicio)
  const SCAN = [1.2, 2.6], DECIDE = 2.7, EXPAND = [2.8, 3.5], OUT = [3.5, 6.6], COLLAPSE = [7.0, 7.6];

  function highlightAt(t) {
    const r = roundAt(t);
    if (!r || r.lt < SCAN[0] || r.lt >= DECIDE) return -1;
    const N = 9 + r.i;
    let idx = 0;
    for (let k = 0; k < N; k++) {
      if (r.lt >= SCAN[0] + (SCAN[1] - SCAN[0]) * Math.pow(k / (N - 1), 1.7)) idx = k;
    }
    return idx % 4;
  }

  // Estado de la ronda actual: elegido, expansión del panel y opacidad del resto.
  function roundState(t) {
    const r = roundAt(t);
    if (!r) return { chosen: -1, decided: false, expand: 0, others: 1, r };
    const decided = r.lt >= DECIDE && r.lt < COLLAPSE[1];
    const expand = easeInOut(prog(r.lt, EXPAND[0], EXPAND[1])) * (1 - easeInOut(prog(r.lt, COLLAPSE[0], COLLAPSE[1])));
    const others = clamp(1 - prog(r.lt, DECIDE, DECIDE + 0.4) + prog(r.lt, COLLAPSE[0] + 0.35, COLLAPSE[1] + 0.2));
    return { chosen: r.i, decided, expand, others, r };
  }

  function isDone(i, t) {
    const r = roundAt(t);
    if (!r) return false;
    return SCHED.rounds.some((ri, j) => ri === i && (j < r.j || (j === r.j && r.lt >= OUT[1] - 0.4)));
  }

  function rectFor(i, st) {
    const r = cardRect(i);
    if (i !== st.chosen || st.expand <= 0) return r;
    const k = st.expand;
    return { x: lerp(r.x, PANEL.x, k), y: lerp(r.y, PANEL.y, k), w: lerp(r.w, PANEL.w, k), h: lerp(r.h, PANEL.h, k) };
  }

  function connectorPts(i, st) {
    const p0 = outlet();
    const c = cardRect(i);
    const r = rectFor(i, st);
    const k = i === st.chosen ? st.expand : 0;
    const p3 = { x: r.x, y: lerp(c.y + c.h / 2, PANEL.y + PANEL.h / 2 - 20, k) };
    const dxm = Math.max(60, (p3.x - p0.x) * 0.5);
    return [p0, { x: p0.x + dxm, y: p0.y }, { x: p3.x - dxm, y: p3.y }, p3];
  }

  function drawConnectors(ctx, t) {
    const hl = highlightAt(t);
    const st = roundState(t);
    for (let i = 0; i < 4; i++) {
      const appear = easeOut(prog(t, 1.2 + i * 0.15, 1.9 + i * 0.15));
      if (appear <= 0) continue;
      let alpha = (isDone(i, t) ? 0.45 : 0.22) * appear;
      let col = isDone(i, t) ? C.lime : C.cream;
      let lw = 3;
      if (!st.decided && hl === i) { alpha = 0.95; col = C.lime; lw = 5; }
      if (st.decided) {
        if (i === st.chosen) { alpha = 1; col = C.lime; lw = 6; }
        else alpha *= st.others;
      } else if (i !== st.chosen) alpha *= st.others;
      if (alpha <= 0.01) continue;
      const [p0, p1, p2, p3] = connectorPts(i, st);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.setLineDash(st.decided && i === st.chosen ? [] : [10, 10]);
      ctx.lineDashOffset = -t * 40;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      ctx.stroke();
      ctx.restore();
    }
    // flujo de pellets por el conector elegido
    const r = st.r;
    if (r && r.lt > EXPAND[0] && r.lt < OUT[1] + 0.3) {
      const [p0, p1, p2, p3] = connectorPts(st.chosen, st);
      const lt = r.lt - EXPAND[0];
      const fade = 1 - prog(r.lt, OUT[1] - 0.3, OUT[1] + 0.2);
      FLOW.forEach((f) => {
        if (lt * 0.55 < f.p) return;
        const u = (lt * 0.55 + f.p) % 1;
        const pt = bez(p0, p1, p2, p3, u);
        ctx.globalAlpha = fade * Math.sin(u * Math.PI);
        ctx.fillStyle = f.c;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y + f.o, f.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
  }

  function drawCheck(ctx, x, y, rad) {
    ctx.fillStyle = C.lime;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0b2b20';
    ctx.lineWidth = rad * 0.22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - rad * 0.5, y); ctx.lineTo(x - rad * 0.1, y + rad * 0.45); ctx.lineTo(x + rad * 0.55, y - rad * 0.45);
    ctx.stroke();
  }

  function drawCards(ctx, t) {
    const hl = highlightAt(t);
    const st = roundState(t);
    // el panel expandido se dibuja al final, encima del resto
    const order = [0, 1, 2, 3].filter((i) => i !== st.chosen).concat(st.chosen >= 0 ? [st.chosen] : []);
    for (const i of order) {
      const appear = easeOut(prog(t, 1.2 + i * 0.15, 1.9 + i * 0.15));
      if (appear <= 0) continue;
      const r = rectFor(i, st);
      const isChosen = i === st.chosen;
      let alpha = appear * (isChosen && (st.decided || st.expand > 0) ? 1 : st.others);
      const active = (!st.decided && hl === i) || (st.decided && isChosen);
      const expand = isChosen ? st.expand : 0;
      if (alpha <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate((1 - appear) * 40, 0);
      const pop = active && !st.decided ? 1.04 : 1;
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.scale(pop, pop);
      ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
      ctx.fillStyle = active ? 'rgba(182,227,90,0.14)' : C.card;
      if (expand > 0) ctx.fillStyle = '#123d30';
      ctx.strokeStyle = active ? C.lime : C.cardLine;
      ctx.lineWidth = active ? 3 : 2;
      if (active) { ctx.shadowColor = 'rgba(182,227,90,0.45)'; ctx.shadowBlur = 30; }
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 22);
      ctx.fill();
      if (expand > 0) {
        ctx.fillStyle = 'rgba(182,227,90,0.14)';
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.stroke();
      // número
      ctx.fillStyle = active ? C.lime : 'rgba(244,241,232,0.15)';
      ctx.beginPath();
      ctx.arc(r.x + 34, r.y + 34, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = active ? '#0b2b20' : C.cream;
      ctx.font = `800 18px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), r.x + 34, r.y + 40);
      ctx.textAlign = 'left';
      ICONS[i](ctx, r.x + 88, r.y + 72, 1.0, active ? C.lime : C.cream);
      ctx.fillStyle = C.cream;
      ctx.font = `800 28px ${FONT}`;
      ctx.fillText(SOLUTIONS[i].title, r.x + 140, r.y + 58);
      ctx.fillStyle = C.muted;
      ctx.font = `500 19px ${FONT}`;
      ctx.fillText(SOLUTIONS[i].sub, r.x + 140, r.y + 90);
      // solución ya entregada
      if (isDone(i, t) && expand < 0.05) drawCheck(ctx, r.x + r.w - 32, r.y + 32, 15);
      // contenido del panel
      if (isChosen && st.r) {
        const lt = st.r.lt;
        const ca = easeOut(prog(lt, OUT[0], OUT[0] + 0.3)) * (1 - prog(lt, COLLAPSE[0] - 0.25, COLLAPSE[0]));
        if (ca > 0 && expand > 0.98) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(r.x, r.y, r.w, r.h, 22);
          ctx.clip();
          const s = prog(lt, OUT[0], OUT[1]);
          const area = { x: r.x + 30, y: r.y + 140, w: r.w - 60, h: r.h - 240 };
          ctx.globalAlpha = alpha * ca;
          ctx.strokeStyle = C.cardLine;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(r.x + 30, r.y + 124); ctx.lineTo(r.x + r.w - 30, r.y + 124);
          ctx.stroke();
          OUTCOMES[i](ctx, area, s, t);
          // resultado
          ctx.globalAlpha = alpha * ca * easeOut(prog(lt, OUT[1] - 0.5, OUT[1] - 0.1));
          drawCheck(ctx, r.x + 48, r.y + r.h - 54, 18);
          ctx.fillStyle = C.cream;
          ctx.font = `700 22px ${FONT}`;
          ctx.fillText(SOLUTIONS[i].result, r.x + 80, r.y + r.h - 46);
          ctx.restore();
        }
      }
      ctx.restore();
    }
  }

  // ---------- Animaciones de cada solución ----------
  function ground(ctx, a, y) {
    ctx.strokeStyle = 'rgba(244,241,232,0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.x + 10, y); ctx.lineTo(a.x + a.w - 10, y);
    ctx.stroke();
  }

  function recycledFill(ctx, x, y, w, h, base, seed) {
    ctx.fillStyle = base;
    ctx.fillRect(x, y, w, h);
    const n = Math.floor((w * h) / 180);
    for (let k = 0; k < n; k++) {
      const sp = SPECKS[(seed * 31 + k) % SPECKS.length];
      ctx.fillStyle = sp.c;
      ctx.globalAlpha *= 0.8;
      ctx.fillRect(x + sp.x * (w - 3), y + sp.y * (h - 3), 3, 3);
      ctx.globalAlpha /= 0.8;
    }
  }

  // Pieza de madera plástica en proyección oblicua.
  // (x, y) = esquina inferior izquierda de la testa; D = largo de la pieza.
  function lumber(ctx, x, y, w, h, D, seed) {
    const edge = 'rgba(20,12,6,0.55)';
    // cara superior
    ctx.fillStyle = '#7a5c43';
    ctx.beginPath();
    ctx.moveTo(x, y - h); ctx.lineTo(x + w, y - h); ctx.lineTo(x + w + D.x, y - h + D.y); ctx.lineTo(x + D.x, y - h + D.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // veta a lo largo
    ctx.strokeStyle = 'rgba(40,25,12,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const f of [0.3, 0.62]) {
      ctx.moveTo(x + w * f + D.x * 0.04, y - h + D.y * 0.04);
      ctx.lineTo(x + w * f + D.x * 0.96, y - h + D.y * 0.96);
    }
    ctx.stroke();
    // cara lateral
    ctx.fillStyle = '#5a4130';
    ctx.beginPath();
    ctx.moveTo(x + w, y - h); ctx.lineTo(x + w + D.x, y - h + D.y); ctx.lineTo(x + w + D.x, y + D.y); ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // testa (corte 1×4) con pigmento reciclado
    ctx.save();
    recycledFill(ctx, x, y - h, w, h, '#a3815f', seed);
    ctx.restore();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x, y - h, w, h);
  }

  // Lote de piezas: cols × rows, aparecen saliendo desde el fondo (extrusión).
  function lumberLot(ctx, x, y, w, h, cols, rows, D, s0, s1, s, seed) {
    const n = cols * rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = r * cols + c;
        const st = lerp(s0, s1, k / n);
        const p = easeOut(prog(s, st, st + (s1 - s0) / n * 3));
        if (p <= 0) continue;
        const back = (1 - p) * 0.7;
        ctx.save();
        ctx.globalAlpha *= clamp(p * 1.6);
        lumber(ctx, x + c * w + D.x * back, y - r * h + D.y * back, w, h, D, seed + k);
        ctx.restore();
      }
    }
  }

  function strap(ctx, x, y, W, Hh, D, f) {
    ctx.strokeStyle = C.lime;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + D.x * f, y - Hh + D.y * f);
    ctx.lineTo(x + W + D.x * f, y - Hh + D.y * f);
    ctx.lineTo(x + W + D.x * f, y + D.y * f);
    ctx.stroke();
  }

  function outcomeConstruction(ctx, a, s) {
    // --- Lote de tablas 1×4 de 2,8 m ---
    const bw = 56, bh = 14, cols = 5, rows = 6;
    const D = { x: 210, y: -105 };
    const x0 = a.x + 20, y0 = a.y + 250;
    const LW = bw * cols, LH = bh * rows;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x0 + LW / 2 + D.x / 2, y0 + D.y / 2 + 6, 260, 30, Math.atan2(D.y, D.x) * 0.35, 0, Math.PI * 2);
    ctx.fill();
    lumberLot(ctx, x0, y0, bw, bh, cols, rows, D, 0.02, 0.5, s, 1);

    // zunchos del lote
    const sp = easeOut(prog(s, 0.52, 0.6));
    if (sp > 0) {
      ctx.save();
      ctx.globalAlpha *= sp;
      strap(ctx, x0, y0, LW, LH, D, 0.22);
      strap(ctx, x0, y0, LW, LH, D, 0.78);
      ctx.restore();
    }

    // cotas: largo 2,8 m y sección 1×4
    const cp = easeOut(prog(s, 0.56, 0.68));
    if (cp > 0) {
      ctx.save();
      ctx.globalAlpha *= cp;
      const len = Math.hypot(D.x, D.y);
      const nx = D.y / len, ny = -D.x / len; // normal hacia arriba-izquierda
      const ax = x0 + nx * 22, ay = y0 - LH + ny * 22;
      const bx = ax + D.x * cp, by = ay + D.y * cp;
      ctx.strokeStyle = C.cream;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      ctx.moveTo(ax - nx * 8, ay - ny * 8); ctx.lineTo(ax + nx * 8, ay + ny * 8);
      ctx.moveTo(bx - nx * 8, by - ny * 8); ctx.lineTo(bx + nx * 8, by + ny * 8);
      ctx.stroke();
      ctx.save();
      ctx.translate((ax + bx) / 2 + nx * 16, (ay + by) / 2 + ny * 16);
      ctx.rotate(Math.atan2(D.y, D.x));
      ctx.fillStyle = C.cream;
      ctx.font = `800 24px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('2,8 m', 0, 0);
      ctx.restore();
      // sección de una tabla
      const tx = x0 + (cols - 1) * bw, ty = y0 - bh;
      ctx.strokeStyle = C.lime;
      ctx.lineWidth = 3;
      ctx.strokeRect(tx, ty, bw, bh);
      ctx.beginPath();
      ctx.moveTo(tx + bw, ty + bh / 2);
      ctx.lineTo(tx + bw + 44, ty + bh / 2 + 4);
      ctx.stroke();
      ctx.fillStyle = C.lime;
      ctx.font = `900 26px ${FONT}`;
      ctx.fillText('1×4"', tx + bw + 50, ty + bh / 2 + 13);
      ctx.restore();
    }
    // etiqueta del lote
    const tp = easeBack(prog(s, 0.6, 0.7));
    if (tp > 0) {
      ctx.save();
      ctx.translate(a.x + 300, a.y + 8);
      ctx.scale(tp, tp);
      pill(ctx, 0, 0, 'LOTE · TABLAS 1×4', C.lime, '#0b2b20', 16);
      ctx.restore();
    }

    // --- Vigas y postes ---
    const gp = prog(s, 0.68, 0.9);
    if (gp > 0) {
      const d2 = { x: 110, y: -55 };
      const by = a.y + 392;
      lumberLot(ctx, a.x + 20, by, 28, 68, 3, 1, d2, 0.68, 0.8, s, 40);
      lumberLot(ctx, a.x + 290, by, 34, 34, 3, 2, d2, 0.76, 0.9, s, 60);
      ctx.save();
      ctx.globalAlpha *= easeOut(prog(s, 0.74, 0.84));
      ctx.fillStyle = C.cream;
      ctx.font = `800 20px ${FONT}`;
      ctx.fillText('Vigas', a.x + 20, by - 80);
      ctx.globalAlpha /= Math.max(1e-6, easeOut(prog(s, 0.74, 0.84)));
      ctx.globalAlpha *= easeOut(prog(s, 0.82, 0.92));
      ctx.fillText('Postes', a.x + 290, by - 78);
      ctx.restore();
    }
  }

  function outcomeBench(ctx, a, s) {
    const gy = a.y + a.h - 10;
    ground(ctx, a, gy);
    const bx = a.x + 40, bwid = 300;
    // patas
    const lp = easeOut(prog(s, 0, 0.2));
    ctx.fillStyle = '#5b6b66';
    [bx + 30, bx + bwid - 50].forEach((x) => ctx.fillRect(x, gy - 90 * lp, 20, 90 * lp));
    // asiento
    for (let k = 0; k < 3; k++) {
      const p = easeOut(prog(s, 0.18 + k * 0.08, 0.3 + k * 0.08));
      if (p <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= p;
      recycledFill(ctx, bx + (1 - p) * 200, gy - 104 - k * 0, bwid, 20, '#3fbf7f', k + 3);
      ctx.restore();
    }
    // respaldo
    const backL = easeOut(prog(s, 0.4, 0.5));
    ctx.fillStyle = '#5b6b66';
    [bx + 34, bx + bwid - 46].forEach((x) => ctx.fillRect(x, gy - 104 - 110 * backL, 12, 110 * backL));
    for (let k = 0; k < 2; k++) {
      const p = easeOut(prog(s, 0.45 + k * 0.08, 0.57 + k * 0.08));
      if (p <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= p;
      recycledFill(ctx, bx + (1 - p) * 200, gy - 150 - k * 46, bwid, 22, '#2fa86c', k + 9);
      ctx.restore();
    }
    // jardinera
    const pp = easeBack(prog(s, 0.62, 0.74));
    if (pp > 0) {
      const px = bx + bwid + 40, pw = 120, ph = 80;
      ctx.save();
      ctx.translate(px + pw / 2, gy);
      ctx.scale(pp, pp);
      recycledFill(ctx, -pw / 2, -ph, pw, ph, '#2fa86c', 14);
      ctx.fillStyle = '#5a3d26';
      ctx.fillRect(-pw / 2 + 8, -ph, pw - 16, 10);
      ctx.restore();
      // planta
      const g = easeOut(prog(s, 0.72, 0.95));
      if (g > 0) {
        const cx = px + pw / 2, by = gy - ph;
        ctx.strokeStyle = '#7ccf5a';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, by);
        ctx.lineTo(cx, by - 130 * g);
        ctx.stroke();
        ctx.fillStyle = C.lime;
        [[-1, 0.45], [1, 0.62], [-1, 0.8], [1, 0.95]].forEach(([dir, at]) => {
          const lg = easeBack(prog(g, at - 0.25, at));
          if (lg <= 0) return;
          ctx.beginPath();
          ctx.ellipse(cx + dir * 22 * lg, by - 130 * at + 5, 24 * lg, 11 * lg, dir * -0.5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.beginPath();
        ctx.arc(cx, by - 136 * g, 16 * g, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // farol
    const fp = easeOut(prog(s, 0.05, 0.25));
    ctx.fillStyle = '#5b6b66';
    const lx = a.x + a.w - 40;
    ctx.fillRect(lx, gy - 300 * fp, 10, 300 * fp);
    if (fp >= 1) {
      const on = prog(s, 0.85, 0.95);
      ctx.fillStyle = '#5b6b66';
      ctx.fillRect(lx - 40, gy - 300, 50, 10);
      ctx.fillStyle = `rgba(255,224,130,${0.3 + 0.7 * on})`;
      ctx.beginPath();
      ctx.arc(lx - 34, gy - 282, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function outcomeLab(ctx, a, s, t) {
    // matraz
    const fx = a.x + 110, fy = a.y + a.h - 10;
    const flask = () => {
      ctx.beginPath();
      ctx.moveTo(fx - 24, fy - 260);
      ctx.lineTo(fx - 24, fy - 170);
      ctx.lineTo(fx - 100, fy);
      ctx.lineTo(fx + 100, fy);
      ctx.lineTo(fx + 24, fy - 170);
      ctx.lineTo(fx + 24, fy - 260);
      ctx.closePath();
    };
    ctx.save();
    flask();
    ctx.clip();
    const lvl = easeOut(prog(s, 0, 0.3)) * 130;
    ctx.fillStyle = 'rgba(43,182,115,0.85)';
    ctx.fillRect(fx - 110, fy - lvl, 220, lvl);
    // burbujas
    for (let k = 0; k < 10; k++) {
      const ph = (t * 0.7 + k * 0.137) % 1;
      const by = fy - ph * lvl;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(fx - 60 + ((k * 37) % 120), by, 4 + (k % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = C.cream;
    flask();
    ctx.stroke();
    // red molecular
    const nodes = [[290, 40], [360, 10], [430, 45], [430, 120], [360, 155], [290, 120], [500, 10], [500, 150]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [2, 6], [3, 7]];
    const np = prog(s, 0.2, 0.6);
    ctx.strokeStyle = C.teal;
    ctx.lineWidth = 4;
    edges.forEach(([i, j], k) => {
      const e = prog(np, k / edges.length, (k + 1) / edges.length);
      if (e <= 0) return;
      const [x1, y1] = nodes[i], [x2, y2] = nodes[j];
      ctx.beginPath();
      ctx.moveTo(a.x + x1, a.y + y1);
      ctx.lineTo(a.x + lerp(x1, x2, e), a.y + lerp(y1, y2, e));
      ctx.stroke();
    });
    nodes.forEach(([x, y], k) => {
      const e = easeBack(prog(np, k / nodes.length - 0.05, k / nodes.length + 0.1));
      if (e <= 0) return;
      ctx.fillStyle = k > 5 ? C.lime : C.cream;
      ctx.beginPath();
      ctx.arc(a.x + x, a.y + y, 11 * e, 0, Math.PI * 2);
      ctx.fill();
    });
    // gráfico de desempeño
    const gx = a.x + 270, gy = a.y + a.h - 10, gw = 250;
    ctx.strokeStyle = 'rgba(244,241,232,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy - 160); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw, gy);
    ctx.stroke();
    const vals = [0.3, 0.45, 0.6, 0.8, 0.95];
    vals.forEach((v, k) => {
      const p = easeOut(prog(s, 0.5 + k * 0.07, 0.62 + k * 0.07));
      ctx.fillStyle = k === vals.length - 1 ? C.lime : 'rgba(43,182,115,0.8)';
      ctx.fillRect(gx + 16 + k * 46, gy - 150 * v * p, 32, 150 * v * p);
    });
    const tp = easeBack(prog(s, 0.88, 0.98));
    if (tp > 0) {
      ctx.save();
      ctx.translate(gx + gw - 70, gy - 172);
      ctx.scale(tp, tp);
      pill(ctx, -50, -18, 'PROTOTIPO', C.lime, '#0b2b20', 16);
      ctx.restore();
    }
  }

  function outcomeDigital(ctx, a, s) {
    const mx = a.x + 20, my = a.y + 5, mw = a.w - 40, mh = a.h - 50;
    const ap = easeOut(prog(s, 0, 0.12));
    ctx.save();
    ctx.globalAlpha *= ap;
    ctx.fillStyle = '#0b2019';
    ctx.strokeStyle = C.cream;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(mx, my, mw, mh, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.cream;
    ctx.fillRect(mx + mw / 2 - 40, my + mh + 6, 80, 8);
    ctx.fillRect(mx + mw / 2 - 6, my + mh, 12, 10);
    // barra superior de la app
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.roundRect(mx + 12, my + 12, mw - 24, 46, 8);
    ctx.fill();
    ctx.fillStyle = '#0b2b20';
    ctx.font = `800 20px ${FONT}`;
    ctx.fillText('Ley REP · Panel de cumplimiento', mx + 30, my + 42);
    const rows = ['Trazabilidad del residuo', 'Metas de valorización', 'Reporte a la autoridad', 'Certificado emitido'];
    rows.forEach((label, k) => {
      const y = my + 86 + k * 58;
      const p = prog(s, 0.15 + k * 0.15, 0.3 + k * 0.15);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.roundRect(mx + 12, y, mw - 24, 46, 8);
      ctx.fill();
      ctx.strokeStyle = p >= 1 ? C.lime : 'rgba(244,241,232,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(mx + 26, y + 11, 24, 24, 5);
      ctx.stroke();
      if (p >= 1) {
        ctx.strokeStyle = C.lime;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(mx + 31, y + 23); ctx.lineTo(mx + 37, y + 30); ctx.lineTo(mx + 47, y + 15);
        ctx.stroke();
      }
      ctx.fillStyle = C.cream;
      ctx.font = `600 19px ${FONT}`;
      ctx.fillText(label, mx + 64, y + 30);
      const bxx = mx + mw - 150;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(bxx, y + 19, 120, 8);
      ctx.fillStyle = C.lime;
      ctx.fillRect(bxx, y + 19, 120 * easeInOut(p), 8);
    });
    ctx.restore();
    // timbre
    const sp = prog(s, 0.85, 0.95);
    if (sp > 0) {
      const sc = lerp(2.2, 1, easeOut(sp));
      ctx.save();
      ctx.globalAlpha *= sp;
      ctx.translate(mx + mw - 120, my + mh - 50);
      ctx.rotate(-0.15);
      ctx.scale(sc, sc);
      ctx.strokeStyle = C.lime;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(-95, -32, 190, 64, 10);
      ctx.stroke();
      ctx.fillStyle = C.lime;
      ctx.font = `900 34px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('CUMPLE ✓', 0, 12);
      ctx.restore();
    }
  }

  const OUTCOMES = [outcomeConstruction, outcomeBench, outcomeLab, outcomeDigital];

  function drawOutro(ctx, t) {
    const t0 = SCHED.outro;
    const d = easeOut(prog(t, t0, t0 + 0.6));
    if (d <= 0) return;
    ctx.save();
    ctx.fillStyle = `rgba(7,26,21,${0.94 * d})`;
    ctx.fillRect(0, 0, W, H);
    const a = easeOut(prog(t, t0 + 0.3, t0 + 1.1));
    ctx.globalAlpha = a;
    const lh = 250;
    const lw = (613 / 283) * lh;
    const sc = lerp(0.92, 1, a);
    ctx.translate(W / 2, 470);
    ctx.scale(sc, sc);
    drawLogo(ctx, -lw / 2, -lh / 2, lh, 'text_light', 0.06 * pulseIn(t, t0 + 1.0, t0 + 2.0));
    ctx.restore();
    const b = easeOut(prog(t, t0 + 0.8, t0 + 1.5));
    ctx.save();
    ctx.globalAlpha = b;
    ctx.translate(0, (1 - b) * 16);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.cream;
    ctx.font = `800 38px ${FONT}`;
    ctx.fillText('Tomamos el plástico problemático y lo reconvertimos en soluciones.', W / 2, 700);
    ctx.fillStyle = C.lime;
    ctx.font = `600 26px ${FONT}`;
    ctx.fillText(SCHED.rounds.map((i) => SOLUTIONS[i].title).join('  ·  '), W / 2, 752);
    ctx.restore();
  }

  // ---------- Intro: línea de tiempo 2015 – 2026 ----------
  const TL_Y = 560, TL_X0 = 200, TL_DX = 217;
  const TL_T0 = 2.0, TL_STEP = 1.15;
  const MILESTONES = [
    { year: '2015', lines: ['Fundación', 'Desafío Ambiente'], visual: 'hist_desafio_2015' },
    { year: '2019', lines: ['Incorporación', 'innovación I+D', 'Crisis social'], visual: 'hist_aislapet' },
    { year: '2020', lines: ['Transformación del', 'modelo de negocios', 'Ley REP', 'Maderas plásticas'], visual: 'bulb' },
    { year: '2021', lines: ['Entrada a retail', 'Estrategias con foco', 'en sostenibilidad'], visual: 'hist_everwood' },
    { year: '2022', lines: ['Expansión internacional', 'Aumento de clientes', 'Nuevas marcas', 'Nuevas filiales'], visual: 'globe' },
    { year: '2023 – 2024', lines: ['Lanzamiento Perú', 'Softlanding USA', 'Rebranding', 'Ser referente'], visual: 'logo' },
    { year: '2025', lines: ['Foco en proyectos', 'de alto impacto', 'Multiplicador y', 'valor compartido'], visual: 'network' },
    { year: '2026', lines: ['Link circular'], visual: 'link', final: true },
  ];
  const PHASES = [
    { label: 'Reciclaje', from: 0, to: 1 },
    { label: 'Valorización', from: 2, to: 3 },
    { label: 'Valor compartido', from: 4, to: 5 },
    { label: 'Ecosistema circular', from: 6, to: 7 },
  ];
  const nodeX = (k) => TL_X0 + k * TL_DX;
  const nodeT = (k) => TL_T0 + k * TL_STEP;

  // posición de la cabeza de la línea (se detiene un instante en cada hito)
  function tlHead(t) {
    if (t <= TL_T0) return { x: TL_X0 - 80 + 80 * easeOut(prog(t, TL_T0 - 0.6, TL_T0)), k: -1 + (t >= TL_T0 ? 1 : 0) };
    const last = MILESTONES.length - 1;
    const f = Math.min(last, (t - TL_T0) / TL_STEP);
    const k = Math.floor(f);
    const x = k >= last ? nodeX(last) : lerp(nodeX(k), nodeX(k + 1), easeInOut(clamp((f - k - 0.35) / 0.65)));
    return { x, k };
  }

  function strokeIcon(ctx, col) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  function iconBulb(ctx, col) {
    strokeIcon(ctx, col);
    ctx.beginPath();
    ctx.arc(0, -12, 30, Math.PI * 0.8, Math.PI * 2.2);
    ctx.lineTo(14, 26);
    ctx.lineTo(-14, 26);
    ctx.closePath();
    ctx.moveTo(-12, 36); ctx.lineTo(12, 36);
    ctx.moveTo(-8, 45); ctx.lineTo(8, 45);
    ctx.moveTo(-6, 0); ctx.lineTo(0, 10); ctx.lineTo(6, 0);
    ctx.stroke();
  }
  function iconGlobe(ctx, col) {
    strokeIcon(ctx, col);
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.moveTo(0, -42); ctx.ellipse(0, 0, 18, 42, 0, -Math.PI / 2, Math.PI * 1.5);
    ctx.moveTo(-42, 0); ctx.lineTo(42, 0);
    ctx.moveTo(-36, -20); ctx.lineTo(36, -20);
    ctx.moveTo(-36, 20); ctx.lineTo(36, 20);
    ctx.stroke();
    // avión
    ctx.save();
    ctx.translate(32, -36);
    ctx.rotate(-0.6);
    ctx.fillStyle = C.lime;
    ctx.beginPath();
    ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.lineTo(20, 3); ctx.lineTo(16, 5); ctx.lineTo(-16, 5);
    ctx.moveTo(0, 0); ctx.lineTo(-6, -14); ctx.lineTo(-1, -14); ctx.lineTo(8, 0);
    ctx.moveTo(0, 5); ctx.lineTo(-6, 19); ctx.lineTo(-1, 19); ctx.lineTo(8, 5);
    ctx.fill();
    ctx.restore();
  }
  function iconNetwork(ctx, col) {
    const pts = [[0, 0], [-40, -26], [36, -32], [44, 18], [-30, 34], [6, 46], [-48, 6]];
    strokeIcon(ctx, col);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    pts.slice(1).forEach(([x, y]) => { ctx.moveTo(0, 0); ctx.lineTo(x, y); });
    [[1, 6], [2, 3], [4, 5], [3, 5], [1, 2]].forEach(([a, b]) => { ctx.moveTo(...pts[a]); ctx.lineTo(...pts[b]); });
    ctx.stroke();
    pts.forEach(([x, y], k) => {
      ctx.fillStyle = k === 0 ? C.lime : col;
      ctx.beginPath();
      ctx.arc(x, y, k === 0 ? 10 : 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function iconLink(ctx, col) {
    strokeIcon(ctx, col);
    ctx.lineWidth = 7;
    ctx.save();
    ctx.rotate(-0.6);
    ctx.beginPath();
    ctx.roundRect(-44, -15, 52, 30, 15);
    ctx.roundRect(-8, -15, 52, 30, 15);
    ctx.stroke();
    ctx.restore();
  }
  function drawVisual(ctx, m, x, y, k) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    const img = (key, w) => {
      const im = LOGO[key];
      const h = (w * im.naturalHeight) / im.naturalWidth;
      ctx.drawImage(im, -w / 2, -h / 2, w, h);
    };
    if (m.visual === 'hist_desafio_2015') img(m.visual, 190);
    else if (m.visual === 'hist_aislapet') img(m.visual, 150);
    else if (m.visual === 'hist_everwood') img(m.visual, 140);
    else if (m.visual === 'logo') {
      const h = 66, w = (613 / 283) * h;
      drawLogo(ctx, -w / 2, -h / 2, h, 'text_light');
    } else if (m.visual === 'bulb') iconBulb(ctx, C.cream);
    else if (m.visual === 'globe') iconGlobe(ctx, C.cream);
    else if (m.visual === 'network') iconNetwork(ctx, C.cream);
    else if (m.visual === 'link') iconLink(ctx, C.lime);
    ctx.restore();
  }

  function drawTimeline(ctx, t) {
    drawBackground(ctx, t);
    const head = tlHead(t);
    const last = MILESTONES.length - 1;
    const reached = (k) => t >= nodeT(k);

    // encabezado: contador de años
    const ha = easeOut(prog(t, 0.2, 1.0));
    // años transcurridos según la posición de la cabeza sobre la línea
    const YEARS = [2015, 2019, 2020, 2021, 2022, 2024, 2025, 2026];
    const f = clamp((head.x - TL_X0) / TL_DX, 0, last);
    const fk = Math.min(last - 1, Math.floor(f));
    const yearsNow = Math.round(lerp(YEARS[fk], YEARS[fk + 1], f - fk)) - 2015;
    ctx.save();
    ctx.globalAlpha = ha;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.muted;
    ctx.font = `700 22px ${FONT}`;
    ctx.letterSpacing = '6px';
    ctx.fillText('HOLDING DESAFÍO AMBIENTE · 2015 – 2026', W / 2 + 3, 70);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = C.cream;
    ctx.font = `900 84px ${FONT}`;
    ctx.fillText(`${yearsNow} ${yearsNow === 1 ? 'año' : 'años'}`, W / 2, 162);
    ctx.fillStyle = C.lime;
    ctx.font = `600 30px ${FONT}`;
    ctx.fillText('incorporando nuevas problemáticas para atender al mercado', W / 2, 212);
    ctx.restore();

    // línea base y progreso
    const la = easeOut(prog(t, 0.8, 1.6));
    ctx.save();
    ctx.globalAlpha = la;
    ctx.strokeStyle = 'rgba(244,241,232,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(TL_X0 - 80, TL_Y); ctx.lineTo(nodeX(last) + 80, TL_Y);
    ctx.stroke();
    ctx.strokeStyle = C.lime;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(TL_X0 - 80, TL_Y); ctx.lineTo(head.x, TL_Y);
    ctx.stroke();
    ctx.restore();

    // hitos
    MILESTONES.forEach((m, k) => {
      const x = nodeX(k);
      const tk = nodeT(k);
      const above = k % 2 === 1;
      // nodo (rombo)
      const np = easeBack(prog(t, tk - 0.1, tk + 0.3));
      ctx.save();
      ctx.globalAlpha = la;
      ctx.translate(x, TL_Y);
      ctx.rotate(Math.PI / 4);
      const sz = reached(k) ? 9 + 4 * np : 7;
      ctx.fillStyle = reached(k) ? (m.final ? C.lime : C.cream) : 'rgba(244,241,232,0.35)';
      ctx.fillRect(-sz, -sz, sz * 2, sz * 2);
      ctx.restore();
      // halo al llegar
      const hp = prog(t, tk, tk + 0.6);
      if (hp > 0 && hp < 1) {
        ctx.strokeStyle = `rgba(182,227,90,${1 - hp})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, TL_Y, 14 + 40 * hp, 0, Math.PI * 2);
        ctx.stroke();
      }
      // texto
      const ta = easeOut(prog(t, tk + 0.05, tk + 0.55));
      if (ta > 0) {
        ctx.save();
        ctx.globalAlpha = ta;
        ctx.textAlign = 'center';
        const dy = (1 - ta) * (above ? 14 : -14);
        const yYear = above ? TL_Y - 60 - m.lines.length * 27 : TL_Y + 70;
        ctx.fillStyle = m.final ? C.lime : C.cream;
        ctx.font = `800 ${m.year.length > 4 ? 30 : 36}px ${FONT}`;
        ctx.fillText(m.year, x, yYear + dy);
        ctx.fillStyle = m.final ? C.lime : C.muted;
        ctx.font = m.final ? `800 30px ${FONT}` : `500 18px ${FONT}`;
        m.lines.forEach((ln, i) => ctx.fillText(m.final ? ln.toUpperCase() : ln, x, yYear + (m.final ? 44 : 34) + i * 27 + dy));
        ctx.restore();
      }
      // visual (logo o ícono) en el lado opuesto
      const vp = easeBack(prog(t, tk + 0.15, tk + 0.65));
      if (vp > 0) {
        ctx.save();
        ctx.globalAlpha = clamp(vp);
        drawVisual(ctx, m, x, above ? TL_Y + 95 : TL_Y - 100, 0.6 + 0.4 * vp);
        ctx.restore();
      }
    });

    // fases del recorrido
    const py = 860;
    const pa = easeOut(prog(t, 1.2, 2.0));
    ctx.save();
    ctx.globalAlpha = pa;
    ctx.strokeStyle = 'rgba(182,227,90,0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([3, 9]);
    ctx.beginPath();
    ctx.moveTo(TL_X0 - 40, py); ctx.lineTo(nodeX(last) + 60, py);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = C.lime;
    ctx.setLineDash([3, 9]);
    ctx.beginPath();
    ctx.moveTo(TL_X0 - 40, py); ctx.lineTo(Math.max(TL_X0 - 40, head.x + 20), py);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.lime;
    ctx.beginPath();
    ctx.moveTo(nodeX(last) + 72, py); ctx.lineTo(nodeX(last) + 56, py - 8); ctx.lineTo(nodeX(last) + 56, py + 8);
    ctx.fill();
    PHASES.forEach((p) => {
      const cxp = (nodeX(p.from) + nodeX(p.to)) / 2;
      const on = easeOut(prog(t, nodeT(p.from), nodeT(p.from) + 0.5));
      ctx.textAlign = 'center';
      ctx.font = `900 34px ${FONT}`;
      ctx.fillStyle = on > 0 ? `rgba(244,241,232,${0.25 + 0.75 * on})` : 'rgba(244,241,232,0.25)';
      ctx.fillText(p.label.toUpperCase(), cxp, py + 62);
    });
    ctx.restore();

    // remate y paso al corazón de Desafío
    const ca = easeOut(prog(t, 11.9, 12.6));
    if (ca > 0) {
      ctx.save();
      ctx.globalAlpha = ca;
      ctx.textAlign = 'center';
      ctx.fillStyle = C.cream;
      ctx.font = `800 34px ${FONT}`;
      ctx.fillText('Cada problemática se volvió una solución. Hoy, todo pasa por el corazón de Desafío.', W / 2, 1020);
      ctx.restore();
    }
    const fade = Math.max(1 - prog(t, 0, 0.3), prog(t, TL - 0.7, TL));
    if (fade > 0) {
      ctx.fillStyle = `rgba(7,26,21,${fade})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function renderFrame(t) {
    const ctx = document.getElementById('stage').getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'left';
    drawBackground(ctx, t);
    drawTitle(ctx, t);
    drawProblemCard(ctx, t);
    drawConnectors(ctx, t);
    drawBelt(ctx, t);
    drawItems(ctx, t);
    drawPellets(ctx, t);
    drawBox(ctx, t);
    drawTicket(ctx, t);
    drawProcessSteps(ctx, t);
    drawCards(ctx, t);
    drawOutro(ctx, t);
    // fundido de entrada / salida
    const fade = Math.max(1 - prog(t, 0, 0.3), prog(t, SCHED.dur - SCHED.intro - 0.4, SCHED.dur - SCHED.intro));
    if (fade > 0) {
      ctx.fillStyle = `rgba(7,26,21,${fade})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  window.MOTION = { FPS, W, H, duration: (s) => schedFor(s).dur, ready: logosReady };
  function renderAll(t) {
    if (t < SCHED.intro) {
      const ctx = document.getElementById('stage').getContext('2d');
      ctx.save();
      ctx.textAlign = 'left';
      drawTimeline(ctx, t);
      ctx.restore();
    } else renderFrame(t - SCHED.intro);
  }
  window.renderFrame = (t, s) => {
    SCHED = schedFor(s);
    renderAll(t);
  };

  // ---------- Vista previa ----------
  const params = new URLSearchParams(location.search);
  if (params.has('render')) {
    document.body.classList.add('render');
    return;
  }
  let sel = clamp(parseInt(params.get('s') || '0', 10) || 0, 0, 5);
  let start = performance.now();
  const buttons = document.querySelectorAll('#controls button');
  const mark = () => buttons.forEach((b) => b.classList.toggle('on', +b.dataset.s === sel));
  buttons.forEach((b) => b.addEventListener('click', () => { sel = +b.dataset.s; start = performance.now(); mark(); }));
  mark();
  Promise.all([document.fonts.ready, logosReady]).then(() => {
    const loop = (now) => {
      SCHED = schedFor(sel);
      renderAll(((now - start) / 1000) % SCHED.dur);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
})();
