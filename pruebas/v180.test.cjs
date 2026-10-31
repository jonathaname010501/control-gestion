// Pruebas de la 1.8.0: apartar números, notas de seguimiento, deshacer un
// cambio en lote, enlace directo a un registro (QR del volante) y lo que la
// página necesita para «lo de siempre».
const { test, assert, preparar, alta, entrar, nuevoOficio, testBase } = require("./comun.cjs");

const bitacora = (e) => { const h = e.hoja("Bitacora"); return h.datos.slice(1).filter(Boolean).map((f) => ({ fecha: f[0], usuario: f[1], accion: f[2], id: f[3], detalle: f[4] })); };
const ANIO = new Date().getFullYear();

/* ── Apartar números ─────────────────────────────────────────────── */

test("apartar: números seguidos con su número oficial, sin asunto, «Pendiente» y en la Bitácora", () => {
  const e = preparar({ conBase: false });
  const cap = alta(e, "beto", "captura", ["OFS", "OFE"]);
  const o1 = e.api(cap, "guardar", nuevoOficio()).datos.registro;
  const r = e.api(cap, "apartar", { tipo: "OFS", cantidad: 3, nota: "Para la reunión del jueves" });
  assert.equal(r.ok, true, JSON.stringify(r));
  const a = r.datos;
  assert.equal(a.cuantos, 3);
  assert.deepEqual(a.registros.map((x) => x.consecutivo), [o1.consecutivo + 1, o1.consecutivo + 2, o1.consecutivo + 3]);
  assert.equal(a.desde, a.registros[0].numero);
  assert.match(a.desde, new RegExp("/" + String(o1.consecutivo + 1).padStart(3, "0") + "/" + ANIO + "$"));
  for (const x of a.registros) {
    assert.equal(x.asunto, "");
    assert.equal(x.estatus, "Pendiente");
    assert.equal(x.creado_por, "beto");
    assert.match(x.obs, /Número apartado por Persona beto el .*: Para la reunión del jueves/);
  }
  const bit = bitacora(e).filter((b) => b.accion === "apartado");
  assert.equal(bit.length, 4, "uno por número y un resumen");
  // el siguiente oficio normal sigue después de los apartados
  const o2 = e.api(cap, "guardar", nuevoOficio()).datos.registro;
  assert.equal(o2.consecutivo, o1.consecutivo + 4);
  assert.equal(e.candado.tomado, false);
});

test("apartar: solo oficios salientes, de 1 a 20, quien captura y con acceso a la libreta", () => {
  const e = preparar({ conBase: false });
  const cap = alta(e, "beto", "captura", ["OFE"]);
  const con = alta(e, "carla", "consulta", "*");
  assert.equal(e.api(e.admin, "apartar", { tipo: "OFE" }).codigo, "DATOS");
  assert.equal(e.api(e.admin, "apartar", { tipo: "OFS", cantidad: 21 }).codigo, "DATOS");
  assert.equal(e.api(e.admin, "apartar", { tipo: "OFS", cantidad: 0 }).codigo, "DATOS");
  assert.equal(e.api(e.admin, "apartar", { tipo: "OFS", nota: "x".repeat(301) }).codigo, "DATOS");
  assert.equal(e.api(cap, "apartar", { tipo: "OFS" }).codigo, "PERMISO", "sin acceso a la libreta");
  assert.equal(e.api(con, "apartar", { tipo: "OFS" }).codigo, "PERMISO", "consulta no aparta");
  assert.ok(e.api(e.admin, "inicio").datos.acciones.includes("apartar"));
  assert.ok(!e.api(con, "inicio").datos.acciones.includes("apartar"));
  assert.equal(e.api(e.admin, "apartar", { tipo: "OFS" }).datos.cuantos, 1, "por omisión, uno");
});

