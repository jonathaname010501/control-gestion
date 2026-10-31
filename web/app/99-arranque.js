  /* Control de Gestión · Arranque (va al final: todo lo demás ya está definido). Es una parte de la app: se junta con las demás de web/app/ (ver 01-nucleo.js). */
  /* ───────────────────────── Arranque ───────────────────────── */
  // Con sesión abierta (al recargar), el portal se pide directo: no hace falta esperar los
  // encabezados públicos, que solo usa la pantalla de entrada.
  if (E.token) cargarInicio();
  else llamar('estado').then(function (p) {
    E.publico = p; E.publicoEn = Date.now();
    pantallaEntrar();
  }).catch(function (e) {
    vaciar(app).appendChild(h('div', { class: 'arranque' }, h('div', { class: 'arranque__marca' }, 'Control de Gestión'),
      h('div', { class: 'alerta alerta--error', style: { maxWidth: '520px' } }, e.message)));
  });
