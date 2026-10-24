# Invitoo — Plan de mejora

> Octubre de 2026. Sale de cuatro análisis hechos en paralelo: competencia y casos de estudio, código abierto y técnica, auditoría de diseño, UX y React del prototipo, y mercado, wedding planner y negocio. Continúa los documentos [01](01-auditoria.md) a [05](05-archivo.md) sin repetirlos.
> Las cifras llevan su fuente al final. Lo marcado **[NV]** no se ha podido verificar.

---

## 0. En una página

**El diagnóstico.** La marca nueva ya está por encima del mercado español: la didone, el granate del lacre, el sello de alianzas y el copy con criterio. El producto, todavía no. Lo frenan cuatro cosas:

1. **Las 12 plantillas son la misma página reordenada.** Comparten papel, tipografía y tinta. El invitado no percibe el orden de las secciones; percibe la forma.
2. **Las aperturas prometen más de lo que enseñan.** Hoy son metraje de stock de una tienda de novias, y el vídeo tapa la portada *después* de que el invitado ha empezado a leer.
3. **Hay fallos que no pueden llegar a producción:** cualquiera puede sobrescribir una boda, las horas salen desplazadas 1–2 h y hay RSVP duplicados.
4. **La web comercial no dice en 8 segundos qué recibes y por cuánto,** y depende de fotos de stock que restan valor al precio.

**El hueco de mercado.** En España nadie une estas tres cosas: **apertura cinematográfica + web con RSVP + servicio de diseño con prueba social**. El mercado está partido en dos:

- autoservicio barato (Nupcio 29 €, Invitatis 75 €, Invitaciones Mi Boda 100 €), donde el RSVP, el mapa y el QR ya son commodity;
- «a medida» sin marca ni reseñas (Iberdigital desde 149 €, WedInvita 290–760 €).

Además, **ningún competidor ofrece una canción original**.

**La apuesta.** Invitoo deja de vender funciones y vende **el momento en que 120 personas abren el móvil a la vez**. Para eso:

- **6 plantillas** de verdad distintas en lugar de 12 parecidas;
- una experiencia del invitado impecable para alguien de 70 años;
- un panel que le quita horas a la pareja y al wedding planner;
- un motor de crecimiento dentro de cada invitación.

**Las tres primeras acciones, esta misma semana:**

1. Cerrar el fallo de seguridad del estudio (§9, F0).
2. Arreglar la zona horaria (§9, F0).
3. Quitar de invitoo.es los errores visibles: el shortcode, el «© 2025», el aviso en USD y las tildes.

---

## 1. El mercado en cifras

| Dato | Cifra |
|---|---|
| Bodas al año en España | **175.364** (2024, +1,7 %) |
| Gasto medio por boda | **25.183 €** (225 € por invitado) |
| Invitados medios | **123** |
| Gasto en papelería e invitaciones | **~250–350 €** (datos de 2023, pendientes de actualizar) |
| Bodas civiles | **~80 %** (INE 2022) |
| Con un cónyuge extranjero | **18,2 %** |
| Estacionalidad | junio, julio, septiembre y octubre suman el **~60 %** de las bodas |
| Antelación media de la planificación | 13 meses |
| Mercado total | más de 4.000 M€/año |

**Tres lecturas que cambian el producto:**

- **El 80 % de las bodas son civiles,** y el catálogo actual está pensado para iglesia y finca. Falta la plantilla civil urbana (§5).
- **El 18 % tiene un cónyuge extranjero.** El multi-idioma se vende solo, y Barcelona es el mercado de destino más fuerte.
- **249 € es menos del 1 % de la boda** y está por debajo de lo que hoy se gasta en papel. El precio no es la barrera; la barrera es la percepción.

---

## 2. Competencia

### 2.1 España

| | Modelo | Precio | Lo que hace bien | Apertura | Punto débil |
|---|---|---|---|---|---|
| Nupcio | Autoservicio | 29 € | RSVP con alergias, 1.000 fotos, seating, ES/CA/EN | No | Sin diseño ni servicio |
| Invitatis | Autoservicio | 75 € | Exporta a Excel, 9 idiomas, «9.813 parejas» | No | 4 diseños genéricos |
| Invitaciones Mi Boda | Semi a medida | 100 € (tachado 200), en 24–72 h | Velocidad, Klarna, WhatsApp | [NV] | Plantilla única |
| Tu Sobre Digital | 3 niveles | desde 79 € | Mini-web y RSVP | [NV] | Sin reseñas |
| Eres el Invitado | Catálogo / a medida | 99–199 € | Enlace por invitado | No | 0 reseñas |
| Iberdigital | A medida | desde 149 € | Animaciones y música | Animación, sin vídeo | 1 reseña |
| WedInvita | A medida premium | 290–760 € | Diseño a medida, libro de firmas | No | 1 reseña. **Demuestra que hay techo por encima de 449 €** |
| Felizia | Papel + digital | variable | Packs de papel y digital, 4,9★ (167 reseñas) | [NV] | Lo digital es un accesorio |
| Etsy / Canva | Plantilla de vídeo | 1–25 $ / 0–110 €/año | Vídeo vertical con sobre para WhatsApp | Sí | Sin RSVP ni web |

