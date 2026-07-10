# MembeGo — Arquitectura Base (Fase 0)

> Documento canónico de contexto y arquitectura. **Toda fase comercial futura
> debe construirse sobre esta base.** No contiene lógica comercial: define el
> marco sobre el que se implementan promociones, membresías, referidos, etc.

---

## 1. Qué es MembeGo

MembeGo **no** es un sistema de cupones ni de puntos. Es un
**Customer Growth Operating System**: una plataforma universal que ayuda a las
empresas a **captar, convertir, retener y medir** clientes mediante promociones
inteligentes, membresías, beneficios, recompensas, referidos, automatizaciones,
campañas, gamificación y analítica.

**Car Wash es solo la primera industria** que usará la plataforma. El sistema se
diseña para restaurantes, salones, gimnasios, hoteles, clínicas, tiendas y
cualquier vertical futura **sin reescribir el núcleo**.

## 2. Principio rector (la regla de oro)

Ninguna funcionalidad se construye como código específico de una empresa o
industria. Toda capacidad se compone de tres piezas:

```
        Motor universal   +   Plantilla de industria   +   Configuración editable
        (src/lib/*)           (biblioteca por vertical)     (datos por empresa)
```

- ❌ **Incorrecto:** `Promoción Car Wash cumpleaños` (código fijo).
- ✅ **Correcto:** `Birthday Reward Template` (plantilla) → industria: Car Wash,
  beneficio: lavado gratis, regla: 1×año, acción: crear recompensa (configuración).

Consecuencias obligatorias:
- **Sin lógica comercial hardcodeada**: nada de `if (industria === 'carwash')`.
- **Sin duplicar lógica**: si dos módulos necesitan lo mismo, va en un motor.
- **Sin sistemas aislados**: todo se integra a los motores existentes.

## 3. Multi-tenant (aislamiento por empresa)

Cada empresa opera de forma **totalmente aislada**: sus clientes, estrategias,
plantillas, marca (logo/colores), reglas y métricas son propios y **nunca**
accesibles por otra empresa. En la práctica: **toda entidad cuelga de
`companyId`** y toda consulta se acota por él (ya aplicado en todos los motores
construidos).

## 4. Catálogo de motores y estado actual

MembeGo Core = un conjunto de **motores especializados** desacoplados. La lógica
vive en los motores, nunca en los módulos de UI.

| Motor | Estado | Ubicación / Nota |
|-------|--------|------------------|
| **Rule Engine** | ✅ Construido (F1–F2) | `src/lib/rule-engine` — reglas configurables, árbol AND/OR/NOT/XOR, tipos. |
| **Condition Engine** | ✅ Construido (F2) | Parte de `rule-engine` (condition-types + operadores tipados). |
| **Action Engine** | ✅ Construido (F3) | `rule-engine` (acciones): catálogo, prioridad, reintentos, rollback, auditoría. |
| **Universal Context Model** | ✅ Construido (F5) | `src/lib/context` — providers por namespace; el motor no toca la BD. |
| **Business Data Dictionary** | ✅ Construido (F6) | `src/lib/dictionary` — fuente oficial de variables. |
| **Expression Engine (BEL)** | ✅ Construido (F7) | `src/lib/bel` — lenguaje de fórmulas/expresiones, sin `eval`. |
| **Promotion Engine / Framework** | ✅ Base construida (F4) | `src/lib/promotions` — promoción = config + reglas + acciones + ciclo de vida. |
| **Membership Engine** | ✅ Construido (FA) | `src/lib/membership` — 20 modelos por configuración (unlimited, créditos, familiar, flota, VIP…) + plantillas Car Wash. |
| **Benefit Engine** | ✅ Construido (FC) | `src/lib/benefits` — beneficios **separados** como entidad reutilizable; 10 tipos, valor percibido vs costo real, ROI, 50 plantillas Car Wash. |
| **Reward Engine** | ⛔ Pendiente | Puntos, créditos, servicios, regalos, beneficios digitales. |
| **Referral Engine (universal)** | ✅ Construido (FD) | `src/lib/referral` — 10 modelos por configuración, flujo de estados editable, escalado, límites, antifraude toggleable; reutiliza el Benefit Engine para recompensas. 15 plantillas Car Wash. |
| **Automation Engine** | ✅ Construido (FE1) | `src/lib/automation` — motor universal: trigger + condiciones (Rule/BEL) + acciones (Action Engine) + esperas + variables + eventos + encadenado + auditoría/métricas. Plantillas por objetivo en E1.1–E1.10. |
| **Automation Playbooks** | ✅ E1.1–E1.8 | `src/lib/automation/playbooks` — estrategias comerciales instalables (24 apartados del Documento Maestro) que envuelven automatizaciones reales de E1. E1.1: 20 captación (`ACQ-*`). E1.2: 18 onboarding (`ONB-*`). E1.3: 12 primera compra (`FP-*`). E1.4: 16 frecuencia (`FREQ-*`). E1.5: 16 recuperación (`REC-*`). E1.6: 20 membresías (`MEM-*`). E1.7: 20 referidos (`REF-*`). E1.8: 20 campañas (`CAMP-*`, Campaign Orchestration Framework que coordina varios motores, +`compatibleGamification`). 142 playbooks universales y editables. Sin migración: reutiliza las tablas de E1. Próximas: E1.9–E1.10. |
| **Campaign Engine** | ⛔ Pendiente | Objetivo + segmento + oferta + reglas + duración + métricas. |
| **Gamification Engine** | ⛔ Pendiente | Niveles, XP, insignias, misiones, rachas, rankings. **XP ≠ puntos.** |
| **Recommendation Engine** | ⛔ Pendiente | Sugerencias de estrategia/beneficio por datos. |
| **Analytics Engine** | ⛔ Pendiente | Retención, churn, LTV, ROI, conversión, uso de beneficios, predicciones. |
| **Template Engine** | ⛔ Pendiente | **Gran diferenciador**: bibliotecas de plantillas por industria. |

