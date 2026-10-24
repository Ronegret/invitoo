# Brief: correos automáticos (E1 motor · E2 contenido · E3 revisión)

Rodrigo: «Es importante generar envíos automáticos de correos, tanto a mí sobre visitas como a los clientes como fidelización. Que un equipo de agentes se dedique a esto en paralelo.»

## Lee antes de empezar
- `app/AGENTS.md` (Next 16: consulta `app/node_modules/next/dist/docs/`).
- `docs/11-brief-wow-y-panel.md` (reglas innegociables), `docs/14-sistema-diseno.md`, `docs/17-marca-invitoo.md` y `docs/19-estrategia-marca-marketing.md` (voz y pilares).
- Lo que ya hay:
  - `src/lib/avisos/**` (email con Resend, push y el resumen diario por cron `/api/avisos/resumen`);
  - `src/lib/pagos/**` (P2: reservas pagadas, cobros y correos de confirmación);
  - `vercel.json` (crons);
  - `docs/21-stripe-puesta-en-marcha.md`.

## Qué se quiere

### A. Para Rodrigo (estudio)
- **Visitas a la web,** con métricas propias, respetuosas con la privacidad, sin cookies ni datos personales, para no necesitar banner:
  - páginas vistas por día;
  - visitantes únicos aproximados (hash diario rotado de IP + UA con sal diaria; la IP nunca se guarda);
  - de dónde vienen (referer o utm);
  - páginas top y plantillas más vistas;
  - clics en «Reservar» y en WhatsApp;
  - checkouts iniciados frente a pagados (embudo).
- **Visitas a las invitaciones:** aperturas por boda, RSVP nuevos y fotos subidas.
- **Correos:**
  - **resumen diario** breve, a primera hora y solo si hubo actividad;
  - **resumen semanal** los lunes, con tendencias frente a la semana anterior;
  - **alertas al momento:** reserva pagada, cobro pagado, solicitud de cambio y pico de visitas.
- Una página `/estudio/visitas` con las mismas cifras: tabla y gráfica sencilla, accesible.

### B. Para los clientes (novios): fidelización durante el ciclo de vida
Secuencia según la fecha de la boda, con frecuencia moderada y sin spam. Todo se puede apagar.
- Bienvenida, tras pagar o al vincular la cuenta, con los siguientes pasos.
- Recordatorio para completar datos y aprobar el diseño.
- Invitación publicada: cómo enviarla por WhatsApp, más consejos.
- Resumen de confirmaciones, semanal mientras haya RSVP abiertos, y el aviso de la fecha límite.
- 30, 7 y 1 días antes: checklist suave de Invitoo (QR de «En directo» y Libro de deseos). Ojo: no somos wedding planner.
- Día después: gracias, el álbum y el Libro de buenos deseos en PDF.
- 1 mes después: pedir una reseña y el programa de recomendación (código para amigos que se casan).
- Aniversario: 1 año después, felicitación con el recuerdo; ofrecer conservar el álbum (+1 año).
- Antes de que caduque el álbum: aviso para descargarlo.
- Invitados que se casan: no se les escribe sin consentimiento. Solo el código del pie (P2).

## Reparto y contratos
| Agente | Área | Archivos |
|---|---|---|
| **E1 · Motor** | medición de visitas, cola y programación de envíos, Resend, preferencias y baja, crons, página `/estudio/visitas`, alertas | `src/lib/correos/{motor,enviar,programar,preferencias,metricas}.ts`, `src/lib/visitas/**`, `src/app/api/correos/**`, `src/app/api/visitas/**`, `src/app/estudio/visitas/**`, `src/app/baja/**`, `supabase/migraciones/2026-11-correos.sql`, `vercel.json` (añadir crons), el script de medición en el layout del sitio y de la invitación (edición mínima) |
| **E2 · Contenido** | estrategia de la secuencia, asuntos, textos, diseño HTML de los correos (con la marca, compatibles con Gmail, Outlook y Apple Mail, en modo oscuro), versión de texto plano | `src/lib/correos/plantillas/**` (funciones puras `(datos) => { asunto, preheader, html, texto }`), `src/lib/correos/secuencia.ts` (la definición declarativa: id, disparador o desfase respecto a la fecha de la boda o al pago, condición y plantilla), `docs/24a-secuencia-correos.md`, una galería de vista previa `/estudio/correos` (solo estudio) |
| **E3 · Revisión** | entra al final: revisa los dos con mirada de QA, entregabilidad y legal, y corrige | ver su encargo |

