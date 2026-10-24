# 24a · Secuencia de correos automáticos (E2 · Contenido)

> E2, 24-10-2026. Estrategia, textos y diseño de los correos de Invitoo: el ciclo de vida de los novios y los avisos del estudio. El motor (envío, cola, baja, crons) es de E1 (doc 24).
> Código: `app/src/lib/correos/secuencia.ts`, `app/src/lib/correos/plantillas/**`. Galería: `/estudio/correos`. Capturas: `qa/v3/e2/` (cada correo a 390 y 600 px, en claro y oscuro, más el HTML y el texto plano en `qa/v3/e2/html/`).

## 1. Principios

1. **Un correo, un propósito, un botón.** Cada correo tiene un objetivo medible y un solo CTA. Los enlaces secundarios van como texto, nunca como un segundo botón.
2. **Servicio antes que marketing.** 10 de los 12 correos a los novios son de servicio (transaccionales): ayudan a usar lo que han pagado. Solo 2 son de fidelización (reseña y aniversario) y llevan baja de un clic.
3. **Frecuencia moderada.** Hay como mucho un correo por hito. El resumen de confirmaciones sale una vez por semana y **solo si hay respuestas nuevas**. En los meses de más actividad, una pareja recibe 1 o 2 correos por semana.
4. **No somos wedding planner.** La cuenta atrás solo habla de lo que hace Invitoo (la invitación, el QR de En directo, el Libro de buenos deseos y la lista). Los correos lo dicen explícitamente: «Del resto ya os ocupáis vosotros (y quien os ayude). Nosotros, de que la invitación funcione.»
5. **Voz Invitoo (doc 19).** Vosotros, frases cortas, cálido y nunca insistente: sin urgencia falsa, sin «¡No te lo pierdas!» y sin fórmulas de SaaS. Los correos de Rodrigo son directos y escaneables: las cifras primero.
6. **Todo se apaga.** Hay cuatro grupos de preferencias (`servicio`, `rsvp`, `cuenta-atras` y `fidelizacion`, en `GRUPO_DE` de `tipos.ts`). Solo el aviso de borrado del álbum es `imprescindible`, porque si no llega, se pierden las fotos.
7. **Las condiciones se vuelven a mirar en cada cron.** Si la pareja ya publicó, el recordatorio de completar datos no sale. Si no hay fecha límite, no sale su aviso.

## 2. Qué hacen los mejores (investigación)

