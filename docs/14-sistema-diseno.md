# Sistema de diseño (G2): cómo montarlo

Muestra viva: `/sistema` (noindex). Código: `src/components/sistema/**`, `src/lib/diseno/tokens.ts` y el bloque `/* SISTEMA */` al principio de `src/app/globals.css`.

## 1. Tokens (ya globales, no hay que importar nada)

| Token | Uso |
|---|---|
| `--sombra-1` … `--sombra-5` | reposo · levantado (hover) · flotante (menús, popovers) · destacado (hoja, arrastre) · modal |
| `--sombra-papel` | tarjetas, sobres y cartulinas: filo claro arriba, contacto corto y difusa larga |
| `--sombra-lacre` | el sello de alianzas: volumen interior y sombra granate |
| `--sombra-dorada` | botones de oro |
| `--sombra-tinta` | `18 16 14` (#12100E) en canales: `rgb(var(--sombra-tinta) / .08)` para sombras propias |
| `--radio-s/m/l/capsula` | 6 / 12 / 20 / 999 px. Anidados: exterior = interior + relleno |
| `--foco` | anillo doble papel + acento: `:focus-visible { outline: none; box-shadow: var(--foco) }` o la clase `.foco-sistema` |
| `--ease-carta/velo/sello/suave` | las mismas curvas de `CURVAS` en `src/lib/movimiento.ts` |
| `--dur-instante/rapida/breve/media/larga/lenta` | 120 / 200 / 320 / 900 / 1400 / 2200 ms |
| `--capa-*` | base 0 · elevada 10 · pegajosa 100 · menu 200 · velo 300 · modal 400 · aviso 500 · apertura 600 · cursor 900. Nunca 9999 |

En Tailwind: `shadow-1` … `shadow-5`, `shadow-papel`, `shadow-lacre` y `shadow-dorada`.

Sobre fondo oscuro, añade `data-cursor-tema="oscuro"` o la clase `.superficie-oscura` al contenedor. La escala de sombras se vuelve más densa, con filo de luz, y `--foco` pasa a oro. El cursor también se pone claro.

En TS: `import { SOMBRAS, RADIOS, EASE, DURACION, CAPAS } from "@/lib/diseno/tokens"`.

## 2. Cursor

Se monta **una sola vez** por árbol, en un layout o una página y nunca dentro de un componente que se repita:

```tsx
import { CursorInvitoo } from "@/components/sistema";
// …
<CursorInvitoo />
```

- Solo se activa con `(pointer: fine) and (hover: hover)` y sin `prefers-reduced-motion`. En táctil no pinta nada ni oculta el cursor nativo. Siempre lleva `pointer-events: none` y z-index `--capa-cursor`.
- Funciona por delegación, sin listeners por elemento:
  - `a`, `button`, `label` y `summary` hacen crecer el aro y lo tiñen de granate.
  - `data-cursor="abrir" | "ver" | "arrastrar"` muestran un disco con rótulo.
  - `data-cursor="texto"` y el texto corrido muestran una barra fina, solo sobre las líneas de letra.
  - `data-cursor="nativo"`, `form`, `input`, `textarea`, `select`, `iframe` y `contenteditable` devuelven el cursor del sistema.
- Al hacer clic sale una onda. Con `data-cursor-petalos` en un ancestro, salen pétalos.
- El tema se deduce del fondo opaco más cercano. Para forzarlo, usa `data-cursor-tema="oscuro" | "claro"`.
- Peso: 1,6 KB gzip de JS y 1,2 KB gzip de CSS.

## 3. Botón y Magnético

```tsx
import { Boton, Magnetico } from "@/components/sistema";

<Boton href="/empezar" magnetico>Empezar</Boton>                 // Link
<Boton variante="oro" tamano={56} petalos type="submit" cargando={enviando}>Confirmar asistencia</Boton>
<Boton variante="contorno">Hablamos</Boton>
<Boton variante="fantasma">Saltar</Boton>
<Magnetico><MiPieza /></Magnetico>                                 // ≤ 6 px, solo puntero fino
```

- `variante` puede ser `primario` (granate o `--acento` de la plantilla), `oro` (brillo al pasar), `contorno` o `fantasma`.
- `tamano` es `48` (por defecto) o `56` (el CTA principal).
- `cargando` mantiene el ancho y añade `aria-busy`, deshabilita el botón y anuncia «Un momento…».
- `ancho` hace que ocupe todo el ancho, para móvil. `icono` pone un SVG de 18 px a la derecha.
- Dentro de la invitación, el botón hereda `--acento`, `--sobre-acento`, `--tinta`, `--papel` y `--boton-radio` de la plantilla.
- El magnetismo se reserva para uno o dos CTA por pantalla.

## 4. Quién monta qué

- **F1 · Invitación:** monta `<CursorInvitoo />` en el contenedor de la invitación, no en la vista previa del panel. Pon `data-cursor="abrir"` y `data-cursor-petalos` en el sobre o el sello, y `--sombra-lacre` en el sello. En el RSVP, usa `<Boton variante="primario|oro" tamano={56} petalos cargando>`. Los formularios ya muestran el cursor nativo.
- **F3 · Web:** monta `<CursorInvitoo />` en `src/app/(sitio)/layout.tsx`. El CTA del menú y el del hero van con `<Boton magnetico>`. Las tarjetas de plantillas llevan `data-cursor="ver"` y los carruseles `data-cursor="arrastrar"`. Las tarjetas usan `--sombra-papel` y su hover `--sombra-3`. Las secciones oscuras llevan `data-cursor-tema="oscuro"`.
- **F4 · Panel:** el cursor personalizado **no** va en el panel, porque es una herramienta de uso diario y debe ser rápida. Usa los tokens (`--sombra-1/2/3`, `--radio-*`, `--foco`, `--capa-*`) y `Boton` con las variantes `primario`, `contorno` y `fantasma`, sin magnetismo. Los diálogos llevan `--sombra-5` y `--capa-modal`, y los avisos `--capa-aviso`.
