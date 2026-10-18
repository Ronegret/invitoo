import Link from "next/link";
import { EMAIL, INSTAGRAM, WHATSAPP } from "@/lib/contacto";

export default function Pie() {
  return (
    <footer className="border-t border-[var(--tinta)]/10 px-5 py-14">
      <div className="mx-auto flex max-w-[72rem] flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG */}
          <img
            src="/marca/lockup.svg"
            alt="Invitoo — Invitaciones digitales"
            width={156}
            height={53}
            className="h-auto w-[156px]"
          />
          <p className="mt-5 max-w-[20rem] text-[0.9rem] leading-relaxed opacity-60">
            Diseñamos la invitación de vuestra boda como una pieza a medida.
            Madrid, y a distancia a donde haga falta.
          </p>
        </div>

        {/* La web partida en páginas: aquí está el mapa entero. */}
        <div className="flex flex-col gap-3 text-[0.9rem]">
          <Link href="/plantillas" className="min-h-11 leading-[2.75rem] opacity-75 hover:opacity-100">
            Las doce plantillas
          </Link>
          <Link href="/servicios" className="min-h-11 leading-[2.75rem] opacity-75 hover:opacity-100">
            Qué hacemos
          </Link>
          <Link href="/precios" className="min-h-11 leading-[2.75rem] opacity-75 hover:opacity-100">
            Precios
          </Link>
          <Link href="/preguntas" className="min-h-11 leading-[2.75rem] opacity-75 hover:opacity-100">
            Preguntas
          </Link>
        </div>

        <div className="flex flex-col gap-3 text-[0.9rem]">
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 leading-[2.75rem] opacity-75 hover:opacity-100"
          >
            WhatsApp · 653 567 610
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="min-h-11 leading-[2.75rem] opacity-75 hover:opacity-100"
          >
            {EMAIL}
          </a>
          <a
            href={`https://instagram.com/${INSTAGRAM}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 leading-[2.75rem] opacity-75 hover:opacity-100"
          >
            @{INSTAGRAM}
          </a>
        </div>

        <div className="flex flex-col gap-3 text-[0.9rem]">
          <Link href="/para-invitados" className="min-h-11 leading-[2.75rem] opacity-75 hover:opacity-100">
            ¿Has recibido una invitación?
          </Link>
          <Link href="/aviso-legal" className="min-h-11 leading-[2.75rem] opacity-50 hover:opacity-100">
            Aviso legal
          </Link>
          <Link href="/privacidad" className="min-h-11 leading-[2.75rem] opacity-50 hover:opacity-100">
            Privacidad
          </Link>
        </div>
      </div>

      <p className="mx-auto mt-12 max-w-[72rem] text-[0.75rem] opacity-40">
        Invitoo © {new Date().getFullYear()}
      </p>
    </footer>
  );
}
