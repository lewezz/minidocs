# Verificación — MiniDocs

Estado más reciente, **finalización · 2026-11-03**: **TypeScript, lint, 105 pruebas unitarias y build Turbopack correctos**. Además pasó una prueba explícita con **Supabase real**, seguida de acciones HTTP reales sobre el build de producción local. Se verificaron creación, JSON/formato, reapertura, permisos, compartir sin duplicados, edición de Bob visible para Alice e importación TXT. **No son pruebas de interacción en navegador. No hay despliegue público verificado.** La auditoría de producción no informa vulnerabilidades conocidas; la completa informa un aviso moderado de desarrollo. Los bloqueos iniciales de red/configuración que siguen debajo son históricos.

## Resultados de la finalización · 2026-11-03

| Comprobación | Resultado observado |
| --- | --- |
| `pnpm install --frozen-lockfile` | Exit 0; lockfile vigente y sin dependencias de runtime nuevas. |
| `pnpm exec tsc --noEmit` | Exit 0 con TypeScript estricto. |
| `pnpm lint` | Exit 0, sin warnings. |
| `pnpm test:run` | Exit 0: **105 pasadas, 1 omitida; 8 archivos pasados, 1 omitido**. La prueba remota se omite expresamente sin opt-in. |
| `pnpm build` | Exit 0, Next 16.4.4/Turbopack; rutas `/`, `/documents/[id]`, `/_not-found`, `/icon.svg`. |
| `pnpm audit --prod` | Exit 0: `No known vulnerabilities found`. Es el resultado del registro en esta fecha, no una garantía absoluta. |
| `pnpm audit` | Exit 1: **1 moderada**, minimatch GHSA-g3hv-75wg-m249, árbol ESLint de desarrollo. Sin override mayor forzado ni alerta silenciada. |
| `MINIDOCS_LIVE_TEST=1 MINIDOCS_TEST_URL=http://127.0.0.1:3010 pnpm --env-file .env.local test:integration` | Exit 0: **1 prueba real**, 5,51 s. Producción local más PostgreSQL de Supabase remoto, sin repositorio/HTTP de base de datos simulado. |
| Script de aceptación HTTP con el codec Flight del Next fijado | Exit 0: acciones de creación, guardado, compartir, edición Bob, importación multipart y selección demo; denegación de entradas/permisos inválidos. Se conservó como `scripts/verify-http-actions.mjs` / `pnpm test:http`, con opt-in explícito. |
| HTTP adicional de solo lectura | Inicio Alice/Bob y páginas compartidas 200; documento importado privado leído por Bob 404, sin título privado en respuesta. |
| Smoke final tras rebuild y reinicio del servidor de producción local | Alice/Bob: inicio 200, documento rico 200, ambos reciben el cambio guardado por Bob; importado privado de Alice devuelve 404 a Bob. Solo lecturas. |
| Búsqueda exacta de la clave privada configurada | No aparece en los 97 archivos revisados de código/documentación y assets de `.next/static`. No se imprimió el valor; no equivale a una auditoría de seguridad completa. |
| Revisión estática final de presentación/manifiestos | Máximo de radio CSS explícito: **3px**; sin reglas CSS vacías, HTML `lang=en`, sin lockfiles alternativos. No sustituye revisión visual. |
| `pnpm dlx vercel@65.9.0 whoami` | Exit 1: `Logged out`. El intento de preparación con `deploy --dry` también requiere sesión. No hubo despliegue ni URL pública. |
| Navegador visual/interactivo | No completado: Computer Use devolvió `Computer Use permissions are not granted` en los intentos registrados. No se sustituyó por una afirmación end-to-end. |

Evidencia: [live-supabase.json](verification/live-supabase.json), [http-actions.json](verification/http-actions.json), [final-http-and-secrets.json](verification/final-http-and-secrets.json) y [final-checks.txt](verification/final-checks.txt). Los JSON contienen IDs de fixtures y fechas UTC, nunca claves privadas. La fecha local de trabajo es 3 de noviembre aunque la evidencia UTC sea del 2 de noviembre.

