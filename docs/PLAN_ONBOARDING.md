# Plan de Onboarding — MembeGo

**Fecha:** 2026-07-08
**Estado:** propuesta (Fase A — plan, sin cambios de código)
**Base:** auditoría del onboarding actual contra la especificación de arquitectura de registro (flujos B2B y B2C, puntos de entrada, verificación/seguridad, estado del onboarding).

Este documento es el paso previo a implementar. No modifica código: define **qué falta**, **cómo construirlo**, **en qué orden**, **con qué riesgo y esfuerzo**, y **qué decisiones de producto** hacen falta antes de arrancar.

---

## 1. Estado actual (resumen de la auditoría)

Lo implementado hoy es un **checklist derivado + formularios sueltos**, no el asistente guiado que pide la especificación. Cobertura estimada:

| Área | Cobertura | Lo más sólido | Lo más débil |
|------|-----------|---------------|--------------|
| Flujo B2B (empresa) | ~47% | Paso 8 (publicar): checklist real + bloqueo de `isPublished` en cliente y servidor | Sin wizard; Paso 4 (config) y Paso 7 (equipo) casi inexistentes |
| Flujo B2C (cliente) | ~45% | Intereses, referidos `/r/`, auto-seguir empresa | Sin login social, sin QR, sin beneficio de bienvenida |
| Verificación/seguridad | Baja | Unicidad, detección de duplicados, anti-fraude por IP | Correo sin verificar, sin OTP, consentimiento no persistido |
| Estado del progreso | Derivado al vuelo | "Retomable" por diseño (refleja datos reales) | Sin paso actual, sin timestamps, sin métricas, falta paso "Equipo" |

**Concepto central no cumplido:** la spec dice *"No quiero que una empresa cree su cuenta y caiga inmediatamente al panel. Primero debe completar un asistente paso a paso."* Hoy la empresa **sí cae al panel** y ve un checklist opcional con enlaces.

---

## 2. Decisiones de arquitectura recomendadas

Antes de estimar, tres decisiones marcan todo el diseño. Doy una recomendación para cada una.

### D1 · Wizard como capa sobre el estado derivado (NO reescribir el checklist)

**Recomendación:** construir el asistente guiado como una **capa de UI de navegación por pasos** que se apoya en el modelo derivado que ya existe (`getOnboardingEmpresa` / `getOnboardingCliente`). El wizard lee ese estado para saber en qué paso retomar y escribe los datos de cada paso en los modelos que ya existen (`Company`, `Plan`, `Promocion`, etc.).

- **Por qué:** el modelo derivado ("el paso está hecho si el dato existe") ya resuelve "abandonar y retomar" de forma robusta y sin estado que sincronizar. Tirarlo para meter una máquina de estados sería un retroceso. El wizard aporta lo que falta: **orden, guía y gating**, sin duplicar la fuente de verdad.
- **Persistencia mínima añadida:** solo lo que NO se puede derivar de los datos:
  - `onboardingSkippedSteps` (p. ej. el usuario eligió "invitar equipo más tarde"),
  - `onboardingCompletedAt` (para dejar de mostrar el wizard y para métricas),
  - los campos de consentimiento/verificación de D3.
- **Ruta:** un grupo `(onboarding)` con rutas `/onboarding/empresa/[paso]` y `/onboarding/cliente/[paso]`, y un guard que, tras el login, redirige al onboarding mientras no esté completo (en vez de caer directo al panel).

### D2 · Gating suave para cliente, gating por publicación para empresa

**Recomendación:**
- **Empresa:** el wizard es el camino natural tras registrarse, pero el **gate duro** sigue siendo la publicación en el marketplace (ya implementado en el Paso 8). Es decir: la empresa puede explorar su panel, pero no aparece públicamente hasta completar el checklist. Esto ya funciona; el wizard solo lo hace explícito y guiado.
- **Cliente:** onboarding **no obligatorio** (la spec lo dice: "No es obligatorio"). El wizard/checklist guía pero nunca bloquea el uso.

