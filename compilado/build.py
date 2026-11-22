"""Compilado vertical (1080x1920) de la jornada en la playa de Barranco.

Toma los clips de WhatsApp y la foto grupal, elige los mejores tramos, les
agrega textos con la marca Desafío Ambiente y cierra con el logo.

Uso: python3 -I compilado/build.py <carpeta_con_clips> <foto_grupal.jpg>
Salida: compilado/out/desafio_jornada_barranco.mp4
"""
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'motion', 'assets')
FONT_DIR = '/usr/share/fonts/opentype/inter'
BG = (7, 26, 21)
CREAM = (244, 241, 232)
LIME = (182, 227, 90)
TEAL = (8, 162, 167)

# Zona segura común a Reels e Historias de Instagram (1080x1920): arriba queda el
# nombre de la cuenta y la barra de progreso; abajo, la descripción, la caja de
# respuesta y la música; a la derecha, los botones de me gusta / comentar / compartir.
SAFE_TOP, SAFE_BOTTOM = 250, H - 440      # 250 .. 1480
SAFE_LEFT, SAFE_RIGHT = 70, W - 140       # 70 .. 940
SAFE_TEXT_W = 780                         # ancho máx. de un texto centrado (150 .. 930)

# (archivo, inicio, duración, etiqueta, texto)
SHOTS = [
    ('a2a8096a', 0.0, 4.5, 'PLAYA DE BARRANCO', 'Una pasarela hecha con plástico reciclado'),
    ('a2a8096a', 10.2, 3.6, 'MADERA PLÁSTICA', 'Basureros para separar en origen'),
    ('96ad7b92', 16.0, 4.0, 'INFRAESTRUCTURA', 'Accesible para todos en la playa'),
    ('96ad7b92', 0.5, 3.5, 'DESAFÍO AMBIENTE', 'Transformamos plástico en madera plástica'),
    ('f80a6329', 1.5, 4.0, 'RECICLADORES', 'El trabajo de quienes recuperan el residuo'),
    ('64a257e2', 0.0, 5.0, 'EN EQUIPO', 'Recicladores autorizados de Barranco'),
    ('03e040df', 9.0, 3.5, 'ALIANZAS', 'Marcas que se suman al impacto'),
    ('a2a8096a', 14.6, 2.6, 'MUNICIPALIDAD DE BARRANCO', 'Trabajo conjunto con el municipio'),
]


def font(weight, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, f'Inter-{weight}.otf'), size)


def fit_font(text, weight, size, max_w=SAFE_TEXT_W):
    """Fuente al tamaño pedido, achicada si el texto no cabe en max_w."""
    d = ImageDraw.Draw(Image.new('RGBA', (10, 10)))
    while size > 20 and d.textlength(text, font=font(weight, size)) > max_w:
        size -= 2
    return font(weight, size)


def wrap(draw, text, fnt, max_w):
    words, lines, line = text.split(), [], ''
    for w in words:
        test = f'{line} {w}'.strip()
        if draw.textlength(test, font=fnt) > max_w and line:
            lines.append(line)
            line = w
        else:
            line = test
    lines.append(line)
    return lines


def caption_png(label, text, path):
    """Rótulo inferior: etiqueta en lima + frase en crema sobre una placa oscura."""
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # degradado inferior para legibilidad
    grad = Image.new('L', (1, 700))
    for y in range(700):
        grad.putpixel((0, y), int(200 * (y / 699) ** 1.6))
    img.paste(Image.new('RGBA', (W, 700), BG + (255,)), (0, H - 760), grad.resize((W, 700)))
    img.paste(Image.new('RGBA', (W, 60), BG + (200,)), (0, H - 60))
    fl, ft = font('Bold', 34), font('ExtraBold', 62)
    x = SAFE_LEFT + 10
    lines = wrap(d, text, ft, SAFE_RIGHT - x)
    y = SAFE_BOTTOM - 74 * len(lines)  # la última línea termina en el borde seguro
    lw = d.textlength(label, font=fl) + 48
    d.rounded_rectangle((x, y - 86, x + lw, y - 30), radius=28, fill=LIME)
    d.text((x + 24, y - 79), label, font=fl, fill=(11, 43, 32))
    for i, ln in enumerate(lines):
        d.text((x, y + i * 74), ln, font=ft, fill=CREAM)
    img.save(path)


