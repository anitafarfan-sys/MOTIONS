"""Short de 15 s: "Antes era un residuo, hoy es una pasarela" (Barranco, Lima).

0–2 s en blanco y negro (el residuo), destello y color a los 2 s (la pasarela),
testimonio con audio real de 4 a 11,5 s con stickers que saltan
(PASARELA INCLUSIVA · LIMA · PERÚ) y cierre rápido con el logo.
Todos los cortes caen en el pulso de una pista original de 120 BPM.

Uso: python3 -I compilado/short15.py <carpeta_con_clips_y_fotos>
Salida: compilado/out/desafio_short15_pasarela.mp4
"""
import math
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import BG, CREAM, FPS, H, HERE, LIME, TEAL, W, font, logo  # noqa: E402
from short import (BEAT, ease, find, grade, photo_base, slam, soundtrack,  # noqa: E402
                   text_img, video_frames)

ORANGE = (255, 120, 60)
RED = (255, 90, 78)
TOTAL = 15.0
DROP_T, TESTI_T, TESTI_END, LOGO_T = 2.0, 4.0, 11.5, 13.0

# (inicio en el short, duración, tipo, archivo, inicio en el clip | None, zoom base, foco y, blanco y negro)
SHOTS = [
    (0.0, 0.5, 'v', '64a257e2', 0.6, 1.0, 0.5, True),
    (0.5, 0.5, 'v', 'a2a8096a', 11.2, 1.0, 0.5, True),
    (1.0, 0.5, 'v', '64a257e2', 3.0, 1.0, 0.5, True),
    (1.5, 0.5, 'v', 'd7fe122c', 2.5, 1.0, 0.5, True),
    (2.0, 0.5, 'v', '5f9e9d19', 0.0, 1.38, 0.0, False),
    (2.5, 0.5, 'v', 'f52cbe23', 6.4, 1.0, 0.5, False),
    (3.0, 0.5, 'v', '5f9e9d19', 6.2, 1.38, 0.0, False),
    (3.5, 0.5, 'v', 'f52cbe23', 0.5, 1.0, 0.5, False),
    (4.0, 3.0, 'v', 'bb471558', 6.3, 1.0, 0.5, False),   # testimonio del señor de blanco (audio real)
    (7.0, 1.0, 'v', 'f52cbe23', 2.0, 1.0, 0.5, False),   # inserto, la voz sigue
    (8.0, 3.5, 'v', 'bb471558', 10.3, 1.0, 0.5, False),
    (11.5, 0.5, 'v', '5f9e9d19', 11.6, 1.38, 0.0, False),
    (12.0, 0.5, 'p', '95a9ab11', None, 1.0, 0.5, False),
    (12.5, 0.5, 'p', '6620db7b', None, 1.0, 0.5, False),
]
TESTI_CLIP, TESTI_SS = 'bb471558', 6.3  # tramo 6,3–13,8 s: empieza y termina en pausas


def view(src, lt, dur, zbase=1.0, fy=0.5):
    z = zbase * (1.0 + 0.16 * (1 - ease(lt / 0.2)) + 0.06 * (lt / dur))
    base = min(src.width / W, src.height / H)
    cw, ch = W * base / z, H * base / z
    x0 = (src.width - cw) * 0.5
    y0 = (src.height - ch) * fy
    return src.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))


