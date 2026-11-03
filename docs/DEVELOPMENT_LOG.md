# Registro de desarrollo — MiniDocs

## 2026-11-02 · Hito 1 · Inspección y preparación

### Instrucciones y alcance

- Solicitud: desarrollar MiniDocs para la prueba técnica de Ajaia LLC con Next.js App Router, React, TypeScript estricto, Tailwind CSS, Tiptap, Supabase PostgreSQL, Vitest y Vercel.
- Utilizar exclusivamente pnpm y un único `pnpm-lock.yaml`; revisar versiones y avisos de seguridad antes de fijar dependencias.
- Este turno está limitado al Hito 1. No comenzar documentos/editor del Hito 2 hasta la revisión del usuario.
- Mantener resultados reales y no confundir una interfaz inicial con funcionalidades completas.

### Inspección real

- La carpeta de trabajo está vacía, incluidos los archivos ocultos. No existe trabajo previo que copiar ni archivos que eliminar.
- `git status --short --branch` devolvió `fatal: not a git repository`. No es un fallo de la aplicación; todavía no existe repositorio Git.
- No se encontraron instrucciones `AGENTS.md` en la carpeta ni en sus directorios superiores.
- Herramientas observadas: pnpm **12.16.1**, Node.js **24.21.0**; existen los ejecutables de Git, psql y Docker. Su presencia no demuestra una base de datos disponible.

### Decisiones iniciales

- Crear la configuración explícitamente, sin generadores, para limitar las dependencias y hacer revisable cada archivo.
- Mantener el stack solicitado y el desarrollo en esta carpeta. Se consultó la guía disponible de Sites para comprobar su aplicabilidad; no se utilizará su despliegue Cloudflare/Vinext porque el usuario exige Next.js/Vercel y limita el trabajo actual a la base local.
- Arquitectura prevista: `src/app` (rutas), `src/components` (interfaz), `src/lib` (dominio y validación), `src/server` (configuración, servicios y persistencia), `supabase/migrations` (SQL) y `tests` (Vitest).
- No añadir un ORM ni incorporar Tiptap antes del Hito 2. Revisar su guía oficial de integración y preparar el diseño para JSON estructurado e `immediatelyRender: false`.
- Credenciales de Supabase exclusivamente en módulos `server-only`. Sin variables secretas con prefijo `NEXT_PUBLIC_`.
- Alice/Bob son identidades de demostración, no autenticación de producción.

### Trabajo asistido por IA

- La inspección, las decisiones y los archivos de este hito los prepara el asistente a partir del encargo del usuario, con revisión mediante herramientas locales y documentación primaria.
- No se ha delegado en otros agentes.

### Verificaciones pendientes

- Resolver versiones compatibles desde el registro y contrastar los avisos oficiales.
- Instalar y ejecutar TypeScript, lint, Vitest, build y auditoría.
- Comprobar la interfaz y el SQL en la medida en que el entorno lo permita.

## 2026-11-02 · Hito 1 · Implementación de la base

### Archivos y decisiones

- Creados `package.json`, configuración pnpm, Next.js, TypeScript, Tailwind/PostCSS, ESLint flat y Vitest. Declarados pnpm 12.16.1 y Node 24.x. El script `preinstall` rechaza otros gestores.
- Dependencias seleccionadas y fuentes de seguridad registradas en `docs/DEPENDENCIES.md`. Se consultaron metadatos del registro a través del navegador y avisos primarios de Next.js/React; la resolución local sigue bloqueada.
- Se escogió TypeScript 5.9.3 como rama conservadora en lugar de migrar directamente al nuevo major. Se eligió Vitest 4.1.12, una versión de la rama estable v4 con mantenimiento. Los peers transitivos aún no están resueltos.
- Arquitectura creada: rutas App Router, componentes reutilizables, componentes del espacio de trabajo, identidades demo, validación pura y límite de servidor con cliente Supabase diferido.
- La vista inicial tiene navegación, selector Alice/Bob, estados vacíos separados, botones de crear/importar deshabilitados, aviso del alcance, estados de configuración, adaptación móvil, enlace para saltar al contenido, foco visible y páginas de error/404. No se ha verificado visualmente en navegador.
- El selector es solo estado local de React en este hito. No se añadió cookie ni autenticación; al recargar vuelve a Alice. Los ceros indican la vista inicial, no una consulta realizada.
- El cliente Supabase es exclusivo del servidor y no se instancia durante la vista inicial. Solo se transmite al cliente el estado de la configuración, nunca secretos.
- Se preparó SQL transaccional con usuarios, documentos JSONB, propietario, permisos de edición compartidos, índices, claves foráneas, fechas, triggers, restricciones y RLS sin políticas para el navegador. Las claves secretas omiten RLS; los servicios de autorización son trabajo posterior y deberán existir desde las primeras operaciones.
- Seed repetible para Alice/Bob, y verificación SQL con rollback. No se ejecutaron sobre Supabase.
- Añadidas pruebas Vitest de validación del entorno e identidades arbitrarias. Todavía no se ejecutaron mediante Vitest.
- No se crearon APIs, editor, CRUD ni importación del Hito 2/3. No se inició un despliegue.

### Problemas, correcciones y resultados