### 2.2 Referentes internacionales y qué se copia

| Referente | Qué hizo | Qué se copia |
|---|---|---|
| **Paperless Post** | 175 M de remitentes y destinatarios y 19 M de eventos desde 2009. Más de 40 firmas de diseño (Oscar de la Renta, Rifle Paper) | **Cada invitado es un cliente futuro.** Las colaboraciones de diseño justifican el premium |
| **Greenvelope** | El sobre animado (lacre, forro, nombre del invitado) en *todos* los planes, a ~1 $ por invitado | **La apertura es el producto, no un extra.** Con el nombre de *cada* invitado |
| **Casa Convite** (México) | Apertura en menos de 3 s con el nombre del invitado. Escalera de precio por plazo y número de invitados, cobro 50/50. «Invitaciones que hacen sentir que el evento ya comenzó» | Escalera de precio y frase de promesa. Es el modelo más trasladable a 149/249/449 |
| **Wedew** (Indonesia) | 40.000 bodas: WhatsApp oficial, check-in con QR, pantalla de saludos, livestream | **El día de la boda también es producto** |
| **Joy / Zola** | El software gratis como gancho, monetizado con los regalos | **No competir en «gratis».** Invitoo gana en percepción, no en precio |
| **Wedibox** | Álbum de invitados: de 15.000 bodas (2023) a 42.000 (2025), a 49–79 $ | Valida cobrar el álbum y el Libro de la Boda |

### 2.3 Tendencias que importan (2025–2026)

- **QR en la papelería:** el 59 % de las parejas en 2026, frente al 7 % en 2021 (The Knot).
- **Papel híbrido:** lacre y vellum con QR o AR que abre un vídeo.
- **RSVP por WhatsApp,** ya estándar en India, México e Indonesia.
- **Bilingüe de serie** en las bodas de destino.
- **Personalización extrema:** el 68 % quiere que sus invitados sientan que «nunca han estado en una boda así».
- **Micro-bodas,** +23 %: menos invitados y más presupuesto por invitado.
- **Vídeo vertical** de save the date para redes.

---

## 3. DAFO

| Fortalezas | Debilidades |
|---|---|
| Canción original con Dedícalo: **nadie más la tiene** y no se copia con un plugin | Negocio de una persona: no hay quien le sustituya en temporada alta |
| Apertura en vídeo de ~1,8 MB, ya medida y funcionando | 5 bodas vivas: poca prueba social y ninguna ficha en Bodas.net |
| Rodrigo es diseñador UX, desarrollador y automatizador: el coste por boda puede bajar mucho | Producción aún en WordPress, con errores visibles |
| Sistema de marca sólido: sello, didone, copy | 12 plantillas que parecen una sola |
| Barcelona, el mercado de destino más fuerte | La demanda se concentra en 4 meses |

| Oportunidades | Amenazas |
|---|---|
| ~120 invitados en edad de casarse por boda: **adquisición gratis** | Autoservicio a 29–100 € que ya trae RSVP, mapa y QR |
| El 80 % de las bodas son civiles y nadie les diseña bien | Canva, CapCut e IA para hacerlo uno mismo |
| 18 % con cónyuge extranjero: multi-idioma | Dependencia de Dedícalo |
| Los planners y las fincas no tienen herramienta de RSVP | Bodas.net controla el tráfico de búsqueda |
| Bautizos, comuniones y eventos corporativos para llenar el invierno | El número de bodas está estancado |
| Papel híbrido con QR, para el 84 % que aún quiere papel | |

---

## 4. Posicionamiento y marca

**Frase de posicionamiento.** Se mantiene la del [02](02-estrategia.md): *«No es una plantilla que rellenas. Es un encargo.»*

**Promesa para la web:** «Vuestra boda empieza cuando abren la invitación.» Recoge lo que mejor funciona en Casa Convite, sin copiarlo.

**Cuatro pilares, en este orden:**

