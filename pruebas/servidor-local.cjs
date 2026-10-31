// ════════════════════════════════════════════════════════════════════════
//  servidor-local.cjs · La app completa en tu computadora, para probarla
//  en el navegador: la página (armada desde web/ como en Vercel, con los
//  mismos encabezados de seguridad) y el servidor (el de apps-script/, en el
//  simulador), en una sola dirección.
//
//   npm run local          → http://localhost:4321
//
//  · GET  /, /app.js, …   → la página. Se vuelve a armar cada vez que recargas:
//                           cambia algo en web/ y recarga el navegador.
//                           (Si cambias un .gs, detén esto con Ctrl+C y vuelve a correrlo.)
//  · POST /exec           → doPost() del servidor real, como la URL /exec de Google.
//  · GET  /exec           → doGet(): lo que ve quien abre la URL de Google.
//  · GET  /__admin        → usuario y contraseña temporal que dio instalar().
//
//  Con base/base.json (los datos migrados; no van en GitHub) arranca con ellos;
//  sin él, con una base vacía.
//
//  CG_RETRASO_MS=1500  cada respuesta tarda eso (como Apps Script de verdad),
//                      para ver cuánto espera la persona en cada pantalla.
//  CG_SIMULAR_150=1    se porta como el servidor 1.5.0 (sin precarga ni
//                      detalle en las respuestas): la página nueva debe
//                      funcionar igual si se publica antes que el servidor.
// ════════════════════════════════════════════════════════════════════════
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { crearEntorno } = require("./simulador.cjs");

const PUERTO = Number(process.argv[2] || 4321);
const RAIZ = path.join(__dirname, "..");
const RUTA_BASE = path.join(RAIZ, "base", "base.json");
const API = `http://localhost:${PUERTO}/exec`;

const e = crearEntorno();
const conBase = fs.existsSync(RUTA_BASE);
if (conBase) e.cargarBase(JSON.parse(fs.readFileSync(RUTA_BASE, "utf8")));
const salida = e.comoDueno("instalar");
const m = salida.match(/Usuario: (\S+)\s+Contraseña temporal: (\S+)/);
e.comoAnonimo();
if (process.env.CG_SIMULAR_VIEJO === "1") {
  // Prueba: la página nueva contra un servidor publicado de una versión anterior.
  const inicioReal = e.ctx.ACCIONES_.inicio.fn;
  e.ctx.ACCIONES_.inicio.fn = (yo, d, t) => { const r = inicioReal(yo, d, t); delete r.indicadores; r.version = "1.0.0"; return r; };
  delete e.ctx.ACCIONES_.indicadores;
}
if (process.env.CG_SIMULAR_150 === "1") {
  delete e.ctx.ACCIONES_.listarTodo;
  const apiReal = e.ctx.api;
  e.ctx.api = (t, a, d) => {
    const r = apiReal(t, a, d);
    if (r && r.ok && r.datos && typeof r.datos === "object" && !Array.isArray(r.datos)) {
      delete r.datos.inicio; delete r.datos.detalle;
      if (a === "inicio" && Array.isArray(r.datos.acciones)) r.datos.acciones = r.datos.acciones.filter((x) => x !== "listarTodo");
    }
    return r;
  };
}
const RETRASO = Number(process.env.CG_RETRASO_MS || 0);
const despues = (f) => (RETRASO ? setTimeout(f, RETRASO) : f());
e.estado.url = API;

// Los mismos encabezados de seguridad que Vercel (vercel.json); la página le habla a esta misma dirección.
const vercel = JSON.parse(fs.readFileSync(path.join(RAIZ, "vercel.json"), "utf8"));
const ENCABEZADOS = Object.fromEntries(vercel.headers[0].headers.map((h) => [h.key, h.value]));
ENCABEZADOS["Content-Security-Policy"] = ENCABEZADOS["Content-Security-Policy"].replace(/connect-src [^;]+/, "connect-src 'self'");
delete ENCABEZADOS["Strict-Transport-Security"];
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };

async function main() {
  const { armarPagina } = await import(pathToFileURL(path.join(RAIZ, "herramientas", "armar-web.mjs")).href);
  let pagina = armarPagina(API);

  http.createServer((req, res) => {
    const ruta = decodeURIComponent(req.url.split("?")[0]);
    if (ruta === "/exec" && req.method === "OPTIONS") { res.writeHead(405); return res.end(); }   // Google tampoco contesta la consulta previa
    if (ruta === "/exec" && req.method === "POST") {
      let cuerpo = "";
      req.on("data", (c) => (cuerpo += c));
      req.on("end", () => {
        const r = e.post(cuerpo);
        despues(() => {
          res.writeHead(200, { "Content-Type": r.mime, "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify(r.json));
        });
      });
      return;
    }
    if (ruta === "/exec" && req.method === "GET") {
      const q = new URL(req.url, "http://x").searchParams;
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(e.run("doGet", { parameter: Object.fromEntries(q) }).html);
    }
    if (req.method === "GET" && ruta === "/__admin") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ usuario: m[1], clave: m[2] }));
    }
    if (req.method === "GET") {
      const n = ruta === "/" ? "index.html" : ruta.replace(/^\/+/, "");
      if (n === "index.html") {
        try { pagina = armarPagina(API); } catch (err) {
          res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
          return res.end("✘ La página no se pudo armar:\n\n" + err.message);
        }
      }
      if (Object.prototype.hasOwnProperty.call(pagina, n)) {
        res.writeHead(200, { ...ENCABEZADOS, "Content-Type": TIPOS[path.extname(n)] || "application/octet-stream" });
        return res.end(pagina[n]);
      }
    }
    res.writeHead(404, ENCABEZADOS);
    res.end("No existe");
  }).listen(PUERTO, () => console.log(`Control de Gestión (simulado) en http://localhost:${PUERTO}  ·  admin: ${m[1]} / ${m[2]}` +
    (conBase ? "" : "  ·  base vacía (sin base/base.json)")));
}

main().catch((err) => { console.error("✘ " + err.message); process.exit(1); });
