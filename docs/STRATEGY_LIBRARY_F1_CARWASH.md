# Car Wash Business Strategy Library — Documento Base (Fase F1)

> Documento base de la **primera industria** sobre la Business Strategy Library de
> MembeGo. Se construye sobre el estándar canónico de la **Fase F0**
> (`docs/MEMBEGO_ARCHITECTURE.md`). **No contiene estrategias concretas**: define
> el marco, la taxonomía y el estándar sobre el que se desarrollarán las fases
> F1.1–F1.14. Ninguna estrategia comercial de Car Wash se implementa fuera de su
> fase correspondiente.

---

## 0. Relación con la Fase F0

La **Fase F0** (`MEMBEGO_ARCHITECTURE.md`, "Arquitectura Base") ya fijó la regla
de oro que esta biblioteca **debe** respetar sin excepción:

```
Motor universal (src/lib/*)  +  Plantilla de industria  +  Configuración editable
```

Consecuencias heredadas (no se re-litigan aquí):
- Sin lógica comercial hardcodeada (`nada de if (industria === 'carwash')`).
- Sin duplicar lógica: si dos categorías necesitan lo mismo, va en un motor.
- Multi-tenant: toda entidad cuelga de `companyId`.

Este documento **no redefine** esos principios; los **aplica** a Car Wash y
añade la capa que F0 dejó marcada como pendiente: el **Template Engine /
biblioteca de plantillas por industria** ("el gran diferenciador", F0 §4).

---

## 1. Estado real de partida (auditoría de código)

La biblioteca **no parte de cero**. Ya existen **116 plantillas Car Wash** como
datos puros, fieles al contrato F0, pero **aún no unificadas ni cableadas a la
app**:

| Motor | Estado | Plantillas Car Wash | Archivo |
|-------|--------|--------------------:|---------|
| Membership Engine | ✅ construido | **15** | `src/lib/membership/templates/carwash.ts` |
| Benefit Engine | ✅ construido | **50** | `src/lib/benefits/templates/carwash.ts` |
| Promotion Engine | ✅ construido | **36** | `src/lib/promotions/templates/carwash.ts` |
| Referral Engine | ✅ construido | **15** | `src/lib/referral/templates/carwash.ts` |
| Automation Engine | ✅ construido | 5 universales | `src/lib/automation/templates/universal.ts` |
| Rule / Condition / Action | ✅ construido | — (infraestructura) | `src/lib/rule-engine` |
| Context Model / Dictionary / BEL | ✅ construido | — (infraestructura) | `src/lib/context`, `dictionary`, `bel` |

**Cuatro huecos estructurales** entre el código y el estándar F0 (lo que este
Documento Base debe cerrar antes de F1.1):

1. **No hay catálogo central.** Cada motor exporta su `CARWASH_*_TEMPLATES` por
   separado; nada las agrega en una biblioteca navegable por categoría.
2. **Las plantillas no tienen versionado.** El versionado existe en la BD a
   nivel de instancia (`Promotion.version`, `MembershipPlan.version`…), pero la
   plantilla-fuente no declara versión.
3. **Los KPIs son declarativos.** Los arrays `metrics` existen como datos, pero
   ningún Analytics Engine los calcula.
4. **Nada está cableado a la app.** Las 116 plantillas son testables pero ningún
   route, server action ni UI las consume todavía.

---

## 2. Arquitectura de la biblioteca

La estructura que exige F1, mapeada a piezas concretas:

```
Car Wash Business Strategy Library
        │
        ▼
  Categorías            → taxonomía fija (§3)
        │
        ▼
  Subcategorías         → agrupación dentro de cada categoría
        │
        ▼
  Estrategias           → StrategyDescriptor (§4): metadato + puntero a plantilla
        │
        ▼
  Plantillas            → *Template existentes por motor (datos, sin lógica)
        │
        ▼
  Automation Playbooks  → composición de estrategias vía Automation Engine
        │
        ▼
  Configuraciones       → overrides por empresa (instantiate*Template)
        │
        ▼
  KPIs                  → ids de métrica por estrategia (consumo: Analytics Engine)
        │
        ▼
  Versionado            → semver por StrategyDescriptor + historial de instancia
```

**Decisión de diseño clave:** la biblioteca **no reemplaza** los tipos de
plantilla de cada motor (`MembershipTemplate`, `BenefitTemplate`,
`PromotionTemplate`, `ReferralProgramTemplate`, `AutomationTemplate`). Los
**envuelve** con un descriptor común de catálogo. Así se cumple F0 (la lógica
sigue en los motores; la biblioteca solo cataloga, versiona y descubre).

---

## 3. Categorías iniciales → motores

Las 20 categorías del documento F1, mapeadas al motor que las sirve y a su
estado real. Esto **corrige el supuesto** de que F1.1–F1.14 se pueden ejecutar
en orden estricto: varias categorías dependen de motores aún **no construidos**.

### 3.1 Listas para desarrollarse ya (motor existente)

