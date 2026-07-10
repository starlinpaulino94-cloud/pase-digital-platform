# Automation Playbooks (Fase E1.1+)

Un **Playbook** es una estrategia comercial profesional lista para instalar: una
automatización real del [Automation Engine](../README.md) (Fase E1) **envuelta**
con la documentación completa que exige el Documento Maestro (24 apartados).

No duplica lógica. El campo `config` de cada playbook es una `AutomationConfig`
real y se instala reutilizando `instantiateAutomationTemplate`. Los playbooks
sólo aportan **metadatos + una config bien construida**; toda la ejecución la
hacen los motores existentes (Rule Engine para condiciones, Action Engine para
acciones, y por referencia Benefit/Promotion/Campaign/Analytics).

## Principio universal

Cada playbook es **universal por diseño**: declara con qué industrias es
compatible (`industries`) e incluye `'universal'` cuando aplica a cualquiera.
Car Wash es sólo la primera industria que las usa. Nada está hardcodeado por
industria:

- Los beneficios y promociones se referencian **por código** (`CAR-004`,
  `FIRST_PURCHASE`), no por lógica embebida.
- Los textos usan **variables** `{{cliente.nombre}}` resueltas en runtime.
- Todo lo relevante es **editable** por la empresa (`editable`).

## Estructura de un Playbook (24 apartados)

Definida en [`types.ts`](./types.ts) — `AutomationPlaybook`:

| Apartado | Campo | Descripción |
| --- | --- | --- |
| 1 | `id` | Automation ID (ej. `ACQ-001`) |
| 2 | `name` | Nombre |
| 3 | `category` | Categoría (`captacion`, …) |
| 4 | `objective` | Objetivo comercial |
| 5 | `problem` | Problema que resuelve |
| 6 | `whenToUse` | Cuándo utilizarla |
| 7 | `complexity` | `basic` / `intermediate` / `advanced` |
| 8 | `industries` | Industrias compatibles |
| 9 | `triggers` | Disparadores (resumen legible) |
| 10 | `conditions` | Condiciones (resumen legible) |
| 11 | `variables` | Variables usadas |
| 12 | `engines` | Motores involucrados |
| 13 | `flow` | Flujo completo (pasos) |
| 14 | `actions` | Acciones (tipos del Action Engine) |
| 15 | `events` | Eventos generados |
| 16 | `exceptions` | Excepciones / casos límite |
| 17 | `editable` | Configuraciones editables |
| 18 | `compatibleBenefits` | Beneficios compatibles |
| 19 | `compatiblePromotions` | Promociones compatibles |
| 20 | `compatibleCampaigns` | Campañas compatibles |
| 21 | `kpis` | KPIs a seguir |
| 22 | `dependencies` | Dependencias |
| 23 | `compatibleTemplates` | Plantillas que combinan bien |
| 24 | `examples` + `notes` | Ejemplos y notas técnicas |
| — | `config` | **Automatización instalable** (`AutomationConfig` real) |

## Categorías

| Fase | Categoría | Archivo | Playbooks |
| --- | --- | --- | --- |
| E1.1 | `captacion` (adquisición) | [`acquisition.ts`](./acquisition.ts) | `ACQ-001`…`ACQ-020` (20) |
| E1.2 | `onboarding` (activación) | [`onboarding.ts`](./onboarding.ts) | `ONB-001`…`ONB-018` (18) |
| E1.3 | `primera_compra` (conversión) | [`first-purchase.ts`](./first-purchase.ts) | `FP-001`…`FP-012` (12) |
| E1.4 | `frecuencia` (hábito/LTV) | [`frequency.ts`](./frequency.ts) | `FREQ-001`…`FREQ-016` (16) |
| E1.5 | `recuperacion` (churn/win-back) | [`recovery.ts`](./recovery.ts) | `REC-001`…`REC-016` (16) |
| E1.6 | `membresias` (ciclo de vida) | [`membership.ts`](./membership.ts) | `MEM-001`…`MEM-020` (20) |
| E1.7 | `referidos` (journey) | [`referral.ts`](./referral.ts) | `REF-001`…`REF-020` (20) |
| E1.8 | `campanas` (orquestación) | [`campaign.ts`](./campaign.ts) | `CAMP-001`…`CAMP-020` (20) |
| E1.9 | `gamificacion` (conductual) | [`gamification.ts`](./gamification.ts) | `GAM-001`…`GAM-020` (20) |
| E1.10 | `decisiones` (inteligentes) | [`decision.ts`](./decision.ts) | `DEC-001`…`DEC-018` (18) |