1. **La apertura.** Cinematográfica, con vuestros nombres. El invitado se la enseña a alguien.
2. **La canción.** Vuestra boda tiene banda sonora propia. Debe estar en el hero y no en un bullet.
3. **Nadie se queda fuera.** La abuela la abre sin ayuda, y también hay papel con QR para quien lo quiera.
4. **Os quitamos el trabajo.** Las confirmaciones, alergias, autobuses y mesas llegan solas, en un Excel listo para el catering.

**Lo que se retira:**

- **Las fotos de stock de tienda de novias,** empezando por el hero (en `apertura.png` sale el cartel «YES TO THE DRESS»). Se sustituyen por la invitación real corriendo dentro del móvil, y por fotos de las bodas reales con permiso.
- **Las cifras contradictorias.** Hoy conviven 6, 12 y 36 diseños, y «Quince cosas resueltas», de las que se enseñan ocho. Una sola verdad en toda la web.
- **El discurso funcional del portfolio** («un enlace con RSVP, mapas, agenda»). Hay que reescribir la ficha de Invitoo en rodrigonegrete.es con el nuevo posicionamiento.

---

## 5. Catálogo de plantillas: de 12 parecidas a 6 distintas (+4)

**La regla nueva.** Una plantilla tiene que diferenciarse en **cinco cosas**, no solo en el orden de las secciones:

- tipografía,
- fondo,
- portada,
- apertura,
- ornamento.

El contrato pasa a ser `Plantilla = { tokens (display, texto, papel, radios, ornamento), portada propia, bloques con variantes, orden como dato }`. Y `revisar.mjs` deja de comparar los `<h2>`: pasa a comparar capturas.

### 5.1 Lanzamiento: 6 plantillas

| # | Plantilla | Absorbe | Para qué boda | Lo que la hace única |
|---|---|---|---|---|
| 1 | **Sobre** | — | Clásica, religiosa, invitados de todas las edades | Lacre que se rompe al tocarlo. El itinerario va primero |
| 2 | **Floración** | Jardín | Campo, primavera | Mejor metraje real. Ramas que se dibujan solas |
| 3 | **Mar** | Cielo + Marea | Playa, destino, bilingüe | Ascenso entre nubes hasta el mar. Alojamiento en segundo lugar |
| 4 | **Velo** | Lino + Bruma | Urbana elegante, etiqueta | Tejido que se levanta. Paleta neutra, sin hashtag ni álbum |
| 5 | **Constelación** | — | Noche, moderna | **Fondo oscuro de verdad** (hoy va sobre papel claro). Las estrellas forman las alianzas |
| 6 | **Tinta** | — | Minimalista | Seis secciones, nada más. Quitar es una posición |

Brasa y Terracota se fusionan en **Atardecer**, que se queda para la fase 2. Con 3 variantes de color por plantilla salen **18 opciones honestas**.

### 5.2 Fase 2: cuatro plantillas nuevas que llenan huecos reales

| Plantilla | Hueco | Paleta | Tipografía | Apertura |
|---|---|---|---|---|
| **Registro** (civil urbana) — **la primera de la fase** | El 80 % de las bodas son civiles | Blanco, grafito y un acento que elige la pareja (lima o naranja) | Inter Tight o Neue Montreal | Un sello de registro civil se estampa con la fecha. 2 s, sin vídeo: la más ligera |
| **Azulejo** (mediterránea) | Patio andaluz o valenciano, verano | Cal `#FBF8F2`, cobalto `#1F4E9C`, ocre, buganvilla | Cormorant + DM Sans | Una pieza de azulejo se tesela hasta formar una puerta que se abre. En SVG |
| **Revista** (editorial) | Parejas de moda y diseño | Papel `#F3EFE7`, negro, rojo editorial `#C8102E` | Playfair Black + Newsreader | Una revista se abre por la portada y los nombres forman la cabecera |
| **Fiesta** (latina / destino) | Bodas latinas en España, bilingües | Magenta o turquesa, sol `#F6B93B` | Fraunces + Work Sans | Cae papel picado y los nombres aparecen recortados. Va muy bien con la canción |

**Cómo se producen las aperturas.** Nombres y fechas siempre en HTML, nunca dentro del vídeo, para que un rodaje sirva para todas las bodas. Las de stock se sustituyen así:

- **Másters generados con IA:** imagen clave → image-to-video → bucle → upscale. Veo 3.1 Fast cuesta ~0,10–0,12 $/s, así que un máster de 8 s sale por unos 1–3 $. También Kling o Higgsfield, que ya está conectado.
- **Aperturas sin vídeo** (Registro, Azulejo) en SVG y CSS, a unos 40 KB.
- **El lacre del Sobre en Rive,** para que el gesto sea táctil.

