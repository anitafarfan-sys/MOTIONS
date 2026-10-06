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
