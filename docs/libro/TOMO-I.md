# TOMO I

# LIBRO OFICIAL DEL PROYECTO MEMBEGO

**Versión 1.0 · Julio 2026**

*Documentación oficial y fuente única de verdad (Single Source of Truth) de la
plataforma MembeGo. Este libro permite a cualquier equipo de ingeniería — humano
o asistido por IA — comprender, mantener y reconstruir la plataforma completa
sin ninguna otra fuente de información.*

---

## Sobre este libro

Este documento fue escrito por el equipo del proyecto con el estándar de las
guías de ingeniería de Stripe, Shopify y Amazon: cada capítulo toma decisiones,
las justifica y las declara **normativas**. Donde el lector encuentre la palabra
**DEBE**, se trata de una regla de cumplimiento obligatorio; **PUEDE** indica
una opción permitida; **FUTURO** marca diseño aprobado aún no construido.

El libro se publica por tomos:

| Tomo | Contenido | Estado |
| --- | --- | --- |
| **I (este)** | El producto, el negocio y la arquitectura completa | Publicado |
| **II** | Los módulos, pantalla por pantalla: flujos, estados, validaciones, mensajes y errores | Por publicar |
| **III** | El sistema de diseño, la experiencia de usuario y el sistema de movimiento | Por publicar |
| **IV** | Calidad (QA), operación, seguridad aplicada y roadmap hasta producción masiva | Por publicar |

Los documentos técnicos por sistema (`docs/MDS.md`, `docs/MUK.md`,
`docs/MMS.md`, `docs/MEE.md`, `docs/CJO.md`, `docs/CX2.md`,
`docs/MOBILE_FIRST.md`, `docs/DXS.md`, `docs/CAJA_POS.md`,
`docs/SHARE_ENGINE.md`, `docs/MATURITY.md`, `docs/ENTERPRISE-AUDIT.md`) son
apéndices vivos de este libro: el libro define el *qué* y el *porqué*; los
apéndices amplían el *cómo* de cada sistema.

---

## Índice del Tomo I

- **Parte 1 — El producto**
  - Capítulo 1 · Historia y contexto
  - Capítulo 2 · El problema y la oportunidad
  - Capítulo 3 · Misión, visión y objetivos
  - Capítulo 4 · Modelo de negocio
  - Capítulo 5 · Actores y roles
  - Capítulo 6 · Mapa del ecosistema
- **Parte 2 — Arquitectura**
  - Capítulo 7 · Filosofía arquitectónica
  - Capítulo 8 · Arquitectura técnica y stack
  - Capítulo 9 · Arquitectura lógica: dominios y motores
  - Capítulo 10 · Arquitectura física y cloud
  - Capítulo 11 · Multi-tenant: aislamiento entre empresas
  - Capítulo 12 · Autenticación y autorización
  - Capítulo 13 · Arquitectura de datos
  - Capítulo 14 · Caché y rendimiento
  - Capítulo 15 · Eventos, automatización y colas
  - Capítulo 16 · Observabilidad, backups y recuperación
  - Capítulo 17 · Arquitectura de seguridad
  - Capítulo 18 · SEO, compartir social y dominios
  - Capítulo 19 · Móvil, PWA y arquitectura futura
  - Capítulo 20 · Escalabilidad: de mil a un millón de usuarios

---

# PARTE 1 — EL PRODUCTO

## Capítulo 1 · Historia y contexto

MembeGo nace de una observación simple hecha en negocios reales de República
Dominicana: los comercios de servicios recurrentes — car wash, barberías,
gimnasios, salones, restaurantes — fidelizan a sus clientes con papel, sellos y
memoria. El cliente pierde la tarjeta; el negocio pierde el historial; nadie
puede medir nada. Al mismo tiempo, las plataformas globales de cupones tratan
al comercio local como un canal de descuentos agresivos, no como una marca con
comunidad propia.

La primera versión del proyecto (nombre interno `pase-digital-platform`) se
construyó para un caso concreto: membresías de car wash con control de usos por
QR. Sobre ese núcleo se generalizó todo lo demás: el sistema de promociones, el
marketplace multi-empresa, los motores de reglas y recompensas, el punto de
venta con caja, la facturación y el ecosistema de crecimiento (referidos,
campañas de invitación, gamificación). La plataforma resultante es **agnóstica
al rubro**: cualquier negocio con clientes recurrentes puede operar en ella.

