# Membego Motion System (MMS) — Guía de movimiento

**Fase 1.6 · v1.0** · La guía oficial de animaciones, transiciones y
microinteracciones de Membego. Extiende el [MDS](./MDS.md) y el
[UI Kit](./MUK.md). El objetivo del movimiento no es decorar: es **guiar la
atención, destacar promociones, aumentar la conversión y transmitir calidad**.

## Filosofía

Referencias: Temu, SHEIN, Revolut, Airbnb, Uber, Duolingo, TikTok, Stripe,
Apple Wallet. La app debe sentirse **viva, premium y fluida desde el primer
segundo**, nunca infantil, exagerada ni molesta.

Siete reglas no negociables:

1. **Mobile first, 60 FPS.** Solo se anima `transform` y `opacity` (compositor
   GPU); jamás `width`/`height`/`top`/`left` en bucle. `box-shadow` solo en
   glows puntuales.
2. **El movimiento tiene propósito.** Cada animación guía el ojo hacia lo
   importante (promoción, CTA, cambio de estado). Si no comunica nada, se quita.
3. **Rápido por defecto.** Feedback <100 ms, transiciones 150–350 ms, héroes
   ≤500 ms, celebraciones ≤900 ms. Nada bloquea la interacción.
4. **Uno protagoniza.** Máx. un elemento "wow" por pantalla (un glow, un
   shine en loop, una celebración). El resto acompaña en silencio.
5. **Natural, no robótico.** Entradas que deceleran (`ease-out-expo`),
   celebraciones con rebote elástico (`ease-elastic`), nunca lineal salvo
   barras de tiempo.
6. **Reduce-motion es sagrado.** Con la preferencia activada, todo se
   simplifica automáticamente: nada se mueve, los bucles se detienen y el
   contenido aparece de una vez. La información nunca depende del movimiento.
7. **Cero costo cuando no anima.** Las primitivas no cargan librerías pesadas;
   el sistema es CSS + React ligero (IntersectionObserver + rAF).

## Tecnología (y cuándo escalar)

Hoy el MMS se implementa con **CSS + primitivas React ligeras**, que cubren
el 95% de los casos a 60 FPS y con bundle ≈0. La escalada a librerías se hace
**por componente y solo cuando el caso lo exige**, con carga diferida:

| Necesidad | Herramienta | Cuándo |
| --- | --- | --- |
| Entradas, hover, cascadas, shine, glow, contadores | **CSS + rAF + IntersectionObserver** | siempre (default) |
| Gestos, arrastre, transiciones compartidas complejas | **Framer Motion** (`LazyMotion` + `domAnimation`) | wallet stack avanzado, sheets con gesto — importar diferido |
| Ilustraciones animadas ricas (bienvenida, premios) | **Lottie** (`lottie-react`, lazy) | pantalla de registro, celebración de hito |
| Interacción compleja de vectores (mascota, estados) | **Rive** | futuro, si un asset lo requiere |

Regla: ninguna de estas se importa en el bundle global; se `dynamic import`
en la ruta/isla que la usa, detrás de `useReducedMotion`.

## Tokens de movimiento

Definidos en `globals.css` (`@theme`) y espejados en `@membego/ui/tokens`
(`motion`). **Toda animación consume estos tokens** — nunca un número suelto.

### Duraciones
| Token | Valor | Uso |
| --- | --- | --- |
| `--duration-instant` | 100 ms | tap / press (feedback táctil) |
| `--duration-fast` | 150 ms | hover, toggles, switches |
| `--duration-base` | 200 ms | transiciones estándar |
| `--duration-slow` | 350 ms | entradas de pantalla / tarjetas |
| `--duration-hero` | 500 ms | héroes, banners protagonistas |
| `--duration-celebration` | 900 ms | confeti, contadores, celebraciones |

### Curvas
| Token | Uso |
| --- | --- |
| `--ease-out-expo` | **entradas** (aparecer, deslizar) — decelera |
| `--ease-in-quint` | **salidas** (desaparecer) — acelera |
| `--ease-in-out` | movimiento continuo (loops, auto-scroll) |
| `--ease-spring` | rebote sutil (aparición de tarjetas, chips) |
| `--ease-bounce` | rebote marcado (badges, sellos) |
| `--ease-elastic` | check de éxito, desbloqueos |