- Las consultas `pnpm view` terminaron con `ERR_PNPM_RESOLVING_NPM_RESOLVER_NETWORK_ERROR`: el terminal no resuelve `registry.npmjs.org`. Una comprobación de red con Node confirmó `ENOTFOUND`. Esto no demuestra un error de código.
- Un intento de añadir opciones `--fetch-retries` a `pnpm view` fue rechazado por el CLI 12. Se consultó su ayuda y se corrigieron los intentos; los fallos posteriores fueron DNS.
- La instalación con almacén/estado dentro de la carpeta y reintentos limitados devolvió `ERR_PNPM_BAD_CONFIG_DEP` al intentar resolver el propio pnpm declarado. Repetir con la gestión automática de versiones desactivada en el entorno no cambió el bloqueo.
- No hay dependencias instaladas ni `pnpm-lock.yaml` generado. No se ha creado un lockfile ficticio ni se ha usado otro gestor.
- Se ejecutaron `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test:run`, `pnpm build` y `pnpm audit`. Todos devolvieron exit 1 por el bloqueo de pnpm antes de iniciar las herramientas. No hay resultados de tipos, lint, Vitest, build ni auditoría.
- `pg_isready` no encontró PostgreSQL en el socket local por defecto. `initdb` falló en su directorio temporal por restricciones de memoria compartida del entorno. No es una prueba de fallo de la migración.
- Una comprobación puntual de los módulos puros con Node, sin paquetes externos, terminó con exit 0: valida configuración, normalización, rechazo de URLs/claves no válidas, mensajes sin secretos, allowlist Alice/Bob, manifiestos y ausencia de lockfiles alternativos. No sustituye los controles bloqueados.
- Revisión manual: se añadieron etiquetas accesibles para navegación móvil; se protegió el `CHECK` de JSON contra semántica SQL `NULL`; se revocaron los permisos iniciales del rol elevado antes de conceder los específicos; se simplificó un helper innecesario de pruebas.
- En una revisión final se cambiaron los enlaces de inicio a `next/link`, evitando una posible infracción de lint y usando navegación del framework.
- `node --check` terminó con exit 0 para el guard de pnpm y las configuraciones JavaScript de ESLint/PostCSS. Solo comprueba sintaxis, no disponibilidad ni compatibilidad de sus dependencias.
- Los parches de Next.js anunciados para el 3 de noviembre requieren una nueva revisión antes de la entrega; no se puede anticipar su resultado ni el de la auditoría.

### Evidencia y límites de entrega

- `docs/VERIFICATION.md` detalla los comandos y resultados; `docs/verification/hito-1-checks.txt` conserva la salida real de los cinco controles.
- Pendiente: acceso al registro, instalación, resolución de peers, generación del único lockfile, todos los controles, ejecución SQL y comprobación visual.
- Configuración externa pendiente: proyecto Supabase gratuito, migración/seed y variables privadas en `.env.local`. Vercel corresponde al Hito 4.
- La base se entrega para revisión, **sin declarar el Hito 1 totalmente verificado ni la aplicación funcional completa**. No avanzar al Hito 2 sin revisión del usuario.

## 2026-11-02 · Revisión visual del Hito 1

### Solicitud y alcance

- Prompt del usuario: «haz que la interfaz sea menos parecida a una que haria una ia y que tenga mas personalidad y menos bordes rounded, que el borde rounded maximo sea de 7px».
- Se trabaja únicamente en el diseño y en las correcciones necesarias para comprobarlo. El Hito 2 sigue pendiente de revisión.
- Antes de editar se leyeron los archivos y se conservaron copias en `.local/backups/2026-11-02-interface/`. Incluye los cuatro archivos visuales originales, la configuración PostCSS y el README antes de actualizarlos.
- En esta inspección ya existían dependencias instaladas, lockfile y servidor local. No se afirma haber realizado esa instalación. Se conservaron el manifiesto, lockfile y los cambios existentes en la configuración pnpm.

### Cambios asistidos por IA y decisiones

- Dirección editorial: fondo papel, barra lateral tinta y acento teja. Tipografía serif del sistema en títulos y marca; sans para lectura y monoespaciada para índices y metadatos. Sin nuevas dependencias, fuentes remotas ni imágenes generadas.
- Secciones numeradas, separadores rectos y estados vacíos alineados a la izquierda. Se retiraron sombras, rotaciones, tarjetas redondeadas y frases decorativas del diseño previo.
- Las cinco declaraciones CSS de radio son de **3 px**, al igual que el favicon. El límite solicitado para la interfaz es **7 px**. Avatares y marcas de estado también siguen la geometría recta.
- Se mantuvieron la navegación, las etiquetas accesibles, el selector local, los mensajes de configuración y los botones deshabilitados con su explicación.
- Se reformateó el CSS en reglas legibles y se conservaron los ajustes adaptables y el respeto a movimiento reducido. Su apariencia final en distintas pantallas no está verificada.
- Al ejecutar lint se encontró un warning en la configuración de PostCSS creada en la fase anterior. Se sustituyó su export anónimo por `const config` y `export default config`, sin cambiar sus plugins.
- Se actualizaron los estados de README y las verificaciones para distinguir el intento inicial bloqueado de los resultados actuales.

### Verificaciones y resultados reales

- `pnpm exec tsc --noEmit`: **exit 0**.
- `pnpm lint`: warning inicial de PostCSS corregido; segundo intento **exit 0**.
- `pnpm test:run`: **exit 0**, **26 pruebas** en **2 archivos**. Cubren los módulos existentes; no prueban el diseño.
- Comprobación puntual con Node: **exit 0**, cinco declaraciones CSS a 3 px, SVG a 3, sin utilidades grandes de redondeo y con las copias originales disponibles. No se añadieron tests automatizados para estos cambios de presentación.
- `pnpm build`: bloqueado por Turbopack al crear un proceso y abrir un puerto (`Operation not permitted`).
- `pnpm build --webpack`: **exit 0**, compilación y generación de rutas completadas. Se utilizó una alternativa de compilación sin modificar el script habitual.
- `pnpm audit`: bloqueado por DNS del endpoint del registro; no existe resultado de auditoría.
- El servidor existente respondió **HTTP 200** a HEAD antes de editar. Una comprobación posterior de HTML/CSS con Node fue bloqueada por `EPERM` al abrir sockets.
- Computer Use no encontró navegador conectado; el acceso al Chrome nativo devolvió **Computer Use permissions are not granted**. No hay capturas ni comprobación visual o de interacciones; no se simula un resultado favorable.
- La carpeta sigue sin ser un repositorio Git. No se crearon commits ni se modificó historial.
- Evidencia: `docs/verification/interface-checks.txt`. Permanecen pendientes auditoría, ejecución SQL y comprobación visual. No se ha desplegado ni avanzado a funcionalidades posteriores.