> **Nota sobre lo "legacy":** el sistema comercial ACTUAL en `src/app`
> (`Promocion`, `Membership`, `Referido`, `Campana`, `ReglaRecompensa`,
> `src/lib/referidos.ts`, `src/lib/promociones.ts`) es la **primera generación**,
> acoplada a Car Wash. Los motores universales (`src/lib/*`) son la **segunda
> generación** sobre la que se migrará gradualmente. Los motores nuevos son
> **aditivos** y aún no reemplazan a los legacy: conviven hasta que cada vertical
> se reconstruya como *motor + plantilla + configuración*.

## 5. Cómo encajan los motores construidos

```
        Business Data Dictionary (F6)      ← catálogo oficial de variables
                 │ define
                 ▼
        Universal Context Model (F5)       ← providers construyen el contexto
                 │ provee
                 ▼
   ┌─────────────────────────────────────┐
   │  BEL / Expression Engine (F7)        │ ← fórmulas y expresiones (sin eval)
   └─────────────────────────────────────┘
                 │ evalúa dentro de
                 ▼
        Rule Engine + Condition Engine (F1–F2)
                 │ cuando una regla se cumple →
                 ▼
        Action Engine (F3)                 ← ejecuta acciones (con auditoría/rollback)
                 ▲ orquestado como configuración por
                 │
        Promotion Framework (F4)  … y los futuros Membership/Benefit/Reward/… Engines
```

Los motores comerciales futuros (Membership, Benefit, Reward, Referral,
Automation, Campaign, Gamification) **reutilizan** este stack: definen sus
variables en el Diccionario, leen el Contexto, expresan condiciones con BEL/Rule
Engine y ejecutan efectos con el Action Engine. Ninguno reimplementa reglas ni
acciones.

## 6. Flujo de implementación de toda fase comercial

```
Investigación empresarial → Estrategias comerciales → Conversión a PLANTILLAS
   → Definición de parámetros → Implementación con MOTORES EXISTENTES
   → Pruebas → Métricas
```

Cada entrega nueva **debe**: (a) apoyarse en un motor universal, (b) exponer una
plantilla por industria, (c) dejar la configuración editable por empresa, y (d)
verificarse (tsc + lint + prueba funcional) sin acoplarse a una sola empresa.

## 7. Criterios de aceptación (Fase 0) — estado

- ✅ Arquitectura modular por motores.
- ✅ Motores separados y desacoplados.
- ✅ Sistema basado en reglas (Rule Engine).
- ✅ Configuración por datos (promoción, acciones, restricciones, variables).
- ✅ Multi-tenant (todo cuelga de `companyId`).
- ✅ Escalable a distintas industrias (nada específico de Car Wash en `src/lib`).
- ✅ Sin lógica comercial hardcodeada en los motores universales.
- ⛔ Template Engine (plantillas por industria) — pendiente, es el siguiente gran hito.

**Resultado:** MembeGo es una **plataforma comercial universal**; Car Wash es
únicamente la primera industria que la usará. Todas las fases siguientes se
construyen sobre esta base.
