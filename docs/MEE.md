# Fase 5 — Membego Experience Engine (MEE)

El motor que mantiene la plataforma **viva**: cada apertura de la app muestra
algo relevante, con la energía visual justa, decidido por datos — nunca al
azar, nunca invasivo. Integra y gobierna los sistemas construidos en fases
anteriores; este documento es su arquitectura oficial y mapea los 14
entregables a lo VIVO, lo implementado en esta fase y el plan.

## Arquitectura

```
              DATOS DEL CLIENTE (ya cargados por cada pantalla)
   momentos vivos · beneficios · membresías · campañas · referidos · feed
                                   │
                     ┌─────────────▼──────────────┐
                     │  MOTOR DE PRIORIZACIÓN     │  src/modules/experience/engine.ts
                     │  elegirExperienciaHero()   │  (lógica pura, testeable)
                     └─────────────┬──────────────┘
                                   │ ExperienciaHero { tipo, urgencia, cta… }
              ┌────────────────────┼─────────────────────┐
              ▼                    ▼                     ▼
   <ExperienciaHero/>      PopupInteligente        (futuras superficies)
   urgencia ALTA → FlashPromotion (countdown+barra+glow)
   urgencia MEDIA → PromoBanner hero + Shine
   urgencia BAJA  → PromoBanner base
```

**Principio**: el motor decide (datos), las piezas MMS ejecutan (emoción),
la config por empresa gobierna (admin). Toda animación tiene un objetivo:
urgencia, celebración, guía o descubrimiento.

## Escalera de prioridad (implementada)

1. **Beneficio por vencer** → ALTA — `FlashPromotion` con cuenta regresiva
   real y barra de tiempo que se agota.
2. **Beneficio listo** → MEDIA — banner hero de marca con shine.
3. **Pago pendiente de membresía** → MEDIA — "un paso para activar".
4. **Referidos nuevos** → BAJA — celebración que invita a re-compartir.
5. **Nada accionable** → la pantalla continúa con campañas y carruseles.

El popup inteligente usa la misma escalera (vence > regalo > campaña) con
tope de frecuencia de 24 h — próximo paso: que consuma este mismo módulo.

## Los 14 entregables — estado

| # | Entregable | Estado |
| --- | --- | --- |
| 1 | Arquitectura del motor | **HECHO** (este doc + `src/modules/experience/`) |
| 2 | Banners dinámicos | VIVO: `PromoBanner` (5 tonos × 3 tamaños: hero/base/slim ≈ hero/sticky/bottom), `FlashPromotion` (countdown), CampanasVivas (rotativo admin-config), popup (fullscreen-lite), StatusBanner (emergencia). Welcome/Success = CelebracionBienvenida/Overlay |
| 3 | Carruseles | VIVO: CarrouselesHome por intención (sigo/destacadas/nuevas/expiran/recomendadas), empresas seguidas, embla (snap/momentum/touch). PLAN: autoplay con pausa al tocar; trending (datos en Transaction) |
| 4 | Stories | **PLAN** (MEE.3): historias temporales por empresa con indicador de visto — requiere esquema (tabla stories + vistas); las publicaciones (EVENTO/NOTICIA/BENEFICIO) ya son la fuente natural |
| 5 | Lottie | PLAN por política MMS: carga diferida solo donde aporte (registro, hitos); hoy Canvas confetti + CSS cubren celebraciones a 60 FPS con bundle 0 |
| 6 | Rive | PLAN (mascota/estados premium) — misma política de carga diferida |
| 7 | Skeletons | VIVO: por ruta, calcan el layout real + shimmer |
| 8 | Empty states premium | VIVO: EmptyState ilustrado + mensaje + CTA en todos los vacíos del cliente |
| 9 | Transiciones | VIVO: template slide-up entre páginas, overlays con scale/spring, `transform: none` final (sin bugs de anclaje) |
| 10 | Microinteracciones | VIVO: biblioteca MMS (press/hover/card-lift/shine/glow/draw-check/contadores) |
| 11 | Motor de priorización | **HECHO**: `elegirExperienciaHero` + renderer `<ExperienciaHero/>` conectado al Home |
| 12 | Config desde admin | VIVO parcial: campañas (contenido/CTA/fechas/destacada/OG), módulos del Home por empresa (popups/campañas/carruseles/gamificación/prueba social + color), promos 2.0, notifs segmentadas, automatizaciones. PLAN: formato/urgencia/frecuencia/orden por experiencia + A/B (tabla `experiencias`) |
| 13 | Analíticas del engine | PLAN: eventos vista/click/cierre/conversión por experiencia — el `data-experiencia` ya marca el DOM; falta el sink (tabla o event dispatcher existente) + tablero |
| 14 | Documentación | **HECHO** (este archivo; complementa MMS.md y CJO.md) |

## Experiencias contextuales (por segmento)

La escalera ya diferencia por estado real (nuevo sin nada → onboarding
checklist; con beneficio → héroe; con pago → activación; con referidos →
celebración). El mapa completo por segmento (VIP/embajador/inactivo) está en
CJO §11 y se implementa sobre este mismo motor añadiendo entradas a la
escalera — sin tocar las superficies.

## Rendimiento

El motor es una función pura sobre datos ya cargados (0 consultas extra,
0 ms perceptibles). Las piezas visuales son CSS/Canvas del MMS (60 FPS,
compositor GPU, reduce-motion respetado). Lottie/Rive entrarán solo con
`dynamic import` en la superficie que los use.

## Plan de fases del MEE

- **MEE.2 — Config y frecuencia**: tabla `experiencias` (formato, urgencia,
  público, fechas, frecuencia, orden) + panel admin; el popup y el hero la
  leen. Incluye tope de frecuencia unificado.
- **MEE.3 — Stories**: historias temporales por empresa (fuente:
  publicaciones + campañas) con indicadores de visto.
- **MEE.4 — Analíticas**: sink de eventos de experiencia + tablero admin
  (vistas/clicks/conversión por experiencia) para optimizar campañas.
- **MEE.5 — A/B**: variantes por experiencia con reparto y métrica.
