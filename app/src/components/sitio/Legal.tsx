import { TITULAR } from "@/lib/legal";

/**
 * El marco de las páginas legales: el aviso de borrador arriba, el titular
 * grande y el texto a una columna cómoda de leer.
 */
export default function Legal({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-[var(--papel)] px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      <div className="mx-auto max-w-[44rem]">
        <p
          role="note"
          className="rounded-xl border border-[var(--acento)]/40 bg-[var(--acento)]/[0.06] px-5 py-4 text-[1rem] font-medium text-[var(--acento)]"
        >
          Borrador: revisar con un abogado antes de publicar
        </p>
        <h1 className="display mt-10 text-[clamp(2.6rem,8vw,4.4rem)] leading-[1]">{titulo}</h1>
        <div className="legal mt-10 text-[1.0625rem] leading-[1.8] [&_a]:underline [&_a]:underline-offset-4 [&_h2]:display [&_h2]:mt-14 [&_h2]:scroll-mt-28 [&_h2]:text-[1.9rem] [&_h2]:leading-tight [&_h3]:mt-8 [&_h3]:font-medium [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
        <p className="mt-16 text-[0.95rem] opacity-60">Última revisión: {TITULAR.revision}.</p>
      </div>
    </article>
  );
}