| Marca | Qué hace | Qué tomamos |
|---|---|---|
| **Greenvelope** | Recordatorios automáticos de RSVP **solo a quien no ha respondido**, con el sí/no dentro del correo; avisos al anfitrión por cada RSVP o un **resumen diario**; mensajes por fase (antes de la fecha límite, días previos, mañana del evento, agradecimiento después) [1]. Su guía de calendario: invitaciones entre 6 y 8 semanas antes, fecha límite entre 3 y 4 semanas antes, recordatorio **una semana antes del límite** y una nota final ese día [2]. | El resumen semanal solo con novedades, el aviso de la fecha límite (a −5 días, que deja margen para reenviar) y el consejo de fijar la fecha límite entre 3 y 4 semanas antes. |
| **Paperless Post** | Mensajes preescritos y editables desde el seguimiento: «Reminder to RSVP» (preselecciona a quien no ha abierto o no ha respondido), recordatorio del evento, cambio de hora o lugar y «thank your guests» [3]. | El enfoque de **segmentar a quien falta** (en el panel) y el texto sugerido para el recordatorio. |
| **Zola** | Sin invitación digital propia: RSVP en la web, recordatorios masivos en texto plano y breve, y «Remind Guests to RSVP» desde la app [4]. | Brevedad y texto plano siempre disponible. |
| **Joy** | Mensajes y anuncios a invitados por email y notificaciones de la app como «parte central del plan de comunicación» [5]. | La idea de que el correo a la pareja la lleva al panel, donde está la acción real. |
| **Minted** | Su fuerte es el ciclo de papelería (save the date, invitación, tarjetas de agradecimiento): el «después de la boda» es parte del producto [6]. | El correo de «gracias» con el álbum y el Libro como objeto para regalar, y el aniversario. |
| **Bodas.net (España)** | Anima a las parejas a dejar opiniones **cuando ha pasado «la locura de la boda»**, en la luna de miel; las reseñas alimentan sus premios [7]. | La reseña a +30 días (no a +7: a la semana siguen agotados y con los proveedores grandes) y un tono que lo plantea como ayuda a otras parejas. |
| **Práctica de lifecycle** (Klaviyo/PowerReviews) | Pedir la reseña cuando el cliente ya ha **usado** el producto, no al pagar [8]. | La reseña sale después de que hayan visto el álbum y el Libro. |
| **Entregabilidad (Gmail/Yahoo, 2024)** | SPF, DKIM y DMARC; `List-Unsubscribe` con URL y `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058); atender la baja en ≤ 2 días; spam < 0,3 % [9]. | Lo implementa E1. E2 pone la baja visible en el pie de la fidelización. |
| **Modo oscuro (Litmus)** | `color-scheme` + `supported-color-schemes`; `@media (prefers-color-scheme: dark)` funciona en Apple Mail e iOS; `[data-ogsc]`/`[data-ogsb]` en Outlook.com y las apps de Outlook; las apps de Gmail invierten por su cuenta [10]. | Las tres capas están en `base.ts` (§6). |
| **Legal (España)** | LSSI art. 21.2: se puede escribir a un cliente sobre **productos o servicios similares** a los contratados, con posibilidad de oponerse en cada envío; el resto, solo con consentimiento [11][12]. | La base legal de cada paso (§3). |

## 3. La secuencia (novios)

`dias` se cuenta respecto al ancla: −30 = 30 días antes. La ventana es el margen si el cron no pasa el día justo. **Base legal:** T = servicio (transaccional, ejecución del contrato); L = cliente con producto similar (LSSI 21.2), con baja de un clic; C = consentimiento (ningún paso lo necesita hoy).

| # | Id | Objetivo | Disparador / desfase | Condición | Base | Asunto A | Asunto B | Preheader | Métrica |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `bienvenida` | Que entren al panel y empiecen a rellenar | Evento `pago` **o** `vinculo` (mismo id: sale una vez) | — | T | Bienvenidos, {A} y {B}: empezamos vuestra invitación | Ya estáis dentro. Esto es lo que viene ahora | Tres pasos y, en 24 horas, el primer borrador con vuestros nombres. | % que abre el panel en 48 h |
| 2 | `completar-datos` | Desbloquear a las parejas paradas | Pago **+3 días** (ventana 4) | pagado, no publicada y faltan datos o falta aprobar el diseño | T | Vuestra invitación os espera (os falta muy poco) · *(si solo falta aprobar:)* Vuestro borrador os espera | Un último empujón y la vemos con vuestros nombres | Diez minutos desde el móvil y nos ponemos con el diseño. | % que completa los datos en 7 días |
| 3 | `publicada` | Que la envíen desde el panel con enlaces personales | Evento `publicada` | — | T | Ya está publicada: así la enviáis por WhatsApp | {A} y {B}, vuestra invitación ya se puede abrir | Cada invitado tiene su enlace, con su nombre en el sobre. | % de invitados con enlace enviado en 72 h |
| 4 | `rsvp-resumen` | Tranquilidad sin tener que entrar a mirar | **Recurrente cada 7 días** | publicada, RSVP abierto, boda futura y **respuestas nuevas > 0** | T | {n} confirmaciones nuevas esta semana | Ya son {vienen} los que vienen a vuestra boda | {vienen} invitados dicen que sí, {respuestas} respuestas en total. | Clics al panel; baja del grupo «rsvp» < 1 % |
| 5 | `rsvp-fecha-limite` | Cerrar la lista a tiempo, recordando solo a quien falta | Fecha límite **−5 días** (ancla nueva `limite-rsvp`, ventana 2) | publicada, RSVP abierto y límite futuro | T | Faltan {n} días para cerrar las confirmaciones | ¿Quién falta por responder? Un recordatorio amable | Desde el panel podéis recordárselo solo a quien aún no ha respondido. | Respuestas entre el correo y el límite |
| 6 | `faltan-30` | Activar En directo y el Libro con tiempo | Boda **−30** (ventana 3) | pagado y boda futura | T | Queda un mes: tres detalles de Invitoo para el gran día | 30 días. Lo de Invitoo, a punto en diez minutos | El QR de En directo, el Libro de buenos deseos y vuestra lista, en diez minutos. | % con En directo y Libro activados antes de T−7 |
| 7 | `faltan-7` | Tarjetas QR impresas y pantalla probada | Boda **−7** (ventana 2) | pagado y publicada | T | Una semana: las tarjetas QR, listas para imprimir | {A} y {B}: siete días y contando | Imprimidlas con calma y probad la pantalla del salón antes del día. | Descargas de tarjetas QR |
| 8 | `faltan-1` | Calma: no tienen nada que hacer | Boda **−1** (ventana 0) | pagado, publicada y faltan exactamente 1 día | T | Mañana es el día, {A} y {B}. Solo disfrutad | Todo listo para mañana | Las fotos y los deseos de vuestros invitados se guardarán solos. | Respuestas pidiendo ayuda (≈ 0) |
| 9 | `gracias` | Que descubran el álbum y el Libro en PDF | Boda **+1** (ventana 3) | pagado y publicada | T | Gracias por dejarnos ser parte de vuestra boda | Vuestro álbum y vuestro Libro de buenos deseos ya os esperan | {fotos} fotos y {deseos} deseos de vuestros invitados, guardados para vosotros. | % que abre el álbum o el PDF en 7 días |
| 10 | `resena` | Reseñas reales y recomendaciones con código | Boda **+30** (ventana 7) | pagado y publicada | **L** | ¿Nos contáis qué tal fue? (dos minutos) | Vuestra opinión ayuda a otras parejas a decidir | Y un regalo para vuestros amigos que se casan: 20 € con vuestro código. | Reseñas publicadas y usos del código |
| 11 | `aniversario` | Recuerdo emocional; ofrecer conservar el álbum | Boda **+365** (ventana 2) | pagado | **L** | Hoy hace un año. Felicidades, {A} y {B} | Un año de vuestro «sí» | Volved a ver las fotos de aquel día. Y, si queréis, las guardamos un año más. | Ampliaciones «Conservar 1 año más»; bajas < 0,5 % |
| 12 | `album-caduca` | Que nadie pierda sus fotos | Borrado del álbum **−30** (ventana 7), **imprescindible** | hay fecha de borrado | T | Vuestro álbum se borra el {fecha}: descargadlo | Quedan 30 días para descargar las fotos de vuestra boda | Un ZIP con todas las fotos y vídeos. O lo guardamos un año más por 19 €. | % que descarga el ZIP o amplía antes |

**Notas de diseño de la secuencia**
- **¿Por qué la reseña a +30 y no a +7** (como sugería el doc 19 §4.7)? A +1 ya les escribimos con el álbum, y a +7 siguen con la luna de miel y con los proveedores grandes. Bodas.net recomienda esperar a que pase «la locura» [7]. A +30 ya han usado el álbum y el Libro: la reseña es más rica y más probable.
- **Aniversario y álbum.** El álbum dura 12 meses (`mesesOnline: 12`), así que «album-caduca» (−30 del borrado) suele llegar **antes** que el aniversario. El aniversario solo ofrece «conservar» si el álbum sigue online ese día; si no, invita a volver a ver las fotos descargadas. Así no prometemos lo que ya no existe.
- **Código para amigos.** Es el mismo programa del pie de la invitación (P2, `DESCUENTO_INVITADO` = 20 €). A los **invitados** no se les escribe nunca: solo ven el código en el pie de la invitación (sin consentimiento no hay base legal para escribirles).
- **Recomendación con base LSSI 21.2.** La reseña y el código se refieren al mismo servicio que contrataron (invitaciones de Invitoo). Si algún día se ofrecen productos distintos (impresión de fotos, álbumes físicos u otras marcas), eso ya **no es similar** y necesita consentimiento (C).
- **Pruebas A/B.** `ASUNTOS_B` (en `plantillas/index.ts`) y `renderizar(id, datos, "b")`. Propuesta para E1: variante = paridad del hash del slug, guardada en la fila de envío. La métrica primaria es el **clic** en el CTA, no la apertura, que Apple Mail Privacy Protection infla.

## 4. Correos del estudio (Rodrigo)

| Id | Cuándo | Asunto | Qué enseña | CTA |
|---|---|---|---|---|
| `estudio-diario` | Cron diario, a primera hora; **solo si hubo actividad** (lo decide E1 con `huboActividad`) | «Ayer en Invitoo: {páginas} visitas · {pagos} pagos · {rsvp} RSVP» | 3 cifras con tendencia frente a anteayer, intención (Reservar, WhatsApp y checkouts), invitaciones, top 3 de páginas y orígenes, y las bodas con movimiento | Ver visitas |
| `estudio-semanal` | Lunes | «Semana en Invitoo: {visitantes} visitantes (▲ x %) · {pagos} pagos» | Cifras frente a la semana anterior, **embudo** con conversión por paso, barras de visitantes por día, invitaciones, top de plantillas, páginas y orígenes, y bodas | Ver visitas |
| `alerta-reserva` | Evento `pago` | «Reserva pagada · {pareja} · {importe}» | Pareja, importe e invitación | Abrir en el estudio |
| `alerta-cobro` | Evento `cobro` | «Cobro pagado · {pareja} · {importe}» | Ídem | Ver cobros |
| `alerta-cambio` | Evento `solicitud` | «Solicitud de cambio · {pareja}» | La petición, como cita | Ver la solicitud |
| `alerta-pico` | Evento `pico` | «Pico de visitas: {n} en la última hora ({k} veces la media)» | Vistas/hora, múltiplo de la media, página y origen | Ver visitas en directo |

Las tendencias se escriben con flecha y texto («▲ 16 % vs. semana anterior»): no dependen del color. Las barras son tablas, así que se ven también en Outlook.

## 5. Contrato con E1 y cambios en `tipos.ts`

E2 exporta:
- `SECUENCIA: Paso[]` en `secuencia.ts` (más `FICHAS`, `TEXTO_BASE` y `describirDisparador` para la galería);
- `PLANTILLAS`, `ASUNTOS_B`, `renderizar`, `forzarOscuro` y `datosEjemplo` en `plantillas/index.ts`.

Ediciones mínimas en `tipos.ts` (todas opcionales y retrocompatibles):
1. `Ancla` añade **`"limite-rsvp"`** (la fecha límite de confirmación). E1 ya la resuelve en `motor.ts`.
2. `DatosCorreo.pendientes?: { datos: boolean; diseno: boolean }` sirve para que «completar-datos» diga «faltan datos» o «solo falta aprobar el borrador». **Pendiente en E1:** copiarlo de `ContextoPaso`. Sin él, el correo usa el texto de «faltan datos».
3. `DatosCorreo.recuerdo?: { texto; autor? }` sirve para mostrar un deseo favorito del Libro en el aniversario. **Pendiente en E1:** rellenarlo con el primer favorito. Sin él, el correo sale sin cita.

`bienvenida` aparece dos veces en `SECUENCIA` (eventos `pago` y `vinculo`). La clave de idempotencia (boda + paso + destinatario) garantiza que salga una sola vez.

## 6. Diseño y HTML

- **Estructura:** tablas `role="presentation"` de 600 px máximo, todo el estilo en línea y el contenedor con un condicional MSO. El HTML ocupa entre 12 y 20 KB, por debajo del límite de 102 KB a partir del cual Gmail corta el mensaje.
- **Marca:** fondo bruma `#EDE6DD`, carta en papel `#FAF8F5` con filo `#E3D8CC` y radio de 18. El logo es `palabra` en PNG a 3× (`public/correo/logo-granate.png` y `logo-oro.png`, unos 20 KB cada uno, 168 × 42 px) con `alt="Invitoo"`, con un filete de oro de 1 px. Títulos en Bodoni Moda (Google Fonts en Apple Mail/iOS; en el resto, Didot, Bodoni 72 o Georgia) y texto en Instrument Sans (o la sans del sistema). El oro solo se usa en filetes, números y viñetas, nunca para texto corrido sobre papel (doc 17 §3).
- **Un único CTA:** botón granate con texto en papel (contraste 8,9 : 1) y VML `v:roundrect` para Outlook en Windows.
- **Accesibilidad:** el tamaño mínimo es de **16 px en todo**, pie incluido (lo comprueba `qa/v3/e2/capturas.mjs`). El cuerpo va a 17 px con interlineado de 1,6. El gris `#5E5650` sobre papel da 6,9 : 1. También: `lang="es"`, `role="article"` con `aria-label`, viñetas `aria-hidden` y el `alt` de todas las imágenes.
- **Preheader visible:** es la primera línea del correo, en cursiva serif sobre la bruma. Detrás va un relleno invisible para que la bandeja no arrastre el texto siguiente.
- **Modo oscuro:** `color-scheme: light dark`, `@media (prefers-color-scheme: dark)` (Apple Mail e iOS) y la copia `[data-ogsc]`/`[data-ogsb]` (Outlook.com y apps). Colores en oscuro: fondo `#141110`, carta `#1E1A17`, texto `#F3EEE8`, acento rosa granate claro `#E8B4BB`, el botón con filo dorado y **el logo cambia a oro**. En Gmail para móvil, que invierte por su cuenta, la base clara se ha elegido para que siga siendo legible al invertir.
- **Móvil (≤ 480 px):** márgenes de 22 px, h1 de 29 px y las cifras en dos columnas.
- **Texto plano:** siempre. Sale de los mismos bloques (`componer()` genera HTML y texto a la vez), con el CTA como `→ Texto: URL` y el pie con preferencias y baja.
- **Pie:**
  - en los correos de servicio: el motivo («Os escribimos porque estáis preparando vuestra invitación…»), el enlace a preferencias y el remitente;
  - en los de fidelización, además: «No quiero recibir más correos como este», es decir, la baja (la cabecera `List-Unsubscribe` de un clic la pone E1);
  - cuando `TITULAR` deje de tener marcadores (`lib/legal.ts`), conviene añadir la razón social al `REMITENTE_PIE` de `base.ts`.