### Alcance real de cada nivel

- **105 unitarias:** validación de títulos/UUID/JSON, autorización antes de leer/escribir, propietario derivado del actor, compartir en ambas direcciones y sin duplicados, prohibición de renombrar/compartir como receptor, importación UTF-8/BOM/CRLF/líneas vacías/texto HTML literal, límites/tipos/errores; servicio con repositorio en memoria y SDK con HTTP simulado. Incluye regresión del JSON serializable para React.
- **Supabase real:** creó documentos, guardó/recuperó los ocho formatos solicitados como JSON; rechazó acceso privado de Bob; insertó el permiso dos veces y comprobó una sola fila; Bob editó y Alice recuperó el cambio; rechazó renombrado/reshare del receptor; importó y releyó UTF-8 con líneas vacías y HTML literal. Las peticiones autorizadas del documento rico devolvieron 200.
- **Acciones HTTP reales:** ejecutó los puntos de entrada compilados, cookies Alice/Bob, serialización Flight y subida multipart; rechazó un actor `admin`, extensión PDF, escritura privada, renombrado y reshare no autorizados. Este harness comprueba el backend que consume la UI, pero no clics, selección de texto, hidratación visual ni eventos de navegador.
- **Pendiente humano:** ejecutar [MANUAL_ACCEPTANCE.md](MANUAL_ACCEPTANCE.md) en navegador, publicar en Vercel y repetir allí, grabar vídeo y aportar URLs reales. No se ha firmado una aceptación pública completa.

La última consulta Computer Use de navegadores conectados devolvió una lista vacía; las comprobaciones visuales continúan bloqueadas. La comprobación final completa se ejecutó después de añadir las comprobaciones locales de importación y retirar reglas CSS vacías. Las pruebas Supabase/acciones HTTP anteriores siguen siendo evidencia del backend; el smoke final volvió a abrir sus documentos sin generar nuevas escrituras.

### Fallo descubierto y corrección comprobada

La primera prueba real llegó a crear/guardar/compartir y a denegar permisos correctamente, pero **falló al abrir por HTTP el documento con encabezados/listas: 500**. La respuesta señalaba objetos con prototipo nulo no serializables por React Server Components. ProseMirror produce algunos atributos con ese prototipo al convertir a JSON.

Se normalizó el árbol ya validado con serialización JSON antes de pasarlo al componente cliente, manteniendo el esquema y los controles. Se añadió una prueba de regresión. Tras rebuild, las páginas con formato devolvieron 200 y la prueba real completa pasó. El fallo inicial se conserva en el registro y no se presenta como una ejecución satisfactoria.

Las ejecuciones reales dejaron **seis documentos de verificación** en total, incluidos los del intento inicial fallido. Se conservaron deliberadamente para inspección; no se borraron documentos ni datos previos. Repetir las pruebas opt-in creará nuevos documentos etiquetados.

---

## Comandos y resultados reales

