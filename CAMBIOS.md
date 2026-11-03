# Cambios

Cada versión dice qué hay que hacer al publicarla. Si usas `npm run publicar`, el
comando hace casi todo y te avisa lo que falta (ver INSTALAR.md, Parte C).

## 1.10.0 · Roles más claros (sin «Consulta»), un solo escaneo en salientes, «Sin archivo» y datos obligatorios

**Al publicar: no hay columnas nuevas → NO hace falta correr `instalar()`.** Reemplaza el
código y publica la **Nueva versión** en la misma implementación. Cambian 3 archivos de
Apps Script (`Servidor.gs`, `Seguridad.gs` y `Avisos.gs`) y 6 de `web/app/`
(`01-nucleo.js`, `04-portal.js`, `05-libreta.js`, `06-detalle.js`, `07-formulario.js` y
`09-admin.js`). La página pide el servidor 1.10.0: publica **primero el servidor**. Si la
página sale antes no se rompe nada; solo falta, mientras tanto, que el acuse se marque solo
y el aviso «sin archivo» de la tarjeta.

**Roles**

- **Se quita el rol «Consulta».** Quedan **Administrador** y **Captura**.
- **Informes y Directorio, solo Administrador** (tarjeta, pantalla y servidor). La casilla
  «Puede ver Informes» desaparece de Usuarios; la columna `informes` de la hoja *Usuarios*
  se queda sin usarse (no se borra nada).
- Captura sigue eligiendo personas en el formulario y puede agregar una nueva desde ahí
  («+ Agregar … al directorio»); lo que ya no ve es la pantalla del Directorio, ni Informes,
  Usuarios, Bitácora, Exportación o Configuración (estas cuatro ya eran solo del administrador).
- **Quien todavía tenga «Consulta» en la hoja** no entra: su sesión abierta se cierra, al
  entrar dice que ya no tiene un rol asignado, no recibe turnos ni el resumen diario, y en
  **Usuarios** aparece como «Sin rol · elige uno». El administrador abre **Editar**, elige
  Captura (o Administrador) y guarda. **No se les cambia solo a Captura** para que nadie
  gane permisos sin que una persona lo decida.
- Las notas de seguimiento las puede agregar cualquiera con acceso a la libreta (antes,
  Consulta solo en lo que le turnaron).

**Oficios salientes**

- **Un solo escaneo: «Oficio escaneado (con acuse)».** Como el escaneo ya lleva el acuse,
  se quitó el segundo botón (en el detalle y en el formulario). **Al subirlo, la casilla
  «Acuse» se marca sola** (queda en la Bitácora como «acuse marcado»). Si lo subieron antes
  de tener el acuse, basta quitar la palomita al editar. Los oficios que ya tenían un acuse
  subido aparte lo conservan: se ve como «Acuse (archivo anterior)», para abrirlo o quitarlo,
  y cuenta como archivo. En las demás libretas todo sigue igual.
- **Filtro «Sin archivo»**: los oficios salientes que no tienen ningún escaneo (ni el
  documento ni un acuse subido aparte). Está en tres lugares: un cuadro junto a «Sin acuse»,
  una opción en la lista de filtros y un aviso «N sin archivo» en la tarjeta del portal. No
  cuenta cancelados ni números apartados sin completar, y **respeta la fecha de
  Configuración** que antes se llamaba «Sin acuse cuenta desde» (ahora «Sin acuse» y «Sin
  archivo» cuentan desde), para que lo migrado del Excel no infle el número. Se distingue de
  «Sin acuse»: ese mira la casilla; este mira si hay escaneo.
