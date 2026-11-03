// Pruebas de la 1.10.0: se retira el rol «Consulta»; Informes y Directorio solo para administradores;
// Oficios salientes con datos obligatorios, un solo escaneo (que ya lleva el acuse) y el filtro «Sin archivo».
// (Lo de Informes y Directorio para Captura también se revisa en mejoras.test.cjs.)
const fs = require("node:fs");
const path = require("node:path");
const { test, assert, preparar, alta, entrar, nuevoOficio, filasDe, PDF } = require("./comun.cjs");

const bitacora = (e) => { const h = e.hoja("Bitacora"); return h.datos.slice(1).filter(Boolean).map((f) => ({ fecha: f[0], usuario: f[1], accion: f[2], id: f[3], detalle: f[4] })); };
const leer = (...ruta) => fs.readFileSync(path.join(__dirname, "..", ...ruta), "utf8");
/** Escribe a mano en la hoja (como si fuera un dato de antes de esta versión). */
function tocar(e, hoja, buscar, columna, valor) {
  const h = e.hoja(hoja), col = h.datos[0].indexOf(columna);
  assert.ok(col >= 0, "columna " + columna);
  const fila = h.datos.findIndex((f, i) => i > 0 && f && buscar(f, h.datos[0]));
  assert.ok(fila > 0, "fila para " + columna);
  h.datos[fila][col] = valor;
}
const nuevoTelon = (e, extra) => e.api(e.admin, "guardar", nuevoOficio(extra)).datos.registro;

/* ── Rol «Consulta» retirado ─────────────────────────────────────── */

test("rol Consulta retirado: no se puede asignar; quien lo conserva en la hoja no entra, no recibe turnos y un administrador lo reasigna", () => {
  const e = preparar({ conBase: false });
  for (const rol of ["consulta", "", "constructor"]) {
    const r = e.api(e.admin, "guardarUsuario", { nuevo: true, usuario: "carla", nombre: "Persona carla", rol, tipos: ["OFE"] });
    assert.equal(r.codigo, "DATOS", "rol «" + rol + "»");
  }
  assert.deepEqual(Object.keys(e.api(e.admin, "inicio").datos.roles), ["admin", "captura"]);

  // Alguien que ya lo tenía en la hoja (creado antes de la 1.10.0)
  const carla = alta(e, "carla", "captura", ["OFE"]);
  tocar(e, "Usuarios", (f) => f[0] === "carla", "rol", "consulta");
  assert.equal(e.api(carla, "inicio").codigo, "SESION", "su sesión abierta se cierra");
  const ent = e.api(null, "entrar", { usuario: "carla", clave: "Ahuehuete2026x" });
  assert.equal(ent.codigo, "SIN_ROL");
  assert.match(ent.error, /rol/);
  const lista = e.api(e.admin, "usuarios").datos;
  assert.equal(lista.find((u) => u.usuario === "carla").sinRol, true, "la lista de Usuarios lo marca");
  assert.equal(lista.find((u) => u.usuario === "admin").sinRol, false);

  // No se le puede turnar nada ni sale en la lista para turnar
  assert.ok(!e.api(e.admin, "usuariosTurno", { tipo: "OFE" }).datos.some((u) => u.usuario === "carla"));
  const ofe = e.api(e.admin, "guardar", { tipo: "OFE", asunto: "Entrante de prueba", fecha: "2026-10-21", estatus: "Pendiente" }).datos.registro;
  const turno = e.api(e.admin, "guardar", { ...ofe, tipo: "OFE", turnado_usuario: "carla" });
  assert.equal(turno.codigo, "DATOS");
  assert.match(turno.error, /no tiene un rol asignado/);

  // Sin rol no se queda en la hoja «por accidente»: el administrador tiene que elegir uno
  assert.equal(e.api(e.admin, "guardarUsuario", { usuario: "carla", nombre: "Persona carla", tipos: ["OFE"] }).codigo, "DATOS");
  assert.equal(e.api(e.admin, "guardarUsuario", { usuario: "carla", nombre: "Persona carla", rol: "captura", tipos: ["OFE"] }).ok, true);
  assert.equal(e.api(null, "entrar", { usuario: "carla", clave: "Ahuehuete2026x" }).ok, true, "ya con rol, entra");
  assert.match(bitacora(e).filter((b) => b.accion === "usuarios").at(-1).detalle, /consulta\/OFE\/SI → captura\/OFE\/SI/);
});