| Comando | Resultado observado |
| --- | --- |
| `pwd`, `ls -la`, `rg --files --hidden` | Directorio vacío al inicio. `rg` devolvió 1 por no encontrar archivos. |
| `git status --short --branch` | Exit 128: la carpeta no es un repositorio Git. No se modificó historial ni trabajo previo. |
| `pnpm --version` / `node --version` | 12.16.1 / v24.21.0. |
| `pnpm view <paquete> version engines peerDependencies --json` | Exit 1 por error DNS del registro, en todas las consultas iniciadas. |
| `pnpm install --fetch-timeout 10000 --store-dir .pnpm-store --state-dir .pnpm-state --reporter append-only` | Exit 1: `ERR_PNPM_BAD_CONFIG_DEP`; pnpm intenta resolver su versión declarada y no puede resolver el DNS de `registry.npmjs.org`. |
| `pnpm exec tsc --noEmit` | Exit 1 antes de iniciar TypeScript, por el mismo error de resolución de pnpm. |
| `pnpm lint` | Exit 1 antes de iniciar ESLint, por el mismo bloqueo. |
| `pnpm test:run` | Exit 1 antes de iniciar Vitest, por el mismo bloqueo. No hay resultados de Vitest. |
| `pnpm build` | Exit 1 antes de iniciar Next.js, por el mismo bloqueo. |
| `pnpm audit` | Exit 1 antes de auditar, por el mismo bloqueo. No hay resultado de vulnerabilidades. |
| `pg_isready` | No hay respuesta de PostgreSQL en `/tmp:5432`. |
| `initdb -D /private/tmp/minidocs-hito1-postgres -A trust --no-locale --encoding=UTF8` | Exit 1: `could not create shared memory segment: Operation not permitted` durante bootstrap. La propia herramienta retiró el directorio temporal fallido. No se ejecutó la migración. |
| Comprobación puntual con `node --input-type=module` | Exit 0: validación de variables, normalización de URL, rechazo de entradas inseguras, errores sin secretos, Alice/Bob y rechazo de identidades arbitrarias, JSON de los manifiestos, `strict: true`, `packageManager` y ausencia de lockfiles alternativos. |
| `node --check scripts/require-pnpm.mjs`, `node --check eslint.config.mjs`, `node --check postcss.config.mjs` | Exit 0: sintaxis válida de los tres archivos JavaScript. No resuelve imports de paquetes ni valida su configuración en ejecución. |

Se estableció `PNPM_CONFIG_FETCH_RETRIES=0` en instalación/comprobaciones para limitar reintentos. Un segundo intento de instalación con `PNPM_CONFIG_MANAGE_PACKAGE_MANAGER_VERSIONS=false` devolvió el mismo error. No se intentó elevar permisos ni cambiar de gestor. Se probó también una consulta con opciones de fetch que `pnpm view` 12 no acepta; se corrigió el intento, sin atribuir ese error a la aplicación.

La salida íntegra de los cinco comandos de calidad se conserva en [verification/hito-1-checks.txt](verification/hito-1-checks.txt).

La comprobación con Node utilizó su soporte nativo de TypeScript para ejecutar los dos módulos puros, sin instalar paquetes. **No sustituye Vitest ni realiza comprobación estática de tipos.** No ejecuta componentes React, Next.js, PostgreSQL ni pruebas de navegador.

## Revisión de código y correcciones

- Credenciales leídas solo dentro del límite `server-only`; al componente cliente solo se pasa el estado `missing/invalid/configured`.
- Los errores de validación no incorporan los valores de variables, URLs con contraseñas ni claves.
- Se añadieron nombres accesibles explícitos a los enlaces de navegación porque, en móvil, el diseño oculta su texto visible.
- Se sustituyeron los enlaces al inicio por `next/link` para utilizar navegación de Next y evitar la regla ESLint de enlaces HTML a rutas internas. Los enlaces de ancla permanecen como HTML.
- La restricción SQL de JSON usa `IS TRUE` para impedir que claves ausentes pasen el `CHECK` por producir `NULL`.
- La migración revoca también los permisos por defecto de `service_role` antes de conceder los mínimos usados por esta base. RLS no sustituye la autorización de los servicios con clave elevada.
- El estado «Variables presentes» no afirma que exista conexión real.
- Se mantuvieron deshabilitadas las acciones de hitos posteriores. No se añadieron documentos de ejemplo que pudieran confundirse con datos persistidos.

## Pendiente para cerrar el hito

