# CAPÍTULO 8 — GAMIFICACIÓN (BENCHMARKS Y PROPUESTA)

*Auditoría Maestra de MembeGo · Volumen 8*

---

## 8.1 Qué hacen los referentes (y qué es transferible)

| App | Mecánica núcleo | Por qué funciona | ¿Transferible a MembeGo? |
|---|---|---|---|
| **Duolingo** | Racha (streak) + pérdida aversiva | El usuario protege lo acumulado; el costo de faltar un día es emocional | ✅ Racha de visitas mensuales por empresa ("3 meses seguidos en AutoSpa") |
| **Starbucks Rewards** | Estrellas → niveles con beneficios tangibles + "doble estrella days" | Moneda simple, canje claro, aceleradores temporales | ✅✅ El modelo más cercano a MembeGo: puntos por visita/canje + días de doble punto definidos por la empresa |
| **McDonald's App** | Ofertas rotativas con caducidad corta | Urgencia honesta y razón para abrir la app cada semana | ✅ Ya hay vencimientos; falta la rotación semanal visible ("nuevas esta semana") |
| **Temu/SHEIN/AliExpress** | Ruletas, casi-ganar, contadores agresivos | Dopamina barata; conversión corto plazo | ⚠️ Transferir con MUCHA cautela: la "ruleta de bienvenida" (gana un beneficio aleatorio al registrarte) sí; los dark patterns de presión (falsa escasez, contadores fake) NO — destruyen la confianza que el QR verificado construye |
| **Nike Run Club** | Logros por hitos personales + compartir social | El logro habla del usuario, no de la marca | ✅ Insignias por hitos ("primer canje", "5 amigos", "cliente fundador") con share card |
| **Uber Rewards / aerolíneas** | Niveles (Blue/Gold/Platinum) con beneficios de estatus | El estatus se defiende (mantener nivel exige actividad) | ✅ Niveles por empresa (Regular/VIP) y nivel-plataforma MembeGo |

Lección transversal: los sistemas duraderos combinan **progreso visible + pérdida aversiva + estatus**, y castigan a quien abusa de la presión artificial. MembeGo tiene la materia prima (visitas reales verificadas por QR — dato que Temu jamás tendrá) para hacer gamificación *honesta*.

## 8.2 Lo que ya existe en el código

- Puntos MembeGo, niveles, logros y ranking en referidos (RF.3/RG.4) — pero encerrados en el módulo de referidos.
- Retos del cliente (RG.4).
- Racha implícita posible con `Visit` (no implementada).
- 921 LOC de playbooks de gamificación (GAM-xxx) sin conexión a la UI.

El problema no es falta de piezas: es que la gamificación está *en un rincón* (página de referidos) en lugar de ser una *capa transversal*.

## 8.3 Propuesta: el sistema "Sellos, Rachas y Niveles"

Tres mecánicas, una por horizonte psicológico:

### 1. Sellos (corto plazo — cada visita)
Tarjeta de sellos digital por empresa: "5 visitas = 1 gratis". Es la mecánica que toda PYME LATAM entiende (reemplaza la cartulina troquelada). Cada canje/visita escaneada añade un sello con animación pulse-ring. **Es además el mejor argumento de venta B2B: "digitaliza tu tarjeta de sellos en 5 minutos".**

### 2. Rachas (mediano plazo — cada mes)
"Visitaste AutoSpa 3 meses seguidos" → beneficio de racha definido por la empresa. Pérdida aversiva suave: aviso "tu racha vence en 5 días" (vía canal externo — otra razón por la que email/WhatsApp son prerequisito).

### 3. Niveles (largo plazo — estatus)
- **Por empresa:** Regular → Frecuente → VIP (umbral por visitas/gasto; la empresa define beneficios de nivel). El VIP es visible para el empleado al escanear ("⭐ Cliente VIP") → trato preferencial real, el estatus se *siente* en el mundo físico. Ningún competidor digital puede copiar eso sin el escáner.
- **De plataforma (MembeGo):** nivel global que desbloquea beneficios cruzados (Cap. 9).

### Reglas del sistema
1. Toda mecánica se alimenta SOLO de eventos verificados (canje escaneado, visita, referido no-sospechoso). Nada de puntos por abrir la app: infla y devalúa.
2. Toda recompensa termina en la wallet como tarjeta-beneficio real (reutiliza E8; no inventar una segunda economía).
3. La empresa configura con interruptores y defaults (sellos ON con 5 visitas, racha OFF, niveles OFF) — no con un editor de reglas.
4. Anti-abuso desde el diseño: límites por día, exclusión de flags sospechosos (infra ya existente en referidos, generalizarla).

## 8.4 Orden de implementación

| Fase | Qué | Por qué primero |
|---|---|---|
| 1 | Sellos digitales | Comprensión universal, venta B2B, usa Visit/canje ya existentes |
| 2 | Insignias + share card | Costo bajo, alimenta adquisición |
| 3 | Niveles por empresa + VIP en escáner | Estatus físico diferenciador |
| 4 | Rachas (requiere canales externos activos) | Depende de email/WhatsApp |
| 5 | Ruleta de bienvenida (opcional, A/B) | Solo tras validar que no daña confianza |

---

*Continúa en el Volumen 9: Fidelización.*
