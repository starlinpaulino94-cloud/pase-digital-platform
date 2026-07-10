# Arquitectura de Decisiones Inteligentes (Fase E1.10)

**No es un "AI Engine".** Es una arquitectura **desacoplada de cualquier
proveedor tecnológico**, preparada para tomar decisiones inteligentes con la
información del negocio (reglas, comportamiento, estadísticas, historial). Hoy
existe **un único proveedor** (Rule Based); mañana se pueden añadir AI / ML /
Predictive / Statistical / Custom **sin modificar los motores existentes** ni la
experiencia de las empresas — que **nunca ven "IA"**, solo funcionalidades
inteligentes.

## Regla de oro

```
Evento → Rule Engine → Analytics → Decision Engine → Recommendation Engine → Action Engine → Resultado → Métricas
```

- **Decision Engine** → DECIDE. Nunca ejecuta.
- **Recommendation Engine** → PRODUCE recomendaciones. Nunca las ejecuta.
- **Action Engine** → EJECUTA (siempre, vía las automatizaciones/playbooks).

## Piezas

| Pieza | Archivo | Rol |
| --- | --- | --- |
| `DecisionEngine` | [`application/decision-engine.ts`](./application/decision-engine.ts) | Enruta a proveedor(es) y devuelve una decisión. Soporta **múltiples proveedores activos** (ensemble). |
| `RecommendationEngine` | [`application/recommendation-engine.ts`](./application/recommendation-engine.ts) | Convierte una decisión en `Recommendation` lista para el Action Engine. |
| `PredictionFramework` | [`application/prediction.ts`](./application/prediction.ts) | Churn / renovación (hoy por reglas/umbrales). |
| `OptimizationEngine` | [`application/optimization.ts`](./application/optimization.ts) | Compara resultados históricos y recomienda la mejor estrategia a reutilizar. |
| `DecisionProvider` (puerto) | [`application/provider.ts`](./application/provider.ts) | Interfaz de proveedor + `DecisionProviderRegistry`. |
| `RuleBasedProvider` | [`providers/rule-based-provider.ts`](./providers/rule-based-provider.ts) | **Único proveedor actual.** Decide con reglas, umbrales y scoring. |

## Tipos de decisión (`DecisionKind`)

`recommend_promotion`, `recommend_membership`, `recommend_benefit`,
`recommend_campaign`, `recommend_reward`, `predict_churn`, `predict_renewal`,
`detect_opportunity`, `optimize_strategy`, `next_best_action`.

`next_best_action` puede recomendar **explícitamente** `wait` / no ejecutar
ninguna acción — decidir "no hacer nada" es una decisión de primera clase.

## Uso

```ts
import { createDecisionSystem } from '@/lib/decision'

const { engine, recommendations, prediction, optimization, registry } = createDecisionSystem()

// Decidir (no ejecuta)
const decision = await engine.decide({
  kind: 'next_best_action',
  context: { subjectId: 'c1', facts: { 'cliente.compras': 0 } },
})

// Recomendar (produce acción para el Action Engine; no la ejecuta)
const recs = await recommendations.recommend({
  kind: 'recommend_benefit',
  context: { subjectId: 'c1', facts: { 'cliente.segmento': 'premium' } },
  options: { candidates: [{ ref: 'benefit', id: 'CAR-004', score: 0.5 }] },
})

// Predicción
const churn = await prediction.churnRisk({ subjectId: 'c1', facts: { /* … */ } })

// Optimización
const best = optimization.bestStrategy([{ strategy: 'A', roi: 2, conversion: 0.1 }])
```

## Añadir IA en el futuro (sin tocar nada)

```ts
class AiProvider implements DecisionProvider {
  readonly kind = 'ai'
  supports(kind: DecisionKind) { return true }
  async decide(request: DecisionRequest): Promise<DecisionResult> { /* … */ }
}

const { registry } = createDecisionSystem()
registry.register(new AiProvider(), { priority: 10 }) // convive con rule_based
```

Los playbooks de decisiones (`src/lib/automation/playbooks/decision.ts`, `DEC-*`)
tienen un campo `decisionProvider` editable (`rule_based` hoy). Cambiarlo a `ai`
no requiere reescribir ninguna automatización.

## Desacoplamiento

- **Sin dependencias con proveedores de IA.** No hay APIs de IA ni modelos de
  lenguaje: solo la arquitectura.
- **Sin Prisma.** El módulo opera sobre hechos (`facts`) provistos por el
  llamador; es puro y testeable.
- La única dependencia interna es `@/lib/rule-engine` (para mapear
  recomendaciones a acciones del catálogo del Action Engine).
