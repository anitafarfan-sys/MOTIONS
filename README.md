# Motion · El corazón de Desafío Ambiente

El plástico problemático entra **una sola vez** a la caja **Desafío** (con el logo de Desafío Ambiente) y se procesa (Recolectar → Clasificar → Reconvertir). Después se escanean los problemas uno tras otro y cada uno sale como una de las 4 soluciones:

1. Construcción (madera plástica: lotes de tablas 1×4 de 2,8 m, vigas y postes)
2. Equipamiento urbano
3. Proyecto I+D
4. Solución digital (problema normativo y sostenible, p. ej. Ley REP)

## Videos (1920×1080, 30 fps)

- `motion/out/desafio_corazon_4_soluciones.mp4`: una sola entrada de envases y luego los 4 problemas escaneados seguidos (42 s)
- `motion/out/desafio_corazon_solucion_1.mp4` a `_4.mp4`: una versión por solución (18,6 s)

## Editar y volver a renderizar

- Vista previa: abrir `motion/index.html?s=0` (las 4 seguidas) o `?s=1` a `?s=4` en el navegador.
- Los textos y colores están al inicio de `motion/motion.js` (`SOLUTIONS` y `C`).
- El logo está en `motion/assets/` (PNG transparentes) y embebido en `motion/assets/logos.js`.
- Para renderizar se necesitan Node, Playwright y ffmpeg: `node motion/render.js 0 1 2 3 4` (0 = las 4 seguidas)

---

# Motion · Los desafíos de DA hoy

Video explicativo que va desde la raíz del negocio hasta los problemas de cada línea:

1. **La raíz**: la tracción de residuo depende de la demanda. Con poca demanda el plástico termina en relleno; más demanda en LATAM = más plástico absorbido (medidor de absorción 30 % → 86 %, ilustrativo).
2. **4 líneas de negocio** (árbol que nace de *Transformo: shit in → gold out!*).
3. Cada línea con lo que aporta, sus ventajas y su falencia: **Everwood**, **La Tienda Sustentable**, **Desafío Lab**, **Inteligencia de datos**.
4. **Los 6 desafíos**: runway de 6 meses, recurrencia, absorción de plástico, pilar Transformo, reorganizar y crecer en LATAM, socios con impacto real.
5. Cierre: buscamos socios inversionistas con visión de impacto real.

## Video (1920×1080, 30 fps, 109,5 s)

- `desafios/out/desafios_da_hoy.mp4`

## Editar y volver a renderizar

- Vista previa: abrir `desafios/index.html` en el navegador (botones para saltar a cada capítulo).
- Textos, colores y duración de cada capítulo al inicio de `desafios/desafios.js` (`BUSINESSES`, `CHALLENGES`, `SCENES`, `C`).
- Renderizar: `node desafios/render.js` (o `--frames 10,40` para fotogramas sueltos).
