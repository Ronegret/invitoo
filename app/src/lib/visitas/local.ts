import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { servicio } from "@/lib/supabase/clientes";

/**
 * Almacén en archivo para desarrollo (sin Supabase), compartido por visitas y
 * correos. Mismo criterio que `lib/momentos/almacen.ts`:
 *   · «supabase» si hay service role;
 *   · «local» en `next dev` (o con `INVITOO_MEMORIA=1`);
 *   · null en producción sin base: no se mide ni se programa nada.
 *
 * El JSON vive en `app/<carpeta>/<archivo>.json` (en .gitignore) y sobrevive a
 * un reinicio del servidor de desarrollo. Escritura con debounce y rename
 * atómico: un pico de visitas no hace mil escrituras.
 */

const PRODUCCION = process.env.NODE_ENV === "production";
const MEMORIA_FORZADA = process.env.INVITOO_MEMORIA === "1";

export type ModoDatos = "supabase" | "local" | null;

export function modoDatos(): ModoDatos {
  if (servicio()) return "supabase";
  if (!PRODUCCION || MEMORIA_FORZADA) return "local";
  return null;
}

type Caja<T> = { valor: Promise<T>; temporizador: ReturnType<typeof setTimeout> | null };

export function archivoLocal<T>(carpeta: string, nombre: string, inicial: () => T) {
  const dir = path.join(/* turbopackIgnore: true */ process.cwd(), carpeta);
  const archivo = path.join(dir, `${nombre}.json`);
  const clave = `__invitooLocal_${carpeta}_${nombre}`;
  const g = globalThis as unknown as Record<string, Caja<T> | undefined>;

  function caja(): Caja<T> {
    g[clave] ??= {
      valor: readFile(archivo, "utf8")
        .then((t) => ({ ...inicial(), ...(JSON.parse(t) as T) }))
        .catch(() => inicial()),
      temporizador: null,
    };
    return g[clave]!;
  }

  async function guardarYa() {
    try {
      await mkdir(dir, { recursive: true });
      const tmp = `${archivo}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(await caja().valor));
      await rename(tmp, archivo);
    } catch (e) {
      console.error(`[local.${nombre}]`, e);
    }
  }

  return {
    leer: () => caja().valor,
    /** Guarda en ~300 ms (agrupa ráfagas). */
    guardar() {
      const c = caja();
      if (c.temporizador) return;
      c.temporizador = setTimeout(() => {
        c.temporizador = null;
        void guardarYa();
      }, 300);
    },
    guardarYa,
  };
}