## 2026-11-02 · Hito 2 · Inspección y comienzo

- Solicitud: implementar creación, listado, apertura en `/documents/[id]`, Tiptap, guardado JSON y renombrado, con validación/autorización en servidor y pruebas significativas. Quedan excluidos importación, creación de permisos compartidos, tiempo real, comentarios e historial de versiones.
- Se inspeccionó el código existente, el esquema y las instrucciones locales; no se encontraron archivos AGENTS.md aplicables. La carpeta continúa sin Git.
- Verificados pnpm 12.16.1, Node 24.21.0, `pnpm-lock.yaml` y dependencias presentes. Comprobaciones iniciales: TypeScript, lint, 26 pruebas y `pnpm build` con Turbopack terminaron con exit 0. Las restricciones de red y ejecución anteriores ya no se reproducen en estas comprobaciones.
- No existe `.env.local`; todavía no hay configuración para conectarse a Supabase. Se solicitó al usuario que, si dispone de proyecto, configure las variables localmente sin enviar secretos por chat. El desarrollo no depende de esa respuesta; la comprobación real de persistencia sí.
- Copia previa del código, documentación, SQL, manifiesto y lockfile conservada en `.local/backups/2026-11-02-hito-2/`.
- Se conservarán el estilo editorial y los radios de máximo 7 px.
- Decisión: selección demo persistida en cookie HttpOnly, validada en el servidor contra Alice/Bob. No es autenticación de producción; el cliente no enviará un propietario arbitrario para crear o autorizar documentos.
- Decisión: acciones de servidor → servicio de documentos con autorización → repositorio Supabase con consultas tipadas. Validación del JSON con el mismo esquema gratuito usado por el editor, límites de tamaño/profundidad y atributos permitidos.
- La investigación oficial confirma Tiptap 3.32.2 como versión estable con peers React 19 compatibles. Se están revisando sus avisos de seguridad antes de instalar los paquetes alineados.

## 2026-11-02 · Hito 2 · Implementación, correcciones y entrega

### Código generado/asistido por IA

- Añadidos los cuatro paquetes oficiales `@tiptap/core`, `@tiptap/pm`, `@tiptap/react` y `@tiptap/starter-kit`, todos 3.32.2, mediante edición del manifiesto y **pnpm install**. Se actualizó el lockfile con pnpm. No se utilizaron otros gestores, ORM, servicios de pago ni extensiones Pro.
- Se revisaron la guía oficial Next/Tiptap, los componentes de StarterKit y el aviso `mergeAttributes` corregido desde 3.30.4. StarterKit v3 ya aporta underline; no se duplica la extensión. Esquema compartido entre editor y validación con los formatos solicitados; funciones ajenas al alcance desactivadas.
- Añadidos tipos de documentos, errores públicos seguros y validación pura de identificadores, títulos y JSON. El JSON se limita a 512 KiB, 5000 nodos y profundidad 32; se rechazan atributos desconocidos y claves de prototipo. ProseMirror valida la estructura y normaliza los marks. El texto literal con etiquetas se conserva como texto, no se ejecuta como HTML.
- Añadidos cookie demo HttpOnly/SameSite, acción de selección, acciones de creación/guardado, servicio con autorización por operación, repositorio Supabase y tipos de tablas/relaciones. El propietario se deriva de la selección validada del servidor, no de un campo del cliente.
- El repositorio lista solo metadatos filtrados por usuario y comprueba propiedad/permisos antes de entregar contenido. El servicio prohíbe renombrar al no propietario. Se respetan permisos preexistentes de editor, pero no se ha creado ninguna acción ni UI para compartir.
- El cliente Supabase sigue siendo `server-only`, sin sesión persistida ni caché de consultas. Se añadió timeout de 15 segundos y se evita enviar errores internos/credenciales al cliente.
- Conectada la página principal a datos del servidor con listas reales, errores, creación y apertura. Añadida ruta `/documents/[id]` con 404 para identificadores inválidos/accesos denegados y error seguro para problemas de configuración.
- Editor cliente Tiptap con `immediatelyRender: false`, selección de formatos activa y controles accesibles; título editable solo para propietario; guardado manual y estados de cambios pendientes/guardando/guardado/error. Se mantiene el contenido tras errores y una instantánea de cada guardado evita marcar como guardadas ediciones hechas durante la petición.
- Se añadió aviso de cambios sin guardar al salir, recargar o cambiar identidad, y se conservaron estilo editorial, diseño adaptable y radios de 0/3 px dentro del máximo 7.
- Pruebas nuevas de validación, servicio/autorización, acciones/cookie y adaptador de consultas. Los fixtures de memoria y respuestas HTTP simuladas solo viven en tests; no hay persistencia falsa en producción.
- Actualizados README, límite de servidor y documentación; añadido `docs/HITO_2_MANUAL_TEST.md` con preparación y recorrido aún pendiente.