### 1.1 Principios fundacionales

1. **El QR es el puente entre el mundo digital y el mostrador.** Toda promesa
   hecha en la app se cumple en el local escaneando un código de un solo uso.
2. **Nada se borra.** Transacciones, auditoría, facturas e historiales son
   permanentes; los cambios son transiciones de estado.
3. **El negocio configura, no programa.** Campañas, promociones, plantillas,
   automatizaciones y experiencias se administran desde el panel.
4. **Premium por defecto.** La experiencia debe sentirse como Apple Wallet +
   Revolut + Temu, nunca como un sistema administrativo.
5. **Un solo lenguaje visual** en landing, app, panel y futuro móvil.

## Capítulo 2 · El problema y la oportunidad

### 2.1 El problema del comercio local

- **Fidelización analógica**: tarjetas de cartón, sellos falsificables, cero
  datos. El negocio no sabe quién es su cliente frecuente ni cuándo dejó de ir.
- **Marketing sin canal propio**: el negocio depende de repartir volantes o
  pagar publicidad; no tiene una base de clientes contactable ni segmentable.
- **Cobros informales**: membresías cobradas en efectivo sin comprobante, sin
  arqueo de caja, sin números de factura, sin historial auditable.
- **Crecimiento sin palanca**: el boca a boca existe pero no se instrumenta;
  nadie premia sistemáticamente al cliente que trae a otro.

### 2.2 El problema del cliente final

- Lleva decenas de tarjetas y no recuerda cuántos usos le quedan.
- Se entera tarde de las promociones (o nunca).
- No tiene prueba portable de su membresía ni de sus beneficios.

### 2.3 La oportunidad

Una plataforma B2B2C donde el negocio obtiene un CRM de fidelización con motor
de crecimiento incluido, y el cliente obtiene una *wallet* de membresías y
beneficios con un QR universal. El efecto de red es doble: cada negocio trae a
sus clientes; cada cliente descubre nuevos negocios en el marketplace.

## Capítulo 3 · Misión, visión y objetivos

**Misión.** Darle a cualquier negocio local el poder de fidelización y
crecimiento de una gran cadena, y al cliente una sola app donde viven todas sus
membresías y beneficios.

**Visión.** Ser la plataforma de referencia de membresías, promociones y
beneficios de Latinoamérica: el lugar donde "tener membresía" significa
mostrar un QR de MembeGo.

**Objetivos de producto (normativos).**

| Objetivo | Métrica rectora |
| --- | --- |
| Activación del cliente | % de registrados con primer canje ≤ 7 días |
| Retención | D7 / D30, visitas por mes |
| Conversión comercial | % de clientes con membresía de pago |
| Crecimiento viral | K-factor de invitaciones (invitados→registrados→activados) |
| Salud del negocio | ventas por caja/sucursal, % renovaciones |

## Capítulo 4 · Modelo de negocio

MembeGo es **multi-tenant B2B2C**:

- **Tenant (empresa)**: cada negocio opera aislado con sus sucursales,
  empleados, clientes, planes, promociones, campañas, caja y facturación.
- **Cliente final**: una persona puede relacionarse con varias empresas; su
  cuenta es única en la plataforma y su wallet agrega todas sus membresías.
- **La plataforma** (superadmin) administra empresas, usuarios globales,
  planes globales y reportes de todo el sistema.

**Fuentes de ingreso previstas**: suscripción SaaS por empresa (por plan de
funcionalidades), y a futuro comisión sobre ventas del marketplace premium y
servicios de crecimiento (campañas destacadas). El modelo de cobro al cliente
final pertenece a cada empresa (sus planes y promociones); MembeGo provee la
infraestructura de cobro presencial (caja) y por transferencia con
comprobante.

## Capítulo 5 · Actores y roles

El sistema define un conjunto cerrado de roles (RBAC). Cada rol tiene un
espacio de trabajo propio y un "home" al que se le redirige por defecto.