### D3 · Verificación de correo con `admin.createUser` + enlace propio (no cambiar a signUp de cliente)

**Recomendación:** mantener la creación server-side con `admin.createUser` (necesaria para setear `app_metadata`: rol, companyId, clienteId) pero cambiar `email_confirm: true` → `false`, y enviar un **enlace de confirmación** generado con `admin.generateLink` a través de Resend (el proyecto ya usa Resend, `src/lib/email.ts`). Añadir una ruta de callback `/auth/confirmar` que valide el token y active la cuenta.

- **Por qué no cambiar a `supabase.auth.signUp` de cliente:** perderíamos el control de `app_metadata` en el momento de creación (rol/tenant), que es la base de toda la autorización. Generar el enlace desde el servidor mantiene ese control.
- **Alternativa más simple (si se acepta menos control de plantilla):** activar "Confirm email" en Supabase Auth y usar sus correos nativos; menos trabajo pero correos con branding de Supabase.

---

## 3. Brechas priorizadas

Formato: **ID · Brecha · Impacto · Archivos afectados · Solución propuesta · Riesgo · Estimación.**
Prioridad: **P0** (bloqueante de producción/cumplimiento) → **P4** (mejora).

### 🔴 P0 — Seguridad y cumplimiento

| ID | Brecha | Impacto | Solución | Riesgo | Est. |
|----|--------|---------|----------|--------|------|
| **O-1** | El correo nunca se verifica (`email_confirm: true` en cliente y empresa) | Cuentas con correos no válidos/ajenos; base de datos sucia; riesgo de suplantación | D3: `email_confirm:false` + `generateLink` + envío por Resend + ruta `/auth/confirmar`; pantalla "revisa tu correo" tras registrar | Medio (toca el flujo de registro completo y el login) | 2-3 d |
| **O-2** | Aceptación de términos no se persiste (empresa valida checkbox pero no lo guarda; cliente ni lo tiene) | Sin prueba auditable de consentimiento (protección de datos) | Campos `termsAcceptedAt`, `termsVersion` en `User`; checkbox obligatorio también en registro de cliente; guardar en la server action | Bajo | 0.5-1 d |
| **O-3** | Sin consentimiento de comunicaciones (marketing) | Sin base legal para enviar marketing; no separable del uso del servicio | Campo `marketingConsent` + `marketingConsentAt` en `User`/`Cliente`; checkbox opcional separado en registro | Bajo | 0.5 d |

### 🟠 P1 — Núcleo del asistente guiado (el corazón de la spec)

| ID | Brecha | Impacto | Solución | Riesgo | Est. |
|----|--------|---------|----------|--------|------|
| **O-4** | No existe wizard B2B; la empresa cae al panel | Es el requisito central de la spec | D1+D2: grupo `(onboarding)`, pasos 1-8 navegables, guard post-login que envía al onboarding hasta completarlo, barra de progreso, "guardar y continuar después" | Medio-alto (nuevo flujo, muchas pantallas, integra piezas existentes) | 4-6 d |
| **O-5** | Falta el paso "Equipo" (invitar) y su ítem en el checklist | Paso 7 de la spec ausente; roles Marketing/Supervisor faltan | Añadir `MARKETING` y `SUPERVISOR` al enum `AppRole` (schema + `src/types`); modelo `Invitacion` (email, rol, token, estado, expira); envío por Resend; página de aceptar invitación; ítem "Equipo" en el checklist (con opción "más tarde") | Medio-alto (nuevo subsistema + toca autorización) | 3-5 d |
| **O-6** | No hay wizard B2C guiado (perfil → intereses → descubrir) | Paso a paso del cliente ausente | D1: pasos cliente navegables reutilizando `InteresesForm`, perfil y descubrimiento; no obligatorio | Medio | 2-3 d |

### 🟡 P2 — Campos y configuración faltantes

