# Control de Gestión

Registro de oficios (salientes, entrantes, de conocimiento, circulares, tarjetas
informativas y volantes de turno) que sustituye al Excel "Minutario".

| Lado | Carpeta | Dónde vive | Cómo se actualiza |
|---|---|---|---|
| **Página** (lo que ve la gente) | `web/` | Vercel | `git push`: Vercel la publica sola |
| **Servidor** y datos | `apps-script/` | Google Apps Script + Sheets + Drive | Solo cuando cambia un `.gs` (`npm run publicar`) |

`npm run publicar -- "qué cambió"` revisa qué cambió y publica solo eso.

| Documento | Para qué |
|---|---|
| [INSTALAR.md](INSTALAR.md) | Instalación paso a paso (Google, GitHub, Vercel) y cómo publicar cambios |
| [LEEME.md](LEEME.md) | Qué hace, roles, seguridad, límites y reglas para modificarlo |
| [CAMBIOS.md](CAMBIOS.md) | Qué trae cada versión y qué hacer al publicarla |

> Los datos reales (`base/`, capturas, Excel) **no** están en este repositorio a propósito.
> Para compartir el código sin ellos: `npm run empaquetar` arma un .zip limpio.

Las pruebas (`npm test`) corren en GitHub Actions en cada push.