| Rol | Espacio | Alcance |
| --- | --- | --- |
| `SUPERADMIN` | Panel de plataforma + panel de empresa completo | Toda la plataforma |
| `ADMINISTRADOR` / `ADMIN_EMPRESA` | Panel de empresa | Su empresa |
| `GERENTE` | Panel de empresa | Su empresa |
| `CAJERO` | Panel de empresa (operación) | Su empresa |
| `MARKETING` | Panel de empresa **acotado por secciones** | Solo secciones de marketing |
| `SUPERVISOR` | Panel de empresa **acotado por secciones** | Solo sus secciones |
| `EMPLEADO` / `RECEPCION` | Portal del empleado (escáner + caja) | Su empresa |
| `CLIENTE` | Aplicación del cliente | Sus datos y las empresas donde participa |

Reglas normativas:

- La pertenencia a empresa viaja en los metadatos del usuario autenticado
  (`companyId`) y **DEBE** derivarse siempre de la sesión, jamás de un
  parámetro del cliente.
- Los roles acotados (`MARKETING`, `SUPERVISOR`) pasan por un mapa
  ruta→sección y un verificador de acceso por sección; la navegación se
  filtra con la misma función que protege las rutas (una sola fuente).
- Los roles con capacidad de escanear/cobrar (`SCANNER_ROLES`) son la unión
  de los roles de empresa operativos y se definen en un único lugar.

## Capítulo 6 · Mapa del ecosistema

MembeGo se compone de seis superficies sobre una sola base de código:

1. **Landing pública** (identidad azul + blanco): marketing de la plataforma,
   características, blog, FAQ, registro de empresas y de clientes.
2. **Marketplace público**: directorio de empresas y promociones con perfiles
   públicos tipo mini-web (portada, beneficios, planes, reseñas, anclas),
   optimizado para SEO y para compartir en redes con tarjetas ricas.
3. **Aplicación del cliente** (identidad esmeralda, mobile first): Inicio
   inteligente, wallet de membresías, beneficios, promociones, Invita y Gana,
   ruleta, pagos, historial, perfil. Navegación inferior con **dock central
   "Mi QR"**.
4. **Panel de empresa**: CRM (clientes, membresías), fidelización (planes,
   promociones, referidos, invitaciones, gamificación), marketing (banners,
   campañas, publicaciones, notificaciones, automatizaciones), operaciones
   (escáner, pagos, facturas, sucursales), análisis, soporte y configuración.
5. **Portal del empleado**: escáner de QR (cámara + lector físico HID) y caja
   (POS) con apertura/cierre de turno y cobro de órdenes.
6. **Panel superadmin**: empresas, usuarios, planes globales, membresías
   globales, operaciones y reportes de plataforma.

Todas comparten el **Membego Design System (MDS)**, el **UI Kit (MUK)**, el
**Motion System (MMS)** y el **Experience Engine (MEE)** — documentados en el
Tomo III y sus apéndices.

---

# PARTE 2 — ARQUITECTURA

## Capítulo 7 · Filosofía arquitectónica

MembeGo es un **monolito modular con motores de dominio puros**. Esta decisión
es deliberada y normativa para los próximos años:

- **Monolito** porque un equipo pequeño entrega más rápido con un solo
  despliegue, una sola base de datos y cero latencia inter-servicios.
- **Modular** porque cada dominio vive en su módulo con sus consultas y
  acciones, y los motores transversales (reglas, transacciones, recompensas,
  automatización, experiencia, compartir) son **lógica pura sin
  infraestructura**: reciben datos, devuelven decisiones, y se prueban de
  forma determinista.
- **Puertos y adaptadores**: los motores declaran interfaces (ports) y la capa
  de infraestructura las implementa con Prisma. Extraer un motor a servicio
  propio en el futuro es cortar por la línea punteada ya dibujada.

Principios SOLID aplicados a nivel de módulo: responsabilidad única por
módulo; motores abiertos a extensión por catálogo/plantillas (no por
modificación); dependencia hacia interfaces en los motores. El acoplamiento
entre módulos se limita a: (a) importar tipos, (b) invocar funciones de
dominio publicadas, (c) emitir/escuchar eventos del bus interno.

**Puntos únicos de activación.** Toda operación que otorga valor (activar una
membresía, activar una compra de promoción, aplicar un canje) existe **una sola
vez** en el código y no se expone como endpoint: las server actions la invocan
tras validar. Esto garantiza que ningún camino alternativo pueda crear valor
sin pasar por las mismas reglas.