### Problemas encontrados y correcciones

- El primer conjunto de tests nuevos tuvo una aserción fallida: el orden de marks devuelto por ProseMirror es canónico y puede diferir del orden recibido sin perder formato. Se corrigió la expectativa para verificar ambos marks y la estructura conservada. Después pasan todos los tests.
- Lint detectó JSX dentro del `try/catch` de la página y el callback no inline de `useMemo`; se separó carga/render y se ajustó la memoización. Lint final pasa sin warnings.
- Los antiguos bloqueos de red/puertos ya no impiden instalación, HTTP o build; no se reutilizó el resultado histórico como prueba actual.
- Se observó un archivo `.env` durante el build; una comprobación segura confirmó que tampoco contiene las dos variables Supabase requeridas. No se expusieron sus valores ni se sobrescribió el archivo.
- El navegador nativo sigue sin permisos de Computer Use. No se intentó sustituir esa verificación por una afirmación de funcionamiento visual.
- La auditoría completa detecta un aviso moderado en minimatch del árbol ESLint. Se documenta y queda pendiente una actualización compatible de esas herramientas; no se aplica un override mayor indiscriminado. La auditoría de producción no devuelve avisos conocidos.

### Verificaciones reales finales

- `pnpm exec tsc --noEmit`: **exit 0**.
- `pnpm lint`: **exit 0**, tras las correcciones descritas.
- `pnpm test:run`: **exit 0**, **83 pruebas** en **6 archivos**. Repositorio de memoria y HTTP simulado: no son E2E.
- `pnpm build`: **exit 0**, Turbopack; incluye `/documents/[id]` dinámica. No se cambió el script de build.
- `pnpm audit --prod`: **exit 0**, sin vulnerabilidades conocidas según el registro. Auditoría completa: **exit 1**, un aviso moderado de desarrollo.
- Se inicializó PostgreSQL 17 en `/private/tmp/minidocs-hito2-pg-44jj9ma8` con socket local y sin escucha TCP, se prepararon roles equivalentes, se aplicó la migración, se ejecutó dos veces el seed y pasó `supabase/tests/schema.sql`. Proceso detenido al terminar; archivos temporales conservados. Esto verifica SQL local, no Supabase remoto ni su Data API.
- HTTP local: inicio 200 con estado de configuración, ID inválido 404, UUID válido sin configuración con mensaje seguro. No prueba creación ni guardado.
- Revisión estática: siete declaraciones de radio dentro de 7 px, flag SSR, módulo privado y único lockfile pnpm comprobados.

### Pendiente y alcance final

- Falta un proyecto Supabase con migración/seed aplicados y variables privadas válidas para probar persistencia real. No se han enviado claves por chat ni se han añadido credenciales al frontend.
- Falta completar el recorrido en navegador; el acceso devuelve `Computer Use permissions are not granted`. Por tanto no se declara el flujo end-to-end comprobado.
- El usuario autorizó Hito 2. Se han implementado sus capas y UI sin avanzar a importación, creación de permisos, tiempo real, comentarios, historial de versiones o despliegue.
- Resultados y límites en `docs/VERIFICATION.md`; resumen de salidas en `docs/verification/hito-2-checks.txt`.

## 2026-11-02 · Diagnóstico del botón «Nuevo documento»

### Investigación previa a modificar código

- Solicitud del usuario: localizar la causa real del botón desactivado, revisar configuración, selector/cookies y posibles bloqueos del Hito 1; corregir sin retirar validaciones ni autorización. El usuario informa que la migración SQL ya está ejecutada en Supabase.
- Se leyeron el componente, la página servidora, la validación de entorno, las acciones, el cliente Supabase, el selector y la cookie antes de editar código de aplicación.
- El botón está en `src/components/workspace/workspace.tsx`; la condición exacta es `disabled={pending || configuration !== "configured"}`. `pending` corresponde únicamente a la transición de creación. No depende del nombre de usuario, del estado del selector ni del error al listar.
- `configuration` procede de `getServerEnvironment()` en `src/app/page.tsx`. La configuración de la clave en `.env.local` produce **`invalid`**: la variable está presente y no vacía, pero no tiene el formato admitido `sb_secret_...`. La URL pasa su validación local. No se imprimieron claves ni valores del archivo.
- La comprobación aislada del archivo y la comprobación cargada en Node coinciden. Las respuestas HTTP del servidor existente para cookies Alice y Bob muestran ambos casos con configuración inválida, botón desactivado y sin estado «Creando…».
- Las mismas respuestas seleccionan correctamente Alice/Bob según `minidocs-demo-user`. Se revisó que la acción del selector valida las identidades y utiliza HttpOnly/SameSite. La ausencia de cookie usa Alice; las identidades inválidas se rechazan en el servidor.
- Con configuración inválida no se ejecuta la consulta de documentos. La condición del botón no comprueba la migración ni la conectividad real. La SQL ya ejecutada no proporciona las credenciales del entorno de Next.js.
- No hay bloqueo fijo de creación heredado del Hito 1: el botón ya invoca `createDocumentAction()`. Solo «Importar TXT» sigue deshabilitado de forma fija porque está fuera del alcance.
- Se consultó la documentación oficial de Supabase sobre claves. No se interpreta el valor observado como clave pública, JWT, contraseña o marcador concreto: solo se ha confirmado que no cumple el formato requerido.

### Corrección y trabajo asistido por IA

