  /* Control de Gestión · Libreta: lista, filtros, indicadores y selección en lote. Es una parte de la app: se junta con las demás de web/app/ (ver 01-nucleo.js). */
  /* ───────────────────────── Libreta (su propia pantalla) ───────────────────────── */
  var refsReg = {};
  vistas.libreta = function () {
    var ini = E.ini, t = E.tipo, def = ini.todosTipos[t];
    var cont = marco('libreta', { color: COLOR_TIPO[t] });
    var q = h('input', { class: 'entrada', type: 'search', placeholder: 'Buscar por número, asunto, persona, observaciones…', value: E.filtros.q,
      'aria-label': 'Buscar', oninput: function () { E.filtros.q = q.value; E.mostrar = 60; pintarLista(); } });
    var anio = h('select', { class: 'entrada', 'aria-label': 'Año', onchange: function () { E.anio = Number(anio.value); vistas.libreta(); } },
      ini.anios.map(function (a) { return h('option', { value: a, selected: a === E.anio }, 'Año ' + a); }));
    var est = h('select', { class: 'entrada', 'aria-label': 'Estatus', onchange: function () { E.filtros.estatus = est.value; E.mostrar = 60; guardarFiltros(t, { estatus: est.value }); pintarLista(); } },
      [['', 'Todos los estatus'], ['(activos)', 'Por atender (pendiente o en trámite)'], ['(vencidos)', 'Vencidos'], ['(mes)', 'De este mes'], ['(sin)', 'Sin estatus']]
        .concat(tiene('misAsuntos') ? [['(mios)', 'Turnados a mí']] : [])
        .concat(def.numeroAuto ? [['(completar)', 'Por completar (números apartados)']] : [])
        .concat(t === 'OFS' ? [['(sinarchivo)', 'Sin archivo adjunto (ni escaneo ni acuse)']] : [])
        .concat(ini.estatus.map(function (s) { return [s, s]; })).map(function (o) {
          return h('option', { value: o[0], selected: o[0] === E.filtros.estatus }, o[1]);
        }));
    var acu = h('select', { class: 'entrada', 'aria-label': 'Acuse', onchange: function () { E.filtros.acuse = acu.value; E.mostrar = 60; guardarFiltros(t, { acuse: acu.value }); pintarLista(); } },
      [['', 'Con y sin acuse'], ['SI', 'Con acuse'], ['NO', 'Sin acuse']].map(function (o) { return h('option', { value: o[0], selected: o[0] === E.filtros.acuse }, o[1]); }));
    var ordSel = h('select', { class: 'entrada herr__orden', 'aria-label': 'Ordenar', onchange: function () {
      var p = ordSel.value.split(':'); ponerOrden(p[0], p[1]);
    } }, OPCIONES_ORDEN.map(function (o) { var v = o[0] + ':' + o[1]; return h('option', { value: v, selected: v === ordenActual().campo + ':' + ordenActual().dir }, o[2]); }));
    // Selección para cambiar varios a la vez (solo quien captura y si el servidor ya sabe hacerlo)
    if (!E.sel || E.sel.clave !== t + E.anio) E.sel = { clave: t + E.anio, activo: false, ids: {} };
    var puedeLote = puedeCapturar(t) && tiene('guardarLote');
    var botonSel = puedeLote ? h('button', { class: 'btn' + (E.sel.activo ? ' btn--prim' : ''), 'aria-pressed': E.sel.activo ? 'true' : 'false', onclick: function () {
      E.sel.activo = !E.sel.activo; E.sel.ids = {};
      botonSel.classList.toggle('btn--prim', E.sel.activo); botonSel.setAttribute('aria-pressed', E.sel.activo ? 'true' : 'false');
      pintarLista();
    } }, icono('check'), 'Seleccionar') : null;
    refsReg = { res: h('div'), indicadores: h('div', { class: 'lib__ind' }), est: est, acu: acu, q: q, lote: h('div'), botonSel: botonSel, ord: ordSel };
    var puedeApartar = def.numeroAuto && puedeCapturar(t) && tiene('apartar') && E.anio === ini.anioActual;
    cont.appendChild(h('div', null,
      h('section', { class: 'lib' },
        h('div', { class: 'lib__fila' },
          h('span', { class: 'lib__ico' }, icono(ICONO_TIPO[t])),
          h('div', { class: 'lib__txt' }, h('h1', { class: 'lib__t' }, def.nombre), h('p', { class: 'lib__d' }, DESC_TIPO[t] + ' · Año ' + E.anio)),
          h('div', { class: 'lib__acciones' },
            puedeApartar ? h('button', { class: 'btn btn--claro', title: 'El siguiente número, ya, aunque todavía no tengas el oficio', onclick: function () { ventanaApartar(t); } }, icono('apartar'), 'Apartar número') : null,
            puedeCapturar(t) ? h('button', { class: 'btn btn--blanco', onclick: function () { formulario(t, null); } }, icono('mas'), 'Nuevo ' + def.singular.toLowerCase()) : null)),
        refsReg.indicadores),
      h('div', { class: 'herr' }, h('div', { class: 'buscador' }, icono('buscar'), q), anio, est, acu, ordSel, botonSel),
      refsReg.lote, refsReg.res));
    var c = E.listas[E.tipo + E.anio];
    if (c) {
      // Ya se tenía (precarga o visita anterior): se ve al instante y se actualiza sin hacer esperar.
      E.lista = c.lista; E.listaClave = E.tipo + E.anio;
      pintarLista();
      if (Date.now() - c.t > 10000) cargarLista({ silencioso: true });
    } else {
      E.listaClave = null;
      pintarIndicadores();
      vaciar(refsReg.res).appendChild(h('div', { class: 'tarjeta vacio' }, 'Cargando…'));
      cargarLista();
    }
  };

  function mesActual() { return hoyIso().slice(0, 7); }
  function esMio(r) { return !!(r.turnado_usuario && E.ini && r.turnado_usuario === E.ini.yo.usuario); }
  function esVencido(r) { return esActivo(r) && r.fecha_limite && r.fecha_limite < hoyIso(); }
  function esDelMes(r) { return String(r.fecha_recepcion || r.fecha || '').slice(0, 7) === mesActual(); }
  /** «Sin acuse» (u «original») cuenta desde la fecha de corte de Configuración, si hay. */
  function corteAcuse() { return (E.ini && E.ini.config && E.ini.config.acuse_desde) || ''; }
  function sinAcuse(r) { return r.acuse !== 'SI' && r.estatus !== 'Cancelado' && (!corteAcuse() || String(r.fecha_recepcion || r.fecha || '') >= corteAcuse()); }
  /** Oficio saliente sin NINGÚN escaneo (ni el documento ni un acuse subido aparte). No cuenta cancelados ni números apartados; respeta la misma fecha de corte que «sin acuse». */
  function sinArchivo(r) { return !r.tiene_archivo && !r.tiene_acuse_archivo && r.estatus !== 'Cancelado' && !porCompletar(r) && (!corteAcuse() || String(r.fecha || '') >= corteAcuse()); }

  /** Indicadores de la libreta (del año que se está viendo). Cada uno filtra la lista. */
  function pintarIndicadores() {
    var cont = refsReg.indicadores;
    if (!cont) return;
    var l = E.listaClave === E.tipo + E.anio ? E.lista : null;
    var n = function (f) { return l ? l.filter(f).length : '…'; };
    var datos = [
      ['Registros', l ? l.length : '…', function () { aplicar('', ''); }, !E.filtros.estatus && !E.filtros.acuse],
      ['Por atender', n(esActivo), function () { aplicar('(activos)', ''); }, E.filtros.estatus === '(activos)'],
      ['Vencidos', n(esVencido), function () { aplicar('(vencidos)', ''); }, E.filtros.estatus === '(vencidos)']
    ];
    if (E.tipo === 'OFS' || tieneCampo(E.tipo, 'acuse')) {
      datos.push([E.tipo === 'OFE' ? 'Sin original' : 'Sin acuse', n(sinAcuse), function () { aplicar('(sinacuse)', ''); }, E.filtros.estatus === '(sinacuse)',
        corteAcuse() ? 'Desde el ' + fechaCorta(corteAcuse()) + ' (Configuración)' : null]);
    }
    if (E.tipo === 'OFS') {
      datos.push(['Sin archivo', n(sinArchivo), function () { aplicar('(sinarchivo)', ''); }, E.filtros.estatus === '(sinarchivo)',
        corteAcuse() ? 'Desde el ' + fechaCorta(corteAcuse()) + ' (Configuración)' : null]);
    }
    datos.push(['De este mes', n(esDelMes), function () { aplicar('(mes)', ''); }, E.filtros.estatus === '(mes)']);
    if (tipoDef(E.tipo).numeroAuto && l && (l.some(porCompletar) || E.filtros.estatus === '(completar)')) {
      datos.push(['Por completar', n(porCompletar), function () { aplicar('(completar)', ''); }, E.filtros.estatus === '(completar)', 'Números apartados que aún no tienen asunto']);
    }
    if (tiene('misAsuntos')) datos.push(['Turnados a mí', n(esMio), function () { aplicar('(mios)', ''); }, E.filtros.estatus === '(mios)']);
    vaciar(cont);
    datos.forEach(function (d) {
      cont.appendChild(h('button', { class: 'ind' + (d[3] ? ' activo' : ''), onclick: d[2], 'aria-pressed': d[3] ? 'true' : 'false', title: d[4] || null },
        h('span', { class: 'ind__n' }, d[1]), h('span', { class: 'ind__t' }, d[0] + (d[4] && d[0] !== 'Por completar' ? ' *' : ''))));
    });
    function aplicar(estatus, acuse) {
      E.filtros.estatus = estatus; E.filtros.acuse = acuse; E.mostrar = 60;
      guardarFiltros(E.tipo, { estatus: estatus, acuse: acuse });
      if (refsReg.est) refsReg.est.value = estatus;
      if (refsReg.acu) refsReg.acu.value = acuse;
      pintarLista();
    }
  }

  function prepararFila(r) {
    r._b = norm([etiquetaNum(r), r.numero, r.asunto, r.dirigido_a, r.firma, r.obs, r.elaboro, r.carpeta, r.turnado_a, r.turnado_usuario, r.estatus].join(' '));
    return r;
  }

  /** Guarda una lista en la memoria de la sesión y, si es la que está en pantalla y cambió, la vuelve a pintar. */
  function recibirLista(tipo, anio, lista, enviado) {
    var clave = tipo + anio, c = E.listas[clave];
    if (c && c.t > enviado) return;   // ya había algo más reciente
    var firma = JSON.stringify(lista);
    lista.forEach(prepararFila);
    E.listas[clave] = { lista: lista, t: enviado, firma: firma };
    if (E.ini && anio === E.ini.anioActual) E.ini.conteos[tipo] = lista.length;
    if (E.vista === 'libreta' && E.tipo + E.anio === clave && (E.listaClave !== clave || !c || c.firma !== firma)) {
      E.lista = lista; E.listaClave = clave;
      pintarLista();
    }
  }

  function cargarLista(op) {
    var tipo = E.tipo, anio = E.anio, gen = E.gen, enviado = Date.now();
    return llamar('listar', { tipo: tipo, anio: anio }, op).then(function (lista) {
      if (gen === E.gen) recibirLista(tipo, anio, lista, enviado);
    }).catch(function (e) {
      if (op && op.silencioso) return;   // ya se ve la lista en memoria
      fallo(e);
      if (refsReg.res && E.tipo + E.anio === tipo + anio && E.listaClave !== tipo + anio) {
        vaciar(refsReg.res).appendChild(h('div', { class: 'tarjeta vacio' }, h('strong', null, 'No se pudo cargar'), e.message));
      }
    });
  }

  var CAMPOS_LISTA = ['id', 'tipo', 'anio', 'consecutivo', 'sufijo', 'numero', 'asunto', 'dirigido_id', 'dirigido_a', 'firma_id', 'firma',
    'fecha', 'fecha_recepcion', 'elaboro', 'acuse', 'carpeta', 'estatus', 'fecha_limite', 'turnado_a', 'relacionado_id', 'turnado_usuario', 'creado_por'];
  function corta(s, n) { s = String(s === null || s === undefined ? '' : s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function ordenLista(a, b) { return b.consecutivo - a.consecutivo || (b.sufijo > a.sufijo ? 1 : -1); }

  /**
   * Pone en la lista en memoria lo que acaba de regresar el servidor, sin volver a
   * pedir toda la lista: un registro completo (guardar, cancelar, archivos) o las
   * filas de la lista («Varios destinatarios»).
   */
  function actualizarEnLista(reg) {
    var clave = reg.tipo + reg.anio, c = E.listas[clave];
    if (!c) return;
    var fila = {};
    CAMPOS_LISTA.forEach(function (k) { fila[k] = reg[k]; });
    fila.asunto = corta(reg.asunto, 300);
    fila.obs = 'obs' in reg ? reg.obs : corta(reg.observaciones, 200);
    fila.tiene_archivo = !!reg.tiene_archivo;
    fila.tiene_acuse_archivo = !!reg.tiene_acuse_archivo;
    prepararFila(fila);
    var lista = c.lista.filter(function (x) { return x.id !== reg.id; }).concat([fila]).sort(ordenLista);
    E.listas[clave] = { lista: lista, t: Date.now(), firma: null };
    if (E.vista === 'libreta' && E.tipo + E.anio === clave) { E.lista = lista; E.listaClave = clave; pintarLista(); }
  }

  /** Después de guardar, cancelar o mover un archivo: lista y panel al día sin esperar otra vuelta al servidor. */
  function trasCambio(res, id) {
    if (res && res.registro) actualizarEnLista(res.registro);
    E.iniT = 0;   // los números del portal se vuelven a pedir
    mostrarDetalle(res, id);
  }

  function filtrada() {
    var f = E.filtros, palabras = norm(f.q).split(' ').filter(Boolean);
    return E.lista.filter(function (r) {
      if (f.estatus === '(sin)' && r.estatus) return false;
      if (f.estatus === '(activos)' && !esActivo(r)) return false;
      if (f.estatus === '(vencidos)' && !esVencido(r)) return false;
      if (f.estatus === '(mes)' && !esDelMes(r)) return false;
      if (f.estatus === '(mios)' && !esMio(r)) return false;
      if (f.estatus === '(sinacuse)' && !sinAcuse(r)) return false;
      if (f.estatus === '(completar)' && !porCompletar(r)) return false;
      if (f.estatus === '(sinarchivo)' && !sinArchivo(r)) return false;
      if (f.estatus && f.estatus.charAt(0) !== '(' && r.estatus !== f.estatus) return false;
      if (f.acuse && r.acuse !== f.acuse) return false;
      for (var i = 0; i < palabras.length; i++) if (r._b.indexOf(palabras[i]) < 0) return false;
      return true;
    }).sort(comparador());
  }

  /* ─────────── Ordenar (se recuerda por libreta, en este equipo) ─────────── */
  var OPCIONES_ORDEN = [['num', 'desc', 'Más recientes primero'], ['num', 'asc', 'Más antiguos primero'], ['fecha', 'desc', 'Fecha: más nueva'], ['fecha', 'asc', 'Fecha: más vieja'],
    ['limite', 'asc', 'Fecha límite: la más próxima'], ['asunto', 'asc', 'Asunto (A → Z)'], ['persona', 'asc', 'Persona (A → Z)'], ['estatus', 'asc', 'Estatus']];
  function ordenActual() {
    var g = filtrosGuardados(E.tipo).orden;
    return g && g.campo ? g : { campo: 'num', dir: 'desc' };
  }
  function ponerOrden(campo, dir) {
    var o = campo === 'num' && dir === 'desc' ? null : { campo: campo, dir: dir };   // el de siempre no se guarda
    guardarFiltros(E.tipo, { orden: o });
    if (refsReg.ord) refsReg.ord.value = campo + ':' + dir;
    pintarLista();
  }
  /** Al tocar el título de una columna: primero de menor a mayor (los números, al revés), y al volver a tocar se invierte. */
  function alternarOrden(campo) {
    var o = ordenActual();
    ponerOrden(campo, o.campo === campo ? (o.dir === 'asc' ? 'desc' : 'asc') : (campo === 'num' || campo === 'fecha' ? 'desc' : 'asc'));
  }
  var compararTexto = typeof Intl !== 'undefined' && Intl.Collator ? new Intl.Collator('es', { sensitivity: 'base', numeric: true }).compare : function (a, b) { return a < b ? -1 : a > b ? 1 : 0; };
  function comparador() {
    var o = ordenActual(), t = E.tipo, signo = o.dir === 'asc' ? 1 : -1;
    if (o.campo === 'num') return function (a, b) { return signo * ((a.consecutivo - b.consecutivo) || compararTexto(a.sufijo || '', b.sufijo || '')); };
    var valor = {
      fecha: function (r) { return r[columnaFecha(t)[0]] || r.fecha || ''; },
      limite: function (r) { return r.fecha_limite || ''; },
      asunto: function (r) { return String(r.asunto || '').trim(); },
      persona: function (r) { return lineas(r[columnaPersona(t)[0]]).primera || ''; },
      estatus: function (r) { return r.estatus || ''; }
    }[o.campo] || function (r) { return ''; };
    return function (a, b) {
      var x = valor(a), y = valor(b);
      if (!x !== !y) return x ? -1 : 1;   // los vacíos siempre al final
      return signo * compararTexto(x, y) || b.consecutivo - a.consecutivo;
    };
  }
  function encabezado(campo, texto) {
    var o = ordenActual(), activo = o.campo === campo;
    return h('th', { 'aria-sort': activo ? (o.dir === 'asc' ? 'ascending' : 'descending') : 'none' },
      h('button', { type: 'button', class: 'th-orden' + (activo ? ' activo' : ''), 'aria-label': 'Ordenar por ' + texto.toLowerCase(), onclick: function () { alternarOrden(campo); } },
        texto, h('span', { class: 'th-orden__f', 'aria-hidden': 'true' }, activo ? (o.dir === 'asc' ? '▲' : '▼') : '↕')));
  }
  function hayFiltros() { return !!(E.filtros.q || E.filtros.estatus || E.filtros.acuse); }
  function quitarFiltros() {
    E.filtros = { q: '', estatus: '', acuse: '' }; E.mostrar = 60;
    guardarFiltros(E.tipo, { estatus: '', acuse: '' });
    if (refsReg.q) refsReg.q.value = '';
    if (refsReg.est) refsReg.est.value = '';
    if (refsReg.acu) refsReg.acu.value = '';
    pintarLista();
  }

  function columnaPersona(t) { return t === 'OFS' ? ['dirigido_a', 'Dirigido a'] : ['firma', etiquetaCampo(t, 'firma', 'Remitente')]; }
  function columnaFecha(t) { return tieneCampo(t, 'fecha_recepcion') ? ['fecha_recepcion', 'Recibido'] : ['fecha', 'Fecha']; }

  function pintarLista() {
    if (!refsReg.res) return;
    pintarIndicadores();
    var t = E.tipo, filas = filtrada(), vis = filas.slice(0, E.mostrar);
    var sel = E.sel && E.sel.activo ? E.sel : null;
    pintarBarraLote(filas);
    var abrir = function (r) { if (sel) { alternarSel(r.id); return; } abrirDetalle(r.id, r); };
    var casilla = function (r) {
      return h('input', { type: 'checkbox', class: 'sel__c', checked: !!sel.ids[r.id], 'aria-label': 'Elegir ' + etiquetaNum(r),
        onclick: function (ev) { ev.stopPropagation(); alternarSel(r.id); } });
    };
    var cp = columnaPersona(t), cf = columnaFecha(t);
    var numEt = t === 'OFS' ? 'No. de oficio' : etiquetaCampo(t, 'numero', 'Número');
    vaciar(refsReg.res);
    refsReg.res.appendChild(h('p', { class: 'conteo' }, filas.length === E.lista.length ? E.lista.length + ' registros' : filas.length + ' de ' + E.lista.length + ' registros',
      hayFiltros() ? [' · ', h('button', { type: 'button', class: 'enlace', onclick: quitarFiltros }, 'Quitar filtros')] : null));
    if (!filas.length) {
      refsReg.res.appendChild(h('div', { class: 'tarjeta vacio' }, h('strong', null, E.lista.length ? 'Nada coincide con la búsqueda' : 'Todavía no hay registros'),
        E.lista.length ? h('span', null, 'Prueba con otras palabras o ', h('button', { type: 'button', class: 'enlace', onclick: quitarFiltros }, 'quita los filtros'), '.') : (puedeCapturar(t) ? 'Usa «Nuevo» para capturar el primero.' : '')));
      return;
    }
    var todosVis = sel && vis.length && vis.every(function (r) { return sel.ids[r.id] || r.estatus === 'Cancelado'; });
    var tabla = h('table', { class: 'tabla' + (sel ? ' tabla--sel' : '') },
      h('thead', null, h('tr', null,
        sel ? h('th', { class: 't-sel' }, h('input', { type: 'checkbox', class: 'sel__c', checked: !!todosVis, 'aria-label': 'Elegir todos los que se ven',
          onclick: function () { vis.forEach(function (r) { if (r.estatus === 'Cancelado') return; if (todosVis) delete sel.ids[r.id]; else sel.ids[r.id] = true; }); pintarLista(); } })) : null,
        encabezado('num', 'No.'), h('th', null, numEt), encabezado('asunto', 'Asunto'), encabezado('persona', cp[1]), encabezado('fecha', cf[1]), encabezado('estatus', 'Estatus'), h('th', { 'aria-label': 'Acuse y archivo' }, ''))),
      h('tbody', null, vis.map(function (r) {
        var p = lineas(r[cp[0]]);
        return h('tr', { class: (r.estatus === 'Cancelado' ? 'cancelado' : '') + (sel && sel.ids[r.id] ? ' elegido' : ''), tabindex: '0', onclick: function () { abrir(r); },
          onkeydown: function (ev) { if (ev.key === 'Enter' || (sel && ev.key === ' ')) { ev.preventDefault(); abrir(r); } } },
          sel ? h('td', { class: 't-sel' }, r.estatus === 'Cancelado' ? null : casilla(r)) : null,
          h('td', { class: 't-num' }, etiquetaNum(r)),
          h('td', { class: 't-folio' }, r.numero || '—'),
          h('td', { class: 't-asunto' }, r.asunto || h('em', { style: { color: 'var(--texto-3)' } }, 'Sin asunto'), r.obs ? h('span', { class: 't-asunto__obs' }, r.obs) : null),
          h('td', { class: 't-persona' }, p.primera || '—', p.resto ? h('small', null, p.resto) : null),
          h('td', { class: 't-fecha' }, fechaCorta(r[cf[0]] || r.fecha)),
          h('td', null, porCompletar(r) ? insCompletar() : r.estatus ? insEstatus(r.estatus) : null, ' ', insVence(r), esMio(r) ? [' ', insMio()] : null),
          h('td', { class: 't-iconos' },
            h('span', { class: r.acuse === 'SI' ? 'si' : '', title: r.acuse === 'SI' ? 'Con acuse' : 'Sin acuse' }, icono(r.acuse === 'SI' ? 'check' : 'reloj')), ' ',
            r.tiene_archivo || r.tiene_acuse_archivo ? h('span', { title: 'Tiene archivo' }, icono('clip')) : null));
      })));
    var movil = h('div', { class: 'tarjeta lista-movil' }, vis.map(function (r) {
      var p = lineas(r[cp[0]]);
      return h('div', { class: 'item' + (sel && sel.ids[r.id] ? ' elegido' : ''), onclick: function () { abrir(r); } },
        h('div', { class: 'item__arriba' }, sel && r.estatus !== 'Cancelado' ? casilla(r) : null, h('span', { class: 't-num' }, etiquetaNum(r)), porCompletar(r) ? insCompletar() : r.estatus ? insEstatus(r.estatus) : null, insVence(r),
          r.acuse === 'SI' ? h('span', { class: 'ins ins--Atendido' }, 'Acuse') : null, esMio(r) ? insMio() : null),
        h('div', { class: 'item__asunto' }, r.asunto || 'Sin asunto'),
        h('div', { class: 'item__meta' }, [r.numero, p.primera, fechaCorta(r[cf[0]] || r.fecha)].filter(Boolean).join(' · ')));
    }));
    refsReg.res.appendChild(h('div', { class: 'tarjeta' }, h('div', { class: 'tabla-env' }, tabla), movil));
    if (filas.length > vis.length) {
      refsReg.res.appendChild(h('div', { class: 'mas' }, h('button', { class: 'btn', onclick: function () { E.mostrar += 100; pintarLista(); } },
        'Ver más (' + (filas.length - vis.length) + ' restantes)')));
    }
  }

  /* ─────────── Cambiar varios a la vez ─────────── */
  function alternarSel(id) {
    if (!E.sel) return;
    if (E.sel.ids[id]) delete E.sel.ids[id]; else E.sel.ids[id] = true;
    pintarLista();
  }
  function idsElegidos() { return E.sel ? Object.keys(E.sel.ids) : []; }

  function pintarBarraLote(filas) {
    var cont = refsReg.lote;
    if (!cont) return;
    vaciar(cont);
    if (!E.sel || !E.sel.activo) return;
    var n = idsElegidos().length, t = E.tipo;
    var elegibles = filas.filter(function (r) { return r.estatus !== 'Cancelado'; });
    var acciones = [
      ['Estatus', function () { ventanaLote('estatus'); }],
      tieneCampo(t, 'acuse') ? [t === 'OFE' ? 'Original' : 'Acuse', function () { ventanaLote('acuse'); }] : null,
      tiene('usuariosTurno') ? ['Turnar', function () { ventanaLote('turnado_usuario'); }] : null,
      ['Fecha límite', function () { ventanaLote('fecha_limite'); }]
    ].filter(Boolean);
    cont.appendChild(h('div', { class: 'lote', role: 'region', 'aria-label': 'Cambiar varios a la vez' },
      h('div', { class: 'lote__info' }, h('strong', null, n + (n === 1 ? ' elegido' : ' elegidos')),
        elegibles.length > n ? h('button', { class: 'btn btn--chico btn--fantasma', onclick: function () {
          elegibles.slice(0, 500).forEach(function (r) { E.sel.ids[r.id] = true; }); pintarLista();
        } }, 'Elegir los ' + Math.min(500, elegibles.length) + ' de la lista') : null,
        n ? h('button', { class: 'btn btn--chico btn--fantasma', onclick: function () { E.sel.ids = {}; pintarLista(); } }, 'Quitar selección') : null,
        refsReg.botonSel ? h('button', { class: 'btn btn--chico btn--fantasma', onclick: function () { refsReg.botonSel.click(); } }, 'Terminar') : null),
      h('div', { class: 'lote__acciones' }, n ? acciones.map(function (a) { return h('button', { class: 'btn btn--chico', onclick: a[1] }, a[0]); })
        : h('span', { class: 'lote__ayuda' }, 'Toca los registros que quieras cambiar (los cancelados no se pueden elegir).'))));
  }

  function ventanaLote(campoLote) {
    var ids = idsElegidos(), t = E.tipo, def = tipoDef(t);
    if (!ids.length) return;
    var control, nota = h('div', { class: 'campo__ayuda' }), msg = h('div');
    var titulos = { estatus: 'Cambiar el estatus', acuse: t === 'OFE' ? 'Marcar «se tiene el original»' : 'Marcar el acuse', turnado_usuario: 'Turnar a una persona del sistema', fecha_limite: 'Poner fecha límite' };
    if (campoLote === 'estatus') {
      control = h('select', { class: 'entrada' }, [['', 'Sin estatus']].concat(E.ini.estatus.filter(function (s) { return s !== 'Cancelado'; }).map(function (s) { return [s, s]; }))
        .map(function (o) { return h('option', { value: o[0], selected: o[0] === 'Concluido' }, o[1]); }));
      nota.textContent = 'Para cancelar hay que escribir el motivo de cada uno: hazlo desde su detalle. «Atendido» y «Concluido» guardan la fecha de hoy como fecha de atención.';
    } else if (campoLote === 'acuse') {
      control = h('select', { class: 'entrada' }, h('option', { value: 'SI' }, 'Sí'), h('option', { value: 'NO' }, 'No'));
    } else if (campoLote === 'turnado_usuario') {
      control = h('select', { class: 'entrada' }, h('option', { value: '' }, 'Cargando…'));
      usuariosParaTurnar(t).then(function (us) {
        vaciar(control).appendChild(h('option', { value: '' }, '— Nadie (quitar el turno) —'));
        us.forEach(function (u) { control.appendChild(h('option', { value: u.usuario }, u.nombre + (u.usuario === E.ini.yo.usuario ? ' (yo)' : ''))); });
      }).catch(function (e) { vaciar(msg).appendChild(h('div', { class: 'alerta alerta--error' }, e.message)); });
      nota.textContent = 'Le aparecen en «Mis asuntos». Los que no tengan estatus pasan a «Pendiente».';
    } else {
      control = h('input', { class: 'entrada', type: 'date', min: '2000-01-01', max: '2100-12-31' });
      nota.textContent = 'Déjala vacía para quitar la fecha límite.';
      var notaInhabil = vigilarInhabil(control, h('div', { class: 'campo__ayuda campo__ayuda--aviso oculto', role: 'status' }));
    }
    var boton = h('button', { class: 'btn btn--prim', onclick: function () {
      var cambios = {};
      cambios[campoLote] = control.value;
      boton.disabled = true; boton.textContent = 'Guardando…';
      llamar('guardarLote', { ids: ids, cambios: cambios }).then(function (r) {
        v.cerrar();
        (r.registros || []).forEach(actualizarEnLista);
        E.iniT = 0; E.pend = null; E.mis = null;
        E.sel.ids = {};
        pintarLista();
        var omit = (r.omitidos || []).map(function (x) { return (x.num ? x.num + ': ' : '') + x.motivo; });
        aviso('Listo: ' + r.cambiados + ' registro' + (r.cambiados === 1 ? '' : 's') + ' cambiado' + (r.cambiados === 1 ? '' : 's') +
          (r.sinCambio ? ' (' + r.sinCambio + ' ya lo tenían)' : '') + '.', r.cambiados ? 'ok' : 'info',
          omit.length ? 'No se tocaron ' + omit.length + ': ' + omit.slice(0, 5).join('; ') + (omit.length > 5 ? '…' : '') : null,
          r.cambiados ? ofrecerDeshacer(r) : null);
      }).catch(function (e) {
        boton.disabled = false; boton.textContent = 'Cambiar ' + ids.length;
        vaciar(msg).appendChild(h('div', { class: 'alerta alerta--error' }, e.message));
      });
    } }, 'Cambiar ' + ids.length);
    var v = ventana({ titulo: titulos[campoLote], ancho: 480, cuidar: true,
      cuerpo: [h('p', { style: { margin: 0 } }, 'Se cambiará en ' + ids.length + (ids.length === 1 ? ' registro' : ' registros') + ' de ' + def.nombre + '. Cada cambio queda en la Bitácora.'),
        campo({ estatus: 'Estatus nuevo', acuse: t === 'OFE' ? '¿Se tiene el original?' : '¿Ya se tiene el acuse?', turnado_usuario: 'Persona', fecha_limite: 'Fecha límite' }[campoLote], control), nota, notaInhabil || null, msg],
      pie: [h('button', { class: 'btn', onclick: function () { v.cerrar(); } }, 'Cancelar'), boton] });
  }

  /* ─────────── Apartar número ─────────── */
  // Así trabajan: primero piden el número y luego escriben el oficio. El número
  // sale al instante y el registro queda «por completar» hasta que tenga asunto.
  function ventanaApartar(t) {
    var def = tipoDef(t);
    var cant = h('input', { class: 'entrada', type: 'number', min: 1, max: 20, value: 1, style: { maxWidth: '110px' } });
    var nota = h('input', { class: 'entrada', maxlength: 300, placeholder: 'Ej.: respuesta a la Alcaldía, para Valentina…' });
    var msg = h('div');
    var max = 0;
    (E.lista || []).forEach(function (r) { if (r.tipo === t) max = Math.max(max, Number(r.consecutivo) || 0); });
    var plantilla = E.ini.config.plantilla_OFS || '';
    var ejemplo = max && plantilla ? plantilla.replace('{NNN}', pad3(max + 1)).replace('{AAAA}', E.ini.anioActual) : '';
    var boton = h('button', { class: 'btn btn--prim', onclick: function () {
      var n = Math.floor(Number(cant.value) || 0);
      if (n < 1 || n > 20) { vaciar(msg).appendChild(h('div', { class: 'alerta alerta--error' }, 'Se pueden apartar de 1 a 20 números por vez.')); cant.focus(); return; }
      boton.disabled = true; boton.textContent = 'Apartando…';
      llamar('apartar', { tipo: t, cantidad: n, nota: nota.value }).then(function (res) {
        v.cerrar();
        (res.registros || []).forEach(actualizarEnLista);
        E.iniT = 0;
        if (E.anio === E.ini.anioActual) E.ini.conteos[t] = (E.ini.conteos[t] || 0) + res.cuantos;
        resultadoApartar(t, res);
      }).catch(function (e) {
        boton.disabled = false; boton.textContent = 'Apartar';
        vaciar(msg).appendChild(h('div', { class: 'alerta alerta--error' }, e.message));
      });
    } }, 'Apartar');
    var v = ventana({ titulo: 'Apartar número · ' + def.nombre, ancho: 480,
      cuerpo: [h('p', { style: { margin: 0 } }, 'Te da el siguiente número ahora, aunque todavía no tengas el oficio. Queda como «por completar» hasta que le pongas el asunto (Editar).'),
        ejemplo ? h('div', { class: 'numero-previo' }, 'Si nadie más guarda antes, te tocará ', h('strong', null, ejemplo), '.') : null,
        h('div', { class: 'rejilla' }, campo('¿Cuántos números?', cant), campo('Para qué (opcional)', nota, { ancho: true, ayuda: 'Queda en las observaciones, para que se sepa de quién es.' })),
        msg],
      pie: [h('button', { class: 'btn', onclick: function () { v.cerrar(); } }, 'Cancelar'), boton] });
  }

  function resultadoApartar(t, res) {
    var regs = res.registros || [], uno = regs.length === 1;
    var texto = regs.map(function (r) { return r.numero || etiquetaNum(r); }).join('\n');
    var copiar = function () {
      (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject()).then(function () { aviso('Copiado: ' + texto.replace(/\n/g, ', '), 'ok'); }, function () { aviso(texto); });
    };
    var rv = ventana({ titulo: uno ? 'Número apartado' : res.cuantos + ' números apartados', ancho: 480, sinFoco: true,
      cuerpo: [
        uno ? h('div', { class: 'apartado' }, h('span', { class: 'apartado__et' }, tipoDef(t).singular + ' ' + etiquetaNum(regs[0])), h('strong', { class: 'apartado__num' }, regs[0].numero || etiquetaNum(regs[0])))
          : h('div', { class: 'alerta alerta--ok' }, 'Del ', h('strong', null, res.desde), ' al ', h('strong', null, res.hasta), '.'),
        h('p', { class: 'campo__ayuda', style: { margin: 0 } }, 'Escríbelo en tu oficio. Cuando lo tengas, ábrelo y usa «Completar» para capturar el asunto y lo demás. Si al final no se usa, pide a un administrador que lo cancele (el número no se vuelve a usar).')],
      pie: [h('button', { class: 'btn', onclick: copiar }, icono('copiar'), uno ? 'Copiar número' : 'Copiar números'),
        uno ? h('button', { class: 'btn', onclick: function () {
          var b = this; b.disabled = true;
          // El formulario necesita el registro completo (versión, observaciones…), no la fila de la lista
          llamar('obtener', { id: regs[0].id }).then(function (d) { rv.cerrar(); formulario(t, d.registro); }).catch(function (e) { b.disabled = false; fallo(e); });
        } }, icono('editar'), 'Completar ahora') : null,
        h('button', { class: 'btn btn--prim', onclick: function () { rv.cerrar(); } }, 'Listo')] });
  }