### E1.10 — Decisiones inteligentes (última fase)

No integra IA: instala automatizaciones que **toman decisiones** usando la
arquitectura desacoplada [`src/lib/decision`](../../decision/README.md)
(Decision Engine → Recommendation Engine → Prediction → Optimization, servida por
Decision Providers). Hoy el único proveedor es `rule_based`; mañana se registra un
AI/ML Provider sin tocar estos playbooks ni el resto del sistema, y **las empresas
nunca ven "IA"** (la categoría interna es `decisiones`, no `ia`). Regla de oro: el
Decision Engine **decide** (paso "Decidir", `INVOKE_MODULE` al módulo `decision`);
el Action Engine **ejecuta**. Cubre recomendación de promoción/membresía/beneficio/
campaña/recompensa, predicción de abandono/renovación, detección de oportunidades/
riesgos, optimización continua, next best action (incluye "esperar/no ejecutar"),
priorización, mejor canal/momento, anti-fatiga, segmentación inteligente y el
patrón de preparación para IA.

Estos playbooks incluyen los apartados **`decisionProvider`**,
**`suggestedActions`** (sugeridas por el Decision Engine) y **`executedActions`**
(ejecutadas por el Action Engine) — 24 apartados. Amplió el catálogo de eventos
(aditivos): `decision.tomada`, `recomendacion.lista`, `oportunidad.detectada`,
`riesgo.detectado`, `siguiente_accion.lista`.

### E1.9 — Gamificación conductual

No es "solo puntos/insignias/rankings": es un sistema de **cambio de
comportamiento** al servicio de objetivos comerciales (frecuencia, visitas,
consumo, referidos, renovaciones, uso de beneficios, hábito, retención, LTV). La
gamificación nunca existe por entretenimiento — cada mecánica impulsa una meta de
negocio (los KPIs de cada playbook son de negocio, no de juego). Se integra de
forma nativa con el resto de motores: una misión activa promociones, una racha
otorga beneficios, un logro inicia campañas y un nivel desbloquea membresías. Los
**niveles son configurables por variable** (sin nombres fijos Bronce/Plata/…).
Cubre objetivos iniciales, misiones (diaria/semanal/mensual/estacional), rachas
(inicio/pérdida/recuperación), niveles (subida/descenso), logros/insignias,
rankings, desafíos, competencias (inicio/fin), bonos por actividad, recompensa
sorpresa (refuerzo variable), eventos de temporada, metas (individual/compartida/
grupal), programa VIP y near-miss.

Estos playbooks incluyen el apartado **`compatibleRewards`** (25 apartados).
Amplió el catálogo de eventos con la gamificación (aditivos):
`gamificacion.mision_iniciada`, `racha_recuperada`, `bajo_nivel`,
`insignia_desbloqueada`, `ranking_actualizado`, `desafio_completado`,
`competencia_iniciada/finalizada`, `meta_alcanzada`, `meta_grupal`.

### E1.8 — Campañas (orquestación)

