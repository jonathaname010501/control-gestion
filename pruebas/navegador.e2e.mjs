// ════════════════════════════════════════════════════════════════════════
//  navegador.e2e.mjs · Recorrido en un navegador real (Playwright) de lo
//  nuevo en 1.7.0 y 1.8.0, con la CSP de Vercel (la página ya no vive en Apps Script).
//
//    npm run e2e
//
//  Necesita base/base.json (datos reales: no está en GitHub) y Playwright
//  (npm i -D playwright  y  npx playwright install chromium).
//  Deja las capturas y el resultado en capturas/<versión>/ (no van a GitHub).
// ════════════════════════════════════════════════════════════════════════
import { spawn, spawnSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = (readFileSync(join(RAIZ, "apps-script", "Servidor.gs"), "utf8").match(/var VERSION = '([^']+)'/) || [, "x"])[1];
const SALIDA = join(RAIZ, "capturas", VERSION);
const P_SRV = 4391, P_WEB = 4392;
const require = createRequire(import.meta.url);

let playwright;
try { playwright = require("playwright"); } catch {
  console.error("Falta Playwright:  npm i -D playwright  y luego  npx playwright install chromium");
  process.exit(1);
}
if (!existsSync(join(RAIZ, "base", "base.json"))) { console.error("Falta base/base.json (los datos migrados)."); process.exit(1); }
mkdirSync(SALIDA, { recursive: true });

/* ── servidores locales ── */
const hijos = [];
function arrancar(args, listo) {
  return new Promise((ok, mal) => {
    const p = spawn(process.execPath, args, { cwd: RAIZ, env: { ...process.env } });
    hijos.push(p);
    let txt = "";
    const t = setTimeout(() => mal(new Error("No arrancó: " + args.join(" ") + "\n" + txt)), 30000);
    p.stdout.on("data", (d) => { txt += d; if (listo.test(txt)) { clearTimeout(t); ok(txt); } });
    p.stderr.on("data", (d) => { txt += d; });
    p.on("exit", (c) => { if (c) { clearTimeout(t); mal(new Error(args.join(" ") + " salió con " + c + "\n" + txt)); } });
  });
}
const armado = spawnSync(process.execPath, ["herramientas/armar-web.mjs"], { cwd: RAIZ, encoding: "utf8",
  env: { ...process.env, CG_PERMITIR_LOCAL: "1", CG_API_URL: `http://localhost:${P_SRV}/exec` } });
if (armado.status !== 0) { console.error(armado.stdout + armado.stderr); process.exit(1); }
await arrancar(["pruebas/servidor-local.cjs", String(P_SRV)], /admin: /);
await arrancar(["pruebas/web-local.cjs", String(P_WEB), `http://localhost:${P_SRV}`], /dist\/ en/);
const admin = await (await fetch(`http://localhost:${P_SRV}/__admin`)).json();

/* ── código de la app de autenticación (RFC 6238), sin repetir intervalos ── */
let ultimoPaso = 0;
function base32(s) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; let bits = "";
  for (const c of s.replace(/[\s=]/g, "").toUpperCase()) bits += A.indexOf(c).toString(2).padStart(5, "0");
  return Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
}
function totp(secreto, paso) {
  const m = Buffer.alloc(8); m.writeBigUInt64BE(BigInt(paso));
  const hm = createHmac("sha1", base32(secreto)).update(m).digest(), o = hm[19] & 15;
  return String(((hm.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, "0");
}
async function codigoNuevo(secreto) {
  // El servidor acepta el intervalo actual ±1 y nunca uno ya usado.
  let ahora = Math.floor(Date.now() / 30000);
  let paso = Math.max(ahora, ultimoPaso + 1);
  while (paso > ahora + 1) { await new Promise((r) => setTimeout(r, 1000)); ahora = Math.floor(Date.now() / 30000); }
  ultimoPaso = paso;
  return totp(secreto, paso);
}

/* ── recorrido ── */
const resultado = [];
let fallas = 0;
async function paso(nombre, f) {
  try { const extra = await f(); resultado.push("✔ " + nombre + (extra ? ": " + extra : "")); console.log("✔ " + nombre + (extra ? ": " + extra : "")); }
  catch (e) { fallas++; resultado.push("✘ " + nombre + ": " + e.message.split("\n")[0]); console.log("✘ " + nombre + "\n  " + e.message); throw e; }
}
function esperar(c, m) { if (!c) throw new Error(m); }

const navegador = await playwright.chromium.launch();
const errores = [];
function vigilar(pagina, donde) {
  pagina.on("pageerror", (e) => errores.push(donde + " · error de JavaScript: " + e.message));
  pagina.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) errores.push(donde + " · CSP: " + m.text()); });
}
const foto = async (p, n, o = {}) => { await p.waitForTimeout(350); return p.screenshot({ path: join(SALIDA, n), ...o }); };   // sin animaciones a medias
const NUEVA = "Jacaranda2026x";
/** La ventana de Ayuda sale sola una vez por versión (y por equipo): se cierra si aparece. */
async function cerrarAyuda(pg) {
  const m = pg.locator(".modal", { hasText: "Qué hay de nuevo" });
  try { await m.waitFor({ timeout: 4000 }); } catch { return false; }
  await m.getByRole("button", { name: "Entendido" }).click();
  await m.waitFor({ state: "detached" });
  return true;
}
/** Suelta un archivo sobre un elemento (como arrastrarlo desde una carpeta). */
async function soltar(loc, nombre, mime, bytes, soloEncima) {
  await loc.evaluate((el, a) => {
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array(a.bytes)], a.nombre, { type: a.mime }));
    for (const tipo of a.soloEncima ? ["dragenter", "dragover"] : ["dragenter", "dragover", "drop"]) el.dispatchEvent(new DragEvent(tipo, { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, { nombre, mime, bytes: Array.from(bytes), soloEncima: !!soloEncima });
}
const hoyMx = () => new Date(Date.now() - 6 * 3600000).toISOString().slice(0, 10);
const masDias = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
let secreto = "";

try {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 }, locale: "es-MX", acceptDownloads: true });
  const p = await ctx.newPage();
  vigilar(p, "Vercel");
  await p.goto(`http://localhost:${P_WEB}/`);

  await paso("Contraseña nueva: las reglas se ven mientras se escribe y una fácil no pasa", async () => {
    await p.getByPlaceholder("nombre.apellido").fill(admin.usuario);
    await p.locator("input[type=password]").first().fill(admin.clave);
    await p.getByRole("button", { name: "Entrar" }).click();
    await p.getByText("Crea tu contraseña").waitFor();
    const [nueva, repite] = [p.getByPlaceholder("Por ejemplo, una frase corta con números"), p.getByPlaceholder("Escríbela otra vez")];
    await nueva.fill("Gestion2026"); await repite.fill("Gestion2026");
    const fallan = await p.locator("ul.reglas li:not(.ok)").allInnerTexts();
    esperar(fallan.some((t) => /fácil de adivinar/.test(t)), "debía marcar «fácil de adivinar»: " + fallan);
    await foto(p, "01-reglas-clave.png");
    await p.getByRole("button", { name: "Guardar contraseña" }).click();
    await p.getByText(/Le falta: que no sea fácil/).waitFor();
    await nueva.fill(NUEVA); await repite.fill(NUEVA);
    await p.getByRole("button", { name: "Guardar contraseña" }).click();
    await p.locator(".ptarjeta").first().waitFor();
    return fallan.length + " reglas sin cumplir con «Gestion2026»";
  });

  await paso("Ayuda: la primera vez salen los primeros pasos, y en otra pestaña lo nuevo de esta versión", async () => {
    const m = p.locator(".modal", { hasText: "Primeros pasos" });
    await m.waitFor({ timeout: 5000 });
    esperar(await m.locator(".guia__tab.activa").innerText() === "Primeros pasos", "debía abrir en «Primeros pasos»");
    await foto(p, "20-ayuda-primeros-pasos.png");
    await m.getByRole("tab", { name: "Qué hay de nuevo" }).click();
    const n = await m.locator(".guia__i").count();
    esperar(n >= 6, "pocas novedades: " + n);
    await foto(p, "21-ayuda-novedades.png");
    await m.getByRole("button", { name: "Entendido" }).click();
    await m.waitFor({ state: "detached" });
    return n + " novedades para el administrador";
  });

  await paso("Portal del administrador: recomienda poner plazo y activar dos pasos", async () => {
    await p.getByText("Los entrantes no tienen plazo de respuesta.").waitFor();
    await p.getByText("Protege tu cuenta de administrador.").waitFor();
    await foto(p, "02-portal-recomendaciones.png");
  });

  await paso("Activar la verificación en dos pasos con el código QR", async () => {
    await p.locator(".alerta--accion", { hasText: "Protege tu cuenta" }).getByRole("button", { name: "Activar" }).click();
    await p.locator(".dospasos__qr svg").waitFor();
    secreto = (await p.locator(".dospasos__clave code").innerText()).replace(/\s/g, "");
    esperar(/^[A-Z2-7]{32}$/.test(secreto), "clave rara: " + secreto);
    await p.locator(".dospasos__qr svg").screenshot({ path: join(SALIDA, "qr.png") });
    await foto(p, "03-activar-dos-pasos.png");
    // ¿Lo lee un lector real? (si hay Python con OpenCV)
    const py = ["python3", "python"].find((x) => spawnSync(x, ["-c", "import cv2"]).status === 0);
    let leido = "sin OpenCV";
    if (py) {
      const r = spawnSync(py, ["-I", "-c", "import sys,cv2\nimg=cv2.imread(sys.argv[1]);img=cv2.resize(img,None,fx=3,fy=3,interpolation=cv2.INTER_NEAREST)\nprint(cv2.QRCodeDetector().detectAndDecode(img)[0])", join(SALIDA, "qr.png")], { encoding: "utf8" });
      leido = r.stdout.trim();
      esperar(leido.startsWith("otpauth://totp/") && leido.includes("secret=" + secreto), "OpenCV leyó: " + leido);
    }
    rmSync(join(SALIDA, "qr.png"), { force: true });   // era solo para leerlo
    await p.getByLabel("Código que muestra la app").fill(await codigoNuevo(secreto));
    await p.locator(".dospasos input[type=password]").fill(NUEVA);
    await p.getByRole("button", { name: "Activar" }).last().click();
    await p.getByText("Protege tu cuenta de administrador.").waitFor({ state: "detached" });
    return py ? "OpenCV leyó el QR de la pantalla" : leido;
  });

  await paso("Mi cuenta: estado de dos pasos, correo y equipo; el foco no se sale de la ventana", async () => {
    await p.getByRole("button", { name: "Mi cuenta" }).click();
    const modal = p.locator(".modal").last();
    await modal.getByText("✓ Activada").waitFor();
    for (let i = 0; i < 12; i++) await p.keyboard.press("Tab");
    const dentro = await p.evaluate(() => !!document.activeElement.closest(".modal"));
    esperar(dentro, "el Tab sacó el foco de la ventana");
    await modal.getByPlaceholder("nombre@dominio.mx").fill("persona@ejemplo.mx");
    await modal.getByRole("button", { name: "Guardar" }).click();
    await p.getByText("Correo guardado.").waitFor();
    await foto(p, "04-mi-cuenta.png");
    await p.keyboard.press("Escape");
    await modal.waitFor({ state: "detached" });
    const foco = await p.evaluate(() => document.activeElement && document.activeElement.className);
    esperar(/pcab__cuenta/.test(foco), "el foco debía volver a «Mi cuenta»: " + foco);
  });

  await paso("Configuración: plazo, días inhábiles de ley, «sin acuse» desde y dos pasos obligatorio", async () => {
    await p.locator(".alerta--accion", { hasText: "plazo" }).getByRole("button", { name: "Configurar" }).click();
    await p.getByLabel("Días inhábiles", { exact: true }).waitFor();
    await p.getByLabel(/Plazo de respuesta/).fill("10");
    await p.getByRole("button", { name: /Agregar los de ley de 2026/ }).click();
    await p.getByLabel("«Sin acuse» cuenta desde").fill("2026-01-01");
    await p.getByLabel("Obligatoria para administradores").check();
    await p.getByRole("button", { name: "Guardar" }).first().click();
    await p.getByText("Configuración guardada.").waitFor();
    const dias = await p.getByLabel("Días inhábiles", { exact: true }).inputValue();
    esperar(dias.includes("2026-04-02") && dias.includes("2026-04-03") && dias.includes("2026-12-25") && dias.includes("2026-11-16"), "faltan festivos: " + dias);
    await foto(p, "05-configuracion.png", { fullPage: true });
    return dias.split("\n").length + " días (Jueves y Viernes Santo 2 y 3 de abril)";
  });

  await paso("Salir y entrar con código, recordando este equipo", async () => {
    await p.locator(".mcab__volver").click();
    await p.getByRole("button", { name: "Cerrar sesión" }).click();
    await p.getByRole("button", { name: "Entrar" }).waitFor();
    await p.getByPlaceholder("nombre.apellido").fill(admin.usuario);
    await p.locator("input[type=password]").first().fill(NUEVA);
    await p.getByLabel("Recordar mi usuario en este equipo").check();
    await p.getByRole("button", { name: "Entrar" }).click();
    await p.getByText("Tu contraseña es correcta. Falta un paso.").waitFor();
    await foto(p, "06-codigo.png");
    await p.getByLabel("Código de 6 dígitos").fill(await codigoNuevo(secreto));
    await p.getByRole("button", { name: "Verificar" }).click();
    await p.locator(".ptarjeta").first().waitFor();
    const equipo = JSON.parse(await p.evaluate(() => localStorage.getItem("cg_equipo") || "{}"));
    esperar(equipo.u === admin.usuario && /^[\w=-]+\.[\w-]{43}=?$/.test(equipo.t || ""), "no guardó el equipo de confianza: " + JSON.stringify(equipo));
  });

  await paso("Libreta: elegir varios y marcar el acuse de una vez", async () => {
    await p.locator(".ptarjeta", { hasText: "Oficios salientes" }).click();
    await p.getByRole("button", { name: "Seleccionar" }).click();
    const casillas = p.locator("tbody .sel__c");
    for (let i = 0; i < 3; i++) await casillas.nth(i).check();
    await p.getByText("3 elegidos").waitFor();
    await foto(p, "07-seleccion.png");
    await p.locator(".lote").getByRole("button", { name: "Acuse" }).click();
    await p.locator(".modal select").selectOption("SI");
    await p.getByRole("button", { name: "Cambiar 3" }).click();
    const listo = p.locator(".aviso", { hasText: /Listo:/ }).last();
    await listo.waitFor();
    const txt = await listo.innerText();
    esperar(/Listo: \d+ registros? cambiado/.test(txt), "aviso: " + txt);
    await foto(p, "08-lote-listo.png");
    return txt.split("\n")[0];
  });

  await paso("Si la sesión se vence con una ventana abierta, se pide la contraseña y el cambio se guarda solo", async () => {
    await p.locator("tbody .sel__c").nth(3).check();
    await p.locator(".lote").getByRole("button", { name: "Estatus" }).click();
    let falsa = true;
    await p.route(`http://localhost:${P_SRV}/exec`, (ruta) => {
      const cuerpo = ruta.request().postData() || "";
      if (falsa && cuerpo.includes('"accion":"guardarLote"')) {
        falsa = false;
        return ruta.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ ok: false, codigo: "SESION", error: "Tu sesión terminó por inactividad." }) });
      }
      return ruta.continue();
    });
    await p.getByRole("button", { name: "Cambiar 1" }).click();
    const re = p.locator(".modal", { hasText: "Tu sesión terminó" });
    await re.waitFor();
    esperar(await p.locator(".modal", { hasText: "Cambiar el estatus" }).count() === 1, "la ventana del cambio se cerró");
    await re.locator("input[type=password]").fill(NUEVA);
    await re.getByRole("button", { name: "Volver a entrar" }).click();
    await re.getByLabel("Código de 6 dígitos").waitFor();
    await foto(p, "09-reautenticar.png");
    await re.getByLabel("Código de 6 dígitos").fill(await codigoNuevo(secreto));
    await re.getByRole("button", { name: "Volver a entrar" }).click();
    await p.getByText(/Listo: 1 registro cambiado/).waitFor();
    await p.unroute(`http://localhost:${P_SRV}/exec`);
    await p.locator(".lote").getByRole("button", { name: "Terminar" }).click();
    await p.locator(".lote").waitFor({ state: "detached" });
  });

  await paso("Ver el escaneo sin salir: PDF en un marco (CSP con blob:) e imagen", async () => {
    await p.locator("tbody tr").first().click();
    const panel = p.locator(".panel");
    await panel.waitFor();
    const pdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
    await panel.locator("input[type=file][accept^='.pdf']").first().setInputFiles({ name: "oficio-prueba.pdf", mimeType: "application/pdf", buffer: pdf });
    await p.getByText("Archivo guardado.").waitFor();
    await panel.getByRole("button", { name: "Abrir" }).first().click();
    const prev = p.locator(".modal", { has: p.locator(".previa") });
    await prev.locator(".previa__pdf").waitFor();
    esperar(/^blob:/.test(await prev.locator(".previa__pdf").getAttribute("src")), "el marco no usa blob:");
    await p.waitForTimeout(600);
    await foto(p, "10-ver-pdf.png");
    await prev.getByRole("button", { name: "Descargar" }).waitFor();
    await p.keyboard.press("Escape");
    await prev.waitFor({ state: "detached" });
    const png = Buffer.from(readFileSync(join(RAIZ, "web", "icono-192.png")));
    await panel.locator("input[type=file][accept^='.pdf']").nth(1).setInputFiles({ name: "acuse.png", mimeType: "image/png", buffer: png });
    await p.getByText("Archivo guardado.").last().waitFor();
    await panel.getByRole("button", { name: "Abrir" }).nth(1).click();
    await p.locator(".previa__img").waitFor();
    const ancho = await p.locator(".previa__img").evaluate((i) => i.naturalWidth);
    esperar(ancho === 192, "la imagen no cargó (ancho " + ancho + ")");
    await foto(p, "11-ver-imagen.png");
    await p.keyboard.press("Escape");
  });

  await paso("Usuarios: correo, etiqueta «Dos pasos» y opción para quitarla", async () => {
    await p.keyboard.press("Escape");
    await p.locator(".mcab__volver").click();
    await p.locator(".ptarjeta", { hasText: "Usuarios" }).click();
    const fila = p.locator("tr, .item", { hasText: admin.usuario }).first();
    await fila.getByText("Dos pasos").waitFor();
    await fila.getByRole("button", { name: /Editar/ }).click();
    await p.getByLabel(/Quitar su verificación en dos pasos/).waitFor();
    esperar(await p.getByLabel(/Correo para avisos/).inputValue() === "persona@ejemplo.mx", "no trae el correo");
    await foto(p, "12-usuario.png");
    await p.getByRole("button", { name: "Cancelar" }).click();
  });

  await paso("Celular: portal y «Mi cuenta» caben en la pantalla", async () => {
    const cel = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "es-MX" });
    const c = await cel.newPage();
    vigilar(c, "celular");
    await c.goto(`http://localhost:${P_WEB}/`);
    await c.getByPlaceholder("nombre.apellido").fill(admin.usuario);
    await c.locator("input[type=password]").first().fill(NUEVA);
    await c.getByRole("button", { name: "Entrar" }).click();
    await c.getByLabel("Código de 6 dígitos").fill(await codigoNuevo(secreto));
    await c.getByRole("button", { name: "Verificar" }).click();
    await c.locator(".ptarjeta").first().waitFor();
    await cerrarAyuda(c);
    const desborde = await c.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    esperar(desborde <= 0, "la página se sale " + desborde + " px a lo ancho");
    await foto(c, "13-celular-portal.png");
    await c.getByRole("button", { name: "Mi cuenta" }).click();
    await c.locator(".modal").getByText("✓ Activada").waitFor();
    await foto(c, "14-celular-mi-cuenta.png");
    await cel.close();
  });

  await paso("La URL de Google (/exec) ya no trae la app: solo dice dónde está", async () => {
    const gas = await navegador.newContext({ viewport: { width: 1280, height: 860 }, locale: "es-MX" });
    const g = await gas.newPage();
    await g.goto(`http://localhost:${P_SRV}/exec`);
    await g.getByText("Control de Gestión").first().waitFor();
    esperar(!(await g.locator("#app").count()), "la URL de Google volvió a armar la app");
    await foto(g, "15-url-de-google.png");
    await gas.close();
  });

  /* ═══ 1.8.0 ═══ */
  await paso("Apartar números: salen al instante, quedan «por completar» y el portal lo recuerda", async () => {
    await p.locator(".mcab__volver").click().catch(() => {});
    await p.locator(".ptarjeta", { hasText: "Oficios salientes" }).click();
    await p.getByRole("button", { name: "Apartar número" }).click();
    const m = p.locator(".modal", { hasText: "Apartar número" });
    await m.getByLabel("¿Cuántos números?").fill("2");
    await m.getByLabel("Para qué (opcional)").fill("respuestas a la Alcaldía");
    await foto(p, "22-apartar.png");
    await m.getByRole("button", { name: "Apartar", exact: true }).click();
    const r = p.locator(".modal", { hasText: "números apartados" });
    await r.waitFor();
    const txt = await r.locator(".alerta").innerText();
    esperar(/SAPCI\/STPI\/\d{3}\/\d{4}.*SAPCI\/STPI\/\d{3}\/\d{4}/.test(txt), "rango raro: " + txt);
    await foto(p, "23-apartados.png");
    await r.getByRole("button", { name: "Listo" }).click();
    const ind = p.locator(".ind", { hasText: "Por completar" });
    await ind.click();
    await p.locator("tbody .ins--completar").first().waitFor();
    await foto(p, "24-por-completar.png");
    await p.locator(".mcab__volver").click();
    await p.getByText(/Tienes 2 números apartados por completar/).waitFor();
    return txt.replace(/\s+/g, " ");
  });

  await paso("Completar un número apartado desde su detalle", async () => {
    await p.getByText(/Tienes 2 números apartados por completar/).click();
    await p.locator("tbody tr", { has: p.locator(".ins--completar") }).first().click();
    const panel = p.locator(".panel");
    await panel.getByText("Número apartado.").waitFor();
    await panel.getByRole("button", { name: "Completar" }).first().click();
    const f = p.locator(".modal", { hasText: "Completar oficio saliente" });
    await f.getByText(/Número apartado\. Captura el asunto/).waitFor();
    await foto(p, "25-completar.png");
    await f.locator("textarea").first().fill("Respuesta a la solicitud de la Alcaldía sobre jornadas de paz");
    await f.getByRole("button", { name: "Guardar cambios" }).click();
    await p.getByText(/^Guardado: Oficio saliente/).waitFor();
    await panel.getByText("Número apartado.").waitFor({ state: "detached" });
    await p.keyboard.press("Escape");
  });

  await paso("«Lo de siempre» y «Guardar y capturar otro»", async () => {
    await p.getByRole("button", { name: /Nuevo oficio saliente/ }).click();
    let f = p.locator(".modal", { hasText: "Nuevo oficio saliente" });
    await f.locator("textarea").first().fill("Invitación a la mesa de trabajo de octubre");
    await f.getByRole("button", { name: "Guardar y capturar otro" }).click();
    await p.getByText(/^Registrado: Oficio saliente/).waitFor();
    f = p.locator(".modal", { hasText: "Nuevo oficio saliente" });
    await f.waitFor();
    esperar(await f.locator("textarea").first().inputValue() === "", "el segundo formulario debía salir limpio");
    const nota = await f.locator(".nota-siempre").innerText().catch(() => "");
    esperar(/como en tu último registro/.test(nota), "sin «lo de siempre»: " + nota);
    await foto(p, "26-lo-de-siempre.png");
    await f.getByRole("button", { name: "Cancelar" }).click();
    return nota;
  });

  await paso("Ordenar por columna y recordar el filtro de cada libreta", async () => {
    await p.getByRole("button", { name: "Ordenar por asunto" }).click();
    esperar(await p.locator("th[aria-sort='ascending']").innerText() !== "", "sin columna ordenada");
    const asuntos = await p.locator("tbody .t-asunto").evaluateAll((td) => td.slice(0, 8).map((x) => x.firstChild ? x.firstChild.textContent.trim() : ""));
    const ordenados = asuntos.filter(Boolean);
    esperar(ordenados.join("|") === ordenados.slice().sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base", numeric: true })).join("|"), "no quedó en orden: " + ordenados.slice(0, 4));
    await p.getByLabel("Estatus", { exact: true }).selectOption("(activos)");
    await p.locator(".mcab__volver").click();
    await p.locator(".ptarjeta", { hasText: "Oficios salientes" }).click();
    esperar(await p.getByLabel("Estatus", { exact: true }).inputValue() === "(activos)", "no recordó el filtro");
    esperar(await p.locator("th[aria-sort='ascending']").count() === 1, "no recordó el orden");
    await p.getByRole("button", { name: "Quitar filtros" }).waitFor();
    await foto(p, "27-orden-y-filtros.png");
    await p.getByRole("button", { name: "Quitar filtros" }).click();
    esperar(await p.getByLabel("Estatus", { exact: true }).inputValue() === "", "no quitó el filtro");
    await p.getByRole("button", { name: "Ordenar por no." }).click();   // regresa al orden de siempre (más recientes primero)
    esperar(/^No\./.test(await p.locator("th[aria-sort='descending']").innerText()), "no regresó al orden de siempre");
  });

  await paso("Notas de seguimiento en el detalle", async () => {
    await p.locator("tbody tr").nth(2).click();
    const panel = p.locator(".panel");
    await panel.getByText("Notas de seguimiento").waitFor();
    await panel.getByLabel("Nota nueva").fill("Se llamó al enlace de la Alcaldía; enviarán la información el viernes.");
    await panel.getByRole("button", { name: "Agregar nota" }).click();
    await panel.locator(".nota", { hasText: "enviarán la información el viernes" }).waitFor();
    await panel.locator(".nota__cab", { hasText: "Administrador" }).waitFor();
    await panel.locator(".nota").scrollIntoViewIfNeeded();
    await foto(p, "28-notas.png");
  });

  await paso("Soltar el escaneo sobre el registro (arrastrar desde la computadora)", async () => {
    const panel = p.locator(".panel");
    const bloque = panel.locator(".archivo").first();
    const pdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
    await bloque.scrollIntoViewIfNeeded();
    await soltar(bloque, "arrastrado.pdf", "application/pdf", pdf, true);
    esperar(await bloque.evaluate((el) => el.classList.contains("soltar--activo")), "no se marcó la zona al pasar el archivo");
    await foto(p, "29-soltar.png");
    await soltar(bloque, "arrastrado.pdf", "application/pdf", pdf);
    await p.getByText("Archivo guardado.").last().waitFor();
    await panel.locator(".archivo.tiene", { hasText: "arrastrado.pdf" }).waitFor();
    await soltar(panel.locator(".archivo").nth(1), "notas.txt", "text/plain", Buffer.from("hola"));
    await p.getByText("Solo se aceptan PDF, JPG o PNG.").waitFor();
    await p.keyboard.press("Escape");
  });

  let idEntrante = "";
  await paso("Calendario: lo que vence cada día, con días inhábiles", async () => {
    await p.locator(".mcab__volver").click();
    await p.locator(".ptarjeta", { hasText: "Oficios salientes" }).click();
    await p.getByLabel("Estatus", { exact: true }).selectOption("(activos)");   // que sigan abiertos (el calendario muestra lo abierto)
    await p.getByRole("button", { name: "Seleccionar" }).click();
    for (let i = 0; i < 2; i++) await p.locator("tbody .sel__c").nth(i).check();
    await p.locator(".lote").getByRole("button", { name: "Fecha límite" }).click();
    const limite = masDias(hoyMx(), 2);
    await p.locator(".modal input[type=date]").fill(limite);
    await p.getByRole("button", { name: "Cambiar 2" }).click();
    await p.locator(".aviso", { hasText: /Listo: 2 registros/ }).waitFor();
    await p.locator(".lote").getByRole("button", { name: "Terminar" }).click();
    await p.getByRole("button", { name: "Quitar filtros" }).click();
    await p.locator(".mcab__volver").click();
    await p.locator(".ptarjeta", { hasText: "Calendario" }).click();
    await p.locator(".cal__rejilla").waitFor();
    if (limite.slice(0, 7) !== hoyMx().slice(0, 7)) await p.getByRole("button", { name: "Mes siguiente" }).click();
    const celda = p.locator(".cal__dia").filter({ has: p.locator(".cal__num", { hasText: new RegExp("^" + Number(limite.slice(8)) + "$") }) });
    await celda.click();
    const lista = p.locator(".cal__lista .pend__i");
    esperar(await lista.count() >= 2, "el día no trae los 2 asuntos");
    esperar(await p.locator(".cal__dia--inhabil").count() >= 8, "faltan fines de semana marcados");
    await foto(p, "30-calendario.png", { fullPage: true });
    return (await lista.count()) + " asuntos el " + limite;
  });

  await paso("«Atendido» en un toque y «Deshacer»", async () => {
    const antes = await p.locator(".cal__lista .pend__i").count();
    await p.locator(".cal__lista").getByRole("button", { name: /como atendido/ }).first().click();
    const av = p.locator(".aviso", { hasText: /^Atendido:/ });
    await av.waitFor();
    await foto(p, "31-atendido-deshacer.png");
    await p.waitForFunction((n) => document.querySelectorAll(".cal__lista .pend__i").length === n - 1, antes);
    await av.getByRole("button", { name: "Deshacer" }).click();
    await p.locator(".aviso", { hasText: /se deshizo el cambio/ }).waitFor();
    await p.waitForFunction((n) => document.querySelectorAll(".cal__lista .pend__i").length === n, antes, { timeout: 15000 });
    await p.locator(".mcab__volver").click();
    await p.locator(".ptarjeta", { hasText: "Pendientes" }).click();
    await p.locator(".pend .btn--atender").first().waitFor();
  });

  await paso("Volante con código QR que abre el registro", async () => {
    await p.locator(".mcab__volver").click();
    await p.locator(".ptarjeta", { hasText: "Oficios entrantes" }).click();
    await p.locator("tbody tr").first().click();
    const panel = p.locator(".panel");
    await panel.getByRole("button", { name: "Imprimir volante" }).click();
    const qr = p.locator(".vol-previa .vol__qr svg");
    await qr.waitFor();
    await foto(p, "32-volante-qr.png");
    // En papel mide 2.1 cm; en la vista previa es chico: se agranda solo para leerlo
    await qr.evaluate((el) => { el.style.width = "330px"; el.style.height = "330px"; });
    await qr.screenshot({ path: join(SALIDA, "qr-volante.png") });
    let leido = "sin OpenCV";
    const py = ["python3", "python"].find((x) => spawnSync(x, ["-c", "import cv2"]).status === 0);
    if (py) {
      const r = spawnSync(py, ["-I", "-c", "import sys,cv2\nimg=cv2.imread(sys.argv[1])\nimg=cv2.copyMakeBorder(img,40,40,40,40,cv2.BORDER_CONSTANT,value=(255,255,255))\nprint(cv2.QRCodeDetector().detectAndDecode(img)[0])", join(SALIDA, "qr-volante.png")], { encoding: "utf8" });
      leido = r.stdout.trim();
      esperar(/(#\/r\/|\?r=)[A-Za-z0-9_-]+$/.test(leido), "el QR dice: " + leido);
      idEntrante = leido.split(/#\/r\/|\?r=/)[1];
    }
    rmSync(join(SALIDA, "qr-volante.png"), { force: true });
    await p.keyboard.press("Escape");
    await p.keyboard.press("Escape");
    return leido;
  });

  await paso("Enlace directo (#/r/ID): después de entrar abre ese registro", async () => {
    if (!idEntrante) return "sin OpenCV: se salta";
    const ctx2 = await navegador.newContext({ viewport: { width: 1280, height: 860 }, locale: "es-MX" });
    const q = await ctx2.newPage();
    vigilar(q, "enlace directo");
    await q.goto(`http://localhost:${P_WEB}/#/r/${idEntrante}`);
    await q.getByPlaceholder("nombre.apellido").fill(admin.usuario);
    await q.locator("input[type=password]").first().fill(NUEVA);
    await q.getByRole("button", { name: "Entrar" }).click();
    await q.getByLabel("Código de 6 dígitos").fill(await codigoNuevo(secreto));
    await q.getByRole("button", { name: "Verificar" }).click();
    await q.locator(".panel").waitFor();
    await foto(q, "33-enlace-directo.png");
    await ctx2.close();
  });

  await paso("Celular: calendario y orden en la libreta", async () => {
    const cel = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "es-MX" });
    const c = await cel.newPage();
    vigilar(c, "celular 1.8.0");
    await c.goto(`http://localhost:${P_WEB}/`);
    await c.getByPlaceholder("nombre.apellido").fill(admin.usuario);
    await c.locator("input[type=password]").first().fill(NUEVA);
    await c.getByRole("button", { name: "Entrar" }).click();
    await c.getByLabel("Código de 6 dígitos").fill(await codigoNuevo(secreto));
    await c.getByRole("button", { name: "Verificar" }).click();
    await c.locator(".ptarjeta").first().waitFor();
    await cerrarAyuda(c);
    await c.locator(".ptarjeta", { hasText: "Calendario" }).click();
    await c.locator(".cal__rejilla").waitFor();
    const desborde = await c.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    esperar(desborde <= 0, "el calendario se sale " + desborde + " px");
    await foto(c, "34-celular-calendario.png", { fullPage: true });
    await c.locator(".mcab__volver").click();
    await c.locator(".ptarjeta", { hasText: "Oficios salientes" }).click();
    await c.getByLabel("Ordenar", { exact: true }).selectOption("asunto:asc");
    await foto(c, "35-celular-orden.png");
    await cel.close();
  });

  await paso("Sin errores de JavaScript ni bloqueos de la CSP", async () => {
    esperar(!errores.length, errores.join("\n"));
  });
} catch (e) {
  if (!fallas) { fallas++; resultado.push("✘ " + e.message.split("\n")[0]); console.log(e); }
} finally {
  writeFileSync(join(SALIDA, "resultado.txt"), resultado.join("\n") + "\n");
  await navegador.close();
  hijos.forEach((h) => h.kill());
}
console.log(fallas ? "\n✘ El recorrido falló." : "\n✔ Recorrido completo. Capturas en capturas/" + VERSION + "/");
process.exit(fallas ? 1 : 0);
