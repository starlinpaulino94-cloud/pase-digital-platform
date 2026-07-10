# MEMBEGO — FASE E2: Architecture Consolidation

Revisión arquitectónica completa de la plataforma (todos los motores de la
Strategy Library + su conexión a la app en vivo). Objetivo: consolidar, no
añadir. Este documento contiene los 12 entregables de la fase, basados en
mediciones reales del código (imports, catálogos, esquema), no en suposiciones.

---

## 1. Mapa completo de la arquitectura

### Capas

```
┌─────────────────────────────────────────────────────────────────────┐
│  APP EN VIVO (src/app + src/modules)                                │
│  Panel admin · Portal cliente · Scanner · Marketplace de Estrategias│
├─────────────────────────────────────────────────────────────────────┤
│  PUENTE (src/modules/estrategias)                                   │
│  emitirEventoEstrategia (bus fire-and-safe) · LiveActionSink        │
├─────────────────────────────────────────────────────────────────────┤
│  REGISTRO DE PLATAFORMA (src/lib/platform) — Fase E2                │
│  Catálogo único de eventos · acciones · métricas · alias            │
├─────────────────────────────────────────────────────────────────────┤
│  STRATEGY LIBRARY (src/lib/*) — motores universales                 │
│  automation (10.3k loc) · rule-engine (2.8k) · referral (1.8k)      │
│  promotions (1.5k) · benefits (1.4k) · bel (1.3k) · membership (1.3k)│
│  dictionary (0.9k) · decision (0.7k) · context (0.7k)               │
├─────────────────────────────────────────────────────────────────────┤
│  PERSISTENCIA (Prisma → Supabase PostgreSQL, 57 tablas)             │
│  Adaptadores por motor (infrastructure/) — dominio sin Prisma       │
└─────────────────────────────────────────────────────────────────────┘
```

### Los motores y su estado

| Motor | Módulo | Rol | Conectado a la app |
| --- | --- | --- | --- |
| Rule Engine + Action Engine | `rule-engine` | Condiciones configurables + catálogo único de acciones | ✅ (vía automation) |
| Expression Engine (BEL) | `bel` | Lenguaje de expresiones sin `eval` | ✅ (condiciones) |
| Promotion Engine | `promotions` | Promoción = config + reglas + acciones + ciclo de vida | ⏳ solo por playbooks |
| Membership Engine | `membership` | 20 modelos de membresía por configuración | ⏳ solo por playbooks |
| Benefit Engine | `benefits` | Beneficio como entidad reutilizable (valor/costo/ROI) | ✅ (LiveActionSink → grants) |
| Referral Engine | `referral` | 10 modelos de programa, estados, antifraude | ⏳ solo por playbooks |
| Automation Engine | `automation` | Orquestador: trigger + condiciones + acciones + eventos | ✅ (marketplace + bus) |
| Decision/Recommendation/Prediction/Optimization | `decision` | Decide/recomienda; nunca ejecuta | ⏳ solo por playbooks |
| Context Model | `context` | Namespaces de datos para reglas | ✅ (RuleContext) |
| Data Dictionary | `dictionary` | Diccionario de variables tipadas | ⏳ |
| Reward / Campaign / Gamification / Analytics / Template | — | **Aún no construidos como motores**; sus capacidades se referencian por acciones/eventos/`INVOKE_MODULE` | — |

**Hallazgo E2-H1:** Reward, Campaign, Gamification, Analytics y Template Engine
figuran en los playbooks como `EngineRef`, pero hoy son *contratos* (acciones y
eventos del catálogo, `INVOKE_MODULE`), no módulos. Esto es correcto por diseño
(los playbooks no se romperán cuando existan), pero debe quedar explícito: la
plataforma tiene **10 motores construidos** y **5 declarados por contrato**.

---

## 2. Relaciones entre motores

Grafo real de imports (medido con grep sobre `src/lib/*`):

```
rule-engine ──→ (nadie)              ← bel, promotions, membership,
bel ──────────→ rule-engine             benefits, automation, decision,
promotions ───→ rule-engine             context
membership ───→ rule-engine, bel
benefits ─────→ rule-engine
referral ─────→ benefits             (recompensas via Benefit Engine)
automation ───→ rule-engine, bel
decision ─────→ rule-engine          (mapear recomendación → acción)
context ──────→ rule-engine
dictionary ───→ (nadie)
platform ─────→ automation, rule-engine, benefits, membership, referral
                (solo re-export/fusión de catálogos)
```

