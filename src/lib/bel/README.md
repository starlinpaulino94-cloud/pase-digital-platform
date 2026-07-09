# Business Expression Language (BEL) — Fase 7

El lenguaje oficial de MembeGo para evaluar **expresiones, fórmulas y cálculos**
de negocio. Declarativo, legible, seguro (**sin `eval()`**), extensible e
independiente del lenguaje de programación. Trabaja sobre el Universal Context
Model (Fase 5) y el Business Data Dictionary (Fase 6), y lo consume cualquier
módulo —empezando por el Rule Engine—.

> **Alcance:** SOLO el lenguaje y su motor. Sin promociones, plantillas,
> membresías, QR ni beneficios. Módulo de código; el único cambio fuera de él es
> un endurecimiento de seguridad en el resolvedor de variables (ver §10).

---

## 1. Arquitectura

```
src/lib/bel/
├── index.ts                         # API pública + createExpressionService()
├── domain/
│   ├── ast.ts                       # nodos del AST (Literal, Variable, Arithmetic, Comparison, Logical, Membership, Text, Postfix, Call, List, Object)
│   ├── values.ts                    # tipos BEL en runtime + comparación/igualdad
│   ├── result.ts                    # ExpressionResult + BelError + códigos
│   └── functions.ts                 # FunctionRegistry + conjunto inicial
└── application/
    ├── tokenizer.ts                 # lexer (sin eval)
    ├── parser.ts                    # Pratt/precedence-climbing → AST
    ├── evaluator.ts                 # recorre el AST (tipado, never-throw, seguro)
    ├── validator.ts                 # variables/funciones/sintaxis/aridad
    ├── compiler.ts                  # parseo + caché de AST
    ├── ports.ts                     # ExpressionCache (Noop / InMemory)
    ├── expression-service.ts        # API interna (fachada)
    └── rule-engine-bridge.ts        # ConditionType 'expression' para el Rule Engine
```

---

## 2. Flujo de evaluación

```
"cliente.edad >= 18 AND compra.total > 2000"
        │
   tokenizer  → [IDENT, OP >=, NUMBER, KEYWORD AND, IDENT, OP >, NUMBER, EOF]
        │
   parser (Pratt) → AST:
        Logical(AND)
        ├─ Comparison(>=)  Variable(cliente.edad)  Literal(18)
        └─ Comparison(>)   Variable(compra.total)  Literal(2000)
        │  (compiler cachea el AST por texto)
        │
   evaluator → recorre el AST:
        · Variable → resolveField(context, path)   (Context Model, solo props propias)
        · valida tipos en cada operación           (no suma texto+fecha, etc.)
        · AND/OR con corto-circuito
        · Call → FunctionRegistry (nunca eval)
        │
        ▼
   ExpressionResult { ok, value, type, issues }   (NUNCA lanza)
```

---

## 3. AST

Nodos tipados por `kind`: `Literal`, `Variable`, `List`, `Object`, `Unary`,
`Arithmetic`, `Comparison`, `Logical`, `Membership`, `Text`, `Postfix`, `Call`.
Es la representación interna oficial del BEL; el compilador la cachea y expone
`variables`/`functions`/`constant` (base de constant-folding).

## 4. Operadores

- **Comparación**: `== != > >= < <=`
- **Lógicos**: `AND OR NOT XOR` (AND/OR con corto-circuito)
- **Matemáticos**: `+ - * / %` y potencia `^` (`**`), con precedencia y asociatividad
- **Listas**: `IN`, `NOT IN`, `CONTAINS`, `NOT CONTAINS`
- **Texto**: `STARTS WITH`, `ENDS WITH`, `MATCHES` (regex), `LIKE` (`%`/`_`)
- **Nulos/vacío**: `IS NULL`, `IS NOT NULL`, `EMPTY`, `NOT EMPTY`

## 5. Function Registry

