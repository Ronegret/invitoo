# Brief: 16 estilos temáticos restantes (K2–K5)

Rodrigo ha aprobado las tres primeras (K1: `regencia`, `aire`, `cuento`) y ha dicho «sigamos». Ahora se hacen las 16 que faltan, con el mismo nivel y la misma arquitectura.

## Lee antes de empezar
- `app/AGENTS.md` (Next 16: consulta `app/node_modules/next/dist/docs/`).
- `docs/16-encargo-estilos-tematicos.txt` (el encargo original de Rodrigo): vídeo en el hero, cuenta atrás dinámica temática y scroll storytelling, nunca estático; mobile-first (el 95 % lo ve en el móvil).
- `docs/16a-...md` §0 y `docs/16b-...md` §0 (fundamentos comunes), y la sección de cada uno de tus estilos.
- `docs/11-brief-wow-y-panel.md`: lee las «Reglas innegociables» y los «Añadidos».
- `docs/14-sistema-diseno.md`, `docs/17-marca-invitoo.md`.
- **Código de referencia, el de K1:** `app/src/plantillas/tematicas/**`. Ahí tienes `HeroVideo`, `cuenta.tsx`, `escenas.tsx`, `catalogo.ts`, `demos.ts`, `index.ts`, `fuentes/*`, `tematicas.css` y las tres plantillas. Reutiliza `HeroVideo` y la base de la cuenta atrás; no los dupliques.

## Reparto
| Agente | Estilos (id) | Puerto | distDir |
|---|---|---|---|
| K2 | `blason`, `memorias`, `pasaporte`, `orilla` | 3511 | `.next-k2` |
| K3 | `pinar`, `orbita`, `brazada` | 3512 | `.next-k3` |
| K4 | `festival`, `vinilo`, `neon`, `fuego`, `bachata` | 3513 | `.next-k4` |
| K5 | `lupulo`, `estadio`, `meta`, `riviera` | 3514 | `.next-k5` |

## Reglas
1. **Tus archivos:** `app/src/plantillas/tematicas/<id>.tsx`, `<id>.css`, `fuentes/<id>.ts`, los componentes propios de tus estilos (prefíjalos con el nombre del estilo, por ejemplo `PasaporteSello.tsx`) y `app/public/tematicas/<id>/`.
2. **Archivos compartidos:** `catalogo.ts`, `demos.ts`, `index.ts`, `src/lib/tipos.ts` (`PlantillaId`), `src/data/plantillas.ts`, `src/plantillas/index.ts` y `src/data/demo.ts` si hace falta. Cuatro agentes los tocan a la vez:
   - Relee el archivo justo antes de cada Edit.
   - Haz un Edit mínimo que solo añada tus líneas.
   - Nunca reescribas el archivo entero.
   - Si un Edit falla, relee y repite.
3. **No toques** las tres de K1, `HeroVideo`, la cuenta atrás compartida ni los estilos de otro agente. Si necesitas un cambio en lo común, añade una prop opcional retrocompatible y anótalo en tu informe.
4. **Elegancia por encima del tema.** Es una invitación de boda: el tema se insinúa con detalles de calidad (papelería, texturas, un objeto firma) y nunca resulta un disfraz chillón. Incluso en Neón, Rock o Fútbol tiene que ser una boda preciosa.
   - Animaciones suaves: fundidos, desenfoques y trazos, con `--ease-*` de `docs/14`.
   - Un solo momento wow por estilo.
   - Respeta `prefers-reduced-motion`.
   - Todo el contenido se lee sin JS.
5. **Cada estilo lleva:**
   - Hero con vídeo: póster AVIF como LCP, el vídeo después de la apertura y un botón «Ver el vídeo» si falla el autoplay. Mientras no haya vídeo de los novios, usa el metraje de `public/aperturas` igual que K1, con fotogramas limpios **sin nombres de otras parejas rotulados**.
   - Cuenta atrás temática: `aria-live` que cambia cada minuto y nunca se queda en 00.
   - Guion de scroll con `animation-timeline: view()` y su reserva.
   - Los bloques de siempre: RSVP, cómo llegar, horario, dress code, regalos con «Ver datos», alojamiento, «cosas que conviene saber», fotos, deseos.
   - Tres variantes de color AA.
   - Una demo con una pareja ficticia en `demos.ts`, con slug propio.
6. **Mobile first.** Prueba a 360, 390 y 430 px:
   - Nada se solapa.
   - Sin scroll horizontal.
   - Dianas táctiles de 44 px o más.
   - Texto de 17 px o más.
   - El scroll se nota en el móvil.
7. **Peso.** JS propio por estilo menor de 5 KB gzip. Sin dependencias nuevas salvo que sean imprescindibles, con licencia MIT o Apache, y anotadas en el informe.
8. **Imágenes.** No uses fotos nuevas de stock. Escribe los encargos de imagen de tus estilos en `app/herramientas/imagenes/encargos-tematicas-<agente>.json`, con el formato de `encargos-flux.json`: `name`, `carpeta` = id del estilo, `prompt` en inglés, `width`, `height` y `seed`. Pon unos 6 por estilo: póster del hero, 3–4 de álbum con la pareja ficticia y 1–2 de detalle. En los prompts:
   - «fictional people, no text, no lettering, no logos»;
   - en los lacres, «plain smooth wax seal, no letters».
   Rodrigo las genera en local con FLUX.2 klein. Mientras tanto, usa provisionalmente las imágenes que ya hay en el repo y apunta en el informe dónde irá cada una.
9. **Validación.** `cd app && npx tsc --noEmit -p .`; `npx eslint <tus archivos>`; `node scripts/revisar.mjs --catalogo` (o donde esté; míralo en el informe de K1 dentro de `qa/v3/k1`). Para ver en el navegador: `NEXT_DIST_DIR=<tu distDir> npx next dev -p <tu puerto>`. Páralo al terminar y **no** añadas `.next-*` a `tsconfig`; si se añade solo, quítalo. No hagas commit.
10. **Capturas** en `qa/v3/<agente>/`: una hoja por estilo con fotogramas de arriba abajo a 390 px y una hoja de heroes a 360 y 430 px.
11. **Informe final:** ids, nombres y demos; decisiones de arte; archivos tocados; ediciones en archivos compartidos; problemas fuera de tu área.
