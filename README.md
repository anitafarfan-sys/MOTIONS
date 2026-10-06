# Motion · El corazón de Desafío Ambiente

El video completo abre con el propósito con el que nació Desafío Ambiente: **ELIMINAR EL PLÁSTICO DEL PLANETA creando soluciones aplicables y comerciales** (un planeta rodeado de plásticos que se eliminan y se convierten en pellets). Sigue la **línea de tiempo 2015 – 2026** del Holding Desafío Ambiente: 11 años incorporando nuevas problemáticas para atender al mercado (Reciclaje → Valorización → Valor compartido → Ecosistema circular). Luego pasa al corazón de Desafío:

El plástico problemático entra **una sola vez** a la caja **Desafío** (con el logo de Desafío Ambiente) y se procesa (Recolectar → Clasificar → Reconvertir). Después se escanean los problemas uno tras otro y cada uno sale como una de las 4 soluciones:

1. Construcción (madera plástica: lotes de tablas 1×4 de 2,8 m, vigas y postes)
2. Equipamiento urbano
3. Proyecto I+D
4. Solución digital (problema normativo y sostenible, p. ej. Ley REP)

## Videos (1920×1080, 30 fps)

- `motion/out/desafio_corazon_4_soluciones.mp4`: video completo: línea de tiempo + una sola entrada de envases + los 4 problemas escaneados seguidos (63 s); cierra con el logo y el propósito
- `motion/out/desafio_proposito_y_linea_de_tiempo.mp4`: solo propósito + línea de tiempo (21 s)
- `motion/out/desafio_corazon_solucion_1.mp4` a `_4.mp4`: una versión por solución (18,6 s)

## Editar y volver a renderizar

- Vista previa: abrir `motion/index.html?s=0` (video completo), `?s=5` (solo propósito + línea de tiempo) o `?s=1` a `?s=4` en el navegador.
- Los hitos de la línea de tiempo están en `MILESTONES` y `PHASES` dentro de `motion/motion.js`.
- Los textos y colores están al inicio de `motion/motion.js` (`SOLUTIONS` y `C`).
- El logo está en `motion/assets/` (PNG transparentes) y embebido en `motion/assets/logos.js`.
- Para renderizar se necesitan Node, Playwright y ffmpeg: `node motion/render.js 0 1 2 3 4 5` (0 = video completo, 5 = solo propósito + línea de tiempo)
