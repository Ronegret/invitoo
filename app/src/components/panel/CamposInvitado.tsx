import type { Invitado } from "@/lib/datos";
import { ui } from "./estilos";

/**
 * Los campos de un invitado, iguales en el alta y en la edición. Sin estado:
 * sirve en el servidor y dentro de las islas.
 */
export default function CamposInvitado({ i, prefijo }: { i?: Partial<Invitado>; prefijo: string }) {
  const id = (c: string) => `${prefijo}-${c}`;
  return (
    <>
      <div className="sm:col-span-2">
        <label htmlFor={id("nombre")} className={ui.etiqueta}>Nombre</label>
        <input id={id("nombre")} name="nombre" required minLength={2} maxLength={120} defaultValue={i?.nombre} placeholder="Tía Carmen" autoComplete="off" className={ui.campo} />
      </div>
      <div>
        <label htmlFor={id("grupo")} className={ui.etiqueta}>Grupo <span className="font-normal">(opcional)</span></label>
        <input id={id("grupo")} name="grupo" list="grupos-invitados" maxLength={60} defaultValue={i?.grupo ?? ""} placeholder="Familia de Laura" autoComplete="off" className={ui.campo} />
      </div>
      <div>
        <label htmlFor={id("cupo")} className={ui.etiqueta}>Plazas</label>
        <input id={id("cupo")} name="cupo" type="number" inputMode="numeric" min={1} max={12} defaultValue={i?.cupo ?? 1} aria-describedby={id("cupo-ayuda")} className={ui.campo} />
        <p id={id("cupo-ayuda")} className={`mt-1 text-[0.8rem] ${ui.suave}`}>Contando a esta persona</p>
      </div>
      <div>
        <label htmlFor={id("telefono")} className={ui.etiqueta}>Teléfono <span className="font-normal">(opcional)</span></label>
        <input id={id("telefono")} name="telefono" type="tel" inputMode="tel" maxLength={30} defaultValue={i?.telefono ?? ""} placeholder="600 000 000" autoComplete="off" className={ui.campo} />
      </div>
      <div>
        <label htmlFor={id("trato")} className={ui.etiqueta}>Saludo en la invitación</label>
        <select id={id("trato")} name="trato" defaultValue={i?.trato ?? ""} className={ui.campo}>
          <option value="">Solo el nombre</option>
          <option value="querida">Querida…</option>
          <option value="querido">Querido…</option>
          <option value="queridos">Queridos…</option>
        </select>
      </div>
    </>
  );
}