**Veredicto:** es un **DAG limpio** (sin ciclos). `rule-engine` es el núcleo del
que todos dependen; `referral→benefits` es la única dependencia entre motores
de negocio y es deliberada (las recompensas de referido SON beneficios). La
comunicación en runtime entre automatizaciones es por **eventos** (EventDispatcher
con guardia de profundidad), cumpliendo Event-Driven. El `LiveActionSink`
invoca servicios de app (notificaciones, email) — está en la capa puente, no en
los motores, que es donde corresponde.

**Hallazgo E2-H2 (dependencia evitada):** el sink necesitaba ejecutar workflows
(motor→sink→motor = ciclo); se resolvió con `bindEngine` (setter injection) en
la capa puente. Documentado como patrón oficial para futuros handlers.

---

## 3. Catálogo único de eventos

**Estado: ✅ ya existe y ahora está formalizado.** El único módulo que define
eventos es `automation/domain/events.ts` (80 eventos, IDs únicos — verificado).
La Fase E2 lo formaliza como `PLATFORM_EVENTS` en `src/lib/platform/events.ts`.

**Duplicidades semánticas detectadas y resueltas como alias** (el alias queda
deprecado para código nuevo; se conserva porque los playbooks publicados lo
referencian — eliminarlos cambiaría comportamiento, prohibido en E2):

| Alias (deprecado) | Canónico | Motivo |
| --- | --- | --- |
| `cliente.renovo` | `membresia.renovada` | La renovación es del ciclo de vida de la membresía |
| `cliente.cancelo` | `membresia.cancelada` | Ídem |
| `cliente.recomendo_amigo` | `referido.invitacion_compartida` | Es un hecho del journey de referidos |
| `cliente.riesgo_abandono` | `riesgo.detectado` | Caso particular del evento genérico de riesgo |

`canonicalEvent(type)` resuelve alias→canónico (exportado, aún no cableado al
dispatcher: hacerlo hoy alteraría automatizaciones publicadas → backlog B-2).

**Regla:** un evento nuevo se añade SOLO en `automation/domain/events.ts`,
revisando antes `EVENT_ALIASES`.

---

## 4. Catálogo único de acciones

**Estado: ✅ ya existe y ahora está formalizado.** El único módulo que define
acciones es el Action Engine (`rule-engine/domain/action-catalog.ts`, 47
acciones en 10 categorías) — verificado: Benefit (`benefitToActions`), Referral
(rewards), Automation (playbooks), Decision (recommendation-engine) y los 180
playbooks referencian estas constantes; ninguno define acciones propias.
Formalizado como re-export en `src/lib/platform/actions.ts`.

Ejecución en vivo: `LiveActionSink` implementa 10 tipos con handlers reales
(notificación in-app, alerta a admins, email, benefit_grants, eventos,
workflows); el resto queda como **intención auditada** (`simulated: true`) —
ninguna acción sin handler rompe un flujo.

**Regla:** una acción nueva se añade SOLO en el Action Engine; su handler en
vivo, SOLO en `LiveActionSink`.

---

## 5. Catálogo único de reglas reutilizables

Las condiciones de toda la plataforma se expresan en **BEL** (un solo lenguaje,
un solo evaluador, sin `eval`) y se evalúan por un único camino:
`BelConditionEvaluator → ExpressionService → RuleContext`. No hay un segundo
mecanismo de reglas en la Strategy Library.

Patrones de regla reutilizados por los playbooks (verificados en los 180):

| Patrón | Expresión tipo | Usada por |
| --- | --- | --- |
| Primera vez | `cliente.compras == 0` | ACQ, ONB, FP, DEC |
| Umbral numérico | `compra.monto >= X`, `cliente.ltv >= X` | FP-008, REC-004, GAM |
| Comparación con hábito | `cliente.diasSinVisita > cliente.frecuenciaHabitual` | FREQ, REC |
| Estado/segmento | `cliente.nivelRiesgo == "riesgo_alto"` | REC-003, DEC |
| Bandera booleana | `membresia.autoRenovacion == true` | MEM, ONB |
| Combinación | `a OR b`, `a AND b` (corto-circuito) | CAMP-019 |

