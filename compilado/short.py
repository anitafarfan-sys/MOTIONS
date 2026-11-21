"""Short vertical (1080x1920) rápido y cinematográfico de la jornada en Barranco.

Cortes al ritmo de una pista original de 120 BPM (un corte cada uno o dos
tiempos), zoom de impacto al entrar cada toma, paneos sobre las fotos,
destellos en los cortes fuertes, color turquesa/naranja, viñeta y grano.

Uso: python3 -I compilado/short.py <carpeta_con_clips_y_fotos>
Salida: compilado/out/desafio_short_barranco.mp4
"""
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import music as M  # noqa: E402
from build import BG, CREAM, FPS, H, HERE, LIME, W, font, logo  # noqa: E402

BPM = 120
BEAT = 60 / BPM

# ---- guion: (tipo, archivo, inicio | foco, duración en tiempos, texto, destello) ----
# tipo 'v' = video (inicio en s), 'p' = foto (foco x de inicio -> fin, 0..1)
HOOK = [
    ('v', 'a2a8096a', 0.3, 1), ('v', '64a257e2', 0.6, 1), ('v', 'a2a8096a', 11.2, 1),
    ('v', 'd7fe122c', 2.5, 1), ('v', '69dccef2', 17.6, 1), ('p', '95a9ab11', (0.5, 0.5), 1),
    ('v', '91f39a67', 21.5, 1), ('v', '04b2509d', 37.8, 1),
]
HOOK_TEXT = [(0, 4, ['PLÁSTICO', 'RECICLADO']), (4, 8, ['HOY ES', 'PASARELA'])]
DROP = [
    ('v', 'a2a8096a', 1.2, 2, None, True),
    ('p', '95a9ab11', (0.45, 0.55), 2, 'MADERA PLÁSTICA', False),
    ('v', '91f39a67', 20.8, 2, None, False),
    ('v', 'a2a8096a', 10.4, 1, None, True),
    ('p', '95b2c1b8', (0.5, 0.5), 1, None, False),
    ('v', '69dccef2', 16.6, 2, 'ACCESIBLE PARA TODOS', False),
    ('p', '284831bd', (0.22, 0.55), 2, 'TRABAJO EN EQUIPO', True),
    ('v', 'd7fe122c', 1.0, 2, 'RECICLADORES', False),
    ('v', '64a257e2', 1.2, 2, None, False),
    ('v', '04b2509d', 37.6, 2, None, True),
    ('v', '5f675039', 3.0, 2, 'ALIADOS', False),
    ('p', '6d39dc15', (0.5, 0.5), 2, None, False),
    ('v', 'a2a8096a', 15.0, 1, None, True),
    ('v', '91f39a67', 10.0, 2, None, False),
    ('p', '1df469e8', (0.5, 0.5), 2, None, False),
    ('p', '6620db7b', (0.5, 0.5), 3, 'BARRANCO · PERÚ', True),
]
OUTRO_BEATS = 8


def ease(k):
    return 1 - (1 - min(1.0, max(0.0, k))) ** 3


def find(clips, key):
    return next(os.path.join(clips, f) for f in os.listdir(clips) if f.startswith(key))


def video_frames(path, ss, n):
    """Frames del video ya rotado, a 1.15x del cuadro final (margen para el zoom)."""
    w, h = int(W * 1.15), int(H * 1.15)
    p = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', str(ss), '-i', path, '-frames:v', str(n),
                        '-vf', f'scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},fps={FPS}',
                        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True)
    arr = np.frombuffer(p.stdout, np.uint8).reshape(-1, h, w, 3)
    frames = [Image.fromarray(a) for a in arr]
    while len(frames) < n:
        frames.append(frames[-1])
    return frames


def photo_base(path):
    im = Image.open(path).convert('RGB')
    k = max(W * 1.25 / im.width, H * 1.25 / im.height)
    return im.resize((int(im.width * k) + 1, int(im.height * k) + 1), Image.LANCZOS)