## 7. QA

- `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node qa/v3/e2/capturas.mjs [id…]` renderiza las plantillas puras con los datos de ejemplo y emula el modo oscuro real (`colorScheme: "dark"`). Comprueba que no hay scroll horizontal, que no hay texto por debajo de 16 px y que todas las imágenes llevan `alt`. Resultado actual: **18 correos × 4 capturas, OK**.
- `qa/v3/e2/html/<id>.html` y `<id>.txt` contienen el HTML y el texto plano con el asunto A, el B y el preheader, para pegarlos en Litmus o Email on Acid antes del lanzamiento. **Recomendado:** una pasada real en Outlook para Windows, Gmail para Android y Yahoo, que aquí no se pueden emular.
- Galería: `qa/v3/e2/galeria-*.png`.

## 8. Fuentes

1. Greenvelope, «Guest Messaging on Greenvelope»: https://www.greenvelope.com/knowledge/docs/messaging-guests.md
2. Greenvelope, «When to send wedding invitations and save the dates»: https://www.greenvelope.com/resources/when-to-send-wedding-invitations-and-save-the-dates
3. Paperless Post, «How to manage your event with Paperless Pro»: https://www.paperlesspost.com/blog/paperless-pro-event-management-tools/
4. Zola, «How do I request RSVPs from my guests?»: https://www.zola.com/faq/115002251351
5. Joy, «Getting the most from your wedding website and app»: https://withjoy.com/blog/getting-the-most-from-wedding-website-and-app/
6. Minted, tarjetas de agradecimiento y ciclo de papelería (reseña de terceros): https://tonsofthanks.com/mintedreview/
7. Bodas.net, «Razones para dejar opiniones a los proveedores de vuestra boda»: https://www.bodas.net/articulos/dejar-opiniones-proveedores-boda-contratados--c3742
8. PowerReviews, «When to ask for reviews»: https://www.powerreviews.com/when-to-ask-for-reviews-best-practice-guide/ · Klaviyo, «Guide to creating a post-purchase flow»: https://help.klaviyo.com/hc/en-us/articles/360028872611
9. Resend, «Gmail and Yahoo bulk sending requirements for 2024»: https://www.resend.com/blog/gmail-and-yahoo-bulk-sending-requirements-for-2024
10. Litmus, «The ultimate guide to dark mode for email marketers»: https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers
11. LSSI (Ley 34/2002), art. 21: https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
12. AEPD, resoluciones sobre comunicaciones comerciales a clientes (ej. A/00081/2015): https://www.aepd.es/documento/a-00081-2015.pdf