---

## 6. Experiencia del invitado: el estándar de la «tía Mari»

El invitado medio tiene 50 años y un tercio pasa de 65. Abre desde WhatsApp, con el navegador interno, en 3G. **Si algo falla aquí, da igual lo bonita que sea la invitación.**

| Problema hoy | Arreglo | Dónde |
|---|---|---|
| El vídeo aparece *después* de que el invitado empieza a leer (`Apertura` devuelve `null` en el servidor) | El póster y el botón «Saltar» se pintan en el servidor. Un script inline decide si se muestran antes del primer pintado | `Apertura.tsx` |
| Dos barreras seguidas: 9 s de vídeo y luego la «Puerta» de la música | Quitar la Puerta. Un botón de sonido sobre el propio vídeo | `Puerta.tsx` |
| «Una sola vez» usa `sessionStorage`, y WhatsApp abre sesión nueva cada vez: quien vuelve a mirar la hora ve otra vez el vídeo | `localStorage` | `Apertura.tsx:50,72` |
| Sin música, o con reduced-motion, sale «Seguir con música» igualmente | Comprobar `musica` antes de mostrar la puerta | `Apertura.tsx:59` |
| Etiquetas del RSVP de 12,5 px con contraste 3,7:1, radios sin foco visible y `type=number` para los acompañantes | Etiquetas de 16 px o más, anillo de foco, un stepper −/+ y botón de 56 px | `Rsvp.tsx` |
| Un solo menú por grupo («Los Fernández, 3 personas») | **Menú y alergias por persona,** con casillas para los 14 alérgenos | `Rsvp.tsx` |
| El RSVP hace `insert` sin deduplicar: hay filas triplicadas y el invitado no puede corregir | `upsert` por invitado y enlace para editar la respuesta | `datos.ts:195` |
| El número de plazas `?a=` se puede editar sin control | El cupo vive en la tabla `invitados`; el enlace lleva un token | `i/[slug]/page.tsx:76` |
| Acentos usados como texto sin llegar a AA (Constelación 2,2:1, la firma a 2,8:1) | Un token `--acento-texto` calculado para AA en cada variante; el texto del botón se elige según la luminancia | `plantillas.ts`, `globals.css` |
| Los nombres de la portada salen con `opacity:0` hasta hidratar | El contenido es visible sin JS; la animación solo realza | `PortadaFoto.tsx` |
| Desbordamiento horizontal en móvil (franja de ~28 px) | Revisar la portada `centro` | — |

**Lo que se añade:**

- **El nombre de cada invitado** en el rótulo de la apertura («Querida Carmen…»), con un token por invitado. Es lo que hace Greenvelope.
- **Imagen de vista previa (OG) dinámica** con los nombres y la tipografía de la plantilla (`next/og`). Es lo primero que se ve en WhatsApp y cuesta un día de trabajo.
- **Añadir al calendario:** un `.ics` propio con `TZID=Europe/Madrid` y aviso previo.
- **Cómo llegar:** enlace a Google Maps, Apple Maps y Waze, con la dirección como texto copiable.
- **PWA offline** con el itinerario y el mapa, para el día de la boda.
- **QR de check-in por invitado** (fase 3).

---

## 7. Paneles: quitar horas a la pareja y al planner

**Panel de novios** (hoy: tabla cortada en móvil, filas duplicadas y «Sin contestar —»):

1. **Lista de invitados** con grupos y cupos, y un **generador de enlaces personales**.
2. **Enviar por WhatsApp** a cada invitado y **recordatorio** a quien no ha respondido. Es lo que más horas ahorra.
3. **Exportar a Excel** con el formato del catering (menús y alergias por persona) y del transportista (recuento por parada de autobús).
4. Moderación del muro y «ver como invitado».
5. Tarjetas en móvil en lugar de tabla.

**Estudio** (hoy se editan los bloques como JSON crudo):

- un formulario por bloque, con vista previa al lado y orden con flechas;
- generación asistida de «Nuestra historia» a partir de un formulario guiado: tres tonos (poético, divertido, sobrio), editables, por céntimos por boda;
- **objetivo: montar una boda en ≤ 3 h.**

**Panel de planner** (fase 3): varias bodas en un mismo panel, las mismas exportaciones y marca blanca o sello discreto.

---

## 8. Negocio

### 8.1 Precios

Se confirma la dirección del [02 §5.1](02-estrategia.md): **149 / 249 / desde 449 €**. Hay que decidir si llevan **IVA incluido** (149 € con IVA son 123 € netos). La recomendación es que sí, porque el cliente final no piensa sin IVA.