test("apartados por completar: el portal los cuenta (y los míos aparte); al ponerles asunto dejan de contar", () => {
  const e = preparar({ conBase: false });
  const cap = alta(e, "beto", "captura", ["OFS"]);
  const ana = alta(e, "ana", "captura", ["OFS"]);
  const mios = e.api(cap, "apartar", { tipo: "OFS", cantidad: 2 }).datos.registros;
  e.api(ana, "apartar", { tipo: "OFS" });
  let ind = e.api(cap, "indicadores").datos;
  assert.equal(ind.porTipo.OFS.porCompletar, 3);
  assert.equal(ind.mios.apartados, 2);
  // completar uno: Editar con asunto (la fecha ya viene del apartado)
  const reg = e.api(cap, "obtener", { id: mios[0].id }).datos.registro;
  const g = e.api(cap, "guardar", { ...nuevoOficio({ fecha: reg.fecha }), id: reg.id, version: reg.version, estatus: "" });
  assert.equal(g.ok, true, JSON.stringify(g));
  assert.equal(g.datos.registro.numero, reg.numero, "conserva su número");
  ind = e.api(cap, "indicadores").datos;
  assert.equal(ind.porTipo.OFS.porCompletar, 2);
  assert.equal(ind.mios.apartados, 1);
  // un administrador cancela el que no se usó: deja de contar
  const otro = e.api(e.admin, "obtener", { id: mios[1].id }).datos.registro;
  e.api(e.admin, "cancelar", { id: otro.id, version: otro.version, motivo: "No se usó el número" });
  assert.equal(e.api(cap, "indicadores").datos.mios.apartados, 0);
});

/* ── Notas de seguimiento ────────────────────────────────────────── */

test("notas: quedan en la Bitácora con autor; el detalle las trae aparte con el nombre", () => {
  const e = preparar({ conBase: false });
  const cap = alta(e, "beto", "captura", ["OFE"]);
  const ent = e.api(cap, "guardar", { tipo: "OFE", asunto: "Solicitud", fecha: "2026-10-01" }).datos.registro;
  const r = e.api(cap, "agregarNota", { id: ent.id, texto: "  Se llamó al enlace; piden prórroga al viernes.  " });
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.datos.notas.length, 1);
  assert.equal(r.datos.notas[0].texto, "Se llamó al enlace; piden prórroga al viernes.");
  assert.equal(r.datos.notas[0].nombre, "Persona beto");
  e.api(e.admin, "agregarNota", { id: ent.id, texto: "Prórroga autorizada." });
  const d = e.api(cap, "obtener", { id: ent.id }).datos;
  assert.deepEqual(d.notas.map((n) => n.texto), ["Prórroga autorizada.", "Se llamó al enlace; piden prórroga al viernes."], "la más reciente primero");
  assert.equal(d.registro.version, ent.version, "una nota no cambia el registro (no estorba a quien lo edita)");
  // también llegan al guardar (el panel se actualiza sin otra vuelta)
  const g = e.api(cap, "guardar", { tipo: "OFE", id: ent.id, version: ent.version, asunto: "Solicitud (corregida)", fecha: "2026-10-01" }).datos;
  assert.equal(g.detalle.notas.length, 2);
  // un texto que parece fórmula se guarda y se ve como texto (la hoja no lo evalúa)
  const f = e.api(cap, "agregarNota", { id: ent.id, texto: "=HYPERLINK(\"x\")" }).datos;
  assert.equal(f.notas[0].texto, "=HYPERLINK(\"x\")");
});

