// ════════════════════════════════════════════════════════════════════════
//  armar-web.mjs · Arma la página para Vercel (dist/) a partir de web/.
//  Vercel lo corre solo en cada git push (vercel.json → buildCommand):
//  normalmente no tienes que correrlo tú.
//
//   CG_API_URL=https://script.google.com/macros/s/XXXX/exec  node herramientas/armar-web.mjs
//
//  Qué hace:
//   · app.js     = los archivos de web/app/ juntos, en orden de número (01, 02… 99),
//                  dentro de UNA función: comparten variables como un solo archivo.
//   · config.js  = window.CG_API, la URL /exec de Apps Script (variable CG_API_URL).
//   · Lo demás de web/ (index.html, estilos.css, excel.js, íconos, manifest) se copia.
//   · A cada archivo que nombra index.html le pone ?v=<huella>, para que nadie se
//     quede con la versión vieja guardada en su navegador.
//
//  Si un archivo de web/app/ tiene un error de escritura (una llave o una coma de
//  más), se detiene y dice cuál y en qué renglón. En Vercel la versión anterior
//  sigue publicada hasta que se corrija.
// ════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(RAIZ, "dist");

const huella = (s) => createHash("sha256").update(s).digest("hex").slice(0, 10);

class ErrorPagina extends Error {}
const falla = (m) => { throw new ErrorPagina(m); };

/** Revisa que un archivo de web/app/ esté bien escrito; si no, dice dónde. */
function revisarSintaxis(nombre, src) {
  try {
    new vm.Script("(function () {'use strict';\n" + src + "\n})", { filename: "web/app/" + nombre, lineOffset: -1 });
  } catch (e) {
    const donde = (String(e.stack || "").match(/^web\/app\/[^\n]+:\d+/m) || ["web/app/" + nombre])[0];
    falla(`${donde}: ${e.message}\n  Revisa ese renglón (y el de arriba): suele ser una llave, un paréntesis o una coma.`);
  }
}

/** Arma la página. Devuelve { "index.html": texto, "app.js": texto, "icono-32.png": Buffer, … }.
 *  (o.carpeta: otra carpeta en vez de web/, para las pruebas) */
export function armarPagina(api, o = {}) {
  const WEB = o.carpeta || join(RAIZ, "web");
  const PARTES = join(WEB, "app");
  // 1. app.js: las partes de web/app/, en orden de número
  const nombres = readdirSync(PARTES).filter((n) => n.endsWith(".js")).sort();
  const sinNumero = nombres.filter((n) => !/^\d+-[\w-]+\.js$/.test(n));
  if (sinNumero.length) falla(`En web/app/ cada archivo empieza con su número, y el nombre lleva solo letras sin acentos, números y guiones (por ejemplo 10-reportes.js): ${sinNumero.join(", ")}`);
  if (!nombres.length) falla("web/app/ está vacía.");
  const partes = nombres.map((n) => {
    const src = readFileSync(join(PARTES, n), "utf8").replace(/^﻿/, "");
    if (/^\s*<script>|<\/script>\s*$/.test(src)) falla(`web/app/${n}: quítale las etiquetas <script> y </script> (aquí va solo el código).`);
    revisarSintaxis(n, src);
    return `/* ── web/app/${n} ── */\n` + src.replace(/\s*$/, "\n");
  });
  const app = "(function () {\n'use strict';\n" + partes.join("\n") + "})();\n";
  try { new vm.Script(app, { filename: "app.js" }); } catch (e) { falla("Las partes de web/app/ no encajan juntas: " + e.message + "\n  (¿una variable declarada dos veces con let o const?)"); }

  // 2. Lo demás de web/ tal cual, y config.js
  const archivos = {};
  for (const n of readdirSync(WEB)) {
    if (n === "app" || n.startsWith(".") || !statSync(join(WEB, n)).isFile()) continue;
    archivos[n] = /\.(html|css|js|webmanifest|svg)$/.test(n) ? readFileSync(join(WEB, n), "utf8") : readFileSync(join(WEB, n));
  }
  if (archivos["app.js"] || archivos["config.js"]) falla("web/app.js y web/config.js se generan solos: bórralos de web/.");
  archivos["app.js"] = app;
  archivos["config.js"] = `// Generado por armar-web.mjs: dirección del servidor (Apps Script)\nwindow.CG_API = ${JSON.stringify(api)};\n`;

  // 3. index.html: sin código en línea (la seguridad de vercel.json no lo deja correr)
  let html = archivos["index.html"];
  if (!html) falla("Falta web/index.html");
  const sinComentarios = html.replace(/<!--[\s\S]*?-->/g, "");
  if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(sinComentarios) || /<style\b/i.test(sinComentarios) || /\son[a-z]+\s*=/i.test(sinComentarios)) {
    falla("web/index.html no puede llevar <script> ni <style> con código adentro, ni onclick=…: ponlo en web/app/ o en web/estilos.css.");
  }
  for (const n of ["estilos.css", "excel.js", "config.js", "app.js"]) {
    if (!new RegExp(`(src|href)="${n.replace(".", "\\.")}"`).test(sinComentarios)) falla(`web/index.html debe cargar ${n}`);
  }
  // ?v=huella en cada archivo propio que nombra la página (los comentarios son para quien la edita: no se publican)
  html = sinComentarios.replace(/\n\s*\n/g, "\n").replace(/\b(src|href)="([\w.-]+)"/g, (todo, attr, n) => (archivos[n] !== undefined ? `${attr}="${n}?v=${huella(archivos[n])}"` : todo));
  archivos["index.html"] = html;
  return archivos;
}

/* ── Cuando se corre directo (Vercel, npm run web) ── */
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const api = (process.env.CG_API_URL || "").trim();
  const local = process.env.CG_PERMITIR_LOCAL === "1";
  const valida = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(api) || (local && /^http:\/\/localhost:\d+\/exec$/.test(api));
  if (!valida) {
    console.error(
      "\n✘ Falta CG_API_URL o no es válida.\n" +
        "  Debe ser la URL de la aplicación web de Apps Script, la que termina en /exec:\n" +
        "  https://script.google.com/macros/s/AKfy…/exec\n" +
        "  En Vercel: Settings → Environment Variables → CG_API_URL\n"
    );
    process.exit(1);
  }
  let archivos;
  try { archivos = armarPagina(api); } catch (e) {
    if (!(e instanceof ErrorPagina)) throw e;
    console.error("\n✘ " + e.message + "\n");
    process.exit(1);
  }
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  for (const [n, c] of Object.entries(archivos)) writeFileSync(join(DIST, n), c);
  console.log(`✔ dist/ listo (${Object.keys(archivos).length} archivos) · servidor: ${api}`);
}
