# Invitoo — Auditoría del producto actual

> Fecha: 16/09/2026 · Fuente: invitoo.es en producción (HTML descargado y analizado, no capturas)

---

## 1. Qué es Invitoo hoy

**HECHO.** Servicio *done-for-you* de invitaciones de boda digitales. El usuario no edita nada: elige un diseño, reserva una videollamada, Invitoo lo construye.

| | |
|---|---|
| Stack | WordPress 6.8.8 + Elementor 4.1.4 + tema `hello-elementor` |
| E-commerce | WooCommerce + Stripe + PayPal + Klarna |
| Agenda | Simply Schedule Appointments |
| Formularios | Contact Form 7 + MetForm + Forminator |
| Plantillas publicadas | 5 (`amoryelegancia`, `modernidadycalidez`, `caracterysofisticacion`, `sencillezydistincion`, `frescuraynaturalidad`) |
| Precios | Esencial 89 € · Personalizado 129 € · Premium 169 € (pago único) |
| Alianza | Dedícalo (canción personalizada incluida en todos los planes) |
| Contacto | WhatsApp +34 653 567 610 |

### Módulos que ya existen dentro de una invitación
Portada con fecha y nombres · cuenta atrás · confirmación de asistencia (RSVP) · itinerario con ceremonia y celebración · mapas «¿Cómo ir?» · historia de la pareja · playlist colaborativa de Spotify · regalos con IBAN · muro de mensajes de invitados · álbum de fotos compartido (Premium) · música de fondo.

**Esto es mucho producto.** El problema no es la funcionalidad. Es cómo se entrega y cómo se vende.

---

## 2. Problemas técnicos medidos

No son opiniones. Son números sacados del HTML en producción:

| Métrica | invitoo.es (home) | Invitación `/amoryelegancia/` | Objetivo razonable |
|---|---|---|---|
| Hojas de estilo | **94** | **103** | 1 |
| Scripts externos | **61** | **60** | 2–4 |
| HTML servido | 325 KB | 256 KB | < 40 KB |
| TTFB | — | **1,36 s** | < 0,2 s |
| Carga total del documento | — | 1,66 s (solo el HTML) | < 0,4 s |

**Qué significa.** Una invitación se abre casi siempre desde WhatsApp, en móvil, con datos móviles, muchas veces en un pueblo con mala cobertura, y muchas veces por gente de más de 60 años. Ahora mismo el invitado ve una pantalla en blanco durante varios segundos antes de que aparezca nada. Ese es exactamente el momento de máxima emoción del producto y se está desperdiciando.

100+ CSS y 60 JS no se arreglan con un plugin de caché. Es la arquitectura de Elementor. Es la razón correcta para salir de WordPress.

### Errores de calidad visibles en producción

- **Shortcode sin renderizar.** Al final de `/amoryelegancia/` se imprime literalmente `[forminator_form id="615"]` en la página. Lo ve el cliente.
- **La cuenta atrás muestra `0 Días 0 Horas 0 Minutos 0 Segundos`** en la carga inicial (la boda es el 30.03.2026). Se ve el «0» antes de hidratar.
- **Footer «Invitoo © 2025»** en septiembre de 2026.
- **Errata en producción:** «Inglesia Nuestra Señora de la Visitación».
- **Registro de idioma mezclado.** En la misma invitación conviven «Gracias por acompañarnos… que nos acompañes» (ustedes/tú latino) con «os dejamos esta opción» (vosotros peninsular). Para un cliente español suena a plantilla comprada.
- **Menú duplicado en el footer** (la lista de páginas aparece dos veces seguidas).

Ninguno es grave por separado. Juntos hacen que un producto de 169 € no se sienta de 169 €. Esto es justo lo que separa «funciona» de «está terminado».

---

## 3. Problemas de producto y negocio

### 3.1 La propuesta de valor está enterrada

El diferenciador real de Invitoo lo dice la propia web y se le da poco espacio:

> «Somos la única plataforma que te ofrece una videollamada gratuita»

Y el segundo, que es aún más fuerte y aparece como *add-on* de un partner en vez de como bandera:

> **La canción personalizada de Dedícalo.**

Nadie en el mercado español regala una canción compuesta para la pareja. Eso no es una *feature*, es la razón por la que alguien elegiría Invitoo y no un editor de 29 €. Hoy está tratado como un bonus en un bullet.

### 3.2 El posicionamiento está en la peor franja de precio

| Competidor | Modelo | Precio | Cómo ataca |
|---|---|---|---|
| Canva / plantillas gratis | DIY | 0 € | Precio |
| [Nupcio](https://www.nupcio.com/) | SaaS self-serve | 0–99 € | Autoservicio, freemium |
| [Invitatis](https://invitatis.com/es/) | SaaS self-serve | Gratis diseñar, pago al publicar | Prueba antes de pagar |
| [Invitaciones Mi Boda](https://invitacionesmiboda.es/) | Done-for-you | desde 100 €, 24–72 h | Velocidad + cambios ilimitados |
| **Invitoo** | **Done-for-you** | **89–169 €** | **Videollamada + canción** |
| [Felizia](https://felizia.es/) | A medida + módulos | desde 210 € | Personalización total |

Invitoo está en tierra de nadie: **más caro que el autoservicio y más barato que lo premium a medida, sin que el precio explique por qué**. Un cliente que compara ve 89 € vs 0 € y no entiende la diferencia hasta que ya se ha ido.

### 3.3 No hay retención ni recurrencia

Una boda se celebra una vez. El cliente paga una vez y desaparece. Hoy Invitoo no tiene:

- ningún motivo para que el invitado vuelva después de confirmar,
- ningún producto post-boda (las fotos y los mensajes de los invitados se recopilan… y se entregan por fuera),
- ninguna vía para que los ~120 invitados de cada boda se conviertan en clientes.

**Cada invitación es un escaparate delante de 120 personas de la edad exacta de casarse.** Ahora mismo eso solo produce un enlace en el footer.

### 3.4 El escalado depende de Rodrigo

Cada invitación se construye a mano en Elementor. El margen de un plan de 129 € se lo come el tiempo de montaje. Sin plantillas parametrizadas, más ventas = más horas, no más negocio.

---

## 4. Lo que hay que conservar

No se tira nada de esto:

- **El logo.** «INVIT» + dos alianzas entrelazadas con un brillante sustituyendo la doble O. Es un monograma real y ownable.
- **La tipografía Cruilla** (display del logo y titulares).
- **Los 20+ módulos de invitación** ya pensados. Están bien elegidos.
- **La videollamada gratuita** como parte del servicio.
- **La alianza con Dedícalo.**
- **El tono emocional** del copy («Hay momentos que nos hacen infinitos»). Solo hay que unificar el registro.
- **El pago único.** El mercado español de bodas rechaza la suscripción.

---

## 5. Inventario de decisión

### Mantener
Módulos de invitación · videollamada · Dedícalo · pago único · logo · Cruilla · Motterdam y Ananda como acentos.

### Mejorar
Velocidad (crítico) · apertura de la invitación · copy y registro de idioma · jerarquía de la home · presentación de precios.

### Simplificar
Cinco plugins de formularios → uno. WooCommerce completo → un checkout de Stripe. Elementor → nada.

### Eliminar
WordPress. Elementor y sus 8 addons. Los shortcodes rotos. El footer duplicado.

### Crear
Motor de plantillas parametrizado · panel de novios · panel interno de montaje · aperturas cinematográficas · producto post-boda · programa de referidos vía invitados.
