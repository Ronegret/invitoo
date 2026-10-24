# Brief — Amor y elegancia v2 (equipo de diseño)

Repo `/home/claude/web`, app en `app/` (Next 16: **lee `app/AGENTS.md`**). Último commit: «fase 2».
**Lee antes:** `docs/09-benchmark-ux-amor-y-elegancia.md` (la dirección creativa y el backlog: es tu biblia), `docs/04-diseno.md` y `docs/08-brief-equipo-fase2.md` (reglas de trabajo).

## La referencia de la casa: Nico & Gaby
Es la invitación más elegante que ha hecho Invitoo y está publicada: `https://nico-y-gaby.invitoo.es/`. Puedes descargar su HTML y CSS con curl para estudiar su lenguaje. Las capturas en móvil están en `qa/publicado/ng2-*.png` (hoja de contactos: `qa/publicado/ng2-hoja.png`; sobre cerrado: `qa/publicado/nicogaby-movil.png`).
- **Lo que la hace elegante:**
  - el sobre crema con un lacre dorado que se toca para abrir;
  - la cursiva de Cormorant Garamond en los nombres, con la «&» en un tono de oro o cobre;
  - el interletrado muy abierto en las fechas (29 · AGOSTO · 2026);
  - la paleta crema, oro y verde bosque;
  - los botones con degradado dorado;
  - los filetes finos y los ornamentos mínimos;
  - las fotos reales, una sección oscura de contraste, los capítulos de su historia («El Muelle de los Enamorados»), la cuenta atrás sobre verde y el dress code en negativo.
- **Lo que falla y no se copia:**
  - el texto, a ~11 px, es ilegible para mayores (el mínimo es 17);
  - hay pasos de más («Con música / Sin música»);
  - la cuenta atrás se queda en 00 cuando la boda ya ha pasado.
- **Lo publicado en WordPress (`invitoo.es/amoryelegancia/`) es el antiejemplo:** banner morado en USD, script genérico y «ustedes».

## Reglas
- Tres agentes a la vez: toca **solo tus archivos**.
- Valida con `cd app && npx tsc --noEmit -p . && npx eslint <tus archivos>`.
- Para ver tu trabajo, **cada agente usa su propio puerto y su propio distDir**:
  - lanza `NEXT_DIST_DIR=.next-<agente> INVITOO_MEMORIA=1 npx next dev -p <puerto>` solo si `next.config.ts` lee `process.env.NEXT_DIST_DIR`;
  - el coordinador ya lo ha añadido; compruébalo;
  - puertos: E1 = 3401, E2 = 3402, E3 = 3403.
- Haz capturas con Playwright (Chromium en `/opt/pw-browsers`; nunca ejecutes `playwright install`) en `qa/v2/<agente>/`. **Míralas con Read y repite hasta que te parezca digno de un estudio de lujo.**
- Mata tu servidor al terminar. Sin commit.
- Accesibilidad sigue siendo obligatoria:
  - cuerpo ≥ 17 px en la invitación;
  - contraste AA;
  - `prefers-reduced-motion`;
  - contenido legible sin JS.
- Motion: solo opacity, transform, filter, clip-path y stroke-dashoffset. Usa los tokens de `src/lib/movimiento.ts`; si añades las curvas `--ease-carta`, `--ease-velo` o `--ease-sello`, hazlo ahí.
- Marca intacta: logo, sello de alianzas y granate.
- Nada de fotos de stock nuevas. Si hace falta imagen, usa la invitación real en vivo, bodegones generados en CSS o SVG (papel, lacre, lino) o las fotos de `public/fotos/bodas/` con moderación.

## Propiedad de archivos
| Agente | Área | Archivos |
|---|---|---|
| **E1 · La carta** | apertura Sobre de verdad y los 5 momentos firma | `src/components/aperturas/**`, `src/plantillas/aperturas/**`, `src/components/bloques/Rsvp.tsx` (solo el estado de éxito y la celebración), `src/components/bloques/CuentaAtras.tsx`, `src/components/SelloAlianzas.tsx`, `src/lib/movimiento.ts` (solo añadir tokens), nuevo `src/components/sobre/**` (forro, lacre, matasellos, `AjustesSobre`), `src/app/panel/[slug]/(secciones)/diseno/**` (solo para montar `AjustesSobre`) y `Tema.sobre` en `lib/tipos.ts` |
| **E2 · La web** | web comercial v2 | `src/app/(sitio)/**`, `src/components/sitio/**`, `src/data/sitio.ts`, `src/app/layout.tsx` (metadata) |
| **E3 · La insignia** | nueva plantilla «Carta», ritmo interior y panel sin sombras | `src/plantillas/**` (salvo `aperturas/`), `src/data/plantillas.ts`, `src/data/demo.ts`, `src/components/bloques/**` (salvo `Rsvp.tsx` y `CuentaAtras.tsx`), `src/components/panel/**` (solo estilos), el bloque de invitación de `globals.css` |

E1 y E3 comparten la invitación: E1 la apertura y los momentos, E3 el cuerpo. Si E1 necesita un gancho en una plantilla (por ejemplo, la firma manuscrita del pie), lo pide a E3 vía SendMessage o lo deja en su informe.