1. Permitir acceso del terminal al registro y ejecutar `pnpm install`; resolver cualquier incompatibilidad real y generar `pnpm-lock.yaml` con pnpm.
2. Confirmar reproducibilidad con `pnpm install --frozen-lockfile` y ejecutar los cinco controles de calidad.
3. Revisar la actualización de seguridad de Next.js anunciada para el 3 de noviembre antes de fijar la entrega/despliegue.
4. Ejecutar migración, seed y `supabase/tests/schema.sql` en un proyecto Supabase gratuito o una instancia compatible con sus roles. Se puede repetir el seed, pero la migración debe aplicarse una vez.
5. Abrir la aplicación y comprobar visualmente escritorio/móvil, teclado, selector Alice/Bob y estados de configuración. No se inició el servidor ni se verificó la interfaz porque no se instalaron las dependencias.
6. Revisar los resultados con el usuario antes de empezar el Hito 2.

No se han configurado recursos externos, desplegado en Vercel ni verificado el recorrido funcional completo.

## Actualización · Revisión de interfaz

Al comenzar esta revisión se observaron `node_modules`, `pnpm-lock.yaml` y un servidor existente en `localhost:3000`. No se atribuye su instalación al asistente. El archivo `pnpm-workspace.yaml` ya incluía excepciones de antigüedad para Next, que se conservaron. No se modificaron dependencias.

| Comprobación | Resultado real |
| --- | --- |
| `pnpm exec tsc --noEmit` | Exit 0. |
| `pnpm lint` | Primer intento: un warning preexistente de export anónimo en PostCSS. Se corrigió con una variable `config` y se repitió: exit 0. |
| `pnpm test:run` | Exit 0: 2 archivos, 26 pruebas superadas. Son pruebas de los módulos existentes, no pruebas visuales. |
| Comprobación puntual de radios con Node | Exit 0: las cinco declaraciones de radios en `src` son de 3 px; el SVG usa `rx=3`; no hay utilidades de redondeo grande. Se verificaron las cuatro copias previas de los archivos visuales. |
| `pnpm build` | Exit 1 por restricción de Turbopack al crear un proceso que necesita abrir un puerto: `Operation not permitted`. |
| `pnpm build --webpack` | Exit 0: compilación, TypeScript, generación de rutas y trazas completadas. |
| `pnpm audit` | Exit 1: `ERR_PNPM_AUDIT_BAD_RESPONSE`, DNS inaccesible para el endpoint de auditoría. No hay resultado sobre vulnerabilidades. |
| `curl --head --location --max-time 5 http://localhost:3000` | HTTP 200 al comprobar el servidor existente antes de editar. Esto no verifica el aspecto final. |
| Consulta HTTP de la página y estilos con Node | Bloqueada por `EPERM` en sockets IPv4 e IPv6; no se confirmó la respuesta del diseño final con este método. |
| Revisión visual con Computer Use | No hay navegador conectado y el acceso al Chrome nativo devuelve `Computer Use permissions are not granted`. No se verificó visualmente escritorio/móvil ni el selector. |

Evidencia de los controles en [verification/interface-checks.txt](verification/interface-checks.txt). No se han añadido tests para cambios de presentación ni se han comenzado funciones del Hito 2.

## Hito 2 · Documentos y editor

### Estado inicial y dependencias

- Se verificaron pnpm 12.16.1, Node 24.21.0, dependencias presentes y el único `pnpm-lock.yaml`.
- Antes de implementar pasaron TypeScript, lint, las 26 pruebas existentes y `pnpm build` con Turbopack. El antiguo bloqueo de puertos ya no se reprodujo.
- Se instalaron los cuatro paquetes oficiales Tiptap 3.32.2 con **`pnpm install`**. El registro y sus peers se consultaron antes de fijar versiones; el lockfile se actualizó por pnpm.
- No se encontró `.env.local`. Una comprobación posterior que también cargó `.env` confirmó que faltan `SUPABASE_URL` y `SUPABASE_SECRET_KEY`; no se imprimieron valores privados.

### Resultados finales