test("rol Consulta retirado: no recibe el resumen diario por correo (y quien sí tiene rol, sigue recibiéndolo)", () => {
  const e = preparar({ conBase: false });
  alta(e, "dora", "captura", ["OFE"]);
  alta(e, "carla", "captura", ["OFE"]);
  for (const [u, n] of [["dora", "Dora Díaz"], ["carla", "Carla Cruz"]]) {
    e.api(e.admin, "guardarUsuario", { usuario: u, nombre: n, rol: "captura", tipos: ["OFE"], correo: u + "@ejemplo.mx" });
  }
  e.api(e.admin, "guardarConfig", { avisos_correo: "SI" });
  // que «hoy» (en la Ciudad de México) sea un miércoles
  const diaMx = (ms) => ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 })[new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", weekday: "short" }).format(new Date(ms))];
  e.reloj.offset += ((3 - diaMx(Date.now() + e.reloj.offset) + 7) % 7) * 86400000;
  const iso = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date(Date.now() + e.reloj.offset + d * 86400000));
  e.admin = entrar(e, "admin", "Jacaranda2026x");   // con el reloj adelantado, la sesión anterior ya venció
  for (const u of ["dora", "carla"]) {
    const g = e.api(e.admin, "guardar", { tipo: "OFE", asunto: "Vencido de " + u, fecha: iso(-10), fecha_limite: iso(-2), estatus: "Pendiente", turnado_usuario: u });
    assert.equal(g.ok, true, JSON.stringify(g));
  }
  tocar(e, "Usuarios", (f) => f[0] === "carla", "rol", "consulta");   // quedó con el rol que ya no existe
  e.estado.correos = [];
  assert.match(e.disparar("avisosDiarios"), /Avisos enviados: 1/);
  assert.ok(e.estado.correos.some((c) => c.to === "dora@ejemplo.mx"), "a quien tiene rol, sí");
  assert.ok(!e.estado.correos.some((c) => c.to === "carla@ejemplo.mx"), "a quien no tiene rol, no");
});

/* ── Datos obligatorios en Oficios salientes ─────────────────────── */

test("Oficios salientes: dirigido, asunto, fecha, firma, elaboró y carpeta son obligatorios; Observaciones y las demás libretas no", () => {
  const e = preparar({ conBase: false });
  const filas = filasDe(e, "Registros");
  for (const [campo, nombre] of [["dirigido_a", "Dirigido a"], ["firma", "Firma"], ["elaboro", "Revisó / Elaboró"], ["carpeta", "No. de carpeta"]]) {
    for (const vacio of ["", "   "]) {
      const r = e.api(e.admin, "guardar", nuevoOficio({ [campo]: vacio }));
      assert.equal(r.codigo, "DATOS", campo + " «" + vacio + "»");
      assert.ok(r.error.includes("Faltan datos obligatorios: " + nombre + "."), r.error);
    }
  }
  const varios = e.api(e.admin, "guardar", nuevoOficio({ firma: "", carpeta: "" }));
  assert.ok(varios.error.includes("Firma, No. de carpeta"), "los junta todos: " + varios.error);
  assert.equal(e.api(e.admin, "guardar", nuevoOficio({ asunto: "" })).codigo, "DATOS");
  assert.equal(e.api(e.admin, "guardar", nuevoOficio({ fecha: "" })).codigo, "DATOS");
  assert.equal(filasDe(e, "Registros"), filas, "ninguno de los intentos fallidos escribió algo");

  // Observaciones puede ir vacío, y también el acuse (casilla) y el seguimiento
  const ok = e.api(e.admin, "guardar", nuevoOficio({ observaciones: "", acuse: "NO", estatus: "" }));
  assert.equal(ok.ok, true, JSON.stringify(ok));
  // Las demás libretas siguen pidiendo solo asunto y fecha
  for (const tipo of ["OFE", "OFC", "CIR", "TAR", "VOL"]) {
    const r = e.api(e.admin, "guardar", { tipo, asunto: "Solo asunto y fecha", fecha: "2026-10-21" });
    assert.equal(r.ok, true, tipo + " " + JSON.stringify(r));
  }
});

