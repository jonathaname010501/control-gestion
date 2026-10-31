# Instalar el Control de Gestión

Hay dos partes, y las dos son necesarias:

- **Parte A · Google** (carpeta `apps-script/`): la base, el servidor y los escaneos.
  Son 7 archivos.
- **Parte B · GitHub + Vercel** (carpeta `web/`): la página que abre la gente, con una
  dirección propia. Se actualiza sola con cada `git push`. Vercel **solo guarda la
  página** (pantallas y estilos), ningún dato.

Al final está la **Parte C**: cómo publicar cambios.

Necesitas una cuenta de Gmail del área, GitHub, Vercel y (para la Parte C) Node.js 20 o más.

---

# Parte A · Google

## A0 · La cuenta dueña

Usa una cuenta **del área**, no el Gmail personal de alguien (por ejemplo
`controlgestion.stpi@gmail.com`). Actívale la **verificación en dos pasos** en
myaccount.google.com → Seguridad. Haz todo lo de Google con esa cuenta; si tienes
varias cuentas abiertas, usa una ventana de incógnito.

## A1 · Subir la base

1. drive.google.com → **Nuevo → Subir archivo** → `base/Control_de_Gestion.xlsx`.
2. Ábrelo. Arriba dirá **.XLSX** → **Archivo → Guardar como Hojas de cálculo de Google**.
3. En la copia nueva, cambia el nombre a **Control de Gestión (base)**.
4. Borra el `.xlsx` de tu Drive.
5. ⚠️ **No compartas la hoja con nadie.**

## A2 · Pegar el código del servidor

1. En la hoja: **Extensiones → Apps Script**.
2. Cambia "Proyecto sin título" por **Control de Gestión**.
3. **⚙ Configuración del proyecto** → marca **"Mostrar el archivo de manifiesto
   «appsscript.json» en el editor"**. Regresa al editor (`< >`).
4. Crea los archivos. El editor agrega `.gs` solo, así que escribe el nombre **sin**
   extensión:

   | Archivo | Cómo | Contenido |
   |---|---|---|
   | `Servidor` | Renombra `Código` (⋮ → Cambiar nombre) | `apps-script/Servidor.gs` |
   | `Seguridad`, `Avisos`, `Respaldos`, `Plantillas`, `Instalacion` | **+ → Script** (o "Secuencia de comandos"), uno por archivo | `apps-script/<nombre>.gs` |
   | `appsscript.json` | Ya existe | `apps-script/appsscript.json` |

   En cada uno: borra lo que traiga, pega **todo** y guarda (Ctrl+S). Son 6 archivos
   más el manifiesto. **Nada de HTML**: las pantallas viven en Vercel (Parte B).

   > Si no encuentras la opción para crear un script, pega el contenido de los `.gs`
   > **al final** de `Servidor`, uno tras otro. Funciona igual.

   > Con clasp (Parte C) todo esto se hace con un solo comando.

## A3 · Correr `instalar()`

1. En la lista de la izquierda abre **`Instalacion.gs`**. El menú de funciones de
   arriba solo muestra las del archivo abierto.
2. En ese menú elige **`instalar`** → **▶ Ejecutar**.
3. Permisos: **Revisar permisos** → tu cuenta → "Google no verificó esta app" →
   **Configuración avanzada → Ir a Control de Gestión (no seguro) → Permitir**.
   Es normal: la app es tuya y no está publicada en ninguna tienda. Pide ver y editar
   la hoja y el Drive, **mandar correos como tú** (avisos), **documentos de Google**
   (borrador del oficio), **conectarse a servicios externos** (solo para convertir el
   borrador a Word, en el mismo Google) y **ejecutarse cuando no estás** (respaldo
   diario y avisos de las 8 am).
4. En el **Registro de ejecución** copia el **PRIMER ADMINISTRADOR** (usuario y
   contraseña temporal). No se vuelve a mostrar.
5. Revisa que termine en **✔ Todo en orden**.

`instalar()` también crea las carpetas «Archivos», «Respaldos» y «Plantillas» (las tres
privadas), los secretos de las contraseñas (en las propiedades del proyecto, **no** en
la hoja), mide cuánto aguanta el cifrado de contraseñas en tu servidor y deja
programados el **respaldo diario** (6 am) y los **avisos** (8 am). Se puede correr las
veces que sea: lo que ya existe no lo toca.

