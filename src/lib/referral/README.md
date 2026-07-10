# Referral Engine (Fase D · Referral Strategy Library)

Motor **universal de programas de recomendación** 100% configurables. No premia
solo por compartir un enlace: la recompensa depende del **valor generado**
(condiciones, estados, límites, antifraude). Reutiliza el **Benefit Engine
(Fase C)** para las recompensas — no duplica lógica.

> Una empresa crea un programa de referidos completo **sin escribir código**:
> solo elige objetivo, reglas, recompensas, límites y condiciones.

Sigue el principio de Fase 0: **motor universal + plantilla de industria +
configuración editable**. Coexiste con el sistema de referidos **en vivo**
(`Referido`/`ReferralEvent`) sin tocarlo.

## Arquitectura

```
domain/            (puro, sin Prisma)
  types.ts             Program, Participant, Referral, config (reglas/recompensas/…)
  models.ts            los 10 modelos, tipos de enlace, segmentos
  states.ts            flujo de estados configurable (invitado→…→recompensa)
  conditions.ts        condiciones de valor (compras, monto, membresía…) + evaluador
  escalation.ts        escalado progresivo (1→3→5→10→… referidos)
  limits.ts            límites (día/semana/mes, recompensas, presupuesto, expira)
  fraud.ts             antifraude toggleable (autoreferido, duplicados, IP…)
  metrics.ts           catálogo de KPIs + ROI del programa
  rewards.ts           puente reward → Benefit Engine (a quién + qué beneficio)
application/
  ports.ts             ReferralRepository (puerto)
  referral-service.ts  crear programa, inscribir, referir, avanzar, liberar
  benefit-reward-granter.ts  adaptador RewardGranter sobre BenefitService (FC)
infrastructure/
  mappers.ts           Prisma ↔ dominio
  prisma-referral-repository.ts
templates/
  types.ts             ReferralProgramTemplate + instantiateProgramTemplate
  carwash.ts           15 programas (captación, escalonadas, VIP, empresas, campañas)
index.ts               composition root + API pública
```

## Modelo de datos (aditivo)

- `referral_programs` — programa configurable (modelo + `config` JSON).
- `referral_participants` — quien invita: su código único, contadores, nivel.
- `referral_referrals` — cada referido y su recorrido por el flujo de estados,
  marca de fraude y recompensa liberada.
- Enums `ReferralModel` (10) y `ReferralParticipantStatus`.

Ningún flujo existente consume estas tablas todavía.

## Los 10 modelos

Clásico · Solo referente · Solo referido · Ambos ganan · Progresivo ·
Embajadores · Influencers · Corporativo · Empleados · Equipos.

## Flujo configurable

```
INVITED → REGISTERED → VERIFIED → FIRST_PURCHASE → ACTIVE → RECURRING → REWARDED
```

Cada empresa decide qué estados usa (`config.states`) y **en cuál se libera la
recompensa** (`config.rewardState`). El avance es paso a paso; la recompensa
solo se libera si se cumplen las **condiciones** y el referido no es sospechoso.

## Uso

```ts
import { createReferralService, CARWASH_REFERRAL_TEMPLATES, instantiateProgramTemplate } from '@/lib/referral'
import { createBenefitService } from '@/lib/benefits'

const referral = createReferralService({ benefits: createBenefitService() })

// 1. Crear y publicar un programa "Ambos ganan"
const tpl = CARWASH_REFERRAL_TEMPLATES.find(t => t.name === 'Ambos ganan')!
const program = await referral.createProgram(instantiateProgramTemplate(tpl, companyId))
await referral.publishProgram(program.id)

// 2. Inscribir a quien invita (su código) y registrar un referido
const part = await referral.enroll({ companyId, programId: program.id, referrerId: clienteId, code: 'JUAN10' })
const r = await referral.registerReferral({
  programId: program.id, participantId: part.id, referredId: nuevoClienteId,
  signals: { hasRealPurchase: true },
})

// 3. Avanzar el flujo; al cumplir condiciones libera recompensas (Benefit Engine)
if (r.ok) {
  await referral.advance({ referralId: r.referral.id, to: 'VERIFIED' })
  await referral.advance({ referralId: r.referral.id, to: 'FIRST_PURCHASE', facts: { purchases: 1, paymentConfirmed: true } })
}
```

## Recompensas = Benefit Engine

Un programa no re-implementa beneficios: sus recompensas **referencian** un
beneficio de la Fase C por `benefitCode` (ej. `CAR-001`) o `benefitId`, y a
quién se entrega (`REFERRER` / `REFERRED` / `BOTH`). Al calificar, el servicio
concede un `BenefitGrant` del módulo `referral`.

## Antifraude (activable/desactivable)

Autoreferido, correos/teléfonos duplicados, dispositivos repetidos, múltiples
cuentas, abuso de IP y "referidos sin compra real". Cada regla se enciende o
apaga en `config.fraud`. Un referido sospechoso se **conserva** para auditoría
pero **no libera** recompensa.

## Verificación

`npx tsc --noEmit` · `npx eslint src/lib/referral` · smoke (24/24): catálogos
(10 modelos, 7 estados, 15 plantillas), antifraude, condiciones, escalado,
transiciones de estado, límites, flujo end-to-end (registrar→avanzar→liberar 2
grants en "ambos ganan"), bloqueo de sospechosos y ROI.
