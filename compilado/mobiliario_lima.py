"""MOBILIARIO CIRCULAR · Lima, Perú (vertical 1080x1920, 44 s) — versión con productos reales.

Cada tipo de producto aparece primero a pantalla completa (videos de producto) y luego
"aterriza" como tarjeta sobre una foto real del borde costero de Lima donde se puede
implementar. Sigue con colores, el proyecto real de Barranco, las propiedades para la
costa, un catálogo de lo que se puede implementar y el llamado a cotizar.

Uso: python3 -I compilado/mobiliario_lima.py <carpeta_con_clips_y_videos_de_producto> [t1,t2,... cuadros de prueba]
Salida: compilado/out/desafio_mobiliario_circular_lima.mp4
"""
import math
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import muebles  # noqa: E402
from build import BG, CREAM, FPS, H, HERE, LIME, SAFE_BOTTOM, SAFE_TOP, TEAL, W, logo  # noqa: E402
from mobiliario import icon, pill  # noqa: E402
from short import ease, find, grade, photo_base, slam, soundtrack, text_img, video_frames, view  # noqa: E402

FOTOS = os.path.join(HERE, 'fotos_lima')
INK = (11, 43, 32)
ADI, PIC, ALL = '57d866bf', 'e2abbb6a', 'aa824c31'  # videos de producto
TOTAL, DROP_T, CTA_T = 44.0, 3.0, 39.0

# Productos: (inicio, título, video pantalla completa (clave, ss), video tarjeta (clave, ss), foto Lima, foco, lugar)
PRODUCTS = [
    (5.0, 'SILLAS ADIRONDACK', (ADI, 2.0), (ADI, 7.0), '063.jpg', (0.45, 0.55), 'Malecón de Miraflores'),
    (8.0, 'MESAS DE PICNIC', (PIC, 0.0), (PIC, 2.2), '101.jpg', (0.40, 0.50), 'Playa Redondo · Miraflores'),
    (11.0, 'BANCAS', (ALL, 0.0), (ALL, 2.0), '067.jpg', (0.30, 0.40), 'Malecón · Miraflores'),
    (14.0, 'SETS LOUNGE', (ALL, 8.4), (ALL, 14.0), '095.jpg', (0.55, 0.65), 'Faro de Miraflores'),
    (17.0, 'MESAS ALTAS Y PISOS', (ALL, 9.3), (ALL, 12.0), '009.jpg', (0.55, 0.65), 'Barranco · Costa Verde'),
]
# Productos a medida (ilustrados sobre la foto): (inicio, título, foto, foco, mueble, origen, escala, lugar)
CUSTOM = [
    (20.0, 'JARDINERAS', '066.jpg', (0.55, 0.45), 'planter', (120, 1490), 2.8, 'Malecón de Miraflores'),
    (21.5, 'REPOSERAS', '085.jpg', (0.35, 0.45), 'lounger', (150, 1480), 3.4, 'Playa Agua Dulce · Chorrillos'),
]
QUICK = [(3.0, '048.jpg', (0.3, 0.4)), (3.5, '065.jpg', (0.55, 0.65)), (4.0, '005.jpg', (0.5, 0.6)),
         (4.5, '106.jpg', (0.4, 0.5))]
PROPS = [
    (29.5, ('p', '015.jpg'), 'NO SE PUDRE', 'drop'),
    (30.5, ('v', ADI, 4.0), 'NO SE ASTILLA', 'plank'),
    (31.5, ('v', ALL, 12.6), 'NO REQUIERE MANTENCIÓN', 'wrench'),
    (32.5, ('p', '009.jpg'), 'RECICLABLE', 'recycle'),
    (33.5, ('p', '005.jpg'), 'RESISTENTE AL SOL', 'sun'),
]
CATALOG = [('Sillas Adirondack', (ADI, 2.5)), ('Mesas de picnic', (PIC, 0.5)), ('Bancas', (ALL, 0.6)),
           ('Sets lounge', (ALL, 8.5)), ('Mesas altas', (ALL, 9.5)), ('Jardineras y más', None)]


def card(src, w, h, border=12):
    """Video/foto en tarjeta redondeada con borde blanco (estilo foto instantánea)."""
    im = src.resize((w, h), Image.BILINEAR, box=_cover_box(src, w, h)).convert('RGBA')
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=34, fill=255)
    out = Image.new('RGBA', (w + 2 * border, h + 2 * border), (0, 0, 0, 0))
    ImageDraw.Draw(out).rounded_rectangle((0, 0, out.width - 1, out.height - 1), radius=34 + border,
                                          fill=(250, 250, 245, 255))
    out.paste(im, (border, border), mask)
    return out