- Copia de los archivos de aplicación y documentación anteriores conservada en `.local/backups/2026-11-02-create-button.vDlAtT/`. El archivo privado de credenciales no se copió ni se modificó.
- El problema de interfaz era que se descartaban los motivos de validación: solo se mostraba un aviso genérico que pedía aplicar SQL sin haber comprobado el esquema.
- La página ahora transmite únicamente los mensajes seguros del validador al componente. Se muestra exactamente qué variable falta o es inválida, junto con instrucciones para corregir `.env.local` y reiniciar el servidor. Se retiró la sugerencia incorrecta de repetir migración/seed como respuesta a este bloqueo.
- Se enlazó el botón con su explicación mediante `aria-describedby`; añadido estilo mínimo para la lista de errores. No se cambiaron radios, dependencias ni lockfile.
- **La condición `disabled` se conserva**, al igual que el validador, la cookie, las acciones, los controles de propietario/permisos y el repositorio. Habilitar el botón con la clave actual no haría posible crear en Supabase.
- Se pidió al usuario sustituir la clave dentro de su archivo local por una clave secreta del proyecto y avisar cuando estuviera configurada, sin enviarla por chat. No se inventaron ni reemplazaron credenciales.

### Pruebas y verificaciones reales

- Añadidas cinco pruebas de renderizado de página/componente: creación habilitada para Alice y Bob con configuración válida; mensaje de clave inválida sin filtrar su valor; variable faltante; error al listar que no actúa como bloqueo permanente de creación. Los servicios están simulados y no hay escrituras remotas.
- Antes de la corrección, dos pruebas fallaron porque la página ocultaba la causa de configuración; las otras tres pasaron. Tras la corrección pasan todas.
- `pnpm exec tsc --noEmit`: **exit 0**.
- `pnpm lint`: **exit 0**.
- `pnpm test:run`: **exit 0**, **88 pruebas en 7 archivos**.
- `pnpm build`: **exit 0**, Turbopack con `.env.local`, rutas generadas correctamente.
- Comprobación HTTP posterior para Alice y Bob: **200**, selector correcto, botón aún desactivado con la clave local inválida, mensaje concreto de `SUPABASE_SECRET_KEY` y vínculo accesible al diagnóstico.
- No se ha ejecutado una creación en Supabase ni verificado el recorrido en navegador. La corrección de diagnóstico está comprobada; el desbloqueo de creación real requiere que el usuario configure una clave válida.
- Resultados en `docs/VERIFICATION.md` y `docs/verification/create-button-checks.txt`.

## 2026-11-03 · Interfaz en inglés y retirada de contenido ornamental

### Solicitud y alcance

- El usuario pide traducir completamente la aplicación al inglés y eliminar eslóganes y elementos que no aporten una función útil, recordando que se trata de una prueba técnica.
- Se revisaron todos los textos de rutas, componentes, metadatos, mensajes públicos, validadores, accesibilidad, fechas y título inicial, además de los estilos y tests que dependen de esos textos.
- Copia anterior de código, tests, scripts, SQL, README y documentación conservada en `.local/backups/2026-11-03-english-ui.9TC96W/`. No se copiaron ni modificaron credenciales.

### Cambios asistidos por IA

- Interfaz íntegramente en inglés: navegación, listas, creación, editor, estados de guardado, confirmación de descarte, errores/404, etiquetas accesibles y avisos de configuración/autorización.
- Cambiados `lang` a `en`, metadatos descriptivos, fechas a `en-US` manteniendo UTC, y título de nuevos documentos a `Untitled document`. El servicio ya envía ese título explícitamente al insertar; no hace falta modificar datos ni reaplicar una migración para usarlo en la aplicación.
- Los indicadores de formato pasan a B/I/U con nombres accesibles Bold/Italic/Underline. Se conservan la configuración SSR de Tiptap y las mismas reglas de validación y permisos.
- Retirados eslóganes, pie promocional, marca ornamental m/d, números decorativos, textos de introducción/repetidos, versión y estado demo duplicados, ilustraciones de estados vacíos y el control TXT deshabilitado que aún no implementa una función.
- Se conservaron navegación, contadores reales, listas propias/compartidas, selector, estado de conexión y aviso de identidades demo necesario para no presentarlo como autenticación de producción.
- Reducidos los estados vacíos y eliminados estilos sin uso y un elemento vacío usado como separador. La navegación móvil conserva etiquetas visibles después de retirar los índices decorativos. Los radios siguen dentro del máximo de 7 px.
- Actualizadas las expectativas de mensajes en tests existentes. Se mantienen las pruebas con datos UTF-8 en español/japonés: son contenido de usuario, no textos de interfaz.
- README, documentación del límite del servidor y recorrido manual actualizados al inglés y a los nombres actuales de los controles. El registro histórico de desarrollo conserva su idioma y sus resultados originales.
- No se añadieron dependencias, acciones, funciones de hitos posteriores ni escrituras en Supabase. Los documentos existentes conservan títulos y contenido.

### Correcciones y verificaciones reales

- La limpieza programática del CSS dejó selectores vacíos y retiró la directiva de importación de Tailwind. Las advertencias del primer build y la revisión del CSS permitieron detectarlo. Se eliminaron las reglas vacías, se restauró el import y el build final terminó sin esas advertencias.
- `pnpm exec tsc --noEmit`: **exit 0**.
- `pnpm lint`: **exit 0**, sin warnings.
- `pnpm test:run`: **exit 0**, **88 pruebas en 7 archivos**. No se añadieron tests que solo reflejen cambios reversibles de presentación.
- `pnpm build`: **exit 0**, Turbopack. Compilación final limpia tras corregir CSS.
- Comprobación estática: textos de runtime en inglés, import Tailwind presente, sin selectores vacíos/decorativos retirados y radios de máximo 7 px.
- HTTP de solo lectura: inicio de Alice y Bob **200**, `lang=en`, controles funcionales en inglés, sin eslóganes/elementos retirados y CSS con utilidades accesibles Tailwind servido correctamente.
- Apertura de un documento existente por HTTP: **200**, etiquetas del editor, navegación y estados SSR en inglés. No se registró su contenido ni se modificaron datos.
- Ruta con ID inválido: **404**, `Page not found` en inglés.
- No se realizaron interacciones de navegador ni una prueba end-to-end de edición/guardado. No se atribuye a esas lecturas una verificación de escritura o formato interactivo.
- Evidencia resumida en `docs/verification/english-ui-checks.txt` y resultados actuales en `docs/VERIFICATION.md`.

