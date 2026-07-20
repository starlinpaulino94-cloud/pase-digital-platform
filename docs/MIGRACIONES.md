# Migraciones de base de datos — flujo y prevención de schema drift

## El problema que este flujo previene

En este proyecto las migraciones **se aplican a mano** en el SQL Editor de
Supabase (no hay `prisma migrate deploy` automático en el pipeline). Eso crea
un modo de fallo recurrente:

1. Se hace deploy en Vercel de código cuyo Prisma Client espera columnas o
   tablas nuevas.
2. Nadie corre el `migration.sql` correspondiente en Supabase.
3. Cualquier query que toque esos objetos revienta con `P2021`/`P2022`
   ("column … does not exist") y el usuario ve pantallas como
   **"No pudimos cargar tu información"**.

Ya ocurrió al menos dos veces: el hotfix del 14-07-2026
(`scripts/hotfix-2026-07-14-migraciones-pendientes.sql`, rompía el registro) y
el perfil del cliente (columnas `clientes.ciudad/genero/notifPromos/…` de
`20260723_add_cliente_profile_fields`).

## La herramienta: DB Doctor

`scripts/db-doctor.mjs` compara **todo** `prisma/schema.prisma` (lo que el
código espera: 85 modelos, todos los enums) contra la base de datos real, y
lista exactamente qué falta y qué migración lo crea. Reemplaza a los
verificadores manuales parciales (`scripts/verificar-migraciones-produccion.sql`),
que solo cubrían un puñado de objetos y quedaban obsoletos con cada fase.

### Modo 1 — con conexión local (recomendado)

```bash
DATABASE_URL="postgres://…"   # la de producción (Supabase → Connection string)
npm run db:doctor
```

- `✓ Esquema al día` → no hay nada pendiente.
- `✗ SCHEMA DRIFT` → lista cada tabla/columna/valor de enum faltante **y el
  archivo de migración que lo crea**. Sale con código 1 (sirve para CI).

### Modo 2 — sin conexión local (pegar en Supabase)

```bash
npm run db:doctor:sql > /tmp/doctor.sql
```

Pega el contenido en el **SQL Editor de Supabase** y ejecútalo. Es un SELECT de
solo lectura: devuelve una tabla con lo que FALTA (vacía = todo al día).

## Flujo obligatorio en cada deploy

1. **Antes de mergear/desplegar** código que toque `prisma/schema.prisma`:
   revisa si el cambio añadió carpetas en `prisma/migrations/`.
2. **Aplica el SQL** de esas carpetas en el SQL Editor de Supabase (todas las
   migraciones del repo son idempotentes: `IF NOT EXISTS` / `ADD VALUE IF NOT
   EXISTS`; correrlas dos veces no rompe nada).
3. **Verifica** con `npm run db:doctor` (o el modo SQL) hasta ver ✓.
4. Despliega (o redeploy) en Vercel.

> Regla de oro: **la base de datos se migra ANTES que el código que la usa.**
> Como todas nuestras migraciones son aditivas, aplicarlas antes nunca rompe el
> código viejo.

## Señales de drift en producción

- **`/api/health`** (con el header `x-health-secret`): el check `schema`
  reporta `DRIFT` y lista los objetos centinela faltantes. Los centinelas son
  una muestra (una tabla/columna por tanda de migraciones); el detalle completo
  lo da el doctor.
- **Logs de Vercel**: los `catch` instrumentados con
  `src/lib/prisma-errors.ts` clasifican el error (`SCHEMA_DRIFT` / `CONEXION` /
  `RESTRICCION`) e imprimen el remedio, en lugar del genérico "Error loading".

## Defensa en profundidad en el código

- `getClientePerfil` (perfil del cliente) tiene **degradación controlada**: si
  el select completo falla por columna faltante, reintenta con el núcleo
  estable de columnas y rellena las nuevas con defaults — la página carga con
  la información básica en vez de morir. Usa este patrón en páginas críticas
  cuando agregues columnas nuevas a un select.
- Preferir siempre `select` explícito (nunca traer el modelo completo): una
  query sin `select` selecciona TODAS las columnas del modelo y convierte
  cualquier columna nueva sin migrar en un error fatal (así se rompió el
  registro el 14-07).

## Nota sobre entornos

`db:doctor` verifica la BD a la que apunte `DATABASE_URL`. Si tienes staging y
producción, córrelo contra cada una. El modo `--sql` es agnóstico: el mismo
script pegado en cada proyecto de Supabase.