test("Oficios salientes obligatorios: también al duplicar y con varios destinatarios; apartar sigue sin pedir nada y se exige al completar", () => {
  const e = preparar({ conBase: false });
  const filas = filasDe(e, "Registros");
  const dest = [{ dirigido_id: "", dirigido_a: "Persona Uno" }, { dirigido_id: "", dirigido_a: "Persona Dos" }];
  const comun = { tipo: "OFS", asunto: "Varios", fecha: "2026-10-21", firma: "Lic. X", elaboro: "VJ", carpeta: "C-01", acuse: "NO", destinatarios: dest };
  for (const quitar of ["firma", "elaboro", "carpeta"]) {
    const r = e.api(e.admin, "guardarVarios", { ...comun, [quitar]: "" });
    assert.equal(r.codigo, "DATOS", quitar);
    assert.match(r.error, /Faltan datos obligatorios/);
    assert.match(e.api(e.admin, "guardarVarios", { ...comun, [quitar]: "", previa: true }).error, /Faltan datos obligatorios/, "ya la vista previa lo avisa");
  }
  assert.equal(filasDe(e, "Registros"), filas, "los intentos fallidos no escribieron nada");
  const prev = e.api(e.admin, "guardarVarios", { ...comun, previa: true });
  assert.equal(prev.ok, true, JSON.stringify(prev));
  const guardado = e.api(e.admin, "guardarVarios", { ...comun, desde: prev.datos.consecutivoDesde });
  assert.equal(guardado.ok, true, "completo sí se guarda: " + JSON.stringify(guardado));

  // Apartar: reserva el número sin datos
  const ap = e.api(e.admin, "apartar", { tipo: "OFS", cantidad: 1 });
  assert.equal(ap.ok, true, JSON.stringify(ap));
  const apartado = e.api(e.admin, "obtener", { id: ap.datos.registros[0].id }).datos.registro;   // como la página: abre el registro y lo completa
  assert.equal(apartado.asunto, "", "se apartó un número sin datos");
  // …y al completarlo se pide todo: con solo el asunto, no
  const poco = e.api(e.admin, "guardar", { ...apartado, tipo: "OFS", asunto: "Ya lo tengo", fecha: "2026-10-21" });
  assert.equal(poco.codigo, "DATOS");
  assert.match(poco.error, /Faltan datos obligatorios: Dirigido a, Firma, Revisó \/ Elaboró, No\. de carpeta\./);
  const completo = e.api(e.admin, "guardar", { ...apartado, tipo: "OFS", asunto: "Ya lo tengo", fecha: "2026-10-21",
    dirigido_a: "Persona Uno", firma: "Lic. X", elaboro: "VJ", carpeta: "C-02" });
  assert.equal(completo.ok, true, JSON.stringify(completo));
});

test("Oficios salientes obligatorios: un registro viejo incompleto se puede seguir editando, pero no se vacía lo que ya tenía", () => {
  const e = preparar({ conBase: false });
  let r = nuevoTelon(e);
  // Como los migrados del Excel: sin carpeta y sin quién elaboró
  tocar(e, "Registros", (f) => f[0] === r.id, "carpeta", "");
  tocar(e, "Registros", (f) => f[0] === r.id, "elaboro", "");

  // Cambiar el asunto sin llenar lo que ya faltaba: se puede
  let g = e.api(e.admin, "guardar", { ...r, asunto: "Asunto corregido", carpeta: "", elaboro: "" });
  assert.equal(g.ok, true, JSON.stringify(g));
  r = g.datos.registro;
  assert.equal(r.asunto, "Asunto corregido");
  // Pero no se puede vaciar lo que sí tenía
  for (const campo of ["firma", "dirigido_a"]) {
    const mal = e.api(e.admin, "guardar", { ...r, [campo]: "" });
    assert.equal(mal.codigo, "DATOS", campo);
    assert.match(mal.error, /Faltan datos obligatorios/);
  }
  // Si lo llena, ya cuenta: después no se puede dejar vacío otra vez
  g = e.api(e.admin, "guardar", { ...r, carpeta: "C-09" });
  assert.equal(g.ok, true, JSON.stringify(g));
  r = g.datos.registro;
  assert.equal(e.api(e.admin, "guardar", { ...r, carpeta: "" }).codigo, "DATOS");
  // El asunto y la fecha se piden siempre, también al editar
  assert.equal(e.api(e.admin, "guardar", { ...r, asunto: "" }).codigo, "DATOS");
  // Cambios en lote («Atendido», acuse, turno…) no pasan por esta regla
  const lote = e.api(e.admin, "guardarLote", { ids: [r.id], cambios: { acuse: "SI" } });
  assert.equal(lote.ok, true, JSON.stringify(lote));
});

