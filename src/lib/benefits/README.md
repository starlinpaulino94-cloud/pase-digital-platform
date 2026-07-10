# Benefit Engine (Fase C · Benefits & Rewards Library)

Biblioteca **universal de beneficios y recompensas**. Un beneficio no es "un
descuento": es una **entidad independiente y editable** que cualquier módulo
puede seleccionar, modificar o crear —membresías, promociones, referidos,
puntos, gamificación, campañas y automatizaciones—.

> La plataforma no piensa "crear un descuento", sino **"seleccionar el
> beneficio correcto para lograr el comportamiento correcto"**:
> `Cliente + Segmento + Beneficio + Momento`.

Sigue el principio de Fase 0: **motor universal + plantilla de industria +
configuración editable**. El motor no contiene nada de Car Wash; la
especificidad vive en `templates/`.

## Arquitectura

```
domain/            (puro, sin Prisma)
  types.ts             Benefit, BenefitGrant, BenefitConfig, 10 tipos base
  taxonomy.ts          10 categorías, catálogo de tipos, módulos, segmentos
  economics.ts         valor percibido vs costo real, apalancamiento, ROI
  eligibility.ts       restricciones (segmento/servicio/stock/frecuencia)
  metrics.ts           catálogo de métricas (entregados, utilizados, ROI…)
  benefit-to-action.ts puente Benefit → Action Engine (F3)
application/
  ports.ts             BenefitRepository (puerto)
  benefit-service.ts   CRUD + entregar/canjear/revocar con elegibilidad
  benefit-selector.ts  selector estratégico por segmento
infrastructure/
  mappers.ts           Prisma ↔ dominio
  prisma-benefit-repository.ts
templates/
  types.ts             BenefitTemplate + instantiateBenefitTemplate
  carwash.ts           50 beneficios CAR-001..050 (10 categorías)
  recommended.ts       sets iniciales por objetivo
index.ts               composition root + API pública
```

## Modelo de datos (aditivo)

- `benefits` — catálogo de beneficios de una empresa (tipo, categoría,
  `valorPercibido`, `costoReal`, `config` JSON, status).
- `benefit_grants` — cada beneficio entregado a un suscriptor desde un módulo
  (fuente de las métricas: entregados, utilizados, costo real, ROI).
- Enums `BenefitType` (10) y `BenefitGrantStatus` (GRANTED/REDEEMED/EXPIRED/REVOKED).

Ningún flujo existente consume estas tablas todavía.

## Uso

```ts
import {
  createBenefitService, CARWASH_BENEFIT_TEMPLATES,
  instantiateBenefitTemplate, benefitRoi, selectBenefitsForSegment,
} from '@/lib/benefits'

const benefits = createBenefitService()

// 1. Instanciar un beneficio de la biblioteca y publicarlo
const tpl = CARWASH_BENEFIT_TEMPLATES.find(t => t.code === 'CAR-001')! // lavado gratis
const b = await benefits.createBenefit(instantiateBenefitTemplate(tpl, companyId))
await benefits.publishBenefit(b.id)

// 2. Entregarlo desde el módulo de referidos (valida elegibilidad)
const res = await benefits.grant({
  companyId, benefitId: b.id, subscriberId: clienteId, sourceModule: 'referral',
})
if (res.ok) await benefits.redeem(res.grant.id) // al usarlo en el local

// 3. Recomendar el beneficio correcto para un segmento
const recs = selectBenefitsForSegment('en_riesgo', await benefits.listBenefits(companyId))

// 4. Medir ROI
benefitRoi({ granted: 100, redeemed: 40, realCost: 150, revenueGenerated: 20000 })
```

## Economía del beneficio

Distingue **valor percibido** (lo que el cliente cree que vale) del **costo
real** (lo que le cuesta al negocio). Ejemplo del documento — *Lavado gratis*:
percibido RD$800 · costo real RD$150 → apalancamiento **5.33×**. El costo del
ROI se imputa solo a lo **utilizado** (un beneficio entregado y no canjeado no
consume materia prima).

## Biblioteca Car Wash — 50 beneficios en 10 categorías

Servicios (CAR-001..010) · Descuentos (011..015) · Upgrades (016..019) ·
Económicos (020..022) · Puntos (023..025) · Membresía (026..030) · VIP
(031..035) · Comportamiento (036..040) · Referidos (041..044) · Avanzados
(045..050). CAR-050 es la plantilla base para que la empresa cree **cualquier**
beneficio.

## Verificación

`npx tsc --noEmit` · `npx eslint src/lib/benefits` · smoke test (20/20):
biblioteca (50/10/códigos únicos), economía (800/150/5.33×), ciclo
grant→redeem con elegibilidad, benefit→acción, restricciones por segmento, ROI
y selector estratégico.