## Capítulo 8 · Arquitectura técnica y stack

| Capa | Tecnología | Justificación |
| --- | --- | --- |
| Framework web | **Next.js (App Router, React Server Components)** | render en servidor por defecto, streaming, server actions tipadas, un solo deploy |
| Lenguaje | **TypeScript estricto** en todo el código | contratos verificables; `tsc --noEmit` es gate de calidad |
| UI | React 19 + Tailwind CSS v4 + Radix UI + cva | tokens CSS como fuente de verdad; accesibilidad de Radix |
| Datos | **PostgreSQL (Supabase)** + **Prisma ORM** | relacional para dinero y estados; tipos generados |
| Autenticación | **Supabase Auth** (JWT en cookies httpOnly) | gestionada, con SSR y rotación de tokens |
| Archivos | Supabase Storage + CDN | logos, banners, comprobantes, adjuntos |
| Hosting | **Vercel** (serverless + edge) | autoescalado, CDN global, previews por PR |
| Observabilidad | Sentry + endpoint `/api/health` | errores con contexto; sonda de vida |
| Rate limiting | Upstash Redis (REST) con *fallback* local | límite global entre instancias; sin dependencia dura |
| Monorepo UI | `packages/ui` (`@membego/ui`) | design system compartido con la futura app móvil |

**Convenciones normativas del stack:**

- Server Components por defecto; `'use client'` únicamente con interacción.
- Las páginas de paneles son dinámicas (`force-dynamic`); las públicas usan
  ISR/caché etiquetada (Capítulo 14).
- Las mutaciones son **Server Actions**; no existe API REST interna. La API
  pública versionada es FUTURO (Capítulo 19) y se montará como capa delgada
  sobre los mismos motores.
- Los formularios de búsqueda usan `Form` (GET) para URLs compartibles.
- Migraciones de BD: SQL **idempotente** en `scripts/` espejado en
  `prisma/migrations/`, ejecutado manualmente en Supabase (Capítulo 13.6).

## Capítulo 9 · Arquitectura lógica: dominios y motores

### 9.1 Módulos de dominio

Cada módulo vive bajo `src/modules/<dominio>` con dos archivos canónicos:
`queries.ts` (lecturas) y `actions.ts` (mutaciones con guard). Dominios
principales: `auth`, `registro`, `cliente`, `membresia`, `promociones`,
`visitas` (canjes/escáner), `caja`, `transacciones` (facturación),
`referidos`, `invitaciones` (campañas), `growth` (puntos/niveles/retos),
`gamificacion` (ruleta), `social` (seguir empresas, feed, publicaciones),
`marketplace` (lecturas públicas + capa cacheada), `engagement` (momentos,
campañas vivas, prueba social), `experience` (motor de priorización),
`notificaciones`, `empresas`, `admin`, `superadmin`, `scanner`.

### 9.2 Los motores (visión ejecutiva)

| Motor | Responsabilidad | Naturaleza |
| --- | --- | --- |
| **Rule Engine** | evaluar condiciones tipadas en árbol (grupos AND/OR) sobre un diccionario de datos | puro, por catálogo |
| **Action Engine** | ejecutar acciones de negocio configuradas por datos (otorgar beneficio, notificar…) | puro + sink real |
| **Validation/QR** | tokens QR de un solo uso con regeneración; transiciones guardadas | dominio + BD |
| **Transaction & Receipt** | transacción inmutable con código global único, número de ticket por empresa, snapshot congelado y recibos auditados (original/copia) | dominio + BD |
| **Membership Engine** | planes, instancias, límites de uso, renovación/upgrade | puro + adaptador |
| **Benefit Engine** | beneficios, otorgamientos, economía y selección estratégica | puro + adaptador |
| **Promotion Framework** | ciclo de vida completo de promociones con restricciones y auditoría | puro + adaptador |
| **Referral Engine** | programas de referidos: estados, hitos, recompensas, anti-fraude | puro + adaptador |
| **Automation Engine** | automatizaciones disparadas por eventos con biblioteca de *playbooks* por objetivo (captación, onboarding, primera compra, frecuencia, recuperación, membresías, referidos, campañas, gamificación, decisiones) | puro + runner |
| **Decision Engine** | elegir la mejor opción entre candidatos con proveedores de estrategia | puro |
| **Experience Engine (MEE)** | decidir qué experiencia protagoniza cada pantalla y con qué urgencia (escalera: por vencer > listo > pago pendiente > referidos) | puro |
| **Share Engine** | tarjetas ricas para WhatsApp/redes: metadatos OG, imagen directa de CDN, camino rápido para robots, versionado anti-caché | web |