test("notas: consulta solo en lo que le turnaron; nada en libretas ajenas, cancelados ni textos vacíos o enormes", () => {
  const e = preparar({ conBase: false });
  const cap = alta(e, "beto", "captura", ["OFE"]);
  const con = alta(e, "carla", "consulta", ["OFE"]);
  const ajeno = alta(e, "dani", "captura", ["OFS"]);
  const a = e.api(cap, "guardar", { tipo: "OFE", asunto: "Uno", fecha: "2026-10-01" }).datos.registro;
  const b = e.api(cap, "guardar", { tipo: "OFE", asunto: "Dos", fecha: "2026-10-01", turnado_usuario: "carla" }).datos.registro;
  assert.equal(e.api(con, "agregarNota", { id: a.id, texto: "No es mío" }).codigo, "PERMISO");
  assert.equal(e.api(con, "agregarNota", { id: b.id, texto: "Ya lo estoy viendo" }).ok, true);
  assert.equal(e.api(ajeno, "agregarNota", { id: a.id, texto: "Hola" }).codigo, "PERMISO");
  assert.equal(e.api(cap, "agregarNota", { id: a.id, texto: " " }).codigo, "DATOS");
  assert.equal(e.api(cap, "agregarNota", { id: a.id, texto: "x".repeat(1001) }).codigo, "DATOS");
  assert.equal(e.api(cap, "agregarNota", { id: "no-existe", texto: "Hola" }).codigo, "NO_EXISTE");
  e.api(e.admin, "cancelar", { id: a.id, version: a.version, motivo: "Se capturó dos veces" });
  assert.equal(e.api(cap, "agregarNota", { id: a.id, texto: "Hola" }).codigo, "PERMISO");
  assert.equal(e.api(e.admin, "agregarNota", { id: a.id, texto: "Nota del administrador" }).ok, true);
  assert.equal(e.candado.tomado, false);
});

/* ── Deshacer un cambio en lote ──────────────────────────────────── */

test("deshacer: regresa estatus, fecha de atención y turno como estaban, sin mandar correos", () => {
  const e = preparar({ conBase: false });
  let cap = alta(e, "beto", "captura", ["OFE"]);
  alta(e, "dora", "captura", ["OFE"]);
  e.api(e.admin, "guardarUsuario", { usuario: "dora", nombre: "Dora Díaz", rol: "captura", tipos: ["OFE"], correo: "dora@ejemplo.mx" });
  e.api(e.admin, "guardarConfig", { avisos_correo: "SI" });
  const a = e.api(cap, "guardar", { tipo: "OFE", asunto: "A", fecha: "2026-10-01", estatus: "Pendiente" }).datos.registro;
  const b = e.api(cap, "guardar", { tipo: "OFE", asunto: "B", fecha: "2026-10-01", estatus: "Concluido" }).datos.registro;
  const fechaB = e.api(cap, "obtener", { id: b.id }).datos.registro.fecha_atencion;
  assert.ok(fechaB);
  e.reloj.offset += 3 * 86400000;   // tres días después (la sesión venció: se vuelve a entrar)
  cap = entrar(e, "beto");
  const l = e.api(cap, "guardarLote", { ids: [a.id, b.id], cambios: { estatus: "En trámite" } }).datos;
  assert.equal(l.cambiados, 2);
  assert.match(l.deshacer, /^[a-f0-9]{32}$/);
  const d = e.api(cap, "deshacerLote", { clave: l.deshacer });
  assert.equal(d.ok, true, JSON.stringify(d));
  assert.equal(d.datos.restaurados, 2);
  const ra = e.api(cap, "obtener", { id: a.id }).datos.registro, rb = e.api(cap, "obtener", { id: b.id }).datos.registro;
  assert.equal(ra.estatus, "Pendiente");
  assert.equal(ra.fecha_atencion, "");
  assert.equal(rb.estatus, "Concluido");
  assert.equal(rb.fecha_atencion, fechaB, "la fecha de atención original, no la de hoy");
  assert.notEqual(fechaB, e.ctx.Utilities.formatDate(new Date(Date.now() + e.reloj.offset), "America/Mexico_City", "yyyy-MM-dd"));
  assert.ok(bitacora(e).some((x) => x.accion === "edición" && /\(deshecho\)/.test(x.detalle)));
  assert.ok(bitacora(e).some((x) => x.accion === "deshacer"));
  // una sola vez
  assert.equal(e.api(cap, "deshacerLote", { clave: l.deshacer }).codigo, "DATOS");
  // turno: deshacer no avisa a nadie
  const t = e.api(cap, "guardarLote", { ids: [a.id], cambios: { turnado_usuario: "dora" } }).datos;
  assert.equal(e.estado.correos.length, 1, "al turnar sí se avisa");
  e.api(cap, "deshacerLote", { clave: t.deshacer });
  assert.equal(e.estado.correos.length, 1, "al deshacer no");
  assert.equal(e.api(cap, "obtener", { id: a.id }).datos.registro.turnado_usuario, "");
  assert.equal(e.candado.tomado, false);
});

