# Plan de separación física en 2 repos — `membego-landing` · `membego-app`

> Auditoría aprobada. Opción elegida: **2 repos + paquete privado `@membego/ui`
> desde el día 1** (evita duplicar la UI). DB/Auth/Storage/servicios compartidos.
> La Landing **nunca** empaqueta `service_role`.

## 1. Carpetas EXCLUSIVAS de la Landing (`membego-landing`)
- `src/app/(public)/` **excepto** `i/` y `registro/`: Home, empresas,
  empresas/[slug], promociones, promocion/[id], plan/[id], contact, terms,
  privacy, caracteristicas, faq, descargar, blog.
- `src/app/layout.tsx` (con metadata/SEO + JSON-LD), `sitemap.ts`, `robots.ts`.
- `src/components/public/` (menos los flujos que requieren sesión → App).
- `src/lib/site.ts`, `format.ts` (y `cn` vía `@membego/ui`).

## 2. Carpetas EXCLUSIVAS de la App (`membego-app`)
- `src/app/(auth) (admin) (cliente) (empleado) (superadmin) (onboarding)/`.
- `src/app/(public)/i/`, `(public)/registro/`, `src/app/api/`, `auth/`,
  `confirmar/`, `r/[code]/`, `invitacion/[token]/`.
- `src/proxy.ts` (middleware de auth — **solo App**).
- `src/components/{admin,cliente,scanner,superadmin,membresia,qr,charts,auth,layout,growth,onboarding}`.
- `src/modules/*` (todos) y casi todo `src/lib/*` (auth, supabase, prisma,
  pagos, referidos, receipts, rule-engine, etc.).

## 3. Compartido (vía `@membego/ui`, no duplicado)
- `src/components/ui/*` (27) + `cn` → **`@membego/ui`** (paquete privado).
- `ThemeProvider`, `ThemeToggle`, `EstadoBadge`, `PanelError`, `PanelNotFound`.
- `src/components/marketplace/{PromotionDetail,CompanyProfile}` → `@membego/ui`
  (o paquete de feature) porque los usan Landing y App.
- `src/lib/prisma.ts` + `prisma/schema.prisma` + `marketplace/queries.ts`
  (lectura) → ambos leen la misma DB.
- Tokens `globals.css` → compartir vía el paquete o copiar.

## 4. Rutas que van a App (seguridad/flujo)
`/registro*`, `/registro-empresa` (crea empresa + `service_role`), `/i/[code]`,
`/r/[code]`, `FollowButton`/`social/actions` (requieren sesión). La Landing
enlaza a estos con `appUrlFor(...)`.

## 5. Dependencias
- **Landing elimina:** `@supabase/*`¹, `html5-qrcode`, `qrcode`, `leaflet`,
  `recharts`, `lru-cache`, `vaul`, `input-otp`, `embla-carousel-react`,
  `react-day-picker`, `react-resizable-panels`, `@hookform/resolvers`,
  `react-hook-form`, `@sentry/nextjs`², `uuid`, `date-fns`³. (`@tanstack/react-table`
  y `cmdk` llegan solo dentro de `@membego/ui`.)
- **Landing conserva:** `next`, `react(-dom)`, `tailwindcss@4`+`@tailwindcss/postcss`,
  `lucide-react`, `@membego/ui`, `@prisma/client`+`prisma` (lectura), `sharp`,
  `next-themes`, `sonner`.
- **App:** conserva todo.
- ¹ si `getPromotionDetail` se limita a promos públicas (sin `getUser`).
- ² Sentry mínimo/ausente en Landing. ³ si no queda ningún formulario.

## 6. Config por proyecto
| | Landing | App |
|---|---|---|
| Middleware | ❌ | ✅ `proxy.ts` |
| next.config | images(Supabase), CSP sin Supabase, redirect empresa→empresas, `transpilePackages:['@membego/ui']`, sin Sentry | Completo + Sentry |
| Env | `DATABASE_URL/DIRECT_URL` (lectura), `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_ORIGIN`. **Sin** service_role/Resend/CRON | Todo + `NEXT_PUBLIC_COOKIE_DOMAIN=.membego.com` |
| Layouts | root(SEO/JSON-LD)+`(public)` | root+grupos con `AppShell` |
| Dominio | membego.com | app.membego.com |

## 7. Orden
1. `membego-app` = **clon del repo actual** (todo funciona); adopta `@membego/ui`
   de forma incremental; quita marketing público.
2. `@membego/ui` como repo/paquete privado (fuente única de UI).
3. `membego-landing` **desde cero** con §1+§3 y deps podadas (§5).
4. Cookies `.membego.com` + envs; verificar SSO en navegador.
5. Cross-links `appUrlFor`/`landingUrlFor` + 301 (Etapa 7).

Detalle ejecutable en `docs/KIT_MIGRACION_OPCION_2.md`.