| Control | Resultado real |
| --- | --- |
| `pnpm exec tsc --noEmit` | Exit 0. |
| `pnpm lint` | Exit 0 tras corregir dos reglas de React. |
| `pnpm test:run` | Exit 0: **83 pruebas en 6 archivos**. |
| `pnpm build` | Exit 0 con Turbopack; rutas `/`, `/documents/[id]`, `/_not-found` e `/icon.svg` generadas correctamente. Sin flag alternativo de compilación. |
| `pnpm audit --prod` | Exit 0: el registro no informa de vulnerabilidades conocidas en producción. |
| `pnpm audit --json` | Exit 1: **un aviso moderado de minimatch en herramientas ESLint**, GHSA-g3hv-75wg-m249. Pendiente actualización compatible; no se fuerza un override de major ni se silencia la alerta. |
| Migración + seed dos veces + `supabase/tests/schema.sql` | Correctos en **PostgreSQL 17 local** aislado, con roles `anon`, `authenticated` y `service_role` preparados para la prueba. El proceso se detuvo al finalizar. No se ejecutó contra un proyecto remoto de Supabase. |
| Comprobaciones HTTP del servidor existente | Inicio HTTP 200 y mensaje de configuración faltante; UUID inválido HTTP 404; ruta con UUID válido sin Supabase muestra error público seguro. |
| Revisión de radios y límites | Siete declaraciones CSS de radio respetan 7 px: controles a 3 px y título a 0; conserva `immediatelyRender: false`, `server-only` y el único lockfile pnpm. |
| Navegador | El acceso a Chrome con Computer Use devolvió `Computer Use permissions are not granted`. Sin prueba visual ni de interacción. |

Resumen de las salidas observadas en [verification/hito-2-checks.txt](verification/hito-2-checks.txt).

### Qué prueban los tests

- Identificadores y títulos: tipos incorrectos, blancos, longitud, UTF-8, caracteres de control y campos de propietario inyectados.
- JSON: formatos solicitados, estructura válida de listas, texto HTML literal, nodos/marks/atributos prohibidos, `__proto__`, caracteres nulos, 512 KiB, número de nodos y profundidad/ciclos.
- Servicio con repositorio **en memoria**: creación del propietario correcto, guardado/reapertura, fechas/propiedad preservadas, denegación antes de cargar contenido, denegación antes de escribir, permisos existentes de editor y renombrado reservado al propietario, comprobación de permisos por operación y desaparición de registros.
- Acciones con contexto simulado: actor tomado de la cookie del servidor, valores arbitrarios rechazados, flags HttpOnly/SameSite y ausencia de propietario arbitrario en creación.
- Adaptador Supabase con **HTTP simulado**: filtros por usuario/documento/permiso, metadatos sin contenido antes de autorizar, payload de actualización sin propietario y errores de base de datos sin datos privados.

### Correcciones observadas

- La primera ejecución de los nuevos tests tuvo una aserción fallida porque ProseMirror ordena los marks según su esquema. Se corrigió la expectativa para comprobar el JSON canónico y conservar ambos formatos; no se eliminó la aserción de formato.
- Lint rechazó JSX construido dentro del `try` de la ruta de documento y una función no inline en `useMemo`. Se separó la carga de datos del render y se ajustó el callback. Se repitieron las comprobaciones aplicables hasta pasar.
- El estado de guardado utiliza una instantánea del contenido enviado: escribir durante una petición no marca las ediciones posteriores como guardadas. Los errores mantienen el contenido local.

### Límites y verificación pendiente

No se ha creado, guardado ni reabierto un documento contra Supabase real en esta sesión. No se ha probado el editor en navegador ni el flujo completo de acciones con cookies reales. Las comprobaciones SQL locales y los tests simulados no equivalen a ese recorrido.

Para completar la prueba: configurar el proyecto gratuito, aplicar la migración/seed existentes y las variables privadas, reiniciar el servidor y seguir [HITO_2_MANUAL_TEST.md](HITO_2_MANUAL_TEST.md). No hay despliegue, importación, creación de permisos compartidos, tiempo real, comentarios ni historial de versiones en este hito.

## Diagnóstico del botón de creación

### Causa observada antes de cambiar código

