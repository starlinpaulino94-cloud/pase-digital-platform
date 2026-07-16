# Fase 2 — Mobile First UX del cliente

Análisis y decisiones del rediseño móvil del módulo del cliente, sobre
[MDS](./MDS.md) + [MUK](./MUK.md) + [MMS](./MMS.md).

## La regla de las 3 preguntas

Toda pantalla del cliente debe responder en <3 s: **¿dónde estoy?** (header
limpio + tab activo), **¿qué puedo hacer?** (tarjetas con CTA claro),
**¿cuál es la acción principal?** (UNA por pantalla, en la zona del pulgar).

## Navegación (rediseñada)

### Barra inferior — 4 destinos + dock central
```
Inicio · Explorar · [ MI QR ] · Ofertas · Perfil
```
- **Mi QR es el dock central elevado** (gradiente de marca + glow + ring):
  la acción nº 1 de la app —mostrar el código en el local— vive SIEMPRE en
  la zona natural del pulgar.
- Análisis de alternativas para el QR: *FAB flotante* (lo que había) tapa
  contenido y "rompe la armonía"; *bottom sheet global* añade un paso y
  duplica la vista de membresía; *botón contextual* lo esconde en pantallas
  profundas. **Gana el dock central** (patrón Google Wallet): visible en
  toda la app, cero solapamiento, un solo tap. → `QrFab` retirado.
- Microinteracciones: píldora de fondo en el tab activo, icono a
  strokeWidth 2.4 + scale, press `active:scale-[0.96]`, blur del fondo.
- "Tarjetas" salió de la barra (la wallet se llega desde Inicio, el dock QR
  y Perfil); "Ofertas" ahora también cubre `mis-promociones`.

### Header
El `AppHeader` global queda (menú, notificaciones, cambio de empresa); el
Home abre con saludo + avatar ("¡Hola, Starlin!"). Sin migas ni títulos
pesados en móvil.

## Jerarquía del Home (orden fijo)

1. **Saludo + avatar** — ¿dónde estoy?
2. **🎁 Beneficio disponible** *(nuevo)* — si hay algo que usar HOY es lo
   primero: `PromoBanner hero` + `Shine` loop + CTA grande "Usar ahora".
3. **Campaña viva** — el banner rotativo con contador (promoción del día).
4. **Vistazo rápido** — membresías activas / usos / vencimiento animados.
5. **Wallet** — acceso a Mis membresías (card-lift).
6. **Invita y gana** *(nuevo)* — banner celebración siempre visible.
7. **Accesos rápidos** → carruseles → novedades (actividad) → CTA explorar.

Todo entra en cascada (`animate-fade-up` + delays; `card-lift` +
`active:scale` en lo tocable).

## Decisión pantalla por pantalla

| Ruta | Decisión | Nota |
| --- | --- | --- |
| `/cliente/inicio` | **Rediseñada** | jerarquía de arriba |
| `/mis-membresias` | Conservar | ya es wallet stack (Apple Wallet) |
| `/membresia/[id]` | Conservar | QR protagonista + pagos; destino del dock |
| `/cliente/explorar` | Conservar | grid premium de empresas |
| `/cliente/empresas(/[slug])` | Conservar | mini-web de empresa con anclas |
| `/cliente/promociones(/[id])` | Conservar | PromoAd estilo Temu |
| `/cliente/mis-promociones(/[id])` | Conservar | beneficios con QR |
| `/cliente/planes` | Conservar | selector por vehículo + tabs móviles |
| `/cliente/invita-y-gana` | Conservar | contadores + confeti |
| `/cliente/pagos` · `/historial` · `/perfil` · `/ayuda` | Conservar | rediseñadas en fases previas; siguientes en la cola de consistencia MUK |
| `/cliente/ruleta` | Conservar | gamificación |
| `/cliente/bienvenida` · `/celebracion` · `/intereses` | Conservar | onboarding/celebración |
| `/cliente/dashboard` | **Redirect** → mis-membresias | ya existía |
| `/cliente/membresia` | **Redirect** → mis-membresias | ya existía |
| `/cliente/referidos` | **Fusionada** → invita-y-gana | redirect vivo |

**Criterio "conservar"**: esas pantallas ya fueron reconstruidas con el
mismo lenguaje (fases W/P/R/F2-F4) y cumplen la regla de las 3 preguntas.
Rediseñarlas de nuevo sería churn sin valor para el usuario. El delta real
de esta fase era navegación + jerarquía del Home + el QR — hecho.

## Deuda de consistencia (cola para fases 2.x)

- Migrar dinero/fechas/estados sueltos a `Price`/`DateText`/`StatusChip`.
- `AnimatedCounter` (system) → `AnimatedNumber` del kit.
- Gestos: pull-to-refresh y swipe en tarjetas (evaluar con Framer Motion
  diferido, MMS §Tecnología).
- Validación en vivo de formularios con `.draw-check`.
