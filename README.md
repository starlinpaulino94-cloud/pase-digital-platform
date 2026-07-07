# MembeGo

Plataforma inteligente para la gestión de membresías, planes, suscripciones, beneficios y clubes empresariales con validación mediante QR.

Los clientes se registran, activan su membresía y reciben un código QR único. Los empleados escanean ese QR en el establecimiento para validar y registrar el uso de la membresía.

> **Nota:** Este es un sistema interno de gestión, no un producto SaaS público.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Base de datos | Supabase PostgreSQL |
| ORM | Prisma 6 |
| Auth | Supabase Auth (cookies SSR + middleware) |
| Acciones | Server Actions (Next.js) |
| QR | `qrcode` (generación) + `html5-qrcode` (escaneo por cámara) |
| Runtime | Bun |
| Deploy | Vercel (serverless) |

---

## Arquitectura

El proyecto usa **App Router con route groups** para separar las áreas por audiencia:

```
src/app/
├── (public)/                 # Landing pública + listado de empresas
│   ├── page.tsx              # Hero + planes
│   └── empresas/page.tsx
├── (auth)/                   # Login, registro, recuperar
│   ├── login/page.tsx
│   ├── recuperar/page.tsx
│   └── registro/[companySlug]/page.tsx
├── (cliente)/                # Panel del cliente (rol CLIENTE)
│   ├── cliente/dashboard/    # Mi panel + QR
│   ├── cliente/membresia/
│   ├── cliente/historial/
│   └── cliente/perfil/
├── (admin)/                  # Panel de empresa (rol ADMIN_EMPRESA)
│   └── admin/{dashboard,clientes,membresias,planes,empleados,reportes}/
├── (empleado)/               # Escáner QR (rol EMPLEADO)
│   └── empleado/scanner/
├── (superadmin)/             # Panel global (rol SUPERADMIN)
│   └── superadmin/{dashboard,empresas,reportes}/
├── api/health/               # Health check
├── layout.tsx                # Layout raíz
├── error.tsx                 # Página de error
└── not-found.tsx             # 404
```

Cada route group tiene su propio `layout.tsx` que aplica el guard de rol correspondiente (`requireRole`) y renderiza la navegación (`AppNav`).

### Middleware (`middleware.ts`)

Un middleware protege todas las rutas:

- Si no hay sesión → redirige a `/login?redirect=...`
- Si el rol no está permitido para esa ruta → redirige al home del rol
- Usuarios logueados que visitan `/login` → redirige a su home

El rol se lee de `user.app_metadata.role` (seteado por el seed o por el registro).

### Server Actions (`src/modules/`)

Toda la mutación de datos se hace con Server Actions, agrupadas por dominio:

```
src/modules/
├── auth/         # logout
├── registro/     # registrarCliente (crea user en Supabase + en BD)
├── admin/        # confirmarPago, renovarMembresia, cancelarMembresia, crearMembresia, empleados
├── cliente/      # actualizarPerfil
├── membresia/    # (consultas/acciones de membresía)
└── visitas/      # buscarPorToken (escáner), confirmarVisita
```

Las consultas (queries) están en `queries.ts` dentro de cada módulo y usan Prisma directamente.

---

## Modelo de datos

```
User         → Usuario de Supabase Auth + tabla users (rol, companyId)
Company      → Empresa participante (slug, type, planes)
Plan         → Plan de membresía (precio, lavadosIncluidos, beneficios)
Cliente      → Perfil de cliente por empresa (supabaseId, companyId)
Vehiculo     → Vehículo del cliente (carwash)
Membership   → Membresía activa de un cliente a un plan (estado, lavadosRestantes)
QrToken      → QR único por cliente (membresía digital)
Visit        → Registro de uso (visita al establecimiento)
```

### Roles (`AppRole`)

| Rol | Acceso |
|-----|--------|
| `SUPERADMIN` | Acceso total: empresas, reportes globales, configuración |
| `ADMIN_EMPRESA` | Su empresa: clientes, membresías, planes, empleados, reportes |
| `EMPLEADO` | Escáner QR y registro de usos |
| `CLIENTE` | Su membresía, historial, perfil, código QR |

---

## Requisitos previos