`src/components/workspace/workspace.tsx` utiliza:

```tsx
disabled={pending || configuration !== "configured"}
```

| Factor | Evidencia |
| --- | --- |
| Variables presentes | `.env.local` contiene las dos variables esperadas y ambas tienen valores no vacíos. No se imprimieron esos valores. |
| Validación local | `invalid`; único error: `SUPABASE_SECRET_KEY debe ser una clave secreta sb_secret_ del servidor.` |
| URL | Supera su validación de formato. Esto no demuestra conexión con el proyecto. |
| Estado de creación | No se muestra «Creando…» en la respuesta inicial; no hay petición de creación en curso. |
| Alice y Bob | HTTP 200 con la opción correspondiente seleccionada al enviar cada cookie. Ambos reciben `configuration=invalid` y el botón desactivado. |
| Migración/conexión | No intervienen en esa condición. Con configuración inválida la página ni siquiera llama al servicio para listar. La migración ejecutada por el usuario no se ha vuelto a ejecutar ni comprobar remotamente. |
| Hito 1 | No hay un `disabled` fijo en creación. La acción funcional del Hito 2 está conectada. El bloqueo fijo de TXT es independiente y permanece fuera del alcance. |

### Solución aplicada

Se mantuvo la validación y la condición de habilitación. Se corrigió la pantalla que escondía la causa: ahora muestra los mensajes seguros del validador, identifica la variable inválida/faltante y explica cómo corregir el entorno. El botón referencia esa explicación mediante `aria-describedby`. La interfaz ya no pide repetir migración/seed por un fallo de configuración.

Archivos de aplicación modificados: `src/app/page.tsx`, `src/components/workspace/workspace.tsx` y `src/app/globals.css`. Pruebas añadidas: `tests/workspace-configuration.test.ts`. No se modificaron `.env.local`, el validador, acciones de creación, servicios, permisos ni cookies.

### Verificaciones finales

| Comando/control | Resultado real |
| --- | --- |
| `pnpm exec tsc --noEmit` | Exit 0. |
| `pnpm lint` | Exit 0, sin warnings. |
| `pnpm test:run` | Exit 0: **88 pruebas, 7 archivos**. Las cinco nuevas comprueban renderizado con servicios simulados; no crean documentos remotos. |
| `pnpm build` | Exit 0 con Turbopack y `.env.local`. |
| HTTP posterior a la corrección | Alice y Bob: 200, selección correcta, mensaje concreto de clave inválida y botón vinculado al diagnóstico. Sigue desactivado porque el archivo aún contiene una clave de formato inválido. |

Las dos pruebas del diagnóstico fallaron antes de la corrección y pasaron después, conservando los casos que habilitan el botón para ambas identidades con una configuración válida. Evidencia resumida en [verification/create-button-checks.txt](verification/create-button-checks.txt).

### Comprobación manual pendiente

