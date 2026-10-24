/**
 * Color en vivo (G3). Funciones puras: OKLCH, paletas armónicas con AA
 * garantizado, paletas curadas por plantilla y el contrato de variables.
 *
 * La server action está aparte (`./acciones`) para que importar esto desde
 * el cliente no arrastre código de servidor.
 */
export * from "./oklch";
export * from "./paleta";
export * from "./paletas";
export * from "./aplicar";
