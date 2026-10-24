# Invitoo — Estrategia de marca y negocio

---

## 1. Lo importante (si solo lees una página, lee esta)

**Invitoo no vende invitaciones. Vende el momento en que 120 personas abren el teléfono y se emocionan a la vez.**

Ese reencuadre resuelve los cuatro problemas del negocio a la vez:

| Problema | Cómo lo resuelve |
|---|---|
| Competir con editores de 29 € | Un editor no puede vender un momento. Solo vende un formulario bonito. |
| El precio de 169 € no se explica | Se explica solo si lo que entregas es una pieza dirigida, con música propia y una apertura cinematográfica. |
| Cero retención | El momento no acaba en el RSVP: sigue en el muro de mensajes, el álbum y el recuerdo post-boda. |
| Cero adquisición | Cada invitación la ven 120 personas en edad de casarse. Esa es la máquina de crecimiento. |

Y hay una cosa que **ningún competidor español tiene y Invitoo ya tiene medio construida**: la canción compuesta para la pareja. Eso deja de ser un bonus y pasa a ser el centro.

> **Posicionamiento:** Invitoo diseña la invitación de boda como una pieza a medida — con su propia apertura, su propia música y su propia historia. No es una plantilla que rellenas. Es un encargo.

---

## 2. Cinco capas

### Usuario

**Primario — la pareja (28–40 años, España).** Organiza la boda desde el móvil, casi siempre ella lleva la coordinación, en ratos sueltos. No quiere aprender una herramienta. Quiere delegar y quedarse tranquila. Su miedo real no es el precio: es **quedar mal delante de su familia** con algo que parezca barato o que la tía Mari no sepa abrir.

**Secundario — el invitado.** Recibe un enlace por WhatsApp. Lo abre una vez con atención (el día que llega) y vuelve 2–4 veces por logística (hora, dirección, dress code, cómo llegar). Mezcla de edades de 18 a 85. **Este usuario es quien decide si Invitoo parece caro o parece mágico.**

**Terciario — el organizador de eventos / wedding planner.** Compra en volumen. Hoy no está atendido.

### Experiencia

La experiencia de Invitoo son **dos productos distintos**, y hoy están mezclados:

1. **invitoo.es** — el sitio comercial. Su único trabajo es hacer que la pareja entienda en 8 segundos qué recibe y reserve la videollamada.
2. **La invitación** — la pieza. Su trabajo es emocionar y resolver logística sin fricción, en un móvil viejo con 3G.

Se diseñan con criterios opuestos. El sitio puede ser denso y explicativo. La invitación tiene que ser silenciosa, rápida y evidente.

### Negocio

Hoy: pago único, 89–169 €, margen comido por horas de montaje.

Adónde va (detalle en §5): subir el ticket medio, quitar horas de montaje con plantillas parametrizadas, y añadir dos fuentes nuevas de ingreso que hoy no existen (post-boda y referidos de invitados).

### Tecnología

Fuera WordPress. Detalle y justificación en [03-arquitectura.md](03-arquitectura.md). Resumen: **Next.js en Vercel + Supabase**. Objetivo medible: **la invitación abre en menos de 1 segundo en 4G y pesa menos de 300 KB antes de las fotos.**

### Marca

El logo ya tiene la respuesta y no se está usando: **las dos alianzas entrelazadas**. Eso es el sello. Es lo que cierra el sobre, lo que gira mientras carga, lo que marca el favicon, lo que se estampa al confirmar asistencia. Detalle en [04-diseno.md](04-diseno.md).

---

## 3. Diferenciadores (en orden de fuerza)

**P0 — La apertura.** Cada plantilla se abre con una secuencia cinematográfica. Es lo primero que ve el invitado y lo que hace que se lo enseñe a alguien. Ningún competidor español hace esto bien (ver §4 sobre cómo hacerlo sin destruir la velocidad).

**P0 — La canción.** Vuestra boda tiene banda sonora propia, compuesta para vosotros, y suena al abrir la invitación. Esto es defendible: requiere la alianza con Dedícalo, no se copia con un plugin.

**P1 — La videollamada.** No es un extra de atención al cliente: es el momento en que Invitoo deja de ser una web y pasa a ser un estudio de diseño. Debe estar en el hero, no en una FAQ.

**P1 — El libro de la boda.** Después de la boda, todos los mensajes del muro, las fotos subidas por los invitados y la canción se convierten en una pieza que la pareja conserva. Hoy esto se hace a mano y no se cobra.

**P2 — Multi-idioma real.** Muchas bodas en España tienen invitados extranjeros. Hoy no se ofrece; Felizia sí. Es barato de construir sobre la nueva arquitectura.

---

## 4. La apertura en vídeo

**Va en vídeo, con autoplay silenciado.** Es la decisión correcta y ya la tienes resuelta: el patrón de `aem.rodd.es/src/intro.js` funciona y está bien hecho. Se adopta tal cual, con sus cuatro reglas innegociables:

- **`muted`.** Sin eso ningún navegador deja arrancar un vídeo solo: el `play()` se rechaza y el invitado ve una pantalla negra.
- **`playsinline`** (y `webkit-playsinline`). Sin eso, Safari en iPhone se lleva el vídeo a su reproductor a pantalla completa con sus controles encima.
- **Un montaje por forma de pantalla**, vertical para móvil y horizontal a partir de 768 px, y se descarga **uno solo**. Bajar los dos para enseñar uno es tirar la mitad de los datos del móvil de alguien.
- **Que nunca bloquee.** Botón «Saltar» desde el primer fotograma, Escape, y un temporizador de seguridad: si el archivo falla, tarda o el navegador se niega, la invitación se abre igual.

