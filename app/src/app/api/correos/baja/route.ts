import { NextResponse, type NextRequest } from "next/server";
import { darDeBaja, esGrupo, verificar } from "@/lib/correos/preferencias";

/**
 * La baja de un clic (RFC 8058), la que piden Gmail y Yahoo:
 *
 *   List-Unsubscribe: <https://invitoo.es/api/correos/baja?e=…&t=…>
 *   List-Unsubscribe-Post: List-Unsubscribe=One-Click
 *
 * El cliente de correo hace POST aquí sin cookies ni interacción
 * (cuerpo `List-Unsubscribe=One-Click`). Se apaga el grupo del correo
 * (`&g=`) o, si no viene, todo lo que se puede apagar, y se responde 200.
 *
 * Un GET (alguien que pega la URL en el navegador) va a la página /baja, que
 * pide confirmar con un botón: los escáneres de enlaces de Outlook y de los
 * antivirus abren las URL de los correos y no pueden dar de baja a nadie.
 */
export async function POST(peticion: NextRequest) {
  const q = new URL(peticion.url).searchParams;
  const email = verificar(q.get("e"), q.get("t"));
  if (!email) return NextResponse.json({ error: "Enlace no válido" }, { status: 400 });
  const g = q.get("g");
  const ok = await darDeBaja(email, esGrupo(g) ? g : undefined);
  return ok ? new NextResponse(null, { status: 200 }) : NextResponse.json({ error: "Inténtalo más tarde" }, { status: 503 });
}

export async function GET(peticion: NextRequest) {
  const q = new URL(peticion.url).searchParams;
  const destino = new URL("/baja", peticion.url);
  for (const k of ["e", "t"]) {
    const v = q.get(k);
    if (v) destino.searchParams.set(k, v);
  }
  destino.searchParams.set("baja", "1");
  return NextResponse.redirect(destino, 303);
}
