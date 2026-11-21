"""Secuencia vertical (1080x1920) de testimonios de la jornada en Barranco.

Usa solo los videos donde las personas hablan a cámara, con su audio real.
Cada tramo se corta en una pausa natural (detectada en el audio), se limpia
un poco el ruido de playa y se iguala el volumen entre personas.

Uso: python3 -I compilado/testimonios.py <carpeta_con_clips>
Salida: compilado/out/desafio_testimonios_barranco.mp4
"""
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import (BG, CREAM, FPS, H, HERE, LIME, TEAL, W, font, logo, run,  # noqa: E402
                   wrap)
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402

# (archivo, inicio, fin, etiqueta, rótulo) — inicio/fin caen en pausas del audio
TESTIMONIOS = [
    ('69dccef2', 0.0, 15.55, 'DESAFÍO AMBIENTE', 'Transformamos plástico en madera plástica'),
    ('04b2509d', 0.55, 40.1, 'VOCES DE LA JORNADA', 'La comunidad en la playa de Barranco'),
    ('5f675039', 0.0, 38.75, 'MAGNESOL', 'Marcas aliadas en la jornada'),
    ('d7fe122c', 0.0, 12.9, 'RECICLADOR AUTORIZADO', 'Municipalidad de Barranco'),
    ('91f39a67', 0.0, 19.8, 'DESAFÍO AMBIENTE', 'Una pasarela hecha de plástico reciclado'),
]


def lower_third(label, text, path):
    """Rótulo inferior compacto (no tapa la cara) + logo pequeño arriba."""
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    grad = Image.new('L', (1, 520))
    for y in range(520):
        grad.putpixel((0, y), int(185 * (y / 519) ** 1.7))
    img.paste(Image.new('RGBA', (W, 520), BG + (255,)), (0, H - 520), grad.resize((W, 520)))
    d = ImageDraw.Draw(img)
    fl, ft = font('Bold', 32), font('ExtraBold', 54)
    lines = wrap(d, text, ft, W - 160)
    y = H - 190 - (len(lines) - 1) * 64
    lw = d.textlength(label, font=fl) + 44
    d.rounded_rectangle((80, y - 80, 80 + lw, y - 28), radius=26, fill=LIME)
    d.text((102, y - 74), label, font=fl, fill=(11, 43, 32))
    for i, ln in enumerate(lines):
        d.text((80, y + i * 64), ln, font=ft, fill=CREAM)
    img.save(path)


