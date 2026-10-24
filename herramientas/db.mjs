/**
 * Utilidad de base de datos: aplicar el esquema, sembrar la boda de ejemplo
 * y mirar qué hay dentro.
 *
 * La conexión sale de SUPABASE_DB_URL (app/.env.local). Nunca se escribe una
 * contraseña aquí: este archivo sí se versiona.
 *
 *   node herramientas/db.mjs esquema
 *   node herramientas/db.mjs migrar     (aplica supabase/migraciones/*.sql en orden)
 *   node herramientas/db.mjs sembrar
 *   node herramientas/db.mjs ver
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// pg y playwright están instalados en app/, no aquí: se resuelven desde allí.
const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..");

// pg está instalado en app/, no aquí: se resuelve desde allí.
const { Client } = createRequire(pathToFileURL(join(RAIZ, "app/package.json")).href)("pg");

// Se lee .env.local a mano para no arrastrar dependencias.
for (const linea of readFileSync(join(RAIZ, "app/.env.local"), "utf8").split("\n")) {
  const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("Falta SUPABASE_DB_URL en app/.env.local. Mira .env.example.");
  process.exit(1);
}

const cli = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await cli.connect();

const orden = process.argv[2] ?? "ver";

if (orden === "esquema") {
  await cli.query(readFileSync(join(RAIZ, "supabase/schema.sql"), "utf8"));
  console.log("esquema aplicado");
}

if (orden === "migrar") {
  const { readdirSync } = await import("node:fs");
  const dir = join(RAIZ, "supabase/migraciones");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    await cli.query(readFileSync(join(dir, f), "utf8"));
    console.log("migración aplicada:", f);
  }
}

if (orden === "sembrar") {
  const bloques = JSON.parse(
    readFileSync(join(RAIZ, "supabase/ejemplo-bloques.json"), "utf8"),
  );
  const { rows } = await cli.query(
    `insert into invitaciones
       (slug, plantilla, estado, nombre_a, nombre_b, fecha, tema, apertura, bloques, publicada_en)
     values ($1,$2,'publicada',$3,$4,$5,$6,$7,$8, now())
     on conflict (slug) do update set
       plantilla=excluded.plantilla, estado=excluded.estado,
       nombre_a=excluded.nombre_a, nombre_b=excluded.nombre_b,
       fecha=excluded.fecha, tema=excluded.tema,
       apertura=excluded.apertura, bloques=excluded.bloques
     returning id, slug`,
    [
      "laura-y-ruben", "floracion", "Laura", "Rubén", "2027-03-30T12:30:00+02:00",
      JSON.stringify({ tinta: "#2a1a18", papel: "#f7f1ea", acento: "#8c1d2c", grano: 0.05 }),
      JSON.stringify({
        vertical: "/aperturas/floracion/vertical.mp4",
        horizontal: "/aperturas/floracion/horizontal.mp4",
        poster: "/aperturas/floracion/poster.avif",
        rotuloEn: 3.2, rotuloClaro: true,
      }),
      JSON.stringify(bloques),
    ],
  );
  const panel = await cli.query(
    `insert into paneles (invitacion_id) values ($1)
     on conflict (invitacion_id) do update set invitacion_id=excluded.invitacion_id
     returning token`, [rows[0].id]);
  console.log("invitación:", "/i/" + rows[0].slug);
  console.log("panel:", "/novios/" + panel.rows[0].token);
}

if (orden === "ver") {
  for (const t of ["invitaciones", "invitados", "rsvp", "muro", "leads"]) {
    const { rows } = await cli.query(`select count(*)::int c from ${t}`);
    console.log(`${t.padEnd(14)} ${rows[0].c}`);
  }
  const { rows } = await cli.query(
    `select i.slug, p.token from invitaciones i join paneles p on p.invitacion_id = i.id`);
  console.table(rows);
}

await cli.end();