**Lógica hardcodeada detectada:** ninguna en la Strategy Library (todas las
decisiones pasan por BEL o por el Rule Based Provider con umbrales editables).
La PRIMERA GENERACIÓN (legacy, `src/app`/`src/modules`) sí contiene lógica fija
(p. ej. `automatizaciones.ts` de F4.7) — está fuera del alcance de E2 modificarla
(cambiaría comportamiento en producción); su migración es el backlog B-1.

---

## 6. Modelo de dominio consolidado (lenguaje ubicuo)

Glosario oficial — resuelve los solapes conceptuales detectados:

| Concepto | Definición única | NO es |
| --- | --- | --- |
| **Promoción** | Oferta comercial temporal con reglas y ciclo de vida (Promotion Engine) | Un beneficio permanente |
| **Beneficio** | Valor entregable a un cliente, con valor percibido y costo real (Benefit Engine). Entidad reutilizable por promos/membresías/referidos/gamificación | Una promoción |
| **Cupón** | *Instrumento de canje* de un beneficio/promoción (código de un solo uso). No es entidad de dominio propia en la 2.ª generación | Un beneficio en sí |
| **Recompensa** | Beneficio/puntos/nivel otorgado como consecuencia de un comportamiento (referir, completar misión) | Sinónimo libre de beneficio |
| **Puntos** | Moneda de lealtad canjeable (Reward) | XP |
| **XP** | Progreso de gamificación NO canjeable; sube niveles | Puntos |
| **Nivel** | Categoría del cliente derivada de XP/reglas; configurable, sin nombres fijos | Un plan de membresía |
| **Membresía** | Relación recurrente cliente-empresa con plan, vigencia y límites (Membership Engine, 20 modelos) | Un nivel |
| **Misión / Reto** | Objetivo de gamificación con meta y recompensa. "Reto" = misión de mayor exigencia; misma entidad, distinta dificultad | Dos entidades distintas |
| **Campaña** | Orquestación temporal multi-motor sobre un segmento | Una promoción suelta |
| **Segmento** | Conjunto de clientes definido por reglas (Rule Engine) | Una lista estática |
| **Journey** | Secuencia de etapas de un cliente (onboarding, referido, membresía) operada por automatizaciones encadenadas | — |
| **Automatización** | Unidad ejecutable: trigger + condiciones + acciones + esperas (Automation Engine) | Un playbook |
| **Playbook / Estrategia** | Automatización + documentación de negocio (24-25 apartados), instalable desde el Marketplace | El motor |
| **Evento** | Hecho de negocio publicado en el bus (catálogo único) | Una acción |
| **Acción** | Efecto ejecutable por el Action Engine (catálogo único) | Un evento |
| **Decisión** | Resultado del Decision Engine (decide, nunca ejecuta) | Una recomendación ejecutada |
| **Recomendación** | Decisión traducida a acción lista para el Action Engine | — |

**Duplicidad conceptual resuelta:** "Cupón" convivía como entidad legacy
(`CuponBienvenida`, `CREATE_COUPON`) y como concepto difuso. Queda definido
como *instrumento de canje* de un beneficio — las acciones de cupón del catálogo
operan instrumentos, no una entidad de dominio paralela.

---

## 7. Modelo de datos consolidado

57 tablas verificadas contra Postgres 16. Estructura por generación:

**2.ª generación (Strategy Library)** — patrón uniforme en todos los motores:
- Agregados: `rules`+`rule_actions` · `promotions`+versiones/reglas/acciones/
  restricciones/auditoría · `membership_plans`+`membership_instances`+usage ·
  `benefits`+`benefit_grants` · `referral_programs`+`referral_participants`+
  `referral_referrals` · `automations`+`automation_runs`+`automation_events` ·
  `data_dictionary_variables`+versiones.
- Convenciones compartidas (verificadas): multi-tenant por `companyId` con FK
  CASCADE; `config JSONB` para lo editable; `metadata JSONB`; `templateKey`
  para instalaciones desde plantilla; `status` textual con ciclo
  DRAFT→PUBLISHED→PAUSED→ARCHIVED; índices `(companyId, status)`.
- Auditoría: `automation_runs` (reglas evaluadas + acciones ejecutadas + error
  + duración), `promotion_audits`, `history` en referidos, `benefit_grants`
  como historial de entrega. Versionado: `promotion_versions`,
  `data_dictionary_variable_versions`.

**1.ª generación (legacy en producción):** `promociones`, `memberships`,
`referidos`/`referral_events`, `campanas`, `cupones_bienvenida`… — acopladas a
Car Wash, en uso por la app.