def _cover_box(src, w, h):
    k = min(src.width / w, src.height / h)
    cw, ch = w * k, h * k
    x0, y0 = (src.width - cw) / 2, (src.height - ch) / 2
    return (x0, y0, x0 + cw, y0 + ch)


def drop_card(canvas, c, cx, cy, lt, rot=-4):
    """La tarjeta cae desde abajo con rebote y queda levemente girada, con sombra."""
    k = min(1.0, max(0.0, lt / 0.35))
    s = 1 + 2.4 * (k - 1) ** 3 + 1.4 * (k - 1) ** 2 if k < 1 else 1.0
    if s <= 0.02:
        return
    r = rot * s + (1 - s) * 18
    im = c.resize((max(1, int(c.width * s)), max(1, int(c.height * s))), Image.BILINEAR).rotate(
        r, resample=Image.BICUBIC, expand=True)
    sh = Image.new('RGBA', (im.width + 80, im.height + 80), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 120), (40, 40), im.getchannel('A'))
    sh = sh.filter(ImageFilter.GaussianBlur(22))
    y = cy + (1 - s) * 500
    canvas.alpha_composite(sh, (int(cx - sh.width / 2 + 14), int(y - sh.height / 2 + 24)))
    canvas.alpha_composite(im, (int(cx - im.width / 2), int(y - im.height / 2)))