| Categoría | Motor | Fase F1 |
|-----------|-------|---------|
| Membresías | Membership Engine ✅ | F1.1 |
| Promociones | Promotion Engine ✅ | F1.2 |
| Beneficios | Benefit Engine ✅ | F1.3 |
| Cupones | Promotion + Benefit ✅ (subtipo) | F1.4 |
| Referidos | Referral Engine ✅ | F1.6 |
| Automatizaciones | Automation Engine ✅ | F1.7 |
| Recuperación | Automation + Promotion ✅ (winback) | subconjunto |
| Retención | Automation + Membership ✅ | subconjunto |

### 3.2 Bloqueadas: requieren construir un motor primero

| Categoría | Motor requerido | Estado | Fase F1 |
|-----------|-----------------|--------|---------|
| Recompensas | **Reward Engine** | ⛔ no existe | F1.5 |
| Campañas | **Campaign Engine** | ⛔ no existe | F1.8 |
| Gamificación | **Gamification Engine** | ⛔ no existe | F1.9 |
| Eventos / Temporadas | Campaign Engine | ⛔ depende de F1.8 | F1.12 |
| KPIs / Dashboards | **Analytics Engine** | ⛔ no existe | F1.13 |
| Upselling | Promotion + Recommendation | ⚠️ parcial (patrón sobre motores existentes; ideal con Recommendation Engine) | F1.10 |
| Cross Selling | Promotion + Recommendation | ⚠️ parcial | F1.11 |

### 3.3 Transversales (infraestructura, no "estrategias")

Estas categorías del listado F1 **no son contenido de biblioteca** sino
capacidades del núcleo; se documentan aquí para evitar tratarlas como
estrategias sueltas:

- **Segmentación** → Rule Engine + Dictionary (condición reutilizable por
  cualquier estrategia).
- **Fidelización / Experiencias** → objetivos transversales que se logran
  combinando membresías, beneficios, recompensas y automatizaciones; se modelan
  como **Playbooks**, no como una categoría-motor aparte.
- **KPIs / Dashboards** → salida analítica común a todas las categorías.

> Claude podrá proponer categorías nuevas cuando aporten valor y sean
> reutilizables (F1 lo permite). Toda categoría nueva debe mapear a un motor
> universal existente o justificar uno nuevo.

---

## 4. Estándar de estrategia (`StrategyDescriptor`)

Toda estrategia de la biblioteca —de cualquier categoría— se cataloga con **un
mismo descriptor**, que envuelve la plantilla específica del motor. Esto unifica
las 116 plantillas heterogéneas bajo un contrato único sin tocar los motores.

```ts
export interface StrategyDescriptor {
  readonly id: string            // "carwash.membership.unlimited_premium"
  readonly industry: 'carwash'
  readonly category: StrategyCategory      // taxonomía §3
  readonly subcategory?: string
  readonly engine: EngineId       // 'membership' | 'benefit' | 'promotion' | …
  readonly templateKey: string    // puntero a la plantilla del motor
  readonly name: string
  readonly description: string
  readonly objective: string      // objetivo comercial (captación, retención…)
  readonly kpis: readonly string[]         // ids de métrica (§6)
  readonly version: string        // semver "1.0.0" (§7)
  readonly status: 'stable' | 'beta' | 'deprecated'
}
```

Reglas del descriptor:
- **La plantilla no cambia.** El descriptor referencia por `templateKey`; la
  lógica y la configuración siguen viviendo en el `*Template` del motor.
- **Instalación = configuración.** Instalar una estrategia en una empresa es
  `instantiate*Template(template, companyId, overrides)` del motor
  correspondiente; el descriptor solo dice *cuál* plantilla y *de qué* motor.
- **Sin lógica en el descriptor.** Es metadato de catálogo: categorizar,
  versionar, descubrir. Nada de condiciones ni acciones.

---

## 5. Agregador de biblioteca (Template Engine, keystone pendiente)

La única pieza estructural que falta para "recibir cientos de estrategias sin
reorganizarse" es un **índice central** que agregue los `CARWASH_*_TEMPLATES` de
cada motor en un catálogo de `StrategyDescriptor`. Ubicación propuesta:

```
src/lib/strategy-library/
├── index.ts                       # API pública
├── domain/
│   ├── categories.ts              # StrategyCategory (taxonomía §3, congelada)
│   ├── descriptor.ts              # StrategyDescriptor (§4)
│   └── engine-id.ts               # EngineId
├── application/
│   ├── registry.ts                # agrega descriptores de todos los motores
│   ├── discovery.ts               # búsqueda por categoría/objetivo/KPI
│   └── install.ts                 # despacha a instantiate*Template del motor
└── carwash/
    └── index.ts                   # ensambla los 116 descriptores Car Wash
```

Contrato del agregador:
- **Solo agrega y describe.** No reimplementa ninguna lógica de motor; importa
  los arrays existentes y los envuelve en descriptores.
- **Descubrimiento reutilizable.** Reaprovecha el patrón ya existente en
  `promotions/templates/service.ts` (`recommendByGoal`, `objectiveFromGoal`)
  generalizándolo a toda la biblioteca.
