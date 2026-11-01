  /* Control de Gestión · Estructura, rutas, portal y buscador general. Es una parte de la app: se junta con las demás de web/app/ (ver 01-nucleo.js). */
  /* ───────────────────────── Estructura ───────────────────────── */
  // Igual que Gabinetes: al entrar, un PORTAL con tarjetas de color; cada
  // tarjeta abre su propia pantalla, con "← Inicio" arriba.
  var LOGO = 'data:image/png;base64,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';
  var COLOR_TIPO = { OFS: 'morado', OFE: 'verde', OFC: 'azul', CIR: 'guinda', TAR: 'cafe', VOL: 'magenta' };
  var ICONO_TIPO = { OFS: 'enviar', OFE: 'bandeja', OFC: 'conocimiento', CIR: 'megafono', TAR: 'tarjeta', VOL: 'turnar' };
  var DESC_TIPO = {
    OFS: 'Los oficios que firma la Subsecretaría, con número automático.',
    OFE: 'Lo que llega: quién lo manda, a quién se turna y cuándo vence.',
    OFC: 'Copias que llegan solo para conocimiento.',
    CIR: 'Circulares recibidas de otras áreas y dependencias.',
    TAR: 'Tarjetas informativas que entregan las áreas.',
    VOL: 'Volantes de turno de la Secretaría Particular.'
  };
  var MODULOS = {
    misAsuntos: { titulo: 'Mis asuntos', icono: 'diana', color: 'verde', ruta: 'mis-asuntos', accion: 'misAsuntos' },
    informes: { titulo: 'Informes', icono: 'grafica', color: 'cafe', accion: 'informes' },
    pendientes: { titulo: 'Pendientes', icono: 'alarma', color: 'guinda' },
    calendario: { titulo: 'Calendario', icono: 'calendario', color: 'azul' },
    directorio: { titulo: 'Directorio', icono: 'contactos', color: 'azul' },
    usuarios: { titulo: 'Usuarios', icono: 'usuarios', color: 'guinda' },
    bitacora: { titulo: 'Bitácora', icono: 'pulso', color: 'azul' },
    exportacion: { titulo: 'Exportación', icono: 'excel', color: 'verde', accion: 'exportar' },
    config: { titulo: 'Configuración', icono: 'engrane', color: 'morado' }
  };
  // Instalar como app (Chrome/Edge en Android y computadora; en iPhone es
  // Compartir → Agregar a inicio). Solo en la versión publicada en Vercel.
  var promptInstalar = null;
  window.addEventListener('beforeinstallprompt', function (ev) {
    ev.preventDefault();
    promptInstalar = ev;
    if (E.ini && E.vista === 'inicio') irA('inicio', null, { sinHistorial: true });
  });
  window.addEventListener('appinstalled', function () {
    promptInstalar = null;
    aviso('Listo: «Control de Gestión» quedó instalada como app.', 'ok');
  });
  function instalarApp() {
    if (!promptInstalar) return;
    promptInstalar.prompt();
    promptInstalar.userChoice.then(function () { promptInstalar = null; if (E.vista === 'inicio') irA('inicio', null, { sinHistorial: true }); }, function () {});
  }

  function aplicarInicio(ini) {
    olvidarDatos();
    E.ini = ini;
    E.iniT = Date.now();
    E.directorio = ini.directorio;
    if (!E.tipo || ini.orden.indexOf(E.tipo) < 0) E.tipo = ini.orden[0];
    E.anio = E.anio || ini.anioActual;
    montar();
    var desde = leerRuta();
    irA(desde ? desde.vista : 'inicio', desde ? desde.tipo : null, { reemplazar: true });
    vigilarSesion();
    precargar();
    // Enlace directo a un registro (#/r/ID): el código QR del volante y los correos de turno
    var abrirId = desde && desde.abrir;
    if (abrirId) abrirDesdeEnlace(abrirId);
    if (!abrirId) setTimeout(novedadesSiToca, 700);
  }

  function abrirDesdeEnlace(id) {
    abrirDetalle(id).catch(function () {});
  }

  function cargarInicio() {
    return llamar('inicio').then(aplicarInicio).catch(function (e) { if (e.codigo !== 'SESION' && e.codigo !== 'CAMBIAR_CLAVE' && e.codigo !== 'MANTENIMIENTO') pantallaEntrar(e.message); });
  }

  /**
   * Después de entrar, en segundo plano: las listas del año de todas las
   * libretas (en una sola vuelta), luego Pendientes y, si hay algo turnado,
   * Mis asuntos. Así, al abrirlas, ya se ven.
   */
  function precargar() {
    var gen = E.gen, enviado = Date.now();
    var sigue = function () { return gen === E.gen; };
    (tiene('listarTodo') ? llamar('listarTodo', null, { silencioso: true }).then(function (p) {
      if (!sigue() || !p || !p.listas) return;
      Object.keys(p.listas).forEach(function (t) { recibirLista(t, p.anio, p.listas[t], enviado); });
    }) : Promise.resolve()).catch(function () { /* sin red: cada libreta se carga al abrirla */ }).then(function () {
      if (!sigue() || E.pend) return null;
      return llamar('pendientes', null, { silencioso: true }).then(function (p) { if (sigue() && !E.pend) E.pend = { datos: p, firma: JSON.stringify(p) }; });
    }).catch(function () {}).then(function () {
      var mios = E.ini && E.ini.indicadores && E.ini.indicadores.mios;
      if (!sigue() || E.mis || !tiene('misAsuntos') || !(mios && mios.total)) return null;
      return llamar('misAsuntos', null, { silencioso: true }).then(function (m) { if (sigue() && !E.mis) E.mis = { datos: m, firma: JSON.stringify(m) }; });
    }).catch(function () {});
  }

  var principal = null;
  function montar() {
    document.title = 'Control de Gestión';
    principal = h('div', { class: 'raiz', id: 'vista' });
    vaciar(app).appendChild(principal);
  }

  function iniciales(n) {
    var p = String(n || '').trim().split(/\s+/);
    return ((p[0] || '').charAt(0) + (p[1] || '').charAt(0)).toUpperCase() || 'U';
  }

  function salir() { llamar('salir').catch(function () {}).then(function () { terminarSesion('Saliste del sistema.'); }); }

  // Rutas legibles en Vercel (#/oficios-salientes) para que sirva el botón Atrás.
  var SLUG = { OFS: 'oficios-salientes', OFE: 'oficios-entrantes', OFC: 'conocimiento', CIR: 'circulares', TAR: 'tarjetas-informativas', VOL: 'volantes' };
  function rutaDe(v, t) { return '#/' + (v === 'libreta' ? SLUG[t] : v === 'inicio' ? '' : (MODULOS[v] && MODULOS[v].ruta) || v); }
  function leerRuta() {
    var r = String(location.hash || '').replace(/^#\/?/, '');
    if (!r) return null;
    var directo = /^r\/([A-Za-z0-9_-]{1,60})$/.exec(r);
    if (directo) return { vista: 'inicio', abrir: directo[1] };
    for (var t in SLUG) if (SLUG[t] === r && E.ini.orden.indexOf(t) >= 0) return { vista: 'libreta', tipo: t };
    for (var k in MODULOS) {
      var m = MODULOS[k];
      if ((m.ruta || k) !== r) continue;
      if (['usuarios', 'bitacora', 'config', 'exportacion'].indexOf(k) >= 0 && !esAdmin()) return null;
      if (k === 'exportacion' && !exportacionLista()) return null;
      if (m.accion && !tiene(m.accion)) return null;
      return { vista: k };
    }
    return null;
  }
  window.addEventListener('popstate', function () {
    if (!E.ini || !principal) return;
    var d = leerRuta() || { vista: 'inicio' };
    irA(d.vista, d.tipo, { sinHistorial: true });
  });

  var vistas = {};
  /** Filtros y orden que dejó la persona en cada libreta (en este equipo). */
  function filtrosGuardados(tipo) { var f = pref('filtros') || {}; return f[tipo] || {}; }
  function guardarFiltros(tipo, cambios) {
    var f = pref('filtros') || {}, x = f[tipo] || {};
    Object.keys(cambios).forEach(function (k) { if (cambios[k]) x[k] = cambios[k]; else delete x[k]; });
    f[tipo] = x;
    pref('filtros', f);
  }
  function irA(v, tipo, o) {
    o = o || {};
    if (tipo) {
      if (E.filtrosTipo !== tipo) {
        var g = filtrosGuardados(tipo);
        E.filtros = { q: '', estatus: g.estatus || '', acuse: g.acuse || '' }; E.mostrar = 60; E.filtrosTipo = tipo;
      }
      E.tipo = tipo;
    }
    E.vista = v;
    cerrarPanel();
    if (!o.sinHistorial) {
      try { history[o.reemplazar ? 'replaceState' : 'pushState']({}, '', rutaDe(v, E.tipo)); } catch (e) { /* sin historial */ }
    }
    vaciar(principal);
    vistas[v]();
    window.scrollTo(0, 0);
  }

  /** Marco de cada pantalla interna: encabezado con "← Inicio". Devuelve el contenedor. */
  function marco(clave, extra) {
    var yo = E.ini.yo;
    var cont = h('main', { class: 'principal' });
    vaciar(principal).appendChild(h('div', { class: 'modulo modulo--' + (extra && extra.color || (MODULOS[clave] || {}).color || 'morado') },
      h('header', { class: 'mcab' },
        h('button', { class: 'mcab__volver', onclick: function () { irA('inicio'); } }, icono('atras'), h('span', null, 'Inicio')),
        h('button', { class: 'mcab__marca', onclick: function () { irA('inicio'); }, title: 'Ir al inicio' },
          h('img', { src: LOGO, alt: '', width: 28, height: 28 }), h('span', null, 'Control de Gestión')),
        h('div', { class: 'mcab__yo', title: yo.nombre + ' · ' + yo.rolNombre }, h('span', { class: 'avatar' }, iniciales(yo.nombre)), h('span', { class: 'mcab__nombre' }, yo.nombre))),
      cont));
    return cont;
  }

  /* ───────────────────────── Portal (Inicio) ───────────────────────── */
  vistas.inicio = function () {
    var yo = E.ini.yo, ini = E.ini;
    var hora = new Date().getHours();
    var saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
    var fecha = '';
    try { fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { /* sin Intl */ }
    var aviso = h('div');
    var bloques = h('div');
    principal.appendChild(h('div', { class: 'portal' },
      h('header', { class: 'pcab' },
        h('div', { class: 'pcab__marca' }, h('img', { class: 'pcab__logo', src: LOGO, alt: 'Territorios de Paz e Igualdad', width: 42, height: 42 }),
          h('div', { class: 'pcab__txt' }, h('p', { class: 'pcab__org' }, 'Control de Gestión'), h('p', { class: 'pcab__sub' }, encabezadoInst().join(' · ')))),
        h('div', { class: 'pcab__user' },
          promptInstalar ? h('button', { class: 'pcab__instalar', onclick: instalarApp, title: 'Instalar Control de Gestión como app' }, icono('bajar'), 'Instalar app') : null,
          h('span', { class: 'avatar' }, iniciales(yo.nombre)), h('span', { class: 'pcab__nombre' }, yo.nombre), h('span', { class: 'pcab__nivel' }, yo.rolNombre),
          h('button', { class: 'pcab__cuenta', title: 'Cómo se usa y qué hay de nuevo', 'aria-label': 'Ayuda', onclick: function () { mostrarGuia('novedades'); } }, icono('ayuda'), h('span', null, 'Ayuda')),
          h('button', { class: 'pcab__cuenta', title: 'Contraseña, verificación en dos pasos y correo', 'aria-label': 'Mi cuenta', onclick: function () { modalMiCuenta(); } }, icono('llave'), h('span', null, 'Mi cuenta')),
          h('button', { class: 'pcab__salir', onclick: salir }, 'Cerrar sesión'))),
      h('main', { class: 'principal principal--portal' },
        h('section', { class: 'hero' },
          h('p', { class: 'hero__eyebrow' }, 'Portal institucional' + (fecha ? ' · ' + fecha : '')),
          h('h1', { class: 'hero__t' }, saludo + ',', h('br'), yo.nombre),
          h('p', { class: 'hero__s' }, 'Elige por dónde empezar.')),
        tiene('buscar') ? buscadorGeneral() : null,
        aviso, bloques),
      h('footer', { class: 'pie' }, encabezadoInst().slice(1, 2).join('') || 'Control de Gestión')));
    function pintar(ind) {
      vaciar(aviso);
      if (esAdmin() && E.ini.mantenimiento && E.ini.mantenimiento.activo) {
        aviso.appendChild(h('div', { class: 'alerta alerta--mant', style: { marginBottom: '20px' } }, icono('herramienta'),
          h('div', null, h('strong', null, 'Modo mantenimiento activo. '), 'Solo los administradores pueden usar el sistema. Mensaje: «' + E.ini.mantenimiento.mensaje + '» ',
            h('button', { class: 'btn btn--chico', onclick: function () { irA('config'); } }, 'Ir a Configuración'))));
      }
      // Recomendaciones para administradores: sin plazo, los entrantes no vencen nunca
      if (esAdmin() && !Number(E.ini.config.plazo_dias)) {
        aviso.appendChild(h('div', { class: 'alerta alerta--aviso alerta--accion', style: { marginBottom: '20px' } }, icono('alerta'),
          h('div', null, h('strong', null, 'Los entrantes no tienen plazo de respuesta. '),
            'Sin plazo no hay fecha límite, así que «Vencidos», «Mis asuntos» y «Atendido a tiempo» no dicen nada. Pon los días hábiles que suelen tener para contestar.'),
          h('button', { class: 'btn btn--chico', onclick: function () { irA('config'); } }, 'Configurar')));
      }
      if (esAdmin() && tiene('totpIniciar') && !E.ini.yo.dosPasos) {
        aviso.appendChild(h('div', { class: 'alerta alerta--info alerta--accion', style: { marginBottom: '20px' } }, icono('llave'),
          h('div', null, h('strong', null, 'Protege tu cuenta de administrador. '),
            'Activa la verificación en dos pasos: además de la contraseña, te pedirá un código de tu celular.'),
          h('button', { class: 'btn btn--chico', onclick: function () { pantallaActivar2fa(false); } }, 'Activar')));
      }
      if (!servidorAlMenos(SERVIDOR_MINIMO) && esAdmin()) {
        aviso.appendChild(h('div', { class: 'alerta alerta--aviso', style: { marginBottom: '20px' } },
          h('strong', null, 'Falta publicar el servidor. '),
          'Esta página necesita el servidor ' + SERVIDOR_MINIMO + ' o más nuevo y el de Apps Script es el ' + (E.ini.version || 'anterior') +
          '. Corre npm run publicar, o pega los .gs que cambiaron en el editor de Apps Script y ve a Implementar → Gestionar implementaciones → ✏ → Nueva versión.'));
      }
      // Sin «Dirección pública», el código QR, los correos y la URL de Google no saben dónde está la app
      if (esAdmin() && tiene('guardarConfig') && !E.ini.config.url_web && /^https:\/\//.test(location.origin)) {
        var aqui = location.origin + location.pathname.replace(/[^/]*$/, '');
        aviso.appendChild(h('div', { class: 'alerta alerta--info alerta--accion', style: { marginBottom: '20px' } }, icono('flecha'),
          h('div', null, h('strong', null, 'Falta guardar la dirección de la app. '),
            'Así el código QR del volante, los correos y la URL de Google llevan a ' + aqui + '.'),
          h('button', { class: 'btn btn--chico', onclick: function (ev) {
            ev.target.disabled = true;
            llamar('guardarConfig', { url_web: aqui.replace(/\/+$/, '') }).then(function () {
              E.ini.config.url_web = aqui.replace(/\/+$/, '');
              pintar(ind);
            }, function (e) { ev.target.disabled = false; fallo(e); });
          } }, 'Guardar esta dirección')));
      }
      ind = ind && ind.porTipo ? ind : { porTipo: {}, global: { porAtender: 0, vencidos: 0, venceHoy: 0, sinAcuse: 0 } };
      var g = ind.global, mios = ind.mios || null;
      var avisoMio = !!(mios && tiene('misAsuntos') && (mios.vencidos || mios.venceHoy));
      // Si todo lo vencido es de «Mis asuntos», no se repite el aviso general
      var avisoGeneral = (g.vencidos || g.venceHoy) && !(avisoMio && g.vencidos === mios.vencidos && g.venceHoy === mios.venceHoy);
      if (avisoMio) {
        aviso.appendChild(h('button', { class: 'pav pav--mio', onclick: function () { irA('misAsuntos'); } }, icono('diana'),
          h('span', { class: 'pav__txt' }, h('strong', null, 'Te turnaron ' + [mios.vencidos ? mios.vencidos + (mios.vencidos === 1 ? ' asunto vencido' : ' asuntos vencidos') : '',
            mios.venceHoy ? mios.venceHoy + (mios.venceHoy === 1 ? ' que vence hoy' : ' que vencen hoy') : ''].filter(Boolean).join(' y ')),
            h('small', null, 'Están en «Mis asuntos».')), icono('siguiente')));
      }
      if (mios && mios.apartados && tiene('apartar')) {
        aviso.appendChild(h('button', { class: 'pav pav--apartado', onclick: function () {
          var t = ini.orden.filter(function (x) { return ini.todosTipos[x].numeroAuto; })[0] || 'OFS';
          E.tipo = t; E.filtrosTipo = t; E.filtros = { q: '', estatus: '(completar)', acuse: '' }; E.mostrar = 60;
          irA('libreta', t);
        } }, icono('apartar'),
          h('span', { class: 'pav__txt' }, h('strong', null, 'Tienes ' + mios.apartados + (mios.apartados === 1 ? ' número apartado' : ' números apartados') + ' por completar'),
            h('small', null, 'Ponles el asunto en cuanto tengas el oficio (o pide que se cancelen si ya no se usan).')), icono('siguiente')));
      }
      if (avisoGeneral) {
        aviso.appendChild(h('button', { class: 'pav', onclick: function () { irA('pendientes'); } }, icono('alarma'),
          h('span', { class: 'pav__txt' }, h('strong', null, (g.vencidos ? g.vencidos + (g.vencidos === 1 ? ' asunto vencido' : ' asuntos vencidos') : '') +
            (g.vencidos && g.venceHoy ? ' y ' : '') + (g.venceHoy ? g.venceHoy + ' vence' + (g.venceHoy === 1 ? '' : 'n') + ' hoy' : '')),
            h('small', null, 'Revisa tus pendientes para atenderlos a tiempo.')), icono('siguiente')));
      }
      vaciar(bloques);
      var libretas = ini.orden.map(function (t) {
        var d = ind.porTipo[t] || {}, chips = d.total === undefined ? [] : [d.total + ' en ' + ini.anioActual];
        if (d.porAtender) chips.push(d.porAtender + ' por atender');
        if (d.vencidos) chips.push(d.vencidos + (d.vencidos === 1 ? ' vencido' : ' vencidos'));
        if (t === 'OFS' && d.sinAcuse) chips.push(d.sinAcuse + ' sin acuse');
        if (d.porCompletar) chips.push(d.porCompletar + ' por completar');
        return { titulo: ini.todosTipos[t].nombre, desc: DESC_TIPO[t], color: COLOR_TIPO[t], icono: ICONO_TIPO[t], chips: chips, ir: function () { irA('libreta', t); } };
      });
      var seguimiento = (tiene('misAsuntos') ? [{ titulo: 'Mis asuntos', desc: 'Lo que te turnaron: lo vencido, lo que vence hoy y lo que sigue.', color: 'verde', icono: 'diana',
        chips: mios ? [mios.porAtender + ' por atender'].concat(mios.vencidos ? [mios.vencidos + (mios.vencidos === 1 ? ' vencido' : ' vencidos')] : [])
          .concat(mios.venceHoy ? [mios.venceHoy + ' vence' + (mios.venceHoy === 1 ? '' : 'n') + ' hoy'] : []) : ['Turnados a mí'],
        ir: function () { irA('misAsuntos'); } }] : []).concat([
        { titulo: 'Pendientes', desc: 'Lo que está por atender, por vencer y los oficios sin acuse.', color: 'guinda', icono: 'alarma',
          chips: (ind.porTipo && Object.keys(ind.porTipo).length ? [g.porAtender + ' por atender'] : ['Por atender']).concat(g.vencidos ? [g.vencidos + ' vencidos'] : []).concat(g.sinAcuse ? [g.sinAcuse + ' oficios sin acuse'] : []), ir: function () { irA('pendientes'); } },
        { titulo: 'Calendario', desc: 'Las fechas límite del mes: qué vence cada día y qué ya se pasó.', color: 'azul', icono: 'calendario',
          chips: ['Por día', 'Vencidos'].concat(tiene('misAsuntos') ? ['Solo lo mío'] : []), ir: function () { irA('calendario'); } },
        { titulo: 'Directorio', desc: 'Las personas a quienes se dirige o que firman, escritas siempre igual.', color: 'azul', icono: 'contactos',
          chips: [E.directorio.length + ' personas', 'Buscar'].concat(puedeCapturar() ? ['Agregar'] : []), ir: function () { irA('directorio'); } }
      ]).concat(tiene('informes') ? [{ titulo: 'Informes', desc: 'Registros por mes, remitentes y destinatarios, tiempo de respuesta y atención a tiempo.', color: 'cafe', icono: 'grafica',
        chips: ['Gráficas', 'Por periodo', 'Excel'], ir: function () { irA('informes'); } }] : []);
      var admin = esAdmin() ? [
        { titulo: 'Usuarios', desc: 'Quién entra, con qué rol y a qué libretas.', color: 'guinda', icono: 'usuarios', chips: ['Dar de alta', 'Roles', 'Contraseñas'], ir: function () { irA('usuarios'); } },
        { titulo: 'Bitácora', desc: 'Quién ha entrado y qué se ha hecho, con el antes y el después.', color: 'azul', icono: 'pulso', chips: ['Accesos', 'Cambios', 'Descargas'], ir: function () { irA('bitacora'); } }
      ].concat(exportacionLista() ? [
        { titulo: 'Exportación', desc: 'Descarga en Excel todas las libretas o una sola, de una fecha a otra.', color: 'verde', icono: 'excel', chips: ['Todas o una libreta', 'De fecha a fecha', 'Solo administradores'], ir: function () { irA('exportacion'); } }
      ] : []).concat([
        { titulo: 'Configuración', desc: 'Encabezados, número oficial, plazos, días inhábiles, avisos por correo y seguridad.', color: 'morado', icono: 'engrane', chips: ['Plazos y días inhábiles', 'Avisos', 'Dos pasos'], ir: function () { irA('config'); } }
      ]) : [];
      [['Libretas', libretas],
        ['Seguimiento', seguimiento], ['Administración', admin]].forEach(function (b) {
        if (!b[1].length) return;
        bloques.appendChild(h('section', { class: 'bloque' }, h('div', { class: 'bloque__cab' }, h('p', { class: 'bloque__t' }, b[0]), b[2] || null),
          h('div', { class: 'rejilla' }, b[1].map(function (c) {
            return h('button', { class: 'ptarjeta ptarjeta--' + c.color, onclick: c.ir },
              h('span', { class: 'ptarjeta__fila' }, h('span', { class: 'ptarjeta__ico' }, icono(c.icono)), h('span', { class: 'ptarjeta__ir' }, icono('flecha'))),
              h('span', { class: 'ptarjeta__t' }, c.titulo), h('span', { class: 'ptarjeta__d' }, c.desc),
              h('span', { class: 'ptarjeta__chips' }, c.chips.map(function (x) { return h('span', { class: 'chip' }, x); })));
          }))));
      });
    }
    pintar(ini.indicadores);
    if (Date.now() - E.iniT > 20000) {   // recién llegados (al entrar) no se vuelven a pedir
      var gen = E.gen;
      llamar('indicadores', null, { silencioso: true }).then(function (ind) {
        if (gen !== E.gen) return;
        E.ini.indicadores = ind; E.iniT = Date.now();
        if (E.vista === 'inicio') pintar(ind);
      }).catch(function () {});
    }
  };

  /* ───────────────────────── Buscador general (portal) ───────────────────────── */
  // Busca en TODAS mis libretas a la vez (el servidor solo revisa las mías).
  // Sin acentos ni mayúsculas, igual que el buscador de cada libreta.
  function buscadorGeneral() {
    var previo = E.busqueda || { q: '', res: null };
    var input = h('input', { class: 'entrada busq__input', type: 'search', placeholder: 'Buscar en todas mis libretas: número, asunto, persona…',
      'aria-label': 'Buscar en todas mis libretas', autocomplete: 'off', enterkeyhint: 'search', maxlength: 100, value: previo.q });
    var res = h('div', { class: 'busq__res', 'aria-live': 'polite' });
    var espera = null, pedido = 0;
    function buscar(ahora) {
      clearTimeout(espera);
      var q = input.value.trim();
      if (q.replace(/\s/g, '').length < 2) { E.busqueda = null; vaciar(res); return; }
      espera = setTimeout(function () {
        var n = ++pedido;
        vaciar(res).appendChild(h('div', { class: 'busq__cargando' }, 'Buscando «' + q + '»…'));
        llamar('buscar', { q: q }).then(function (r) {
          if (n !== pedido) return;
          E.busqueda = { q: q, res: r };
          pintarResultados(q, r);
        }).catch(function (e) { if (n === pedido) { vaciar(res).appendChild(h('div', { class: 'alerta alerta--error' }, e.message)); } });
      }, ahora ? 0 : 450);
    }
    function pintarResultados(q, r) {
      vaciar(res);
      if (!r.total) {
        res.appendChild(h('div', { class: 'busq__vacio' }, h('strong', null, 'Nada coincide con «' + q + '»'), 'Prueba con menos palabras o con parte del número.'));
        return;
      }
      res.appendChild(h('div', { class: 'busq__cab' },
        h('p', { class: 'busq__total' }, r.total + (r.total === 1 ? ' resultado' : ' resultados') + ' en ' + r.grupos.length + (r.grupos.length === 1 ? ' libreta' : ' libretas')),
        r.total > r.mostrados ? h('p', { class: 'busq__nota' }, 'Se muestran los ' + r.mostrados + ' más recientes. Agrega palabras para afinar.') : null,
        h('button', { type: 'button', class: 'btn btn--chico btn--fantasma', onclick: function () { input.value = ''; buscar(true); input.focus(); } }, icono('cerrar'), 'Limpiar')));
      r.grupos.forEach(function (g) {
        var def = E.ini.todosTipos[g.tipo];
        // Primero 5 por libreta (para no empujar las tarjetas hasta abajo); «Ver más» abre el resto aquí mismo
        var POR_GRUPO = 5, lista = h('div');
        g.registros.slice(0, POR_GRUPO).forEach(function (x) { lista.appendChild(itemBusqueda(x)); });
        var verMas = g.registros.length > POR_GRUPO ? h('button', { type: 'button', class: 'busq__mas busq__mas--aqui', onclick: function () {
          g.registros.slice(POR_GRUPO).forEach(function (x) { lista.appendChild(itemBusqueda(x)); });
          verMas.remove();
        } }, 'Ver ' + (g.registros.length - POR_GRUPO) + ' más aquí') : null;
        res.appendChild(h('section', { class: 'busq__g busq__g--' + COLOR_TIPO[g.tipo] },
          h('h3', { class: 'busq__gt' }, h('span', { class: 'busq__ico' }, icono(ICONO_TIPO[g.tipo])), def.nombre, h('span', { class: 'ins' }, g.total)),
          lista, verMas,
          g.total > g.registros.length ? h('button', { type: 'button', class: 'busq__mas', onclick: function () {
            E.tipo = g.tipo; E.filtrosTipo = g.tipo; E.filtros = { q: q, estatus: '', acuse: '' }; E.mostrar = 60;
            irA('libreta', g.tipo);
          } }, (g.registros.length ? 'Ver los ' + g.total + ' en la libreta' : g.total + ' más en esta libreta: verlos') + ' →') : null));
      });
    }
    function itemBusqueda(x) {
      var per = lineas(x.tipo === 'OFS' ? x.dirigido_a : x.firma).primera;
      return h('button', { type: 'button', class: 'busq__i', onclick: function () { abrirDetalle(x.id, x); } },
        h('span', { class: 'busq__num' }, h('span', { class: 't-num' }, etiquetaNum(x)), x.numero && x.numero !== etiquetaNum(x) ? h('small', null, x.numero) : null),
        h('span', { class: 'busq__txt' }, h('span', { class: 'busq__asunto' }, x.asunto || 'Sin asunto'),
          h('small', null, [per, fechaCorta(x.fecha_recepcion || x.fecha)].filter(Boolean).join(' · '))),
        h('span', { class: 'busq__est' }, x.estatus ? insEstatus(x.estatus) : null, insVence(x)));
    }
    input.addEventListener('input', function () { buscar(false); });
    input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); buscar(true); } });
    if (previo.res && previo.q) pintarResultados(previo.q, previo.res);
    return h('section', { class: 'busq', role: 'search' },
      h('div', { class: 'busq__caja' }, icono('buscar'), input,
        h('button', { type: 'button', class: 'btn btn--prim busq__btn', onclick: function () { buscar(true); } }, 'Buscar')),
      res);
  }

  /* ───────────────────────── Ayuda: novedades y primeros pasos ───────────────────────── */
  // Se abre sola una vez por versión (la primera vez que alguien entra, en vez de
  // las novedades salen los primeros pasos). Siempre está en «Ayuda», arriba.
  function novedadesSiToca() {
    if (!E.ini || E.vista !== 'inicio' || pila.length || panelActual) return;
    var visto = pref('visto:' + E.ini.yo.usuario);
    if (visto === NOVEDADES) return;
    // Quien entra por primera vez (con contraseña temporal) ve los primeros pasos; los demás, lo nuevo
    mostrarGuia(!visto && E.nuevoUsuario ? 'inicio' : 'novedades');
  }

  function puntosGuia(modo) {
    var cap = puedeCapturar(), admin = esAdmin(), ofs = E.ini.orden.some(function (t) { return E.ini.todosTipos[t].numeroAuto; });
    var p = [];
    var poner = function (cond, ico, titulo, texto) { if (cond) p.push({ ico: ico, titulo: titulo, texto: texto }); };
    if (modo === 'novedades') {
      poner(cap && ofs && tiene('apartar'), 'apartar', 'Apartar número', 'En Oficios salientes, «Apartar número» te da el siguiente número al instante, aunque todavía no tengas el oficio. Queda «por completar» hasta que le pongas el asunto.');
      poner(cap, 'copiar', 'Lo de siempre', 'Al capturar, la firma (o el destinatario) y quién elaboró salen como en tu último registro. Con «Guardar y capturar otro» queda listo el siguiente.');
      poner(cap, 'subir', 'Arrastra el escaneo', 'En computadora, suelta el PDF o la imagen sobre el registro o sobre el formulario.');
      poner(cap && tiene('guardarLote'), 'check', 'Atendido en un toque', 'En «Mis asuntos» y en «Pendientes», cada asunto tiene su botón «Atendido». Si te equivocas, el aviso trae «Deshacer».');
      poner(true, 'calendario', 'Calendario', 'Las fechas límite del mes: qué vence cada día y qué ya se pasó. Está en Seguimiento.');
      poner(tiene('agregarNota'), 'nota', 'Notas de seguimiento', 'En cada registro, anota lo que va pasando («Se llamó al enlace», «Pidieron prórroga»). Quedan con tu nombre y la fecha.');
      poner(true, 'imprimir', 'Volante con código QR', 'El volante impreso trae un código: escanéalo con el celular y abre el registro directo.');
      poner(true, 'ordenar', 'Ordenar y filtros recordados', 'Toca el título de una columna para ordenar. Cada libreta recuerda su último filtro en este equipo.');
    } else {
      poner(true, 'libro', 'El portal', 'Cada tarjeta abre una libreta o una pantalla. Los números de cada tarjeta te dicen qué está por atender, vencido o sin acuse.');
      poner(true, 'buscar', 'Buscar', 'El buscador de arriba busca en todas tus libretas a la vez, sin importar acentos ni mayúsculas.');
      poner(cap, 'mas', 'Registrar', 'En cada libreta, «Nuevo…». En Oficios salientes el número sale solo al guardar; si lo necesitas antes, «Apartar número».');
      poner(cap, 'subir', 'Escaneos', 'Sube el PDF, toma una foto con el celular o suelta el archivo sobre el registro.');
      poner(true, 'diana', 'Mis asuntos', 'Lo que te turnan aparece en «Mis asuntos», con lo vencido y lo que vence hoy hasta arriba.');
      poner(true, 'nota', 'Notas', 'En el detalle de un registro puedes dejar notas de seguimiento (si capturas o si te lo turnaron).');
      poner(admin, 'usuarios', 'Administración', 'Usuarios (altas y permisos), Bitácora (quién hizo qué) y Configuración (plazos, días inhábiles, avisos).');
      poner(true, 'llave', 'Tu cuenta', 'En «Mi cuenta» cambias tu contraseña y activas la verificación en dos pasos.');
    }
    return p;
  }

  function mostrarGuia(modo) {
    var cuerpo = h('div', { class: 'guia' });
    var pestanas = h('div', { class: 'guia__pest', role: 'tablist' });
    function pintar(m) {
      modo = m;
      vaciar(pestanas);
      [['novedades', 'Qué hay de nuevo'], ['inicio', 'Primeros pasos']].forEach(function (x) {
        pestanas.appendChild(h('button', { class: 'guia__tab' + (x[0] === m ? ' activa' : ''), role: 'tab', 'aria-selected': x[0] === m ? 'true' : 'false', onclick: function () { pintar(x[0]); } }, x[1]));
      });
      vaciar(cuerpo).appendChild(h('p', { class: 'guia__intro' }, m === 'novedades'
        ? 'Versión ' + NOVEDADES + ': cosas para que capturar y dar seguimiento sea más rápido.'
        : 'Lo básico para trabajar en Control de Gestión.'));
      cuerpo.appendChild(h('ul', { class: 'guia__lista' }, puntosGuia(m).map(function (x) {
        return h('li', { class: 'guia__i' }, h('span', { class: 'guia__ico' }, icono(x.ico)), h('div', null, h('strong', null, x.titulo), h('p', null, x.texto)));
      })));
    }
    pintar(modo || 'novedades');
    var v = ventana({ titulo: 'Ayuda', ancho: 620, sinFoco: true, cuerpo: [pestanas, cuerpo],
      alCerrar: function () { pref('visto:' + E.ini.yo.usuario, NOVEDADES); },
      pie: [h('button', { class: 'btn btn--prim', onclick: function () { v.cerrar(); } }, 'Entendido')] });
    return v;
  }