def logo(h, text_key='text_light'):
    mark = Image.open(os.path.join(ASSETS, 'logo_mark.png')).convert('RGBA')
    text = Image.open(os.path.join(ASSETS, f'logo_{text_key}.png')).convert('RGBA')
    k = h / 283
    out = Image.new('RGBA', (int(613 * k), h), (0, 0, 0, 0))
    out.paste(mark.resize((int(207 * k), h), Image.LANCZOS), (0, 0))
    out.paste(text.resize((int(406 * k), h), Image.LANCZOS), (int(207 * k), 0))
    return out


def card_frames(kind, n, photo=None):
    """Genera los frames de las placas de apertura, foto grupal y cierre."""
    lg = logo(170)
    for f in range(n):
        p = f / max(1, n - 1)
        if kind == 'photo':
            ph = photo
            bg = ph.resize((int(ph.width * H / ph.height), H)).filter(ImageFilter.GaussianBlur(40))
            bg = bg.crop(((bg.width - W) // 2, 0, (bg.width - W) // 2 + W, H)).point(lambda v: int(v * 0.45))
            img = bg.convert('RGBA')
            # foto completa a lo ancho con un zoom lento (efecto Ken Burns)
            z = 1.0 + 0.10 * p
            box_h = int(ph.height * W / ph.width)
            fg = ph.resize((int(W * z), int(box_h * z)), Image.LANCZOS)
            fg = fg.crop(((fg.width - W) // 2, (fg.height - box_h) // 2, (fg.width - W) // 2 + W, (fg.height - box_h) // 2 + box_h))
            img.paste(fg, (0, 420))
            d = ImageDraw.Draw(img)
            ft = fit_font('hicieron posible esta jornada', 'ExtraBold', 64)
            for i, ln in enumerate(['Gracias a todos los que', 'hicieron posible esta jornada']):
                tw = d.textlength(ln, font=ft)
                d.text(((W - tw) / 2, 1285 + i * 80), ln, font=ft, fill=CREAM)
            small = lg.resize((lg.width * 2 // 3, lg.height * 2 // 3))
            img.alpha_composite(small, ((W - small.width) // 2, SAFE_TOP + 20))
        else:
            img = Image.new('RGBA', (W, H), BG + (255,))
            g = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            ImageDraw.Draw(g).ellipse((W / 2 - 520, 380, W / 2 + 520, 1420), fill=TEAL + (70,))
            img.alpha_composite(g.filter(ImageFilter.GaussianBlur(160)))
            d = ImageDraw.Draw(img)
            a = min(1.0, p * 3)
            big = lg.resize((int(lg.width * 1.25), int(lg.height * 1.25)), Image.LANCZOS)
            big.putalpha(big.getchannel('A').point(lambda v: int(v * a)))
            img.alpha_composite(big, ((W - big.width) // 2, 560 if kind == 'intro' else 520))
            col = tuple(int(BG[i] + (c - BG[i]) * min(1, max(0, p * 3 - 0.6))) for i, c in enumerate(CREAM))
            lim = tuple(int(BG[i] + (c - BG[i]) * min(1, max(0, p * 3 - 0.9))) for i, c in enumerate(LIME))
            if kind == 'intro':
                rows = [('Jornada en la playa', fit_font('Jornada en la playa', 'Black', 84), col),
                        ('Barranco · Perú', fit_font('Barranco · Perú', 'Bold', 52), lim)]
                y0 = 900
            else:
                big_f = fit_font('ELIMINAR EL PLÁSTICO', 'Black', 78)
                rows = [('ELIMINAR EL PLÁSTICO', big_f, col), ('DEL PLANETA', big_f, col),
                        ('creando soluciones', font('Bold', 50), lim), ('aplicables y comerciales', font('Bold', 50), lim)]
                y0 = 860
            y = y0
            for txt, fnt, c in rows:
                tw = d.textlength(txt, font=fnt)
                d.text(((W - tw) / 2, y), txt, font=fnt, fill=c)
                y += int(fnt.size * 1.25)
        yield img.convert('RGB')


def run(cmd):
    subprocess.run(cmd, check=True)


def encode_frames(frames, path):
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                          '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-shortest',
                          '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', path],
                         stdin=subprocess.PIPE)
    for fr in frames:
        p.stdin.write(fr.tobytes())
    p.stdin.close()
    p.wait()


def main():
    clips_dir, photo_path = sys.argv[1], sys.argv[2]
    out_dir = os.path.join(HERE, 'out')
    os.makedirs(out_dir, exist_ok=True)
    tmp = tempfile.mkdtemp()
    parts = []

    intro = os.path.join(tmp, '00_intro.mp4')
    encode_frames(card_frames('intro', int(2.6 * FPS)), intro)
    parts.append(intro)

    for k, (key, ss, dur, label, text) in enumerate(SHOTS):
        src = next(os.path.join(clips_dir, f) for f in os.listdir(clips_dir) if f.startswith(key))
        cap = os.path.join(tmp, f'cap_{k}.png')
        caption_png(label, text, cap)
        out = os.path.join(tmp, f'{k + 1:02d}_shot.mp4')
        fo = dur - 0.25
        vf = (f'[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},'
              f"scale=w='{W}*(1+0.06*t/{dur})':h=-2:eval=frame,crop={W}:{H},"
              f'eq=saturation=1.18:contrast=1.06,fps={FPS},setsar=1[v];'
              f'[1:v]format=rgba,fade=in:st=0.2:d=0.4:alpha=1[c];'
              f'[v][c]overlay=0:0,fade=in:st=0:d=0.25,fade=out:st={fo}:d=0.25,format=yuv420p[o]')
        run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(ss), '-t', str(dur), '-i', src,
             '-loop', '1', '-t', str(dur), '-i', cap,
             '-f', 'lavfi', '-t', str(dur), '-i', 'anullsrc=r=48000:cl=stereo',
             '-filter_complex', vf, '-map', '[o]', '-map', '2:a',
             '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', out])
        parts.append(out)

    photo = Image.open(photo_path).convert('RGB')
    ph = os.path.join(tmp, '90_photo.mp4')
    encode_frames(card_frames('photo', int(4.2 * FPS), photo), ph)
    parts.append(ph)
    close = os.path.join(tmp, '99_close.mp4')
    encode_frames(card_frames('close', int(3.8 * FPS)), close)
    parts.append(close)

    lst = os.path.join(tmp, 'list.txt')
    with open(lst, 'w') as fh:
        fh.writelines(f"file '{p}'\n" for p in parts)
    joined = os.path.join(tmp, 'joined.mp4')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst,
         '-c:v', 'libx264', '-crf', '19', '-preset', 'medium', '-pix_fmt', 'yuv420p',
         '-an', joined])
    # música original (compilado/music.py), ajustada a -14 LUFS para redes sociales
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', joined],
                               capture_output=True, text=True, check=True).stdout)
    wav = os.path.join(tmp, 'music.wav')
    run([sys.executable, '-I', os.path.join(HERE, 'music.py'), str(dur), wav])
    final = os.path.join(out_dir, 'desafio_jornada_barranco.mp4')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', joined, '-i', wav,
         '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=7',
         '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', final])
    print(final)


if __name__ == '__main__':
    main()