Regla normativa: **la UI nunca implementa reglas de negocio**; consume motores.
Y los motores **nunca** importan React ni Next.

### 9.3 Flujo canónico de valor (ejemplo integrador)

*Un cliente canjea un beneficio en el local:*

1. El cliente muestra su QR (dock central → detalle de membresía/beneficio).
2. El empleado escanea (cámara o lector HID; una sola lectura, captura global).
3. `buscarPorToken` valida el token (un solo uso, empresa correcta, estado de
   membresía, usos restantes) y devuelve un diagnóstico tipado con código de
   error específico si algo falla.
4. La confirmación ejecuta el **punto único de activación**, que dentro de una
   transacción: consume el uso, marca el token, genera el siguiente token si
   corresponde, crea la **Transaction** con snapshot congelado (incluye el
   **nombre** del empleado, nunca su correo), registra auditoría con IP y
   dispositivo, y emite el evento de dominio.
5. El recibo se imprime desde el snapshot (58/80 mm o Carta/A4); toda
   reimpresión queda auditada como COPIA #N.
6. El Experience Engine del cliente celebrará el canje y el motor de
   crecimiento contará la visita para rachas y retos (FUTURO inmediato del
   roadmap CJO).

## Capítulo 10 · Arquitectura física y cloud

- **Vercel** ejecuta la aplicación como funciones serverless (Node) con CDN
  global para estáticos e imágenes optimizadas. Cada push a `main` despliega
  producción; cada PR genera un preview aislado.
- **Supabase** provee Postgres gestionado (con **pgbouncer** para el pool de
  conexiones y `directUrl` para migraciones), Auth y Storage con CDN.
- **Regla de co-locación**: las funciones de Vercel y la base de datos DEBEN
  residir en la misma región para minimizar la latencia por consulta.
- **Dominio**: `membego.com` (DNS en GoDaddy apuntando a Vercel). Estrategia
  de subdominios reservada (Capítulo 18.4).
- El middleware corre en el runtime Edge; valida sesión con **camino rápido
  local** (Capítulo 12.3).

**Entornos**: producción (rama `main`), previews por PR (misma BD que
producción por decisión operativa actual — FUTURO: proyecto Supabase de
staging), desarrollo local con variables en `.env`.

## Capítulo 11 · Multi-tenant: aislamiento entre empresas

El aislamiento es **lógico por columna `companyId`** presente en toda entidad
de tenant, con estas reglas normativas verificadas por auditoría:

1. El `companyId` efectivo **siempre** se deriva de la sesión del usuario
   autenticado; ningún parámetro de cliente puede seleccionarlo.
2. Toda consulta de lectura o escritura de datos de tenant **DEBE** filtrar
   por ese `companyId` (los módulos de dinero — caja, facturas, escáner,
   membresías — cumplen al 100%).
3. Los clientes finales son globales pero su participación por empresa
   (membresías, compras, seguimientos) está ligada a cada tenant; las vistas
   del cliente cruzan empresas únicamente con datos propios del cliente.
4. El superadmin es el único rol con lecturas cross-tenant, en su panel.

**Defensa en profundidad (FUTURO aprobado, prioridad alta del plan
Enterprise):** activar RLS en Postgres o introducir un envoltorio de acceso a
datos con tenant obligatorio, de modo que un descuido humano en una consulta
futura no pueda cruzar empresas. Hasta entonces, el checklist de revisión de
código exige verificar el filtro de tenant en toda consulta nueva.

## Capítulo 12 · Autenticación y autorización

### 12.1 Autenticación

- Supabase Auth emite JWT que viajan en **cookies httpOnly** gestionadas por
  el SDK SSR; hay login con correo/contraseña y con Google (con onboarding
  que crea/vincula el cliente y aplica atribución de campañas).
- El registro de clientes es mínimo (el perfil se completa después mediante
  un checklist progresivo) y está protegido por rate limiting.