test("Oficios salientes obligatorios: la lista del servidor y la del formulario de la página son la misma", () => {
  const servidor = leer("apps-script", "Servidor.gs").match(/var OBLIGATORIOS = (\{[^;]*\});/);
  const pagina = leer("web", "app", "07-formulario.js").match(/var OBLIG = (\{[^;]*\});/);
  assert.ok(servidor && pagina, "no encontré alguna de las dos listas");
  const a = new Function("return " + servidor[1])(), b = new Function("return " + pagina[1])();
  assert.deepEqual(a, b, "la página avisa de lo mismo que el servidor exige");
  assert.deepEqual(Object.keys(a), ["OFS"], "solo Oficios salientes");
});

/* ── Un solo escaneo en Oficios salientes (ya lleva el acuse) ────── */

test("Oficios salientes: subir el escaneo marca el acuse solo; en las demás libretas el documento no marca nada y el acuse sí", () => {
  const e = preparar({ conBase: false });
  const cap = alta(e, "beto", "captura", "*");
  const subir = (id, clase, nombre) => e.api(cap, "subirArchivo", { id, clase, nombre, mime: "application/pdf", base64: PDF });

  const r = e.api(cap, "guardar", nuevoOficio()).datos.registro;
  assert.equal(r.acuse, "NO");
  const s = subir(r.id, "oficio", "oficio.pdf");
  assert.equal(s.ok, true, JSON.stringify(s));
  assert.equal(s.datos.registro.tiene_archivo, true);
  assert.equal(s.datos.registro.acuse, "SI", "el escaneo ya lleva el acuse");
  assert.match(bitacora(e).filter((b) => b.accion === "archivo").at(-1).detalle, /oficio\.pdf \(acuse marcado\)/);

  // Si el acuse ya estaba marcado, no se anota otra vez
  const r2 = e.api(cap, "guardar", nuevoOficio({ acuse: "SI" })).datos.registro;
  subir(r2.id, "oficio", "otro.pdf");
  assert.ok(!/acuse marcado/.test(bitacora(e).filter((b) => b.accion === "archivo").at(-1).detalle));

  // Un acuse subido aparte en un oficio saliente (de antes de la 1.10.0) sigue funcionando: ni se rechaza ni se pierde
  const r3 = e.api(cap, "guardar", nuevoOficio()).datos.registro;
  const viejo = subir(r3.id, "acuse", "acuse-viejo.pdf");
  assert.equal(viejo.ok, true);
  assert.equal(viejo.datos.registro.tiene_acuse_archivo, true);
  assert.equal(viejo.datos.registro.acuse, "SI");
  assert.equal(e.api(cap, "descargarArchivo", { id: r3.id, clase: "acuse" }).ok, true);

  // Entrantes: el documento escaneado NO marca el «original»; el acuse sí
  const ofe = e.api(cap, "guardar", { tipo: "OFE", asunto: "Entrante", fecha: "2026-10-21" }).datos.registro;
  assert.equal(subir(ofe.id, "oficio", "e.pdf").datos.registro.acuse, "NO");
  assert.equal(subir(ofe.id, "acuse", "ea.pdf").datos.registro.acuse, "SI");
});

/* ── Indicador y filtro «Sin archivo» ────────────────────────────── */