No es un sistema de notificaciones: es un **Campaign Orchestration Framework**.
Cada campaña coordina **varios motores** (Promotion, Membership, Benefit, Reward,
Referral, Gamification, Automation, Analytics) para ejecutar una estrategia
completa: evento → Rule Engine → segmentación → selección de estrategia →
ejecución multi-motor → notificaciones → medición → optimización. La coordinación
se hace siempre por eventos/reglas/acciones reutilizables (`INVOKE_MODULE`,
`RUN_WORKFLOW`, `CREATE_EVENT`), nunca con lógica aislada. Incluye el ciclo de
vida (crear/programar/segmentar/ejecutar/seguir/**optimizar**: pausar/reanudar/
clonar), y campañas de bienvenida, estacional, cumpleaños, aniversario, clima,
ubicación, comportamiento, inactividad, membresías, upgrades, referidos, puntos,
objetivos, lanzamiento, flash, happy hour, fechas comerciales (Black Friday/
Navidad/Verano), fidelización, optimización e IA.

Estos playbooks incluyen los apartados **`compatibleMembershipModels`** y
**`compatibleGamification`** (25 apartados). Amplió el catálogo de eventos con la
orquestación (aditivos): `campana.lanzada`, `campana.participacion`,
`campana.conversion`, `campana.pausada`, `campana.reanudada`,
`campana.finalizada`, `campana.hija_iniciada`. Se añadió `automation` como
`EngineRef` (una campaña puede orquestar el Automation Engine).

### E1.7 — Referidos (journey)

Automatiza el journey COMPLETO de un programa de referidos (código generado →
compartido → invitado registrado → primera conversión → validación antifraude →
liberación de recompensa → ranking → escalamiento → embajadores/influencers). No
reimplementa el Referral Engine: lo **opera** y lo coordina con el resto de
motores (la recompensa por un referido puede activar Benefit/Reward/Membership/
Promotion/Campaign/Gamification). Funciona con cualquier modelo (clásico, ambos
ganan, solo invitado/solo quien invita, progresivo, embajadores, influencers,
corporativo, empleados, equipos, afiliados/alianzas).

Estos playbooks incluyen el apartado **`compatibleReferralModels`** (25
apartados), con el vocabulario `REFERRAL_MODELS` (`any` + los 10 modelos del
Referral Engine). Amplió el catálogo de eventos con el journey (aditivos):
`referido.codigo_generado`, `referido.invitacion_compartida`,
`referido.invitado_registrado`, `referido.convirtio`,
`referido.recompensa_pendiente/liberada/vencida`, `referido.fraude_detectado`,
`referido.rechazado`, `referido.embajador_detectado`.

### E1.6 — Membresías (ciclo de vida)

Automatiza el ciclo de vida COMPLETO de **cualquier** membresía (creación →
activación → primer uso → uso recurrente → cambios → renovación → upgrade/
downgrade → suspensión → reactivación → cancelación → expiración → historial).
No hay lógica atada a un plan concreto: funciona con cualquier modelo del
Membership Engine (Unlimited, Créditos, Family, Fleet, Corporate, Seasonal,
Hybrid, Subscription, Prepaid/Wallet, por niveles, por consumo, personalizada…).
Un modelo futuro se integra por configuración, sin código.

Estos playbooks incluyen un apartado extra del Documento Maestro,
**`compatibleMembershipModels`** (25 apartados en total), con el vocabulario
`MEMBERSHIP_MODELS` (`any` + los 20 tipos del Membership Engine). Amplió el
catálogo de eventos con el ciclo de vida (aditivos): `membresia.creada`,
`membresia.activada`, `membresia.primer_uso`, `membresia.renovada`,
`membresia.upgrade`, `membresia.downgrade`, `membresia.suspendida`,
`membresia.reactivada`, `membresia.cancelada`, `membresia.por_vencer`.

### E1.5 — Recuperación

Detecta la caída de actividad, previene el abandono y recupera inactivos con
estrategias **escalonadas por nivel de riesgo** (no solo "30 días sin visitar").
Incluye un framework de estados universal (`RECOVERY_STATES`: activo →
riesgo_bajo → riesgo_medio → riesgo_alto → inactivo → recuperado) cuyas reglas
de transición son configurables vía Rule Engine. Cubre alerta de riesgo,
inactividad con selección de estrategia, recuperación escalonada, VIP en riesgo,
membresía vencida, beneficio por vencer, cliente que ignora campañas,
recuperación conductual, por puntos/XP, estacional, última oportunidad, reingreso
confirmado, encuesta de abandono, dunning por pago fallido, recuperación
predictiva con IA y reactivación de exmiembros.

Amplió el catálogo de eventos con eventos **universales** de recuperación
(aditivos): `cliente.cambio_nivel_riesgo`, `cliente.inactivo`,
`cliente.recuperado`, `cliente.ignoro_campana`, `membresia.vencida`,
`beneficio.por_vencer`. Añadió `nivelesRiesgo` y `tiempoInactividad` a las
opciones editables.

### E1.4 — Frecuencia

Aumenta la frecuencia de compra/visita/consumo, crea hábitos y eleva el LTV.
No son automatizaciones simples por tiempo: reaccionan al **comportamiento**
(frecuencia en descenso/ascenso, rachas, alta actividad, cambios de horario/
sucursal/gasto, uso de beneficios, estacionalidad) e incluyen un gancho de IA
predictiva (`FREQ-015`) integrable vía `INVOKE_MODULE` sin alterar la lógica.

Amplió el catálogo de eventos con eventos **universales** de comportamiento
(aditivos): `cliente.bajo_frecuencia`, `cliente.subio_frecuencia`,
`cliente.alcanzo_meta_frecuencia`, `cliente.alta_actividad`,
`cliente.cambio_comportamiento`, `cliente.no_usa_beneficios`,
`cliente.riesgo_abandono`. Añadió `sensibilidadDeteccion` a las opciones
editables.

### E1.3 — Primera compra

Aumenta la conversión de registrados en clientes activos: acompaña al cliente
hasta su primera compra/visita/consumo y arranca el journey de fidelización.
Cubre registro sin compra, beneficio inicial sin usar (con extensión de
vigencia), primera visita agendada, abandono de proceso, recomendación del mejor
servicio, oferta personalizada, primera compra completada, compra de alto valor
(VIP), primera compra de referido, membresía como primera transacción, encuesta
post-compra e inicio automático de fidelización.

Amplió el catálogo de eventos con eventos **universales** de conversión
(aditivos): `cliente.primera_compra`, `cliente.compra_alto_valor`,
`cliente.proceso_abandonado`, `cliente.dio_feedback`,
`cliente.inscrito_fidelizacion`.

### E1.2 — Onboarding

Convierte a un usuario recién registrado en un cliente activo durante sus
primeros días: bienvenida, completar perfil, verificación de cuenta, primer
beneficio con expiración, descubrimiento de funciones, primera visita,
presentación de membresías/puntos/referidos, preferencias, consentimientos,
encuesta inicial, tutorial in-app, primer hito, onboarding multicanal, drip de
bienvenida, rescate de onboarding estancado y graduación.

Esta fase amplió el catálogo de eventos del Automation Engine con eventos
**universales** de ciclo de vida temprano (aditivos, ninguna industria):
`cliente.completo_perfil`, `cliente.verifico_cuenta`,
`cliente.configuro_preferencias`, `cliente.acepto_consentimiento`,
`cliente.primera_visita`, `cliente.completo_onboarding`.

Cada fase futura registra su archivo en [`index.ts`](./index.ts) sin tocar las
anteriores (aditivo).

## API

```ts
import {
  ALL_PLAYBOOKS,
  ACQUISITION_PLAYBOOKS,
  getPlaybook,
  playbooksByCategory,
  playbooksForIndustry,
  playbookToCreateData,
  isCompatibleWith,
  INDUSTRIES,
  createAutomationEngine,
} from '@/lib/automation'

// Consultar la biblioteca
const captacion = playbooksByCategory('captacion')      // 20
const paraGym = playbooksForIndustry(INDUSTRIES.GYM)    // universales incluidos
const pb = getPlaybook('ACQ-001')!

// Instalar como automatización real (reusa el Automation Engine)
const { service } = createAutomationEngine()
const auto = await service.createAutomation(playbookToCreateData(pb, companyId))
await service.publishAutomation(auto.id)
// El playbook queda registrado con metadata { playbookId, category, industries, engines }
```

`playbookToCreateData(playbook, companyId, overrides?)` convierte el playbook en
`CreateAutomationData` (delegando en `instantiateAutomationTemplate` con la clave
`playbook.<id>`). La empresa puede sobreescribir cualquier apartado editable con
`overrides` antes de instalar.

## Verificación

Cada release se valida con `tsc --noEmit`, `eslint` y un smoke test en memoria
que instala **y ejecuta** un playbook contra el `AutomationEngine` real,
comprobando que la condición BEL corta correctamente y que las acciones
(entrega de beneficio, push con `{{cliente.nombre}}` interpolado) se disparan.

## Migraciones

E1.1 **no requiere migración de base de datos**: los playbooks son código/datos
que se instalan sobre las tablas del Automation Engine ya creadas en E1
(`Automation`, `AutomationRun`, `AutomationEvent`).
