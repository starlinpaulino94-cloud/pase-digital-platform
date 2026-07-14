# CAPÍTULO 2 — ARQUITECTURA

*Auditoría Maestra de MembeGo · Volumen 2*

---

## 2.1 Radiografía del sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                        Next.js 16 (App Router)                   │
│                                                                  │
│  src/app (107 páginas, 7 route groups, 82 con force-dynamic)     │
│  ├─ (public)  marketplace, landing, empresas, promos             │
│  ├─ (auth)    login, registro, recuperar                         │
│  ├─ (cliente) wallet, membresías, referidos, retos, feed…        │
│  ├─ (admin)   panel empresa (~30 secciones)                      │
│  ├─ (empleado) scanner                                           │
│  ├─ (superadmin) control de plataforma                           │
│  └─ api/      5 rutas (health, stats, cron, bootstrap, reset)    │
│                                                                  │
│  src/modules (20 dominios: server actions + queries)             │
│  src/components (UI por dominio + design system)                 │
│  src/lib (36 entradas: utilidades REALES + ~26.5K LOC de         │
│           "motores" especulativos casi sin consumo)              │
│  src/proxy.ts (middleware: auth Supabase + protección de rutas)  │
└──────────────┬───────────────────────────────┬───────────────────┘
               │ Prisma (75 modelos)           │ Supabase Auth
               ▼                               ▼
        PostgreSQL (Supabase)          Sesiones/JWT/cookies
```

**Stack:** Next.js 16 + React Server Components + Server Actions, Prisma 6, Supabase (Auth + Postgres + Storage), Radix UI + Tailwind, Sentry. Es un stack correcto, moderno y apropiado para el tamaño del equipo. **El problema no es el stack: es lo que se construyó encima.**

## 2.2 Hallazgo central: la ciudad fantasma de motores

Medición directa (imports desde `src/app` + `src/modules` + `src/components`):

| Motor en `src/lib` | LOC | Imports reales desde la app |
|---|---|---|
| `automation/` (playbooks ACQ/ONB/FP/FREQ/REC/MEM/REF/CAMP/GAM/DEC) | 10,340 | 7 |
| `rule-engine/` | 2,806 | 1 |
| `promotions/` (framework universal) | 2,279 | 2 |
| `membership/` (engine universal) | 2,471 | 1 |
| `referral/` (engine universal FD) | 1,809 | **0** |
| `benefit-transformation/` | 1,667 | **0** |
| `benefits/` (benefit engine FC) | 1,352 | **0** |
| `bel/` | 1,314 | **0** |
| `dictionary/` | 919 | **0** |
| `business-strategy-core/` | 918 | **0** |
| `decision/` | 709 | **0** |
| **Total** | **~26,584** | **~11** |

**El 31% del código de `src/` es infraestructura que la aplicación no ejecuta.** Además arrastra ~20 modelos Prisma propios (RuleGroup, Rule, RuleCondition, PromotionVersion, DataDictionaryVariable, MembershipInstance, ReferralParticipant, Automation, AutomationRun…), es decir, la base de datos de producción carga tablas de un sistema que no corre.

**Por qué es grave (no solo "desorden"):**

1. **Costo cognitivo:** cualquier persona nueva (o el propio fundador en 6 meses) no puede distinguir el código vivo del muerto. Ejemplo real: existen `Promocion` (vivo) y `Promotion` (motor), `Referido` (vivo) y `ReferralReferral` (motor). Una letra decide si tocas producción o humo.
2. **Costo de cambio:** cada migración, upgrade de Prisma/Next, refactor de tipos, corre sobre 84K LOC en lugar de ~55K.
3. **Costo de riesgo:** el "dual-write bridge" (B-1.x) escribe en ambos sistemas de promociones. Duplicar escrituras sin consumidor del lado nuevo es riesgo sin retorno.

**Veredicto:** los motores son un buen *diseño de dominio* escrito demasiado pronto. La recomendación NO es borrarlos a ciegas: es **extraerlos del runtime de producción** (carpeta `packages/strategy-lab` o repo aparte, sin modelos en el schema de producción), congelar el dual-write, y reincorporar cada motor SOLO cuando una feature visible lo requiera. Detalle operativo en Cap. 13 (E-1).

## 2.3 Duplicación de dominios (el mapa completo)

```
REFERIDOS (4 sistemas)                    PROMOCIONES (2)
├─ Referido + ReferralEvent   ← VIVO      ├─ Promocion            ← VIVO
├─ GrowthLink/Config/Wallet   ← semi-vivo ├─ Promotion + 5 tablas ← motor (dual-write)
├─ ReferralProgram/Participant← muerto
└─ CampanaInvitacion (+Progreso,Evento) ← VIVO (nuevo Growth Engine)