def sticker(text, bg, fg, size, rot):
    f = font('Black', size)
    d = ImageDraw.Draw(Image.new('RGBA', (10, 10)))
    tw = d.textlength(text, font=f)
    pad = int(size * 0.45)
    w, h = int(tw + pad * 2), int(size * 1.45)
    img = Image.new('RGBA', (w + 24, h + 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((16, 18, w + 16, h + 18), radius=int(size * 0.35), fill=(0, 0, 0, 110))  # sombra
    d.rounded_rectangle((8, 8, w + 8, h + 8), radius=int(size * 0.35), fill=bg + (255,))
    d.text((8 + pad, 8 + (h - size * 1.2) / 2), text, font=f, fill=fg)
    return img.rotate(rot, resample=Image.BICUBIC, expand=True)


def pop(canvas, img, cx, cy, lt, life):
    """Sticker que salta (escala con rebote), se balancea y sale encogiéndose."""
    if lt < 0 or lt > life:
        return
    k = min(1.0, lt / 0.22)
    s = 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2 if k < 1 else 1.0
    s *= 1 + 0.025 * math.sin(lt * 9)
    out = max(0.0, (lt - (life - 0.15)) / 0.15)
    s *= 1 - out
    if s <= 0.02:
        return
    im = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.BILINEAR)
    canvas.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


def main():
    clips = sys.argv[1]
    out_dir = os.path.join(HERE, 'out')
    os.makedirs(out_dir, exist_ok=True)
    tmp = tempfile.mkdtemp()

    # textos y stickers
    t_antes = text_img(['ANTES ERA'], 150, [CREAM])
    t_residuo = text_img(['UN RESIDUO'], 150, [RED])
    t_hoy = text_img(['HOY ES'], 150, [CREAM])
    t_pasarela = text_img(['UNA PASARELA'], 132, [LIME])
    s_incl = sticker('PASARELA INCLUSIVA', LIME, (11, 43, 32), 64, 3)
    s_lima = sticker('LIMA', TEAL, (255, 255, 255), 78, -8)
    s_peru = sticker('PERÚ', RED, (255, 255, 255), 78, 7)
    s_da = sticker('VOCES DE LA JORNADA', (7, 26, 21), CREAM, 34, 0)
    s_end = sticker('LIMA · PERÚ', LIME, (11, 43, 32), 52, -3)

    n_total = int(TOTAL * FPS)
    silent = os.path.join(tmp, 'v.mp4')
    enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                            '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-crf', '22',
                            '-maxrate', '9M', '-bufsize', '18M', '-preset', 'medium', '-pix_fmt', 'yuv420p', silent],
                           stdin=subprocess.PIPE)
    f = 0
    for t0, dur, kind, key, ss, zb, fy, bw in SHOTS:
        n = int(round(dur * FPS))
        src_frames = video_frames(find(clips, key), ss, n) if kind == 'v' else None
        ph = photo_base(find(clips, key)) if kind == 'p' else None
        for j in range(n):
            t, lt = f / FPS, j / FPS
            src = src_frames[j] if kind == 'v' else ph
            flash = 0.85 * max(0, 1 - lt / 0.14) if t0 in (DROP_T, TESTI_END) else 0.22 * max(0, 1 - lt / 0.05)
            img = grade(view(src, lt, dur, zb, fy), f, flash=flash, sat=0.0 if bw else 1.22,
                        dim=0.3 if t < TESTI_T else 0.0).convert('RGBA')
            # textos grandes del gancho
            if t < 1.0:
                slam(img, t_antes, W / 2, H * 0.44, t)
            elif t < 2.0:
                slam(img, t_antes, W / 2, H * 0.40, 1.0)
                slam(img, t_residuo, W / 2, H * 0.50, t - 1.0)
            elif t < 3.0:
                slam(img, t_hoy, W / 2, H * 0.44, t - 2.0)
            elif t < TESTI_T:
                slam(img, t_hoy, W / 2, H * 0.40, 1.0)
                slam(img, t_pasarela, W / 2, H * 0.50, t - 3.0)
            # stickers durante el testimonio
            pop(img, s_da, W / 2, H * 0.93, t - 4.1, 7.3)
            pop(img, s_incl, W / 2, H * 0.78, t - 4.4, 3.4)
            pop(img, s_lima, W * 0.28, H * 0.70, t - 8.1, 3.3)
            pop(img, s_peru, W * 0.72, H * 0.75, t - 8.6, 2.8)
            pop(img, s_end, W / 2, H * 0.80, t - 12.05, 0.95)
            enc.stdin.write(img.convert('RGB').tobytes())
            f += 1

    # cierre: logo y remate
    lg = logo(190)
    l1 = text_img(['ANTES ERA UN RESIDUO'], 64, [CREAM])
    l2 = text_img(['HOY ES UNA PASARELA'], 78, [LIME])
    l3 = sticker('PASARELA INCLUSIVA · LIMA, PERÚ', TEAL, (255, 255, 255), 38, 0)
    while f < n_total:
        lt = f / FPS - LOGO_T
        g = grade(Image.new('RGB', (W, H), BG), f, flash=0.8 * max(0, 1 - lt / 0.15)).convert('RGBA')
        slam(g, lg, W / 2, H * 0.33, lt)
        if lt > 0.25:
            slam(g, l1, W / 2, H * 0.50, lt - 0.25)
        if lt > 0.55:
            slam(g, l2, W / 2, H * 0.57, lt - 0.55)
        pop(g, l3, W / 2, H * 0.68, lt - 0.9, 10)
        fade = max(0.0, (lt - 1.6) / 0.4)
        if fade > 0:
            g = Image.blend(g, Image.new('RGBA', (W, H), BG + (255,)), min(1, fade))
        enc.stdin.write(g.convert('RGB').tobytes())
        f += 1
    enc.stdin.close()
    enc.wait()

    # audio: pista con drop en 2 s e impacto en el cierre; baja durante el testimonio
    music = os.path.join(tmp, 'm.wav')
    soundtrack(TOTAL, DROP_T, LOGO_T, music)
    testi = find(clips, TESTI_CLIP)
    # el testimonio suena continuo 7,5 s desde TESTI_SS (corta en pausas); el inserto de
    # 7 a 8 s del short tapa la imagen pero no la voz, y la toma de 8 s retoma 4 s después
    seg = TESTI_END - TESTI_T
    duck = f"1-0.8*clip((t-{TESTI_T - 0.15})/0.15,0,1)*clip(({TESTI_END + 0.1}-t)/0.15,0,1)"
    fc = (f'[0:a]volume=\'{duck}\':eval=frame[m];'
          f'[1:a]atrim=0:{seg},asetpts=PTS-STARTPTS,highpass=f=90,afftdn=nf=-28,'
          f'loudnorm=I=-15:TP=-2:LRA=9,afade=in:st=0:d=0.05,afade=out:st={seg - 0.12}:d=0.12,'
          f'adelay={int(TESTI_T * 1000)}|{int(TESTI_T * 1000)},apad[t];'
          f'[m][t]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=9[a]')
    final = os.path.join(out_dir, 'desafio_short15_pasarela.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', music, '-ss', str(TESTI_SS), '-i', testi, '-i', silent,
                    '-filter_complex', fc, '-map', '2:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac',
                    '-b:a', '192k', '-ar', '48000', '-t', str(TOTAL), '-movflags', '+faststart', final], check=True)
    print(final)


if __name__ == '__main__':
    main()
