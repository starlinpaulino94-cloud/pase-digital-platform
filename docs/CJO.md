# Fase 3.5 — Customer Journey Optimization (CJO)

Estrategia completa del recorrido del cliente en MembeGo: de descubrir la
plataforma a volverse recurrente y embajador. Construida sobre la maquinaria
que **ya existe** (Engagement Engine, Onboarding B2C, Invita y Gana con
niveles, Automation Engine + playbooks, Share Engine, config por empresa) —
cada propuesta indica si está **VIVA**, **PARCIAL** o es **BRECHA**.

---

## 1 · Customer Journey Map (validado y mejorado)

El recorrido lineal propuesto es correcto pero le faltaban dos realidades:
(a) el descubrimiento casi siempre entra por un **enlace compartido** (Share
Engine: promo/campaña/invitación con tarjeta rica en WhatsApp), y (b) el
**canje** llega antes que la membresía — el primer QR canjeado es EL momento
de activación, no la compra. Journey oficial:

```
DESCUBRIR      Ve una tarjeta compartida (promo/campaña/invitación) ─ VIVA (Share Engine)
   ↓
LLEGAR         Landing de campaña con countdown + regalo ─ VIVA (CampanaLanding)
   ↓
REGISTRARSE    Cuenta mínima + beneficio de registro ─ VIVA (registro + regalo de campaña)
   ↓
BIENVENIDA     Celebración + confeti + primer beneficio visible ─ VIVA (CelebracionBienvenida)
   ↓
ACTIVARSE      Ve su QR / beneficio "listo para usar" en el Home ─ VIVA (hero beneficio + dock QR)
   ↓
PRIMER CANJE   Lo muestra en el local; el staff escanea (1 lectura) ─ VIVA (scanner POS)
   ↓
CONECTAR       Sigue empresas + elige intereses (checklist) ─ VIVA (onboarding B2C)
   ↓
EXPLORAR       Feed inteligente: sigo/destacadas/nuevas/expiran/recomendadas ─ VIVA
   ↓
COMPRAR        Membresía (transferencia o pago en sucursal con referencia) ─ VIVA (POS)
   ↓
COMPARTIR      Invita y Gana: enlace con urgencia + tarjeta rica ─ VIVA
   ↓
GANAR          Recompensas + puntos + niveles + logros + ranking ─ VIVA (growth)
   ↓
RECURRENTE     Vuelve por vencimientos, campañas y novedades ─ PARCIAL (ver §9)
   ↓
EMBAJADOR      Nivel alto + referidos activos ─ PARCIAL (falta trato VIP visible, §11)
```

## 2 · Análisis por etapa

| Etapa | Siente / espera | Fricción o miedo | Cómo lo resolvemos | Acción objetivo | Métrica |
| --- | --- | --- | --- | --- | --- |
| Descubrir | curiosidad; "¿esto es real?" | enlace sin cara (sin imagen) | tarjeta rica + texto de urgencia (VIVA) | tap al enlace | CTR del enlace |
| Llegar | "¿qué gano?" | landing lenta o genérica | countdown + regalo + CTA único (VIVA) | tap "Quiero mi regalo" | % landing→registro |
| Registrarse | prisa; miedo a formularios | pedir demasiado | solo lo esencial; el perfil se completa DESPUÉS (checklist) | crear cuenta | % registro completado |
| Bienvenida | "¿funcionó?" | silencio post-registro | confeti + beneficio visible al instante (VIVA) | ver su beneficio | % que ve el beneficio día 0 |
| Primer canje | nervios en el local | no encontrar el QR | dock central "Mi QR" + hero en Home (VIVA) | mostrar QR | % activación (1er canje ≤7 días) |
| Conectar | "¿qué más hay?" | catálogo vacío para él | intereses → recomendaciones afines (VIVA) | seguir ≥1 empresa | empresas seguidas/usuario |
| Comprar | duda de precio/confianza | pago = transferencia rara | pago presencial con referencia (VIVA) | comprar plan | conversión a membresía |
| Compartir | quiere presumir/ganar | no sabe qué escribe | mensaje pre-armado con urgencia (VIVA) | compartir enlace | shares/usuario |
| Ganar | expectativa de premio | premio invisible | confeti + niveles + ranking (VIVA) | reclamar recompensa | recompensas reclamadas |
| Volver | se le olvida | spam lo espanta | avisos con motivo real (§9) | reabrir la app | retención D7/D30 |

## 3 · Momentos WOW (sorprender, no notificar)

| Momento | Tratamiento | Estado |
| --- | --- | --- |
| Primer registro | pantalla completa + confeti + regalo | VIVA (CelebracionBienvenida) |
| Primer beneficio | hero "🎁 disponible" + shine + CTA | VIVA (Home) |
| Primer QR | dock central con glow | VIVA (BottomNav) |
| Primer canje | check animado + celebración en el ticket del cliente | PARCIAL — celebrar también en la app del cliente al consumirse |
| Primer referido | confeti + contador animado | VIVA (Invita y Gana) |
| Primera membresía | wallet card premium | VIVA |
| Cambio de nivel | confeti + logro | VIVA (growth) |
| Renovación | — | BRECHA: agradecer la renovación con recompensa configurable |
| Cumpleaños | automatización de campaña | PARCIAL (plantilla existe; falta el momento en la app) |

