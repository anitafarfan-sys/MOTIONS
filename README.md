# Motion · El corazón de Desafío Ambiente

Un problema (un desafío más el plástico problemático) entra a la caja **Desafío**, se procesa (Recolectar → Clasificar → Reconvertir) y sale como una de 4 soluciones:

1. Construcción
2. Equipamiento urbano
3. Proyecto I+D
4. Solución digital (problema normativo y sostenible, p. ej. Ley REP)

## Videos (1920×1080, 30 fps, 16,5 s)

- `motion/out/desafio_corazon_solucion_1.mp4` a `_4.mp4`: una versión por solución
- `motion/out/desafio_corazon_4_soluciones.mp4`: las 4 versiones seguidas (66 s)

## Editar y volver a renderizar

- Vista previa: abrir `motion/index.html?s=1` (de 1 a 4) en el navegador.
- Los textos y colores están al inicio de `motion/motion.js` (`SOLUTIONS` y `C`).
- Para renderizar se necesitan Node, Playwright y ffmpeg: `node motion/render.js 1 2 3 4`