**Hallazgo E2-H3 (entidades duplicadas por generación, decisión consciente):**

| Concepto | Legacy (en uso) | 2.ª generación (universal) |
| --- | --- | --- |
| Promoción | `promociones` | `promotions` |
| Membresía | `memberships` | `membership_plans/instances` |
| Referidos | `referidos`+`referral_events` | `referral_programs/participants/referrals` |
| Automatización | módulo F4.7 (`automatizaciones.ts`) | `automations` |

No es deuda accidental: es la estrategia de migración por convivencia (ADR-1).
El riesgo y su plan de salida están en §10 y §12.

**Identificadores:** cuid en toda la plataforma. **Value objects:** economía de
beneficios (valor percibido/costo real), límites de membresía, ventanas de
automatización — modelados como JSONB tipado en dominio, correcto para la
variabilidad por industria.

---

## 8. Recomendaciones de mejora

| # | Recomendación | Estado |
| --- | --- | --- |
| R1 | Formalizar catálogo único de eventos con alias canónicos | ✅ hecha en E2 (`lib/platform/events.ts`) |
| R2 | Formalizar catálogo único de acciones | ✅ hecha en E2 (`lib/platform/actions.ts`) |
| R3 | Unificar métricas (4 catálogos, claves repetidas: `roi` 3×, `conversion`, `retencion`, `ingresos_generados`, `beneficios_*` 2×) | ✅ hecha en E2 (`lib/platform/metrics.ts`, dedupe + procedencia) |
| R4 | Definir lenguaje ubicuo (Cupón/Beneficio/Recompensa/Puntos/XP…) | ✅ hecha en E2 (§6) |
| R5 | Resolver alias de eventos en runtime (`canonicalEvent` en el dispatcher) | Backlog B-2 (cambiaría comportamiento publicado) |
| R6 | KPIs de playbooks como claves del catálogo unificado (hoy son strings libres coherentes, sin validar contra catálogo) | Backlog B-3 |
| R7 | Migrar verticales legacy al motor universal (empezar por Promociones, la de menor riesgo) | Backlog B-1 |
| R8 | Test de arquitectura que falle si un motor define eventos/acciones locales o crea ciclos de import | Backlog B-4 |
| R9 | `prisma.config.ts` (deprecación anunciada de `package.json#prisma` en Prisma 7) | Backlog B-7 |

---

## 9. Cambios implementados en E2

Solo consolidación; cero cambio funcional (verificado con la suite completa):

1. **`src/lib/platform/`** (nuevo): registro único de plataforma —
   `events.ts` (catálogo + `EVENT_ALIASES` + `canonicalEvent`), `actions.ts`
   (re-export del único catálogo), `metrics.ts` (fusión deduplicada de los 4
   catálogos con procedencia por motor + `SHARED_METRICS`), `index.ts` con las
   3 reglas arquitectónicas.
2. **Este documento** (12 entregables) + actualización del mapa en
   `MEMBEGO_ARCHITECTURE.md`.

Explícitamente NO hecho (prohibido en E2 o pospuesto por riesgo): eliminar
eventos alias (rompería playbooks publicados), tocar los sistemas legacy en
producción, renombrar claves de métricas existentes.

---

## 10. Riesgos detectados

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| **Doble sistema por vertical** (legacy vs universal): los datos comerciales viven en legacy; los motores universales acumulan datos propios. Cuanto más tarde la migración, más costosa | Alto | Plan B-1 por vertical; congelar features nuevas sobre legacy |
| **Motores por contrato** (Reward/Campaign/Gamification/Analytics/Template): 180 playbooks los referencian; si al construirse cambian el contrato, habría deriva | Medio | Los contratos ya están fijados por el catálogo de acciones/eventos y `EngineRef`; construir contra ellos |
| **Alias de eventos**: dos automatizaciones podrían escuchar el mismo hecho con nombres distintos y disparar doble | Medio | `EVENT_ALIASES` documentado; B-2 unifica en runtime |
| **`INVOKE_MODULE` es un pass-through sin validar**: módulo/acción son strings libres | Medio | Hoy degrada a intención auditada; B-5 añade registro de módulos válidos |
| **Ejecución del bus inline** (dispatch síncrono en la request): con miles de automatizaciones por evento, latencia en el flujo de negocio | Medio (a escala) | Aceptable hoy (pocas por empresa); B-6 mueve a cola/worker |
| **KPIs de playbooks como texto libre**: pueden divergir del catálogo unificado | Bajo | B-3 |

