/**
 * Los textos de la web pública.
 *
 * Están aquí y no dentro de cada página por una razón práctica: la misma
 * lista aparece en dos sitios —lo que lleva dentro se resume en la home y se
 * cuenta entero en /servicios— y si el texto vive en un solo lugar no hay
 * manera de que las dos versiones acaben diciendo cosas distintas.
 */

export type Entrada = {
  titulo: string;
  texto: string;
  /** Si sale en el resumen de la portada. Las ocho primeras. */
  destacada?: boolean;
};

/** Lo que lleva dentro una invitación de Invitoo. */
export const DENTRO: Entrada[] = [
  {
    titulo: "La apertura",
    texto: "El vídeo con el que se abre. Vuestros nombres dentro, no encima.",
    destacada: true,
  },
  {
    titulo: "La cuenta atrás",
    texto: "Los días que quedan, en el móvil de cada uno de ellos.",
  },
  {
    titulo: "El itinerario",
    texto: "Hora a hora, con las direcciones y el botón de cómo llegar.",
    destacada: true,
  },
  {
    titulo: "Confirmación",
    texto: "Sin registros ni contraseñas. Escriben su nombre y ya está.",
    destacada: true,
  },
  {
    titulo: "El menú",
    texto:
      "Quién come qué, y quién es alérgico a qué, en una lista que le pasáis al catering tal cual.",
    destacada: true,
  },
  {
    titulo: "El autobús",
    texto: "Quién lo coge y dónde se sube. Sin grupos de ochenta personas.",
  },
  {
    titulo: "Vuestra historia",
    texto: "Cómo empezó, con vuestras fotos entre los párrafos.",
    destacada: true,
  },
  {
    titulo: "La galería",
    texto: "Un mosaico con las fotos que os hicisteis antes de la boda.",
    destacada: true,
  },
  {
    titulo: "El dress code",
    texto:
      "Con los colores puestos, no con una palabra que cada uno entiende a su manera.",
  },
  {
    titulo: "Dónde dormir",
    texto: "Dos o tres opciones cerca, con precio y enlace.",
  },
  {
    titulo: "La playlist",
    texto: "Una lista de Spotify donde cada invitado mete su tema.",
  },
  {
    titulo: "Regalos",
    texto:
      "Vuestro número de cuenta, dicho de una forma que no incomoda a nadie.",
  },
  {
    titulo: "El muro",
    texto: "Lo que os escriben. No se publica: se recoge y se os entrega.",
    destacada: true,
  },
  {
    titulo: "El álbum",
    texto: "Las fotos que hacen ellos, todas en el mismo sitio.",
  },
  {
    titulo: "La canción",
    texto:
      "Compuesta para vosotros, con vuestra historia. Suena al abrir.",
    destacada: true,
  },
];

export type Pregunta = { q: string; a: string; de: "precio" | "producto" };

/**
 * Las preguntas, etiquetadas por dónde aparecen. Las de precio salen en
 * /precios, que es donde se dudan; las de producto en /servicios. Todas
 * juntas, en /preguntas.
 */
export const PREGUNTAS: Pregunta[] = [
  {
    de: "producto",
    q: "Mi abuela no se aclara con el móvil. ¿Va a poder abrirla?",
    a: "Sí. Es un enlace: se toca y se abre, como una foto de WhatsApp. No hay que instalar nada, ni registrarse, ni acordarse de ninguna contraseña. La letra es grande a propósito y los botones también. No es un detalle: es el criterio con el que está diseñada entera, porque un tercio de vuestros invitados pasa de sesenta años.",
  },
  {
    de: "producto",
    q: "¿Y si cambia algo después de haberla mandado?",
    a: "Se cambia y ya está. El enlace es el mismo, así que todo el mundo ve lo nuevo sin que tengáis que reenviar nada ni avisar a nadie. Cambios ilimitados hasta el día de la boda: si llueve y movéis el cóctel dentro, lo tocamos esa misma mañana.",
  },
  {
    de: "precio",
    q: "¿Cuánto tarda?",
    a: "De la videollamada a tener el enlace, entre cinco y siete días. Si vais con prisa hay entrega en 48 horas por 49 € más.",
  },
  {
    de: "precio",
    q: "¿Cuánto tiempo está online?",
    a: "Un año desde la boda, incluido. Después podéis mantenerla o convertirla en el Libro de la Boda: la versión que os quedáis, con los mensajes que os escribieron y las fotos que hizo todo el mundo.",
  },
  {
    de: "producto",
    q: "¿Tenemos que montarla nosotros?",
    a: "No, y ésa es toda la diferencia con las plataformas de veintinueve euros. Ahí os dan un editor y el trabajo es vuestro. Aquí nos contáis vuestra boda una vez, la montamos entera, y vosotros solo decís qué cambiar.",
  },
  {
    de: "producto",
    q: "¿Qué es lo de la canción?",
    a: "Una canción original, compuesta para vuestra boda y con vuestra historia dentro, por Dedícalo. Suena en la invitación y os la lleváis en archivo para ponerla el día de la ceremonia. No la tiene ninguna otra plataforma en España.",
  },
  {
    de: "precio",
    q: "¿Podemos verla antes de decidir?",
    a: "Reserváis veinte minutos por Meet, os contamos qué haríamos con vuestra boda y os enseñamos por dónde iría. Sin presupuesto por delante y sin compromiso.",
  },
  {
    de: "precio",
    q: "¿Hay alguna cuota o comisión después?",
    a: "No. Es un pago único. Ni suscripción, ni comisión por invitado, ni coste por confirmación recibida. Lo que pone en el precio es lo que se paga, y el alojamiento del primer año va incluido.",
  },
];

/** Los añadidos. Precios reales, los mismos que cobra Stripe. */
export const ANADIDOS: { nombre: string; precio: number; nota: string }[] = [
  {
    nombre: "Libro de la Boda",
    precio: 79,
    nota: "La versión que os quedáis: los mensajes del muro y las fotos de los invitados, encuadernados en una página que no caduca.",
  },
  {
    nombre: "Idioma extra",
    precio: 39,
    nota: "La invitación entera traducida, con su selector. Para bodas con familia fuera.",
  },
  {
    nombre: "Entrega en 48 horas",
    precio: 49,
    nota: "Cuando la boda es ya. Se monta con prioridad sobre el resto de la cola.",
  },
];