## A4 · Publicar el servidor (aplicación web)

1. **Implementar → Nueva implementación** → ⚙ → **Aplicación web**.
2. Descripción `Versión 1` · **Ejecutar como: Yo** · **Quién tiene acceso: Cualquier usuario**.
3. **Implementar** → copia la **URL de la aplicación web** (termina en `/exec`).

Esa URL es el **servidor**: la página de Vercel le habla a esa dirección (Parte B).
Si la abres en el navegador solo verás un aviso; la app se abre en Vercel.

> **¿Por qué "Cualquier usuario"?** La puerta la cuida la app con su propio
> usuario y contraseña. Con cuentas Gmail, Google no le dice a la app quién entra,
> y la página de Vercel necesita poder llamarla.

## A5 · Respaldo fuera de la cuenta dueña (recomendado)

Los respaldos diarios quedan en el mismo Drive. Si la cuenta dueña tuviera un problema
(la borran, la suspenden, le roban el acceso), también se irían. Para tener una copia
en otro lado:

1. Con **otra** cuenta (de otra persona responsable del área) o en una **unidad
   compartida**, crea una carpeta, por ejemplo «Respaldo Control de Gestión».
2. Compártela con la **cuenta dueña** como **Editor**. Que nadie más tenga acceso.
3. Abre la carpeta y copia su ID: lo que sigue de `/folders/` en la dirección.
4. En la hoja (con la cuenta dueña), pestaña **Config**, renglón **`respaldo_externo`**:
   pega el ID en la columna «valor». Esto solo se puede hacer en la hoja, no desde la app.
5. Al día siguiente (o corriendo `respaldoDiario` desde el editor) aparecen ahí la copia
   de la hoja y la carpeta «Archivos (espejo)».
6. Una vez al mes, corre **`revisarRespaldos`** desde el editor: abre la copia más
   reciente (local y externa), revisa pestañas y columnas, compara renglones y cuenta
   los escaneos copiados.

**Restaurar** (si la hoja original se perdió): la copia de respaldo es una hoja de
Google con su propio Apps Script. Ábrela con la cuenta dueña → **Extensiones → Apps
Script** → corre `instalar()` → publica una implementación nueva (A4) y cambia
`CG_API_URL` en Vercel. Las contraseñas cifradas dependen de un secreto que vive en el
proyecto original (`PIMIENTA`): si se restaura en un proyecto nuevo, corre
`restablecerAdministrador()`, y desde **Usuarios** dale a cada quien **Nueva contraseña**
y marca **«Quitar su verificación en dos pasos»**. Los datos y escaneos no se pierden.

## A6 · Borrador del oficio en Word (opcional)

1. En Google Docs, escribe el oficio con su formato y, donde va cada dato, un marcador:
   `{{NUMERO}}`, `{{FECHA_LARGA}}`, `{{DESTINATARIO}}`, `{{CARGO_DESTINATARIO}}`,
   `{{ASUNTO}}`, `{{FIRMA}}`, `{{CARGO_FIRMA}}`, `{{ELABORO}}`… (lista completa en
   LEEME.md, «Borrador del oficio en Word»).
2. Mueve el documento a la carpeta **«Control de Gestión · Plantillas (NO COMPARTIR)»**
   que creó `instalar()`. Fuera de esa carpeta no se acepta.
3. En la app (cuando ya esté en Vercel, Parte B): **Configuración → Borrador del oficio
   en Word** → pega el enlace del documento → **Guardar**.

---

# Parte B · GitHub + Vercel

## B1 · Repositorio privado en GitHub

1. En github.com → **New repository** → nombre `control-gestion` → **Private** → Create.
2. En tu computadora, dentro de la carpeta `control-gestion` (la del zip):

   ```bash
   git init
   git add .
   git status
   ```

   Revisa que en la lista **no** aparezcan `base/`, `capturas/` ni ningún `.xlsx`.
   El archivo `.gitignore` los deja fuera a propósito, porque son datos reales.

   ```bash
   git commit -m "Control de Gestión"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/control-gestion.git
   git push -u origin main
   ```

## B2 · Vercel

1. vercel.com → **Add New → Project** → importa `control-gestion`.
2. **Framework Preset: Other**. No cambies Build ni Output: los toma de `vercel.json`.
3. **Environment Variables** → agrega:
   - Nombre: `CG_API_URL`
   - Valor: la URL `/exec` del paso A4 (`https://script.google.com/macros/s/AKfy…/exec`)
