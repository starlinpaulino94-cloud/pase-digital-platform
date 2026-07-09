# Motor Universal de Reglas (Rule Engine) — Fases 1 y 2

Infraestructura genérica, multi-tenant y **desacoplada del negocio** para
evaluar reglas configurables. Es la base sobre la que las fases futuras
construirán promociones, membresías, beneficios, QR inteligentes, puntos,
cashback, referidos, automatizaciones, cupones, campañas y gamificación **sin
volver a tocar el núcleo**.

> **Fase 1** construyó la arquitectura base (documentada abajo). **Fase 2**
> (sección final) añade el *lenguaje universal de evaluación*: árboles de
> condiciones AND/OR/NOT/XOR, sistema de tipos, operadores tipados, registro de
> tipos de condición, validación estática y un `RuleResult` estructurado. Salta
> a **[§ Fase 2](#fase-2--lenguaje-universal-de-evaluación)** para lo nuevo.

> **Alcance de esta fase:** SOLO la arquitectura del motor. No hay lógica de
> promociones ni acciones de negocio implementadas, y **ningún flujo actual de
> la aplicación invoca el motor**. El comportamiento del sistema no cambia.

---

## 1. Principio rector

El motor **nunca** contiene código como `if empresa == "Car Wash"` o
`if tipo == "Restaurante"`. Toda la lógica vive como **datos** (reglas,
condiciones, acciones) que el motor interpreta. Añadir una estrategia comercial
nueva = insertar filas, no desplegar código.

Esto se logra con dos ideas:

1. **Campos genéricos**: una condición es `campo` (dot-path) + `operador` +
   `valor`. El motor resuelve la ruta contra un contexto genérico y compara. No
   sabe qué significa `cliente.puntos`; solo lo lee.
2. **Registros extensibles**: operadores y acciones se registran en runtime. Se
   añaden nuevos sin modificar el motor (Open/Closed).

---

## 2. Arquitectura por capas (Clean Architecture + DDD)

```
                         ┌───────────────────────────────────────────┐
                         │                 index.ts                   │
                         │      (API pública + composition root)      │
                         │        createRuleEngine(options?)          │
                         └───────────────────────────────────────────┘
                                            │ inyecta
                 ┌──────────────────────────┼──────────────────────────┐
                 ▼                          ▼                           ▼
        ┌─────────────────┐      ┌─────────────────────┐      ┌──────────────────┐
        │   APPLICATION   │      │       DOMAIN        │      │ INFRASTRUCTURE   │
        │  (orquestación) │──────│    (reglas puras)   │◄─────│   (Prisma)       │
        └─────────────────┘ usa  └─────────────────────┘ impl └──────────────────┘
        │ RuleEngine      │      │ types (Rule…)       │      │ PrismaRule       │
        │ RuleEvaluator   │      │ RuleContext         │      │   Repository     │
        │ ActionExecutor  │      │ OperatorRegistry    │      │ PrismaExecution  │
        │ ports (RuleRepo,│      │ ConditionEvaluator  │      │   LogSink        │
        │  ExecutionLog   │      │ ActionRegistry      │      │ mappers          │
        │  Sink)          │      │ errors              │      │                  │
        └─────────────────┘      └─────────────────────┘      └──────────────────┘

   Dirección de dependencias:  infrastructure ──► application ──► domain
   (el dominio no depende de NADA; la infraestructura depende de abstracciones)
```

### Capas

| Capa | Carpeta | Responsabilidad | Depende de |
|------|---------|-----------------|------------|
| **Dominio** | `domain/` | Tipos puros, contexto universal, operadores, evaluación de condiciones, registro de acciones, errores. Cero dependencias externas. | nada |
| **Aplicación** | `application/` | Orquesta el caso de uso (evaluar → ejecutar → auditar). Define los **puertos** que necesita. | dominio |
| **Infraestructura** | `infrastructure/` | Implementa los puertos con Prisma; traduce filas ↔ dominio. | aplicación + dominio |
| **Composition root** | `index.ts` | Cablea implementaciones por defecto y expone la API pública. | todo |

Los 5 módulos que pidió la especificación mapean así:

- **Rule Engine Core** → `application/rule-engine.ts` (orquestador) + dominio.
- **Rule Repository** → puerto `application/ports.ts` + `infrastructure/prisma-rule-repository.ts`.
- **Rule Evaluator** → `application/rule-evaluator.ts` + `domain/conditions.ts`.
- **Action Executor** → `application/action-executor.ts` + `domain/actions.ts`.
- **Rule Context** → `domain/context.ts`.

---

## 3. Modelo de datos

```
┌───────────────┐        ┌────────────────┐        ┌──────────────────┐
│   companies   │ 1    * │   rule_groups  │ 1    * │      rules       │
│  (existente)  │───────▶│  (agrupación   │───────▶│  (regla config.) │
└───────────────┘        │   funcional)   │  0..1  └──────────────────┘
        │                └────────────────┘                 │ 1
        │ 1                                                  │
        │                          ┌─────────────────────────┼───────────────┐
        │                          ▼ *                        ▼ *             │
        │                 ┌──────────────────┐      ┌──────────────────┐      │
        │                 │ rule_conditions  │      │   rule_actions   │      │
        │                 │ campo/operador/  │      │ tipo/params      │      │
        │                 │ valor/tipoValor  │      │ (sin handler aún)│      │
        │                 └──────────────────┘      └──────────────────┘      │
        │ 1                                                                    │
        │                          ┌──────────────────────┐                   │
        └─────────────────────────▶│  rule_execution_logs │◄──────────────────┘
                               *    │  matched/resultado/  │  0..1 (SetNull)
                                    │  contexto/duracionMs │
                                    └──────────────────────┘
```

**Relaciones y borrado:**

- `rule_groups`, `rules`, `rule_execution_logs` → `companies` con `ON DELETE CASCADE`
  (si se borra la empresa, se limpia todo su motor). Multi-tenant: todo cuelga de `companyId`.
- `rules.groupId` → `rule_groups` con `ON DELETE SET NULL` (borrar un grupo no borra sus reglas).
- `rule_conditions`, `rule_actions` → `rules` con `ON DELETE CASCADE`.
- `rule_execution_logs.ruleId` → `rules` con `ON DELETE SET NULL` (la auditoría sobrevive a la regla).

**Campos clave de `rules`:**

- `status` (`DRAFT`/`PUBLISHED`/`ARCHIVED`): ciclo de vida.
- `activo` (bool): interruptor de encendido, **independiente** del ciclo de vida.
- `prioridad` (int): mayor = se evalúa primero.
- `version` (int): se incrementa en cada cambio (base para versionado).
- `matchType` (`ALL`/`ANY`): AND / OR entre condiciones.
- `validoDesde` / `validoHasta`: ventana de vigencia opcional.

Una regla se evalúa **solo si**: `activo = true` **Y** `status = PUBLISHED` **Y**
está dentro de la ventana de vigencia (ver `isRuleEvaluable`).

---

## 4. Flujo interno de una evaluación

```
createRuleEngine()                → construye el motor con dependencias por defecto
        │
engine.run({ companyId, groupKey? }, context)
        │
        ├─▶ 1. repository.findApplicable()   → carga reglas PUBLISHED + activas + vigentes
        │                                       (SQL filtra por empresa/estado/ventana/grupo)
        │
        ├─▶ 2. filtra con isRuleEvaluable()   → red de seguridad (definición canónica del dominio)
        │       y ordena por prioridad desc
        │
        └─▶ 3. por cada regla:
                 │
                 ├─ RuleEvaluator.evaluate(rule, context)
                 │     └─ por cada condición: resolveField(context, campo)
                 │                            + OperatorRegistry.get(operador).evaluate(actual, valor)
                 │     └─ combina ALL (AND, corto-circuito) / ANY (OR, corto-circuito)
                 │
                 ├─ si matched → ActionExecutor.execute(rule, context)
                 │     └─ por cada acción: ActionRegistry.get(tipo)
                 │                          · sin handler (Fase 1) → NO_HANDLER
                 │                          · con handler          → EXECUTED / FAILED (aislado)
                 │
                 └─ logSink.record(...)       → auditoría (Noop por defecto: descarta)
        │
        ▼
   RuleEngineRunResult { evaluated, matched, results[] }
```

**Garantías:**

- **Aislamiento por regla**: un error evaluando/ejecutando una regla no aborta las demás; se captura y se audita.
- **Determinismo**: el `timestamp` del contexto es inyectable → pruebas reproducibles.
- **Sin efectos en Fase 1**: sin handlers registrados, `run()` no produce ningún cambio de negocio.

---

## 5. Justificación de decisiones técnicas

| Decisión | Por qué |
|----------|---------|
| **`campo`/`operador`/`valor` en vez de lógica fija** | Permite crear reglas sin desplegar código. El motor es un intérprete, no un catálogo de `if`. |
| **Operadores y acciones como registros (Map) inyectables** | Open/Closed + DIP: añadir un operador o una acción es registrar un objeto, no editar el núcleo. |
| **`operador` y `tipo` como `String`, no enum de Prisma** | Añadir operadores/acciones **no requiere migración** de BD. Enums (status, matchType) sí son cerrados y pequeños → ahí sí conviene el enum por integridad. |
| **`valor` como `JSON`** | Un valor esperado puede ser número, string, booleano, lista o rango. JSON lo cubre sin columnas por tipo. `tipoValor` guía la coerción al comparar. |
| **Puertos en `application`, implementación en `infrastructure`** | Dependency Inversion: el motor depende de `RuleRepository`/`ExecutionLogSink` (abstracciones), nunca de Prisma. Sustituible por memoria/tests. |
| **Dominio sin importar Prisma; mappers traducen** | El núcleo es testeable en aislamiento y sobrevive a cambios de ORM/esquema. |
| **`RuleContext` como bolsa de namespaces + dot-paths** | Extensible: cada fase añade `data.loquesea` sin que el motor cambie. |
| **`status` (ciclo de vida) separado de `activo` (interruptor)** | Se puede apagar temporalmente una regla publicada sin archivarla, y tener borradores que nunca se evalúan. |
| **`version` incremental** | Base para versionado/auditoría de cambios de reglas. |
| **`ExecutionLogSink` con Noop por defecto** | Cumple "preparar la arquitectura de logs sin registrar todavía". Activar auditoría = inyectar el sink Prisma. |
| **Acción sin handler → `NO_HANDLER` (no error)** | En Fase 1 las acciones existen como estructura; el motor documenta qué haría sin ejecutar nada. |
| **Corto-circuito en ALL/ANY** | Eficiencia: no evalúa condiciones de más una vez decidido el veredicto. |
| **Índices `(companyId, status, activo)` y `(companyId, prioridad)`** | La consulta caliente del motor filtra por empresa/estado y ordena por prioridad. |

---

## 6. Extensibilidad (cómo crecerá sin tocar el núcleo)

```ts
// Añadir un operador nuevo (ej. día de la semana):
const operators = createDefaultOperatorRegistry().register({
  id: 'day_of_week',
  description: 'El día de la semana está en la lista',
  evaluate: (actual, expected) =>
    Array.isArray(expected) && expected.includes(new Date(actual as string).getDay()),
})

// Registrar un handler de acción real (fase futura):
const actions = new ActionRegistry().register({
  type: 'grant_benefit',
  async execute({ action, context }) {
    // …lógica de negocio de la fase correspondiente…
    return { actionId: action.id, type: action.type, status: 'EXECUTED' }
  },
})

// Activar auditoría persistente:
const engine = createRuleEngine({
  operators,
  actions,
  logSink: new PrismaExecutionLogSink(prisma),
})
```

Todo esto se inyecta por `createRuleEngine(options)`; el motor no se modifica.

---

## 7. Mejoras futuras (deliberadamente fuera de Fase 1)

- **Grupos de condiciones anidados** (AND/OR arbitrariamente anidados) además del `matchType` plano actual.
- **Historial de versiones inmutable** (tabla `rule_versions` con snapshot por cambio) sobre el `version` int actual.
- **Caché de reglas por empresa/grupo** con invalidación, para evaluaciones de alta frecuencia.
- **Validación de esquema de condiciones/acciones** (Zod) al guardar, con catálogo de campos disponibles por namespace.
- **UI de constructor de reglas** que consuma `OperatorRegistry.list()` y el catálogo de acciones.
- **Modo "dry-run"/simulación** para probar una regla contra contextos de ejemplo (la estructura ya lo permite: `evaluate` devuelve el detalle por condición).
- **Ejecución transaccional de acciones** cuando los handlers toquen la BD (agrupar en `prisma.$transaction`).
- **Métricas/observabilidad** sobre `rule_execution_logs` (tasa de match, latencia por regla).

---

## 8. Confirmación de no-regresión

Esta fase **solo añade**:

- Enums y tablas nuevas (`rule_groups`, `rules`, `rule_conditions`, `rule_actions`, `rule_execution_logs`) + relaciones inversas en `companies`. La migración `20260725_add_rule_engine_core` **no altera ninguna tabla existente**.
- Un módulo nuevo y autocontenido en `src/lib/rule-engine/`.

**No se modificó** autenticación, usuarios, empresas, panel administrativo,
membresías, promociones, QR ni frontend. Ningún archivo existente cambió su
comportamiento, y **nada de la app invoca el motor todavía**. Verificado con
`tsc --noEmit` (0 errores), `eslint` (0 warnings) y un smoke test de 20
aserciones sobre el motor con repositorio en memoria.

---

# Fase 2 — Lenguaje universal de evaluación

Fase 2 convierte el motor en un **lenguaje** capaz de expresar y evaluar
condiciones de cualquier negocio sin tocar código. Todo lo de Fase 1 sigue
funcionando igual; esto es aditivo.

## Novedades

| Componente | Archivo | Qué aporta |
|------------|---------|------------|
| **Sistema de tipos** | `domain/data-types.ts` | `DataType` (TEXT, NUMBER, DATE, TIME, BOOLEAN, LIST, OBJECT, ENUM, JSON) + compatibilidad. |
| **Operadores tipados** | `domain/operators.ts` | 22 operadores con `supportedTypes` y `arity`. Nuevos: `not_contains`, `is_empty`, `is_not_empty`, `not_between`. |
| **Operadores lógicos** | `domain/logical.ts` | `AND` / `OR` / `NOT` / `XOR` como funciones puras. |
| **Árbol de condiciones** | `domain/condition-tree.ts` | Nodos grupo/hoja anidables sin límite + constructores (`and`, `or`, `not`, `xor`, `leaf`). |
| **Condition Engine** | `domain/condition-types.ts` | Registro extensible de *tipos de condición* (`field`, `current_datetime`, `current_time`, `channel`, …). |
| **Rule Result** | `domain/rule-result.ts` | Respuesta estructurada: validez, árbol de resultados, conteos, issues, motivo de rechazo, duración. |
| **Tree Evaluator** | `application/tree-evaluator.ts` | Evalúa el árbol recursivamente; **nunca lanza**: los errores son datos (issues). |
| **Rule Validator** | `application/rule-validator.ts` | Validación estática: operadores/ tipos de condición inexistentes, tipos incompatibles, config inválida. |
| **Rule Compiler** | `application/rule-compiler.ts` | Compila regla → árbol (puente Fase 1 plano ↔ Fase 2 árbol). Punto natural de caché. |
| **Rule Cache** | `application/ports.ts` | Puerto de caché (`NoopRuleCache` por defecto) para escalar a miles de reglas. |

## Flujo de evaluación (Fase 2)

```
evaluator.evaluateToResult(rule, context)
        │
        ├─▶ buildConditionTree(rule)        · usa rule.conditionTree si existe
        │                                     · si no, compila desde conditions + matchType
        │                                       (ALL→AND, ANY→OR; vacío→AND vacío = true)
        │
        └─▶ TreeEvaluator.evaluate(nodo)     (recursivo, never-throw)
                 │
                 ├─ grupo → evalúa hijos y combina con AND/OR/NOT/XOR
                 │
                 └─ condición (hoja):
                       1. ConditionType registrado?  no → issue UNKNOWN_CONDITION_TYPE
                       2. Operador registrado?        no → issue UNKNOWN_OPERATOR
                       3. dataType ∈ operator.supportedTypes?  no → issue INCOMPATIBLE_TYPE
                       4. actual = conditionType.resolve(cond, context)
                          passed = operator.evaluate(actual, expected)   (try/catch → issue)
        │
        ▼
   RuleResult { valid, outcome (árbol), evaluatedConditions, passed, failed,
                issues[], rejectionReason, durationMs, details }
```

El motor (`RuleEngine.run`) usa este `RuleResult` para decidir si ejecuta
acciones y qué audita (motivo de rechazo + issues incluidos en el log).

## Diagrama del árbol de condiciones

```
                 Rule
                  │  conditionTree (o compilado de matchType)
                  ▼
             ┌─────────┐   operator: OR
             │  GRUPO  │
             └────┬────┘
        ┌─────────┴──────────┐
        ▼                    ▼
   ┌─────────┐          ┌─────────┐  operator: NOT
   │  GRUPO  │ AND      │  GRUPO  │
   └────┬────┘          └────┬────┘
    ┌───┴───┐                │
    ▼       ▼                ▼
 [cond]   [cond]          [cond]      ← hojas: campo·operador·valor·dataType
 puntos   activa           vip

 Persistencia: rule_condition_groups (parentId auto-referencial) + rule_conditions.groupId
```

## Cómo añadir una CONDICIÓN nueva (sin tocar el núcleo)

Un "tipo de condición" sabe **resolver** el valor real desde el contexto. Para
soportar, p. ej., "antigüedad de la membresía":

```ts
import { createDefaultConditionTypeRegistry, createRuleEngine } from '@/lib/rule-engine'

const conditionTypes = createDefaultConditionTypeRegistry().register({
  id: 'membership_age_days',
  description: 'Días desde el alta de la membresía.',
  dataType: 'NUMBER',
  resolve: ({ context }) => {
    const alta = (context.data.membresia as { altaEn?: string })?.altaEn
    return alta ? Math.floor((context.timestamp.getTime() - new Date(alta).getTime()) / 86_400_000) : null
  },
})

const engine = createRuleEngine({ conditionTypes })
```

La condición en BD referenciará `conditionType = "membership_age_days"`. El
evaluador, el validador y el motor lo usan sin cambiar una línea (Open/Closed).

## Cómo añadir un OPERADOR nuevo (sin tocar el núcleo)

```ts
import { createDefaultOperatorRegistry, createRuleEngine } from '@/lib/rule-engine'

const operators = createDefaultOperatorRegistry().register({
  id: 'divisible_by',
  description: 'El número real es divisible por el esperado.',
  arity: 'binary',
  supportedTypes: ['NUMBER'],
  evaluate: (actual, expected) =>
    typeof actual === 'number' && typeof expected === 'number' && expected !== 0 && actual % expected === 0,
})

const engine = createRuleEngine({ operators })
```

`supportedTypes` hace que el validador rechace automáticamente usarlo con tipos
que no sean `NUMBER`. Lo mismo aplica para tipos de dato nuevos: se añaden a
`DataType` y se declaran en los operadores compatibles.

## Grupos y operadores lógicos

- **AND**: todos los hijos se cumplen (grupo vacío → `true`).
- **OR**: al menos uno (grupo vacío → `false`).
- **NOT**: negación del AND de los hijos (con un hijo = negarlo).
- **XOR**: exactamente uno de los hijos se cumple.

Se anidan sin límite para formar `(A y B) o (no C)`. Se construyen en código con
`and()/or()/not()/xor()/leaf()` o se persisten en `rule_condition_groups`.

## Tipado y validaciones automáticas

Cada condición declara su `dataType`. El motor **rechaza comparaciones
incompatibles** (ej. `gt` sobre `BOOLEAN`) devolviendo un issue
`INCOMPATIBLE_TYPE`, nunca un resultado erróneo silencioso. `RuleValidator`
detecta **antes de evaluar**: operador inválido, tipo de condición inexistente,
tipo incompatible y config inválida (regex mal formada, `between` sin `[min,max]`,
`in` sin lista). Todo se reporta como `EvaluationIssue[]`, sin excepciones.

## Rendimiento (arquitectura preparada)

- **Compilación**: `compileRule()` construye el árbol una vez; reutilizable.
- **Caché**: puerto `RuleCache` (`NoopRuleCache` por defecto) + `ruleCacheKey()`;
  el motor consulta caché antes que el repositorio. Implementación LRU/Redis con
  invalidación por `updatedAt` = enchufar sin tocar el motor.
- **Índices**: `rule_condition_groups(ruleId)`, `(parentId)`, `rule_conditions(groupId)`.
- **Carga diferida**: el repositorio ya restringe por empresa/estado/grupo/ventana.

## Logging

`ExecutionLogSink` recibe por evaluación: hora (`createdAt`), duración
(`durationMs`), regla, resultado (`matched`), **motivo del rechazo**, **issues**
(condición/campo que falló y por qué), errores y snapshot del contexto. Por
defecto no persiste (`NoopExecutionLogSink`); inyectar `PrismaExecutionLogSink`
lo activa.

## Confirmación de no-regresión (Fase 2)

Aditivo y retrocompatible: se añadieron 1 enum, 1 tabla y 3 columnas con
DEFAULT (migración `20260726_add_rule_condition_groups`), y archivos nuevos +
extensiones al módulo `rule-engine`. Las reglas planas de Fase 1 siguen
evaluándose igual (el compilador las envuelve en un grupo AND/OR). **Ningún
flujo de la app invoca el motor**; nada del comportamiento existente cambió.
Verificado con `tsc --noEmit` (0 errores), `eslint` (0 warnings) y un smoke test
de 29 aserciones (árboles AND/OR/NOT/XOR anidados, tipado, never-throw,
validación estática, operadores/condition-types nuevos y compatibilidad Fase 1).

---

# Fase 3 — Motor Universal de Acciones (Action Engine)

Fase 3 construye el sistema que **ejecuta acciones** cuando una regla se cumple.
El Rule Engine decide *"la regla se cumple"*; el Action Engine decide *"qué debe
ocurrir"*. Cada acción es un módulo independiente (Open/Closed); el motor nunca
conoce acciones concretas. Aditivo y retrocompatible con Fases 1–2.

## Novedades

| Componente | Archivo | Qué aporta |
|------------|---------|------------|
| **Action Context** | `domain/action-context.ts` | Contexto universal de ejecución + `actionContextFromRule()` (incluye el `RuleResult` calculado). |
| **Action Result** | `domain/action-result.ts` | Resultado estándar por acción (estado, output, errores, warnings, intentos, tiempo) + informe agregado. |
| **Action Catalog** | `domain/action-catalog.ts` | Catálogo universal (47 acciones en 10 categorías) como datos, sin lógica. |
| **Action Handlers** | `domain/actions.ts` | `ActionHandler` con `execute` + `rollback` opcional; `ActionRegistry` con validación de catálogo. |
| **Action Executor** | `application/action-executor.ts` | Ejecución secuencial por prioridad, múltiple, reintentos, obligatoria/opcional, aislamiento de errores y rollback. |
| **Config por datos** | `rule_actions` (BD) | `obligatoria`, `maxReintentos`, `activa`, `version` + `params` + `orden`. |

## Arquitectura (5 piezas que pidió la spec)

- **Action Registry** → `ActionRegistry` (registro central por `type`).
- **Action Executor** → `application/action-executor.ts`.
- **Action Handlers** → puerto `ActionHandler` (un módulo por acción).
- **Action Context** → `domain/action-context.ts`.
- **Action Result** → `domain/action-result.ts`.

## Flujo de ejecución de acciones

```
Regla válida (RuleResult.valid === true)
        │
RuleEngine construye ActionContext = datos del contexto + ruleId + ruleResult
        │
ActionExecutor.execute(rule, actionContext)
        │
        ├─ ordena acciones por `order` asc (PRIORIDAD)
        │
        └─ por cada acción (SECUENCIAL, aislada):
             │
             ├─ ¿activa? no → SKIPPED
             ├─ ¿handler registrado? no → NO_HANDLER   (Fase 3: caso normal)
             ├─ ejecuta con reintentos (1 + maxReintentos):
             │     éxito → EXECUTED (+ output generado)
             │     agota intentos → FAILED (errores capturados)
             │
             └─ si FAILED y la acción es OBLIGATORIA:
                   · rollbackOnRequiredFailure → compensa las EXECUTED (reverse) → ROLLED_BACK
                   · stopOnRequiredFailure → corta la secuencia
        │
        ▼
   ActionExecutionReport { results[], executed, failed, skipped, noHandler,
                           rolledBack, success, durationMs }
```

Ejemplo de ejecución múltiple soportada:
`aplicar descuento → agregar puntos → consumir crédito → registrar historial →
enviar notificación → actualizar estadísticas` — cualquier cantidad de acciones,
cada una con su prioridad y su bandera obligatoria/opcional.

## Catálogo universal de acciones (10 categorías, 47 tipos)

```
BENEFICIOS      apply/remove/update/suspend/activate_benefit
DESCUENTOS      apply_discount_percent/fixed/category/product
CREDITOS        add/consume/transfer/expire_credits
PUNTOS          add/consume/revert/transfer_points
MEMBRESIAS      activate/renew/suspend/freeze/cancel_membership · update_membership_level
CUPONES         create/activate/deactivate/consume/expire_coupon
QR              activate/invalidate/regenerate/register_use/block_qr
NOTIFICACIONES  send_email/push/sms/whatsapp/internal_notification/webhook
AUDITORIA       record_event/record_history/create_log/save_evidence
AUTOMATIZACION  run_workflow/schedule_task/create_event/invoke_module
```

Referenciables con constantes tipadas: `ACTION_TYPES.APPLY_DISCOUNT_PERCENT`, etc.
**Ninguno tiene lógica**: solo la arquitectura queda lista.

## Cómo añadir una acción nueva (sin tocar el núcleo)

Solo dos pasos, como exige la spec:

```ts
import { ActionRegistry, createRuleEngine, ACTION_TYPES, makeActionResult } from '@/lib/rule-engine'

// 1. Crear el Action Handler (un módulo independiente).
const applyDiscount = {
  type: ACTION_TYPES.APPLY_DISCOUNT_PERCENT,
  supportsRollback: true,
  async execute({ action, context }) {
    const pct = Number(action.params.percent ?? 0)
    // …lógica de negocio de la fase correspondiente…
    return makeActionResult({
      actionId: action.id, type: action.type, status: 'EXECUTED',
      required: action.required, output: { descuentoAplicado: pct },
    })
  },
  async rollback({ action }) { /* deshacer el efecto */ },
}

// 2. Registrarlo. El Rule Engine y el Action Executor NO cambian.
const engine = createRuleEngine({ actions: new ActionRegistry().register(applyDiscount) })
```

La acción se configura por datos en `rule_actions` (`tipo`, `params`, `orden`,
`obligatoria`, `maxReintentos`, `activa`, `version`). Nunca hay `if (type === …)`.

## Manejo de errores

- **Aislamiento**: el fallo de una acción NO detiene el resto (salvo
  `stopOnRequiredFailure`). Cada `ActionResult` dice exactamente qué falló y por qué.
- **Obligatoria vs opcional**: `success` del informe es `false` solo si falla una
  acción **obligatoria**; una opcional fallida no hunde la ejecución.
- **Reintentos**: `maxReintentos` por acción; los intentos se cuentan en `attempts`.
- **Rollback**: los handlers pueden declarar `supportsRollback` + `rollback()`; el
  executor compensa en orden inverso las acciones ya ejecutadas cuando una
  obligatoria falla (activable con `rollbackOnRequiredFailure`).

## Rendimiento (arquitectura preparada)

- Ejecución secuencial hoy; la interfaz `ActionExecutorOptions` y el informe con
  tiempos dejan la puerta a **concurrencia**, **colas de eventos** y
  **procesamiento asíncrono** sin cambiar los handlers.
- El `ActionContext` es serializable (datos + snapshot), apto para encolar.
- Reutiliza la caché de reglas de Fase 2 (`RuleCache`) para escalar la carga.

## Confirmación de no-regresión (Fase 3)

Aditivo: 4 columnas con DEFAULT en `rule_actions`
(`20260727_add_action_engine_config`) + archivos nuevos y extensiones al módulo.
El `ActionOutcome` de Fase 1 se conserva como tipo deprecado con un mapeador
(`toActionOutcome`). **Ningún flujo de la app invoca el motor**; no hay handlers
de negocio registrados (todo resulta `NO_HANDLER`), así que no se produce ningún
efecto. Nada del comportamiento existente cambió. Verificado con `tsc --noEmit`
(0 errores), `eslint` del módulo (0 warnings) y un smoke test (prioridad,
ejecución múltiple, reintentos, obligatoria/opcional, aislamiento de errores,
rollback→ROLLED_BACK, NO_HANDLER y catálogo).
