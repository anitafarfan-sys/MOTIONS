# Motion · El corazón de Desafío Ambiente

El video completo abre con el propósito con el que nació Desafío Ambiente: **ELIMINAR EL PLÁSTICO DEL PLANETA creando soluciones aplicables y comerciales** (un planeta rodeado de plásticos que se eliminan y se convierten en pellets). Luego presenta qué es Desafío: **un holding que crea unidades de negocio que protegen el medio ambiente y promueven la sostenibilidad en las empresas, con diferentes modelos de negocio** (Aislapet, Everwood y nuevas unidades). Sigue la **línea de tiempo 2015 – 2026** del Holding Desafío Ambiente: 11 años incorporando nuevas problemáticas para atender al mercado (Reciclaje → Valorización → Valor compartido → Ecosistema circular). Luego pasa al corazón de Desafío:

El plástico problemático entra **una sola vez** a la caja **Desafío** (con el logo de Desafío Ambiente) y se procesa (Recolectar → Clasificar → Reconvertir). Después se escanean los problemas uno tras otro y cada uno sale como una de las 4 soluciones:

1. Construcción (madera plástica: lotes de tablas 1×4 de 2,8 m, vigas y postes)
2. Equipamiento urbano
3. Proyecto I+D
4. Solución digital (problema normativo y sostenible, p. ej. Ley REP)

## Videos (1920×1080, 30 fps)

- `motion/out/desafio_corazon_4_soluciones.mp4`: video completo: línea de tiempo + una sola entrada de envases + los 4 problemas escaneados seguidos (70 s); cierra con el logo y el propósito
- `motion/out/desafio_holding_resumen.mp4`: **mini video resumen del holding** (41 s): propósito → las 5 unidades de negocio y su modelo (Desafío Ambiente, Everwood, La Tienda Sustentable, Desafío Lab, Link Circular) → foco como empresaria → cierre
- `motion/out/desafio_intro.mp4`: solo la intro: propósito, holding y línea de tiempo (28 s)
- `motion/out/desafio_corazon_solucion_1.mp4` a `_4.mp4`: una versión por solución (18,6 s)

## Editar y volver a renderizar

- Vista previa: abrir `motion/index.html?s=0` (video completo), `?s=5` (solo la intro), `?s=6` (mini resumen del holding) o `?s=1` a `?s=4` en el navegador.
- Las unidades de negocio del mini resumen están en `BUSINESS` dentro de `motion/motion.js`.
- Los hitos de la línea de tiempo están en `MILESTONES` y `PHASES` dentro de `motion/motion.js`.
- Los textos y colores están al inicio de `motion/motion.js` (`SOLUTIONS` y `C`).
- El logo está en `motion/assets/` (PNG transparentes) y embebido en `motion/assets/logos.js`.
- Para renderizar se necesitan Node, Playwright y ffmpeg: `node motion/render.js 0 1 2 3 4 5` (0 = video completo, 5 = solo la intro, 6 = mini resumen)

## Compilado · Jornada en la playa de Barranco

- `compilado/out/desafio_jornada_barranco.mp4`: video vertical 1080×1920 (Reels / TikTok / Stories), 41 s, con las mejores tomas de la jornada, rótulos con la marca, la foto grupal y cierre con el logo y el propósito. Incluye una música original (generada por `compilado/music.py`, sin derechos de terceros).
- Para regenerarlo: `python3 -I compilado/build.py <carpeta_con_los_clips> <foto_grupal.jpg>`. Los tramos elegidos y los textos están en `SHOTS` dentro de `compilado/build.py`.

## Testimonios · Jornada en la playa de Barranco

- `compilado/out/desafio_testimonios_barranco.mp4`: video vertical 1080×1920, 2 min 14 s, con los 5 testimonios completos y su **audio real** (Desafío Ambiente, voces de la jornada, Magnesol, reciclador autorizado y Desafío Ambiente en la pasarela). Cada tramo se corta en una pausa natural, con limpieza suave del ruido de playa y volumen parejo (-16 LUFS). Apertura y cierre con el logo y la música original.
- Para regenerarlo: `python3 -I compilado/testimonios.py <carpeta_con_los_clips>`. Los tramos y rótulos están en `TESTIMONIOS` dentro de `compilado/testimonios.py`.

## Short cinematográfico · Barranco

- `compilado/out/desafio_short_barranco.mp4`: short vertical de 23 s con cortes al ritmo de una pista original de 120 BPM (gancho de 4 s con texto grande, drop con tomas de 0,5 a 1,5 s, cierre con logo y propósito). Zoom de impacto en cada corte, paneo sobre las fotos, destellos, gradación turquesa/naranja, viñeta y grano.
- Para regenerarlo: `python3 -I compilado/short.py <carpeta_con_clips_y_fotos>`. El guion de tomas está en `HOOK` y `DROP` dentro de `compilado/short.py`.

## Short 15 s · "Antes era un residuo, hoy es una pasarela"

- `compilado/out/desafio_short15_pasarela.mp4`: 15 s verticales. 0–2 s en blanco y negro ("ANTES ERA / UN RESIDUO"), destello y color en el drop ("HOY ES / UNA PASARELA"), testimonio con audio real del señor de blanco sentado en la pasarela (4–11,5 s, música baja) con stickers que saltan (PASARELA INCLUSIVA · LIMA · PERÚ), cierre rápido y logo.
- Para regenerarlo: `python3 -I compilado/short15.py <carpeta_con_clips_y_fotos>`. Las tomas están en `SHOTS` dentro de `compilado/short15.py`.

## Zona segura Instagram (Reels + Historias)

Los 4 videos verticales de `compilado/` respetan una zona segura común a Reels e Historias (1080×1920), definida en `compilado/build.py`:

- arriba 250 px libres (nombre de la cuenta y barra de progreso de las historias),
- abajo 440 px libres (descripción, caja de respuesta, música): el contenido termina en y = 1480,
- derecha 140 px libres (botones de me gusta, comentar y compartir) e izquierda 70 px,
- todo texto centrado se achica solo para no pasar de 780 px de ancho.

## MOBILIARIO CIRCULAR · borde costero de Lima

- `compilado/out/desafio_mobiliario_circular_lima.mp4`: 44 s verticales con productos reales. Head "MOBILIARIO CIRCULAR · Lima, Perú"; cada tipo de producto (sillas Adirondack, mesas de picnic, bancas, sets lounge, mesas altas y pisos) aparece a pantalla completa y luego cae como tarjeta sobre una playa o malecón de Lima; jardineras y reposeras a medida (ilustradas); colores a elección; proyecto real de Barranco; propiedades (no se pudre, no se astilla, no requiere mantención, reciclable, resistente al sol); catálogo "Implementamos en toda la costa" y cierre "Conversemos, cotiza con nosotros tu mobiliario CIRCULAR".
- Para regenerarlo: `python3 -I compilado/mobiliario_lima.py <carpeta_con_clips_y_videos_de_producto>` (videos de producto Adirondack, Mesas de Picnic y All-Product Showcase, no incluidos en el repo por tamaño).
- Primera versión con muebles ilustrados: `compilado/mobiliario.py` → `desafio_mobiliario_circular_lima_v1.mp4` (no versionado).
- Fotos de la costa: Wikimedia Commons, licencias CC BY / CC BY-SA / dominio público. Créditos en `compilado/fotos_lima/CREDITOS.md` (incluirlos en la descripción al publicar).
