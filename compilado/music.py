"""Música original para el compilado (sin derechos de terceros).

Tema alegre en Re mayor a 104 BPM, progresión I–V–vi–IV (Re–La–Sim–Sol):
colchón de acordes, arpegio tipo pluck, bajo y batería suave. Entra de a poco,
tiene el ritmo completo en el centro y termina tranquilo sobre el cierre.

Uso: python3 -I compilado/music.py <duración_en_segundos> <salida.wav>
"""
import sys
import wave

import numpy as np

SR = 44100
BPM = 104
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)

# acordes (MIDI) con voces cercanas y su bajo
CHORDS = [
    ([62, 66, 69], 38),  # Re
    ([61, 64, 69], 45),  # La / Do#
    ([62, 66, 71], 47),  # Si menor
    ([62, 67, 71], 43),  # Sol
]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tvec(d):
    return np.arange(int(d * SR)) / SR


def lowpass(x, cutoff):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / np.sqrt(1 + (f / hi) ** 4)) * (1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4))
    return np.fft.irfft(X, len(x))


def add(buf, start, sig, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= buf.shape[1]:
        return
    n = min(len(sig), buf.shape[1] - i)
    buf[0, i:i + n] += sig[:n] * gain * np.sqrt((1 - pan) / 2)
    buf[1, i:i + n] += sig[:n] * gain * np.sqrt((1 + pan) / 2)


def pluck(f, d=0.9):
    t = tvec(d)
    s = sum((1 / h ** 1.4) * np.sin(2 * np.pi * f * h * t) * np.exp(-t * (2.5 + 2.2 * h)) for h in range(1, 6))
    return s * np.minimum(1, t / 0.004)


def pad(freqs, d):
    t = tvec(d)
    s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.0018, 0.0018):
            s += sum((1 / h) * np.sin(2 * np.pi * f * (1 + det) * h * t + h) for h in range(1, 7))
    env = np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.35)
    return s * env / len(freqs)


def bass(f, d=BEAT * 1.8):
    t = tvec(d)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return s * np.exp(-t * 2.2) * np.minimum(1, t / 0.006)


def kick():
    t = tvec(0.35)
    f = 45 + 85 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)


def clap():
    t = tvec(0.25)
    return bandpass(rng.standard_normal(len(t)), 900, 4500) * np.exp(-t * 22)


def hat():
    t = tvec(0.06)
    return bandpass(rng.standard_normal(len(t)), 7000, 14000) * np.exp(-t * 70)


def reverb(x, wet=0.2, length=1.6):
    t = tvec(length)
    ir = rng.standard_normal(len(t)) * np.exp(-t * 3.2)
    ir = lowpass(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[:len(x)]
    return (1 - wet) * x + wet * y


def render(total):
    n = int(total * SR)
    music = np.zeros((2, n))  # pad + arpegio (van al reverb)
    rhythm = np.zeros((2, n))  # bajo + batería
    bars = int(np.ceil(total / BAR))
    for b in range(bars):
        t0 = b * BAR
        notes, root = CHORDS[b % 4]
        last = b >= bars - 2
        add(music, t0, lowpass(pad([hz(m) for m in notes], BAR + 0.3), 2200), 0.16)
        arp = [notes[0], notes[1], notes[2], notes[0] + 12, notes[2], notes[1], notes[0] + 12, notes[1]]
        for k, m in enumerate(arp):
            if last and k >= 4 and b == bars - 1:
                break
            add(music, t0 + k * BEAT / 2, pluck(hz(m + 12)), 0.22 if b >= 2 else 0.17, pan=-0.35 if k % 2 else 0.35)
        if b >= 2 and not last:
            for k in (0, 2):
                add(rhythm, t0 + k * BEAT, bass(hz(root)), 0.30)
            add(rhythm, t0 + 3.5 * BEAT, bass(hz(root + 12), BEAT * 0.5), 0.16)
            for k in (0, 2):
                add(rhythm, t0 + k * BEAT, kick(), 0.55)
        if 4 <= b < bars - 2:
            for k in (1, 3):
                add(rhythm, t0 + k * BEAT, clap(), 0.22)
            for k in range(8):
                add(rhythm, t0 + k * BEAT / 2, hat(), 0.10 if k % 2 else 0.06, pan=0.25)
    # acorde final sostenido sobre el cierre
    notes, root = CHORDS[0]
    end_t = (bars - 1) * BAR + 2 * BEAT
    add(music, end_t, lowpass(pad([hz(m) for m in notes + [notes[0] + 12]], max(0.5, total - end_t)), 1800), 0.14)
    music = np.stack([reverb(music[0], 0.28), reverb(music[1], 0.28)])
    mix = music + rhythm
    # fundido de entrada y salida
    t = np.arange(n) / SR
    mix *= np.minimum(1, t / 0.8) * np.minimum(1, (total - t) / 2.5)
    mix = np.tanh(mix * 1.4) / np.tanh(1.4)
    mix *= 0.89 / np.max(np.abs(mix))
    return mix


def main():
    total, out = float(sys.argv[1]), sys.argv[2]
    mix = render(total)
    data = (mix.T * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(out)


if __name__ == '__main__':
    main()
