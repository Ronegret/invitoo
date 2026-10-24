# Color en vivo (G3): guía de uso

El probador de paletas permite a la pareja (o a quien visita la web) cambiar los colores de una invitación y verlos aplicados al momento, con un fundido de 600 ms. Todo lo que se ve o se guarda cumple AA, y la corrección no cambia el tono.

- Banco de pruebas: `/sistema/color?p=<plantilla>` (escritorio) y `/sistema/color?p=<plantilla>&movil=1` (la invitación a pantalla completa con la hoja inferior). La página es `noindex`.
- Pruebas: `node qa/v3/g3/probar-aa.mjs` comprueba 2.603 paletas: las curadas, 30 semillas por 5 armonías y por 9 plantillas, tríos al azar, «aleatorio» y los tonos del deslizador. Ninguna falla.
- Grabación: `node qa/v3/g3/grabar.mjs http://localhost:3506 [escritorio|movil]`. Los fotogramas quedan en `qa/v3/g3/`.

## Archivos

| Archivo | Qué hace |
|---|---|
| `src/lib/color/oklch.ts` | Conversión hex ↔ OKLCH. Si un color no cabe en sRGB, recorta solo el croma. |
| `src/lib/color/paleta.ts` | `resolverPaleta` (la única puerta: aplica AA), `generarPaleta(semilla, plantilla, armonía)`, `aleatorioArmonico`, los `PERFILES` por plantilla (modo claro u oscuro) y `muestrasDe`. |
| `src/lib/color/paletas.ts` | De 7 a 8 paletas curadas por plantilla, con nombres de boda. Las primeras son sus variantes de catálogo y comparten id con `?c=`. |
| `src/lib/color/aplicar.ts` | Contrato de variables, `MensajeColor`, fundido con `@property` y `?pal=`. |
| `src/lib/color/acciones.ts` | Server action `guardarPaleta(slug, colores)`. |
| `src/components/color/ProbadorColor.tsx` | El probador, en modo `completo` o `compacto`. |
| `src/components/color/EscuchaColor.tsx` | El oyente, en el lado de la invitación. |

## Garantías AA

| Par | Mínimo |
|---|---|
| `tinta` sobre `papel` | 7:1 |
| `acentoTexto` sobre `papel` | 4,5:1 |
| `sobreAcento` sobre `acento` | 4,5:1 |
| Tonos derivados (`--hondo-texto`, `--velo-acento` y `--hondo-acento`) | ≥ 4,5:1 |

Para corregir, solo se mueve la L de OKLCH. En las pruebas, el tono se desvía como mucho 1,9°.

El modo lo fija la plantilla: Constelación es oscura y las demás, claras. Un papel fuera de modo se lleva a su modo conservando el tono.

## Contrato de variables (F2: el lienzo tiene que leerlas, sin hex fijos)

El probador escribe estas variables como estilo en línea en `.lienzo`, en `main[data-modo]` y en `[data-color-vivo]`:

- `--papel`
- `--tinta`
- `--acento`
- `--acento-texto`
- `--sobre-acento`
- `--papel-base`
- `--velo`
- `--velo-acento`
- `--hondo`
- `--hondo-texto`
- `--hondo-acento`

Las derivadas se calculan con `tonosDerivados` de `plantillas/tokens.ts`. Cualquier color de la invitación que no salga de estas variables no cambiará en vivo.

## API

```tsx
import { ProbadorColor } from "@/components/color";
import { guardarPaleta } from "@/lib/color/acciones";

<ProbadorColor
  slug="ines-y-gonzalo"        // la boda (o la demo de la plantilla)
  plantilla="carta"            // id de plantilla (vale uno antiguo)
  tema={inv.tema}              // opcional: de aquí sale «Volver al original»
  modo="completo"              // "completo" | "compacto"
  onCambio={(p, { id, nombre }) => {}}  // opcional: cada cambio, ya con AA
  guardar={guardarPaleta}      // opcional: sin esto no aparece «Guardar»
  destino={refIframe}          // opcional: "iframe" | "documento" | ref a VUESTRO iframe
  urlVista="/estudio/vista/x"  // opcional: página de la vista previa propia
/>
```

`destino` funciona así:

- **`"iframe"`** es el valor por defecto en el modo completo. El probador pinta su propia vista previa, `/i/<slug>?vista=1`.
- **`"documento"`** es el valor por defecto en el modo compacto. Pinta la misma página en la que está montado.
- **Un ref a vuestro iframe** sirve si el iframe es del mismo origen y lleva `?vista=1`.

En cualquier caso:

- Los colores llegan por `postMessage` en cuanto `EscuchaColor` responde `invitoo:color-listo`. Antes de eso se pintan directamente en el documento del iframe.
- La hoja inferior del modo compacto:
  - publica `--hoja-color` (su altura) en `<html>` mientras está abierta y añade `html[data-hoja-color]`;
  - en modo `documento`, también añade su altura como `padding-bottom` al `<body>`;
  - se pliega sola cuando `#confirmar` entra en pantalla;
  - flota a la derecha a partir de 64rem.

### Mensajes (mismo origen)

```ts
{ tipo: "invitoo:color", paleta: { papel, tinta, acento, acentoTexto, sobreAcento } }
{ tipo: "invitoo:color-original" }   // vuelve a los valores del servidor
{ tipo: "invitoo:color-listo" }      // del iframe al padre
```

`EscuchaColor` vuelve a pasar todo lo que recibe por `resolverPaleta`: nunca se fía del mensaje. También lee `?pal=papel-tinta-acento`, los tres en hex sin `#`, lo que sirve para compartir una demo con otros colores.

### `guardarPaleta(slug, { papel, tinta, acento })`

1. Valida el slug y los tres hex.
2. Llama a `exigirAccesoBoda`.
3. Recalcula `acentoTexto` y `sobreAcento` en el servidor, en el modo de la plantilla.
4. Comprueba `cumpleAA`.
5. Llama a `actualizarContenido(id, { tema: paleta })`, que **funde** el tema: `movimiento`, `sobre`, `variante`, `radio` y las fuentes quedan intactos.
6. Hace `revalidatePath('/i/<slug>')`.

Devuelve `{ ok, mensaje, paleta, ajustado }` o `{ ok: false, error }`.

## Por equipo

- **F2.** `EscuchaColor` ya está montado en `Lienzo.tsx`. Pendiente: que todo color pintado lea las variables de arriba.
- **F3.**
  - En la vista a pantalla completa de `/plantillas`, usad `<ProbadorColor slug={p.demo} plantilla={p.id} modo="completo" destino={refIframe} />` o dejad que pinte su propio iframe.
  - En `BarraDemo` (dentro de `/i/<demo>`), usad `<ProbadorColor slug plantilla modo="compacto" />`, con destino `documento`.
  - Subid los fijos con `bottom: calc(… + var(--hoja-color, 0px))`.
- **F4.** En Panel › Diseño, usad `<ProbadorColor slug={inv.slug} plantilla={inv.plantilla} tema={inv.tema} modo="completo" guardar={guardarPaleta} />`. Para borradores, añadid `urlVista`.