MEMBRESÍAS (2)                            BENEFICIOS (2)
├─ Membership                 ← VIVO      ├─ ProductoCompra+QrToken ← VIVO (E8) ★
└─ MembershipPlan/Instance/Usage ← motor  └─ Benefit+BenefitGrant   ← semi-vivo (fallback campañas)
```

La atribución de un registro referido hoy puede tocar: `Referido`, `ReferralEvent`, `GrowthWallet`, `InvitacionProgreso`, `InvitacionEvento` y `emitirEventoEstrategia`. Seis escrituras, cuatro modelos mentales, un solo hecho de negocio ("Juan trajo a Pedro").

**Arquitectura objetivo (dominio unificado de referidos):**

```
ReferralAttribution (hecho único: quién trajo a quién, por qué canal, sospechoso?)
        │
        ├─→ proyección: progreso de campaña (Invita y Gana)
        ├─→ proyección: puntos/niveles del programa continuo
        └─→ proyección: métricas de embudo (eventos)
```

Un solo módulo de escritura (`modules/referidos`), con las campañas y el programa continuo como *lectores* del mismo hecho. Esto elimina la clase de bug ya encontrado (campañas que no atribuían por buscar solo `codigoReferido`).

## 2.4 Backend: Server Actions y módulos

**Lo bueno:** separación `modules/<dominio>/{actions,queries}.ts` es consistente; las actions validan rol con `requireRole`; los flujos no-críticos (notificaciones, eventos) están envueltos en try/catch para no romper el flujo principal — patrón correcto y aplicado con disciplina.

**Lo malo:**

1. **Archivos-dios:** `modules/referidos/actions.ts` (971 LOC), `modules/visitas/actions.ts` (777), `modules/admin/actions.ts` (741), `modules/marketplace/queries.ts` (806). Un archivo de acciones de 900+ líneas mezcla 10+ casos de uso; imposible de testear unitariamente.
2. **Validación artesanal:** las actions parsean `FormData` a mano (`String(fd.get(...) ?? '')`) en cada archivo. Con `zod` (ya instalado vía `@hookform/resolvers`) cada action debería declarar su schema. Hoy un campo mal nombrado falla en silencio con string vacío.
3. **JSON sin tipar en la frontera de datos:** `beneficioInvitante as object`, `config: {...}` en Benefit, `meta` en eventos. Prisma `Json` + cast `as` = errores de runtime invisibles. Mínimo: schemas zod de lectura/escritura por cada campo Json.
4. **Transaccionalidad parcial:** flujos multi-escritura (registro + atribución + progreso + beneficio + notificación) corren como secuencia de awaits independientes con try/catch. Si el proceso muere a mitad, quedan estados intermedios (progreso incrementado sin beneficio entregado). Para los pasos que deben ser atómicos: `prisma.$transaction`; para los que no: un patrón outbox simple (tabla de "efectos pendientes" + cron ya existente).

## 2.5 Frontend

- **RSC bien aprovechado en general:** las páginas cargan datos en el servidor y los componentes cliente reciben props serializadas. Correcto.
- **Componentes gigantes:** `EmpresasCRM.tsx` (667), `CompanyProfile.tsx` (663), `ScannerClient.tsx` (532), `CampanaLanding.tsx` (~480). Regla propuesta: >250 LOC en un componente cliente = dividir.
- **134 componentes `'use client'`** — razonable en proporción, pero varios son clientes solo por un `useState` trivial que podría ser un `<details>` o quedar en un leaf component.
- **Sin Suspense/streaming:** casi ninguna página usa `loading.tsx` + `<Suspense>` por sección. Con páginas 100% dinámicas (ver Cap. 10) esto convierte cada navegación en una espera en blanco.

## 2.6 Base de datos

**Lo bueno:** 152 índices declarados; FKs con relaciones explícitas; enums para estados; `TransactionCounter` para folios; tablas de transición (`ProductoCompraTransicion`, `TransactionTransicion`) que dan trazabilidad de máquina de estados — diseño por encima del promedio.

**Lo malo:**

1. **75 modelos para un producto pre-escala.** ~20 pertenecen a motores sin uso. Un schema de ~50 modelos contaría la misma historia de negocio.
2. **Tres fuentes de verdad del esquema:** `prisma/migrations/`, `prisma/migrations_manual/`, `scripts/supabase-*.sql`. Es cuestión de tiempo que producción y el schema diverjan (si no lo han hecho ya). Debe quedar UNA: migraciones Prisma; lo manual (buckets, RLS) va en migraciones SQL de Prisma también.
3. **Multi-tenancy por disciplina, no por diseño:** el aislamiento entre empresas depende de que cada query recuerde filtrar `companyId`. Con 20 módulos y 84K LOC, la probabilidad de fuga cross-tenant por un `findUnique` sin verificación de company es alta (ver Cap. 11). Mitigaciones: helpers de repositorio con `companyId` obligatorio en el tipo, y/o RLS de Postgres como red de seguridad.
4. **Naming spanglish:** `Cliente`, `Promocion`, `CampanaInvitacion` conviven con `Benefit`, `Membership`, `ReferralProgram`. Elegir UN idioma para el dominio (recomendado: español, que es el idioma del negocio y del equipo) y aplicarlo a todo lo nuevo; renombrar lo viejo solo de forma oportunista.

## 2.7 Calidad y deuda técnica

| Dimensión | Estado | Evidencia |
|---|---|---|
| Tests | 🔴 | 2 archivos (`referidos-e6`, `scanner-hid-e7`) para 84K LOC |
| CI | 🟡 | lint + build; sin gate de tests ni typecheck script dedicado |
| Docs | 🟡 | 28 documentos en `docs/` — pero orientados a *fases* de desarrollo, no a *cómo funciona el sistema*; varios ya no reflejan la realidad |
| Lint | 🟢 | 0 errores (72 warnings) |
| Tipado | 🟡 | Estricto en general, agujereado por casts `as` en fronteras Json |
| Observabilidad | 🟡 | Sentry instalado; sin métricas de negocio ni logs estructurados |

**La deuda más cara no es el código feo: es la ausencia de una red de tests sobre los flujos que mueven dinero y confianza** (registro→atribución→beneficio; compra→QR→canje). Cualquier refactor de consolidación (2.2, 2.3) es ruleta rusa sin esa red. Por eso el roadmap (Cap. 13) pone los tests ANTES de la consolidación.

## 2.8 Resumen de acciones de arquitectura

| ID | Acción | Impacto | Esfuerzo |
|---|---|---|---|
| A-1 | Suite de tests de los 6 flujos críticos (registro, atribución, compra, QR, canje, campaña) | 🔴 Bloqueante para todo lo demás | 2-3 sem |
| A-2 | Extraer motores de `src/lib` a paquete aislado; congelar dual-write; limpiar ~20 modelos del schema productivo | Reduce 31% del código en runtime | 2 sem |
| A-3 | Unificar referidos en un solo dominio (hecho + proyecciones) | Elimina la mayor fuente de bugs | 3 sem |
| A-4 | Una sola fuente de migraciones | Previene divergencia prod/schema | 3 días |
| A-5 | Zod en fronteras (FormData + campos Json) | Errores visibles en vez de silenciosos | 1-2 sem incremental |
| A-6 | Partir archivos-dios (>500 LOC actions; >250 LOC componentes cliente) | Mantenibilidad | incremental |
| A-7 | Helpers de repositorio con `companyId` obligatorio (o RLS) | Seguridad multi-tenant | 1-2 sem |

---

*Continúa en el Volumen 3: Auditoría por módulo.*