A eso se le añaden tres cosas que en una invitación de boda sí hacen falta:

**Póster como primer fotograma.** El `poster` en AVIF pesa 6 KB y se pinta antes de que llegue el vídeo. La pantalla nunca está negra, y el póster es el LCP de la página en vez del MP4.

**Una capa de rótulo encima del vídeo.** Aquí está lo que convierte esto en producto y no en un anuncio: el máster de vídeo es **de la plantilla**, no de la pareja. Encima va una capa HTML con los nombres, la fecha y la paleta de *esa* boda, que entra en el segundo que marca cada plantilla y aterriza exactamente donde está el titular de la portada. Resultado: un solo rodaje por plantilla, seis másters en total, y cada una de las 200 bodas que pasen por ahí tiene su apertura personalizada sin renderizar un vídeo nuevo. Ese es el ahorro que hace que el modelo escale.

**La canción, en un botón.** El vídeo va mudo por obligación, así que la canción de Dedícalo no puede sonar sola. En vez de esconder el problema, se convierte en parte de la invitación: un botón de sonido discreto y permanente, con el audio sin descargar hasta que se pulsa. El invitado que quiere oírla la enciende; el que está en el metro, no.

### Presupuesto de peso

**HECHO, medido en el prototipo.** El máster de prueba cortado de tu propio material de stock:

| | |
|---|---|
| Vertical 1080×1920, 9 s, H.264 CRF 27 | 1,8 MB |
| Horizontal 1280×720, 9 s | 1,6 MB |
| Póster AVIF | 5,6 KB |
| **Lo que descarga un invitado** | **1,8 MB como mucho** |

Está en línea con los 2,3 MB de `aem.rodd.es`. El límite que se fija por plantilla es **2,5 MB por montaje y 10 segundos**. Si un máster no entra, se recorta o se recomprime, no se publica.

Con AV1 en `.webm` como primera fuente y H.264 como respaldo, ese 1,8 MB baja a ~900 KB en los navegadores modernos. Se hace cuando estén los seis másters definitivos.

## 5. Modelo de negocio propuesto

### 5.1 Precios

Los actuales (89 / 129 / 169 €) tienen dos problemas: el salto entre planes no se entiende, y el plan de entrada canibaliza al de arriba porque ya incluye canción.

**Propuesta:**

| Plan | Precio | Qué es |
|---|---|---|
| **Invitoo** | **149 €** | La invitación completa: apertura cinematográfica, todos los módulos logísticos, RSVP con panel, muro de mensajes, álbum compartido, videollamada de diseño. Sin canción. |
| **Invitoo Canción** | **249 €** | Todo lo anterior + canción original compuesta para la pareja (Dedícalo), integrada en la apertura + versión descargable para la ceremonia. |
| **Invitoo Estudio** | **desde 449 €** | Diseño original desde cero (no plantilla), apertura a medida, multi-idioma, y el Libro de la Boda incluido. |

Añadidos: **Libro de la Boda 79 €** (post-boda) · **idioma extra 39 €** · **entrega en 48 h 49 €**.

**Por qué sube el precio y no baja.** Invitoo no puede ganar la guerra de precio contra freemium — la pierde siempre. Puede ganar la de percepción. Un cliente que ve 89 € piensa «plantilla». Uno que ve 249 € con una canción propia piensa «encargo». Y el gasto medio de una boda en España hace que 249 € sea ruido: es menos que el ramo.

**HIPÓTESIS, hay que validarla:** probar 149/249 contra 89/169 en paralelo durante 6–8 semanas antes de matar los precios viejos.

### 5.2 Retención y crecimiento

El motor está dentro de la propia invitación:

- **Pie de invitación discreto y bonito** — no un «Powered by». Algo como *Diseñado por Invitoo*, con el sello de las alianzas, que lleva a una landing pensada para invitados (no la home comercial): *«¿Te casas tú? Te hacemos la tuya.»*
- **Código para el invitado.** Quien confirma asistencia puede pedir un código de descuento para su propia boda. Conviertes 120 impresiones en leads con nombre y email que ya te han visto funcionar.
- **Wedding planners.** Acuerdo de volumen con comisión. Un planner con 25 bodas al año vale más que 25 clientes sueltos.
- **El Libro de la Boda** es la única recompra natural, y llega 3–12 meses después, cuando la pareja ya te quiere.

### 5.3 Qué mirar

Norte: **coste por boda montada (en horas)** y **leads generados por invitación enviada**. Si el primero no baja con las plantillas parametrizadas y el segundo no supera 1, la reforma no ha funcionado por mucho que la web sea preciosa.

---

## 6. Prioridades

**P0 — sin esto no hay producto nuevo**
Motor de plantillas parametrizado · 6 plantillas con apertura · panel de novios (RSVP + contenidos) · panel interno de montaje · checkout Stripe · nueva invitoo.es · migración de las 5 bodas vivas.

**P1 — alto impacto**
Landing para invitados + código de referido · reestructura de precios · álbum de fotos con Supabase Storage · multi-idioma · exportación MP4 de la apertura.

**P2 — deseable**
Libro de la Boda · portal de wedding planners · seating plan · lista de regalos con pago integrado.

**P3 — experimento**
Generación asistida del texto de «Nuestra historia» a partir de la videollamada · aperturas generadas a partir de la foto de la pareja.

No se construye todo a la vez. P0 completo y bien terminado antes de tocar P1.
