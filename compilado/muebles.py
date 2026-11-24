"""Mobiliario de madera plástica dibujado en proyección oblicua (para componer sobre fotos).

Cada mueble es una lista de tablas/piezas (cajas 3D en cm). Las piezas caen y se
arman una a una con un pequeño rebote, como si se ensamblaran tabla por tabla.
"""
from PIL import Image, ImageDraw, ImageFilter

KX, KY = 0.55, 0.36  # profundidad: hacia la derecha y hacia arriba

# colores de madera plástica (frente, cara superior, lateral)
WOOD = ((118, 88, 62), (150, 115, 84), (92, 68, 48))
GREY = ((178, 186, 176), (208, 214, 204), (140, 148, 140))
TEALW = ((22, 128, 132), (40, 160, 162), (14, 98, 102))
BLUE = ((40, 120, 205), (70, 150, 230), (28, 92, 165))
EDGE = (25, 18, 12, 140)


def _proj(o, s, x, y, z):
    return (o[0] + s * (x + z * KX), o[1] - s * (y + z * KY))


def _box(d, o, s, b, col):
    x, y, z, w, h, dp = b
    P = lambda a, bb, c: _proj(o, s, a, bb, c)  # noqa: E731
    top = [P(x, y + h, z), P(x + w, y + h, z), P(x + w, y + h, z + dp), P(x, y + h, z + dp)]
    side = [P(x + w, y, z), P(x + w, y, z + dp), P(x + w, y + h, z + dp), P(x + w, y + h, z)]
    front = [P(x, y, z), P(x + w, y, z), P(x + w, y + h, z), P(x, y + h, z)]
    d.polygon(top, fill=col[1], outline=EDGE)
    d.polygon(side, fill=col[2], outline=EDGE)
    d.polygon(front, fill=col[0], outline=EDGE)


def bench():
    p = [((12, 0, 2, 8, 45, 40), WOOD, 0.0), ((160, 0, 2, 8, 45, 40), WOOD, 0.05)]
    p += [((0, 45, z, 180, 4, 12), WOOD, 0.15 + k * 0.08) for k, z in enumerate((30, 15, 0))]
    p += [((14, 45, 40, 6, 52, 4), WOOD, 0.4), ((160, 45, 40, 6, 52, 4), WOOD, 0.42)]
    p += [((0, 80, 43, 180, 12, 3), WOOD, 0.5), ((0, 62, 43, 180, 12, 3), WOOD, 0.58)]
    return p, (180, 46)


def picnic():
    p = [((22, 0, 82, 8, 45, 28), WOOD, 0.0), ((150, 0, 82, 8, 45, 28), WOOD, 0.02),
         ((22, 0, 2, 8, 75, 66), WOOD, 0.05), ((150, 0, 2, 8, 75, 66), WOOD, 0.07),
         ((22, 0, -40, 8, 45, 28), WOOD, 0.1), ((150, 0, -40, 8, 45, 28), WOOD, 0.12)]
    p += [((0, 45, z, 180, 4, 12), WOOD, 0.2 + k * 0.06) for k, z in enumerate((97, 83))]
    p += [((0, 75, z, 180, 4, 12), WOOD, 0.34 + k * 0.06) for k, z in enumerate((56, 42, 28, 14, 0))]
    p += [((0, 45, z, 180, 4, 12), WOOD, 0.66 + k * 0.06) for k, z in enumerate((-26, -40))]
    return p, (180, 150)


def planter():
    p = [((0, k * 14, 0, 120, 13, 60), TEALW, k * 0.1) for k in range(4)]
    p += [((4, 56, 4, 112, 2, 52), ((70, 52, 36), (86, 64, 44), (60, 44, 30)), 0.42)]
    return p, (120, 60)