- Flujos auxiliares: confirmación, recuperación de contraseña, verificación
  de correo.

### 12.2 Autorización (RBAC + secciones)

- Los metadatos del token (`role`, `companyId`, `dbUserId`, `clienteId`)
  alimentan los guards de servidor: `requireRole(...)` en páginas y acciones
  del espacio correspondiente, `requireAdminUser`/`requireSection` en el
  panel, y un guard de staff para escáner/caja.
- **Fail-closed**: sin sesión válida o sin rol suficiente, la acción devuelve
  error y la página redirige. El 100% de las server actions está protegido
  (verificado en la auditoría de madurez).

### 12.3 Middleware con camino rápido (rendimiento)

El middleware protege rutas y **refresca/rota tokens**, pero no es el punto de
enforcement. Regla normativa de rendimiento: mientras el token esté fresco
(faltan >5 minutos para expirar) la sesión se decodifica **localmente sin
viaje de red**; solo cerca de expirar se valida contra Supabase (que además
refresca las cookies — algo que solo el middleware puede persistir). La
autorización real ocurre siempre en la capa de datos (12.2), por lo que una
cookie falsificada solo lograría un redirect equivocado hacia una página que
la rechazará.

## Capítulo 13 · Arquitectura de datos

### 13.1 Panorama

El esquema Prisma contiene **79 modelos** y **160 índices** organizados por
dominios: identidad (User, Cliente, Company, Sucursal), membresías (planes,
membresías, contadores de uso), promociones y compras (ProductoCompra y sus
transiciones), QR (tokens de un solo uso), transacciones y recibos, caja
(sesiones de caja con arqueo), social (seguimientos, publicaciones, reseñas),
crecimiento (eventos de referido, puntos, niveles, logros, campañas de
invitación), automatización (automations, runs, events), notificaciones,
auditoría, y los subsistemas de motores (benefits, referral programs,
transformaciones, diccionario de datos).

### 13.2 Reglas de oro del modelo

1. **Dinero en `Decimal`**, nunca en flotantes; formateo regional en el borde.
2. **Identificadores de negocio**: la transacción lleva un código global único
   (`TX-AAAAMMDD-NNNNNN`) y un número de ticket **secuencial por empresa**
   (`TCK-…`) generado con un contador atómico por upsert — sin duplicados
   bajo concurrencia.
3. **Snapshots congelados**: todo documento comercial (factura/recibo) guarda
   en JSON los datos exactos del momento (cliente, empleado por **nombre**,
   sucursal, líneas, totales, método) y jamás se recalcula.
4. **Insert-only** para auditoría e impresiones; los borrados están
   prohibidos en dominios de valor — solo transiciones de estado.
5. **Estados como máquinas**: membresías, compras, transacciones y cajas
   tienen enums de estado y transiciones válidas; las transiciones se
   registran en tablas propias cuando el dominio lo exige.
6. **Índices**: toda clave foránea consultada y todo filtro caliente tiene
   índice; las combinaciones de tenant (`companyId, estado`, `companyId,
   createdAt`) están cubiertas.

### 13.3 Concurrencia y consistencia

- Operaciones críticas en `$transaction` (35 usos): activación de compras,
  cobros de caja, generación de contadores.
- **Guardas atómicas**: cerrar caja usa una actualización condicionada al
  estado ABIERTA (dos cierres simultáneos → uno gana); el QR de un solo uso
  se consume con transición condicionada.
- Anti doble-cobro: la activación rechaza estados ya activos.

### 13.4 Ciclo de vida del QR

Un token QR pertenece a una membresía o compra, es **de un solo uso**, y al
consumirse se genera el siguiente si quedan usos. El texto de la interfaz
DEBE reflejar esta realidad sin prometer regeneración cuando no quedan usos.
FUTURO aprobado: estados extendidos (BLOQUEADO/FRAUDE) y registro de escaneos
rechazados.

### 13.5 Versionado y migraciones

Las migraciones se entregan como **SQL idempotente** (crear si no existe,
alterar con guardas) en `scripts/supabase-AAAAMMDD-<nombre>.sql`, espejadas en
`prisma/migrations/`. El operador las ejecuta en el editor SQL de Supabase.
Cada PR que cambia el esquema DEBE incluir su SQL y declarar en la descripción
si requiere ejecución. Prisma generate valida la coherencia del esquema.

