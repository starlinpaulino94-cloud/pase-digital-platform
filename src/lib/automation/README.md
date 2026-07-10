# Automation Engine (Fase E1 · Automation Strategy Library)

Motor **universal de automatizaciones**. No crea "unas cuantas automatizaciones":
es un sistema capaz de automatizar **prácticamente cualquier estrategia
comercial** componiendo piezas reutilizables. Una automatización **nunca**
contiene lógica fija.

> Reutiliza OBLIGATORIAMENTE el **Rule Engine** (decisiones) y el **Action
> Engine** (acciones). El motor no evalúa condiciones ni ejecuta acciones por su
> cuenta.

Car Wash es solo la primera industria. La misma biblioteca sirve para
restaurantes, gimnasios, clínicas, hoteles, dealers… Las bibliotecas por
objetivo (captación, onboarding, frecuencia, recuperación, membresías,
referidos, campañas, gamificación, IA) se añaden en **E1.1–E1.10** sin duplicar
lógica.

## Arquitectura de una automatización

```
Trigger → Variables → Ventana/Límites →
  [ Condición (Rule Engine) → Acciones (Action Engine) → Espera ]* →
  Finalización → Registro (auditoría) → Evento (encadenado/analytics)
```

Todo es **editable por empresa**: nombre, descripción, objetivo, trigger,
condiciones, acciones, beneficios, límites, prioridad, horarios, días, fechas,
canales y variables.

## Estructura del módulo

```
domain/            (puro, sin Prisma)
  types.ts             Automation, Step, Trigger, Config, Run, Event
  triggers.ts          catálogo de triggers (EVENT, SCHEDULE, DATE, SEGMENT…)
  events.ts            sistema de eventos (registrado, visita, subió_nivel…)
  variables.ts         variables dinámicas + interpolación {{cliente.nombre}}
  schedule.ts          horarios/días/fechas + límites por sujeto/total
  metrics.ts           KPIs + ROI
application/
  ports.ts             repo, ConditionEvaluator, ActionDispatcher, VariableResolver, EventStore
  automation-engine.ts runner: ejecuta la automatización con auditoría
  automation-service.ts CRUD (crear/publicar/pausar/archivar)
  event-dispatcher.ts  bus de eventos → encadena automatizaciones (guardia de profundidad)
  adapters.ts          BEL (condiciones) + Action Engine (acciones) + variables
infrastructure/
  mappers.ts / prisma-automation-repository.ts / prisma-event-store.ts
templates/
  types.ts             AutomationTemplate + instantiate
  universal.ts         4 plantillas universales base (no Car Wash)
index.ts               composition root (cablea Rule/BEL + Action Engine)
```

## Modelo de datos (aditivo)

- `automations` — automatización configurable (trigger + `config` JSON con pasos).
- `automation_runs` — auditoría de cada ejecución (trigger, reglas evaluadas,
  acciones ejecutadas, resultado, errores, duración).
- `automation_events` — bus de eventos para el encadenado.
- Enum `AutomationRunStatus` (RUNNING/WAITING/SUCCESS/FAILED/SKIPPED).

Ningún flujo existente consume estas tablas todavía.

## Uso

```ts
import { createAutomationEngine, UNIVERSAL_AUTOMATION_TEMPLATES, instantiateAutomationTemplate } from '@/lib/automation'

const { service, dispatcher } = createAutomationEngine()

// 1. Instalar una plantilla universal y publicarla
const tpl = UNIVERSAL_AUTOMATION_TEMPLATES.find(t => t.key === 'universal.bienvenida')!
const a = await service.createAutomation(instantiateAutomationTemplate(tpl, companyId))
await service.publishAutomation(a.id)

// 2. Un evento del sistema dispara las automatizaciones suscritas (encadenado)
await dispatcher.dispatch({ companyId, type: 'cliente.registrado', subjectId: clienteId })
```

## Criterios de aceptación (cumplidos)

- ✅ Todas las condiciones pasan por el **Rule Engine** (vía BEL, el lenguaje
  universal de condiciones).
- ✅ Todas las acciones pasan por el **Action Engine** (vía `ActionDispatcher`).
- ✅ Sin lógica hardcodeada: trigger, condiciones, acciones, esperas, límites,
  horarios y variables viven en `config`.
- ✅ Todo configurable por empresa y **reutilizable por cualquier industria**.
- ✅ Cada ejecución genera **métricas y auditoría** (`automation_runs`).
- ✅ Cada automatización puede ser una **plantilla editable**.
- ✅ **Encadenables**: una automatización emite un evento que dispara otra
  (guardia de profundidad anti-bucle).

## Verificación

`npx tsc --noEmit` · `npx eslint src/lib/automation` · smoke (19/19):
catálogos, interpolación de variables, ventana horaria, flujo end-to-end
(bienvenida con espera, recuperación con condición BEL real, límite por sujeto,
encadenado por evento con emisión de evento de misión) y ROI.
