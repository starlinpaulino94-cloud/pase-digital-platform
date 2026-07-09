# Framework Universal de Promociones — Fase 4

Primer módulo de negocio construido **sobre** el Rule Engine (Fases 1-2) y el
Action Engine (Fase 3). Una promoción es una **entidad configurable** —no una
pieza de código— compuesta de información administrativa + reglas + acciones +
restricciones + ciclo de vida + configuración + versionado + auditoría.

> **Alcance:** SOLO el framework universal. **No** hay tipos de promoción
> (descuento, 2x1, happy hour, cashback, lavado gratis, puntos, cupones…): esos
> se implementarán en fases posteriores como *plantillas* sobre este framework.
> Es independiente de la industria y **no toca** el modelo `Promocion`
> (marketplace) existente. Ningún flujo de la app lo consume aún.

---

## 1. Principio

Una promoción **no contiene lógica**. Toda la lógica se delega:

- **Cuándo aplica** → reglas del **Rule Engine** (mapeadas, reutilizadas).
- **Qué ocurre** → acciones del **Action Engine** (mapeadas, ejecutadas por él).

La promoción solo aporta **configuración** (datos). Añadir un caso nuevo =
insertar filas + registrar handlers/operadores en los motores, nunca `if (tipo…)`.

---

## 2. Arquitectura

```
src/lib/promotions/
├── index.ts                         # API pública + createPromotionService()
├── domain/                          # puro, sin Prisma ni negocio
│   ├── types.ts                     # Promotion, PromotionStatus, *Def, config
│   ├── lifecycle.ts                 # máquina de estados (transiciones válidas)
│   ├── restrictions.ts              # catálogo universal de restricciones
│   └── audit.ts                     # acciones auditables + diff de cambios
├── application/
│   ├── ports.ts                     # PromotionRepository (puerto)
│   ├── promotion-service.ts         # API interna (CRUD + lifecycle + versión + audit)
│   └── promotion-engine.ts          # PUENTE que reutiliza Rule/Action Engine
└── infrastructure/
    ├── prisma-promotion-repository.ts
    └── mappers.ts
```

Dependencias: `infrastructure → application → domain`. El dominio no depende de
nada; el servicio depende de puertos (Dependency Inversion).

---

## 3. Modelo de datos

```
┌───────────────┐ 1   * ┌──────────────────┐
│   companies   │──────▶│    promotions    │  info administrativa + config (JSON)
└───────────────┘       │ status/prioridad │  + metadata (JSON) + version
        ▲               │ inicioEn/finEn   │
        │ *             └───────┬──────────┘
        │                      │ 1
        │        ┌─────────────┼───────────────┬──────────────┬───────────────┐
        │        ▼ *           ▼ *             ▼ *            ▼ *             ▼ *
        │  ┌────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────────┐
        │  │promotion_  │ │ promotion_   │ │ promotion_   │ │ promotion_ │ │ promotion_   │
        │  │  rules     │ │  actions     │ │ restrictions │ │  versions  │ │   audits     │
        │  │ →rules(FK) │ │ tipo/params  │ │ tipo/valor   │ │ snapshot   │ │ accion/diff  │
        │  └─────┬──────┘ └──────────────┘ └──────────────┘ └────────────┘ └──────┬───────┘
        │        │ *                                                              │ *
        │        ▼                                                                │
        │   ┌─────────┐  reutiliza el Rule Engine (Fase 1-2)                      │
        │   │  rules  │                                                           │
        │   └─────────┘                                                           │
        └────────────────────────────────────────────────────────────────────────┘
                              multi-tenant: todo cuelga de companyId
```

- Todas las tablas cuelgan de `promotions` con `ON DELETE CASCADE`; `promotions`
  y `promotion_audits` cuelgan de `companies` (aislamiento por tenant).
- `promotion_rules → rules` con `@@unique(promotionId, ruleId)`: **no duplica** reglas.
- Configuración flexible: `promotions.config` y `metadata` son JSON → cientos de
  parámetros sin columnas nuevas ni rediseño de BD.

---

## 4. Ciclo de vida (motor de estados)

```
        ┌─────── DRAFT ───────┐
        │      ▲   │          │
        ▼      │   ▼          ▼
    PENDING ─▶ SCHEDULED ─▶ ACTIVE ⇄ PAUSED ⇄ SUSPENDED
        │          │          │        │          │
        │          └──────────┼────────┴──────────┤
        ▼                     ▼                    ▼
    CANCELLED ◀───────────── ENDED ───────────────┘
        │                     │
        └────────┬────────────┘
                 ▼
             ARCHIVED   (terminal)
```