### 13.6 Paginación y crecimiento

Los listados usan `take` acotado. FUTURO aprobado (deuda media): paginación
por cursor en las tablas administrativas de alto crecimiento (facturas,
clientes, transacciones) antes de que los volúmenes la exijan.

## Capítulo 14 · Caché y rendimiento

La estrategia de rendimiento tiene cuatro niveles, todos normativos:

1. **Páginas públicas**: la landing es ISR (revalidación periódica); el
   marketplace usa una **capa de caché etiquetada** sobre las consultas
   públicas (catálogo y detalle ~2 min; destacadas ~5 min; estadísticas
   ~10 min; categorías ~1 h) con dos garantías: (a) las fechas se
   *reviven* al salir de la caché para que los tipos sigan siendo exactos, y
   (b) las mutaciones del panel invalidan el tag `marketplace` al instante —
   el negocio ve su cambio publicado sin esperar el TTL.
2. **Por request**: las lecturas repetidas dentro de un mismo render usan
   `React.cache` (p. ej. las rutas del Share Engine).
3. **Sin cascadas**: las pantallas cargan sus datos en **una sola ola
   paralela**; está prohibido encadenar tandas de consultas independientes
   (el Inicio del cliente carga 11 consultas en un único `Promise.all`).
4. **Percepción**: skeletons por ruta que calcan el layout real, imágenes
   optimizadas, animaciones solo con `transform/opacity` a 60 FPS y cero
   librerías de motion en el bundle.

Lo personalizado por usuario **no se cachea** globalmente. FUTURO: caché por
usuario con TTL corto para los datos del layout, y medición continua de Core
Web Vitals en producción.

## Capítulo 15 · Eventos, automatización y colas

- **Bus interno de eventos de dominio**: los flujos reales (compras,
  membresías, referidos, campañas) emiten eventos universales de ciclo de
  vida; el **Automation Engine** los consume y ejecuta automatizaciones
  configuradas por datos, con historial de ejecuciones.
- **Biblioteca de playbooks**: cientos de estrategias instalables por objetivo
  (captación ACQ, onboarding ONB, primera compra FP, frecuencia FREQ,
  recuperación REC, membresías MEM, referidos REF, campañas CAMP,
  gamificación GAM, decisiones DEC) que el panel convierte en plantillas.
- **Cron**: un endpoint protegido ejecuta las automatizaciones programadas
  (cumpleaños, por vencer, inactivos) recorriendo las empresas activas.
- **Colas (FUTURO aprobado, prioridad alta)**: los envíos masivos y las
  corridas largas migrarán a una cola gestionada con troceo por empresa y
  reintentos, eliminando el riesgo de timeout del cron a escala.

## Capítulo 16 · Observabilidad, backups y recuperación

- **Errores**: Sentry en cliente y servidor con usuario/rol/empresa como
  contexto.
- **Salud**: `/api/health` para sondas.
- **Auditoría de negocio**: tabla insert-only con acción, actor, IP y user
  agent para todo evento sensible (cobros, aperturas/cierres de caja, QR,
  impresiones).
- **Backups**: Supabase con respaldo diario; **normativo pre-lanzamiento**:
  activar PITR (recuperación a un punto en el tiempo) y ejecutar un simulacro
  de restauración documentado.
- **FUTURO**: métricas de producto/infra con alertas (latencia p95, errores
  por ruta, saturación del pool) y tablero del embudo de journey.

## Capítulo 17 · Arquitectura de seguridad

Controles activos, mapeados a OWASP:

| Amenaza | Control |
| --- | --- |
| Inyección SQL | Prisma parametrizado; cero SQL concatenado |
| XSS | React escapa por defecto; CSP estricta en cabeceras |
| CSRF | Server Actions con verificación de origen del framework; cookies httpOnly |
| Clickjacking | `X-Frame-Options` + CSP |
| Fuerza bruta / abuso | **Rate limiting distribuido** (Upstash REST, ventana fija atómica) con *fallback* local y *fail-open* consciente; límites en login, registro, pagos, caja, escaneos, compartir y bootstrap |
| Escalada de privilegios | RBAC en capa de datos, fail-closed, secciones para roles acotados |
| Fuga entre tenants | filtro por sesión + plan RLS (Cap. 11) |
| Endpoints de arranque | apagados por defecto, secreto con comparación en tiempo constante, rate limit |
| Archivos | subida a Storage con tipos/tamaños validados en el flujo correspondiente |
| Secretos | solo variables de entorno; `.env.example` documenta sin valores |