test("deshacer: solo quien lo hizo, solo lo que nadie volvió a tocar, y vence a los 10 minutos", () => {
  const e = preparar({ conBase: false });
  const cap = alta(e, "beto", "captura", ["OFE"]);
  const ana = alta(e, "ana", "captura", ["OFE"]);
  const a = e.api(cap, "guardar", { tipo: "OFE", asunto: "A", fecha: "2026-10-01" }).datos.registro;
  const b = e.api(cap, "guardar", { tipo: "OFE", asunto: "B", fecha: "2026-10-01" }).datos.registro;
  const l = e.api(cap, "guardarLote", { ids: [a.id, b.id], cambios: { acuse: "SI" } }).datos;
  assert.equal(e.api(ana, "deshacerLote", { clave: l.deshacer }).codigo, "PERMISO", "otra persona no");
  // mientras tanto alguien edita «b»: ese no se toca
  const vb = e.api(ana, "obtener", { id: b.id }).datos.registro;
  e.api(ana, "guardar", { tipo: "OFE", id: b.id, version: vb.version, asunto: "B editado", fecha: "2026-10-01", acuse: "SI" });
  const d = e.api(cap, "deshacerLote", { clave: l.deshacer }).datos;
  assert.equal(d.restaurados, 1);
  assert.equal(d.omitidos[0].motivo, "alguien lo volvió a cambiar");
  assert.equal(e.api(cap, "obtener", { id: a.id }).datos.registro.acuse, "NO");
  assert.equal(e.api(cap, "obtener", { id: b.id }).datos.registro.acuse, "SI");
  // vence
  const l2 = e.api(cap, "guardarLote", { ids: [a.id], cambios: { acuse: "SI" } }).datos;
  e.reloj.offset += 11 * 60 * 1000;
  assert.equal(e.api(cap, "deshacerLote", { clave: l2.deshacer }).codigo, "DATOS");
  assert.equal(e.api(cap, "deshacerLote", { clave: "../../algo" }).codigo, "DATOS");
  const con = alta(e, "carla", "consulta", "*");
  assert.equal(e.api(con, "deshacerLote", { clave: l2.deshacer }).codigo, "PERMISO");
});

/* ── Enlace directo (QR del volante) y datos para la página ──────── */

test("enlace directo: con Vercel configurado, /exec?r=ID lleva a #/r/ID; un ID raro se ignora", () => {
  const e = preparar({ conBase: false });
  e.api(e.admin, "guardarConfig", { url_web: "https://control.ejemplo.mx/" });
  const con = e.run("doGet", { parameter: { r: "r0123456789abcdef" } }).html;
  assert.match(con, /href="https:\/\/control\.ejemplo\.mx\/#\/r\/r0123456789abcdef"/);
  const raro = e.run("doGet", { parameter: { r: "\"><script>alert(1)</script>" } }).html;
  assert.doesNotMatch(raro, /<script>alert/);
  assert.match(raro, /href="https:\/\/control\.ejemplo\.mx\/"/);
  assert.equal(e.api(e.admin, "inicio").datos.config.url_app, "https://control.ejemplo.mx/");
});