def lounger():
    p = [((8, 0, 4, 6, 24, 6), GREY, 0.0), ((8, 0, 52, 6, 24, 6), GREY, 0.02),
         ((168, 0, 4, 6, 24, 6), GREY, 0.04), ((168, 0, 52, 6, 24, 6), GREY, 0.06),
         ((0, 24, 0, 182, 5, 6), BLUE, 0.1), ((0, 24, 56, 182, 5, 6), BLUE, 0.12)]
    p += [((x, 29, 2, 10, 3, 58), GREY, 0.2 + k * 0.03) for k, x in enumerate(range(0, 121, 13))]
    for k in range(6):  # respaldo inclinado, tabla por tabla
        x, y = 124 + k * 9.5, 30 + k * 11
        p.append(((x, y, 2, 9, 3, 58), GREY, 0.55 + k * 0.04))
    return p, (182, 62)


FURNITURE = {'bench': bench, 'picnic': picnic, 'planter': planter, 'lounger': lounger}


def _plants(d, o, s, a):
    """Follaje sobre la jardinera (aparece al final)."""
    if a <= 0:
        return
    import math
    greens = [(76, 150, 70), (104, 178, 82), (58, 128, 60), (140, 200, 90)]
    for k in range(14):
        x = 10 + (k * 37) % 100
        z = 8 + (k * 23) % 44
        r = (14 + (k * 7) % 10) * a
        cx, cy = _proj(o, s, x, 58 + 10 * math.sin(k), z)
        cy -= (18 + (k * 5) % 22) * s * a
        d.ellipse((cx - r * s, cy - r * s, cx + r * s, cy + r * s), fill=greens[k % 4])
    for k in range(6):  # flores
        x, z = 20 + k * 16, 14 + (k * 17) % 34
        cx, cy = _proj(o, s, x, 70, z)
        cy -= 30 * s * a
        rr = 5 * s * a
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=[(255, 214, 60), (255, 120, 90), (250, 250, 240)][k % 3])


def draw(canvas, kind, o, s, t, dur=1.4):
    """Dibuja el mueble `kind` sobre `canvas` (RGBA) con origen `o` (frente-abajo-izq) y escala `s`.
    `t` es el tiempo desde que empieza el armado; `dur` la duración del armado."""
    parts, (w, dp) = FURNITURE[kind]()
    # sombra en el piso
    sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    a0 = _proj(o, s, -10, 0, -10)
    a1 = _proj(o, s, w + 20, 0, dp + 10)
    cx, cy = (a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2
    rx, ry = abs(a1[0] - a0[0]) / 2 + 20, abs(a1[1] - a0[1]) / 2 + 18
    ImageDraw.Draw(sh).ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(0, 0, 0, int(110 * min(1, t / 0.4))))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    d = ImageDraw.Draw(canvas)
    # orden de dibujo: más lejos primero, más abajo primero
    order = sorted(parts, key=lambda q: (-(q[0][2] + q[0][5] / 2), q[0][1], q[0][0]))
    for b, col, delay in order:
        k = (t - delay * dur) / 0.28
        if k <= 0:
            continue
        k = min(1.0, k)
        bounce = 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2 if k < 1 else 1.0
        lift = (1 - bounce) * 70 / s
        x, y, z, ww, hh, dd = b
        _box(d, o, s, (x, y + lift, z, ww, hh, dd), col)
    if kind == 'planter':
        _plants(d, o, s, max(0.0, min(1.0, (t - 0.55 * dur) / 0.5)))


if __name__ == '__main__':
    import sys
    bg = Image.open(sys.argv[1]).convert('RGBA').resize((1080, 1920))
    out = Image.new('RGBA', (2160, 1920))
    for n, (kind, t) in enumerate([('bench', 3), ('picnic', 3), ('planter', 3), ('lounger', 3)]):
        c = bg.copy()
        draw(c, kind, (220, 1300), 3.2 if kind != 'picnic' else 2.6, t)
        out.paste(c.resize((540, 960)), ((n % 4) * 540, 0))
    out.crop((0, 0, 2160, 960)).convert('RGB').save(sys.argv[2])
