"""MOBILIARIO CIRCULAR · borde costero de Lima, Perú (vertical 1080x1920, ~31 s).

Fotos reales de la Costa Verde (Wikimedia Commons, licencias libres) con propuestas
de mobiliario de madera plástica reciclada que se arman tabla por tabla
(reposeras, mesas de picnic, jardineras, bancas), el proyecto real de la pasarela
de Barranco y las propiedades clave para la costa. Cortes al pulso de una pista
original de 120 BPM, color cinematográfico y zona segura de Reels/Historias.

Uso: python3 -I compilado/mobiliario.py <carpeta_clips_barranco> [t1,t2,...  (solo cuadros de prueba)]
Salida: compilado/out/desafio_mobiliario_circular_lima.mp4
"""
import math
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import muebles  # noqa: E402
from build import (BG, CREAM, FPS, H, HERE, LIME, SAFE_BOTTOM, SAFE_TOP, TEAL, W,  # noqa: E402
                   font, logo)
from short import (find, grade, photo_base, slam, soundtrack, tag_img, text_img,  # noqa: E402
                   video_frames, view)

FOTOS = os.path.join(HERE, 'fotos_lima')
TOTAL, DROP_T, OUTRO_T, CTA_T = 35.0, 3.0, 26.5, 30.5
INK = (11, 43, 32)

# Escenas de producto: (inicio, foto, foco x (inicio, fin), mueble, origen, escala, título, lugar)
PRODUCTS = [
    (5.0, '085.jpg', (0.35, 0.45), 'lounger', (150, 1480), 3.4, 'REPOSERAS', 'Playa Agua Dulce · Chorrillos'),
    (8.0, '101.jpg', (0.40, 0.50), 'picnic', (230, 1330), 2.7, 'MESAS DE PICNIC', 'Playa Redondo · Miraflores'),
    (11.0, '066.jpg', (0.55, 0.45), 'planter', (120, 1490), 2.8, 'JARDINERAS', 'Malecón de Miraflores'),
    (14.0, '067.jpg', (0.78, 0.86), 'bench', (470, 1440), 2.6, 'BANCAS', 'Malecón · Miraflores'),
]
QUICK = [(3.0, '009.jpg', (0.6, 0.7)), (3.5, '065.jpg', (0.55, 0.65)), (4.0, '063.jpg', (0.4, 0.5)),
         (4.5, '095.jpg', (0.6, 0.7))]
PROPS = [
    (21.5, '015.jpg', 'NO SE PUDRE', 'drop'),
    (22.5, '082.jpg', 'NO SE ASTILLA', 'plank'),
    (23.5, '063.jpg', 'NO REQUIERE MANTENCIÓN', 'wrench'),
    (24.5, '009.jpg', 'RECICLABLE', 'recycle'),
    (25.5, '005.jpg', 'RESISTENTE AL SOL', 'sun'),
]


