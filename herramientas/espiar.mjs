/**
 * Mirar a la competencia con un navegador de verdad.
 *
 * No sirve leer el HTML: estas webs son casi todo tipografía, movimiento y
 * ritmo, y eso no está en el código fuente. Esto abre cada una en escritorio
 * y en móvil, la recorre entera para que dispare sus animaciones, la
 * fotografía, y de paso mide lo que se puede medir —cuánto pesa la página,
 * cuántas pantallas mide, qué tipografías usa, qué dice en sus botones—.
 *
 * Las capturas van a `_research/competencia/`, que está fuera de git.
 *
 * Uso:  node herramientas/espiar.mjs
 */
import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { abrirNavegador, RAIZ } from "./navegador.mjs";

const SALIDA = join(RAIZ, "_research/competencia");
mkdirSync(SALIDA, { recursive: true });

const SITIOS = [
  ["fixdate", "https://fixdate.io/es/bodas"],
  ["qualite", "https://laqualite.es/#invitaciones"],
];

const MOVIL =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const { nav, motor } = await abrirNavegador();
console.log(`navegador: ${motor}\n`);

for (const [nombre, url] of SITIOS) {
  for (const [w, h, movil, suf] of [
    [1440, 900, false, "esc"],
    [390, 844, true, "mov"],
  ]) {
    const ctx = await nav.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      isMobile: movil,
      hasTouch: movil,
      userAgent: movil ? MOVIL : undefined,
      locale: "es-ES",
    });
    const p = await ctx.newPage();

    // Cuánto pesa de verdad, contado byte a byte.
    let bytes = 0;
    const porTipo = {};
    p.on("response", async (r) => {
      try {
        const b = (await r.body()).length;
        bytes += b;
        const t = (r.request().resourceType() || "otro");
        porTipo[t] = (porTipo[t] || 0) + b;
      } catch {
        /* redirecciones y respuestas sin cuerpo */
      }
    });

    try {
      await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await p.waitForTimeout(4000);

      // Banner de cookies, si lo hay: tapa la portada en las capturas.
      for (const t of ["Aceptar todo", "Aceptar todas", "Aceptar", "Accept", "De acuerdo", "Entendido"]) {
        const b = p.getByRole("button", { name: new RegExp(`^${t}`, "i") }).first();
        if ((await b.count()) && (await b.isVisible().catch(() => false))) {
          await b.click().catch(() => {});
          break;
        }
      }
      await p.waitForTimeout(1200);
      await p.screenshot({ path: join(SALIDA, `${nombre}-${suf}-portada.png`) });

      // Recorrerla entera dispara sus apariciones al hacer scroll.
      await p.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((s) => setTimeout(s, 90));
        }
        window.scrollTo(0, 0);
      });
      await p.waitForTimeout(2000);
      await p.screenshot({
        path: join(SALIDA, `${nombre}-${suf}-completa.png`),
        fullPage: true,
      });

      if (!movil) {
        const datos = await p.evaluate(() => {
          const txt = (n) => (n.textContent || "").trim().replace(/\s+/g, " ");
          const cuenta = (m, k) => m.set(k, (m.get(k) || 0) + 1);

          const fuentes = new Map();
          for (const n of document.querySelectorAll("h1,h2,h3,p,a,button,li")) {
            if (!txt(n)) continue;
            const f = getComputedStyle(n).fontFamily.split(",")[0].replace(/["']/g, "");
            cuenta(fuentes, f);
          }
          const colores = new Map();
          for (const n of document.querySelectorAll("body *")) {
            const s = getComputedStyle(n);
            for (const c of [s.backgroundColor, s.color]) {
              if (c && c !== "rgba(0, 0, 0, 0)") cuenta(colores, c);
            }
          }
          const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

          return {
            titulo: document.title,
            altoPx: document.body.scrollHeight,
            pantallas: +(document.body.scrollHeight / window.innerHeight).toFixed(1),
            h1: [...document.querySelectorAll("h1")].map(txt),
            h2: [...document.querySelectorAll("h2")].map(txt).filter(Boolean).slice(0, 40),
            h3: [...document.querySelectorAll("h3")].map(txt).filter(Boolean).slice(0, 40),
            botones: [...new Set([...document.querySelectorAll("a[class*=btn],a[class*=button],button,a[class*=cta]")].map(txt).filter(Boolean))].slice(0, 30),
            nav: [...new Set([...document.querySelectorAll("nav a, header a")].map(txt).filter(Boolean))].slice(0, 20),
            imagenes: document.querySelectorAll("img").length,
            videos: [...document.querySelectorAll("video")].map((v) => ({
              src: (v.currentSrc || v.getAttribute("src") || "").slice(-60),
              autoplay: v.autoplay, muted: v.muted, loop: v.loop,
              medida: `${v.videoWidth}x${v.videoHeight}`,
            })),
            precios: [...new Set((document.body.innerText.match(/\d{1,4}(?:[.,]\d{2})?\s?€/g) || []))].slice(0, 30),
            fuentes: top(fuentes, 6),
            colores: top(colores, 12),
          };
        });
        datos.pesoKB = Math.round(bytes / 1024);
        datos.pesoPorTipoKB = Object.fromEntries(
          Object.entries(porTipo).map(([k, v]) => [k, Math.round(v / 1024)]),
        );
        writeFileSync(join(SALIDA, `${nombre}.json`), JSON.stringify(datos, null, 2), "utf8");
        console.log(
          `${nombre.padEnd(9)} ${datos.pantallas} pantallas · ${datos.pesoKB} KB · ${datos.imagenes} imgs · ${datos.videos.length} vídeos`,
        );
      }
    } catch (e) {
      console.log(`${nombre} ${suf} FALLO: ${String(e).slice(0, 140)}`);
    }
    await ctx.close();
  }
}

await nav.close();
console.log(`\nCapturas en ${SALIDA}`);
