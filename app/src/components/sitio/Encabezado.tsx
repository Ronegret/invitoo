/**
 * La portada de una página interior —precios, plantillas, preguntas…—.
 *
 * Antes era una banda de fotografía de banco con el título encima. Las
 * fotos eran de stock y restaban: quien paga 249 € por un encargo no quiere
 * ver la misma pareja que sale en la web de una floristería. Ahora es
 * papel y letra: el titular muy grande, a la izquierda, y a la derecha lo
 * que esa página tiene de concreto (un precio, un número, un botón).
 *
 * Se lee sin JavaScript y sin animación: es el primer pantallazo.
 */
export default function Encabezado({
  sobre,
  titulo,
  bajo,
  aparte,
}: {
  sobre: string;
  titulo: string;
  bajo?: string;
  /** Lo que va en la columna derecha en escritorio, debajo en móvil. */
  aparte?: React.ReactNode;
}) {
  return (
    <header className="grano relative border-b border-[var(--tinta)]/10 bg-[var(--papel)] px-4 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-40">
      <div className="mx-auto grid max-w-[72rem] gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="flex items-center gap-3 text-[1rem] text-[var(--acento)]">
            <span aria-hidden className="h-px w-8 bg-current" />
            {sobre}
          </p>
          <h1 className="display mt-5 max-w-[15ch] text-[clamp(2.8rem,9vw,6rem)] leading-[0.98]">
            {titulo}
          </h1>
          {bajo && (
            <p className="mt-8 max-w-[38rem] text-[1.08rem] leading-[1.8] opacity-75">
              {bajo}
            </p>
          )}
        </div>
        {aparte && <div className="lg:col-span-4 lg:pb-3">{aparte}</div>}
      </div>
    </header>
  );
}
