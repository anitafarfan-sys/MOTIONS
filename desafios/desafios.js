// Motion "Los desafíos de Desafío Ambiente hoy"
// De la raíz (la demanda tracciona el plástico) a las 4 líneas de negocio,
// sus falencias y los 6 desafíos actuales de DA.
//
// Uso:
//   index.html                 -> vista previa (botones para saltar a cada capítulo)
//   window.renderFrame(t)      -> dibuja el frame en el segundo t (lo usa render.js)
//   window.MOTION.duration     -> duración total en segundos

(() => {
  const W = 1920, H = 1080;
  const FPS = 30;
  const FONT = 'Inter, "Liberation Sans", sans-serif';

  // ---------- Paleta (misma del motion "El corazón de Desafío Ambiente") ----------
  const C = {
    bg1: '#071a15',
    bg2: '#0f3a2e',
    grid: 'rgba(182,227,90,0.05)',
    green: '#2bb673',
    lime: '#b6e35a',
    teal: '#1fb6a6',
    brand: '#08a2a7',
    brandDark: '#067d81',
    gold: '#f5c542',
    goldDark: '#c8961c',
    cream: '#f4f1e8',
    muted: 'rgba(244,241,232,0.62)',
    faint: 'rgba(244,241,232,0.35)',
    red: '#ff5a4e',
    orange: '#ff9f43',
    card: 'rgba(255,255,255,0.06)',
    cardLine: 'rgba(244,241,232,0.16)',
    wood: '#8a6a4a',
  };

  // ---------- Contenido ----------
  const BUSINESSES = [
    {
      name: 'Everwood',
      industry: 'Construcción',
      role: 'Genera volumen de venta',
      pros: ['Durable', 'Sin mantención', 'Resistente a la humedad'],
      con: 'Costo del producto vs. sustituto',
      links: [3, 1],
      col: C.orange,
    },
    {
      name: 'La Tienda Sustentable',
      industry: 'Marketplace de equipamiento · B2B2C',
      role: 'Genera el margen: 20–30 %',
      pros: ['Marketplace de equipamiento', 'Foco B2B2C', 'Tracciona ventas'],
      con: 'La adopción es lenta',
      links: [2, 1],
      col: C.teal,
    },
    {
      name: 'Desafío Lab',
      industry: 'I+D y residuos sin solución tradicional',
      role: 'Ticket alto',
      pros: ['Intensivo en horas mujer', 'Poco uso de infraestructura', 'Resuelve lo que el mercado tradicional no'],
      con: 'Proyectos a medida: cuesta empaquetarlos y hacerlos recurrentes',
      links: [2, 4],
      col: C.lime,
    },
    {
      name: 'Inteligencia de datos',
      industry: 'Spin-off de Desafío · Empresas',
      role: 'Plataforma inteligente',
      pros: ['Adopción de Economía Circular', 'Planes de sostenibilidad corporativa', 'Base: cumplimiento normativo'],
      con: 'Requiere inversión para escalar en LATAM',
      links: [5, 6],
      col: C.brand,
    },
  ];

  const CHALLENGES = [
    { title: 'Runway de 6 meses', text: 'Levantar las líneas de negocio que dan flujo de caja', icon: 'hourglass', col: C.red },
    { title: 'Recurrencia', text: 'Determinar y empaquetar negocios que generen ingresos recurrentes', icon: 'loop', col: C.orange },
    { title: 'Absorción de plástico', text: 'Incrementar la tasa de absorción y evitar el destino a relleno', icon: 'gauge', col: C.teal },
    { title: 'Pilar Transformo', text: 'Fortalecer el corazón del negocio: shit in → gold out!', icon: 'gold', col: C.gold },
    { title: 'Reorganizar y crecer en LATAM', text: 'Reordenar las líneas de negocio y apalancar inversión', icon: 'growth', col: C.lime },
    { title: 'Socios con impacto real', text: 'Inversionistas con visión de impacto real', icon: 'partners', col: C.green },
  ];

  // ---------- Línea de tiempo (capítulos) ----------
  const SCENES = [
    { id: 'intro', label: 'Inicio', dur: 5.5 },
    { id: 'root', label: 'La raíz', dur: 18 },
    { id: 'tree', label: '4 líneas', dur: 10 },
    { id: 'biz0', label: 'Everwood', dur: 11 },
    { id: 'biz1', label: 'Tienda', dur: 11 },
    { id: 'biz2', label: 'Lab', dur: 11 },
    { id: 'biz3', label: 'Datos', dur: 11 },
    { id: 'chal', label: '6 desafíos', dur: 24 },
    { id: 'outro', label: 'Cierre', dur: 8 },
  ];
  let acc = 0;
  for (const s of SCENES) { s.start = acc; acc += s.dur; }
  const DURATION = acc;

  // ---------- Utilidades ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const easeBack = (k) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
  };
  const hash = (i) => {
    let x = (i + 1) * 2654435761;
    x ^= x >>> 13; x = Math.imul(x, 1274126177); x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  };

  function text(ctx, s, x, y, size, weight = 600, color = C.cream, align = 'left') {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(s, x, y);
    ctx.textAlign = 'left';
  }
  function wrap(ctx, s, x, y, maxW, lh, size, weight = 600, color = C.cream, align = 'left') {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let line = '';
    let yy = y;
    for (const w of s.split(' ')) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, yy);
        line = w;
        yy += lh;
      } else line = test;
    }
    ctx.fillText(line, x, yy);
    ctx.textAlign = 'left';
    return yy;
  }
  function pill(ctx, x, y, s, bg, fg, size = 18, align = 'left') {
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(s).width + size * 1.4;
    const h = size * 1.9;
    const xx = align === 'center' ? x - w / 2 : x;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(xx, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textBaseline = 'middle';
    ctx.fillText(s, xx + size * 0.7, y + h / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    return w;
  }
  function card(ctx, x, y, w, h, r = 22, fill = C.card, line = C.cardLine) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (line) {
      ctx.strokeStyle = line;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  function bez(p0, p1, p2, p3, u) {
    const m = 1 - u;
    return {
      x: m * m * m * p0.x + 3 * m * m * u * p1.x + 3 * m * u * u * p2.x + u * u * u * p3.x,
      y: m * m * m * p0.y + 3 * m * m * u * p1.y + 3 * m * u * u * p2.y + u * u * u * p3.y,
    };
  }
  // Traza una curva bezier hasta la fracción k (para "dibujarla" en el tiempo).
  function bezStroke(ctx, p0, p1, p2, p3, k) {
    if (k <= 0) return;
    ctx.beginPath();
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const p = bez(p0, p1, p2, p3, (i / n) * k);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  // ---------- Logo ----------
  const LOGO = {};
  const logosReady = Promise.all(['mark', 'text_dark', 'text_light'].map((k) => new Promise((res) => {
    const img = new Image();
    img.onload = () => res();
    img.onerror = () => res();
    img.src = window.DA_LOGOS[k];
    LOGO[k] = img;
  })));
  // Lockup horizontal original: isotipo 207 px + texto 406 px, alto 283 px.
  const LOGO_RATIO = 613 / 283;
  function drawLogo(ctx, x, y, h, textKey, pulse = 0) {
    const k = h / 283;
    const mw = 207 * k, tw = 406 * k;
    ctx.save();
    ctx.translate(x + mw / 2, y + h / 2);
    ctx.scale(1 + pulse, 1 + pulse);
    ctx.drawImage(LOGO.mark, -mw / 2, -h / 2, mw, h);
    ctx.restore();
    ctx.drawImage(LOGO[textKey], x + mw, y, tw, h);
  }
  function drawMark(ctx, cx, cy, h, pulse = 0) {
    const mw = (207 / 283) * h;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1 + pulse, 1 + pulse);
    ctx.drawImage(LOGO.mark, -mw / 2, -h / 2, mw, h);
    ctx.restore();
  }
  const beat = (t) => {
    const p = t % 1.1;
    return Math.max(Math.exp(-Math.pow((p - 0.08) / 0.06, 2)), 0.7 * Math.exp(-Math.pow((p - 0.3) / 0.07, 2)));
  };

  // ---------- Íconos ----------
  function iconCheck(ctx, x, y, r, col = C.green) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.bg1;
    ctx.lineWidth = r * 0.28;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.45, y + r * 0.02);
    ctx.lineTo(x - r * 0.1, y + r * 0.38);
    ctx.lineTo(x + r * 0.5, y - r * 0.35);
    ctx.stroke();
  }
  function iconWarn(ctx, x, y, s, col = C.red) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.62);
    ctx.lineTo(x + s * 0.6, y + s * 0.45);
    ctx.lineTo(x - s * 0.6, y + s * 0.45);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.lineWidth = s * 0.12;
    ctx.strokeStyle = col;
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = C.bg1;
    ctx.fillRect(x - s * 0.055, y - s * 0.28, s * 0.11, s * 0.42);
    ctx.beginPath();
    ctx.arc(x, y + s * 0.3, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  function iconPerson(ctx, x, y, s, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y - s * 0.62, s * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x - s * 0.32, y - s * 0.32, s * 0.64, s * 0.62, [s * 0.3, s * 0.3, s * 0.06, s * 0.06]);
    ctx.fill();
  }
  function iconBottle(ctx, x, y, s, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = 'rgba(120,190,255,0.9)';
    ctx.beginPath();
    ctx.roundRect(-s * 0.22, -s * 0.4, s * 0.44, s * 0.8, s * 0.12);
    ctx.fill();
    ctx.fillRect(-s * 0.1, -s * 0.55, s * 0.2, s * 0.18);
    ctx.fillStyle = C.red;
    ctx.fillRect(-s * 0.12, -s * 0.62, s * 0.24, s * 0.1);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(-s * 0.22, -s * 0.12, s * 0.44, s * 0.18);
    ctx.restore();
  }
  function iconBag(ctx, x, y, s, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = 'rgba(240,240,240,0.9)';
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, s * 0.4);
    ctx.lineTo(-s * 0.32, -s * 0.2);
    ctx.lineTo(-s * 0.2, -s * 0.2);
    ctx.quadraticCurveTo(-s * 0.2, -s * 0.5, -s * 0.05, -s * 0.45);
    ctx.lineTo(-s * 0.08, -s * 0.2);
    ctx.lineTo(s * 0.08, -s * 0.2);
    ctx.lineTo(s * 0.05, -s * 0.45);
    ctx.quadraticCurveTo(s * 0.2, -s * 0.5, s * 0.2, -s * 0.2);
    ctx.lineTo(s * 0.32, -s * 0.2);
    ctx.lineTo(s * 0.4, s * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function iconCup(ctx, x, y, s, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.moveTo(-s * 0.32, -s * 0.38);
    ctx.lineTo(s * 0.32, -s * 0.38);
    ctx.lineTo(s * 0.22, s * 0.4);
    ctx.lineTo(-s * 0.22, s * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(-s * 0.36, -s * 0.46, s * 0.72, s * 0.1);
    ctx.restore();
  }
  const TRASH = [iconBottle, iconBag, iconCup];
  function ingot(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    const g = ctx.createLinearGradient(0, -s * 0.3, 0, s * 0.3);
    g.addColorStop(0, '#ffe58a');
    g.addColorStop(1, C.goldDark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-s * 0.32, -s * 0.22);
    ctx.lineTo(s * 0.32, -s * 0.22);
    ctx.lineTo(s * 0.48, s * 0.24);
    ctx.lineTo(-s * 0.48, s * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(-s * 0.24, -s * 0.16, s * 0.3, s * 0.06);
    ctx.restore();
  }
  function challengeIcon(ctx, kind, x, y, s, col, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = s * 0.09;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (kind === 'hourglass') {
      ctx.beginPath();
      ctx.moveTo(-s * 0.32, -s * 0.45); ctx.lineTo(s * 0.32, -s * 0.45);
      ctx.moveTo(-s * 0.32, s * 0.45); ctx.lineTo(s * 0.32, s * 0.45);
      ctx.moveTo(-s * 0.25, -s * 0.45); ctx.lineTo(s * 0.25, s * 0.45);
      ctx.moveTo(s * 0.25, -s * 0.45); ctx.lineTo(-s * 0.25, s * 0.45);
      ctx.stroke();
      const k = (t * 0.25) % 1;
      ctx.beginPath();
      ctx.moveTo(-s * 0.18 * (1 - k), -s * 0.3 + s * 0.28 * k);
      ctx.lineTo(s * 0.18 * (1 - k), -s * 0.3 + s * 0.28 * k);
      ctx.lineTo(0, -s * 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s * 0.2 * k, s * 0.4);
      ctx.lineTo(s * 0.2 * k, s * 0.4);
      ctx.lineTo(0, s * 0.4 - s * 0.24 * k);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'loop') {
      ctx.rotate(t * 1.2);
      for (let i = 0; i < 2; i++) {
        ctx.rotate(Math.PI);
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.36, 0.25, Math.PI - 0.35);
        ctx.stroke();
        const ax = Math.cos(Math.PI - 0.35) * s * 0.36, ay = Math.sin(Math.PI - 0.35) * s * 0.36;
        ctx.beginPath();
        ctx.moveTo(ax - s * 0.16, ay - s * 0.02);
        ctx.lineTo(ax, ay);
        ctx.lineTo(ax + s * 0.04, ay - s * 0.17);
        ctx.stroke();
      }
    } else if (kind === 'gauge') {
      ctx.beginPath();
      ctx.arc(0, s * 0.12, s * 0.42, Math.PI, Math.PI * 2);
      ctx.stroke();
      const a = Math.PI + Math.PI * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.5)));
      ctx.beginPath();
      ctx.moveTo(0, s * 0.12);
      ctx.lineTo(Math.cos(a) * s * 0.34, s * 0.12 + Math.sin(a) * s * 0.34);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, s * 0.12, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'gold') {
      ingot(ctx, -s * 0.2, s * 0.22, s * 0.62);
      ingot(ctx, s * 0.2, s * 0.22, s * 0.62);
      ingot(ctx, 0, -s * 0.06, s * 0.62);
    } else if (kind === 'growth') {
      ctx.beginPath();
      ctx.moveTo(-s * 0.42, s * 0.38);
      ctx.lineTo(-s * 0.12, s * 0.05);
      ctx.lineTo(s * 0.06, s * 0.2);
      ctx.lineTo(s * 0.4, -s * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.16, -s * 0.32);
      ctx.lineTo(s * 0.42, -s * 0.34);
      ctx.lineTo(s * 0.4, -s * 0.08);
      ctx.stroke();
    } else if (kind === 'partners') {
      iconPerson(ctx, -s * 0.2, s * 0.22, s * 0.62, col);
      ctx.globalAlpha *= 0.75;
      iconPerson(ctx, s * 0.22, s * 0.26, s * 0.56, C.cream);
      ctx.globalAlpha /= 0.75;
      ctx.beginPath();
      ctx.arc(0, -s * 0.4, s * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = C.red;
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------- Fondo y marco ----------
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
  // Barra de capítulos al pie (se oculta en inicio y cierre).
  function drawChapters(ctx, t) {
    const cur = sceneAt(t);
    const vis = Math.min(prog(t, SCENES[1].start - 0.3, SCENES[1].start + 0.6), 1 - prog(t, SCENES[8].start - 0.6, SCENES[8].start));
    if (vis <= 0) return;
    ctx.save();
    ctx.globalAlpha = vis;
    const items = SCENES.slice(1, 8);
    const gap = 10, w = 168, x0 = W / 2 - (items.length * w + (items.length - 1) * gap) / 2, y = 1032;
    items.forEach((s, i) => {
      const x = x0 + i * (w + gap);
      const k = clamp((t - s.start) / s.dur);
      ctx.fillStyle = 'rgba(244,241,232,0.12)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, 6, 3);
      ctx.fill();
      if (k > 0) {
        ctx.fillStyle = s === cur ? C.lime : C.green;
        ctx.beginPath();
        ctx.roundRect(x, y, w * k, 6, 3);
        ctx.fill();
      }
      text(ctx, s.label, x + w / 2, y - 10, 15, s === cur ? 800 : 600, s === cur ? C.cream : C.faint, 'center');
    });
    // logo chico arriba a la derecha
    drawLogo(ctx, W - 64 - 54 * LOGO_RATIO, 34, 54, 'text_light', 0.06 * beat(t));
    ctx.restore();
  }
  function sceneTitle(ctx, lt, kicker, title, y = 110) {
    const a = easeOut(prog(lt, 0.1, 0.8));
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(0, (1 - a) * 18);
    text(ctx, kicker.toUpperCase(), 120, y - 52, 20, 800, C.lime);
    text(ctx, title, 120, y, 50, 800, C.cream);
    ctx.restore();
  }

  // ---------- Escena 1: inicio ----------
  function sceneIntro(ctx, lt) {
    const a = easeOut(prog(lt, 0.2, 1.2));
    const lh = 200, lw = LOGO_RATIO * lh;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(W / 2, 400);
    const sc = lerp(0.9, 1, a);
    ctx.scale(sc, sc);
    drawLogo(ctx, -lw / 2, -lh / 2, lh, 'text_light', 0.06 * beat(lt));
    ctx.restore();
    const b = easeOut(prog(lt, 1.2, 2.0));
    ctx.save();
    ctx.globalAlpha *= b;
    ctx.translate(0, (1 - b) * 20);
    text(ctx, 'Los desafíos de DA hoy', W / 2, 640, 72, 800, C.cream, 'center');
    text(ctx, 'Desde la raíz hasta los problemas de cada negocio', W / 2, 706, 32, 600, C.muted, 'center');
    ctx.restore();
    const c = easeOut(prog(lt, 2.4, 3.0));
    ctx.save();
    ctx.globalAlpha *= c;
    pill(ctx, W / 2, 770, 'shit in → gold out!', C.gold, C.bg1, 26, 'center');
    ctx.restore();
  }

  // ---------- Escena 2: la raíz ----------
  // El plástico llega; lo que absorbemos se transforma en producto para el
  // mercado; lo que no, termina en relleno. La absorción depende de la demanda.
  const ROOT = {
    src: { x: 150, y: 330 },
    split: { x: 560, y: 520 },
    box: { x: 860, y: 520, s: 250 },
    fill: { x: 470, y: 820 },
    market: { x: 1260, y: 330, w: 560, h: 380 },
  };
  const demandK = (lt) => easeInOut(prog(lt, 8.2, 13));
  const absorb = (lt) => lerp(0.3, 0.86, demandK(lt));
  function sceneRoot(ctx, lt) {
    sceneTitle(ctx, lt, 'La raíz', 'La demanda tracciona el plástico');
    const { src, split, box, fill, market } = ROOT;
    const ap = easeOut(prog(lt, 0.5, 1.4));
    ctx.save();
    ctx.globalAlpha *= ap;

    // Origen: residuo plástico
    text(ctx, 'Residuo plástico', src.x - 40, src.y - 90, 26, 800, C.cream);
    text(ctx, 'la basura de hoy', src.x - 40, src.y - 58, 20, 600, C.muted);

    // Relleno sanitario: crece con lo no absorbido
    const pileH = 40 + 120 * (prog(lt, 1.5, 8.2) * 0.75 + prog(lt, 8.2, 18) * 0.25);
    const mg = ctx.createLinearGradient(0, fill.y + 60 - pileH, 0, fill.y + 60);
    mg.addColorStop(0, '#7a3a2a');
    mg.addColorStop(1, '#3b1c16');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.moveTo(fill.x - 230, fill.y + 60);
    ctx.quadraticCurveTo(fill.x, fill.y + 60 - pileH * 2, fill.x + 230, fill.y + 60);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 26; i++) {
      const u = hash(i * 7 + 1), v = hash(i * 7 + 2);
      const px = fill.x - 170 + u * 340;
      const top = fill.y + 60 - pileH * 2 * (1 - Math.pow((px - fill.x) / 230, 2)) * 0.5;
      if (v < prog(lt, 1.5, 12)) TRASH[i % 3](ctx, px, lerp(top + 14, fill.y + 50, hash(i * 7 + 3) * 0.6), 30, u * 3);
    }
    text(ctx, 'Relleno sanitario', fill.x, fill.y + 100, 26, 800, C.red, 'center');

    // Medidor de absorción
    const gx = box.x - box.s / 2 - 10, gy = box.y + box.s / 2 + 110, gw = box.s + 60;
    text(ctx, 'Tasa de absorción de plástico', gx, gy - 16, 20, 700, C.muted);
    ctx.fillStyle = 'rgba(244,241,232,0.12)';
    ctx.beginPath();
    ctx.roundRect(gx, gy, gw, 18, 9);
    ctx.fill();
    const ab = absorb(lt);
    ctx.fillStyle = ab > 0.6 ? C.green : C.orange;
    ctx.beginPath();
    ctx.roundRect(gx, gy, gw * ab, 18, 9);
    ctx.fill();
    text(ctx, `${Math.round(ab * 100)} %`, gx + gw + 14, gy + 17, 26, 800, ab > 0.6 ? C.lime : C.orange);

    // Mercado: la población de demanda crece y se abre a LATAM
    card(ctx, market.x, market.y, market.w, market.h, 26);
    text(ctx, 'Demanda del mercado', market.x + 30, market.y + 50, 28, 800, C.cream);
    const nP = Math.round(lerp(8, 40, demandK(lt)));
    for (let i = 0; i < 40; i++) {
      const col = i % 10, row = Math.floor(i / 10);
      const pa = clamp((nP - i) * 1.0);
      if (pa <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= pa;
      iconPerson(ctx, market.x + 48 + col * 52, market.y + 120 + row * 58, 44, i < 8 ? C.cream : [C.teal, C.lime, C.green][i % 3]);
      ctx.restore();
    }
    const tags = ['Chile', 'Perú', 'Colombia', 'México', '+ LATAM'];
    let tx = market.x + 30;
    tags.forEach((s, i) => {
      const k = i === 0 ? 1 : easeBack(prog(lt, 8.6 + i * 0.6, 9.2 + i * 0.6));
      if (k <= 0) return;
      ctx.save();
      ctx.globalAlpha *= clamp(k);
      tx += pill(ctx, tx, market.y + market.h - 60, s, i === 0 ? C.brand : 'rgba(182,227,90,0.2)', i === 0 ? C.bg1 : C.lime, 18) + 10;
      ctx.restore();
    });

    // Flujo de partículas de plástico
    for (let i = 0; i < 260; i++) {
      const ts = 1.2 + i * 0.065;
      const age = lt - ts;
      if (age < 0) break;
      const T1 = 1.3, T2 = 0.9;
      const absorbed = hash(i) < absorb(ts + T1);
      const jitter = (hash(i + 500) - 0.5) * 60;
      let p, rot = age * 3 * (hash(i + 900) - 0.5);
      if (age < T1) {
        const u = easeInOut(age / T1);
        p = bez({ x: src.x, y: src.y + jitter }, { x: src.x + 220, y: src.y }, { x: split.x - 160, y: split.y + jitter * 0.4 }, split, u);
      } else if (age < T1 + T2) {
        const u = (age - T1) / T2;
        if (absorbed) p = { x: lerp(split.x, box.x - box.s / 2 + 20, u), y: split.y + jitter * 0.2 * (1 - u) };
        else p = bez(split, { x: split.x - 10, y: split.y + 120 }, { x: fill.x + jitter, y: fill.y - 220 }, { x: fill.x + jitter * 1.6, y: fill.y + 10 }, u * u);
      } else continue;
      const k = i % 3;
      ctx.save();
      if (!absorbed && age > T1) ctx.globalAlpha *= 0.85;
      TRASH[k](ctx, p.x, p.y, 34, rot);
      ctx.restore();
    }
    // Productos (oro) hacia el mercado, más seguidos cuando crece la demanda
    const ex = box.x + box.s / 2, ey = box.y;
    let acc2 = 0;
    for (let i = 0; i < 400; i++) {
      acc2 += 0.24 / (0.45 + absorb(acc2 + 1.6));
      const ts = 1.6 + acc2 * 0.55;
      const age = lt - ts;
      if (age < 0) break;
      const T = 1.1;
      if (age > T) continue;
      const u = easeOut(age / T);
      const tgt = { x: market.x + 60 + hash(i + 77) * (market.w - 120), y: market.y + 130 + hash(i + 99) * 160 };
      const p = bez({ x: ex, y: ey }, { x: ex + 160, y: ey }, { x: tgt.x - 140, y: tgt.y + 60 }, tgt, u);
      ctx.save();
      ctx.globalAlpha *= 1 - prog(age, T - 0.25, T);
      ingot(ctx, p.x, p.y, 34);
      ctx.restore();
    }
    ctx.restore();

    // Caja Transformo (el corazón)
    const bb = beat(lt);
    const bs = easeBack(prog(lt, 0.4, 1.2));
    ctx.save();
    ctx.translate(box.x, box.y);
    ctx.scale(bs, bs);
    const hg = ctx.createRadialGradient(0, 0, box.s * 0.2, 0, 0, box.s);
    hg.addColorStop(0, `rgba(245,197,66,${0.25 + 0.25 * bb})`);
    hg.addColorStop(1, 'rgba(245,197,66,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(-box.s, -box.s, box.s * 2, box.s * 2);
    card(ctx, -box.s / 2, -box.s / 2, box.s, box.s, 30, '#f7fbfa', null);
    ctx.fillStyle = C.brand;
    ctx.fillRect(-box.s / 2, box.s / 2 - 12, box.s, 12);
    drawMark(ctx, 0, -28, 120, 0.12 * bb);
    text(ctx, 'TRANSFORMO', 0, 66, 28, 800, C.bg1, 'center');
    text(ctx, 'shit in → gold out!', 0, 98, 20, 700, C.brandDark, 'center');
    ctx.restore();

    // Mensajes
    const m1 = Math.min(easeOut(prog(lt, 3.2, 4)), 1 - prog(lt, 7.8, 8.4));
    if (m1 > 0) {
      ctx.save();
      ctx.globalAlpha *= m1;
      card(ctx, 1160, 780, 660, 110, 22, 'rgba(255,90,78,0.12)', 'rgba(255,90,78,0.5)');
      iconWarn(ctx, 1210, 836, 46);
      wrap(ctx, 'Si la demanda es baja, el plástico que no podemos absorber termina en el relleno.', 1260, 826, 530, 34, 25, 700);
      ctx.restore();
    }
    const m2 = Math.min(easeOut(prog(lt, 9.5, 10.3)), 1 - prog(lt, 14.2, 14.8));
    if (m2 > 0) {
      ctx.save();
      ctx.globalAlpha *= m2;
      card(ctx, 1160, 780, 660, 110, 22, 'rgba(43,182,115,0.14)', 'rgba(43,182,115,0.55)');
      iconCheck(ctx, 1210, 834, 24);
      wrap(ctx, 'Más población de demanda en LATAM = más plástico absorbido.', 1260, 826, 530, 34, 25, 700);
      ctx.restore();
    }
    const m3 = easeOut(prog(lt, 14.8, 15.6));
    if (m3 > 0) {
      ctx.save();
      ctx.globalAlpha *= m3;
      card(ctx, 1160, 770, 660, 140, 22, 'rgba(245,197,66,0.12)', 'rgba(245,197,66,0.55)');
      text(ctx, 'EL PROBLEMA DE FONDO', 1190, 812, 18, 800, C.gold);
      wrap(ctx, 'La tracción de más residuo depende de la demanda y de mi capacidad de vender en LATAM.', 1190, 848, 610, 32, 24, 700);
      ctx.restore();
    }
  }

  // ---------- Escena 3: el árbol de negocios ----------
  const NODES = [330, 750, 1170, 1590].map((x) => ({ x, y: 330 }));
  function bizBadge(ctx, i, x, y, r, t) {
    const b = BUSINESSES[i];
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = C.bg1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = b.col;
    ctx.stroke();
    bizGlyph(ctx, i, 0, 0, r * 1.1, t);
    ctx.restore();
  }
  // Pequeño ícono por línea de negocio
  function bizGlyph(ctx, i, x, y, s, t) {
    const col = BUSINESSES[i].col;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = s * 0.07;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (i === 0) { // tablas
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = ['#a07b55', '#8a6a4a', '#b38b62'][k];
        ctx.beginPath();
        ctx.roundRect(-s * 0.4, -s * 0.28 + k * s * 0.2, s * 0.8, s * 0.15, s * 0.03);
        ctx.fill();
      }
    } else if (i === 1) { // tienda
      ctx.beginPath();
      ctx.moveTo(-s * 0.38, -s * 0.12);
      ctx.lineTo(-s * 0.3, -s * 0.34);
      ctx.lineTo(s * 0.3, -s * 0.34);
      ctx.lineTo(s * 0.38, -s * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeRect(-s * 0.32, -s * 0.12, s * 0.64, s * 0.46);
      ctx.fillRect(-s * 0.08, s * 0.08, s * 0.16, s * 0.26);
    } else if (i === 2) { // matraz
      ctx.beginPath();
      ctx.moveTo(-s * 0.1, -s * 0.38);
      ctx.lineTo(-s * 0.1, -s * 0.1);
      ctx.lineTo(-s * 0.34, s * 0.32);
      ctx.lineTo(s * 0.34, s * 0.32);
      ctx.lineTo(s * 0.1, -s * 0.1);
      ctx.lineTo(s * 0.1, -s * 0.38);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.24, s * 0.14);
      ctx.lineTo(s * 0.24, s * 0.14);
      ctx.lineTo(s * 0.32, s * 0.3);
      ctx.lineTo(-s * 0.32, s * 0.3);
      ctx.closePath();
      ctx.fill();
    } else { // datos
      const hs = [0.3, 0.5, 0.4, 0.66];
      hs.forEach((h, k) => {
        const hh = s * h * (0.85 + 0.15 * Math.sin(t * 2 + k));
        ctx.fillRect(-s * 0.36 + k * s * 0.2, s * 0.32 - hh, s * 0.12, hh);
      });
    }
    ctx.restore();
  }
  function sceneTree(ctx, lt) {
    sceneTitle(ctx, lt, 'Por eso diversificamos', '4 líneas de negocio para atender varias industrias');
    const groundY = 820, trunkTop = 590, cx = W / 2;
    // raíces
    const rk = easeOut(prog(lt, 0.3, 1.8));
    ctx.save();
    ctx.strokeStyle = 'rgba(245,197,66,0.7)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const dx = (i - 3) * 95;
      bezStroke(ctx, { x: cx, y: groundY }, { x: cx + dx * 0.2, y: groundY + 40 }, { x: cx + dx * 0.8, y: groundY + 30 }, { x: cx + dx * 1.1, y: groundY + 120 + hash(i) * 50 }, rk);
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(244,241,232,0.18)';
    ctx.fillRect(160, groundY - 2, W - 320, 3);
    const rl = easeOut(prog(lt, 1.0, 1.8));
    ctx.save();
    ctx.globalAlpha *= rl;
    text(ctx, 'RAÍZ', 160, groundY + 60, 20, 800, C.gold);
    text(ctx, 'Transformo: shit in → gold out!', 160, groundY + 96, 28, 800, C.cream);
    text(ctx, 'La demanda tracciona el plástico', 160, groundY + 130, 22, 600, C.muted);
    ctx.restore();
    // tronco
    const tk = easeOut(prog(lt, 1.2, 2.2));
    ctx.fillStyle = '#5b4632';
    ctx.beginPath();
    ctx.roundRect(cx - 26, lerp(groundY, trunkTop, tk), 52, (groundY - trunkTop) * tk + 4, 10);
    ctx.fill();
    drawMark(ctx, cx, groundY - 6, 70 * easeBack(prog(lt, 0.6, 1.4)), 0.1 * beat(lt));
    // ramas y nodos
    NODES.forEach((n, i) => {
      const a0 = 2.0 + i * 0.45;
      const k = easeInOut(prog(lt, a0, a0 + 1.0));
      ctx.save();
      ctx.strokeStyle = '#5b4632';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      bezStroke(ctx, { x: cx, y: trunkTop + 10 }, { x: cx, y: trunkTop - 120 }, { x: n.x, y: n.y + 220 }, { x: n.x, y: n.y + 70 }, k);
      ctx.restore();
      const nk = easeBack(prog(lt, a0 + 0.8, a0 + 1.4));
      if (nk <= 0) return;
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(nk, nk);
      bizBadge(ctx, i, 0, 0, 64, lt);
      ctx.restore();
      const tkx = easeOut(prog(lt, a0 + 1.1, a0 + 1.7));
      ctx.save();
      ctx.globalAlpha *= tkx;
      text(ctx, BUSINESSES[i].name, n.x, n.y - 92, 28, 800, C.cream, 'center');
      pill(ctx, n.x, n.y + 86, ['Construcción', 'Equipamiento B2B2C', 'I+D · minería · agro', 'Empresas · normativa'][i], C.bg1, BUSINESSES[i].col, 20, 'center');
      ctx.restore();
    });
    const m = easeOut(prog(lt, 6.4, 7.2));
    ctx.save();
    ctx.globalAlpha *= m;
    text(ctx, 'Cada línea suma demanda… y cada una enfrenta sus propios problemas.', 120, 168, 26, 700, C.lime);
    ctx.restore();
  }

  // ---------- Escenas 4–7: cada negocio ----------
  const PANEL = { x: 120, y: 250, w: 800, h: 680 };
  function bizVisual(ctx, i, lt) {
    const { x, y, w, h } = PANEL;
    card(ctx, x, y, w, h, 28);
    if (i === 0) visEverwood(ctx, x, y, w, h, lt);
    else if (i === 1) visTienda(ctx, x, y, w, h, lt);
    else if (i === 2) visLab(ctx, x, y, w, h, lt);
    else visDatos(ctx, x, y, w, h, lt);
  }
  function plank(ctx, x, y, w, h, seed) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#a98460');
    g.addColorStop(1, '#6f5238');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    for (let k = 0; k < 40; k++) {
      ctx.fillStyle = ['#4aa3ff', '#ffd23f', '#ff6b6b', '#ffffff', '#1d6f4f'][k % 5];
      ctx.globalAlpha *= 0.55;
      ctx.fillRect(x + hash(seed * 50 + k) * (w - 6), y + hash(seed * 50 + k + 999) * (h - 4), 3, 2);
      ctx.globalAlpha /= 0.55;
    }
  }
  function visEverwood(ctx, x, y, w, h, lt) {
    text(ctx, 'Madera plástica para construcción', x + 40, y + 60, 26, 800);
    for (let k = 0; k < 5; k++) {
      const a = easeOut(prog(lt, 0.6 + k * 0.18, 1.2 + k * 0.18));
      if (a <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= a;
      plank(ctx, x + 60 + (1 - a) * -80, y + 100 + k * 46, w - 120, 36, k + 1);
      ctx.restore();
    }
    // comparación de costo
    const by = y + h - 70, bh = 230;
    text(ctx, 'Costo inicial', x + 40, by - bh - 30, 22, 700, C.muted);
    const bars = [
      { label: 'Everwood', v: 1.0, col: C.orange },
      { label: 'Sustituto', v: 0.62, col: 'rgba(244,241,232,0.45)' },
    ];
    bars.forEach((b, k) => {
      const a = easeOut(prog(lt, 2.0 + k * 0.3, 3.2 + k * 0.3));
      const bx = x + 90 + k * 200, hh = bh * b.v * a;
      ctx.fillStyle = b.col;
      ctx.beginPath();
      ctx.roundRect(bx, by - hh, 130, hh, [10, 10, 0, 0]);
      ctx.fill();
      text(ctx, b.label, bx + 65, by + 34, 21, 700, C.cream, 'center');
    });
    ctx.fillStyle = 'rgba(244,241,232,0.3)';
    ctx.fillRect(x + 60, by, 400, 2);
    // ciclo de vida
    const v = easeOut(prog(lt, 4.0, 4.8));
    ctx.save();
    ctx.globalAlpha *= v;
    text(ctx, 'En su vida útil:', x + 500, by - 190, 22, 700, C.muted);
    ['Dura más', 'Cero mantención', 'No se pudre'].forEach((s, k) => {
      iconCheck(ctx, x + 516, by - 140 + k * 52, 14);
      text(ctx, s, x + 542, by - 132 + k * 52, 22, 700);
    });
    ctx.restore();
  }
  function visTienda(ctx, x, y, w, h, lt) {
    text(ctx, 'Marketplace B2B2C', x + 40, y + 60, 26, 800);
    const chain = ['Proveedores', 'La Tienda', 'Empresas', 'Personas'];
    chain.forEach((s, k) => {
      const a = easeBack(prog(lt, 0.6 + k * 0.3, 1.2 + k * 0.3));
      if (a <= 0) return;
      const cx = x + 110 + k * 194, cy = y + 140;
      ctx.save();
      ctx.globalAlpha *= clamp(a);
      ctx.translate(cx, cy);
      ctx.scale(a, a);
      ctx.fillStyle = k === 1 ? C.teal : 'rgba(244,241,232,0.12)';
      ctx.beginPath();
      ctx.roundRect(-80, -30, 160, 60, 30);
      ctx.fill();
      text(ctx, s, 0, 8, 20, 800, k === 1 ? C.bg1 : C.cream, 'center');
      ctx.restore();
      if (k > 0 && a >= 1) text(ctx, '›', cx - 97, cy + 10, 34, 800, C.faint, 'center');
    });
    // margen
    const mk = easeOut(prog(lt, 1.8, 3.0));
    const gx = x + 190, gy = y + 400, r = 120;
    ctx.lineWidth = 34;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(244,241,232,0.1)';
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = C.teal;
    ctx.beginPath();
    ctx.arc(gx, gy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.3 * mk);
    ctx.stroke();
    ctx.strokeStyle = C.lime;
    ctx.beginPath();
    ctx.arc(gx, gy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.2 * mk);
    ctx.stroke();
    text(ctx, '20–30 %', gx, gy + 6, 40, 800, C.cream, 'center');
    text(ctx, 'margen', gx, gy + 38, 20, 700, C.muted, 'center');
    // curva de adopción
    const ax = x + 380, ay = y + 540, aw = 360, ah = 250;
    text(ctx, 'Adopción', ax, ay - ah - 20, 22, 700, C.muted);
    ctx.strokeStyle = 'rgba(244,241,232,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay - ah);
    ctx.lineTo(ax, ay);
    ctx.lineTo(ax + aw, ay);
    ctx.stroke();
    const ck = prog(lt, 2.4, 6.0);
    ctx.strokeStyle = C.teal;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const n = 60;
    let last = null;
    for (let k = 0; k <= n * ck; k++) {
      const u = k / n;
      const vy = 0.08 + 0.55 * Math.pow(u, 2.2) + 0.03 * Math.sin(u * 18);
      const p = { x: ax + u * aw, y: ay - vy * ah };
      if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      last = p;
    }
    ctx.stroke();
    if (last) {
      ctx.fillStyle = C.lime;
      ctx.beginPath();
      ctx.arc(last.x, last.y, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, 'lenta, pero tracciona', ax + aw, ay + 34, 20, 700, C.teal, 'right');
  }
  function visLab(ctx, x, y, w, h, lt) {
    text(ctx, 'Proyectos a medida', x + 40, y + 60, 26, 800);
    // ticket alto
    const tk = easeBack(prog(lt, 0.6, 1.4));
    ctx.save();
    ctx.translate(x + 200, y + 170);
    ctx.scale(tk, tk);
    ctx.rotate(-0.05);
    ctx.fillStyle = C.lime;
    ctx.beginPath();
    ctx.roundRect(-140, -55, 280, 110, 14);
    ctx.fill();
    ctx.fillStyle = C.bg1;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(-140, -33 + k * 22, 6, 0, Math.PI * 2);
      ctx.arc(140, -33 + k * 22, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, '$$$', 0, 4, 46, 800, C.bg1, 'center');
    text(ctx, 'TICKET ALTO', 0, 36, 18, 800, C.bg1, 'center');
    ctx.restore();
    // uso de recursos
    const rx = x + 420, ry = y + 130;
    text(ctx, 'Uso de recursos', rx, ry, 22, 700, C.muted);
    [['Horas mujer', 0.9, C.lime], ['Infraestructura', 0.22, 'rgba(244,241,232,0.45)']].forEach(([s, v, col], k) => {
      const a = easeOut(prog(lt, 1.3 + k * 0.3, 2.4 + k * 0.3));
      text(ctx, s, rx, ry + 46 + k * 74, 20, 700);
      ctx.fillStyle = 'rgba(244,241,232,0.1)';
      ctx.beginPath();
      ctx.roundRect(rx, ry + 58 + k * 74, 320, 14, 7);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(rx, ry + 58 + k * 74, 320 * v * a, 14, 7);
      ctx.fill();
    });
    // necesidades sin solución en el mercado tradicional
    text(ctx, 'Necesidades sin solución en el mercado tradicional', x + 40, y + 360, 22, 700, C.muted);
    const chips = ['Plásticos complejos', 'Residuos de la agricultura', 'Residuos mineros', 'Nuevos materiales', 'Desarrollos I+D'];
    let cx = x + 40, cy = y + 390;
    chips.forEach((s, k) => {
      const a = easeBack(prog(lt, 2.4 + k * 0.35, 2.9 + k * 0.35));
      ctx.font = `700 21px ${FONT}`;
      const cw = ctx.measureText(s).width + 30;
      if (cx + cw > x + w - 40) { cx = x + 40; cy += 60; }
      if (a > 0) {
        ctx.save();
        ctx.globalAlpha *= clamp(a);
        ctx.translate(cx + cw / 2, cy + 20);
        ctx.scale(a, a);
        pill(ctx, 0, -20, s, 'rgba(182,227,90,0.18)', C.lime, 21, 'center');
        ctx.restore();
      }
      cx += cw + 12;
    });
    bizGlyph(ctx, 2, x + w - 120, y + h - 110, 150, lt);
  }
  function visDatos(ctx, x, y, w, h, lt) {
    text(ctx, 'Plataforma inteligente', x + 40, y + 60, 26, 800);
    pill(ctx, x + w - 40 - 150, y + 32, 'SPIN-OFF', C.brand, C.bg1, 20);
    // ventana tipo dashboard
    const dx = x + 40, dy = y + 100, dw = w - 80, dh = 520;
    card(ctx, dx, dy, dw, dh, 18, 'rgba(8,162,167,0.08)', 'rgba(8,162,167,0.45)');
    ['#ff5a4e', '#ffd23f', '#2bb673'].forEach((c, k) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(dx + 26 + k * 22, dy + 24, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    // índice de circularidad
    const k1 = easeOut(prog(lt, 0.8, 2.4));
    text(ctx, 'Índice de circularidad', dx + 30, dy + 84, 20, 700, C.muted);
    text(ctx, `${Math.round(72 * k1)}`, dx + 30, dy + 160, 72, 800, C.cream);
    text(ctx, '/ 100', dx + 140, dy + 160, 24, 700, C.muted);
    // barras
    const bx = dx + 300, bb = dy + 200;
    [0.4, 0.55, 0.5, 0.7, 0.66, 0.85].forEach((v, k) => {
      const a = easeOut(prog(lt, 1.0 + k * 0.12, 1.8 + k * 0.12));
      ctx.fillStyle = k === 5 ? C.lime : C.brand;
      ctx.beginPath();
      ctx.roundRect(bx + k * 60, bb - 130 * v * a, 38, 130 * v * a, [6, 6, 0, 0]);
      ctx.fill();
    });
    // checklist de cumplimiento
    const items = ['Cumplimiento normativo (p. ej. Ley REP)', 'Políticas de sostenibilidad', 'Plan de Economía Circular', 'Reporte corporativo'];
    items.forEach((s, k) => {
      const a = easeOut(prog(lt, 2.2 + k * 0.5, 2.7 + k * 0.5));
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.translate((1 - a) * 30, 0);
      iconCheck(ctx, dx + 44, dy + 262 + k * 60, 16, C.brand);
      text(ctx, s, dx + 74, dy + 270 + k * 60, 22, 700);
      ctx.restore();
    });
  }
  function sceneBiz(ctx, lt, i) {
    const b = BUSINESSES[i];
    // cabecera
    const a = easeOut(prog(lt, 0.1, 0.8));
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(0, (1 - a) * 18);
    bizBadge(ctx, i, 162, 140, 42, lt);
    text(ctx, `LÍNEA ${i + 1} DE 4 · ${b.industry.toUpperCase()}`, 226, 112, 19, 800, b.col);
    text(ctx, b.name, 226, 170, 54, 800, C.cream);
    ctx.restore();
    // visual
    const v = easeOut(prog(lt, 0.3, 1.0));
    ctx.save();
    ctx.globalAlpha *= v;
    ctx.translate(-(1 - v) * 40, 0);
    bizVisual(ctx, i, lt);
    ctx.restore();
    // columna derecha
    const rx = 1000, rw = 800;
    const r1 = easeOut(prog(lt, 0.8, 1.5));
    ctx.save();
    ctx.globalAlpha *= r1;
    text(ctx, 'APORTA', rx, 290, 19, 800, C.muted);
    text(ctx, b.role, rx, 340, 38, 800, b.col);
    ctx.restore();
    text(ctx, 'VENTAJAS', rx, 430, 19, 800, `rgba(244,241,232,${0.62 * easeOut(prog(lt, 1.5, 2.0))})`);
    b.pros.forEach((s, k) => {
      const p = easeOut(prog(lt, 1.8 + k * 0.5, 2.4 + k * 0.5));
      if (p <= 0) return;
      ctx.save();
      ctx.globalAlpha *= p;
      ctx.translate((1 - p) * 30, 0);
      iconCheck(ctx, rx + 18, 476 + k * 58, 17);
      text(ctx, s, rx + 50, 485 + k * 58, 27, 700);
      ctx.restore();
    });
    // falencia
    const f = easeBack(prog(lt, 4.6, 5.4));
    if (f > 0) {
      const pulse = 0.5 + 0.5 * Math.sin((lt - 5.4) * 4);
      const fy = 680;
      ctx.save();
      ctx.globalAlpha *= clamp(f);
      ctx.translate(rx + rw / 2, fy + 75);
      ctx.scale(lerp(0.9, 1, clamp(f)), lerp(0.9, 1, clamp(f)));
      ctx.translate(-(rx + rw / 2), -(fy + 75));
      card(ctx, rx, fy, rw, 150, 24, 'rgba(255,90,78,0.13)', `rgba(255,90,78,${0.45 + 0.4 * pulse})`);
      iconWarn(ctx, rx + 58, fy + 72, 56);
      text(ctx, 'FALENCIA', rx + 110, fy + 50, 19, 800, C.red);
      wrap(ctx, b.con, rx + 110, fy + 92, rw - 140, 38, 31, 800);
      ctx.restore();
    }
    // vínculo con los desafíos
    const l = easeOut(prog(lt, 6.4, 7.1));
    if (l > 0) {
      ctx.save();
      ctx.globalAlpha *= l;
      text(ctx, 'Se conecta con los desafíos', rx, 880, 20, 700, C.muted);
      let px = rx;
      b.links.forEach((n) => {
        const ch = CHALLENGES[n - 1];
        px += pill(ctx, px, 900, `${n} · ${ch.title}`, 'rgba(244,241,232,0.1)', ch.col, 20) + 12;
      });
      ctx.restore();
    }
  }

  // ---------- Escena 8: los 6 desafíos ----------
  function chalRect(k) {
    const cw = 530, chh = 300, gx = 40, gy = 34;
    const x0 = (W - (3 * cw + 2 * gx)) / 2, y0 = 230;
    return { x: x0 + (k % 3) * (cw + gx), y: y0 + Math.floor(k / 3) * (chh + gy), w: cw, h: chh };
  }
  function drawChallengeCard(ctx, k, r, lt, big) {
    const ch = CHALLENGES[k];
    ctx.save();
    card(ctx, r.x, r.y, r.w, r.h, 26, 'rgba(255,255,255,0.07)', ch.col + '99');
    const s = r.w / 530;
    ctx.translate(r.x, r.y);
    ctx.scale(s, s);
    ctx.fillStyle = ch.col;
    ctx.beginPath();
    ctx.arc(54, 56, 28, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, String(k + 1), 54, 67, 30, 800, C.bg1, 'center');
    challengeIcon(ctx, ch.icon, 460, 62, 64, ch.col, lt);
    let ts = 34;
    ctx.font = `800 ${ts}px ${FONT}`;
    while (ctx.measureText(ch.title).width > 466 && ts > 20) ctx.font = `800 ${--ts}px ${FONT}`;
    text(ctx, ch.title, 32, 140, ts, 800, C.cream);
    wrap(ctx, ch.text, 32, 186, 466, 34, 25, 600, C.muted);
    if (k === 0) {
      // runway: 6 meses que se van consumiendo
      const used = big ? prog(lt, 1.0, 5.0) * 2.5 : 2.5 + prog(lt, 6, 24) * 1.0;
      const rest = 6 - used;
      for (let m = 0; m < 6; m++) {
        const left = clamp(1 - (used - m));
        ctx.fillStyle = 'rgba(244,241,232,0.1)';
        ctx.beginPath();
        ctx.roundRect(32 + m * 78, 252, 70, 22, 6);
        ctx.fill();
        ctx.fillStyle = rest > 4 ? C.green : rest > 3 ? C.orange : C.red;
        ctx.beginPath();
        ctx.roundRect(32 + m * 78, 252, 70 * left, 22, 6);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  function sceneChallenges(ctx, lt) {
    sceneTitle(ctx, lt, 'Desafío Ambiente hoy', 'Los 6 desafíos que enfrentamos', 130);
    // tarjeta 1: entra grande al centro y luego va a su lugar
    const big = { x: W / 2 - 530 * 0.85, y: 300, w: 530 * 1.7, h: 300 * 1.7 };
    const slot = chalRect(0);
    const mv = easeInOut(prog(lt, 5.2, 6.2));
    const a1 = easeBack(prog(lt, 0.4, 1.2));
    if (a1 > 0) {
      const r = { x: lerp(big.x, slot.x, mv), y: lerp(big.y, slot.y, mv), w: lerp(big.w, slot.w, mv), h: lerp(big.h, slot.h, mv) };
      ctx.save();
      ctx.globalAlpha *= clamp(a1);
      drawChallengeCard(ctx, 0, r, lt, mv < 1);
      ctx.restore();
      const lbl = Math.min(easeOut(prog(lt, 1.6, 2.2)), 1 - prog(lt, 4.8, 5.3));
      if (lbl > 0) {
        ctx.save();
        ctx.globalAlpha *= lbl;
        text(ctx, '6 meses para que las líneas que dan caja se sostengan solas', W / 2, big.y + big.h + 70, 30, 800, C.red, 'center');
        ctx.restore();
      }
    }
    for (let k = 1; k < 6; k++) {
      const t0 = 6.4 + (k - 1) * 2.4;
      const a = easeBack(prog(lt, t0, t0 + 0.7));
      if (a <= 0) continue;
      const r = chalRect(k);
      ctx.save();
      ctx.globalAlpha *= clamp(a);
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.scale(lerp(0.8, 1, a), lerp(0.8, 1, a));
      ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
      drawChallengeCard(ctx, k, r, lt, false);
      ctx.restore();
    }
    const z = easeOut(prog(lt, 19.2, 20));
    if (z > 0) {
      ctx.save();
      ctx.globalAlpha *= z;
      text(ctx, 'Todo parte de la raíz: más demanda en LATAM → más plástico absorbido → menos relleno.', W / 2, 950, 28, 800, C.lime, 'center');
      ctx.restore();
    }
  }

  // ---------- Escena 9: cierre ----------
  function sceneOutro(ctx, lt) {
    const a = easeOut(prog(lt, 0.1, 0.9));
    const lh = 190, lw = LOGO_RATIO * lh;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(W / 2, 330);
    ctx.scale(lerp(0.92, 1, a), lerp(0.92, 1, a));
    drawLogo(ctx, -lw / 2, -lh / 2, lh, 'text_light', 0.06 * beat(lt));
    ctx.restore();
    const b = easeOut(prog(lt, 0.8, 1.6));
    ctx.save();
    ctx.globalAlpha *= b;
    ctx.translate(0, (1 - b) * 16);
    pill(ctx, W / 2, 490, 'shit in → gold out!', C.gold, C.bg1, 30, 'center');
    ctx.restore();
    const c = easeOut(prog(lt, 1.6, 2.4));
    ctx.save();
    ctx.globalAlpha *= c;
    text(ctx, 'Buscamos socios inversionistas con visión de impacto real', W / 2, 660, 46, 800, C.cream, 'center');
    text(ctx, 'para reorganizar las líneas de negocio y crecer en LATAM', W / 2, 714, 30, 600, C.muted, 'center');
    ctx.restore();
    const d = easeOut(prog(lt, 2.6, 3.4));
    ctx.save();
    ctx.globalAlpha *= d;
    const names = BUSINESSES.map((x) => x.name);
    ctx.font = `700 22px ${FONT}`;
    const ws = names.map((s) => ctx.measureText(s).width + 22 * 1.4);
    let px = W / 2 - (ws.reduce((p, q) => p + q, 0) + 14 * (names.length - 1)) / 2;
    names.forEach((s, k) => {
      px += pill(ctx, px, 800, s, 'rgba(244,241,232,0.1)', BUSINESSES[k].col, 22) + 14;
    });
    ctx.restore();
  }

  // ---------- Render ----------
  function sceneAt(t) {
    for (let k = SCENES.length - 1; k >= 0; k--) if (t >= SCENES[k].start) return SCENES[k];
    return SCENES[0];
  }
  function renderFrame(t) {
    const ctx = document.getElementById('stage').getContext('2d');
    t = clamp(t, 0, DURATION - 1e-6);
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'left';
    drawBackground(ctx, t);
    const sc = sceneAt(t);
    const lt = t - sc.start;
    ctx.save();
    ctx.globalAlpha = Math.min(prog(lt, 0, 0.45), 1 - prog(lt, sc.dur - 0.45, sc.dur));
    if (sc.id === 'intro') sceneIntro(ctx, lt);
    else if (sc.id === 'root') sceneRoot(ctx, lt);
    else if (sc.id === 'tree') sceneTree(ctx, lt);
    else if (sc.id.startsWith('biz')) sceneBiz(ctx, lt, +sc.id[3]);
    else if (sc.id === 'chal') sceneChallenges(ctx, lt);
    else sceneOutro(ctx, lt);
    ctx.restore();
    drawChapters(ctx, t);
    // fundido de entrada / salida
    const fade = Math.max(1 - prog(t, 0, 0.3), prog(t, DURATION - 0.6, DURATION));
    if (fade > 0) {
      ctx.fillStyle = `rgba(7,26,21,${fade})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  window.MOTION = { FPS, W, H, duration: DURATION, scenes: SCENES, ready: logosReady };
  window.renderFrame = renderFrame;

  // ---------- Vista previa ----------
  const params = new URLSearchParams(location.search);
  if (params.has('render')) {
    document.body.classList.add('render');
    return;
  }
  let start = performance.now() - (parseFloat(params.get('t')) || 0) * 1000;
  const ctrl = document.getElementById('controls');
  SCENES.forEach((s) => {
    const b = document.createElement('button');
    b.textContent = s.label;
    b.addEventListener('click', () => { start = performance.now() - s.start * 1000; });
    ctrl.appendChild(b);
  });
  const buttons = ctrl.querySelectorAll('button');
  Promise.all([document.fonts.ready, logosReady]).then(() => {
    const loop = (now) => {
      const t = ((now - start) / 1000) % DURATION;
      const cur = sceneAt(t);
      buttons.forEach((b, k) => b.classList.toggle('on', SCENES[k] === cur));
      renderFrame(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
})();