def view(src, lt, dur, focus=(0.5, 0.5)):
    """Zoom de impacto al entrar (1.14 -> 1.0) + empuje lento; paneo según el foco."""
    z = 1.0 + 0.14 * (1 - ease(lt / 0.22)) + 0.05 * (lt / dur)
    # tamaño del recorte en coordenadas de la fuente
    base = min(src.width / W, src.height / H)
    cw, ch = W * base / z, H * base / z
    fx = focus[0] + (focus[1] - focus[0]) * (lt / dur)
    x0 = (src.width - cw) * fx
    y0 = (src.height - ch) * 0.5
    return src.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))


# ---- gradación de color (turquesa en sombras, naranja en luces), viñeta y grano ----
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = (1 - 0.42 * (((xx - W / 2) / (W * 0.72)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)).clip(0.45, 1)[..., None]
RNG = np.random.default_rng(3)
GRAIN = [RNG.normal(0, 7, (H // 2, W // 2, 1)).astype(np.float32) for _ in range(6)]


def grade(img, f, flash=0.0, dim=0.0):
    a = np.asarray(img, np.float32)
    lum = (a @ np.array([0.299, 0.587, 0.114], np.float32))[..., None] / 255
    a = (a - 128) * 1.12 + 128  # contraste
    a = lum * 255 + (a - lum * 255) * 1.18  # saturación
    a += (1 - lum) * np.array([-6, 4, 12], np.float32) + lum * np.array([14, 4, -10], np.float32)
    a *= VIG * (1 - dim)
    g = GRAIN[f % len(GRAIN)]
    a += np.repeat(np.repeat(g, 2, 0), 2, 1)
    if flash > 0:
        a = a + (255 - a) * flash
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def text_img(lines, size, colors):
    fnts = [font('Black', size)] * len(lines)
    d = ImageDraw.Draw(Image.new('RGBA', (10, 10)))
    w = int(max(d.textlength(t, font=f) for t, f in zip(lines, fnts))) + 40
    h = int(size * 1.08 * len(lines)) + 40
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i, (t, f) in enumerate(zip(lines, fnts)):
        tw = d.textlength(t, font=f)
        # sombra suave para legibilidad
        d.text(((w - tw) / 2 + 4, 20 + i * size * 1.08 + 5), t, font=f, fill=(0, 0, 0, 120))
        d.text(((w - tw) / 2, 20 + i * size * 1.08), t, font=f, fill=colors[i % len(colors)])
    return img


def tag_img(text):
    f = font('ExtraBold', 46)
    d = ImageDraw.Draw(Image.new('RGBA', (10, 10)))
    w = int(d.textlength(text, font=f)) + 56
    img = Image.new('RGBA', (w, 84), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, 83), radius=18, fill=LIME + (255,))
    d.text((28, 14), text, font=f, fill=(11, 43, 32))
    return img


def slam(canvas, img, cx, cy, lt, out_t=None):
    """Texto que entra con un golpe de escala (1.35 -> 1.0) y sale con fundido."""
    k = ease(lt / 0.16)
    s = 1.35 - 0.35 * k
    a = min(1.0, lt / 0.08)
    if out_t is not None:
        a *= 1 - min(1.0, max(0.0, (lt - out_t) / 0.12))
    if a <= 0:
        return
    im = img.resize((int(img.width * s), int(img.height * s)), Image.BILINEAR)
    if a < 1:
        im.putalpha(im.getchannel('A').point(lambda v: int(v * a)))
    canvas.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


# ---- música: 120 BPM, entrada con subida, drop con bombo en negras, impacto final ----
def soundtrack(total, drop_t, outro_t, path):
    M.BEAT, M.BAR = BEAT, 4 * BEAT
    n = int(total * M.SR)
    mus, rhy = np.zeros((2, n)), np.zeros((2, n))
    bar = 4 * BEAT
    for b in range(int(np.ceil(total / bar))):
        t0 = b * bar
        notes, root = M.CHORDS[b % 4]
        in_drop = drop_t <= t0 < outro_t
        M.add(mus, t0, M.lowpass(M.pad([M.hz(m) for m in notes], bar + 0.3), 2600 if in_drop else 1200), 0.15)
        arp = [notes[0], notes[1], notes[2], notes[0] + 12] * 4
        if t0 < outro_t:
            for k, m in enumerate(arp):
                M.add(mus, t0 + k * BEAT / 4, M.pluck(M.hz(m + 12), 0.35), 0.13 if in_drop else 0.09,
                      pan=-0.4 if k % 2 else 0.4)
        if in_drop:
            for k in range(4):
                M.add(rhy, t0 + k * BEAT, M.kick(), 0.62)
                M.add(rhy, t0 + k * BEAT + BEAT / 2, M.bass(M.hz(root), BEAT * 0.45), 0.34)
                M.add(rhy, t0 + k * BEAT + BEAT / 2, M.hat(), 0.12, pan=0.25)
            for k in (1, 3):
                M.add(rhy, t0 + k * BEAT, M.clap(), 0.26)
    # subida antes del drop: ruido que se abre + redoble
    rl = drop_t
    t = np.arange(int(rl * M.SR)) / M.SR
    noise = M.rng.standard_normal(len(t))
    riser = np.zeros_like(noise)
    seg = int(0.1 * M.SR)
    for i in range(0, len(noise), seg):
        k = i / len(noise)
        riser[i:i + seg] = M.bandpass(noise[i:i + seg], 400 + 6000 * k, 9000 + 5000 * k)
    riser *= (t / rl) ** 2.2
    M.add(rhy, 0, riser, 0.20)
    for i in range(16):
        tt = drop_t - 2 * BEAT + i * (2 * BEAT / 16)
        M.add(rhy, tt, M.clap(), 0.05 + 0.16 * i / 15)
    # impactos en el drop y en el cierre
    for it, g in ((drop_t, 0.7), (outro_t, 0.8)):
        tb = np.arange(int(1.8 * M.SR)) / M.SR
        boom = np.sin(2 * np.pi * (38 + 40 * np.exp(-tb * 6)) * tb) * np.exp(-tb * 2.2)
        M.add(rhy, it, boom, g)
        M.add(rhy, it, M.bandpass(M.rng.standard_normal(int(0.6 * M.SR)), 300, 8000) * np.exp(-np.arange(int(0.6 * M.SR)) / M.SR * 7), 0.25)
    notes, _ = M.CHORDS[0]
    M.add(mus, outro_t, M.lowpass(M.pad([M.hz(m) for m in notes + [notes[0] + 12]], total - outro_t), 2000), 0.18)
    mus = np.stack([M.reverb(mus[0], 0.3), M.reverb(mus[1], 0.3)])
    mix = mus + rhy
    tt = np.arange(n) / M.SR
    mix *= np.minimum(1, tt / 0.05) * np.minimum(1, (total - tt) / 1.5)
    mix = np.tanh(mix * 1.5) / np.tanh(1.5)
    mix *= 0.89 / np.max(np.abs(mix))
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(M.SR)
        w.writeframes((mix.T * 32767).astype('<i2').tobytes())


def main():
    clips = sys.argv[1]
    out_dir = os.path.join(HERE, 'out')
    os.makedirs(out_dir, exist_ok=True)
    tmp = tempfile.mkdtemp()
    fpb = int(round(BEAT * FPS))  # frames por tiempo (un corte por tiempo en el gancho)
    hook_n = sum(h[3] for h in HOOK) * fpb
    drop_n = sum(int(d[3] * BEAT * FPS) for d in DROP)
    outro_n = int(OUTRO_BEATS * BEAT * FPS)
    total_n = hook_n + drop_n + outro_n
    drop_t, outro_t, total = hook_n / FPS, (hook_n + drop_n) / FPS, total_n / FPS

    wav = os.path.join(tmp, 'short.wav')
    soundtrack(total, drop_t, outro_t, wav)
    silent = os.path.join(tmp, 'video.mp4')
    enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                            '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-crf', '23',
                            '-maxrate', '9M', '-bufsize', '18M', '-preset', 'medium', '-pix_fmt', 'yuv420p', silent], stdin=subprocess.PIPE)
    photos = {}
    f_global = 0

    def emit(img):
        nonlocal f_global
        enc.stdin.write(img.convert('RGB').tobytes())
        f_global += 1

    # gancho: un tiempo por toma, texto grande encima
    hook_txt = [(a * fpb, b * fpb, text_img(lines, 150, [CREAM, LIME])) for a, b, lines in HOOK_TEXT]
    fi = 0
    for kind, key, arg, beats in HOOK:
        n = beats * fpb
        if kind == 'v':
            frames = video_frames(find(clips, key), arg, n)
        else:
            photos.setdefault(key, photo_base(find(clips, key)))
        for j in range(n):
            lt = j / FPS
            src = frames[j] if kind == 'v' else photos[key]
            img = grade(view(src, lt, n / FPS, arg if kind == 'p' else (0.5, 0.5)), f_global,
                        flash=0.35 * max(0, 1 - lt / 0.07), dim=0.35).convert('RGBA')
            for a, b, ti in hook_txt:
                if a <= fi < b:
                    slam(img, ti, W / 2, H * 0.46, (fi - a) / FPS, out_t=(b - a) / FPS - 0.12)
            emit(img)
            fi += 1

    # drop: una toma por tiempo o dos, rótulos cortos
    for kind, key, arg, beats, tag, flash in DROP:
        n = int(beats * BEAT * FPS)
        if kind == 'v':
            frames = video_frames(find(clips, key), arg, n)
        else:
            photos.setdefault(key, photo_base(find(clips, key)))
        ti = tag_img(tag) if tag else None
        for j in range(n):
            lt = j / FPS
            src = frames[j] if kind == 'v' else photos[key]
            fl = (0.6 if flash else 0.18) * max(0, 1 - lt / (0.12 if flash else 0.05))
            img = grade(view(src, lt, n / FPS, arg if kind == 'p' else (0.5, 0.5)), f_global, flash=fl).convert('RGBA')
            if ti is not None and lt >= 0.08:
                slam(img, ti, W / 2, H * 0.80, lt - 0.08)
            emit(img)

    # cierre: logo con golpe y propósito
    lg = logo(190)
    l1 = text_img(['ELIMINAR EL PLÁSTICO', 'DEL PLANETA'], 86, [CREAM])
    l2 = text_img(['creando soluciones', 'aplicables y comerciales'], 50, [LIME])
    for j in range(outro_n):
        lt = j / FPS
        img = Image.new('RGBA', (W, H), BG + (255,))
        g = grade(img.convert('RGB'), f_global, flash=0.8 * max(0, 1 - lt / 0.15)).convert('RGBA')
        slam(g, lg, W / 2, H * 0.36, lt)
        if lt > 0.5:
            slam(g, l1, W / 2, H * 0.53, lt - 0.5)
        if lt > 1.1:
            slam(g, l2, W / 2, H * 0.65, lt - 1.1)
        fade = max(0.0, (lt - (outro_n / FPS - 0.6)) / 0.6)
        if fade > 0:
            g = Image.blend(g, Image.new('RGBA', (W, H), BG + (255,)), min(1, fade))
        emit(g)

    enc.stdin.close()
    enc.wait()
    final = os.path.join(out_dir, 'desafio_short_barranco.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-map', '0:v', '-map', '1:a',
                    '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=7', '-c:a', 'aac', '-b:a', '192k',
                    '-ar', '48000', '-shortest', '-movflags', '+faststart', final], check=True)
    print(final, f'{total:.2f}s')


if __name__ == '__main__':
    main()