4. **Deploy**. Si la variable falta o está mal, el build se detiene y te dice por qué.
5. Abre la dirección que te da Vercel (por ejemplo `https://control-gestion.vercel.app`)
   y entra con tu usuario.

Si quieres un dominio propio: Vercel → Settings → Domains.

## B3 · Primer ingreso

1. Abre la dirección de Vercel → entra con `admin` y la contraseña temporal del paso A3
   → crea la tuya (10 caracteres o más, letras y números, nada fácil de adivinar).
2. En el portal sale **«Falta guardar la dirección de la app»** → **Guardar esta
   dirección**. Así el código QR del volante, los correos y la URL de Google `/exec`
   llevan a Vercel. (También está en **Configuración → Dirección pública de la app**.)
3. **Usuarios → Editar** en `admin` → pon tu nombre (y tu correo, si quieres avisos).
4. **Mi cuenta → Verificación en dos pasos → Activar** (el portal te lo recuerda).
5. **Configuración**: pon el **plazo de respuesta**, los **días inhábiles** del año
   («Agregar los de ley» y luego compáralos con la Gaceta Oficial de la CDMX) y, en
   «"Sin acuse" cuenta desde», el día en que empiezan a usar el sistema. Cuando todos
   los administradores tengan dos pasos, márcala como obligatoria.
6. **Usuarios → Nuevo usuario** para cada persona, y comparte la **dirección de Vercel**.

## B4 · Revisar seguridad y migración

- En el editor de Apps Script corre **`revisarSeguridad`**. Debe decir que todo está privado.
- En la hoja, revisa la pestaña **"Revisar migración"** (86 avisos). Corrige en
  **Directorio** lo que haga falta y luego borra la pestaña.

---

# Parte C · Publicar cambios

El sistema tiene dos lados, y **cada uno se publica solo cuando cambia**:

| Lo que cambiaste | Dónde está | Qué hacer |
|---|---|---|
| **Pantallas**, botones, textos, colores | `web/` | Solo `git push`. Vercel la publica en 1 o 2 minutos. **Google no se toca.** |
| **El servidor**: guardar, permisos, correos, respaldos | `apps-script/*.gs` | Publicar el servidor (con clasp, C2; o a mano, C4) y luego `git push`. |

Lo más fácil es **`npm run publicar`** (C1): revisa qué cambió y hace solo lo necesario.

## C1 · Publicar un cambio: `npm run publicar`

Abre una terminal **en la carpeta del proyecto** (en Windows: abre la carpeta
`control-gestion` en el Explorador, escribe `cmd` en la barra de dirección y presiona
Enter; también sirve PowerShell o Git Bash) y escribe el comando con una frase corta
que diga qué cambió (entre comillas):

```bash
npm run publicar -- "Botón para imprimir más grande"
```

> En PowerShell también funciona sin los dos guiones: `npm run publicar "Botón más grande"`.

Hace esto, en orden, y **se detiene en el primer paso que falle**, explicando qué hacer:

| Paso | Qué hace | Si falla… |
|---|---|---|
| Antes de empezar | Revisa git, que `.gitignore` proteja los datos, que no haya archivos de datos por subir y que en `apps-script/` solo haya `.gs`. | No se toca nada. |
| 1 · Pruebas | Corre `npm test`. | No se publica nada. |
| 2 · Qué cambió | Compara los `.gs` con los que se publicaron la última vez. Si solo cambió la página, **se salta el paso 3**. | — |
| 3 · Servidor | **Con clasp** (C2): `clasp push --force` y versión nueva **en la misma implementación** (la URL `/exec` no cambia). **Sin clasp**: te dice **qué archivos pegar** en el editor y espera a que lo hagas (C4). | La app sigue con el servidor anterior. |
| ⚠ Columnas nuevas | Si el servidor agrega columnas a la hoja, **se detiene y te pide correr `instalar()`** (ver abajo). | La app sigue igual que antes. |
| 4 · Revisar git | Comprueba que **solo** se suba código y documentación. Si aparece cualquier otro archivo (un escaneo PDF, una foto, un Excel, un `.json` exportado, `base/`, `capturas/`, llaves…), se detiene y te dice cuál es. | Se detiene antes de subir. |
| 5 · GitHub | `git add`, `git commit -m "tu mensaje"` y `git push`. Vercel publica la página sola. | Te dice cómo terminar. |