1. En Supabase → Settings → API Keys, obtener una clave **secreta** `sb_secret_...` del proyecto y configurar `SUPABASE_SECRET_KEY` en `.env.local`. No enviarla al chat ni usar una clave pública o una contraseña de PostgreSQL. [Documentación oficial de claves](https://supabase.com/docs/guides/getting-started/api-keys).
2. Reiniciar el servidor con `pnpm dev` y recargar. No hace falta repetir la migración SQL por este error de entorno.
3. Comprobar que desaparece el diagnóstico de configuración y que «Nuevo documento» se habilita para Alice y Bob.
4. Crear un documento y comprobar apertura del editor, fila en `documents`, propietario correcto, guardado y reapertura. Si aparece un error de base de datos, revisar entonces credenciales/conexión y que el seed de Alice/Bob esté aplicado.

**No se ha ejecutado ninguna creación real en Supabase en este diagnóstico.** La clave local permanece inválida en la última comprobación. No se ha verificado la interacción en un navegador.

## 2026-11-03 · Inglés y simplificación de interfaz

### Alcance comprobado

- Textos visibles y accesibles, mensajes de errores/validación/autorización/configuración, confirmación de descarte, metadatos y páginas de error traducidos al inglés.
- `lang=en`, fechas `en-US` con UTC y nuevos títulos `Untitled document`.
- Retirados eslóganes, pie promocional, m/d ornamental, numeración decorativa, introducciones/captions redundantes, ilustraciones de estados vacíos y el botón TXT sin implementar.
- Se mantienen los componentes operativos, el aviso de identidad demo y los controles de autorización. Sin escrituras en base de datos, traducción de documentos existentes, dependencias nuevas o migraciones.

| Comprobación | Resultado real |
| --- | --- |
| `pnpm exec tsc --noEmit` | Exit 0. |
| `pnpm lint` | Exit 0. |
| `pnpm test:run` | Exit 0: 88 pruebas, 7 archivos, con expectativas de mensajes actualizadas al inglés. |
| `pnpm build` | Exit 0 con Turbopack. Las advertencias de CSS del primer intento se corrigieron antes de la compilación final. |
| Revisión estática | Sin textos españoles de runtime detectados; Tailwind importado; sin selectores vacíos ni clases decorativas retiradas; radios dentro de 7 px. |
| HTTP inicio, Alice y Bob | 200, idioma inglés, navegación/creación/selector/conexión en inglés; sin eslóganes, pie ni control de importación. |
| CSS servido | 200, incluye `.sr-only`; comprobada la presencia de utilidades accesibles de Tailwind tras la limpieza. |
| HTTP documento existente | 200, título accesible, navegación, estado de guardado, carga del editor y fecha en inglés. Solo lectura, sin registrar ni cambiar contenido. |
| HTTP ID inválido | 404 y mensaje `Page not found`. |

Evidencia: [verification/english-ui-checks.txt](verification/english-ui-checks.txt). No se han verificado visualmente escritorio/móvil ni botones, selección de formato o guardado mediante interacción en navegador. Las lecturas HTTP no equivalen a una prueba end-to-end.

## 2026-11-03 · Revisión de listas y textos del editor

- El usuario comunica una etiqueta «lista». Se inspeccionaron fuente y JavaScript servido: antes del cambio contenían `• List` / `1. List`, con tooltips en inglés. No se reprodujo `Lista` en esos archivos.
- Los botones muestran ahora **Bulleted List** y **Numbered List**. Se mantienen los comandos y los nombres accesibles. El HTML declara `lang="en" translate="no"` como señal para preservar el idioma; no se afirma que la traducción automática fuera la causa observada por el usuario.
- Chrome sigue sin permisos de Computer Use; no ha sido posible observar su pestaña ni confirmar una causa de navegador.

| Comprobación | Resultado real |
| --- | --- |
| `pnpm exec tsc --noEmit` | Exit 0. |
| `pnpm lint` | Exit 0. |
| `pnpm test:run` | Exit 0: 88 pruebas en 7 archivos. |
| `pnpm build` | Exit 0 con Turbopack. |
| Auditoría de runtime | Sin etiquetas españolas detectadas en los textos de editor, navegación, guardado, errores/configuración y metadatos. |
| Bundle de producción | Verificados los nueve nombres de controles en inglés, incluidos Bulleted List y Numbered List; sin etiqueta `Lista`. |
| HTTP inicio | Alice y Bob: 200, `lang=en`, `translate=no`, conexión Supabase correcta. |
| Apertura HTTP de un documento tras el cambio | No completada: las listas visibles estaban vacías. El script terminó con una aserción al no encontrar una URL de documento. No es una prueba fallida de creación ni de los comandos de listas. |

No hubo escrituras ni cambios de contenido en Supabase. Para comprobar el resultado visible, recargar completamente la pestaña y revisar ambos botones y tooltips. Si el navegador muestra una traducción, volver al idioma original. La revisión visual de esa pestaña y la interacción de formato siguen pendientes.
