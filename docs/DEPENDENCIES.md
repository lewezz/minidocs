# Dependencias y revisión de seguridad

**Estado actual · 2026-11-03:** dependencias instaladas y lockfile pnpm reproducible; no se añadieron dependencias de runtime durante la finalización. `pnpm audit --prod`: exit 0, sin avisos conocidos. `pnpm audit`: exit 1, un aviso moderado de minimatch en herramientas de desarrollo. Los apartados iniciales que describen bloqueos de red son históricos y se conservan como registro.

Fecha de revisión: **2026-11-02**. Se consultaron fuentes primarias antes de crear el manifiesto. La resolución completa de peers y dependencias transitivas solo podrá confirmarse tras instalar y auditar.

| Dependencia | Selección | Motivo |
| --- | --- | --- |
| Next.js / eslint-config-next | 16.4.4 | App Router y configuración ESLint de la misma versión. El registro anuncia 16.4.4 estable. |
| React / React DOM | 19.3.1 | Misma versión estable y línea que contiene correcciones recientes de RSC. |
| TypeScript | 5.9.3 | Rama estable conservadora, compatible con la API tradicional usada por herramientas ESLint/Next. No es la última major. |
| Tailwind / @tailwindcss/postcss | 4.3.3 | Integración PostCSS de Tailwind v4, sin configuración v3. |
| PostCSS | 8.5.23 | Misma versión observada en los metadatos de Next 16.4.4. |
| ESLint | 9.39.4 | Configuración flat y compatibilidad conservadora con las herramientas TypeScript. |
| Vitest | 4.1.12 | Rama estable v4 con mantenimiento; no requiere navegador para pruebas puras de este hito. |
| @supabase/supabase-js | 2.118.0 | SDK oficial, consultas al PostgreSQL de Supabase por PostgREST desde el servidor, sin ORM. |
| server-only | 0.0.1 | Impide importar módulos privados desde componentes cliente en Next.js. |
| @types/node / react / react-dom | ^24 / ^19 / ^19 | Tipos compatibles con los majors elegidos; sus versiones exactas deberán quedar en el lockfile generado por pnpm. |

No se han añadido Tiptap (Hito 2), ORM, librerías de iconos, fuentes remotas, librerías de formularios, animaciones, servicios de pago ni herramientas de tests de navegador.

## Avisos consultados

- [Next.js: actualización del 14 de octubre de 2026](https://nextjs.org/blog/nextjs-security-update-october-14-2026): fija vulnerabilidades críticas y altas en 16.4.1/15.5.28. Se elige una versión posterior de la rama 16.4.
- [React: aviso GHSA-xqc2-xf4c-x3h3](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3): enumera 19.3.1 entre las versiones corregidas de los paquetes RSC afectados. Next incluye su integración de RSC; no se añade un paquete RSC directo.
- [Next.js: parches anunciados para el 3 de noviembre](https://nextjs.org/blog/upcoming-nextjs-security-release-november-2026): anuncio de siete vulnerabilidades medias; sus detalles no están publicados en el aviso consultado. Revisar y actualizar la selección cuando se publique la corrección, antes del despliegue.
- [Registro oficial: Next](https://registry.npmjs.org/next/latest), [React](https://registry.npmjs.org/react/latest), [Tailwind](https://registry.npmjs.org/tailwindcss/latest), [TypeScript](https://registry.npmjs.org/typescript/latest) y [Supabase](https://www.npmjs.com/package/%40supabase/supabase-js?activeTab=versions): metadatos consultados por navegador; no equivalen a una instalación local.
- [Supabase: API keys](https://supabase.com/docs/guides/getting-started/api-keys) y [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): claves secretas solo en servidor, acceso elevado y necesidad de autorización de aplicación.
- [Tiptap: integración Next.js](https://tiptap.dev/docs/editor/getting-started/install/nextjs): preparar componente cliente con `immediatelyRender: false` en el siguiente hito.

## Límite de la revisión

El terminal no puede resolver `registry.npmjs.org`. Las consultas `pnpm view` y la instalación han fallado por red. La selección del manifiesto es revisable, pero **todavía no hay resolución completa, lockfile, instalación ni auditoría satisfactoria**. No se afirma que el árbol de dependencias esté libre de vulnerabilidades. Antes de aprobar el Hito 1, resolver versiones, comprobar peers estrictos, generar el único `pnpm-lock.yaml`, ejecutar `pnpm audit` y corregir los avisos reales sin omitirlos.

### Actualización al revisar la interfaz

El párrafo anterior registra el intento inicial. En la revisión posterior ya se encontraron dependencias instaladas y `pnpm-lock.yaml`, sin haber cambiado el manifiesto en esa revisión. TypeScript, lint, 26 pruebas y el build mediante Webpack terminaron correctamente. La auditoría sigue bloqueada por DNS. No se afirma que el árbol esté libre de vulnerabilidades; ver `docs/VERIFICATION.md` para los resultados actuales y sus límites.

## Hito 2 · Tiptap y auditoría accesible

- Añadidos exclusivamente `@tiptap/core`, `@tiptap/pm`, `@tiptap/react` y `@tiptap/starter-kit`, todos fijados en **3.32.2**. Se verificaron versión estable y peers mediante `pnpm view`; React 19 está dentro del rango admitido. Instalación real con `pnpm install`, sin otros gestores.
- StarterKit v3 ya incluye el subrayado: no se añade una extensión duplicada. Se desactivan enlaces, código, citas, tachado, separadores y otras funciones ajenas al alcance. El esquema resultante tiene los tres marks requeridos y encabezados H1–H3.
- Se consultaron la [integración oficial de Next.js](https://tiptap.dev/docs/editor/getting-started/install/nextjs), [StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit) y los [avisos oficiales](https://github.com/ueberdosis/tiptap/security/advisories).
- El [aviso de `mergeAttributes`](https://github.com/ueberdosis/tiptap/security/advisories/GHSA-cp6q-959q-f8rh) identifica 3.30.4 como versión corregida; la seleccionada es posterior. Además se rechazan atributos desconocidos y claves como `__proto__` en el JSON recibido. No se utilizan Markdown ni CollaborationCaret.
- `pnpm audit --prod` termina con exit 0: **sin vulnerabilidades conocidas según la respuesta del registro**.
- La auditoría completa devuelve **un aviso moderado** de `minimatch` en el árbol de herramientas ESLint: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), corrección reportada en `>=11.0.1`. No se ha forzado un salto mayor global sobre consumidores de otras APIs de minimatch. Queda pendiente una actualización compatible de las herramientas; no afecta al resultado de la auditoría de dependencias de producción y no se oculta del informe completo.
- No se cambiaron las versiones de Next, React o ESLint ni se añadieron servicios de pago.