- **Datos obligatorios**: Dirigido a, Asunto, Fecha, Firma, Revisó / Elaboró y No. de
  carpeta (Observaciones no). El formulario los marca con asterisco y avisa **todos los que
  faltan juntos**. **El servidor es quien manda**: aunque alguien manipule el navegador, no se
  guarda; aplica también a Duplicar, a Varios destinatarios (ya en la vista previa) y a
  completar un número apartado. «Apartar número» sigue sin pedir nada (reserva el número);
  los datos se piden al completarlo. Un registro **viejo que ya estaba incompleto** (los
  migrados) se puede seguir editando sin llenar todo, pero no se puede vaciar un dato que ya
  tenía. Los cambios en lote («Atendido», acuse, turno) no pasan por esta regla. Las demás
  libretas siguen pidiendo solo asunto y fecha.

**Para quien mantiene el código**

- `ROLES` ya no trae `consulta`; `rolValido_(u)` cierra la entrada, la sesión, los turnos y los
  avisos de quien conserve un rol retirado (código `SIN_ROL`). `guardarUsuario` rechaza un rol
  vacío o desconocido; la pantalla de Usuarios no deja a esa persona «preseleccionada» como
  Administrador.
- `informes` y `directorio` en `ACCIONES_` son `rol: 'admin'`; la página los cierra también en
  la ruta. El formulario no depende de la acción `directorio`: usa la lista que ya viene en
  «inicio».
- `OBLIGATORIOS` (Servidor.gs) y `OBLIG` (07-formulario.js) deben decir lo mismo: una prueba
  lo revisa. `exigirObligatorios_(o, tipo, previo)` es la regla; `previo` es el registro
  guardado al editar.
- `cuentaSinArchivo_` y `indicadores_` traen `sinArchivo` por libreta. `SERVIDOR_MINIMO` y
  `NOVEDADES` pasan a 1.10.0.
- Pruebas: 135 (101 corren sin `base/base.json`, 34 con ella). Nuevo `pruebas/v1100.test.cjs`.
  La plantilla `nuevoOficio` de las pruebas ahora trae la carpeta, porque los salientes la piden.

## 1.9.0 · Más fácil de mantener: la página vive solo en Vercel

Para la gente no cambia nada: mismas pantallas, misma dirección, mismos datos. Lo que
cambia es **cómo se actualiza**.

**Antes**, la página existía dos veces: dentro de Apps Script (13 archivos `.html` con el
código metido adentro) y en Vercel. Cualquier cambio, aunque fuera un botón, obligaba
a subir los 20 archivos a Google, publicar una versión nueva, empatar `VERSION` con
`VERSION_APP` y hacer `git push`.

**Ahora** cada lado se publica solo cuando cambia:

| Lado | Carpeta | Cómo se publica |
|---|---|---|
| Página: pantallas, textos, colores | `web/` | `git push` (o editar el archivo en github.com). Google no se toca. |
| Servidor: guardar, permisos, correos | `apps-script/` | `npm run publicar`, o pegar **solo el `.gs` que cambió** y «Nueva versión». |

- **Apps Script tiene 7 archivos** (6 `.gs` + `appsscript.json`) en vez de 20. Ningún HTML.
- **La página son archivos normales** en `web/`: `index.html`, `estilos.css`, `excel.js`
  y la app en `web/app/01-nucleo.js` … `99-arranque.js` (los antiguos `App*.html`, sin las
  etiquetas `<script>`). Se juntan solos en orden de número.
- **No hay que empatar versiones.** `VERSION_APP` desapareció. La página dice qué servidor
  necesita (`SERVIDOR_MINIMO`) y solo avisa a los administradores si el publicado es
  más viejo. «Qué hay de nuevo» sale cuando cambia `NOVEDADES` (ya no con cada versión).
- **`npm run publicar` publica solo lo que cambió**: si no tocaste ningún `.gs`, no usa
  clasp ni Google. Si cambiaste uno, lo publica (o, sin clasp, te dice exactamente qué
  archivo pegar).
- **Si escribes algo mal en `web/app/`**, la página no se publica rota: el armado se
  detiene y dice el archivo y el renglón. En Vercel sigue la versión anterior.