Transiciones definidas como datos en `PROMOTION_TRANSITIONS`. `validateTransition`
**rechaza** cualquier movimiento inválido (nunca se aplica). Cada cambio de
estado se audita con estado anterior/nuevo.

---

## 5. Versionado

`createVersion()` congela la definición actual como instantánea inmutable en
`promotion_versions` (con su nº de versión) e incrementa el contador. **El
historial nunca se borra.** Base para comparar/revertir versiones en el futuro.

## 6. Auditoría

Cada operación mutadora registra en `promotion_audits`: **quién** (`userId`),
**qué** (`accion`: CREATED/UPDATED/STATUS_CHANGED/VERSIONED/DUPLICATED/…),
**cuándo** (`createdAt`), **estado anterior/nuevo** y el **diff** de campos
(`computeChanges`).

## 7. Configuración flexible

`config` y `metadata` (JSON) + tabla `promotion_restrictions` con `tipo`/`valor`/
`config`. El **catálogo de restricciones** (`RESTRICTION_TYPES`) declara como
datos: usos totales/globales, por cliente/empresa/sucursal/empleado/campaña, por
día/semana/mes. **Sin validación programada todavía** (solo la arquitectura).

---

## 8. API interna (`PromotionService`)

```ts
import { createPromotionService } from '@/lib/promotions'
const promotions = createPromotionService()

const p = await promotions.create({ companyId, name: 'Base', createdById: userId })
await promotions.update(p.id, { priority: 10, updatedById: userId })
await promotions.setRules(p.id, [ruleId1, ruleId2])        // reutiliza Rule Engine
await promotions.setActions(p.id, [{ type: 'add_points', params: {}, order: 0,
  required: true, maxRetries: 0, enabled: true, version: 1 }])
await promotions.activate(p.id, { userId })                 // transición validada
await promotions.pause(p.id, { userId })
await promotions.createVersion(p.id, { summary: 'ajuste', actor: { userId } })
const copy = await promotions.duplicate(p.id, { userId })   // clona en DRAFT
await promotions.archive(copy.id, { userId })
const list = await promotions.list({ companyId, status: 'ACTIVE' })
```

Operaciones: `create`, `update`, `duplicate`, `createVersion`, `changeStatus`
(+ `activate`/`pause`/`suspend`/`schedule`/`end`/`cancel`/`archive`), `setRules`,
`setActions`, `setRestrictions`, `get`, `list`. **Sin lógica comercial.**

---

## 9. Cómo reutiliza el Rule Engine y el Action Engine

`PromotionEngine` es el puente; la promoción **no evalúa ni ejecuta** por su cuenta:

```
PromotionEngine.evaluate(promotion, ruleContext)
   └─ por cada regla mapeada → RuleEvaluator.evaluateToResult()  (Fase 1-2)
   └─ elegible = todas las reglas válidas (AND)   → RuleResult[]

PromotionEngine.executeActions(promotion, actionContext)
   └─ convierte PromotionActionDef → RuleAction (toRuleAction)
   └─ ActionExecutor.execute(...)                (Fase 3)
   └─ sin handlers registrados → NO_HANDLER (sin efectos en esta fase)
```

Así no se duplica nada: la elegibilidad usa el evaluador de reglas y la ejecución
usa el ejecutor de acciones ya construidos.

---

## 10. Compatibilidad, prioridad y escala

- **Multi-tenant**: toda consulta se acota por `companyId`; las promociones nunca
  se mezclan entre empresas.
- **Asociable** (vía `config`/`metadata`/reglas/acciones, sin cambiar la arquitectura)
  a clientes, segmentos, sucursales, productos, servicios, categorías, membresías,
  QR, campañas, referidos, beneficios…
- **Prioridad**: `promotions.prioridad` + índices por `(companyId, prioridad)`
  dejan lista la resolución de conflictos entre promociones (fase futura).
- **Escala**: índices por estado/vigencia; el framework reutiliza la caché de
  reglas del Rule Engine; `config` en JSON evita migraciones por cada caso.

---

## 11. Confirmación de no-regresión

Aditivo: enum + 6 tablas nuevas (`20260728_add_promotion_framework`) y un módulo
nuevo autocontenido en `src/lib/promotions/`. **No** se tocó el modelo
`Promocion`/`promociones` del marketplace ni ningún otro. Ningún flujo de la app
invoca el framework. Verificado con `tsc --noEmit` (0 errores), `eslint` del
módulo (0 warnings) y un smoke test de 23 aserciones (ciclo de vida con
transiciones válidas/ inválidas, versionado + snapshot, auditoría con diff,
duplicación, catálogo de restricciones y reutilización real de Rule/Action Engine).