| ID | Brecha | Impacto | Solución | Riesgo | Est. |
|----|--------|---------|----------|--------|------|
| **O-7** | Paso 4 (config empresa) casi inexistente: moneda, zona horaria, idioma, formato de fecha, colores corporativos, políticas (cancelación/privacidad/términos) | Sin configuración regional ni de marca; políticas no editables | Campos nuevos en `Company`; formulario del paso 4; aplicar moneda/zona/idioma donde se formatea (hoy hardcodeado `es-DO`/`RD$`) | Medio (el formateo está disperso; ver nota) | 3-4 d |
| **O-8** | Campos de perfil de cliente faltantes: ciudad, idioma, género, preferencias de notificaciones | Paso 2 B2C incompleto; sin segmentación por ciudad/idioma | Campos en `Cliente`; añadir al `ProfileForm` y al paso de perfil | Bajo | 1-2 d |
| **O-9** | Campos de empresa faltantes: razón social, código postal, coordenadas (lat/lng), zona de cobertura | Paso 2-3 B2B incompletos; sin geolocalización real (solo enlace a Maps) | Campos en `Company`; captura de coordenadas (mapa/geocoding) en el paso de ubicación | Medio (geocoding es una integración externa) | 2-3 d |
| **O-10** | Sucursales no cableadas al onboarding | "Preparado para múltiples sucursales" no se ofrece | Ofrecer crear la sucursal principal en el paso de ubicación (el modelo `Sucursal` ya existe) | Bajo | 1 d |

### 🟢 P3 — Puntos de entrada y engagement

| ID | Brecha | Impacto | Solución | Riesgo | Est. |
|----|--------|---------|----------|--------|------|
| **O-11** | El registro desde empresa no mantiene el branding | La spec pide branding de la empresa durante el registro | Layout de registro que cargue logo/banner/colores de la empresa cuando hay `companySlug` | Bajo | 1-2 d |
| **O-12** | Sin promoción especial para el referido al llegar por `/r/` | Paso de "promoción especial" ausente | Mostrar una promo/bienvenida específica en el registro con `ref`; requiere decisión de producto (¿qué promo?) | Bajo (tras decisión de producto) | 1 d |
| **O-13** | Sin beneficio/cupón de bienvenida para nuevos usuarios | Paso 5 B2C ausente | Modelo de cupón de bienvenida o promo automática al completar registro; requiere decisión de producto | Medio | 2-3 d |
| **O-14** | Sin entrada de registro por QR público | Punto de entrada QR ausente | QR público de empresa/promo que abra `/registro/[slug]?promo=…` y vincule al finalizar (distinto del QR de membresía actual) | Medio | 2 d |
| **O-15** | Descubrimiento de empresas no está dentro del flujo (es post-panel) | Paso 4 B2C fuera de lugar | Incluir un paso de descubrimiento en el wizard cliente (reutiliza marketplace/feed) | Bajo | 1 d |

### 🔵 P4 — Login social

| ID | Brecha | Impacto | Solución | Riesgo | Est. |
|----|--------|---------|----------|--------|------|
| **O-16** | Sin login social (Google/Apple; Facebook futuro) | Paso 1 B2C incompleto; más fricción | Configurar proveedores OAuth en Supabase; `signInWithOAuth`; callback; mapear a `app_metadata` (rol CLIENTE); manejar cuentas nuevas vs existentes | Medio-alto (OAuth + creación de perfil desde callback + tenant) | 3-4 d |

---

## 4. Fases sugeridas de implementación

Orden pensado para entregar primero lo que desbloquea producción (cumplimiento) y luego el valor central (wizard), dejando lo opcional al final. Cada fase se valida antes de pasar a la siguiente.