def watermark(path):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    lg = logo(64)
    sh = Image.new('RGBA', (lg.width + 40, lg.height + 30), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((0, 0, sh.width - 1, sh.height - 1), radius=22, fill=(7, 26, 21, 150))
    img.alpha_composite(sh, (52, 70))
    img.alpha_composite(lg, (72, 85))
    img.save(path)


def card(kind, n):
    lg = logo(170)
    for f in range(n):
        p = f / max(1, n - 1)
        img = Image.new('RGBA', (W, H), BG + (255,))
        g = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(g).ellipse((W / 2 - 520, 380, W / 2 + 520, 1420), fill=TEAL + (70,))
        img.alpha_composite(g.filter(ImageFilter.GaussianBlur(160)))
        d = ImageDraw.Draw(img)
        a = min(1.0, p * 3)
        big = lg.resize((int(lg.width * 1.25), int(lg.height * 1.25)), Image.LANCZOS)
        big.putalpha(big.getchannel('A').point(lambda v: int(v * a)))
        img.alpha_composite(big, ((W - big.width) // 2, 560))

        def mix(c, delay):
            k = min(1, max(0, p * 3 - delay))
            return tuple(int(BG[i] + (v - BG[i]) * k) for i, v in enumerate(c))
        if kind == 'intro':
            rows = [('Testimonios', font('Black', 96), mix(CREAM, 0.6)),
                    ('Jornada en la playa · Barranco, Perú', font('Bold', 44), mix(LIME, 0.9))]
        else:
            rows = [('ELIMINAR EL PLÁSTICO', font('Black', 78), mix(CREAM, 0.6)),
                    ('DEL PLANETA', font('Black', 78), mix(CREAM, 0.6)),
                    ('creando soluciones', font('Bold', 50), mix(LIME, 0.9)),
                    ('aplicables y comerciales', font('Bold', 50), mix(LIME, 0.9))]
        y = 900
        for txt, fnt, c in rows:
            tw = d.textlength(txt, font=fnt)
            d.text(((W - tw) / 2, y), txt, font=fnt, fill=c)
            y += int(fnt.size * 1.25)
        yield img.convert('RGB')


def encode_card(kind, dur, music_wav, music_offset, path):
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                          '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-ss', str(music_offset), '-t', str(dur), '-i', music_wav,
                          '-filter_complex', f'[1:a]volume=0.55,afade=in:st=0:d=0.4,afade=out:st={dur - 0.8}:d=0.8,'
                          'aresample=48000,aformat=channel_layouts=stereo[a]',
                          '-map', '0:v', '-map', '[a]', '-shortest',
                          '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', path],
                         stdin=subprocess.PIPE)
    for fr in card(kind, int(dur * FPS)):
        p.stdin.write(fr.tobytes())
    p.stdin.close()
    p.wait()


def main():
    clips_dir = sys.argv[1]
    out_dir = os.path.join(HERE, 'out')
    os.makedirs(out_dir, exist_ok=True)
    tmp = tempfile.mkdtemp()
    wav = os.path.join(tmp, 'music.wav')
    run([sys.executable, '-I', os.path.join(HERE, 'music.py'), '12', wav])
    wm = os.path.join(tmp, 'wm.png')
    watermark(wm)
    parts = []

    intro = os.path.join(tmp, '00_intro.mp4')
    encode_card('intro', 3.0, wav, 0.0, intro)
    parts.append(intro)

    for k, (key, ss, to, label, text) in enumerate(TESTIMONIOS):
        src = next(os.path.join(clips_dir, f) for f in os.listdir(clips_dir) if f.startswith(key))
        dur = to - ss
        lt = os.path.join(tmp, f'lt_{k}.png')
        lower_third(label, text, lt)
        out = os.path.join(tmp, f'{k + 1:02d}.mp4')
        fc = (f'[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},'
              f'eq=saturation=1.12:contrast=1.05,fps={FPS},setsar=1[v];'
              f"[1:v]format=rgba,fade=in:st=0.3:d=0.4:alpha=1,fade=out:st=5.0:d=0.6:alpha=1[l];"
              f'[2:v]format=rgba[w];'
              f'[v][l]overlay=0:0[v1];[v1][w]overlay=0:0,'
              f'fade=in:st=0:d=0.2,fade=out:st={dur - 0.2:.2f}:d=0.2,format=yuv420p[o];'
              # audio real: menos ruido de playa y volumen parejo entre personas
              f'[0:a]highpass=f=90,afftdn=nf=-28,loudnorm=I=-16:TP=-1.5:LRA=11,'
              f'afade=in:st=0:d=0.12,afade=out:st={dur - 0.15:.2f}:d=0.15,'
              f'aresample=48000,aformat=channel_layouts=stereo[a]')
        run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(ss), '-t', f'{dur:.2f}', '-i', src,
             '-loop', '1', '-t', f'{dur:.2f}', '-i', lt, '-loop', '1', '-t', f'{dur:.2f}', '-i', wm,
             '-filter_complex', fc, '-map', '[o]', '-map', '[a]',
             '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', out])
        parts.append(out)

    close = os.path.join(tmp, '99_close.mp4')
    encode_card('close', 4.0, wav, 7.0, close)
    parts.append(close)

    lst = os.path.join(tmp, 'list.txt')
    with open(lst, 'w') as fh:
        fh.writelines(f"file '{p}'\n" for p in parts)
    final = os.path.join(out_dir, 'desafio_testimonios_barranco.mp4')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst,
         '-c:v', 'libx264', '-crf', '21', '-maxrate', '4M', '-bufsize', '8M', '-preset', 'medium', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final])
    print(final)


if __name__ == '__main__':
    main()