## 4 · First Run Experience

Ya existe y es correcta; se formaliza el orden (sin abrumar: cada paso es
opcional y pospuesto, nunca bloqueo):

1. **Bienvenida + regalo** (celebración) → 2. **Home con el beneficio como
héroe** → 3. **Checklist visible pero descartable**: perfil → intereses →
seguir empresas → primera membresía (VIVA: OnboardingClienteFirstVisit) →
4. **Invitación a compartir** tras el primer momento de éxito (post-canje,
no antes — pedir compartir antes de recibir valor mata la conversión).

Mejora puntual (BRECHA pequeña): tras el **primer canje exitoso**, mostrar
"¿Te gustó? Invita a un amigo y gana X" — es el pico emocional exacto.

## 5 · Home inteligente + sistema de prioridades

El Home ya es dinámico (beneficio/campañas/stats/onboarding condicionales).
Se formaliza el **orden de decisión** (una sola pieza protagonista arriba):

1. Beneficio **por vencer** (urgencia real) — dato en `getMomentosVivos`
2. Beneficio **listo para usar** — VIVA (hero actual)
3. Recompensa de referidos disponible — dato en growth
4. Campaña activa destacada — VIVA (CampanasVivas)
5. Membresía por vencer / pago pendiente — dato en memberships
6. Empresa favorita con promo nueva — dato en feed.seguidas
7. Actividad reciente / novedades — VIVA (FeedNovedades)
8. Recomendaciones — VIVA (carruseles)

**BRECHA a implementar (Fase 3.6)**: `getHomePrioridad()` — una función
única que evalúa esta escalera y devuelve el bloque protagonista + su nivel
de urgencia (alta → `FlashPromotion`, media → `PromoBanner`, baja → tarjeta).
El popup inteligente ya usa exactamente esta lógica (vence > regalo >
campaña): se extrae y comparte.

## 6 · Reducción de fricción (proceso a proceso)

| Proceso | Hoy | Recorte |
| --- | --- | --- |
| Registro | mínimo + regalo | ✓ mantener; nunca añadir campos |
| Login | correo+clave | BRECHA: enlace mágico / OTP (fase futura) |
| Comprar membresía | plan → pago (2 vías) → activación | ✓ ya con pago presencial por referencia |
| Adquirir promoción | detalle → solicitar → pagar | PARCIAL: falta "pagaré en sucursal" en promos (cola POS F6) |
| Usar QR | 1 tap (dock central) | ✓ resuelto en Fase 2 |
| Seguir empresa | 1 tap | ✓ |
| Compartir / invitar | 1 tap con mensaje pre-armado | ✓ |
| Editar perfil | categorías en Perfil | ✓ Fase 3 |
| Buscar promociones | feed por intención + buscador | ✓ |

## 7 · Puntos de abandono → solución

| Riesgo | Solución | Estado |
| --- | --- | --- |
| Formulario largo en registro | perfil progresivo (checklist) | VIVA |
| Silencio tras registrarse | celebración + beneficio inmediato | VIVA |
| QR difícil de encontrar | dock central permanente | VIVA |
| Beneficio olvidado → vence | momento VENCE + popup + prioridad 1 del Home | VIVA/PARCIAL (falta notificación push/email programada) |
| Pago = barrera | pago presencial con referencia | VIVA |
| Carga lenta | skeletons por ruta + imágenes optimizadas | VIVA |
| Promo poco clara | PromoAd con precio/usos/vigencia explícitos | VIVA |
| Catálogo vacío (ciudad sin empresas) | recomendaciones globales + campañas | PARCIAL |

## 8 · Sistema de descubrimiento

Vivo hoy: carruseles por intención (sigo/destacadas/nuevas/expiran pronto/
recomendadas por afinidad de intereses), empresas recomendadas, novedades de
empresas seguidas, marketplace público, mini-web por empresa, ruleta.
**BRECHAS**: "tendencias" (más canjeadas de la semana — los datos están en
Transaction) y "empresas similares" en el detalle de empresa (afinidad por
categoría — datos listos). Ambas de bajo esfuerzo.

## 9 · Retención (volver sin spam)

Regla: **cada aviso necesita un motivo real y accionable.** Vivo: momentos
vivos, campañas con countdown, automatizaciones (cumpleaños, por vencer,
inactivos) con plantillas por segmento, notificaciones segmentadas.
**BRECHAS**: (a) programar las automatizaciones de retención como avisos
push/email con tope de frecuencia (hoy son in-app), (b) racha/frecuencia
visible (Duolingo-light: "3 visitas este mes — 1 más para tu recompensa" —
el dato existe en visitas), (c) resumen semanal "lo que te espera".

## 10 · Recompensas por acción (configurables)