## 2026-11-03 · Revisión de etiquetas de listas y del editor

- El usuario informa que ve «lista» en lugar de «List» y solicita revisar toda la aplicación.
- Antes de editar se revisaron la barra Tiptap, las extensiones, el editor, los textos de runtime y el JavaScript servido al abrir un documento existente. En esa comprobación, el servidor entregaba `• List` y `1. List`, con tooltips en inglés y sin una etiqueta `Lista`. No se atribuye a la aplicación una cadena que no se ha podido reproducir en sus respuestas.
- Se intentó inspeccionar Chrome; Computer Use devolvió `Computer Use permissions are not granted`. Por tanto no se ha comprobado el DOM que ve el usuario ni se ha confirmado si interviene caché o traducción automática.
- Copia previa en `.local/backups/2026-11-03-list-labels.TJwkR8/`.
- Cambiados los textos visibles a **Bulleted List** y **Numbered List**, manteniendo nombres accesibles/tooltip en inglés y los mismos comandos de edición. Esto hace inequívoco el idioma y el tipo de lista.
- Añadido `translate="no"` al HTML que ya declara `lang="en"`, para señalar que la interfaz debe conservar su idioma. Es una medida preventiva ante herramientas de traducción; no una confirmación de que fueran la causa. Referencia consultada: [MDN sobre translate](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/translate).
- La revisión de los `.ts`/`.tsx` de runtime no detectó etiquetas españolas del editor, navegación, guardado ni configuración. El texto UTF-8 de fixtures y los documentos del usuario no se tradujeron ni modificaron.
- `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test:run` y `pnpm build`: **exit 0**. Siguen pasando **88 pruebas en 7 archivos**; no se añadieron tests que solo repitan estas etiquetas de presentación.
- Verificación del bundle de producción: presentes las nueve etiquetas de controles en inglés (Bold, Italic, Underline, Normal text, Heading 1/2/3, Bulleted List y Numbered List), sin `Lista`.
- HTTP posterior: Alice y Bob responden **200**, con `lang=en` y `translate=no`. Una comprobación que intentaba abrir un documento existente terminó con aserción fallida porque en ese momento ninguna lista tenía documentos; la consulta posterior confirmó conexión correcta y cero filas visibles en ambas listas. No se crearon registros para forzar esa comprobación.
- No se han modificado credenciales, dependencias, permisos ni datos de Supabase. No hay prueba visual o interacción real con los botones.

## 2026-11-03 · Finalización de requisitos obligatorios

### Instrucción, alcance y conservación

- Prompt del usuario: completar todos los requisitos de Ajaia en aproximadamente 30 minutos, ejecutar inmediatamente, conservar lo funcional y distinguir pruebas simuladas, Supabase real, navegador y despliegue. La posterior instrucción `continue` mantuvo ese mismo objetivo.
- Se revisaron el repositorio, dependencias/lockfile pnpm, arquitectura, acciones, SQL, tests, permisos y configuración. La carpeta sigue sin historial Git; no se reinició ni sustituyó el proyecto.
- Copia del trabajo previo en `.local/backups/2026-11-03-finalization.cQvYij/`, excluida de Git, Vercel y TypeScript. No se copiaron credenciales a la entrega. No se borraron archivos ni datos previos.
- El usuario ya había configurado el proyecto Supabase y ejecutado la migración/seed. No se volvieron a aplicar ni se cambiaron sus credenciales. Se comprobó realmente que la base admite las operaciones necesarias.

### Código generado/modificado con IA y decisiones

- Codex implementó `parseTxtImport`, las acciones/servicios de importación y compartir, consultas tipadas, interfaces del repositorio, botón de importación y control de compartir. Conservó Next.js/Tiptap/Supabase sin ORM, sin nuevas dependencias de runtime y exclusivamente pnpm.
- Compartir: actor de cookie validada; solo propietario; destinatario fijo = otro usuario demo, nunca un ID arbitrario del cliente; upsert idempotente con PK compuesta existente. Receptor edita contenido, pero renombrar y volver a compartir se rechazan en servidor. Permisos cargados al reabrir, listas separadas.
- TXT: `.txt` insensible a mayúsculas, no vacío, máximo 256 KiB, UTF-8 estricto/BOM, normalización CRLF/CR, máximo 2.000 líneas y límites JSON existentes. Párrafos por línea, incluso vacías/finales; nodos de texto sin parser HTML. Ownership asignado por el servicio.
- La interfaz nueva permanece en inglés, funcional, sin eslóganes y conserva controles de 3px. Compartir requiere guardar los cambios pendientes primero; el servidor mantiene todas las validaciones independientemente de la UI.
- Revisión final: añadido rechazo inmediato en el cliente para extensión/tamaño/vacío antes de subir, usando el mismo límite de tamaño que el servidor. Así un archivo enorme no llega al límite de body de Next antes de poder mostrar el error de tamaño. La validación del servidor se mantiene completa. Se retiraron cuatro reglas CSS vacías remanentes sin alterar estilos.
- Se añadieron pruebas significativas y un test remoto que exige `MINIDOCS_LIVE_TEST=1`; el flujo por defecto no escribe en Supabase. Se creó un harness HTTP con el codec Flight y manifiesto del Next fijado, solo para comprobar acciones reales del build local. No se confunde con navegador.
- Se prepararon `vercel.json` (Next.js/Corepack/frozen lockfile), `.vercelignore`, `samples/demo.txt`, documentación de arquitectura, flujo de IA, entrega, despliegue, aceptación manual y vídeo de 3–5 minutos. No se instaló Vercel como dependencia del producto; se usó `pnpm dlx vercel@65.9.0`.