### Utilidades CSS listas
Entradas: `.animate-fade-up`, `.animate-fade-in`, `.animate-scale-in`,
`.animate-slide-up`, `.animate-slide-in-right/-left`, `.animate-zoom-in`,
`.animate-card-flip`, `.animate-burst`. Vida/énfasis: `.animate-float`,
`.animate-pulse-soft`, `.animate-glow-pulse`, `.shadow-glow(-strong)`,
`.shine`+`.shine-sweep` (hover/loop). Tarjetas: `.card-interactive`,
`.card-lift`. Tiempo: `.time-drain`, `.draw-check`. Carga:
`.skeleton-shimmer`, `.scanner-line`. Escalonado: `.delay-75…500`.

## Primitivas del kit (`@membego/ui`)

| Pieza | Import | Qué hace |
| --- | --- | --- |
| `Reveal` | `ui/reveal` | aparece al entrar al viewport; `anim` fade-up/fade/slide/scale, `delay`, `once` |
| `Stagger` | `ui/stagger` | cascada: envuelve cada hijo en `Reveal` con retraso incremental (`step`, `maxDelay`) |
| `Shine` | `ui/shine` | destello diagonal, `modo` hover/loop |
| `Countdown` | `ui/countdown` | cuenta regresiva, variantes segmentos/inline (ver MUK) |
| `AnimatedNumber` | `ui/animated-number` | contador rAF con out-expo (KPIs, puntos, ahorro) |
| `FlashPromotion` | `ui/flash-promotion` | promoción hero estilo Temu (ver abajo) |
| `useReducedMotion` | `hooks/use-reduced-motion` | ¿reduce-motion? para primitivas JS |
| `useCountdown` | `hooks/use-countdown` | lógica de cuenta regresiva sin hidratación rota |
| `CelebracionOverlay` | `src/components/invitaciones` | confeti canvas (premios, hitos) |

## Guía por superficie

**Botones.** `active:scale-[0.98]` (tap) integrado; hover = opacidad/fondo.
CTA protagonista = `Button variant="premium"` (glow) envuelto en `Shine`
`modo="loop"`. `loading` muestra spinner. Ripple: no se usa — el scale táctil
es el feedback (más barato y menos ruidoso).

**Inputs / switches / checks.** Focus = ring (global). Error = ring
destructivo + `.animate-fade-up` del mensaje. Éxito de validación = `.draw-check`
(el visto se traza). Switch = transición del thumb 150 ms.

**Tarjetas.** Nunca 100% estáticas: reposo con sombra 1; hover = `.card-lift`
(eleva 4 px + escala 1.01 + sombra hero) o `.card-interactive` (sutil). Premium
= añadir `Shine` en loop + `.shadow-glow`. Entrada en listas = `Stagger`.

**Promoción protagonista (Temu-style).** `FlashPromotion`: entra con
`scale-in`, glow que respira (`animate-glow-pulse`), `Shine` en loop, cuenta
regresiva inline, **barra de tiempo que se agota** (`.time-drain` con el
tiempo real), CTA que pulsa (`animate-pulse-soft`) y, al expirar, se
desvanece y dispara `onExpire`. No es un popup: se integra en el flujo (hero
del home, tope de una lista).

**Banners y carruseles.** `PromoBanner` (MUK) + `Reveal`. Carrusel:
`embla-carousel-react` con snap + momentum + `dragFree`; auto-scroll con
pausa al tocar; loop infinito para promos. Sticky/floating = posicionar
`PromoBanner size="slim"` con `sticky`/`fixed`.

**Contadores.** Todo número importante (puntos, referidos, ahorro, usos,
nivel, descuentos) = `AnimatedNumber`.

**QR.** Aparece con `scale-in` + `.shadow-glow`; escaneo OK = `.draw-check`
+ `CelebracionOverlay`; scanner = `.scanner-line` + feedback de check/error.

**Membresías / Wallet.** Tarjeta con gradiente + `Shine` loop + `.animate-float`
sutil + glow premium. Stack tipo Apple Wallet: apilar con `translateY`
negativos y expandir en tap (escalada a Framer Motion si se quiere gesto de
arrastre).