test("«Sin archivo»: cuenta salientes sin ningún escaneo; no cancelados ni apartados; un acuse subido aparte cuenta como archivo", () => {
  const e = preparar({ conBase: false });
  const cap = alta(e, "beto", "captura", ["OFS", "OFE"]);
  const cuenta = (t = "OFS") => e.api(cap, "inicio").datos.indicadores.porTipo[t].sinArchivo;
  const subir = (id, clase) => e.api(cap, "subirArchivo", { id, clase, nombre: "x.pdf", mime: "application/pdf", base64: PDF });

  const a = e.api(cap, "guardar", nuevoOficio({ asunto: "A" })).datos.registro;
  const b = e.api(cap, "guardar", nuevoOficio({ asunto: "B" })).datos.registro;
  const c = e.api(cap, "guardar", nuevoOficio({ asunto: "C", acuse: "SI" })).datos.registro;   // casilla marcada, sin escaneo
  assert.equal(cuenta(), 3, "los tres sin archivo (también el que tiene la casilla marcada)");
  assert.equal(e.api(cap, "inicio").datos.indicadores.porTipo.OFS.sinAcuse, 2, "«sin acuse» mira la casilla; «sin archivo» mira el escaneo");

  subir(a.id, "oficio");
  assert.equal(cuenta(), 2);
  subir(b.id, "acuse");   // un acuse subido aparte también cuenta como archivo
  assert.equal(cuenta(), 1);
  assert.equal(cuenta("OFE"), 0, "solo aplica a Oficios salientes");

  // Cancelados y números apartados no cuentan
  assert.equal(e.api(e.admin, "cancelar", { id: c.id, version: c.version, motivo: "Se capturó dos veces" }).ok, true);
  assert.equal(cuenta(), 0, "cancelado");
  e.api(cap, "apartar", { tipo: "OFS", cantidad: 2 });
  assert.equal(cuenta(), 0, "apartados sin completar");
  // Una entrante sin archivo no mueve el contador de salientes
  e.api(cap, "guardar", { tipo: "OFE", asunto: "Entrante", fecha: "2026-10-21" });
  assert.equal(cuenta(), 0);
});

test("«Sin archivo» respeta la fecha de «Sin acuse cuenta desde» de Configuración", () => {
  const e = preparar({ conBase: false });
  const cuenta = () => e.api(e.admin, "inicio").datos.indicadores.porTipo.OFS.sinArchivo;
  nuevoTelon(e, { asunto: "Viejo", fecha: "2026-01-15" });
  nuevoTelon(e, { asunto: "Nuevo", fecha: "2026-10-21" });
  assert.equal(cuenta(), 2, "sin fecha de corte, cuentan todos");
  assert.equal(e.api(e.admin, "guardarConfig", { acuse_desde: "2026-06-01" }).ok, true);
  assert.equal(cuenta(), 1, "con corte, solo lo posterior");
  assert.equal(e.api(e.admin, "guardarConfig", { acuse_desde: "2099-01-01" }).ok, true);
  assert.equal(cuenta(), 0);
});

/* ── Lo que la página debe respetar (revisión de código) ─────────── */

test("la página: Directorio e Informes solo para administradores, un solo archivo en salientes y novedades de la versión", () => {
  const portal = leer("web", "app", "04-portal.js");
  assert.match(portal, /\['usuarios', 'bitacora', 'config', 'exportacion', 'directorio', 'informes'\]\.indexOf\(k\) >= 0 && !esAdmin\(\)/, "la ruta se cierra aunque escriban la dirección a mano");
  assert.match(portal, /concat\(esAdmin\(\) \? \[\{ titulo: 'Directorio'/, "la tarjeta de Directorio");
  assert.match(portal, /esAdmin\(\) && tiene\('informes'\)/, "la tarjeta de Informes");
  assert.match(portal, /sin archivo/, "aviso en la tarjeta de Oficios salientes");
  const form = leer("web", "app", "07-formulario.js");
  assert.match(form, /var fAcu = t === 'OFS' \? null : selectorArchivo/, "en salientes el formulario no pide un acuse aparte");
  const det = leer("web", "app", "06-detalle.js");
  assert.match(det, /t !== 'OFS' \|\| r\.tiene_acuse_archivo/, "en salientes solo se ve el acuse viejo si existe");
  const usuarios = leer("web", "app", "09-admin.js");
  assert.ok(!/Puede ver Informes/.test(usuarios), "ya no hay casilla de Informes");
  assert.ok(!/consulta:/.test(usuarios), "ya no se describe el rol Consulta");
  const libreta = leer("web", "app", "05-libreta.js");
  assert.match(libreta, /\(sinarchivo\)/, "filtro «Sin archivo»");
});
