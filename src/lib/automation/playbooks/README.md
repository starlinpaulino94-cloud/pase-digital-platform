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
| E1.6–E1.10 | membresías, referidos, campañas, gamificación, IA | _(próximas)_ | — |

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