def icon(kind, size=300):
    """Ícono lineal dentro de un círculo lima."""
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c, r = size / 2, size / 2 - 6
    d.ellipse((c - r, c - r, c + r, c + r), fill=(7, 26, 21, 200), outline=LIME + (255,), width=10)
    k = size / 300
    lw = int(14 * k)
    col = CREAM + (255,)
    if kind == 'drop':
        d.polygon([(c, c - 90 * k), (c - 58 * k, c + 10 * k), (c + 58 * k, c + 10 * k)], fill=TEAL + (255,))
        d.ellipse((c - 60 * k, c - 40 * k, c + 60 * k, c + 80 * k), fill=TEAL + (255,))
        d.line((c - 30 * k, c + 25 * k, c - 6 * k, c + 48 * k, c + 34 * k, c + 2 * k), fill=col, width=lw, joint='curve')
    elif kind == 'plank':
        for i in range(3):
            y = c - 70 * k + i * 50 * k
            d.rounded_rectangle((c - 95 * k, y, c + 95 * k, y + 38 * k), radius=8 * k, fill=(150, 115, 84, 255))
        d.line((c - 40 * k, c + 2 * k, c - 8 * k, c + 32 * k, c + 52 * k, c - 30 * k), fill=LIME + (255,), width=lw)
    elif kind == 'wrench':
        d.line((c - 60 * k, c + 60 * k, c + 30 * k, c - 30 * k), fill=col, width=int(26 * k))
        d.ellipse((c + 5 * k, c - 85 * k, c + 85 * k, c - 5 * k), outline=col, width=int(22 * k))
        d.line((c - 95 * k, c - 95 * k, c + 95 * k, c + 95 * k), fill=(255, 90, 78, 255), width=lw)
    elif kind == 'recycle':
        for a in range(3):
            a0 = a * 120 - 80
            d.arc((c - 85 * k, c - 85 * k, c + 85 * k, c + 85 * k), a0, a0 + 85, fill=LIME + (255,), width=int(22 * k))
            t = math.radians(a0 + 85)
            px, py = c + 85 * k * math.cos(t), c + 85 * k * math.sin(t)
            tx, ty = -math.sin(t), math.cos(t)
            nx, ny = math.cos(t), math.sin(t)
            d.polygon([(px + tx * 34 * k, py + ty * 34 * k), (px + nx * 28 * k, py + ny * 28 * k),
                       (px - nx * 28 * k, py - ny * 28 * k)], fill=LIME + (255,))
    elif kind == 'sun':
        d.ellipse((c - 48 * k, c - 48 * k, c + 48 * k, c + 48 * k), fill=(255, 200, 70, 255))
        for i in range(12):
            t = math.radians(i * 30)
            d.line((c + 68 * k * math.cos(t), c + 68 * k * math.sin(t), c + 100 * k * math.cos(t),
                    c + 100 * k * math.sin(t)), fill=(255, 200, 70, 255), width=lw)
    return im


