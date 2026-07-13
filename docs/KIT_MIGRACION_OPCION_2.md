# Kit de migración · Opción 2 (2 repos + `@membego/ui` desde el día 1)

> Ejecutable a la medida de este repo (Next 16, Tailwind v4, npm). Materializa
> **3 artefactos**: el paquete `@membego/ui`, `membego-app` (clon del actual) y
> `membego-landing` (desde cero). Verifica en navegador tras cada checkpoint.
> Nada aquí toca el repo actual: son plantillas y comandos para tu entorno.

## Artefactos

1. **`@membego/ui`** — paquete privado con el design system (fuente única).
2. **`membego-app`** — este repo, clonado y renombrado; adopta `@membego/ui`.
3. **`membego-landing`** — repo nuevo, mínimo, consume `@membego/ui`.

Distribución del paquete: **GitHub Packages** (registro npm privado de la org) +
`transpilePackages` en Next (el paquete envía TSX crudo, sin build). Alternativa
sin registro: dependencia `github:tu-org/membego-ui#main`.

---

## Paso 1 · Crear `@membego/ui`

Repo nuevo `membego-ui/` con esta estructura:
```
membego-ui/
  package.json
  tsconfig.json
  src/
    index.ts           # re-exporta todo
    lib/cn.ts          # el helper cn (movido de src/lib/utils.ts)
    ui/                # copia de src/components/ui/*  (27 archivos)
    theme/             # ThemeProvider.tsx, ThemeToggle.tsx
    styles/globals.css # tokens @theme (copia de src/app/globals.css)
```

**`membego-ui/package.json`** (deps exactas que usa `ui/`):
```json
{
  "name": "@membego/ui",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./styles.css": "./src/styles/globals.css"
  },
  "peerDependencies": { "react": "^19", "react-dom": "^19" },
  "dependencies": {
    "@radix-ui/react-accordion": "^1",
    "@radix-ui/react-alert-dialog": "^1",
    "@radix-ui/react-dialog": "^1",
    "@radix-ui/react-dropdown-menu": "^2",
    "@radix-ui/react-label": "^2",
    "@radix-ui/react-progress": "^1",
    "@radix-ui/react-select": "^2",
    "@radix-ui/react-slot": "^1",
    "@radix-ui/react-switch": "^1",
    "@radix-ui/react-tabs": "^1",
    "@tanstack/react-table": "^8",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "cmdk": "^1",
    "lucide-react": "^0.5",
    "next-themes": "^0.4",
    "sonner": "^2",
    "tailwind-merge": "^3"
  }
}
```
> Ajusta los rangos a los del `package.json` actual (cópialos tal cual para no
> cambiar versiones). `cn` sale de `src/lib/utils.ts` (deja `safeInternalPath`
> en la app). `src/index.ts` re-exporta `./lib/cn` y cada componente de `./ui/*`.

**`membego-ui/tsconfig.json`**: `jsx: "preserve"`, `moduleResolution: "Bundler"`,
`paths` no necesarios (imports relativos dentro del paquete).

Publicar: `npm publish` a GitHub Packages (con `.npmrc` de la org) **o** usar el
repo como dependencia git.

**Checkpoint 1:** el paquete instala y `import { Button } from '@membego/ui'`
resuelve en un proyecto de prueba.

---

## Paso 2 · `membego-app` (clon del repo actual)

1. Duplica el repo actual → `membego-app` (mismo código, todo funciona).
2. Añade la dependencia y `transpilePackages`:
   - `package.json`: `"@membego/ui": "^0.1.0"` (o `github:tu-org/membego-ui#main`).
   - `next.config.ts`: `transpilePackages: ['@membego/ui']`.
3. `globals.css`: `@import "tailwindcss";` + `@source "../node_modules/@membego/ui/src";`
   (o importa `@membego/ui/styles.css`).
4. **Adopción incremental** de `@membego/ui`: reemplaza `@/components/ui/x` →
   `@membego/ui` por lotes (codemod), verificando estilado. Mientras tanto puede
   convivir con la copia local — sin prisa, sin big-bang.
5. Env: mantén todo; añade `NEXT_PUBLIC_COOKIE_DOMAIN=.membego.com` en producción.
6. Dominio: `app.membego.com`.

**Checkpoint 2:** login, paneles, scanner, pagos y referidos funcionan igual;
estilado idéntico donde ya se adoptó `@membego/ui`.

---

## Paso 3 · `membego-landing` (desde cero)

Repo nuevo `membego-landing/` (Next 16). Copia SOLO los archivos del manifiesto
(abajo). `package.json` podado:

```json
{
  "name": "membego-landing",
  "private": true,
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start", "lint": "eslint ." },
  "dependencies": {
    "@membego/ui": "^0.1.0",
    "@prisma/client": "^6",
    "next": "^16",
    "next-themes": "^0.4",
    "lucide-react": "^0.5",
    "react": "^19",
    "react-dom": "^19",
    "sharp": "^0.34",
    "sonner": "^2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "tw-animate-css": "^1",
    "prisma": "^6",
    "typescript": "^5",
    "eslint": "^9",
    "eslint-config-next": "^16",
    "@types/node": "^20", "@types/react": "^19", "@types/react-dom": "^19"
  }
}
```
> Sin `@supabase/*`, sin Sentry, sin scanner/leaflet/recharts/qr/tanstack/cmdk
> (llegan dentro de `@membego/ui` solo si se usan). `@prisma/client` se queda por
> la **lectura** del marketplace (opción B).