### Problema real encontrado y corrección

- La primera integración con Supabase ejecutó creación, guardado, permisos y edición, pero acabó fallando al comprobar la página HTTP del documento rico: **500**. Los documentos de párrafos simples sí abrían.
- Se inspeccionó la respuesta: React rechazaba atributos de ProseMirror con prototipo nulo al cruzar el límite servidor/cliente. Se corrigió `validateDocumentContent` para devolver un árbol JSON normalizado después de validar el esquema, sin debilitarlo.
- Se añadió regresión para atributos de encabezados/listas. Tras rebuild, el documento rico respondió **200** y toda la integración real terminó correctamente. No se eliminó la prueba ni se atribuyó el error a Supabase.
- Se mantuvieron seis documentos etiquetados de verificación producidos por el intento fallido, la ejecución corregida y el harness HTTP. No se borraron para ocultar el fallo.

### Verificaciones observadas

- `pnpm install --frozen-lockfile`: exit 0, instalación reproducible con el lockfile existente.
- `pnpm exec tsc --noEmit`: exit 0. `pnpm lint`: exit 0, sin warnings.
- `pnpm test:run`: **105 pasadas + 1 omitida** en 9 archivos (8 pasados, el remoto omitido por defecto). Las nuevas pruebas cubren compartir Alice/Bob, duplicados, permisos, importación y serialización.
- `pnpm build`: exit 0 con Turbopack; compilación y tipos completados. Producción local iniciada temporalmente en `127.0.0.1:3010`; no es una URL pública. El servidor de desarrollo previo del usuario en 3000 se conservó.
- Integración opt-in real: **1 prueba pasada en 5,51 s**. Guardado/reapertura JSON con todos los formatos, compartir persistido con count=1, edición Bob recuperada por Alice, permisos negativos y TXT UTF-8/líneas/HTML literal. Evidencia en `docs/verification/live-supabase.json`.
- HTTP real sobre acciones compiladas: creación, guardado, compartir dos veces, Bob edita, multipart TXT, cambio de usuario; rechazos de actor falso, PDF, escritura privada, renombrado y reshare de receptor. Evidencia en `docs/verification/http-actions.json`. Lectura privada adicional de Bob: 404 sin título privado.
- Después de la comprobación local de archivos y limpieza CSS se repitieron instalación frozen, TypeScript, lint, 105 unitarias, build y auditorías. El transcript real conserva exit 1 de audit y exit 0 de los demás comandos en `docs/verification/final-checks.txt`/`.json`.
- Se reinició únicamente el servidor de producción temporal del asistente en 3010 y se reabrieron los documentos reales: inicio/documento rico 200 para Alice y Bob, edición de Bob visible para ambos, importado privado 404 para Bob. También se comprobó que la clave privada configurada no aparece por coincidencia exacta en 97 archivos de fuente/documentación y assets cliente; no se imprimió el secreto. Evidencia en `docs/verification/final-http-and-secrets.json`.
- `pnpm audit --prod`: exit 0, sin vulnerabilidades conocidas. `pnpm audit`: exit 1, un aviso moderado minimatch del árbol ESLint de desarrollo. No se fuerza un override mayor incompatible; actualización compatible pendiente.
- Vercel `whoami`: exit 1, Logged out. `deploy --dry`: tampoco puede preparar sin sesión. Se pidió al usuario iniciar sesión en su terminal mediante pnpm si deseaba despliegue durante la sesión. No se usó una cuenta ajena, un despliegue temporal anónimo ni se inventó una URL.

### Límites pendientes y entrega

- No hay interacción visual de navegador comprobada: los intentos Computer Use registrados devolvieron falta de permisos. Las verificaciones de Supabase y HTTP reales no se denominan E2E de navegador.
- Una consulta nueva de navegadores conectados con Computer Use devolvió `[]`; se conservó la limitación en la entrega.
- Publicación Vercel pendiente de sesión del titular; hay instrucciones exactas de Node 24, Corepack, tres variables y deploy. La base existente ya pasó escrituras y no requiere una migración adicional para compartir/importar.
- Vídeo y URLs de entrega pendientes del candidato. `SUBMISSION.md` incluye campos marcados pendientes y guion de 4:30, sin afirmar una grabación inexistente.
- Límites de producto expresos: identidades demo, último guardado gana en concurrencia, sin colaboración en tiempo real/historial/comentarios/revocación. Mejoras propuestas con 2–4 horas: E2E/accesibilidad, autenticación real, concurrencia optimista, actualización compatible de tooling y paginación.
- Material de entrega adicional: creado `.local/delivery/MiniDocs-source.zip` con 88 archivos de fuente/configuración/documentación. Se revisaron los miembros y el contenido descomprimido: sin `.env.local`, carpetas generadas ni coincidencia con la clave privada configurada. El ZIP está ignorado y no reemplaza la URL de repositorio pendiente.
- Revisión estática final: radios CSS explícitos máximo 3px, sin reglas vacías, HTML en inglés y sin otros lockfiles. No se denomina prueba visual.