- **`npm run local`** arranca página y servidor en una sola dirección
  (http://localhost:4321), con o sin `base/`. Cambias algo en `web/` y recargas.
- **La URL de Google (`/exec`) ya no abre la app**: muestra un enlace a la página de
  Vercel (y `?r=ID` lleva a ese registro). Si aún no está guardada la dirección, el
  portal le ofrece al administrador un botón **«Guardar esta dirección»**.
- El código QR del volante apunta a la dirección guardada o, si falta, a la página desde
  donde se imprimió (antes podía apuntar a la URL de Google).

**Al publicar esta versión (una sola vez):**

1. Copia el contenido del zip encima de tu carpeta del proyecto (la de git) y borra
   las pantallas viejas del servidor:

   ```bash
   git rm apps-script/*.html
   ```

   (Si se te olvida, `npm run publicar` se detiene y te lo recuerda.)
2. **Con clasp:** `npm run publicar -- "1.9.0: la página vive solo en Vercel"`. Como es
   la primera vez con el comando nuevo, publica el servidor completo; `clasp push`
   borra solo los `.html` del proyecto de Apps Script.

   **Sin clasp:** en el editor de Apps Script borra los 13 archivos HTML (`Index`,
   `Estilos`, `Excel` y los diez `App…`), pega `Servidor.gs`, `Instalacion.gs` y
   `Seguridad.gs`, y publica **Implementar → Gestionar implementaciones → ✏ → Nueva
   versión**. Después, `git push` (o `npm run publicar -- "1.9.0" --ya-publique-servidor`).
3. **No hace falta correr `instalar()`** (no hay columnas nuevas) **ni tocar Vercel**:
   misma variable `CG_API_URL`, mismo `vercel.json`.
4. Entra a la app como administrador. Si el portal dice «Falta guardar la dirección de
   la app», presiona **Guardar esta dirección**.

Si alguien todavía entraba por la URL de Google, ahora verá el enlace a Vercel.

## 1.8.0 · Más fácil de usar: apartar número, calendario, notas y atender en un toque

**Al publicar: no hay columnas nuevas ni permisos nuevos → NO hace falta correr
`instalar()`.** Solo se reemplaza el código y se publica la **Nueva versión** en la
misma implementación.

Cambian 10 archivos de Apps Script (ninguno nuevo): `Servidor.gs`, `Avisos.gs`,
`App.html`, `AppEntrada.html`, `AppPortal.html`, `AppLibreta.html`, `AppDetalle.html`,
`AppFormulario.html`, `AppInformes.html` y `Estilos.html`. Los demás quedan igual.

**Para quien captura**

- **Apartar número** (Oficios salientes): el siguiente número al instante, de 1 a 20
  a la vez, con una nota de para qué. Queda «por completar» (sin asunto) hasta que se
  captura el oficio con **Completar**; el portal le recuerda a cada quien los suyos, la
  libreta tiene el indicador y el filtro «Por completar», y la tarjeta lo cuenta. Los
  números apartados en el minutario (411 a 415…) también cuentan.
- **Lo de siempre**: al capturar, la firma (en lo recibido, el destinatario) y quién
  elaboró salen como en el último registro de esa persona en esa libreta.
- **Guardar y capturar otro**: guarda y abre otro formulario limpio, sin pasar por el detalle.
- **Arrastrar el escaneo**: en computadora, soltar el PDF o la imagen sobre el registro
  (Documento o Acuse) o sobre el formulario. Si ya había archivo, pregunta antes de reemplazarlo.
- Aviso cuando la fecha límite que se escribe cae en fin de semana o día inhábil.

**Para dar seguimiento**

- **Atendido en un toque** en Mis asuntos, Pendientes y Calendario.
- **Deshacer**: después de un cambio en lote o de «Atendido», el aviso trae «Deshacer»
  por unos segundos. El servidor guarda cómo estaba todo (10 minutos, una sola vez,
  solo quien hizo el cambio y solo en lo que nadie volvió a tocar). No manda correos.
- **Notas de seguimiento** en cada registro, con nombre y fecha. Quedan en la Bitácora:
  no se editan ni se borran. Las agrega quien captura o la persona a quien se turnó
  (aunque sea de Consulta).
- **Calendario** (tarjeta en Seguimiento): las fechas límite del mes, con fines de
  semana y días inhábiles marcados, «Solo lo mío» e «Incluir atendidos». En celular,
  cada día muestra cuántos vencen.
- **Volante con código QR**: con el celular abre ese registro (después de entrar). Los
  correos de turno de un solo asunto también abren el registro directo.

**Para que nadie se pierda**

- **Ayuda** (arriba en el portal): «Qué hay de nuevo» sale solo una vez por versión; a
  quien entra por primera vez le salen los «Primeros pasos».
- **Ordenar por columna** (número, asunto, persona, fecha, estatus) tocando el título; en
  celular, con la lista «Ordenar». Cada libreta recuerda su filtro y su orden en ese
  equipo, y «Quitar filtros» los limpia.

**Además**

- El gris de los textos secundarios pasó de `#7b7e80` a `#696b6d`: ahora sí cumple 4.5:1.
- Las preferencias (filtros, orden, ayuda vista) se guardan en el navegador de ese
  equipo; nunca datos de los oficios.
- 120 pruebas (12 nuevas) y el recorrido en navegador de lo nuevo (`capturas/1.8.0/`).

## 1.7.0 · Dos pasos, cambios en lote, avisos, respaldos diarios y correcciones

**Al publicar: hay DOS columnas nuevas y permisos nuevos → corre `instalar()` una vez**
(después de subir el código y antes de «Nueva versión»; `npm run publicar` lo pide):

- *Usuarios* → `correo` y `totp` (al final, después de `informes`).
- Google pide **autorizar otra vez**: mandar correos (avisos), Google Docs (borrador del
  oficio), conectarse a servicios externos (convertir el borrador a Word) y ejecutarse
  sin ti (respaldo diario y avisos). Acepta con la cuenta dueña.
- `instalar()` además crea la carpeta «Plantillas», los secretos de las contraseñas,
  mide el cifrado, cambia el disparador de los lunes por el **respaldo diario** (6 am)
  y agrega el de **avisos** (8 am). Llena `fecha_atencion` donde falte.
- Son archivos nuevos: `Seguridad.gs`, `Avisos.gs`, `Respaldos.gs`, `Plantillas.gs` y la
  página partida en `App*.html` (ver la tabla de INSTALAR.md, A2). Con `clasp push`
  (o `npm run publicar`) se suben solos; a mano hay que crearlos.
- La página nueva funciona con el servidor 1.6.0 (lo nuevo no aparece hasta publicarlo).

Después de publicar, recomendado (INSTALAR.md, A5 a A7): activar **dos pasos** en «Mi
cuenta», poner **plazo** y **días inhábiles**, la fecha de **«sin acuse» desde**, y la
carpeta de **respaldo externo**.

**Lo nuevo**

- **Verificación en dos pasos** (código de 6 dígitos de Google Authenticator o similar),
  con código QR dibujado en la página. Opción de hacerla obligatoria para administradores.
  Un administrador se la puede quitar a quien pierda el teléfono.
- **«Mi cuenta»**: contraseña, dos pasos, correo para avisos y «olvidar este equipo».
- **Cambiar varios a la vez** en cada libreta: estatus, acuse, turnar o fecha límite,
  hasta 500 registros, cada cambio en la Bitácora.
- **Ver escaneos sin descargarlos**: imagen o PDF en una ventana, con «Descargar».
- **Borrador del oficio en Word** desde una plantilla de Google Docs.
- **Días inhábiles** (con botón para los de ley y Semana Santa de cada año): no cuentan
  para la fecha límite, «vence pronto» ni el tiempo de respuesta de Informes.
- **«Sin acuse» cuenta desde** una fecha: lo migrado ya no infla el indicador.
- **Avisos por correo** (apagados de inicio): al turnar y un resumen diario a las 8 am.
  Sin el asunto, salvo que se pida.
- **Respaldos**: copia diaria (14 diarias + 12 semanales), copia de cada escaneo en
  «Archivos (espejo)», carpeta externa opcional (`respaldo_externo`) y
  `revisarRespaldos()` para probar que la copia sirve.
- **Recomendaciones en el portal** al administrador: poner plazo y activar dos pasos.
- **Si la sesión se vence con algo abierto**, se pide la contraseña encima y lo que se
  estaba guardando se guarda solo (antes se perdía lo escrito).

**Seguridad**

- Contraseñas: PBKDF2 con «pimienta» guardada fuera de la hoja y repeticiones medidas
  en el servidor (hasta 60 000); se vuelven a cifrar al entrar. Las de la 1.6.0 siguen
  sirviendo.
- Reglas nuevas: 10 caracteres o más, letras y números, sin usuario ni nombre y sin
  palabras obvias (gestión, CDMX, meses, qwerty…). Quien tenga una que no cumple la
  cambia al entrar. La contraseña temporal ahora es de 12 caracteres.
- Bloqueo progresivo (15 min, 1 h, 4 h). El freno general cuenta solo intentos fallidos
  (30 por minuto), así que un ataque ya no deja fuera a todos; desde un **equipo de
  confianza** (180 días) el dueño de la cuenta entra aunque esté bloqueada.
- Alertas de **consultas inusuales** a la Bitácora y por correo a los administradores.
- `avisosDiarios` y `respaldoDiario` (públicas porque las llama un disparador) solo
  hacen algo si las llama su disparador o el dueño, y una vez al día.
- La plantilla del oficio solo se acepta desde su carpeta privada.
- CSP: `frame-src blob:` y `object-src blob:` para ver PDF dentro de la página; nada externo.

**Correcciones**

- **Bitácora dentro del candado**: dos movimientos al mismo tiempo ya no pueden
  escribirse en el mismo renglón. Si el candado no se consigue, se anota con `appendRow`.
- **Subir y quitar escaneos**: el archivo se crea en Drive y se manda a la papelera
  **fuera** del candado (antes un escaneo grande detenía a todos); si falla, no queda
  basura en Drive.
- **Caché de lecturas** (comprimida, con versión): las listas y búsquedas ya no leen
  toda la hoja en cada vuelta. La caché se invalida en cada escritura y se apaga con la
  propiedad `CACHE_REGISTROS=NO`.
- Bitácora del administrador: se lee desde el final por bloques (no completa); avisa
  cuando no revisó todo.
- La página espera un tiempo máximo a cada llamada (antes podía quedarse «cargando»
  para siempre si se caía la red) y lo dice.
- Ventanas y panel (teclado y lectores de pantalla): el foco entra a la ventana, el Tab
  no se sale, al cerrar regresa al botón que la abrió y el título se anuncia.
- Contraste (WCAG AA): café y magenta un poco más oscuros, sin texto translúcido sobre
  color, chips e indicadores con fondo oscuro.
- A lo más tres avisos a la vez en pantalla.
- El código del servidor y de la página quedó en archivos por tema (antes, `App.html`
  de 2 700 líneas y `Servidor.gs` con todo).

**Para quien le da mantenimiento**

- `npm run empaquetar`: .zip del código sin datos ni credenciales.
- `npm run e2e`: recorrido en Chromium (Vercel con su CSP y Apps Script); capturas en
  `capturas/1.7.0/`.
- GitHub Actions corre `npm test` en cada push (`.github/workflows/pruebas.yml`).
- 108 pruebas (antes 69), incluido el QR leído con OpenCV y la carga de los `.gs` en
  los dos órdenes.

## 1.6.0 · Exportación solo para administradores, paleta del manual y velocidad

**Al publicar: no hay columnas nuevas.** Si en Google todavía está una versión anterior
a la 1.5.0, corre `instalar()` una vez (agrega `turnado_usuario`, `fecha_atencion` e
`informes`; se puede correr las veces que sea).

Cambian: `Servidor.gs`, `Instalacion.gs`, `App.html`, `Estilos.html` (y en la página:
`herramientas/armar-web.mjs`).

- **Exportación** (tarjeta y pantalla, solo administradores): todas las libretas o una,
  de una fecha a otra (Este mes, Mes pasado, Este año, Año pasado, Todo o fechas a mano),
  con vista previa de cuántos registros salen. Cuenta la fecha de recibido; si no hay,
  la del documento. El Excel trae además «Responsable en el sistema» y «Fecha de atención».
- **El servidor ya no deja exportar a Captura ni a Consulta** (`exportar` pide rol
  admin), aunque llamen a la acción directo. Se quitó el botón «Excel» de cada libreta
  y el «Excel de todas» del portal. El Excel de **Informes** sigue igual: lo tiene quien
  tenga permiso de Informes.
- **Paleta exacta del Manual de Identidad CDMX 2024-2030** en tarjetas, pantallas,
  buscador y gráficas de Informes (café `#ac6d14`, magenta `#d72f89`, rojo `#e5074c`…).
- **Velocidad** (ver LEEME, «Velocidad»):
  - `entrar` ya trae el portal (una vuelta menos al entrar).
  - Después de entrar, en segundo plano: las listas del año de todas las libretas en una
    sola vuelta (`listarTodo`), Pendientes y, si hay algo turnado, Mis asuntos. Al
    abrirlas ya se ven; si alguien más capturó algo, aparece un segundo después.
  - El panel de un oficio abre al instante con lo que ya se ve en la lista; archivos
    e historial llegan después (Editar, Duplicar e Imprimir se activan al llegar todo).
  - Guardar, cancelar, subir o quitar archivo regresan el panel completo (`detalle`):
    ya no se pide otra vez.
  - En el servidor la hoja se abre **una vez por petición**, y el historial de un oficio
    busca solo sus renglones en la bitácora (antes la leía completa en cada consulta,
    y la bitácora crece todos los días). La Bitácora del administrador se lee una vez,
    no dos.
  - Lo guardado en memoria es solo de esa pestaña, nunca en disco, y se borra al salir
    o al cambiar de usuario.
- La página nueva funciona con un servidor 1.5.0 (sin precarga ni Exportación hasta que
  se publique el servidor; el administrador ve el aviso de versiones).

## 1.5.0 · Volante imprimible e Informes

**Al publicar: hay DOS columnas nuevas → corre `instalar()` una vez** (después de pegar o
subir el código y antes de «Nueva versión»):

- *Registros* → `fecha_atencion` (al final, después de `turnado_usuario`): el día en que
  el registro pasó a Atendido o Concluido. La llena el servidor.
- *Usuarios* → `informes` (al final, después de `ultimo_acceso`): `SI` = puede ver Informes.

Qué trae:

- **Imprimir volante** en el detalle de lo recibido: media carta con encabezado y logo,
  números, fecha y hora de recepción, remitente, asunto, turnado a, fecha límite, recibió,
  observaciones y espacios para firma y sello (`@media print` + `window.print()`).
- **Informes** (tarjeta y pantalla): filtros de periodo y libreta; registros por mes y por
  libreta; principales remitentes y destinatarios; tiempo promedio de respuesta
  (entrante → oficio saliente con «Responder»); porcentaje atendido a tiempo contra la
  fecha límite; Excel con el detalle. Gráficas SVG hechas a mano.
- **Permiso de Informes** en Usuarios (los administradores siempre lo tienen). Cambiarlo
  cierra la sesión de esa persona, como cualquier cambio de permisos.
- `api()` admite permisos por acción además del rol (`permiso` en `ACCIONES_`).

Después de una revisión de seguridad independiente:

- Al cerrar sesión la página olvida todo lo de esa persona (informes, búsqueda, lista,
  filtros), para que en una computadora compartida el siguiente no vea nada del anterior.
- `npm run publicar` ahora solo deja subir código y documentación: cualquier archivo
  nuevo que no lo sea (PDF, foto, Excel, `.json`, carpetas desconocidas…) lo detiene.
- «Varios destinatarios»: el servidor exige los números confirmados (`desde`); sin la
  vista previa no guarda nada.
- El servidor manda a la hoja lo escrito (`flush`) antes de soltar el candado, como
  recomienda Google, para que el siguiente lea siempre el último consecutivo.
- La reparación automática de columnas solo actúa si esas columnas están vacías en
  toda la hoja (no adopta notas escritas a mano).
- Si a un administrador lo bajan de rol, no se queda con «Informes» marcado sin que
  alguien lo elija.

## 1.4.0 · Duplicar, fotos, buscador general, mantenimiento y respaldo

**Al publicar: no hay columnas nuevas** (no hace falta `instalar()`; si lo corres, solo
agrega a *Config* las filas `mantenimiento` y `mantenimiento_msg`, que de todos modos se
crean solas la primera vez que se prende el mantenimiento).

- **Duplicar** en el detalle: abre el alta con los datos copiados (sin número, archivos,
  estatus, cancelación, historial, acuse, relación ni fechas). La Bitácora dice de cuál
  es copia.
- **Tomar foto** en Documento y Acuse: cámara trasera del celular; se reduce en el
  navegador (2000 px, JPEG 80 %) antes de subir. Imágenes de más de 10 MB con «Subir»
  también se reducen. Sin cambios en la CSP ni en Permissions-Policy.
- **Buscador general** en el portal: todas mis libretas y todos los años, sin acentos
  ni mayúsculas, hasta 50 resultados agrupados por libreta.
- **Modo mantenimiento** (Configuración): solo entran los administradores; la pantalla
  de entrada muestra el mensaje; las sesiones abiertas salen con el aviso (código
  `MANTENIMIENTO`); queda en la Bitácora.
- **Respaldo completo** en Excel (Configuración, solo admin): Registros, Directorio,
  Usuarios sin clave ni sello, Bitácora y Config. Queda en la Bitácora.
- La página pregunta cada 5 min si la sesión sigue viva (`ping`); esa pregunta no
  alarga la sesión, así que al pasar 3 h sin uso la página regresa sola a la entrada.
- Excel: una fecha que no tiene forma AAAA-MM-DD se conserva como texto (antes quedaba vacía).

## 1.3.0 · Varios destinatarios, Mis asuntos y publicar con un comando

**Al publicar: hay una columna nueva → corre `instalar()` una vez** (después de pegar
o subir el código y antes de «Nueva versión»).

- **Columna nueva** al final de la pestaña *Registros*: `turnado_usuario` (a qué
  usuario del sistema se le turnó el asunto). Las columnas anteriores no se mueven.
- **Varios destinatarios** en *Nuevo oficio saliente*: el mismo oficio para hasta 100
  personas, con números seguidos asignados dentro de un solo candado, confirmación
  previa con el rango exacto y bitácora por oficio más un resumen.
- **Mis asuntos**: turnar a un usuario activo con acceso a la libreta (en
  *Seguimiento*), tarjeta y pantalla propias, filtro «Turnados a mí» en cada libreta,
  aviso en el portal y bitácora del turno.
- **`npm run publicar -- "mensaje"`**: pruebas, versiones, `clasp push`, nueva versión
  de la implementación, revisión de datos y `git push`, deteniéndose con explicación
  si algo falla. Funciona en Windows.
- La página nueva funciona con un servidor anterior: lo nuevo simplemente no aparece
  hasta que se publica el servidor (y el administrador ve el aviso de versiones).
- Una página anterior que edite un registro **no borra** el turno.
- Red de seguridad: si se publica el código sin correr `instalar()`, la app agrega
  sola el encabezado de la columna nueva y lo anota en la Bitácora.
- En celular los campos usan letra de 16 px y los botones son más altos.
- `npm test`: la prueba de Excel ya no falla en Windows si Python se llama `python` o
  `py` (y se salta si no hay openpyxl).