**Invita y Gana / Registro / Beneficios.** Bienvenida = `Stagger` de la
pantalla; nuevo referido = `CelebracionOverlay` (confeti); recompensa =
`.animate-glow-pulse`; beneficio desbloqueado = `.animate-card-flip` + burst;
tras compartir = CTA con `animate-pulse-soft` + mensaje motivador. Registro
completado = pantalla completa con confeti + (opcional) Lottie diferido + QR
que entra con scale + glow.

**Empresa.** Al entrar: logo/banner con `Reveal`, y beneficios/promos/
servicios en `Stagger` (entrada escalonada).

**Toasts / modales.** Toast (sonner) = slide + fade + auto-dismiss.
Modal/sheet = backdrop blur + `scale-in`/`spring`; nunca aparecer de golpe.

**Loading.** Nunca solo un spinner de página: `Skeleton` que calca el layout
+ `.skeleton-shimmer`. Spinner solo puntual (botón, sección — ver
`Spinner`/`LoadingBlock` del MUK).

**Empty / offline / error.** `EmptyState` (MUK) con ilustración/icono +
mensaje + CTA + entrada `fade-up`. Errores en lenguaje humano con la salida,
nunca stack técnico.

**Navegación / Home.** Cambio de pantalla = fade/slide corto manteniendo
contexto. Home entra en **cascada** (`Stagger`): hero banner → promoción
principal (`FlashPromotion` si aplica) → beneficio disponible → eventos →
empresas destacadas → carrusel.

## Sistema de prioridad y urgencia

Qué se muestra primero y con cuánta energía visual debe ser **dato, no
código**. Modelo del MMS (contrato de presentación; las piezas ya lo aceptan
vía props):

```
prioridad = f(campañaActiva, tiempoRestante, esBeneficioNuevo,
              promoDestacada, membresíaRelevante, evento)
```

- **Orden**: mayor prioridad → primer lugar visual (tope del home / hero).
- **Energía visual por urgencia**:
  - `alta` → `FlashPromotion` con glow + shine loop + countdown + barra.
  - `media` → `PromoBanner` tono `hot` + `Reveal`.
  - `baja` → tarjeta normal en el carrusel.
- **Tiempo restante** tiñe la urgencia: el countdown y la barra comunican
  cuánto queda; cerca del fin, el glow es la única señal que se intensifica
  (nunca parpadeos agresivos).

Este cálculo se alimenta de las campañas/promociones que ya existen
(`campanas`, `promociones`, `beneficios`) — el motor de decisión de prioridad
se implementa en una fase posterior; hoy las primitivas ya aceptan `tono`,
`urgente`, `hasta` y orden para que el módulo las use.

## Configuración por el administrador (roadmap)

Objetivo: el negocio activa/desactiva y ajusta el movimiento **sin tocar
código**. Diseño previsto (fase siguiente, requiere esquema):

- Por campaña/promoción: `animacionActiva`, `formato`
  (hero_banner / popup / sticky / fullscreen / carrusel), `duracionMs`,
  `nivelUrgencia` (baja/media/alta), `prioridad`, `fechaInicio`, `fechaFin`,
  `orden`.
- La UI lee esa config y elige la primitiva y sus props (los componentes ya
  están parametrizados para recibirla). Respeta siempre `prefers-reduced-motion`
  del dispositivo por encima de cualquier configuración.

## Rendimiento y accesibilidad — checklist

- [ ] ¿Solo `transform`/`opacity` (y `box-shadow` puntual)? Nada de layout en loop.
- [ ] ¿Duración y curva salen de los tokens MMS?
- [ ] ¿Un solo elemento protagonista por pantalla?
- [ ] ¿Probado con `prefers-reduced-motion: reduce` (nada se mueve, todo visible)?
- [ ] ¿La info existe sin el movimiento (no depende de la animación)?
- [ ] ¿Bucles infinitos solo en elementos realmente "vivos" y detenibles?
- [ ] ¿Librería pesada (Framer/Lottie/Rive) cargada de forma diferida, no global?
- [ ] ¿60 FPS en un móvil de gama media (sin jank al hacer scroll)?