Opciones (van al final): `--servidor` publica el servidor aunque no haya cambiado;
`--ya-publique-servidor` (sin clasp) ya pegaste los archivos y publicaste la versión;
`--ya-corri-instalar` ya corriste `instalar()`.

**Cuando hay columnas nuevas** (el comando lo avisa con ⚠):

1. Abre la hoja → **Extensiones → Apps Script**.
2. A la izquierda abre **`Instalacion.gs`**, elige **`instalar`** arriba y presiona **▶ Ejecutar**.
3. Cuando el registro diga **✔ Todo en orden**, regresa a la terminal y contesta **s**.

Mientras tanto la app que usa la gente sigue funcionando con la versión anterior.

## C2 · clasp: publicar el servidor sin pegar archivos (opcional, una sola vez)

Con clasp, `npm run publicar` sube el servidor solo. Sin clasp también funciona: te
dice qué pegar (C4).

1. Instala clasp (la herramienta oficial de Google para subir código a Apps Script):

   ```bash
   npm install -g @google/clasp
   ```

2. Activa la API una vez: entra a https://script.google.com/home/usersettings con la
   **cuenta dueña** → **API de Google Apps Script: Activado**.
3. Inicia sesión con la **cuenta dueña** (se abre el navegador; acepta los permisos):

   ```bash
   clasp login
   ```

4. En el editor de Apps Script: **⚙ Configuración del proyecto → ID de la secuencia de
   comandos** → cópialo.
5. En la carpeta del proyecto, copia `.clasp.json.ejemplo` con el nombre `.clasp.json`
   y pega el ID donde dice `PEGA_AQUI…`. Este archivo no se sube a GitHub.

**La primera vez** que publique el servidor, `npm run publicar` te muestra las
implementaciones del proyecto y te pide el ID de la que usa la app. Copia el que empieza
con `AKfyc` y dice **«Versión…»** (no el que dice **@HEAD**), pégalo y presiona Enter.
Se guarda en `.publicar.json` (tampoco va a GitHub) y ya no te lo vuelve a pedir.

> 🔒 `clasp login` guarda una llave en tu computadora (`.clasprc.json`, en tu carpeta
> de usuario) que da acceso al Drive de la cuenta dueña. No la compartas ni la subas a
> GitHub. Por eso el servidor **no** se publica solo desde GitHub: esa llave tendría
> que vivir en GitHub.

> ⚠️ `clasp push` reemplaza **todos** los archivos del proyecto en línea con los de tu
> carpeta `apps-script/`. Eso está bien: así no quedan copias viejas. No edites el código
> directamente en el editor de Google si usas clasp: lo que cambies allá se pierde en
> el siguiente push.

## C3 · Cambiar solo la página, sin terminal

Para un texto, un color o un botón no necesitas nada instalado:

1. En github.com abre tu repositorio → carpeta `web/` (la app está en `web/app/`, los
   colores en `web/estilos.css`).
2. Abre el archivo → ✏ (Edit) → haz el cambio → **Commit changes**.
3. Vercel publica la página sola en 1 o 2 minutos.

Si algo quedó mal escrito, Vercel **no** publica la página rota: en Vercel →
Deployments verás el error con el archivo y el renglón, y la gente sigue con la versión
anterior. Corrige ese renglón y vuelve a guardar. (Con `npm run publicar` las pruebas
corren antes de subir.)

## C4 · El servidor a mano (sin clasp)

Solo cuando cambió algún `.gs`. `npm run publicar` te dice exactamente cuáles.

1. Pega en el editor **solo los archivos que cambiaron** y guarda.
2. Si la versión agrega columnas: corre **`instalar()`** (Instalacion.gs → ▶ Ejecutar).
3. **Implementar → Gestionar implementaciones → ✏** → Versión: **Nueva versión** → **Implementar**.
4. En tu computadora: `git push` (o vuelve a `npm run publicar` y contesta **s**).

⚠️ No uses "Nueva implementación": crea **otra URL** y habría que cambiar `CG_API_URL` en Vercel.

---

## Si algo falla

