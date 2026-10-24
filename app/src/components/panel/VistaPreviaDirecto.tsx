/**
 * Maqueta estática de la pantalla del salón (para la vista previa del
 * candado). Nada de datos reales: es lo que «obtendríais».
 */
export default function VistaPreviaDirecto() {
  const fotos = [
    ["#C9B8A6", "#8C6F5A"],
    ["#B7C2B0", "#5F6F58"],
    ["#E2CFC9", "#9C6B63"],
    ["#CFC6B8", "#7A6C5B"],
    ["#D9C2A7", "#946F48"],
  ];
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1F1A17] text-[#F7F1E8]" role="img" aria-label="Así se ve la pantalla del salón: fotos de los invitados con su mensaje y un QR para subir más">
      <div className="absolute inset-0 grid grid-cols-5 grid-rows-2 gap-1.5 p-3">
        {fotos.concat(fotos).map(([a, b], i) => (
          <div key={i} className={`rounded-md ${i === 1 ? "col-span-2 row-span-2" : ""}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10">
        <p className="max-w-[70%] font-serif text-[0.9rem] italic leading-snug">«¡Qué bonita estás, Laura! Por muchos años así» <span className="not-italic opacity-80">— Tía Carmen</span></p>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-white p-1.5">
          <span className="block h-full w-full bg-[repeating-conic-gradient(#1F1A17_0_25%,#fff_0_50%)] bg-[length:8px_8px]" />
        </span>
      </div>
    </div>
  );
}