- [Bun](https://bun.sh) `>= 1.0`
- Un proyecto de [Supabase](https://supabase.com) (gratis para empezar)

---

## Instalación

```bash
# 1. Clonar
git clone https://github.com/starlinpaulino94-cloud/pase-digital-platform.git
cd pase-digital-platform

# 2. Instalar dependencias
bun install

# 3. Configurar variables de entorno
cp .env.example .env
# Completa .env con tus claves de Supabase (ver abajo)

# 4. Generar cliente Prisma
bun run db:generate

# 5. Crear las tablas en Supabase (primera vez)
bun run db:push

# 6. Cargar datos de prueba (empresas, planes, usuarios)
bun run db:seed

# 7. Iniciar el servidor
bun run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Variables de entorno

Copia `.env.example` a `.env` y completa con los valores de tu proyecto Supabase
(**Settings → API** y **Settings → Database**):

```env
# Supabase Auth (públicas en el frontend)
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon/pública

# Supabase Admin (PRIVADA — solo backend)
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # service_role

# Postgres (Prisma)
# Transaction pooler (pgBouncer) — para la app
DATABASE_URL="postgresql://postgres.XXXXX:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
# Conexión directa — solo para migraciones
DIRECT_URL="postgresql://postgres.XXXXX:PASSWORD@aws-0-REGION.supabase.com:5432/postgres"

# Dominio y correo (MembeGo)
NEXT_PUBLIC_APP_URL=https://membego.com
EMAIL_FROM="MembeGo <no-reply@membego.com>"
RESEND_API_KEY=re_...   # opcional; sin ella, el correo queda deshabilitado
```

Hay más variables opcionales (Sentry, endpoints de bootstrap). Consulta
[`.env.example`](.env.example) para la lista completa y documentada.

> ⚠️ **Nunca subas `.env` a Git.** Ya está en `.gitignore`.

---

## Cuentas de prueba

Disponibles tras ejecutar `bun run db:seed`:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Superadmin | `superadmin@membego.com` | `admin123` |
| Admin Carwash | `admin.cartown@membego.com` | `admin123` |
| Admin Restaurante | `admin.tonis@membego.com` | `admin123` |
| Empleado Carwash | `empleado.cartown@membego.com` | `admin123` |
| Cliente | `cliente@membego.com` | `cliente123` |

El seed crea los usuarios en **Supabase Auth** (con `app_metadata.role`) y en la tabla `users`, para que el login funcione de inmediato.

---

## Comandos

```bash
bun run dev                # Desarrollo en http://localhost:3000
bun run build              # Build de producción
bun run start              # Servir el build
bun run lint               # ESLint

bun run db:generate        # Generar cliente Prisma
bun run db:push            # Sincronizar schema (dev / primera vez)
bun run db:migrate         # Crear + aplicar migración (dev)
bun run db:migrate:deploy  # Aplicar migraciones pendientes (prod)
bun run db:reset           # Resetear BD (¡destruye datos!)
bun run db:seed            # Cargar datos iniciales + usuarios de prueba
```

---

## Despliegue en Vercel

1. **Conecta el repositorio** en [vercel.com](https://vercel.com).
2. **Variables de entorno** (Settings → Environment Variables): agrega las de `.env` (Supabase, Postgres, `NEXT_PUBLIC_APP_URL`, correo y, si aplican, Sentry).
3. **Build**: Vercel detecta Next.js automáticamente. El `postinstall` corre `prisma generate`.
4. **Migraciones**: Vercel no las corre. Antes de cada release con cambios de schema, ejecuta desde tu máquina:
   ```bash
   bun run db:migrate:deploy
   # o si usas push directo:
   bun run db:push
   ```
5. **Seed inicial** (solo la primera vez, apuntando `.env` a producción):
   ```bash
   bun run db:seed
   ```

---

## Flujo del cliente

1. Entra a la landing → elige una empresa
2. Presiona **Registrarme** → completa sus datos (+ vehículo si es carwash)
3. Recibe su código QR de membresía
4. Visita el establecimiento y presenta el QR
5. El empleado escanea → el sistema valida la membresía
6. El empleado confirma el uso → se descuenta un lavado/consumo
7. El cliente ve su historial y saldo restante en su panel

---

## Seguridad

- **Auth**: Supabase Auth con cookies httpOnly (vía `@supabase/ssr`)
- **Middleware**: protege rutas por rol y redirige si no hay permiso
- **Aislamiento por empresa**: las queries filtran por `companyId` del usuario (excepto superadmin)
- **QR**: contiene solo un UUID anónimo, nunca datos personales
- **Server Actions**: validan el rol y la pertenencia antes de mutar
- `.env` nunca se sube a Git

---

## Estructura de carpetas

```
membego-platform/
├── prisma/
│   ├── schema.prisma         # 8 modelos + 2 enums
│   └── seed.ts               # Datos iniciales + usuarios de prueba
├── public/                   # Assets estáticos
└── src/
    ├── app/                  # App Router con route groups
    │   ├── (public)/
    │   ├── (auth)/
    │   ├── (cliente)/
    │   ├── (admin)/
    │   ├── (empleado)/
    │   └── (superadmin)/
    ├── components/
    │   ├── admin/            # Formularios de admin (membresías, empleados)
    │   ├── auth/             # LoginForm, RegisterForm
    │   ├── cliente/          # PerfilForm
    │   ├── layout/           # AppNav
    │   ├── qr/               # QRDisplay
    │   ├── scanner/          # QRScanner, ConfirmVisit
    │   └── ui/               # shadcn/ui
    ├── lib/
    │   ├── auth/             # guards.ts (requireRole) + index.ts (getUser)
    │   ├── supabase/         # server.ts, client.ts, admin.ts
    │   ├── data/             # companies.ts (datos seed)
    │   ├── prisma.ts         # Singleton PrismaClient
    │   ├── env.ts            # Validación de env vars
    │   └── utils.ts          # cn() y helpers
    ├── modules/              # Server Actions por dominio
    │   ├── auth/
    │   ├── registro/
    │   ├── admin/
    │   ├── cliente/
    │   ├── membresia/
    │   └── visitas/
    ├── types/                # Tipos compartidos (AppRole, SessionUser, ...)
    └── proxy.ts              # Middleware (auth + routing por rol)
```
