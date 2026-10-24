import { ImageResponse } from "next/og";
import { obtenerInvitacion } from "@/lib/datos";
import { formatearFecha } from "@/lib/fecha";

/**
 * La vista previa que sale en WhatsApp al pegar el enlace. Es lo PRIMERO que
 * ve el invitado, antes de abrir nada: los nombres, la fecha y los colores de
 * la boda, en una didone (Bodoni Moda), con el sello de Invitoo al pie.
 *
 * Se genera en build para las que existen y se revalida al guardar en el
 * estudio (`revalidatePath('/i/<slug>/opengraph-image')`). Funciona sin base
 * de datos con las demos.
 *
 * La fuente se pide a Google Fonts con `text=` (solo los glifos necesarios,
 * unos pocos KB). Satori necesita TTF/OTF, no woff2; sin User-Agent de
 * navegador moderno, Google sirve TTF. Si la red falla, se pinta con la fuente
 * por defecto antes que romper la imagen.
 */

export const alt = "Invitación de boda";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function bodoni(texto: string, peso: 400 | 500): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@${peso}&text=${encodeURIComponent(texto)}`,
      )
    ).text();
    const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    const r = await fetch(url);
    return r.ok ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
}

/** Mezcla un color con otro (para los filetes suaves). */
function mezcla(a: string, b: string, t: number) {
  const n = (h: string) => {
    const x = h.replace("#", "");
    const v = x.length === 3 ? x.split("").map((c) => c + c).join("") : x.slice(0, 6);
    return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) || 0);
  };
  const [p, q] = [n(a), n(b)];
  return `rgb(${p.map((c, i) => Math.round(c + (q[i] - c) * t)).join(",")})`;
}

export default async function Imagen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const inv = await obtenerInvitacion(slug);

  const a = inv?.pareja.a ?? "Invitoo";
  const b = inv?.pareja.b ?? "";
  const fecha = inv ? formatearFecha(inv.pareja.fecha, { day: "numeric", month: "long", year: "numeric" }) : "";
  const tinta = inv?.tema.tinta ?? "#12100E";
  const papel = inv?.tema.papel ?? "#FAF8F5";
  const acento = inv?.tema.acento ?? "#8C1D2C";

  const textoFuente = `${a}${b}&${fecha}NOS CASAMOS·Diseñado por Invitoo`;
  const [display, texto] = await Promise.all([bodoni(textoFuente, 400), bodoni(textoFuente, 500)]);
  const fuentes = [
    display && { name: "Bodoni", data: display, weight: 400 as const, style: "normal" as const },
    texto && { name: "Bodoni", data: texto, weight: 500 as const, style: "normal" as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400 | 500; style: "normal" }[];

  const largo = Math.max(a.length, b.length);
  const cuerpo = largo > 12 ? 104 : largo > 8 ? 128 : 150;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: papel,
          color: tinta,
          fontFamily: fuentes.length ? "Bodoni" : undefined,
          position: "relative",
        }}
      >
        {/* Marco fino, como el de una tarjeta impresa. */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: `2px solid ${mezcla(acento, papel, 0.45)}`,
            display: "flex",
          }}
        />
        <div style={{ fontSize: 26, letterSpacing: 10, color: acento, fontWeight: 500, display: "flex" }}>
          NOS CASAMOS
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
            marginTop: 26,
            fontSize: cuerpo,
            lineHeight: 1,
          }}
        >
          <span>{a}</span>
          {b && <span style={{ color: acento, fontSize: cuerpo * 0.7 }}>&amp;</span>}
          {b && <span>{b}</span>}
        </div>
        {fecha && (
          <div style={{ marginTop: 34, fontSize: 40, display: "flex" }}>{fecha}</div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: 52,
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: mezcla(tinta, papel, 0.4),
            fontSize: 20,
            letterSpacing: 4,
          }}
        >
          {/* El sello de las alianzas (mismo dibujo que SelloAlianzas.tsx). */}
          <svg width="40" height="28" viewBox="0 0 300 212" fill="none" stroke="currentColor" strokeWidth="9">
            <circle cx="71" cy="118" r="65" />
            <circle cx="201" cy="110" r="84" />
            <path d="M71 46 42 13h58L71 46ZM42 13h58M71 46 56 13M71 46l15-33" strokeWidth="6" strokeLinejoin="round" />
          </svg>
          <span>Diseñado por Invitoo</span>
        </div>
      </div>
    ),
    { ...size, fonts: fuentes.length ? fuentes : undefined },
  );
}