def main():
    clips = sys.argv[1]
    out_dir = os.path.join(HERE, 'out')
    os.makedirs(out_dir, exist_ok=True)
    tmp = tempfile.mkdtemp()
    stills = [float(x) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else None
    photos, vids = {}, {}

    def ph(name):
        if name not in photos:
            photos[name] = photo_base(os.path.join(FOTOS, name) if name.endswith('.jpg') and '-' not in name
                                      else find(clips, name))
        return photos[name]

    used = set()

    def vf(key, ss, lt, dur, small=False):
        k = (key, ss, small)
        used.add(k)
        if k not in vids:
            n = int(math.ceil(dur * FPS)) + 2
            if small:  # miniaturas para el catálogo (ahorra memoria)
                pr = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', str(ss), '-i', find(clips, key),
                                     '-frames:v', str(n), '-vf', f'scale=360:640,fps={FPS}', '-f', 'rawvideo',
                                     '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True)
                import numpy as np
                arr = np.frombuffer(pr.stdout, np.uint8).reshape(-1, 640, 360, 3)
                vids[k] = [Image.fromarray(a) for a in arr]
            else:
                vids[k] = video_frames(find(clips, key), ss, n)
        fr = vids[k]
        return fr[min(len(fr) - 1, int(lt * FPS))]

    t_head = text_img(['MOBILIARIO', 'CIRCULAR'], 150, [CREAM, LIME])
    t_sub = text_img(['de plástico reciclado', 'para la costa de Lima'], 54, [CREAM])
    p_lima = pill('LIMA · PERÚ', TEAL, (255, 255, 255), 38)
    t_borde = text_img(['LO QUE PODEMOS', 'IMPLEMENTAR EN LIMA'], 92, [CREAM, LIME])
    p_med = pill('PROPUESTA A MEDIDA', (7, 26, 21), CREAM, 26)
    t_col = text_img(['COLORES', 'A ELECCIÓN'], 120, [CREAM, LIME])
    t_real = text_img(['YA EN LA COSTA', 'DE LIMA'], 104, [CREAM, LIME])
    p_real = pill('Pasarela y basureros · Barranco', LIME, INK, 32)
    t_mar = text_img(['HECHO', 'PARA EL MAR'], 120, [CREAM, LIME])
    p_mar = pill('sal · humedad · sol todo el año', TEAL, (255, 255, 255), 34)
    t_cat = text_img(['IMPLEMENTAMOS', 'EN TODA LA COSTA'], 84, [CREAM, LIME])
    cr = text_img(['Fotos de la costa: Wikimedia Commons (CC BY / CC BY-SA)',
                   'créditos completos en la descripción'], 24, [(200, 200, 190)], max_w=760)
    titles = {}

    def title(tx):
        if tx not in titles:
            titles[tx] = text_img([tx], 112, [CREAM])
        return titles[tx]

    enc = None if stills else subprocess.Popen(
        ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
         '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-crf', '22', '-maxrate', '9M', '-bufsize', '18M',
         '-preset', 'medium', '-pix_fmt', 'yuv420p', os.path.join(tmp, 'v.mp4')], stdin=subprocess.PIPE)
    frames = [int(x * FPS) for x in stills] if stills else range(int(TOTAL * FPS))
    for f in frames:
        t = f / FPS
        flash = dim = 0.0
        layers = []  # (función que dibuja sobre g)
        if t < 3.0:  # gancho
            img = view(ph('048.jpg'), t, 3.0, (0.45, 0.6))
            dim = 0.25
            layers.append(lambda g, t=t: (slam(g, p_lima, W / 2, SAFE_TOP + 230, t - 0.25),
                                          slam(g, t_head, W / 2, H * 0.43, t - 0.6),
                                          t > 1.5 and slam(g, t_sub, W / 2, H * 0.58, t - 1.5)))
        elif t < 5.0:
            s0, name, foc = max(q for q in QUICK if q[0] <= t)
            img = view(ph(name), t - s0, 0.5, foc)
            flash, dim = 0.3 * max(0, 1 - (t - s0) / 0.06), 0.3
            layers.append(lambda g, t=t: slam(g, t_borde, W / 2, H * 0.45, t - 3.0))
        elif t < 20.0:  # productos reales
            s0, tx, full, cardv, foto, foc, place = max(q for q in PRODUCTS if q[0] <= t)
            lt = t - s0
            if lt < 1.4:
                img = view(vf(*full, lt, 1.4), lt, 1.4)
                flash = 0.5 * max(0, 1 - lt / 0.1)
                layers.append(lambda g, lt=lt, tx=tx: slam(g, title(tx), W / 2, SAFE_TOP + 150, lt - 0.1))
            else:
                l2 = lt - 1.4
                img = view(ph(foto), l2, 1.6, foc)
                flash = 0.35 * max(0, 1 - l2 / 0.06)
                c = card(vf(*cardv, l2, 1.6), 470, 836)

                def lay(g, l2=l2, c=c, tx=tx, place=place):
                    slam(g, title(tx), W / 2, SAFE_TOP + 150, 1.0)
                    slam(g, pill(place, LIME, INK, 34), W / 2, SAFE_TOP + 285, l2 - 0.1)
                    drop_card(g, c, W / 2, 1030, l2)
                layers.append(lay)
        elif t < 23.0:  # a medida (ilustrado)
            s0, tx, foto, foc, kind, o, sc, place = max(q for q in CUSTOM if q[0] <= t)
            lt = t - s0
            img = view(ph(foto), lt, 1.5, foc).convert('RGBA')
            muebles.draw(img, kind, o, sc, lt * 1.6 - 0.1, 1.1)
            flash = 0.4 * max(0, 1 - lt / 0.08)

            def lay(g, lt=lt, tx=tx, place=place):
                slam(g, title(tx), W / 2, SAFE_TOP + 150, lt - 0.05)
                slam(g, pill(place, LIME, INK, 34), W / 2, SAFE_TOP + 285, lt - 0.2)
                slam(g, p_med, W / 2, SAFE_TOP + 375, lt - 0.35)
            layers.append(lay)
        elif t < 26.0:  # colores
            lt = t - 23.0
            img = view(vf(ADI, 6.0, lt, 1.5), lt, 1.5) if lt < 1.5 else view(vf(PIC, 2.0, lt - 1.5, 1.5), lt - 1.5, 1.5)
            flash = 0.35 * max(0, 1 - (lt % 1.5) / 0.06)
            dim = 0.1
            layers.append(lambda g, lt=lt: slam(g, t_col, W / 2, SAFE_TOP + 190, lt))
        elif t < 29.5:
            if t < 28.5:  # proyecto real Barranco
                k = int(t - 26.0)
                lt = t - 26.0 - k
                src = vf('a2a8096a', (1.2, 10.4)[k], lt, 1.0) if k < 2 else ph('95a9ab11')
                img = view(src, lt, 1.0)
                flash, dim = 0.4 * max(0, 1 - lt / 0.08), 0.15
                layers.append(lambda g, t=t: (slam(g, t_real, W / 2, H * 0.40, t - 26.0),
                                              slam(g, p_real, W / 2, H * 0.40 + 170, t - 26.35)))
            else:
                lt = t - 28.5
                img = view(ph('004.jpg'), lt, 1.0, (0.5, 0.4))
                dim, flash = 0.35, 0.6 * max(0, 1 - lt / 0.12)
                layers.append(lambda g, lt=lt: (slam(g, t_mar, W / 2, H * 0.43, lt),
                                                slam(g, p_mar, W / 2, H * 0.43 + 190, lt - 0.3)))
        elif t < 34.5:  # propiedades
            s0, src, label, ic = max(q for q in PROPS if q[0] <= t)
            lt = t - s0
            img = view(ph(src[1]) if src[0] == 'p' else vf(src[1], src[2], lt, 1.0), lt, 1.0, (0.5, 0.55))
            dim, flash = 0.45, 0.35 * max(0, 1 - lt / 0.06)
            idx = [q[0] for q in PROPS].index(s0)

            def lay(g, lt=lt, ic=ic, label=label, idx=idx):
                slam(g, icon(ic), W / 2, H * 0.40, lt)
                slam(g, text_img([label], 96, [CREAM]), W / 2, H * 0.40 + 260, lt - 0.08)
                dots = Image.new('RGBA', (300, 40), (0, 0, 0, 0))
                dd = ImageDraw.Draw(dots)
                for i in range(5):
                    dd.ellipse((i * 60 + 10, 8, i * 60 + 34, 32),
                               fill=(LIME + (255,)) if i <= idx else (244, 241, 232, 90))
                g.alpha_composite(dots, (W // 2 - 150, SAFE_BOTTOM - 60))
            layers.append(lay)
        elif t < CTA_T:  # catálogo: lo que podemos implementar
            lt = t - 34.5
            img = view(ph('065.jpg'), lt, 4.5, (0.5, 0.6))
            dim = 0.6
            tiles = []
            for i, (lab, v) in enumerate(CATALOG):
                if v:
                    src = vf(v[0], v[1], 0, 0.1, small=True)  # cuadro fijo del producto
                else:
                    if 'planter_tile' not in photos:
                        src = ph('066.jpg').convert('RGBA')
                        sub = src.resize((W, H), Image.BILINEAR, box=_cover_box(src, W, H))
                        muebles.draw(sub, 'planter', (120, 1490), 2.8, 3.0)
                        photos['planter_tile'] = sub.resize((360, 640))
                    src = photos['planter_tile']
                tiles.append((lab, card(src, 340, 330, 8)))

            def lay(g, lt=lt, tiles=tiles):
                slam(g, t_cat, W / 2, SAFE_TOP + 110, lt)
                for i, (lab, c) in enumerate(tiles):
                    cx = W / 2 + (i % 2 - 0.5) * 380
                    cy = SAFE_TOP + 330 + (i // 2) * 290
                    drop_card(g, c.resize((c.width * 3 // 4, c.height * 3 // 4)), cx, cy, lt - 0.25 - i * 0.12,
                              rot=(-3 if i % 2 else 3))
                    if lt > 0.5 + i * 0.12:
                        slam(g, pill(lab, LIME, INK, 24), cx, cy + 118, lt - 0.5 - i * 0.12)
                if lt > 2.0:
                    slam(g, cr, W / 2, SAFE_BOTTOM - 30, lt - 2.0)
            layers.append(lay)
        else:  # llamado a cotizar
            lt = t - CTA_T
            img = Image.new('RGB', (W, H), BG)
            flash = 0.6 * max(0, 1 - lt / 0.12)

            def lay(g, lt=lt):
                glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
                ImageDraw.Draw(glow).ellipse((W / 2 - 480, H * 0.30, W / 2 + 480, H * 0.72), fill=TEAL + (60,))
                g.alpha_composite(glow.filter(ImageFilter.GaussianBlur(150)))
                slam(g, logo(130), W / 2, SAFE_TOP + 130, lt)
                slam(g, text_img(['CONVERSEMOS'], 130, [CREAM]), W / 2, H * 0.40, lt - 0.2)
                if lt > 0.7:
                    slam(g, text_img(['cotiza con nosotros', 'tu mobiliario'], 66, [CREAM]), W / 2, H * 0.52, lt - 0.7)
                if lt > 1.1:
                    slam(g, text_img(['CIRCULAR'], 120, [LIME]), W / 2, H * 0.62, lt - 1.1)
                if lt > 1.6:
                    b = pill('Escríbenos · desafioambiente.cl', LIME, INK, 40)
                    p = 1 + 0.04 * math.sin((lt - 1.6) * 6)
                    slam(g, b.resize((int(b.width * p), int(b.height * p))), W / 2, SAFE_BOTTOM - 70, lt - 1.6)
            layers.append(lay)

        g = grade(img.convert('RGB'), f, flash=flash, dim=dim).convert('RGBA')
        for lay in layers:
            lay(g)
        fade = max(0.0, (t - (TOTAL - 0.4)) / 0.4)
        if fade > 0:
            g = Image.blend(g, Image.new('RGBA', (W, H), BG + (255,)), min(1.0, fade))
        # libera los videos que la escena actual ya no usa
        for k in [k for k in vids if k not in used]:
            del vids[k]
        used.clear()
        if stills:
            g.convert('RGB').save(os.path.join(out_dir, f'still_lima_{t:.1f}.jpg'), quality=85)
            continue
        enc.stdin.write(g.convert('RGB').tobytes())
    if stills:
        return
    enc.stdin.close()
    enc.wait()
    music = os.path.join(tmp, 'm.wav')
    soundtrack(TOTAL, DROP_T, CTA_T, music)
    final = os.path.join(out_dir, 'desafio_mobiliario_circular_lima.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(tmp, 'v.mp4'), '-i', music,
                    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=7',
                    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', final],
                   check=True)
    print(final)


if __name__ == '__main__':
    main()
