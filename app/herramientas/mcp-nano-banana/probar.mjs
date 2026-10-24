// Prueba: arranca el servidor por stdio, lista herramientas y llama a estado_motores.
// Con --generar intenta UNA imagen (sirve para ver el mensaje de error si no hay facturación/cuota).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const t = new StdioClientTransport({ command: process.execPath, args: [new URL("./servidor.mjs", import.meta.url).pathname], env: { ...process.env }, stderr: "ignore" });
const c = new Client({ name: "prueba", version: "1.0.0" });
await c.connect(t);
const { tools } = await c.listTools();
console.log("Herramientas:", tools.map((x) => x.name).join(", "));
const e = await c.callTool({ name: "estado_motores", arguments: {} });
console.log(e.content[0].text);
if (process.argv.includes("--generar")) {
  const r = await c.callTool({ name: "generar_imagen", arguments: { prompt: "a white cotton paper envelope sealed with burgundy wax, linen background, soft window light", aspecto: "4:5", salida: "prueba-mcp", motor: process.argv.includes("--cloudflare") ? "cloudflare" : "gemini" } });
  console.log(r.isError ? "ERROR → " : "OK → ", r.content[0].text);
}
await c.close();