*La parte legal es orientativa y está pendiente de revisión por un abogado, como el resto de los textos legales (`lib/legal.ts`).*

## 9. Revisión E3 (24-10-2026)

- **Un solo correo al pagar.** La `bienvenida` disparada por `pago` es ahora también la confirmación de la reserva (`DatosCorreo.reserva`: importe, demo, plazo, WhatsApp y condiciones). Se ha quitado el antiguo «Vuestra invitación está reservada» de `pagos/cobrar.ts`. El texto coincide con `/condiciones`: contacto en menos de un día laborable, videollamada y plazo desde la videollamada (se quitó el «borrador en 24 horas»). Sale siempre: sin preferencias, sin límite diario y sin `List-Unsubscribe`. Si el email ya tenía bienvenida, la confirmación usa la clave del pedido.
- **`List-Unsubscribe`** en todo correo a los novios que se pueda apagar. El clic de Gmail o Yahoo apaga **solo el grupo** de ese correo (`&g=`). No va en el recibo ni en `album-caduca`.
- **`album-caduca`** (imprescindible, no se puede apagar) ya no lleva precio ni oferta: un correo que no se puede apagar no puede ser comercial.
- **Sin Google Fonts** en los correos: mandaban la IP del destinatario a Google. Las alternativas Didot, Bodoni 72 y Georgia ya estaban en la pila.
- **Pie de servicio** en pasado después de la boda. Sin «Bienvenidos, vosotros» cuando faltan los nombres. `euros()` devuelve «74,50 €» y los asuntos del estudio usan singular y plural.
- **Tamaños medidos** (HTML / texto): bienvenida 13,6 / 1,5 KB; servicio 10–13 KB; estudio-diario 20,9 KB; estudio-semanal 32,6 KB (el mayor). Todos muy por debajo de los 102 KB.