## 2026-11-03 · Publicación en el repositorio creado por el usuario

- Instrucción: crear/revisar `.gitignore` y subir todos los cambios al repositorio recién creado.
- Se encontró Git ya inicializado por el usuario, rama `main`, remoto `https://github.com/lewezz/minidocs.git` y commit inicial `10edc6b` que contiene README. `git ls-remote` confirmó esa rama remota. Se conservan ese commit, su autoría y el historial; no se reinicia ni se fuerza el remoto.
- Se revisó el `.gitignore` existente y se añadieron comentarios y exclusiones de cachés/salidas. Permanecen excluidos `.env.local`, `.local`, `.next`, `node_modules`, metadatos Vercel y archivos generados; `.env.example` vacío y `pnpm-lock.yaml` se incluyen.
- Se conservaron copias previas de ignore/documentación en `.local/backups/git-publication-*`. Se actualizó la URL real de código en la entrega y las instrucciones Vercel. Los resultados históricos sin repositorio Git se conservan como historial de fases anteriores.
- Se prepara commit y push normal a `main`, revisando los archivos que entrarán en Git y la ausencia de la clave privada configurada. Esta operación no modifica código de runtime ni vuelve a ejecutar pruebas remotas que generen documentos.
- Comprobación previa: 88 archivos revisados, sin la clave privada real; seis rutas de entorno/generados correctamente ignoradas y `.env.example` sin valores. El primer detector genérico señaló tres claves ficticias de tests; se revisaron sus contextos de mocks y URL `example.supabase.co` antes de aceptarlas como fixtures, sin mostrar los valores. No quedan coincidencias de credenciales sin revisar.

## 2026-11-03 · Eliminar documentos y dejar de compartir

- Petición del usuario: añadir funciones para eliminar documentos y dejar de compartirlos. Se mantiene la UI en inglés y la arquitectura existente, sin dependencias nuevas.
- Estado inicial: rama `main` limpia y sincronizada con el remoto tras el push real de `eb4c33c`; pnpm 12.16.1 presente. Se revisaron servicio, acciones, repositorio, controles, permisos SQL y tests antes de editar.
- Copia previa de fuente, tests, SQL y documentación en `.local/backups/document-removal-*`, ignorada por Git.
- El esquema inicial concede SELECT/INSERT/UPDATE, pero no DELETE, a `service_role`. Preparada la migración incremental `20261103000100_document_deletion.sql`: añade DELETE solo al rol del servidor en documentos y permisos. No cambia datos existentes, permisos de navegador ni RLS. La clave de API disponible no permite ejecutar DDL; aplicar la migración remota requiere SQL Editor o credenciales administrativas.
- Codex añadió `remove`/`unshare` al repositorio y servicio, y `deleteDocumentAction`/`unshareDocumentAction` que derivan la identidad de la cookie y revalidan lista/documento. Se validan UUID, actor y propietario antes de escribir. El DELETE del documento filtra también por `owner_id`; la FK existente elimina sus permisos en la misma transacción. La revocación solo elimina el grant del otro demo y es idempotente.
- UI en inglés: Delete reutilizable en documentos propios y editor del propietario, con confirmación de pérdida permanente; Stop sharing con confirmación y posibilidad de compartir de nuevo. Receptor sin esos controles. Se mantuvieron radios de 3px, etiquetas accesibles, errores y carga. No se añadió papelera ni recuperación.
- Se añadieron 17 unitarias de servicio/adaptador/acciones y una integración remota opt-in separada. Esta última verifica permisos antes de crear un único fixture nuevo; si pasa, borra solo ese fixture. No se usa para eliminar documentos previos del usuario.
- Comprobaciones reales: frozen install, TypeScript, lint, build y **122 unitarias** correctos; **2 integraciones omitidas** por defecto. Auditoría producción exit 0; completa exit 1 por el aviso moderado de minimatch ya conocido. Evidencia en `docs/verification/lifecycle-checks.*`.
- PostgreSQL **17.11 local** aislado: migración inicial + incremental, incremental repetida y seed repetido correctos; schema y lifecycle SQL pasan, con ROLLBACK. Comprobados DELETE como `service_role`, revocación sin pérdida del documento, predicado propietario y cascada de shares. Se detuvo la instancia después, conservando sus archivos temporales para inspección.
- Supabase real: DELETE limitado a UUID inexistente devuelve **403 / 42501** en ambas tablas. Se pidió al usuario ejecutar el nuevo GRANT en SQL Editor mientras continuaba la implementación. La integración explícita se ejecutó y acabó con **exit 1 en preflight**, antes de crear/borrar un documento. No se presenta como borrado remoto verificado ni se modificaron permisos existentes para forzar un resultado.
- Se actualizaron README, arquitectura, límites del servidor, entrega, proceso IA, despliegue y checklist manual. La funcionalidad queda preparada, pero su activación remota depende de la migración y el recorrido interactivo de navegador sigue sin comprobarse.
- Smoke HTTP real de las acciones nuevas compiladas: **8 rechazos correctos** de entradas inválidas, cookie alterada, payload con propietario y UUID inexistente, sin modificar documentos. Se separa de la prueba positiva pendiente del permiso SQL. Evidencia en `docs/verification/lifecycle-http.json`.
- Comprobación remota final antes de preparar la publicación: ambos permisos siguen devolviendo 403 / 42501; `docs/verification/deletion-preflight-latest.json` conserva esa observación por separado del preflight inicial. El código y la migración se preparan para subir al mismo repositorio previamente autorizado; no se afirma un despliegue o borrado remoto satisfactorio.
