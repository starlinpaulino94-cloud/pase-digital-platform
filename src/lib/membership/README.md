# Membership Engine universal — Fase A

Motor universal de membresías: modela **cualquier** modelo comercial (los 20 de
la *Membership Strategy Library*: Unlimited, Créditos, Tier, Hybrid, Family,
Fleet, Corporate, Seasonal, Premium, VIP, Prepaid, Rewards, Custom…) **por
configuración**, no por código. Construido sobre los motores existentes
(Rule/Action/Context/Dictionary/BEL), siguiendo la Fase 0:
**motor universal + plantilla de industria + configuración editable**.

> **Independiente de la industria.** El motor no contiene nada de Car Wash: toda
> la especificidad de Car Wash vive en `templates/carwash.ts` como datos. No toca
> el modelo `Membership` (Car Wash legacy). Ningún flujo de la app lo consume aún.

---

## 1. Arquitectura

```
src/lib/membership/
├── index.ts                          # API + createMembershipService/createUsageTracker
├── domain/
│   ├── types.ts                      # MembershipPlan, MembershipInstance, config, límites
│   ├── lifecycle.ts                  # estados de la membresía (transiciones controladas)
│   ├── limits.ts                     # evaluateUsage (Usage Tracking + Membership Rules)
│   └── metrics.ts                    # catálogo de métricas (Analytics, arquitectura)
├── application/
│   ├── ports.ts                      # MembershipRepository
│   ├── membership-service.ts         # planes + subscribe/renew/cancel/upgrade/downgrade
│   └── usage-tracker.ts              # registrar uso + enforcement de límites (+ reglas BEL)
├── templates/
│   ├── types.ts                      # MembershipTemplate + instantiateTemplate
│   └── carwash.ts                    # BIBLIOTECA Car Wash (16 plantillas)
└── infrastructure/
    ├── prisma-membership-repository.ts
    └── mappers.ts
```

## 2. Modelo de datos

```
┌───────────┐ 1  * ┌──────────────────┐ 1  * ┌──────────────────────┐ 1  * ┌───────────────────┐
│ companies │─────▶│ membership_plans │─────▶│ membership_instances │─────▶│ membership_usage  │
└───────────┘      │ tipo/precio/     │      │ suscriptor/estado/   │      │ servicio/cantidad │
                   │ periodicidad/    │      │ créditos/vehículos   │      │ /fecha            │
                   │ config(JSON)     │      │ /fechas              │      └───────────────────┘
                   └──────────────────┘      └──────────────────────┘
   Multi-tenant (companyId). `config` JSON = servicios, límites, beneficios,
   segmentos, renovación, métricas, automatizaciones (sin columnas por caso).
```

## 3. Los 20 modelos, por configuración

`MembershipPlanType` cubre los 20 modelos comerciales. Lo que los diferencia es
la **configuración**, no el código:

| Concepto | Cómo se expresa |
|----------|-----------------|
| Ilimitado / créditos | `unlimited` + `credits` |
| Periodicidad / duración | `periodicity` + `durationDays` |
| Servicios incluidos | `config.includedServices` |
| **Reglas de uso** | `config.limits` (maxPerPeriod, minIntervalMinutes, allowedServices, maxVehicles, customRules BEL) |
| Beneficios | `config.benefits` (Benefit Engine, pendiente) |
| Segmentos / restricciones | `config.segments` / `config.restrictions` |
| Renovación | `config.renewal` (auto, gracia, prepago, meses gratis) |
| Métricas / automatizaciones | `config.metrics` / `config.automations` |

## 4. Capacidades pedidas por la Strategy Library

- **Membership Rules / Usage Tracking** → `evaluateUsage` + `UsageTracker`:
  máx. por día/semana/mes, intervalo mínimo entre usos, servicios permitidos,
  créditos restantes, y **reglas BEL personalizadas** (ej. `"sistema.hora >= 8 AND sistema.hora <= 18"`).
- **Renewal Engine** → `service.renew()`: extiende el período y repone créditos
  respetando la acumulación (`maxCreditsRollover`).
- **Upgrade / Downgrade Engine** → `service.changePlan()` + `service.suggestPlanChange()`
  (señal por uso vs. capacidad; ej. "Silver con comportamiento Gold" → UPGRADE).
- **Benefit Engine** → referenciado por `config.benefits` (motor separado, pendiente).

## 5. Ciclo de vida

`PENDING → ACTIVE ⇄ PAUSED ⇄ SUSPENDED → EXPIRED → (ACTIVE por renovación)`,
con `CANCELLED` terminal. `validateTransition` rechaza movimientos inválidos.

## 6. Plantillas de industria (Car Wash)

`CARWASH_MEMBERSHIP_TEMPLATES` (16 plantillas, en 3 niveles):
- **Básico:** Unlimited Básico/Premium, Wash Credits, Silver/Gold/Platinum, Hybrid, Family.
- **Avanzado:** Fleet, Corporate, Premium Service, VIP, Seasonal.
- **Inteligente:** Custom Builder, Membership + Rewards.

```ts
import { createMembershipService, CARWASH_MEMBERSHIP_TEMPLATES, instantiateTemplate } from '@/lib/membership'
const memberships = createMembershipService()
const tpl = CARWASH_MEMBERSHIP_TEMPLATES.find(t => t.key === 'carwash.unlimited_premium')!
const plan = await memberships.createPlan(instantiateTemplate(tpl, companyId, { price: 1599 }))
await memberships.publishPlan(plan.id)
const sub = await memberships.subscribe({ companyId, planId: plan.id, subscriberId: clienteId })
```

Otra industria = otra biblioteca de plantillas; **el motor no cambia**.

## 7. Uso con enforcement de límites

```ts
import { createUsageTracker } from '@/lib/membership'
import { createExpressionService } from '@/lib/bel'

const tracker = createUsageTracker({ expressions: createExpressionService() })
const r = await tracker.register({ plan, instance, service: 'lavado_exterior', at: new Date(), context })
// r.decision.allowed === false → r.decision.code: SERVICE_NOT_ALLOWED | PERIOD_LIMIT_REACHED
//                                 | MIN_INTERVAL | NO_CREDITS | INACTIVE
// Si se permite: registra el uso y descuenta créditos (planes no ilimitados).
```

## 8. Cómo reutiliza los motores existentes

- **BEL / Expression Engine (F7)**: reglas de uso personalizadas (`config.limits.customRules`).
- **Context Model (F5)**: el contexto (cliente, sistema, vehículo…) que evalúan esas reglas.
- **Rule/Action Engine (F1–F3)**: futuras automatizaciones de renovación/upgrade se
  expresan como reglas + acciones, sin reimplementar nada.

## 9. Confirmación de no-regresión

Aditivo: 3 enums + 3 tablas (`20260730_add_membership_engine`) y un módulo nuevo
en `src/lib/membership/`. El modelo `Membership` de Car Wash **intacto**; ningún
archivo ni tabla existente cambió; ningún flujo de la app lo invoca. Verificado
con `tsc --noEmit` (0 errores), `eslint` del módulo (0 warnings) y un smoke test
(instanciación de plantillas, suscripción, límites por período/intervalo/créditos/
servicio, renovación, upgrade/downgrade, reglas BEL y ciclo de vida). La lógica
de límites por período se verificó además en aislamiento (reinicia por día).