`FunctionRegistry` extensible; añadir una función NO toca el motor. Conjunto
inicial: `IF, COALESCE, MIN, MAX, ABS, ROUND, UPPER, LOWER, LENGTH, CONCAT,
SUBSTRING, TODAY, NOW, YEAR, MONTH, DAY, HOUR, DATEDIFF`. Preparado para cientos.

```ts
bel.registerFunction({ name: 'DOUBLE', minArgs: 1, maxArgs: 1, evaluate: (a) => Number(a[0]) * 2 })
```

## 6. Tipado

Cada operación valida tipos y da errores claros: `"a" + 1` → `TYPE_ERROR`;
`lista > 5` → `TYPE_ERROR`; `AND` con no-booleano → `TYPE_ERROR`. Los tipos BEL
(NUMBER, STRING, BOOLEAN, NULL, DATE, LIST, OBJECT) alinean con el Data Dictionary.

## 7. Variables

Las variables son rutas del Context Model (`cliente.edad`, `compra.total`). El
`Validator` (con un `variableChecker`, normalmente el Data Dictionary) rechaza
variables **no registradas** (`UNKNOWN_VARIABLE`).

## 8. Seguridad

- **Nunca** se usa `eval()` ni se ejecuta código arbitrario: todo es un intérprete
  de AST propio.
- Las funciones son solo las del **registro** (whitelist).
- Las variables se resuelven **solo por propiedades propias** del contexto: no se
  exponen `constructor`, `__proto__`, `toString` ni clases internas (ver §10).
- Sin llamadas externas ni acceso a la BD desde el evaluador.

## 9. API interna y rendimiento

`ExpressionService`: `validate`, `parse`, `compile`, `evaluate`,
`registerFunction`, `listFunctions`. `evaluate` **nunca lanza**. La compilación
separa parseo (una vez) de evaluación (muchas), con caché de AST
(`InMemoryExpressionCache`) → preparado para millones de evaluaciones,
expresiones reutilizables y concurrencia.

---

## 10. Cómo el Rule Engine usa el BEL

`createExpressionConditionType(service)` registra un **ConditionType** `expression`
en el Rule Engine (usa su registro extensible de Fase 2, sin modificarlo):

```ts
import { createExpressionService, createExpressionConditionType } from '@/lib/bel'
import { createDefaultConditionTypeRegistry, RuleEvaluator, createDefaultOperatorRegistry } from '@/lib/rule-engine'

const bel = createExpressionService()
const conditionTypes = createDefaultConditionTypeRegistry()
  .register(createExpressionConditionType(bel))
const evaluator = new RuleEvaluator(createDefaultOperatorRegistry(), conditionTypes)

// Una condición puede ser una expresión BEL completa:
// { conditionType: 'expression', operator: 'is_true', dataType: 'BOOLEAN',
//   field: 'cliente.edad >= 18 AND compra.total > 2000 AND empresa.estado == "ACTIVA"' }
```

El BEL evalúa la expresión contra el contexto → valor booleano → el operador
`is_true` decide. Así el BEL es el lenguaje oficial de reglas **sin tocar** el
Rule Engine.

**Endurecimiento de seguridad (necesario para el BEL):** se ajustó
`resolveField` del Rule Engine para acceder **solo a propiedades propias** del
contexto. Esto no cambia ningún comportamiento legítimo (los datos siempre son
propiedades propias) y cierra el acceso a `constructor`/`__proto__`/`toString`.

## 11. Confirmación de no-regresión

Módulo nuevo en `src/lib/bel/`, **sin cambios de base de datos**. El único cambio
fuera del módulo es el endurecimiento de `resolveField` (solo bloquea claves de
prototipo; no altera datos reales). Ningún flujo de la app invoca el BEL.
Verificado con `tsc --noEmit` (0 errores), `eslint` del módulo (0 warnings) y un
smoke test de 56 aserciones (todos los operadores, precedencia/asociatividad,
funciones anidadas, tipado con errores claros, sintaxis, seguridad sin eval,
validación, compilación/caché, registro de funciones en runtime e integración:
condición BEL evaluada por el Rule Engine).