Cambios respecto a hoy:

- **El RSVP entra en todos los planes.** Hoy empieza en 129 €, y Nupcio lo da por 29 €.
- Cada plan dice lo que **no** incluye, y lleva una garantía: cambios ilimitados hasta publicar y plazo de entrega.
- El de 149 € tiene que enseñar la apertura en el primer pantallazo, porque compite de cara con los de 80 €.
- WedInvita (290–760 €) demuestra que el plan Estudio puede subir.

### 8.2 Escalera de producto

| Producto | Precio (IVA incl.) | Cuándo |
|---|---|---|
| **Save the date en vídeo vertical** (Reels, estados de WhatsApp) | 69 €, o 39 € si luego compran la invitación | 12–6 meses antes. **Producto gancho** |
| Invitoo / Canción / Estudio | 149 / 249 / desde 449 € | ~3 meses antes |
| Papel híbrido: tarjeta con lacre y QR que abre la apertura | +2,5 €/ud, mínimo 30 [hipótesis] | 3 meses antes. Para mayores y para el 84 % que quiere papel |
| Idioma extra / urgencia en 48 h | 39 € / 49 € | — |
| Apertura en MP4 para proyectar el día de la boda | 49 € | Día B |
| Libro de la Boda (muro + fotos + canción) | 79 € digital / 149 € impreso [hipótesis] | 3–12 meses después |
| Bautizos, comuniones y cumpleaños | 79–129 € | Todo el año; las comuniones, en mayo |
| Eventos corporativos | 300–900 € | Noviembre–diciembre y primavera |

### 8.3 Unidad económica (hipótesis)

**Supuestos:**

- Mezcla de ventas: 50 % del plan de 149 €, 35 % del de 249 € y 15 % del de 449 €, más ~40 € de añadidos.
- **Ticket medio:** ~269 € con IVA, unos 222 € netos.
- **Costes variables:** Dedícalo [NV], Stripe, infraestructura y comisiones de canal, unos 50 € por boda.
- **Margen:** ~173 € por boda.
- **Tiempo:** ~5 h por boda, que con plantillas buenas debe bajar a 3.

| Objetivo | Bodas/mes | Bodas/año | % del mercado |
|---|---|---|---|
| 3.000 €/mes de margen | ~17 | ~208 | 0,12 % |
| 6.000 €/mes de margen | ~35 | ~416 | 0,24 % |

**Lectura honesta:** 6.000 €/mes con una sola persona solo sale si se cumplen tres condiciones a la vez:

- (a) el tiempo baja a ≤ 3 h por boda;
- (b) el canal B2B trae volumen;
- (c) bautizos, comuniones y eventos corporativos cubren el invierno.

Sin el estudio por formularios del §7, no es alcanzable.

### 8.4 Canal B2B: planners, fincas y hoteles

**Al planner no le importa la estética, le importan los datos.** Lo que pide es:

- datos limpios y exportables a tiempo;
- que la invitación no le haga sombra;
- margen;
- respuesta rápida.

| Socio | Oferta |
|---|---|
| **Wedding planner** | 15–20 % de comisión por referido, **o** precio mayorista (99 € / 179 €) a partir de 10 bodas al año. Marca blanca desde 20 bodas al año, con un fijo de 300 €/año |
| **Finca** | Plantilla con la marca de la finca y la logística ya montada (mapa, parking, autobuses, horarios). La finca la incluye en su paquete; Invitoo cobra 89–119 € por boda o un pack anual |
| **Hotel** (destino) | Bloque de habitaciones con código y fecha límite, más invitación multi-idioma. Pack de temporada |

Para tener una referencia: un planner cobra entre 1.500 y 3.500 €, o el 10–15 % del presupuesto. Las comisiones a proveedores no se publican [NV].

---

## 9. Hoja de ruta

### F0 — Esta semana: lo que no puede esperar

