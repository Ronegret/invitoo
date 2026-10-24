"use client";

export default function Imprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#8C1D2C] px-8 text-[1.0625rem] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8C1D2C]"
    >
      Imprimir
    </button>
  );
}