test("sin Vercel, la dirección para el QR es la /exec; las listas traen quién capturó (para «lo de siempre»)", () => {
  const e = preparar({ conBase: false });
  e.estado.url = "https://script.google.com/macros/s/AKfycbPRUEBA/exec";
  assert.equal(e.api(e.admin, "inicio").datos.config.url_app, "https://script.google.com/macros/s/AKfycbPRUEBA/exec");
  assert.match(e.run("doGet", { parameter: { r: "r1" } }).html, /Esta es la dirección del servidor/, "sin dirección pública, dice qué es (la app ya no vive aquí)");
  const cap = alta(e, "beto", "captura", ["OFS"]);
  e.api(cap, "guardar", nuevoOficio());
  const lista = e.api(cap, "listar", { tipo: "OFS" }).datos;
  assert.equal(lista[0].creado_por, "beto");
});

test("versión 1.9.0 del servidor; la página sigue funcionando con un servidor 1.8.0", () => {
  const e = preparar({ conBase: false });
  assert.equal(e.api(e.admin, "inicio").datos.version, "1.9.0");
  const app = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "web", "app", "01-nucleo.js"), "utf8");
  assert.match(app, /var SERVIDOR_MINIMO = '1\.8\.0';/, "1.9.0 no cambió nada que use la página");
  assert.match(app, /var NOVEDADES = '1\.8\.0';/, "no hay novedades nuevas para la gente: no vuelve a salir «Qué hay de nuevo»");
});

testBase("con la base real: los números apartados en el minutario (411 a 415) cuentan como «por completar»", () => {
  const e = preparar();
  const ind = e.api(e.admin, "indicadores").datos;
  assert.ok(ind.porTipo.OFS.porCompletar >= 5, String(ind.porTipo.OFS.porCompletar));
  assert.equal(ind.mios.apartados, 0, "no los apartó el administrador");
});

test("correo de turno: con un solo asunto, el botón abre ese registro (Vercel o /exec)", () => {
  const e = preparar({ conBase: false });
  const cap = alta(e, "beto", "captura", ["OFE"]);
  alta(e, "dora", "captura", ["OFE"]);
  e.api(e.admin, "guardarUsuario", { usuario: "dora", nombre: "Dora Díaz", rol: "captura", tipos: ["OFE"], correo: "dora@ejemplo.mx" });
  e.api(e.admin, "guardarConfig", { avisos_correo: "SI", url_web: "https://control.ejemplo.mx" });
  const a = e.api(cap, "guardar", { tipo: "OFE", asunto: "A", fecha: "2026-10-01", estatus: "Pendiente", turnado_usuario: "dora" }).datos.registro;
  const c1 = e.estado.correos.at(-1);
  assert.match(c1.htmlBody, new RegExp('href="https://control\\.ejemplo\\.mx/#/r/' + a.id + '"'));
  assert.match(c1.htmlBody, /Abrir el asunto/);
  // Sin Vercel: la URL /exec con ?r=
  e.api(e.admin, "guardarConfig", { url_web: "" });
  e.estado.url = "https://script.google.com/macros/s/AKfycbPRUEBA/exec";
  const b = e.api(cap, "guardar", { tipo: "OFE", asunto: "B", fecha: "2026-10-01", estatus: "Pendiente", turnado_usuario: "dora" }).datos.registro;
  assert.match(e.estado.correos.at(-1).htmlBody, new RegExp('href="https://script\\.google\\.com/macros/s/AKfycbPRUEBA/exec\\?r=' + b.id + '"'));
  // Varios asuntos a la vez: el botón abre la app (no uno solo)
  const c = e.api(cap, "guardar", { tipo: "OFE", asunto: "C", fecha: "2026-10-01", estatus: "Pendiente" }).datos.registro;
  const d = e.api(cap, "guardar", { tipo: "OFE", asunto: "D", fecha: "2026-10-01", estatus: "Pendiente" }).datos.registro;
  e.api(cap, "guardarLote", { ids: [c.id, d.id], cambios: { turnado_usuario: "dora" } });
  const varios = e.estado.correos.at(-1);
  assert.match(varios.subject, /Te turnaron 2 asuntos/);
  assert.doesNotMatch(varios.htmlBody, /\?r=|#\/r\//);
});