- [ ] **Seguridad.** `guardarDesdeEstudio` (`app/acciones.ts:80`) no comprueba la sesión. El proxy solo protege las rutas `/estudio/*`, y una server action se puede invocar por POST desde cualquier ruta. Con service role, **cualquiera puede reescribir o despublicar una boda.** El arreglo: moverla a `app/estudio/acciones.ts` y validar la cookie dentro. *Comprobado en el código.*
- [ ] **Zona horaria.** El editor muestra la hora en UTC (`Editor.tsx:37`) y guarda la hora local como UTC (`acciones.ts:119`). Además, `horaDelDia` (`comun.tsx:54`) y el `.ics` se calculan en el servidor, que está en UTC. Resultado: horas desplazadas 1–2 h. Hay que fijar `Europe/Madrid` en la boda y en todo `Intl`.
- [ ] Que `guardarRsvp` y `guardarMensaje` **fallen de forma visible** si no hay base de datos en producción (`datos.ts:188`). Hoy dicen «confirmado» y pierden la respuesta.
- [ ] En invitoo.es (WordPress), mientras tanto: quitar el shortcode `[forminator_form id="615"]`, el «© 2025», el aviso en USD, el texto pegado («únicaespecialmágica…»), «Jki-mail-line» y las tildes («Contáctanos», «Quiénes somos»). Corregir también «Inglesia».

### F1 — Noviembre: la experiencia del invitado, impecable

- [ ] Todo el §6: apertura renderizada en el servidor, sin la Puerta, `localStorage`, RSVP accesible y por persona, `upsert` y contraste AA.
- [ ] Hacer `/i/[slug]` **estática de verdad.** Hoy, `await searchParams` la vuelve dinámica, así que cada visita genera SSR y una consulta a Supabase. La personalización (`?n=`, `?c=`) debe hacerse en el cliente.
- [ ] `next/image` para las fotos de la pareja, y fuente AV1/WebM en el vídeo.
- [ ] Quitar `gsap`, `motion` y `ogl` de las dependencias mientras no se usen. *Comprobado: no se importan en ningún sitio.*
- [ ] OG dinámica, `.ics` propio y nombre del invitado en el rótulo.
- [ ] Ficha en Bodas.net y Zankyou, con reseñas de las 5 bodas reales.

### F2 — Diciembre y enero: catálogo, web nueva y lanzamiento

- [ ] **Las 6 plantillas del §5.1,** cada una con sus tokens propios (tipografía, fondo, portada) y su máster definitivo.
- [ ] **Web comercial nueva:**
  - un titular de valor visible sin JS;
  - CTA principal **«Abrir una invitación de ejemplo»** a pantalla completa en el móvil, con la videollamada como secundaria;
  - 3 planes;
  - prueba social real («118 de 120 confirmaron sin llamar», frases del muro con permiso);
  - la canción en el hero.
- [ ] Panel de novios: lista de invitados, enlaces personales, WhatsApp, recordatorios y Excel.
- [ ] Estudio por formularios, con vista previa.
- [ ] **Save the date en vídeo** como producto gancho para la temporada de pedidas de diciembre [NV].
- [ ] Test de precios: 149/249 frente a 89/169 durante 6–8 semanas.
- [ ] Migrar las bodas vivas y mantener WordPress en `old.invitoo.es` hasta que pasen.

### F3 — Febrero a abril: escalar antes de la temporada

- [ ] **Registro** (civil urbana) y **Azulejo.** Después, Revista y Fiesta.
- [ ] Panel de planner y oferta B2B. **Pilotos con 3 planners y 2 fincas** de Barcelona y la costa.
- [ ] Papel híbrido con QR, y Libro de la Boda.
- [ ] Páginas SEO por ciudad e idioma: Barcelona, Madrid, Málaga y «wedding invitation Spain».
- [ ] QR de check-in y PWA offline para el día de la boda.
- [ ] Comuniones (mayo) como primer producto que no es una boda.

### Plan de adquisición en paralelo

- **Referidos de invitados:**
  - la firma «Diseñado por Invitoo» lleva a la landing de invitados, que ya está hecha y es lo mejor del prototipo;
  - quien confirma recibe un código de 20 € para su boda;
  - la pareja gana 20 € por cada boda que llegue desde su invitación;
  - **objetivo: ≥ 1 lead por invitación enviada.**
- **Instagram y TikTok:** tres piezas por semana:
  - la apertura en vertical, con la canción como gancho de audio;
  - un antes y después;
  - la reacción de un invitado.
- **Publicidad pagada:** 300 €/mes.
  - 200 € en Meta: la apertura vertical, dirigida a parejas recién prometidas en un radio de 50 km.
  - 100 € en Google: búsquedas de cola larga.
- **Una feria de novios** en el primer trimestre, con una pantalla y una demo con QR [fechas NV].

---

## 10. Técnica y código abierto que se aprovecha