**`membego-landing/next.config.ts`** (mínimo):
```ts
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@membego/ui'],
  images: { remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }] },
  redirects: async () => [{ source: '/empresa/:slug*', destination: '/empresas/:slug*', permanent: true }],
  // Headers/CSP: copiar los del repo actual QUITANDO connect-src de Supabase/Sentry.
}
export default nextConfig
```

**`membego-landing/globals.css`**: copiar los tokens `@theme` del actual +
`@import "tailwindcss";` + `@source "../node_modules/@membego/ui/src";`.

**Env (`.env`)**: `DATABASE_URL`, `DIRECT_URL` (lectura),
`NEXT_PUBLIC_APP_URL=https://membego.com`,
`NEXT_PUBLIC_APP_ORIGIN=https://app.membego.com`. **Sin** service_role/Resend/CRON.

### Manifiesto de archivos a copiar del repo actual → `membego-landing/`
```
# Rutas (desde src/app/(public)/ → src/app/  del landing, o mantén el grupo)
(public)/page.tsx                         → app/page.tsx
(public)/layout.tsx                       → app/layout.tsx (fusiona con el root layout: fonts+ThemeProvider+Toaster+SEO/JSON-LD)
(public)/empresas/**                      → app/empresas/**
(public)/promociones/page.tsx             → app/promociones/page.tsx
(public)/promocion/[id]/**                → app/promocion/[id]/**
(public)/plan/[id]/**                     → app/plan/[id]/**
(public)/contact|terms|privacy/page.tsx   → app/.../page.tsx
(public)/caracteristicas|faq|descargar|blog/page.tsx → app/.../page.tsx
app/sitemap.ts, app/robots.ts             → app/
app/layout.tsx (root: metadata+JSON-LD)   → app/layout.tsx
# Componentes
components/public/**  (menos FollowButton) → components/public/**
components/marketplace/{PromotionDetail,CompanyProfile}.tsx → components/marketplace/  (o @membego/ui)
# Lib (solo lectura pública)
lib/site.ts, lib/format.ts, lib/prisma.ts → lib/
# Módulos (SOLO lectura del marketplace)
modules/marketplace/{queries.ts,types.ts} → modules/marketplace/   (trimear a público: quitar getUser/actions de escritura)
modules/empresas/regional.ts              → modules/empresas/
prisma/schema.prisma                      → prisma/    (misma DB)
```
Ajustes tras copiar:
- `@/components/ui/*` → `@membego/ui`; `cn` → `import { cn } from '@membego/ui'`.
- Enlaces a login/registro/registro-empresa/seguir → `appUrlFor(...)`.
- `getPromotionDetail`: quitar la rama de promos privadas (`getUser`) → la
  Landing queda sin `@supabase`.

**Checkpoint 3:** `npm run build` verde; estilado correcto; `/empresas`,
`/promocion/[id]`, `/faq`, OG y sitemap funcionan; **no** hay `service_role`.

---

## Script de ensamblado (para tu máquina, NO ejecutar aquí)

`assemble-landing.sh` — copia el manifiesto desde el repo actual a un destino:
```bash
#!/usr/bin/env bash
set -euo pipefail
SRC="${1:?ruta al repo actual}"; DST="${2:?ruta a membego-landing}"
mkdir -p "$DST/src/app" "$DST/src/components" "$DST/src/lib" "$DST/src/modules" "$DST/prisma"
cp -r "$SRC/src/app/(public)/." "$DST/src/app/"        # luego borra i/ y registro/
rm -rf "$DST/src/app/i" "$DST/src/app/registro"
cp "$SRC/src/app/sitemap.ts" "$SRC/src/app/robots.ts" "$DST/src/app/"
cp -r "$SRC/src/components/public" "$DST/src/components/"
cp -r "$SRC/src/components/marketplace" "$DST/src/components/"
cp "$SRC/src/lib/site.ts" "$SRC/src/lib/format.ts" "$SRC/src/lib/prisma.ts" "$DST/src/lib/"
mkdir -p "$DST/src/modules/marketplace" "$DST/src/modules/empresas"
cp "$SRC/src/modules/marketplace/queries.ts" "$SRC/src/modules/marketplace/types.ts" "$DST/src/modules/marketplace/"
cp "$SRC/src/modules/empresas/regional.ts" "$DST/src/modules/empresas/"
cp "$SRC/prisma/schema.prisma" "$DST/prisma/"
echo "Copia hecha. Faltan: root layout, globals.css, package.json, next.config, .env, y los ajustes de imports."
```

---

## Orden y verificación
1. Paso 1 (`@membego/ui`) → Checkpoint 1.
2. Paso 2 (`membego-app` clon) → Checkpoint 2 (crítico: nada se rompe).
3. Paso 3 (`membego-landing`) → Checkpoint 3.
4. Dominios + cookie `.membego.com` → verificar **SSO** en navegador.
5. Cross-links + 301 (Etapa 7).

## Invariante
DB, Prisma, Supabase, auth, membresías, promociones, referidos, Growth, scanner
y reglas **no cambian**. Es organización, dominios y empaquetado de UI.
