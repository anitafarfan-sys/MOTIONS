"""MOBILIARIO CIRCULAR · Lima, Perú (vertical 1080x1920, 28 s) — versión corta con productos reales.

Gancho en la Costa Verde, el clima de Lima (sol, sal, humedad), cada producto a pantalla
completa con "PRODUCTO + PROPIEDAD", colores a elección, resumen de propiedades y el
llamado a cotizar. Cortes al pulso de una pista original de 120 BPM.

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
from build import BG, CREAM, FPS, H, HERE, LIME, SAFE_BOTTOM, SAFE_TOP, TEAL, W, logo  # noqa: E402
from mobiliario import icon, pill  # noqa: E402
from short import find, grade, photo_base, slam, soundtrack, text_img, video_frames, view  # noqa: E402

FOTOS = os.path.join(HERE, 'fotos_lima')
PROD = os.path.join(HERE, 'productos')
INK = (11, 43, 32)
ADI, PIC, ALL = '57d866bf', 'e2abbb6a', 'aa824c31'  # videos de producto
TOTAL, DROP_T, CTA_T = 28.0, 2.5, 24.0
SEG = 2.6  # duración de cada producto (dos tomas de 1,3 s)

# (título, propiedad, ícono, toma 1, toma 2, lugar en Lima). Toma: ('v', clave, ss) o ('p', archivo, foco)
PRODUCTS = [
    ('REPOSERAS', 'RESISTENTES AL SOL', 'sun', ('p', 'reposera_cafe_mesa.webp', (0.15, 0.30)),
     ('p', 'reposera_beige.webp', (0.5, 0.5)), 'Playas de la Costa Verde'),
    ('SILLAS ADIRONDACK', 'NO SE PUDREN', 'drop', ('v', ADI, 2.0), ('v', ADI, 4.0), 'Malecón de Miraflores'),
    ('MESAS DE PICNIC', '100% CIRCULARES', 'recycle', ('v', PIC, 0.0), ('v', PIC, 7.0), 'Parques y playas de Lima'),
    ('BANCAS', 'CERO MANTENCIÓN', 'wrench', ('v', ALL, 0.0), ('v', ALL, 2.0), 'Malecones y paseos'),
    ('SETS LOUNGE', 'NO SE ASTILLAN · NO SE PUDREN', 'plank', ('v', ALL, 8.4), ('v', ALL, 14.0),
     'Terrazas frente al mar'),
    ('MESAS ALTAS', 'RECICLABLES', 'recycle', ('v', ALL, 9.3), ('v', ALL, 12.0), 'Barranco · Chorrillos'),
]
PROD_T = 4.0
COLORS_T = PROD_T + SEG * len(PRODUCTS)   # 19.6
RECAP_T = COLORS_T + 2.4                  # 22.0
QUICK = [(2.5, '065.jpg', (0.55, 0.65)), (3.0, '005.jpg', (0.5, 0.6)), (3.5, '106.jpg', (0.4, 0.5))]


def main():
    clips = sys.argv[1]
    out_dir = os.path.join(HERE, 'out')
    os.makedirs(out_dir, exist_ok=True)
    tmp = tempfile.mkdtemp()
    stills = [float(x) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else None
    photos, vids, used = {}, {}, set()

    def ph(name):
        if name not in photos:
            d = PROD if name.endswith('.webp') else FOTOS
            photos[name] = photo_base(os.path.join(d, name))
        return photos[name]

    def vf(key, ss, lt, dur):
        k = (key, ss)
        used.add(k)
        if k not in vids:
            vids[k] = video_frames(find(clips, key), ss, int(math.ceil(dur * FPS)) + 2)
        fr = vids[k]
        return fr[min(len(fr) - 1, int(lt * FPS))]

    def shot(s, lt, dur):
        if s[0] == 'v':
            return view(vf(s[1], s[2], lt, dur), lt, dur)
        return view(ph(s[1]), lt, dur, s[2])

    cache = {}

    def txt(lines, size, colors):
        k = (tuple(lines), size, tuple(colors))
        if k not in cache:
            cache[k] = text_img(lines, size, colors)
        return cache[k]

    p_lima = pill('LIMA · PERÚ', TEAL, (255, 255, 255), 38)
    t_head = txt(['MOBILIARIO', 'CIRCULAR'], 150, [CREAM, LIME])
    t_clima = txt(['SOL · SAL · HUMEDAD', 'TODO EL AÑO'], 92, [CREAM, LIME])
    t_hecho = txt(['HECHO PARA EL', 'CLIMA DE LIMA'], 96, [CREAM, LIME])
    t_col = txt(['COLORES', 'A ELECCIÓN'], 120, [CREAM, LIME])
    t_rec1 = txt(['UN MATERIAL,'], 96, [CREAM])
    t_rec2 = txt(['MIL USOS EN LA COSTA'], 80, [LIME])
    labels = ['No se pudre', 'No se astilla', 'Cero mantención', 'Reciclable', 'Resistente al sol']
    kinds = ['drop', 'plank', 'wrench', 'recycle', 'sun']

    enc = None if stills else subprocess.Popen(
        ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
         '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-crf', '22', '-maxrate', '9M', '-bufsize', '18M',
         '-preset', 'medium', '-pix_fmt', 'yuv420p', os.path.join(tmp, 'v.mp4')], stdin=subprocess.PIPE)
    frames = [int(x * FPS) for x in stills] if stills else range(int(TOTAL * FPS))
    for f in frames:
        t = f / FPS
        flash = dim = 0.0
        layers = []
        if t < 2.5:  # gancho
            img = view(ph('048.jpg'), t, 2.5, (0.45, 0.6))
            dim = 0.25
            layers.append(lambda g, t=t: (slam(g, p_lima, W / 2, SAFE_TOP + 230, t - 0.15),
                                          slam(g, t_head, W / 2, H * 0.45, t - 0.4)))
        elif t < PROD_T:  # clima de Lima
            s0, name, foc = max(q for q in QUICK if q[0] <= t)
            img = view(ph(name), t - s0, 0.5, foc)
            flash, dim = 0.3 * max(0, 1 - (t - s0) / 0.06), 0.35
            layers.append(lambda g, t=t: slam(g, t_clima if t < 3.25 else t_hecho, W / 2, H * 0.45,
                                              t - (2.5 if t < 3.25 else 3.25)))
        elif t < COLORS_T:  # productos a pantalla completa
            i = int((t - PROD_T) // SEG)
            lt = t - PROD_T - i * SEG
            tx, prop, ic, s1, s2, place = PRODUCTS[i]
            sub, l2 = (s1, lt) if lt < SEG / 2 else (s2, lt - SEG / 2)
            img = shot(sub, l2, SEG / 2)
            flash = (0.55 if lt < SEG / 2 else 0.25) * max(0, 1 - l2 / 0.08)
            dim = 0.08

            def lay(g, lt=lt, tx=tx, prop=prop, ic=ic, place=place, i=i):
                # banda superior oscura para que el texto se lea sobre cualquier toma
                band = Image.new('RGBA', (W, 560), (0, 0, 0, 0))
                bd = ImageDraw.Draw(band)
                for y in range(560):
                    bd.line((0, y, W, y), fill=(7, 26, 21, int(170 * (1 - y / 560) ** 1.3)))
                g.alpha_composite(band, (0, 0))
                slam(g, txt([tx], 112 if len(tx) < 14 else 92, [CREAM]), W / 2, SAFE_TOP + 110, lt - 0.05)
                slam(g, txt(['+ ' + prop], 70 if len(prop) < 20 else 54, [LIME]), W / 2, SAFE_TOP + 220, lt - 0.3)
                if lt > 0.5:
                    slam(g, icon(ic, 150), W - 220, SAFE_BOTTOM - 120, lt - 0.5)
                    slam(g, pill('Ideal para: ' + place, (7, 26, 21), CREAM, 28), W / 2 - 80, SAFE_BOTTOM - 40, lt - 0.6)
                dots = Image.new('RGBA', (360, 30), (0, 0, 0, 0))
                dd = ImageDraw.Draw(dots)
                for k in range(len(PRODUCTS)):
                    dd.rounded_rectangle((k * 60, 10, k * 60 + 48, 18), radius=4,
                                         fill=(LIME + (255,)) if k <= i else (244, 241, 232, 90))
                g.alpha_composite(dots, (W // 2 - 175, SAFE_TOP + 290))
            layers.append(lay)
        elif t < RECAP_T:  # colores
            lt = t - COLORS_T
            img = view(vf(ADI, 6.0, lt, 1.2), lt, 1.2) if lt < 1.2 else view(vf(PIC, 2.2, lt - 1.2, 1.2), lt - 1.2, 1.2)
            flash, dim = 0.35 * max(0, 1 - (lt % 1.2) / 0.06), 0.3
            layers.append(lambda g, lt=lt: slam(g, t_col, W / 2, SAFE_TOP + 190, lt))
        elif t < CTA_T:  # resumen de propiedades
            lt = t - RECAP_T
            img = view(ph('095.jpg'), lt, CTA_T - RECAP_T, (0.55, 0.65))
            dim, flash = 0.55, 0.5 * max(0, 1 - lt / 0.1)

            def lay(g, lt=lt):
                slam(g, t_rec1, W / 2, SAFE_TOP + 140, lt)
                slam(g, t_rec2, W / 2, SAFE_TOP + 250, lt - 0.2)
                for k, (lab, kd) in enumerate(zip(labels, kinds)):
                    y = SAFE_TOP + 420 + k * 150
                    if lt < 0.4 + k * 0.18:
                        continue
                    row = Image.new('RGBA', (720, 130), (0, 0, 0, 0))
                    row.alpha_composite(icon(kd, 120), (0, 5))
                    from build import font
                    ImageDraw.Draw(row).text((150, 34), lab.upper(), font=font('Black', 56), fill=CREAM)
                    slam(g, row, W / 2, y, lt - 0.4 - k * 0.18)
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
                slam(g, txt(['CONVERSEMOS'], 130, [CREAM]), W / 2, H * 0.40, lt - 0.2)
                if lt > 0.6:
                    slam(g, txt(['cotiza con nosotros', 'tu mobiliario'], 66, [CREAM]), W / 2, H * 0.52, lt - 0.6)
                if lt > 1.0:
                    slam(g, txt(['CIRCULAR'], 120, [LIME]), W / 2, H * 0.62, lt - 1.0)
                if lt > 1.4:
                    b = pill('Escríbenos · desafioambiente.cl', LIME, INK, 40)
                    p = 1 + 0.04 * math.sin((lt - 1.4) * 6)
                    slam(g, b.resize((int(b.width * p), int(b.height * p))), W / 2, SAFE_BOTTOM - 70, lt - 1.4)
            layers.append(lay)

        g = grade(img.convert('RGB'), f, flash=flash, dim=dim).convert('RGBA')
        for lay in layers:
            lay(g)
        fade = max(0.0, (t - (TOTAL - 0.4)) / 0.4)
        if fade > 0:
            g = Image.blend(g, Image.new('RGBA', (W, H), BG + (255,)), min(1.0, fade))
        for k in [k for k in vids if k not in used]:  # libera videos que ya no se usan
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
