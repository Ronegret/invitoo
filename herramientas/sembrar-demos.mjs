/**
 * Siembra en Supabase LAS OCHO INVITACIONES DE MUESTRA, una por plantilla.
 *
 * La fuente de verdad es `app/src/data/demo.ts` (lo mismo que se sirve en
 * local sin base de datos): aquí no se duplica ni una boda. Se lee con
 * `--experimental-strip-types` porque ese archivo solo importa tipos.
 *
 * Además:
 *  · un panel por boda (`paneles`),
 *  · en la primera boda, los invitados de prueba con token fijo
 *    (`?n=demo-carmen`, `demo-fernandez`, `demo-inigo`), igual que en memoria,
 *  · con `--rsvp`, dos respuestas de ejemplo con el formato nuevo
 *    (`personas` con menú y alérgenos por persona, `bus`, `parada`),
 *  · con `--archivar-viejas`, pasa a «archivada» las demos de los ids antiguos
 *    (lucia-y-tomas, irene-y-dani…): la web ya las redirige.
 *
 *   node herramientas/sembrar-demos.mjs [--rsvp] [--archivar-viejas]
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..");
const SRC = join(RAIZ, "app/src");
const { Client } = createRequire(pathToFileURL(join(RAIZ, "app/package.json")).href)("pg");

const conRsvp = process.argv.includes("--rsvp");
const archivar = process.argv.includes("--archivar-viejas");

const env = join(RAIZ, "app/.env.local");
if (existsSync(env)) {
  for (const linea of readFileSync(env, "utf8").split("\n")) {
    const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.SUPABASE_DB_URL) {
  console.error("Falta SUPABASE_DB_URL (app/.env.local).");
  process.exit(1);
}

/** Las bodas de demo.ts, como JSON, sin compilar nada. */
function leerDemos() {
  const url = pathToFileURL(join(SRC, "data/demo.ts")).href;
  const codigo = `
    const d = await import(${JSON.stringify(url)});
    const bodas = Object.values(d.DEMO);
    process.stdout.write(JSON.stringify({ bodas, alias: Object.keys(d.ALIAS_DEMOS ?? {}) }));
  `;
  const salida = execFileSync(
    process.execPath,
    ["--experimental-strip-types", "--no-warnings", "--input-type=module", "-e", codigo],
    { encoding: "utf8" },
  );
  return JSON.parse(salida);
}

const { bodas, alias } = leerDemos();

const cli = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await cli.connect();

const ids = {};
for (const b of bodas) {
  const { rows } = await cli.query(
    `insert into invitaciones
       (slug, plantilla, estado, nombre_a, nombre_b, fecha, tema, apertura, musica, bloques, publicada_en)
     values ($1,$2,'publicada',$3,$4,$5,$6,$7,$8,$9, now())
     on conflict (slug) do update set
       plantilla=excluded.plantilla, estado=excluded.estado,
       nombre_a=excluded.nombre_a, nombre_b=excluded.nombre_b,
       fecha=excluded.fecha, tema=excluded.tema,
       apertura=excluded.apertura, musica=excluded.musica,
       bloques=excluded.bloques
     returning id`,
    [
      b.slug,
      b.plantilla,
      b.pareja.a,
      b.pareja.b,
      b.pareja.fecha,
      JSON.stringify(b.tema ?? {}),
      b.apertura ? JSON.stringify(b.apertura) : null,
      b.musica ? JSON.stringify(b.musica) : null,
      JSON.stringify(b.bloques ?? []),
    ],
  );
  ids[b.slug] = rows[0].id;
  await cli.query(`insert into paneles (invitacion_id) values ($1) on conflict do nothing`, [
    rows[0].id,
  ]);
  const { rows: panel } = await cli.query(`select token from paneles where invitacion_id = $1`, [
    rows[0].id,
  ]);
  console.log(`${b.plantilla.padEnd(14)} /i/${b.slug.padEnd(18)} panel /novios/${panel[0]?.token}`);
}

// Invitados de prueba con token fijo en la primera boda (como en memoria).
const primera = bodas[0];
const INVITADOS = [
  { nombre: "Carmen", grupo: "Familia", cupo: 2, token: "demo-carmen", trato: "querida" },
  { nombre: "Familia Fernández", grupo: "Familia", cupo: 4, token: "demo-fernandez", trato: null },
  { nombre: "Íñigo", grupo: "Amigos", cupo: 1, token: "demo-inigo", trato: null },
];
for (const i of INVITADOS) {
  await cli.query(
    `insert into invitados (invitacion_id, nombre, grupo, cupo, token, trato)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (token) do update set
       nombre=excluded.nombre, grupo=excluded.grupo, cupo=excluded.cupo, trato=excluded.trato`,
    [ids[primera.slug], i.nombre, i.grupo, i.cupo, i.token, i.trato],
  );
}
console.log(`\ninvitados de prueba: /i/${primera.slug}?n=demo-carmen (y demo-fernandez, demo-inigo)`);

if (conRsvp) {
  const EJEMPLOS = [
    {
      clave: "nombre:ana lopez",
      nombre: "Ana López",
      asiste: true,
      personas: [
        { nombre: "Ana López", menu: "adulto", alergenos: ["gluten"], alergias_texto: "Celiaquía estricta" },
        { nombre: "Leo López", menu: "infantil", alergenos: [], alergias_texto: null },
      ],
      bus: "ida_vuelta",
      parada: "Plaza de España",
      mensaje: "¡Allí estaremos!",
    },
    {
      clave: "nombre:pedro sanz",
      nombre: "Pedro Sanz",
      asiste: false,
      personas: [{ nombre: "Pedro Sanz", menu: "adulto", alergenos: [], alergias_texto: null }],
      bus: "no",
      parada: null,
      mensaje: "Os mando un abrazo enorme.",
    },
  ];
  for (const r of EJEMPLOS) {
    const resumenAlergias = r.personas
      .flatMap((p) => [...p.alergenos, p.alergias_texto].filter(Boolean))
      .join(", ");
    await cli.query(
      `insert into rsvp (invitacion_id, clave, nombre, asiste, personas, bus, parada, mensaje, acompanantes, menu, alergias)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (invitacion_id, clave) do update set
         nombre=excluded.nombre, asiste=excluded.asiste, personas=excluded.personas,
         bus=excluded.bus, parada=excluded.parada, mensaje=excluded.mensaje,
         acompanantes=excluded.acompanantes, menu=excluded.menu, alergias=excluded.alergias`,
      [
        ids[primera.slug],
        r.clave,
        r.nombre,
        r.asiste,
        JSON.stringify(r.personas),
        r.bus,
        r.parada,
        r.mensaje,
        Math.max(0, r.personas.length - 1),
        r.personas[0].menu,
        resumenAlergias || null,
      ],
    );
  }
  console.log(`respuestas de ejemplo en /i/${primera.slug}: ${EJEMPLOS.length}`);
}

if (archivar && alias.length) {
  const { rowCount } = await cli.query(
    `update invitaciones set estado = 'archivada' where slug = any($1) and estado = 'publicada'`,
    [alias],
  );
  console.log(`demos antiguas archivadas: ${rowCount}`);
}

await cli.end();
console.log(`\n${bodas.length} invitaciones de muestra, una por plantilla`);
