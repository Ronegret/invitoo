import Link from "next/link";
import Muestra from "@/components/sitio/Muestra";
import { PLANTILLAS, type Plantilla } from "@/data/plantillas";

/**
 * El catálogo, en dos formatos. Las dos leen `PLANTILLAS` y nada más: si el
 * catálogo cambia de ocho a nueve, la web cambia sola.
 *
 * · `carril` (la home): todas las plantillas en una fila que se desliza en
 *   móvil y en una rejilla a contratiempo en escritorio —las columnas pares
 *   bajan—, para que no se lea como un expositor de tienda. Solo póster:
 *   aquí se elige con los ojos, no se reproduce nada.
 *
 * · `fichas` (/plantillas): una ficha por plantilla, a todo el ancho y
 *   alternando lado. Cada ficha se viste con el papel, la tinta y el acento
 *   de su plantilla, así que ninguna se parece a la de al lado; lleva su
 *   apertura en vídeo, para qué boda es, sus colores (cada uno abre la
 *   invitación en ese color) y el enlace a la invitación entera.
 */
export default function GaleriaPlantillas({
  modo = "fichas",
}: {
  modo?: "carril" | "fichas";
}) {
  if (modo === "carril") return <Carril />;

  return (
    <ul className="flex flex-col gap-6 sm:gap-8">
      {PLANTILLAS.map((p, i) => (
        <Ficha key={p.id} p={p} i={i} />
      ))}
    </ul>
  );
}

function Carril() {
  return (
    <ul className="carril -mx-4 flex gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14 lg:overflow-visible lg:px-0">
      {PLANTILLAS.map((p, i) => (
        <li
          key={p.id}
          className={`w-[11.5rem] shrink-0 sm:w-[13rem] lg:w-auto ${i % 2 ? "lg:mt-16" : ""}`}
        >
          <Link href={`/i/${p.demo}`} className="group block rounded-[2.2rem]">
            <span className="block transition-transform duration-300 ease-out group-hover:-translate-y-1.5">
              <span className="block rounded-[2.2rem] bg-[var(--tinta)] p-[6px]">
                <span className="relative block aspect-[9/16] overflow-hidden rounded-[1.8rem] bg-[var(--bruma)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
                  <img
                    src={p.poster}
                    alt=""
                    width={720}
                    height={1280}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </span>
              </span>
            </span>
            <span className="mt-4 block">
              <span className="display block text-[1.6rem] leading-tight">{p.nombre}</span>
              <span className="mt-1 block text-[1rem] leading-snug opacity-65">
                {p.etiqueta}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Ficha({ p, i }: { p: Plantilla; i: number }) {
  const derecha = i % 2 === 1;

  return (
    <li
      id={p.id}
      className="scroll-mt-24 overflow-hidden"
      style={{ background: p.tema.papel, color: p.tema.tinta }}
    >
      <div className="grid items-center gap-10 px-5 py-12 sm:px-10 sm:py-14 lg:grid-cols-12 lg:gap-12 lg:px-14">
        <div
          className={`mx-auto w-[14rem] sm:w-[16rem] lg:col-span-4 lg:w-full lg:max-w-[17rem] ${
            derecha ? "lg:order-2 lg:col-start-9" : ""
          }`}
        >
          <Muestra
            nombre={p.nombre}
            poster={p.poster}
            video={p.apertura?.vertical}
            prioridad={i < 2}
          />
        </div>

        <div className={`min-w-0 lg:col-span-7 ${derecha ? "lg:order-1 lg:col-start-1" : "lg:col-start-6"}`}>
          <p className="flex items-center gap-3 text-[1rem]">
            <span aria-hidden className="h-px w-8" style={{ background: p.tema.acento }} />
            {p.etiqueta}
          </p>
          <h2 className="display mt-4 break-words text-[clamp(2.8rem,8vw,5.2rem)] leading-[0.98]">
            {p.nombre}
          </h2>
          <p className="mt-6 max-w-[32rem] text-[1.12rem] leading-[1.7]">{p.gesto}</p>
          <p className="mt-3 max-w-[32rem] text-[1rem] leading-[1.7] opacity-75">{p.para}</p>

          {p.variantes.length > 0 && (
            <div className="mt-8">
              <p className="text-[1rem] opacity-70">Abrirla en otro color</p>
              <ul className="mt-2 flex flex-wrap gap-x-1 gap-y-1">
                {p.variantes.map((v) => (
                  <li key={v.id}>
                    <a
                      href={`/i/${p.demo}?c=${v.id}`}
                      className="inline-flex min-h-12 items-center gap-2.5 rounded-full pr-4 pl-1 text-[1rem] transition-colors duration-200 hover:bg-black/5"
                    >
                      <span
                        aria-hidden
                        className="block h-7 w-7 rounded-full ring-1 ring-black/15"
                        style={{
                          background: `linear-gradient(135deg, ${v.papel} 0 50%, ${v.acento} 50% 100%)`,
                        }}
                      />
                      {v.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href={`/i/${p.demo}`}
            className="mt-9 inline-flex min-h-14 items-center justify-center rounded-full px-8 text-[1rem] transition-transform duration-200 ease-out hover:scale-[1.02]"
            style={{ background: p.tema.tinta, color: p.tema.papel }}
          >
            Abrir la invitación {p.nombre}
          </Link>
        </div>
      </div>
    </li>
  );
}