| Síntoma | Qué hacer |
|---|---|
| En Vercel: "No hubo conexión con el servidor" | Revisa `CG_API_URL` (Vercel → Settings → Environment Variables) y que la implementación diga **Cualquier usuario**. Después de cambiar la variable: Deployments → ⋯ → **Redeploy**. |
| "El sistema no está instalado" | Corre `instalar()` (A3). |
| En el menú de funciones no aparece `instalar` | Abre primero `Instalacion.gs` en la lista de la izquierda. |
| "Las columnas de la pestaña … no son las esperadas" | Alguien movió columnas en la hoja: **Archivo → Historial de versiones** y restaura. |
| Se olvidó la contraseña del administrador | Editor → `restablecerAdministrador` → copia la nueva del registro. |
| Una persona quedó bloqueada | Usuarios → Editar → Desbloquear (o espera: 15 min la primera vez, luego 1 h y 4 h). |
| Alguien perdió el teléfono de la verificación en dos pasos | Usuarios → Editar → «Quitar su verificación en dos pasos». Si es el único administrador: editor → `restablecerAdministrador` (también se la quita). |
| «El código no es correcto» aunque lo copies bien | Revisa que la hora del celular esté en automático: los códigos dependen de la hora. |
| No llegan los avisos por correo | Configuración → Avisos por correo prendido, y la persona con correo en Usuarios o Mi cuenta. Revisa la carpeta de spam. La Bitácora dice cuántos se mandaron cada día. |
| Cambié algo a mano en la hoja y la app no lo muestra | La app guarda la lista en memoria hasta 15 min. Corre `revisarSeguridad` en el editor (la limpia) o espera. Mejor: cambia las cosas desde la app. |
| El código QR del volante o los correos abren la URL de Google | Configuración → **Dirección pública de la app** → pega la dirección de Vercel y guarda (o el botón «Guardar esta dirección» del portal). |
| Al abrir la URL de Google `/exec` solo sale un aviso | Es normal: es el servidor. La app se abre en la dirección de Vercel. |
| A los administradores les sale «Falta publicar el servidor» | La página necesita un servidor más nuevo que el publicado: `npm run publicar -- "…" --servidor`, o C4. |
| Vercel no publicó: «web/app/…js:123: …» | Hay un error de escritura en ese archivo y renglón (una llave, un paréntesis o una coma). La gente sigue con la versión anterior; corrígelo y vuelve a subir. |
| `npm run publicar` dice «En apps-script/ hay archivos que ya no van ahí» | Son las pantallas de antes de la 1.9.0: `git rm apps-script/*.html` y vuelve a correrlo. |
| «Ya no se puede deshacer» | «Deshacer» dura 10 minutos, sirve una vez y solo para quien hizo el cambio. Después, cámbialo a mano (queda en la Bitácora). |
| Un número apartado no se va a usar | Un administrador lo abre y lo **cancela** con el motivo; el número no se reutiliza. |
| «Borrador en Word» dice que la plantilla no sirve | Que el documento siga en la carpeta «Plantillas (NO COMPARTIR)» y sea un documento de Google (no un .docx subido). |
| ¿Algo quedó compartido? | Editor → `revisarSeguridad`. |
| El volante sale en una hoja carta con mucho espacio | En el cuadro de impresión elige papel «Media carta» / 5.5 × 8.5 in si tu impresora lo tiene, o déjalo en carta: el volante ocupa la mitad de arriba. Usa «Tamaño real» o «100 %». |
| La primera acción del día tarda unos segundos | Normal en Apps Script cuando nadie la ha usado en un rato. |
| Nadie puede entrar y dice «Sistema en mantenimiento» | Un administrador lo prendió: Configuración → Modo mantenimiento → Apagar. Si ningún admin puede entrar, en la hoja, pestaña **Config**, cambia `mantenimiento` a `NO` (tarda hasta 1 minuto). |

## Probar en tu computadora (opcional)

```bash
npm test                     # 125 pruebas (las que usan los datos reales necesitan base/base.json)
npm run local                # la app completa en http://localhost:4321 (con la base migrada si está; si no, vacía)
npm run e2e                  # recorrido en navegador de lo nuevo (necesita Playwright)
npm run empaquetar           # .zip del proyecto SIN datos, para compartir o pedir ayuda
```

Con `npm run local`, si cambias algo en `web/` basta con recargar el navegador.

En GitHub, las pruebas corren solas en cada `git push` (pestaña **Actions**); las que
necesitan los datos reales se saltan allá.