**Contrato E1 ↔ E2:**
- E2 exporta `SECUENCIA: Paso[]` y `PLANTILLAS: Record<IdCorreo, (d: DatosCorreo) => Correo>`.
- `type Correo = { asunto: string; preheader: string; html: string; texto: string }`.
- `DatosCorreo` incluye `pareja {a,b}`, `fecha`, `slug`, `enlaces {panel, invitacion, album, deseos, baja, preferencias}`, `cifras?` y `estudio?`.
- E1 define `DatosCorreo` en `src/lib/correos/tipos.ts` **primero** (en los primeros minutos) y E2 lo usa. Si E2 necesita un campo, lo añade con un Edit mínimo y lo anota.
- Los correos internos de Rodrigo (resúmenes y alertas) también son plantillas de E2 (`estudio-diario`, `estudio-semanal`, `alerta-*`).

## Reglas
1. **Legal (España/UE):**
   - Los correos de servicio (transaccionales) se pueden enviar.
   - Los de fidelización y comerciales (reseñas, recomendación, ofertas) necesitan una base legítima: cliente con producto similar (LSSI art. 21.2), con baja sencilla en cada correo, o consentimiento.
   - Cada correo de fidelización lleva un enlace de baja de un clic (`List-Unsubscribe` + `List-Unsubscribe-Post: One-Click`, como piden Gmail y Yahoo) y enlace a las preferencias.
   - Las métricas de visitas, sin cookies ni datos personales.
   - Actualiza `/privacidad` con un párrafo (edición mínima) y anótalo.
2. **Entregabilidad:**
   - Remitente `AVISOS_REMITENTE` con dominio verificado en Resend (SPF, DKIM y DMARC: documentarlo).
   - Texto plano siempre.
   - Sin imágenes pesadas; logo en SVG convertido a PNG alojado en `public/correo/`.
   - Ancho de 600 px y tablas.
   - Respetar el modo oscuro.
   - Idempotencia: el mismo correo no sale dos veces a la misma persona (clave por boda, paso y destinatario).
   - Límite por día.
   - Reintentos con backoff.
3. **Sin Resend (local y demo):** no se envía nada. Se guarda en un buzón en memoria o en archivo (`.correos-local/`, en gitignore), visible en `/estudio/correos`, con la vista previa del HTML. Todo se puede probar en localhost:3100.
4. **Crons de Vercel.** El plan Hobby solo permite crons diarios, así que se usan crons diarios como mucho, más los disparos por evento (webhook de pagos, RSVP y momentos) llamando a `programar()`. Protege los crons con `CRON_SECRET`.
5. **Otros agentes en el árbol.** I1 (el integrador) toca muchos archivos y A2 hace el acceso con Google (`lib/auth/**` y `cuenta/**`). Relee antes de cada Edit, haz ediciones mínimas en los archivos compartidos y no reescribas archivos ajenos. Usa tu propio distDir y puerto: E1 `.next-e1` en el 3551 y E2 `.next-e2` en el 3552. Al terminar, para el servidor y quita la línea `.next-*` del tsconfig.
6. **Sin dependencias nuevas** salvo que sean imprescindibles (MIT o Apache). Si E2 quiere usar React Email, que sea solo con `react-dom/server`, que ya está, sin paquetes nuevos.
7. **Copy en español,** tratando a los novios de «vosotros», cálido, breve, con la voz de Invitoo. Los correos de Rodrigo, directos y escaneables.
8. **Validación:** `npx tsc --noEmit -p .` y `npx eslint` sobre tus archivos. Capturas en `qa/v3/<agente>/`: E2 hace capturas de cada correo a 390 y 600 px, en claro y oscuro. No hagas commit.
9. **Informe final en español.** Incluye lo que tiene que configurar Rodrigo: Resend, dominio, DNS y variables.