**Pendientes priorizados** (plan Enterprise): RLS, validación de esquemas con
Zod en acciones críticas, colas para aislar cargas, y pruebas de carga del
camino escaneo→cobro antes del marketing masivo.

## Capítulo 18 · SEO, compartir social y dominios

### 18.1 SEO

Rutas públicas con metadatos completos, sitemap y robots configurados (los
robots NO bloquean las rutas compartibles — los rastreadores de vista previa
lo respetan). Contenido renderizado en servidor; URLs limpias y estables.

### 18.2 Share Engine (resumen normativo)

Toda entidad compartible (promoción, plan, empresa, campaña, invitación)
expone tarjeta rica: título/descripción configurables por campaña, imagen
directa desde el CDN cuando existe (menor a los límites de WhatsApp) o tarjeta
compuesta como respaldo; camino rápido para robots (sin efectos secundarios ni
consultas duplicadas dentro del presupuesto de tiempo del rastreador); y
**versionado anti-caché** en los enlaces (parámetro de versión derivado de la
última edición) para que los cambios se reflejen al compartir de nuevo.

### 18.3 Mensajes de compartir

Los textos de compartir se generan con urgencia y regalo explícito, y son
configurables por campaña desde el panel.

### 18.4 Dominios

`membego.com` como dominio canónico. Reservas de diseño: `app.` (aplicación),
`api.` (API pública futura), `status.` (página de estado), y posibles
subdominios blancos por empresa (FUTURO de marca blanca; exigirá cookies con
alcance de dominio ya contemplado en el middleware).

## Capítulo 19 · Móvil, PWA y arquitectura futura

- **Hoy**: la web es mobile-first con calidad de app (dock QR, gestos básicos,
  skeletons, 60 FPS). Es instalable como atajo; la PWA completa (manifest +
  offline selectivo de la wallet/QR) es FUTURO aprobado.
- **App nativa (FUTURO)**: los tokens de diseño ya se exportan como datos
  (`@membego/ui/tokens`) para React Native/Expo; la API pública versionada
  (capa sobre los motores) será el contrato; la autenticación reutiliza
  Supabase.
- **Integraciones futuras**: pasarelas de pago en línea, WhatsApp Business
  API para notificaciones transaccionales, beneficios cruzados entre
  empresas aliadas, y exportaciones de facturación (PDF/correo — la
  arquitectura de snapshots ya lo permite sin tocar datos).

## Capítulo 20 · Escalabilidad: de mil a un millón de usuarios

Escalones certificados por la auditoría Enterprise:

| Escalón | Estado | Qué lo sostiene / qué exige |
| --- | --- | --- |
| 10³ usuarios | **Listo hoy** | serverless + pgbouncer + índices + caché pública |
| 10⁴ usuarios | Listo con vigilancia | activar Upstash en producción; PITR; alertas |
| 10⁵ usuarios | Exige plan en curso | RLS/wrapper de tenant; colas; Zod; cursor pagination; CWV medidos |
| 10⁶ usuarios | Diseño aprobado | réplicas de lectura; colas maduras; API pública; particionado de tablas calientes (transacciones/auditoría) por fecha |

Reglas de escala normativas: ninguna petición de usuario debe disparar trabajo
masivo síncrono (a colas); ninguna pantalla debe leer sin índice; ningún bucle
de negocio debe hacer N consultas (lotes con `createMany`/agregaciones); y el
camino crítico del mostrador (escaneo→canje→cobro→recibo) tiene presupuesto
de latencia p95 < 1.5 s de extremo a extremo en red local del comercio.

---

**FIN DEL TOMO I**

*El Tomo II documenta cada módulo pantalla por pantalla: flujos, botones,
formularios, validaciones, permisos, estados, transiciones, errores, mensajes
y notificaciones de todas las superficies enumeradas en el Capítulo 6.*

== CONTINUAR TOMO II ==
