# 12 · Competencia en España y lo que exige una boda española

> G1, 24-10-2026. Capturas Playwright 390×844 y 1440×900 en `qa/competencia/<marca>/` (home, precios, demo: carga → apertura → abierta → página completa → RSVP; métricas móviles en `*-metricas.json`; texto en `.txt`). Ningún RSVP enviado.
>
> **Límites:**
> - **Bodas.net** (y **Zankyou**, que ahora redirige a bodas.net) devuelve *Access Denied* (Akamai) al navegador automatizado. No se forzó. Sus datos salen de su página pública por WebFetch y llevan la marca **[NV]**.
> - **Iberdigital** y **Eres el Invitado** no tienen web operativa con demo. `iberdigital.es` es otra empresa de soporte informático, y `eresinvitado.com` es una portada vacía de 2015. Solo existen como escaparate en Bodas.net.
> - **WedInvita** publica sus precios en imagen.

## 1. Fichas por competidor

### 1.1 Resumen

| Marca | Precio verificado | Plantillas / estilos | Color | Apertura | RSVP pregunta | Día B | Captura |
|---|---|---|---|---|---|---|---|
| [Nupcio](https://www.nupcio.com/) | **29 €** pago único, 12 meses | 9 estilos | Editor propio; cambios «al instante» (sección on/off y orden) | Ninguna: hero foto | Nombre, apellidos, email, teléfono, sí/no; menú con alérgenos por plato | Galería 1.000 fotos, buscador de mesa, QR | `nupcio/demo-ana-pedro-movil-*` |
| [Invitatis](https://invitatis.com/es/landing/precio-invitacion-boda/) | **75 €** al publicar; diseñar es gratis | 4 temas («no cien plantillas clónicas») | Tema fijo; cambio de tema en cualquier momento | Ninguna; **pantalla blanca ~8 s** al cargar | Botón «Confirmar asistencia» a formulario aparte | Vídeo, playlist | `invitatis/demo-lento-movil-8s.png` |
| [Invitaciones Mi Boda](https://invitacionesmiboda.es/) | **100 €** (tachado 200), a medida desde 300 €, Klarna | 9 modelos (oliva, colibrí, mariposa, perro…) | Solo en el plan a medida | **Sobre con lacre** «Toca el sello» y destello de luz | Nombre, apellidos, tel., email, sí/no, alergias, **bus de ida y de vuelta con hora**, canción, RGPD | QR para subir fotos, Bizum + IBAN con copiar | `invitaciones-mi-boda/demo-olive-movil-*` |
| [Felizia](https://felizia.es/content/24-invitaciones-de-boda-digitales-interactivas) | **118,58 €** por diseño | 11–22 por categoría (florales, temáticas, exclusivos) | «Modelo Color Spring»: variantes de catálogo; **prueba gratis con vuestros nombres** | Sobre azul con lacre de olivo | Botón a formulario externo | Autobuses (ida y 2 vueltas), seating descargable, álbum Google | `felizia/demo-azulejo-movil-*`, `felizia/demo-prueba-movil-1-apertura.png` |
| [Tu Sobre Digital](https://tusobredigital.es/) | **79 / 109 / 249 €**, entrega 48–72 h | 11 plantillas | Solo a medida | Foto desenfocada que se enfoca + «Descubrir» | Solo sí/no, **«Confirmar antes del 1 de septiembre»** | IBAN con copiar | `tu-sobre-digital/demo-entre-olivos-movil-*` |
| [WedInvita](https://www.wedinvita.com/) | Packs en imagen; extras **25/35 € + IVA** por opción | A medida (9 trabajos en galería) | A medida | Sin demo pública | — | Libro de firmas | `wedinvita/disenos-movil-1.png` |
| [Fotelya](https://fotelya.com/es/tarifs) | **0 / 49 / 89 €** por evento; 39 €/mes para profesionales | Álbum, no invitación | — | — | — | Muro de fotos por QR, sin app, datos en la UE, moderación | `fotelya/demo-album-movil-3-abierta.png` |
| Iberdigital | **Desde 149 €**, 10–20 días (ficha de Bodas.net) [NV] | A medida | A medida | «Animaciones y música» [NV] | Confirmación por WhatsApp [NV] | — | Sin web propia |
| Eres el Invitado | **99–199 €** (Bodas.net) [NV] | Catálogo + a medida | — | — | Preguntas personalizadas [NV] | Playlist, dress code | `eres-el-invitado/home-movil-1.png` |
| Web de Bodas.net / Zankyou | **Gratis** [NV] | «Decenas» [NV] | Colores y tipografía elegibles [NV] | Ninguna | Sincroniza con la lista de invitados [NV] | Encuestas y tests | `bodasnet/home-movil-1.png` (bloqueo) |
| **[Serenela](https://serenela.com/es)** (nueva) | **49 / 79 / 149 €** + 19 €/año; a medida desde 250 € | 37 de boda; **60 paletas, 12 tipografías, 11 papeles, 129 secciones** | **Vista previa en vivo** en la home | Foto de fondo, sin gesto | Sí/no por familia («Invitación para Familia García»), «Confirmamos antes del 15 de septiembre» | Canción votada por invitados, recuerdos, IBAN | `serenela/demo-clasico-movil-*` |
| **[BodasFácil](https://bodasfacil.com/)** (nueva) | **15 / 30 €** («oferta 24 h») | 9 demos (elegant, rustic, coastal…) | Por plantilla | Ninguna | **WhatsApp o formulario**: nombre, sí/no, acompañantes, alergias, menú, mensaje | Mesas, playlist votada, libro de firmas **con audio**, muro de fotos, FAQ («¿Se admiten niños?») | `bodasfacil/demo-elegant-movil-*` |
| **[Invitaciones Digitales](https://invitacionesdigitales.es/)** (nueva, Murcia) | **89–189 €** (Alyssa Premium 149 €, antes 209 €) | Catálogo WooCommerce de 7 páginas | Por modelo | Animación de sobre (vídeo) | — | — | `invitaciones-digitales/producto-movil-1.png` |
| **[Joy](https://withjoy.com/wedding-website/?l=es-ES)** (internacional, en español) | **Gratis** | Cientos | Sí, en el editor | Ninguna | Smart RSVP | Viaje, regalos en efectivo sin comisión | `joy/disenos-movil-1.png` |

### 1.2 Comportamiento en móvil (390 px), medido

| Marca | Texto < 14 px | Táctiles < 32 px | Problemas vistos en la captura |
|---|---|---|---|
| Nupcio | **53/115 (46 %)** | 7 | CTA flotante «¿Te imaginas la tuya?» tapa la fecha y el RSVP; botón gris que parece desactivado; etiquetas de ~11 px |
| Invitaciones Mi Boda | 23/103 | 2 | El botón de música **tapa el campo «Sugiere una canción»** |
| Tu Sobre Digital | 46/91 | 12 | Cabecera de marca sobre la demo; 10–11 px gris sobre crema (< AA); el revelado deja bloques negros vacíos |
| Serenela | 38/75 | 5 | La píldora «Personalizar» **tapa «Descubrir todo»** en la portada. Fotos IA de la misma pareja en todo |
| BodasFácil | 34/142 | 26 | Cookies sobre el RSVP; captura a 432 px (posible desborde); iconos de 10 px |
| Felizia | 0/87 | 1 | Scroll interno; WhatsApp e idioma flotantes; itinerario con horas repetidas |
| Invitatis | 0/26 | 5 | **~8 s en blanco** antes de pintar. Scroll interno |
| Joy | 10/252 | 35 | **Desborde horizontal** (scrollWidth 439) |

### 1.3 Lo mejor y lo peor

| Marca | Lo mejor | Lo peor |
|---|---|---|
| Nupcio | 29 €, panel completo, alérgenos por plato | Cero emoción; CTA de venta encima de la invitación |
| Invitaciones Mi Boda | Lacre, acuarela del lugar, bus ida/vuelta, FAQ, Bizum, WhatsApp 24–72 h | Textos de relleno, estructura única, solape de la música |
| Felizia | Prueba gratis con vuestros nombres; azulejo y limones; papel + digital | RSVP en otra web; itinerario con errores |
| Tu Sobre Digital | Lo más editorial; fecha límite visible | Legibilidad; RSVP solo sí/no |
| Serenela | Configurador con vista previa; RSVP por familia | 19 €/año; stock IA |
| BodasFácil | Libro de firmas con audio, FAQ, WhatsApp | Urgencia falsa, 15 € que abarata la categoría, solapes |
| Invitatis | Honestidad («4 temas»), prueba social en cifra | 8 s en blanco |

## 2. Matriz de funciones frente a Invitoo

Lo de Invitoo sale de `app/src` y de `data/sitio.ts`. ● = sí · ◐ = parcial · — = no.

| Función | Invitoo | Nupcio | Invitatis | IMB | Felizia | TSD | Serenela | BodasFácil |
|---|---|---|---|---|---|---|---|---|
| Apertura con gesto | ● (sobre, lacre, matasellos, 9 aperturas) | — | — | ● | ● | ◐ | — | — |
| Nombre del invitado / enlace personal | ● (token) | — | — | — | — | — | ● (familia) | ◐ |
| RSVP por persona con menú y 14 alérgenos | ● | ◐ | — | ◐ | — | — | ◐ | ◐ |
| Bus con parada | ● | — | — | ● (ida/vuelta) | info | — | — | — |
| Fecha límite de RSVP | **—** | — | — | — | — | ● | ● | — |
| Niños (cupo / menú infantil) | ◐ (menú) | — | — | FAQ | aviso | — | — | FAQ |
| FAQ propio | ◐ (`notas`) | — | — | ● | — | — | — | ● |
| IBAN detrás de «Ver datos» + Bizum + Copiar | ● | ◐ | — | ● | ● | ◐ | ◐ | ● |
| Multi-idioma | ◐ (+39 €) | ● | ● (9) | ● | ● | — | — | — |
| Cambio de color en vivo | ● (`components/color`, G3) | ◐ | — | — | — | — | ● | — |
| Canción original | ● | — | — | — | — | — | — | — |
| Álbum / fotos de invitados | ● | ● | — | ● | ◐ | — | ● | ● |
| Pantalla en directo (TV) | ● | — | — | — | — | — | — | ◐ |
| Libro de deseos en PDF | ● | — | — | — | — | — | ◐ | ● (audio) |
| Mesas | — (decisión) | ● | — | — | ● (PDF) | — | — | ● |
| Prueba gratis con vuestros nombres | **—** | ● | ● | ● (WhatsApp) | ● | — | ● | ● |
| Precio de entrada | 149 € | 29 € | 75 € | 100 € | 119 € | 79 € | 49 € | 15 € |

**Hallazgo en `data/demo.ts`:** todas las ceremonias usan `icono: "iglesia"`, incluso el Registro Civil, el Ajuntament y la azotea: error de protocolo. Faltan los iconos `juzgado`, `ayuntamiento` y `simbolica`.

## 3. Lo que exige una boda española y falta en Invitoo

Revisado contra `lib/tipos.ts` (bloques: portada, cuentaAtras, historia, capitulos, itinerario, rsvp, album, muro, playlist, regalos, dressCode, alojamiento, galeria, notas, hashtag) y las 9 demos.

**P0 = antes de vender · P1 = esta temporada · P2 = después**

- [ ] **P0 · Protocolo de textos («quién invita»):** nuevo bloque `anuncio`.
  - *Clásico:* «D. Antonio Ruiz Medina y D.ª Carmen Soler Vidal, D. Luis Prieto Gil y D.ª Elena Martín Sanz tienen el placer de invitarle al enlace de sus hijos **Inés y Gonzalo**, que se celebrará el sábado 18 de septiembre de 2027, a las cinco y media de la tarde, en la iglesia de Nuestra Señora del Rosario (La Granja). Padrinos: D.ª Carmen Soler y D. Luis Prieto.»
  - *Moderno:* «Con la alegría de nuestras familias, **Inés y Gonzalo** nos casamos. Y no sería lo mismo sin ti.»
- [ ] **P0 · Tipo de ceremonia: religiosa, civil o simbólica:** `ceremonia.tipo` cambia icono, verbo y nota.
  - *Civil:* «Nos casamos en el Ayuntamiento a las 12:00. La ceremonia dura 20 minutos: llegad 15 antes, que el salón tiene aforo y no se puede entrar una vez empezada.»
  - *Simbólica:* «La ceremonia será en el jardín y la oficiará nuestra amiga Lucía. El papeleo ya lo firmamos; aquí venimos a celebrarlo.»
  - *Religiosa:* «Misa en la parroquia a las 17:30. Os pedimos puntualidad: la novia, por esta vez, también.»
- [ ] **P0 · Fecha límite de confirmación:** `rsvp.limite` en bloque, apertura y recordatorio. «Necesitamos saberlo **antes del 1 de agosto**: el catering nos pide el número cerrado. Si cambian tus planes, puedes corregir tu respuesta con este mismo enlace.»
- [ ] **P0 · Acompañantes:** el cupo ya va en el token; falta decirlo con tacto: «Hemos reservado **2 plazas** a vuestro nombre. Si necesitáis hablarlo, escribidnos.»
- [ ] **P0 · Niños:** `ninos: si | no | solo-familia`, menú infantil y edades.
  - *Sí:* «Los peques son bienvenidos: habrá menú infantil y monitores durante la cena. Dinos sus nombres y edades.»
  - *No:* «Queremos que esta noche sea solo para adultos y que la disfrutéis sin prisa. Os entendemos si no podéis venir.»
- [ ] **P0 · Lista de bodas e IBAN, sin incomodar:** ya hay «Ver datos», Copiar y Bizum; falta el tono por defecto: «Vuestra presencia es lo mejor que nos podéis regalar. Si además queréis tener un detalle, aquí lo tenéis» → [Ver datos]. Nunca el IBAN a la vista.
- [ ] **P0 · Alergias:** ya por persona y con 14 alérgenos; falta el consentimiento: «Solo lo verá el catering para preparar tu plato.»
- [ ] **P1 · Cóctel, banquete, fiesta y recena**: tipos de parada con icono. «19:00 Cóctel en los jardines · 21:00 Banquete · 23:30 Baile y barra libre · 03:00 Recena (sí, hay recena).»
- [ ] **P1 · Autobuses:** faltan horas de ida, varias vueltas y lista de paradas (IMB y Felizia lo tienen). «Salida a las 16:45 desde Plaza de España. Vueltas a la 01:00 y a las 04:00. Marca en el RSVP cuál cogerás.»
- [ ] **P1 · Alojamiento** con código de bloqueo y fecha: «Hotel X nos guarda habitaciones con el código BODAIG hasta el 15 de julio.»
- [ ] **P1 · Dress code** con «Sí / Mejor evitar» y avisos de terreno. «Etiqueta de tarde. El cóctel es sobre césped: tacón ancho. Blanco y marfil, solo para la novia.»
- [ ] **P1 · Preguntas frecuentes** en acordeón, con 6 por defecto: ¿Hay parking? ¿Pueden venir niños? ¿Hay bus de vuelta? ¿Puedo llevar acompañante? ¿Tengo una alergia, qué hago? ¿A quién llamo el día de la boda?
- [ ] **P1 · Invitados extranjeros:** idioma en la portada, «hora de España», llegada desde el aeropuerto, BIC/SWIFT. «Welcome! Flights: BCN is 40 min away. We'll have a shuttle from the airport hotel at 4 pm.»
- [ ] **P1 · Personas mayores:** letra grande, teléfono a un toque y accesibilidad: «La finca no tiene escalones. Si alguien necesita que le recojamos, llamad a Marta: 600 000 000.»
- [ ] **P2 · Preboda:** evento opcional con su RSVP: «El viernes 17, a partir de las 20:00, cerveza y tapas en la Taberna del Puerto para quien llegue antes. Sin protocolo.»
- [ ] **P2 · Después de la boda:** al día siguiente, gracias + álbum + Libro de deseos. «Gracias por hacer de ese día el mejor de nuestras vidas. Aquí están vuestras fotos; subid las que falten hasta el 30 de octubre.»

## 4. Estilos que se venden en España en 2026

Lo vendido se ha leído en la competencia (IMB, Felizia, TSD, Serenela) y en lo que piden las parejas.

| Estilo | Lo cubre Invitoo | Paleta (papel / tinta / acento / apoyo) | Tipografía | Apertura | Momento wow |
|---|---|---|---|---|---|
| Finca y olivo (el más vendido) | Floración (olivo), Carta | `#F4F1E6` `#24301F` `#5E6F45` `#B08D57` | Cormorant Garamond + Figtree | Rama que se dibuja | Hojas de olivo que caen al confirmar |
| Mediterráneo de azulejo y limón | Azulejo | `#FBF8F2` `#1A2236` `#1F4E9C` `#E9C46A` | Cormorant + DM Sans | La puerta de azulejo | Un limón rueda hasta el RSVP |
| Acuarela del lugar (castillo, cortijo) | **Falta** | `#F7F1EA` `#3A2E2A` `#B5838D` `#9CAF88` | Playfair Display + EB Garamond | Lámina que se colorea | La acuarela del lugar se pinta con el scroll |
| Clásica con lacre (iglesia) | Sobre, Carta | `#F6F1E9` `#241A16` `#8C1D2C` `#C9A55C` | Bodoni Moda + EB Garamond | Lacre que se parte | El nombre del invitado escrito en el sobre |
| Romántica floral (peonía, rosa) | **Falta** (ya existe el `Florecer` de F1) | `#FBF4F2` `#3B2A2E` `#C27C8E` `#7D8F6A` | Cormorant Italic + Jost | Peonía que se abre | Pétalos al tocar los nombres |
| Etiqueta urbana y palacio | Velo | `#EEEAE3` `#1E1C1A` `#76664F` `#C2B8A3` | Cinzel + Manrope | Velo | Reflejo dorado sobre los nombres |
| Civil moderna | Registro | `#FFFFFF` `#1F2124` `#2F4BFF` `#F2F2F0` | Inter Tight | Sello del registro | Fecha y hora estampadas |
| Boho y atardecer (pampa, terracota) | ◐ Floración-brasa | `#F8EDE1` `#3A2418` `#A6532F` `#D9B89C` | Fraunces + Figtree | Sol que baja | El fondo vira de mañana a atardecer |
| Playa | Mar | `#EDF3F4` `#14283A` `#2F6A8A` `#E8D9BD` | Italiana + Jost | Nubes y mar | El horizonte se parte en dos |
| Noche y estrellas | Constelación | `#0E1428` `#ECE7DA` `#C9A55C` `#3B4A6B` | Marcellus + Outfit | Constelación | El cielo de su fecha |

- **Falta:** *Acuarela del lugar*, el gran gancho de IMB y Felizia, y *Romántica floral*, que es lo que Rodrigo pide («animaciones de flores»).
- **Sobra o hay que repensar:** *Tinta*. El minimalismo en blanco y negro casi no se vende en España; mejor convertirla en una variante de Velo o de Registro. *Mar* debe quedarse como «De destino».

## 5. Cambio de colores en vivo

**Competencia:** Serenela es la única que lo vende en vivo, en la home (60 paletas × 12 tipografías; riesgo de combinaciones feas). Nupcio, Joy y Bodas.net lo meten en el editor tras registrarse. IMB, TSD, WedInvita e Iberdigital: «colores a medida» por WhatsApp (lento, pero se siente servicio). Felizia: variantes fijas por modelo y prueba con vuestros nombres.

**UX propuesta** (G3, `ProbadorColor`):
1. Tres paletas curadas por plantilla en chips grandes, más «La de vuestra boda».
2. Una sola pregunta: «¿Cuál es el color de vuestra boda?» (rueda o cuentagotas sobre una foto). Papel, tinta y acento se derivan en OKLCH con **AA corregido automáticamente** y un aviso amable.
3. Cambio sobre la invitación real, en vista móvil, con transición de 400 ms y «Ver como invitado».
4. Como mucho, dos parejas tipográficas por plantilla: nada de combinatoria libre.
5. «Guardar esta paleta» envía un enlace para compartirla y crea una solicitud en la bandeja.
6. En `/plantillas`, el mismo probador sin registro, junto a «Probadla con vuestros nombres».

## 6. Atender a los clientes de forma eficiente

| Competidor | Plazo | Rondas de cambios | Canal |
|---|---|---|---|
| Invitaciones Mi Boda | 24–72 h | No consta; demo gratis previa | **WhatsApp** (asesor) |
| Tu Sobre Digital | 48–72 h laborables | FAQ «¿Puedo hacer cambios?» | Formulario + WhatsApp |
| Felizia | Prueba al momento; después, revisión Felizia | Área privada tras pagar | Email + WhatsApp flotante |
| Iberdigital | 10–20 días tras el briefing | — | Teléfono [NV] |
| Nupcio, Serenela, Invitatis, BodasFácil | Al instante (autoservicio) | La pareja edita | Email; Nupcio responde en < 24 h |
| WedInvita | — | A medida, extras de 25/35 € por opción | Formulario + email |

**Proceso recomendado para Invitoo** (hoy: 5 días laborables, cambios ilimitados):
1. **Día 0 · Briefing guiado** (10 min) por los bloques del §3, con los textos modelo ya rellenos.
2. **Borrador en 24 h:** enlace + vídeo de 30 s de la apertura por WhatsApp.
3. **Cambios en tandas:** dos rondas en 48 h con «Pedir un cambio» por sección (bandeja de F4); después, ilimitados en lote hasta publicar.
4. **Publicar** con checklist: horas, mapas, IBAN, fecha límite y prueba en el móvil de la pareja.
5. **Automático:** T-15 recordatorio a quien no ha confirmado; T-7 resumen para catering y transportista; T+1 modo «gracias».
6. **Canal:** WhatsApp Business con etiquetas por estado, con la bandeja como fuente de verdad. Primera respuesta en menos de 4 h laborables.

## 7. Quince acciones para marcar diferencia en España

| # | Acción | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **«Probadla con vuestros nombres» sin registro** | Todos la tienen; Invitoo no | M |
| 2 | Fecha límite del RSVP + recordatorio por WhatsApp | El catering la exige | B |
| 3 | Tipo de ceremonia (civil, religiosa, simbólica) e iconos correctos | El 80 % son civiles y hoy salen con iglesia | B |
| 4 | Bloque de protocolo «quién invita», clásico o moderno | Ningún competidor lo tiene | B |
| 5 | Niños, acompañantes con cupo y tono amable | Primera fuente de conflictos | B |
| 6 | Bus de ida y varias vueltas, y Excel por parada | Lo tiene IMB; ahorra horas al transportista | M |
| 7 | Bloque FAQ con 6 preguntas por defecto | La pareja deja de contestar WhatsApps | B |
| 8 | Plantilla **Acuarela del lugar** (ilustración de la finca) | El gancho visual que más vende en ES | A |
| 9 | Plantilla **Romántica floral** con `Florecer` | La pide Rodrigo; el wow sin infantilismo | M |
| 10 | Color de vuestra boda en vivo con AA automático | Solo Serenela lo hace, y sin control de calidad | M |
| 11 | Modo «letra grande» y teléfono a un toque | La «tía Mari»: nadie lo cuida | B |
| 12 | Borrador en 24 h + vídeo de la apertura por WhatsApp | Iguala la velocidad de IMB con más calidad | M |
| 13 | Prueba de que nada se solapa: sin CTA flotante sobre la invitación, música lejos de los formularios | Es el error de Nupcio, IMB, Serenela y BodasFácil | B |
| 14 | Modo «después de la boda»: gracias, álbum y Libro de deseos | Cierra el ciclo y vende el Libro (79 €) | M |
| 15 | Prueba social real (bodas.net / Google) y «de Barcelona para toda España» | Iberdigital y WedInvita tienen 1 reseña; IMB gana con testimonios | B |

**Lo que no hay que copiar:** urgencia falsa («precio sube mañana»), renovaciones anuales escondidas, el CTA de venta encima de la invitación del cliente, el stock de IA repetido y los 8 s en blanco.