- **Instalación unificada.** `install(descriptor, companyId, overrides)` despacha
  al `instantiate*Template` del motor según `descriptor.engine`.

> Este agregador es una **mejora organizativa** autorizada por F1 ("Si
> identificas oportunidades para mejorar la organización de la biblioteca antes
> de comenzar F1.1–F1.14, impleméntalas"). Es de **bajo riesgo**: agregación pura
> sobre datos existentes, sin cambios en motores ni en la app.

---

## 6. Estándar de KPIs

- Cada estrategia declara `kpis: string[]` con **ids de métrica** que ya existen
  en los catálogos por motor (`membership/domain/metrics.ts`,
  `benefits/domain/metrics.ts`, `promotions/templates/taxonomy.ts`, etc.).
- Hoy son **declarativos**: describen qué medir, no calculan. El cálculo llega
  con el **Analytics Engine** (F1.13). Hasta entonces, los KPIs son el contrato
  de qué medir por estrategia.
- **Regla:** ninguna estrategia se cataloga sin al menos un KPI. Un KPI sin
  catálogo de métrica debe añadirse primero al catálogo del motor
  correspondiente (no inventar strings sueltos).

---

## 7. Estándar de versionado

- **Plantilla-fuente:** `StrategyDescriptor.version` en **semver** (`MAJOR.MINOR.PATCH`).
  - `PATCH`: corrección sin cambio de comportamiento.
  - `MINOR`: nueva configuración compatible hacia atrás.
  - `MAJOR`: cambio incompatible → **nuevo `id`/`templateKey`**, no se muta el
    anterior (se marca `status: 'deprecated'`).
- **Instancia por empresa:** al instalar, la BD ya versiona la instancia
  (`Promotion.version` + `promotion_versions`, `MembershipPlan.version`,
  `Automation.version`, `DataDictionaryVariable.version`). El `templateKey`
  persistido enlaza la instancia con su plantilla-fuente.
- **Compatibilidad:** una empresa con una estrategia instalada no se rompe al
  publicarse una versión nueva; migra explícitamente.

---

## 8. Organización del desarrollo (secuencia corregida)

F1 se ejecuta **por dependencia de motor**, no en numeración estricta:

**Bloque A — reutilización directa (motores listos):**
`F1.1 Membresías` → `F1.2 Promociones` → `F1.3 Beneficios` → `F1.4 Cupones` →
`F1.6 Referidos` → `F1.7 Automatizaciones`.
Cada una: catalogar las plantillas existentes como `StrategyDescriptor`,
completar cobertura Car Wash, cablear a la app.

**Bloque B — construir motor, luego biblioteca:**
`F1.5 Recompensas` (Reward Engine) · `F1.8 Campañas` (Campaign Engine) ·
`F1.9 Gamificación` (Gamification Engine) · `F1.13 KPIs/Dashboards`
(Analytics Engine). Cada motor primero se construye siguiendo F0, luego se
puebla su biblioteca Car Wash.

**Bloque C — dependientes:**
`F1.10 Upselling` / `F1.11 Cross Selling` (patrón Promotion+Rule; ideal tras
Recommendation Engine) · `F1.12 Eventos/Temporadas` (tras Campaign Engine).

**Cierre:** `F1.14 Consolidación y Optimización`.

Cada fase amplía la biblioteca **sin duplicar lógica** y reutilizando la
arquitectura F0 por completo.

---

## 9. Restricciones (heredadas de F1/F0)

- No implementar estrategias fuera de su fase.
- No crear soluciones específicas para una sola empresa.
- No introducir lógica hardcodeada; toda diferencia entre empresas Car Wash se
  resuelve por configuración, reglas y plantillas.
- La plantilla no contiene lógica propia: reutiliza los motores existentes.

---

## 10. Validación de esta fase (checklist F1)

- [x] La estructura sigue el estándar F0 (`Motor + Plantilla + Configuración`).
- [x] Las 20 categorías están organizadas y mapeadas a un motor (existente o
      pendiente), sin ambigüedad (§3).
- [x] El documento base no contiene lógica específica de ninguna empresa.
- [x] La arquitectura admite cientos de estrategias sin reorganizarse: el
      `StrategyDescriptor` + agregador central es la capa de escala (§4–§5).
- [x] Toda implementación futura reutiliza motores existentes sin cambios
      estructurales (los descriptores solo apuntan a plantillas).
- [ ] **Pendiente de decisión:** implementar el agregador central
      `src/lib/strategy-library/` (mejora organizativa §5) antes de F1.1.

**Decisiones documentadas:**
1. La biblioteca **envuelve**, no reemplaza, los tipos de plantilla por motor.
2. F1 se re-secuencia por dependencia de motor (§8), no por numeración.
3. Segmentación/Fidelización/Experiencias se tratan como transversales/Playbooks,
   no como categorías-motor.
4. El versionado de plantilla es semver; los cambios MAJOR generan nuevo id.