def pill(text, bg, fg, size=34):
    f = font('ExtraBold', size)
    dd = ImageDraw.Draw(Image.new('RGBA', (10, 10)))
    w = int(dd.textlength(text, font=f)) + size * 2
    im = Image.new('RGBA', (w, int(size * 1.9)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, im.height - 1), radius=im.height // 2, fill=bg + (255,))
    d.text((size, size * 0.38), text, font=f, fill=fg)
    return im


def main():
    clips = sys.argv[1]
    out_dir = os.path.join(HERE, 'out')
    os.makedirs(out_dir, exist_ok=True)
    tmp = tempfile.mkdtemp()
    photos = {}

    def ph(name):
        if name not in photos:
            photos[name] = photo_base(os.path.join(FOTOS, name))
        return photos[name]

    t_head = text_img(['MOBILIARIO', 'CIRCULAR'], 150, [CREAM, LIME])
    t_sub = text_img(['de plástico reciclado', 'para la costa de Lima'], 54, [CREAM])
    p_lima = pill('LIMA · PERÚ', TEAL, (255, 255, 255), 38)
    t_borde = text_img(['PARA EL', 'BORDE COSTERO'], 110, [CREAM, LIME])
    p_prop = pill('PROPUESTA · MADERA PLÁSTICA', (7, 26, 21), CREAM, 26)
    t_real = text_img(['YA EN LA COSTA', 'DE LIMA'], 104, [CREAM, LIME])
    p_real = pill('Pasarela y basureros · Barranco', LIME, INK, 32)
    t_mar = text_img(['HECHO', 'PARA EL MAR'], 120, [CREAM, LIME])
    p_mar = pill('sal · humedad · sol todo el año', TEAL, (255, 255, 255), 34)

    stills = [float(x) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else None
    enc = None if stills else subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                            '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-crf', '22',
                            '-maxrate', '9M', '-bufsize', '18M', '-preset', 'medium', '-pix_fmt', 'yuv420p',
                            os.path.join(tmp, 'v.mp4')], stdin=subprocess.PIPE)
    real_frames = {}
    n_total = int(TOTAL * FPS)
    for f in ([int(x * FPS) for x in stills] if stills else range(n_total)):
        t = f / FPS
        flash, dim, img = 0.0, 0.0, None
        if t < 3.0:  # gancho
            img = view(ph('048.jpg'), t, 3.0, (0.45, 0.6)).convert('RGBA')
            dim = 0.25
        elif t < 5.0:
            s0, name, foc = max(q for q in QUICK if q[0] <= t)
            img = view(ph(name), t - s0, 0.5, foc).convert('RGBA')
            flash, dim = 0.3 * max(0, 1 - (t - s0) / 0.06), 0.25
        elif t < 17.0:
            s0, name, foc, kind, o, sc, title, place = max(q for q in PRODUCTS if q[0] <= t)
            lt = t - s0
            img = view(ph(name), lt, 3.0, foc).convert('RGBA')
            muebles.draw(img, kind, o, sc, lt - 0.35, 1.4)
            flash = 0.5 * max(0, 1 - lt / 0.1)
        elif t < 20.0:
            k = int(t - 17.0)
            lt = t - 17.0 - k
            if k < 2:
                key = (k, 'a2a8096a', 1.2 if k == 0 else 10.4)
                if key not in real_frames:
                    real_frames[key] = video_frames(find(clips, 'a2a8096a'), key[2], FPS)
                src = real_frames[key][min(FPS - 1, int(lt * FPS))]
            else:
                src = photos.setdefault('real', photo_base(find(clips, '95a9ab11')))
            img = view(src, lt, 1.0).convert('RGBA')
            flash, dim = 0.4 * max(0, 1 - lt / 0.08), 0.15
        elif t < 21.5:
            img = view(ph('004.jpg'), t - 20.0, 1.5, (0.5, 0.4)).convert('RGBA')
            dim = 0.35
            flash = 0.6 * max(0, 1 - (t - 20.0) / 0.12)
        elif t < OUTRO_T:
            s0, name, label, ic = max(q for q in PROPS if q[0] <= t)
            img = view(ph(name), t - s0, 1.0, (0.5, 0.55)).convert('RGBA')
            dim = 0.45
            flash = 0.35 * max(0, 1 - (t - s0) / 0.06)
        else:
            img = view(ph('095.jpg'), t - OUTRO_T, CTA_T - OUTRO_T, (0.55, 0.65)).convert('RGBA')
            dim = 0.62
            flash = 0.7 * max(0, 1 - (t - OUTRO_T) / 0.15)

        g = grade(img.convert('RGB'), f, flash=flash, dim=dim).convert('RGBA')

        # ---- capas de texto (todas dentro de la zona segura) ----
        if t < 3.0:
            slam(g, p_lima, W / 2, SAFE_TOP + 230, t - 0.25)
            slam(g, t_head, W / 2, H * 0.43, t - 0.6)
            if t > 1.5:
                slam(g, t_sub, W / 2, H * 0.58, t - 1.5)
        elif t < 5.0:
            slam(g, t_borde, W / 2, H * 0.45, t - 3.0)
        elif t < 17.0:
            lt = t - s0
            title_img = text_img([title], 118, [CREAM])
            slam(g, title_img, W / 2, SAFE_TOP + 150, lt - 0.15)
            slam(g, pill(place, LIME, INK, 34), W / 2, SAFE_TOP + 285, lt - 0.45)
            if lt > 1.6:
                slam(g, p_prop, W / 2, SAFE_TOP + 375, lt - 1.6)
        elif t < 20.0:
            slam(g, t_real, W / 2, H * 0.40, t - 17.0)
            slam(g, p_real, W / 2, H * 0.40 + 170, t - 17.35)
        elif t < 21.5:
            slam(g, t_mar, W / 2, H * 0.43, t - 20.0)
            slam(g, p_mar, W / 2, H * 0.43 + 190, t - 20.35)
        elif t < OUTRO_T:
            lt = t - s0
            slam(g, icon(ic), W / 2, H * 0.40, lt)
            slam(g, text_img([label], 96, [CREAM]), W / 2, H * 0.40 + 260, lt - 0.08)
            # contador de propiedades
            dots = Image.new('RGBA', (300, 40), (0, 0, 0, 0))
            dd = ImageDraw.Draw(dots)
            idx = [q[0] for q in PROPS].index(s0)
            for i in range(5):
                dd.ellipse((i * 60 + 10, 8, i * 60 + 34, 32), fill=(LIME if i <= idx else (244, 241, 232)) + ((255,) if i <= idx else (90,)))
            g.alpha_composite(dots, (W // 2 - 150, SAFE_BOTTOM - 60))
        elif t >= CTA_T:  # llamado a la acción final
            lt = t - CTA_T
            g = grade(Image.new('RGB', (W, H), BG), f, flash=0.6 * max(0, 1 - lt / 0.12)).convert('RGBA')
            glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            ImageDraw.Draw(glow).ellipse((W / 2 - 480, H * 0.30, W / 2 + 480, H * 0.72), fill=TEAL + (60,))
            from PIL import ImageFilter
            g.alpha_composite(glow.filter(ImageFilter.GaussianBlur(150)))
            slam(g, logo(130), W / 2, SAFE_TOP + 130, lt)
            slam(g, text_img(['CONVERSEMOS'], 130, [CREAM]), W / 2, H * 0.40, lt - 0.2)
            if lt > 0.7:
                slam(g, text_img(['cotiza con nosotros', 'tu mobiliario'], 66, [CREAM]), W / 2, H * 0.52, lt - 0.7)
            if lt > 1.1:
                slam(g, text_img(['CIRCULAR'], 120, [LIME]), W / 2, H * 0.62, lt - 1.1)
            if lt > 1.6:
                b = pill('Escríbenos · desafioambiente.cl', LIME, INK, 40)
                pulse = 1 + 0.04 * math.sin((lt - 1.6) * 6)
                b = b.resize((int(b.width * pulse), int(b.height * pulse)))
                slam(g, b, W / 2, SAFE_BOTTOM - 70, lt - 1.6)
            fade = max(0.0, (lt - (TOTAL - CTA_T - 0.4)) / 0.4)
            if fade > 0:
                g = Image.blend(g, Image.new('RGBA', (W, H), BG + (255,)), min(1.0, fade))
        else:
            lt = t - OUTRO_T
            slam(g, logo(150), W / 2, SAFE_TOP + 200, lt)
            slam(g, t_head.resize((t_head.width * 3 // 4, t_head.height * 3 // 4)), W / 2, H * 0.42, lt - 0.3)
            if lt > 0.8:
                slam(g, text_img(['Madera plástica reciclada', 'Lima · Perú'], 50, [LIME]), W / 2, H * 0.56, lt - 0.8)
            if lt > 1.4:
                slam(g, text_img(['ELIMINAR EL PLÁSTICO DEL PLANETA'], 44, [CREAM]), W / 2, H * 0.66, lt - 1.4)
            if lt > 2.0:
                cr = text_img(['Fotos de la costa: Wikimedia Commons (CC BY / CC BY-SA)',
                               'créditos completos en la descripción'], 24, [(200, 200, 190)], max_w=760)
                slam(g, cr, W / 2, SAFE_BOTTOM - 50, lt - 2.0)
            fade = max(0.0, (lt - (CTA_T - OUTRO_T - 0.3)) / 0.3)
            if fade > 0:
                g = Image.blend(g, Image.new('RGBA', (W, H), BG + (255,)), min(1.0, fade))
        if stills:
            g.convert('RGB').save(os.path.join(out_dir, f'still_mob_{t:.1f}.jpg'), quality=85)
            continue
        enc.stdin.write(g.convert('RGB').tobytes())
    if stills:
        return
    enc.stdin.close()
    enc.wait()

    music = os.path.join(tmp, 'm.wav')
    soundtrack(TOTAL, DROP_T, OUTRO_T, music)
    final = os.path.join(out_dir, 'desafio_mobiliario_circular_lima.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(tmp, 'v.mp4'), '-i', music,
                    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=7',
                    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', final],
                   check=True)
    print(final)


if __name__ == '__main__':
    main()