Motor existente: growth (puntos/niveles/logros/retos), referral engine
(recompensas por hito), campañas de invitación (regalo por registro),
ruleta. **BRECHA central**: un panel único **Admin → Recompensas** que
mapee `acción → recompensa` (registrarse, seguir, primer canje, invitar,
comprar, renovar, compartir) sobre el Automation Engine que ya ejecuta
estas reglas — configuración de datos, cero código, como pide el spec.

## 11 · Recorridos por segmento

Los segmentos ya existen en el vocabulario de plantillas (`nuevo`,
`frecuente`, `vip`, `inactivo`, `miembro`, `alto_valor`, `convertido`).
Experiencia diferenciada en el Home (misma escalera §5, distinto énfasis):

| Segmento | El Home abre con |
| --- | --- |
| Nuevo (sin canje) | beneficio de registro + checklist |
| Sin membresía | plan recomendado + prueba social |
| Con membresía | usos/vencimiento + beneficio del día |
| Con promociones | "listos para usar" |
| Frecuente | racha + reto activo + novedades de seguidas |
| Inactivo | oferta de recuperación (playbook REC) |
| VIP / Embajador | reconocimiento visible (badge de nivel) + acceso anticipado a campañas — BRECHA |

## 12 · Métricas por etapa (fuentes ya disponibles)

| Etapa | KPI | Fuente |
| --- | --- | --- |
| Descubrir | CTR de enlaces compartidos | ReferralEvent / eventos de campaña |
| Registro | registros/día, % por campaña | User + atribución (cookie) |
| Activación | % primer canje ≤7 días | Transaction (tipo visita/canje) |
| Compra | conversión a membresía, tiempo hasta compra | Membership + Transaction SALE |
| Retención | D7/D30, visitas/mes | visitas + AuditLog |
| Referidos | invitados→registrados→activados, K-factor | referral engine |
| Seguimiento | empresas seguidas/usuario | CompanyFollow |
| Promos | adquiridas, % usadas, % vencidas sin usar | ProductoCompra |
| Renovación | % renovación, churn | Membership ciclos |

**BRECHA**: tablero admin "Journey" que muestre este embudo (los datos ya
se registran; falta la vista agregada).

## 13 · Panel administrativo — configurable hoy vs. falta

**Ya configurable sin código**: campañas de invitación (regalo, OG, CTA,
landing), banners, notificaciones segmentadas, automatizaciones por
segmento, módulos del Home por empresa (popups/campañas/carruseles/
gamificación/prueba social + color), promociones 2.0 (stock/horas/
visibilidad), planes. **Falta**: recompensas por acción (§10), prioridad
manual de promociones (orden/urgencia/formato — se conecta a §5) y reglas
de activación del popup por campaña.

## 14 · Recomendaciones priorizadas (impacto × esfuerzo)

| # | Recomendación | Impacto | Esfuerzo |
| --- | --- | --- | --- |
| 1 | `getHomePrioridad()` compartido (Home + popup) con urgencia → FlashPromotion | Alto | Bajo |
| 2 | Momento "invita" tras el primer canje exitoso | Alto | Bajo |
| 3 | Celebración en la app del cliente al consumirse un canje | Alto | Bajo |
| 4 | Tendencias de la semana + empresas similares | Medio | Bajo |
| 5 | Racha de visitas visible con recompensa | Alto | Medio |
| 6 | Panel Admin → Recompensas por acción | Alto | Medio |
| 7 | Avisos push/email de retención con tope de frecuencia | Alto | Medio |
| 8 | Badge VIP/Embajador + acceso anticipado | Medio | Medio |
| 9 | Tablero admin del embudo (Journey) | Medio | Medio |
| 10 | Recompensa de renovación + momento cumpleaños in-app | Medio | Bajo |
| 11 | Login por enlace mágico/OTP | Medio | Alto |

## 15 · Plan de implementación por fases

- **Fase 3.6 — Prioridad y momentos** (recs 1–3): motor `getHomePrioridad`,
  invitación post-canje, celebración de canje en la app.
- **Fase 3.7 — Descubrimiento y hábito** (recs 4–5): tendencias, similares,
  racha con recompensa.
- **Fase 3.8 — Recompensas y retención admin** (recs 6–7, 10): panel de
  recompensas por acción, avisos programados, renovación/cumpleaños.
- **Fase 3.9 — Estatus y medición** (recs 8–9): VIP/embajador, tablero del
  embudo.
- **Backlog**: enlace mágico (11), pago presencial de promos (cola POS F6).

## 16 · Validación de coherencia con MDS / MUK / MMS

Cada mecanismo del journey usa piezas existentes del sistema: urgencia alta
= `FlashPromotion` (MMS), media = `PromoBanner`, celebraciones =
`CelebracionOverlay` + `animate-burst`, rachas/contadores =
`AnimatedNumber`, badges de segmento = `PromoBadge`, estructura de pantalla
= contrato CX2 §Estructura unificada. **Ninguna recomendación requiere
componentes nuevos fuera del kit** — solo datos y conexión. El checklist de
consistencia (CX2 §checklist) aplica a toda pantalla nueva del plan.