| Recurso | Licencia | Para qué |
|---|---|---|
| [sakeenah-wedding/template](https://github.com/sakeenah-wedding/template) | Apache-2.0 | La referencia más parecida a Invitoo: multi-tenant, enlaces por invitado, RSVP y deseos en tiempo real. Sirve para el modelo de datos de `invitados` |
| [dewanakl/undangan](https://github.com/dewanakl/undangan) + [undangan-api](https://github.com/dewanakl/undangan-api) | MIT | El patrón `?to=Nombre`, y un muro de mensajes con likes y respuestas |
| [heejin-hwang/mobile-wedding-invitation](https://github.com/heejin-hwang/mobile-wedding-invitation) | MIT | El patrón coreano: todo en un `data.json`, galería con PhotoSwipe y copiar el IBAN al portapapeles |
| [idindrakusuma/thekusuma](https://github.com/idindrakusuma/thekusuma) | MIT (archivado) | QR por invitado y «ticket» de check-in |
| [magicui](https://github.com/magicuidesign/magicui) | MIT | Microinteracciones del RSVP y confeti |
| [react-bits](https://github.com/DavidHDev/react-bits) | MIT + Commons Clause | Fondos y efectos de texto. Se pueden usar, pero no revender |
| [lenis](https://github.com/darkroomengineering/lenis) | MIT | Scroll suave sincronizado con ScrollTrigger |
| [rampatra/wedding-website](https://github.com/rampatra/wedding-website) | **GPL-3.0** | Solo como inspiración |
| add-to-calendar-button | **Elastic 2.0** | No usar: mejor un `.ics` propio |

**Decisiones técnicas:**

- **GSAP** ya es gratis con todos sus plugins (ScrollTrigger, SplitText, MorphSVG) y permite uso comercial. Ojo: prohíbe usarlo en herramientas visuales que compitan con Webflow. Elegir entre presets debería estar bien, pero si algún día el editor deja animar libremente, hay que consultarlo.
- **Rive** (`canvas-lite`, ~785 KB de WASM) para lo interactivo, como el lacre. **dotLottie** cargado de forma diferida para la decoración.
- **View Transitions** para pasar del sobre a la invitación y en el álbum. **Scroll-driven CSS** para los parallax, sin `setState` en cada fotograma: hoy pasa en `PortadaFoto.tsx`.
- **El MP4 compartible con los nombres** se hace con **ffmpeg (`drawtext`)** en un worker. Remotion es gratis hasta 3 personas, pero no se puede renderizar en Vercel serverless.
- **IA para música:** Suno da licencia comercial pero conserva la autoría. La canción sigue siendo de Dedícalo.
- **Sora 2** cerró su API en septiembre de 2026: no hay que contar con ella.

---

## 11. KPIs

| Métrica | Objetivo |
|---|---|
| **Horas por boda montada** | ≤ 3 h |
| **Leads por invitación enviada** | ≥ 1 |
| Tiempo de apertura en 4G | < 1 s |
| RSVP completado sin ayuda (sin llamar a los novios) | ≥ 90 % |
| Paso de videollamada (o de la demo) a compra | ≥ 40 % |
| Peso del plan Canción en las ventas | ≥ 35 % |
| Ventas con algún añadido | ≥ 30 % |
| Coste de adquisición en el canal de pago | < 40 € |
| Reseñas por boda entregada | ≥ 0,7 |
| Bodas por socio B2B y bodas fuera de temporada | seguimiento mensual |

---

## 12. Decisiones pendientes de Rodrigo

1. **Precios:** ¿149/249/449 con IVA incluido? ¿Test A/B contra los actuales o cambio directo?
2. **Catálogo:** ¿se aprueba la reducción a 6 plantillas (§5.1) y la fusión de las otras seis?
3. **Másters de apertura:** ¿rodarlos, generarlos con IA, o un modelo mixto? ¿En qué orden?
4. **Dedícalo:** el coste real por canción y las condiciones del acuerdo. Es la pieza más defendible, así que conviene blindarla por contrato.
5. **B2B:** ¿marca blanca sí o no? ¿Comisión o precio mayorista?

---

## Fuentes

**Mercado:**

- [INE — Movimiento Natural de la Población 2024](https://www.ine.es/dyngs/Prensa/es/MNP2024.htm)
- [Bodas.net — Cuánto cuesta casarse](https://www.bodas.net/articulos/cuanto-cuesta-casarse--c841)
- [Bodas.net — Informe del sector nupcial 2026](https://bodas.net/articulos/sobrevivir-organizacion-boda-informe-sector-nupcial--c9224)
- [Euronews — El precio del «sí, quiero» en 2026](https://es.euronews.com/cultura/2026/06/27/el-precio-del-si-quiero-en-espana-las-bodas-cuestan-10000-euros-mas-en-2026)
- [El Debate — El negocio nupcial supera los 4.000 M€](https://www.eldebate.com/economia/20250517/negocio-nupcial-dispara-pese-inflacion-supera-4000-millones-ano-espana_297942.html)
- [El Independiente — Estacionalidad](https://www.elindependiente.com/tendencias/2025/09/02/infinitas-caras-y-en-septiembre-llega-el-mes-de-las-bodas/amp/)
- [Menorca.info — Datos INE 2022 (civiles, cónyuge extranjero)](https://www.menorca.info/actualidad/sociedad/2023/11/22/2055315/matrimonios-espana-aumentan-2022.html)
- [Marie Claire — Gasto en invitaciones](https://www.marie-claire.es/bodas/35360.html)
- [Trustlocal — Coste de un wedding planner 2026](https://trustlocal.es/coste/wedding-planner-coste/)

**Competencia en España:**

- [Nupcio](https://nupcio.com)
- [Invitatis](https://invitatis.com/es/)
- [Invitaciones Mi Boda](https://invitacionesmiboda.es/)
- [Felizia en Bodas.net](https://www.bodas.net/invitaciones-de-boda/felizia--e73809)
- [Iberdigital](https://www.bodas.net/invitaciones-de-boda/iberdigital--e303805)
- [Eres el Invitado](https://www.bodas.net/invitaciones-de-boda/eres-el-invitado-invitaciones-digitales--e298011)
- [WedInvita](https://www.bodas.net/invitaciones-de-boda/wedinvita--e200740)
- [Tu Sobre Digital](https://www.bodas.net/invitaciones-de-boda/tu-sobre-digital-by-simscrum--e296345)
- [Videoinvitaciones de boda](https://www.bodas.net/invitaciones-de-boda/videoinvitaciones-de-boda--e82987)
- [Canva — Precios](https://www.canva.com/es_es/pricing/)
- [Etsy — Envelope Reveal Invitation](https://www.etsy.com/listing/1012563789)

**Referentes internacionales:**

- [Paperless Post — Precios](https://www.paperlesspost.com/pricing)
- [Modern Retail — Paperless Post](https://www.modernretail.co/operations/inside-paperless-posts-plan-to-capture-more-party-dollars/)
- [Greenvelope — Precios](https://www.greenvelope.com/knowledge/product/pricing.md)
- [Riley & Grey — Precios](https://www.rileygrey.com/pricing)
- [Minted — Wedding websites](https://www.minted.com/wedding-websites)
- [General Catalyst — Joy](https://www.generalcatalyst.com/perspectives/our-investment-in-joy-creating-a-modern-platform-to-infuse-more-joy-into-celebrating-every-milestone)
- [Wikipedia — Zola](https://en.wikipedia.org/wiki/Zola_(company))
- [Casa Convite](https://casaconvite.com/)
- [Comparativa de invitaciones digitales en México](https://miboda.love/blog-nuevo/comparativa-invitaciones-digitales-mexico/)
- [Floralunar](https://floralunar.com/invitaciones-de-boda-animadas/)
- [Wedew](https://wedew.co/)
- [WedMeGood — Video templates](https://www.wedmegood.com/wedding-invitations/video-templates)

**Tendencias:**

- [The Star — Los QR llegan a las bodas](https://www.thestar.com.my/tech/tech-news/2026/08/02/qr-codes-make-their-way-down-wedding-aisles)
- [Paperlust — Wedding trends 2026](https://paperlust.co/blog/wedding-trends-2026/)
- [The Knot 2025 Global Wedding Report](https://www.businesswire.com/news/home/20250814633785/en/The-Knot-Worldwides-2025-Global-Wedding-Report-Reveals-Bold-New-Era-of-Personalization-and-Purpose)

**Técnica:**

- [GSAP — Precios](https://gsap.com/pricing/)
- [GSAP — Licencia estándar](https://gsap.com/community/standard-license/)
- [Remotion — Licencia](https://www.remotion.pro/license)
- [Rive — Canvas vs WebGL](https://rive.app/docs/runtimes/web/canvas-vs-webgl)
- [Callstack — Lottie vs Rive](https://callstack.com/blog/lottie-vs-rive-optimizing-mobile-app-animation)
- [caniuse — Cross-document View Transitions](https://caniuse.com/cross-document-view-transitions)
- [caniuse — animation-timeline](https://caniuse.com/mdn-css_properties_animation-timeline_scroll)
- [invideo — Precios de modelos de vídeo con IA](https://invideo.io/blog/ai-video-model-pricing)
- [LicenseOrg — Licencias de música con IA](https://licenseorg.com/blog/ai-music-licensing-suno-elevenlabs)