| Fase | Contenido | Por qué primero | Est. |
|------|-----------|-----------------|------|
| **1 · Cumplimiento** | O-1, O-2, O-3 | Sin verificación de correo ni consentimiento persistido no debería ir a producción con pagos | 3-4.5 d |
| **2 · Wizard B2B** | O-4, O-5, O-9, O-10 | El requisito central de la spec + los campos/pasos que el wizard necesita | 10-15 d |
| **3 · Config y wizard B2C** | O-7, O-6, O-8, O-15 | Configuración regional/marca + guía del cliente | 7-10 d |
| **4 · Entradas y engagement** | O-11, O-12, O-13, O-14 | Branding, referidos, bienvenida, QR — mejoran conversión pero no bloquean | 6-8 d |
| **5 · Login social** | O-16 | Mayor esfuerzo/menor urgencia; reduce fricción | 3-4 d |

**Rango total estimado:** ~29-41 días de desarrollo. Es una reconstrucción sustancial del onboarding, no un retoque — conviene entregarla por fases y validar cada una.

---

## 5. Decisiones de producto (RESUELTAS · 2026-07-08)

| # | Decisión | Elección | Impacto en el diseño |
|---|----------|----------|----------------------|
| 1 | Verificación de correo (O-1) | **Resend con marca propia** | `email_confirm:false` + `admin.generateLink` + plantilla propia enviada por Resend + ruta `/auth/confirmar`. Correos con branding MembeGo. |
| 2 | Roles de equipo (O-5) | **Marketing=difusión · Supervisor=operación** | `MARKETING`: promociones, campañas, publicaciones, audiencia, notificaciones. `SUPERVISOR`: dashboard/reportes, clientes, validar pagos, scanner. Ninguno toca config de empresa, planes ni equipo. |
| 3 | Beneficio de bienvenida / referido (O-12, O-13) | **Cupón global de MembeGo** | Modelo de cupón nuevo, mismo beneficio para todo usuario nuevo, independiente de la empresa. **Sub-decisión pendiente: quién financia el descuento (MembeGo o la empresa)** — resolver antes de construir la Fase 4. |
| 4 | Configuración regional (O-7) | **Preferencia por empresa + formateo** | Guardar moneda/zona horaria/idioma/formato de fecha por empresa y aplicarlos al formatear (reemplaza el hardcode `es-DO`/`RD$`). NO se traduce la UI ni se convierten divisas. |
| 5 | Coordenadas (O-9) | **Mapa gratuito con pin (Leaflet + OSM)** | Selector de mapa con pin arrastrable, sin API key ni costo. Nota técnica: añadir el dominio de tiles de OSM a la CSP. |
| 6 | Login social (O-16) | **Solo Google al inicio** | Configurar el proveedor Google en Supabase, `signInWithOAuth`, callback y mapeo a `app_metadata` (rol CLIENTE). Apple/Facebook después, sin rehacer. |

### Sub-decisiones abiertas (no bloquean el arranque)
- **Cupón — financiación (Decisión 3): RESUELTA (implementación).** Se implementó como **beneficio por empresa, opt-in**: cada empresa decide si ofrece descuento de bienvenida (porcentaje o monto) y lo financia ella. Configurable en /admin/planes; aplica una sola vez, en el primer pago de membresía del cliente. Un cupón global de MembeGo puede añadirse después sin rehacer.
- **Google OAuth (Decisión 6):** hará falta una cuenta de Google Cloud con credenciales OAuth configuradas; necesario solo al llegar a la Fase 5.

---

## 6. Riesgos transversales

- **La verificación de correo (O-1) toca el flujo de auth completo** que acabamos de estabilizar (PR #73). Debe hacerse con cuidado y validarse en staging para no reintroducir problemas de sesión.
- **Añadir roles al enum `AppRole` (O-5)** toca `ROUTE_PROTECTION`, `ADMIN_ROLES`, `SCANNER_ROLES` y los guards; hay que mapear permisos con precisión para no abrir accesos indebidos.
- **Multi-moneda/idioma real (O-7)** puede expandirse mucho si se toma en serio (todo el formateo hoy asume `es-DO`/`RD$`). Acotar el alcance en la decisión de producto #4 es clave.
- **Este trabajo es independiente del PR de estabilidad #73**; conviene hacerlo en una rama aparte para no mezclar concerns.