---

## 11. Decisiones arquitectónicas (ADR)

- **ADR-1 · Convivencia legacy/universal.** Los motores universales son
  aditivos y no reemplazan a la 1.ª generación hasta migrar cada vertical.
  Alternativa rechazada: big-bang rewrite (riesgo inaceptable en producción).
- **ADR-2 · Un solo catálogo de eventos y uno de acciones.** Propietarios:
  Automation Engine (eventos) y Action Engine (acciones). Los demás motores
  consumen, nunca definen. E2 lo formaliza en `lib/platform`.
- **ADR-3 · Alias antes que ruptura.** Los eventos semánticamente duplicados se
  documentan como alias con canónico, no se eliminan: hay playbooks publicados
  que los usan. La resolución en runtime es un cambio funcional → backlog.
- **ADR-4 · El dominio no conoce Prisma.** Todos los motores mantienen
  domain/application/infrastructure; la persistencia entra solo por puertos.
  El puente a la app (`modules/estrategias`) es quien toca servicios reales.
- **ADR-5 · Decide ≠ ejecuta.** Decision Engine produce decisiones;
  Recommendation las traduce; SOLO el Action Engine ejecuta. Ningún proveedor
  de decisión puede ejecutar acciones (puerto sin efectos).
- **ADR-6 · Acciones sin handler = intención auditada.** Un playbook nunca
  rompe un flujo en vivo por referirse a una capacidad aún no integrada; la
  intención queda en la auditoría del run y se cablea después sin tocar motores.
- **ADR-7 · Configuración antes que código.** Diferencias por industria SOLO
  vía config/reglas/plantillas (`config JSONB` + BEL + `templateKey`).
  Verificado: 0 lógica condicionada por industria en dominio/aplicación/
  infraestructura de los motores (las únicas menciones a Car Wash son ejemplos
  ilustrativos en comentarios y 2 descripciones de catálogo); Car Wash existe
  solo como biblioteca de plantillas.

---

## 12. Backlog de mejoras futuras

| ID | Mejora | Prioridad |
| --- | --- | --- |
| B-1 | Migración por vertical legacy→universal (orden sugerido: Promociones → Membresías → Referidos → apagar F4.7) con doble-escritura temporal | Alta |
| B-2 | Resolver `EVENT_ALIASES` en el dispatcher (una automatización suscrita al canónico recibe también el alias) + migración de configs instaladas | Alta |
| B-3 | Validar KPIs de playbooks contra `PLATFORM_METRIC_CATALOG` (smoke + tipo) | Media |
| B-4 | Test de arquitectura en CI: sin ciclos de import, sin catálogos locales de eventos/acciones, dominio sin Prisma | Media |
| B-5 | Registro tipado de módulos invocables para `INVOKE_MODULE` (falla en instalación, no en runtime) | Media |
| B-6 | Bus asíncrono: cola (tabla `automation_events processed=false` + cron/worker) para despacho fuera de la request | Media (a escala) |
| B-7 | `prisma.config.ts` antes de Prisma 7 | Baja |
| B-8 | Construir los 5 motores por contrato (Reward, Campaign, Gamification, Analytics, Template) contra los contratos ya fijados | Según roadmap |
| B-9 | Dashboard de métricas por estrategia sobre `automation_runs`/`automation_events` usando el catálogo unificado | Media |

---

## Criterios de aceptación — verificación

| Criterio | Estado |
| --- | --- |
| Responsabilidades claras por motor | ✅ §1-§2 (tabla + reglas de propiedad) |
| Sin duplicidades de lógica | ✅ en Strategy Library (1 evaluador, 1 catálogo de acciones, 1 de eventos); legacy documentado como ADR-1/B-1 |
| Un catálogo de eventos | ✅ `PLATFORM_EVENTS` (80, IDs únicos) + alias |
| Un catálogo de acciones | ✅ `ACTION_TYPES` (47) re-exportado |
| Un lenguaje de dominio | ✅ glosario §6 |
| Arquitectura desacoplada | ✅ DAG sin ciclos; comunicación por eventos; puertos |
| Industrias por configuración/plantillas | ✅ ADR-7 (verificado: 0 lógica por industria en motores) |
| Preparada para crecer sin rediseños | ✅ contratos fijados para motores futuros; riesgos con plan (§10, §12) |
