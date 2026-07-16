# Membego UI Kit (MUK) — Catálogo de componentes

**Fase 1.5 · v1.0** · La biblioteca oficial de componentes de Membego,
construida sobre el [Membego Design System](./MDS.md). Toda pantalla se
ensambla con estas piezas.

## Regla de oro

> **Prohibido crear componentes visuales dentro de las páginas.**
>
> - ¿Es genérico (no sabe de negocio)? → vive en `packages/ui` (`@membego/ui/ui/*`).
> - ¿Es de dominio (membresías, promos, caja…)? → vive en `src/components/<dominio>/`
>   y se construye **componiendo** piezas del kit.
> - ¿Ya existe algo parecido? → se extiende con una variante, no se duplica.
> - Solo tokens MDS: cero hex, cero sombras manuales, cero tamaños inventados.

Todo componente del kit es: responsive (mobile first), accesible, dark-mode
ready, theme-ready (app esmeralda / landing azul vía tokens), type-safe y
documentado aquí.

## Arquitectura

```
packages/ui/src/
├── cn.ts            → utilidad de clases (clsx + tailwind-merge)
├── tokens.ts        → tokens como datos (@membego/ui/tokens)
├── hooks/           → hooks de UI (@membego/ui/hooks/*)
└── ui/              → componentes (@membego/ui/ui/*, alias @/components/ui/*)
src/components/<dominio>/  → composiciones de negocio (wallet, caja, qr, …)
```

---

## 1 · Fundaciones

| Pieza | Import | Qué es |
| --- | --- | --- |
| Tokens CSS | `globals.css` | colores/radios/sombras/motion — ver MDS §4–§12 |
| `tokens` | `@membego/ui/tokens` | los mismos valores como datos (hex/px) |
| `cn()` | `@membego/ui/cn` | combinar clases sin conflictos |

### AppIcon — `@membego/ui/ui/app-icon`
Wrapper ÚNICO de iconografía (Lucide line). Nunca se llama a un icono con
clases sueltas en código nuevo.
- **Props**: `icon` (LucideIcon) · `size` `xs|sm|md|lg|xl` (12→28 px) ·
  `tone` `default|muted|primary|success|warning|danger|info|inherit` ·
  `label` (aria; sin él es decorativo).
- **Cuándo sí**: todo icono. **Cuándo no**: logos de empresa (usar `Avatar`).
- **A11y**: decorativo = `aria-hidden`; con `label` = `role="img"`.

### Typography — `@membego/ui/ui/typography`
`Display`, `Heading` (`level` 1–4 visual + `as` semántico), `Text`
(`variant` `body|small|caption|overline|muted`). Emiten la escala oficial
`.text-h*`/`.text-body`… con la etiqueta correcta.
- **Cuándo sí**: todo título/párrafo nuevo. **Cuándo no**: dentro de
  componentes del kit que ya la aplican (PageHeader, cards).

---

## 2 · Botones y acciones

### Button — `@membego/ui/ui/button`
- **Variantes**: `default` (primary) · `secondary` · `outline` · `ghost` ·
  `link` (text) · `destructive` · `success` · **`gradient`** (marca, sin glow)
  · **`premium`** (gradiente + glow: EL CTA — máx. 1 por pantalla) ·
  **`glass`** (solo sobre imagen/gradiente).
- **Tamaños**: `sm` · `default` · `lg` · `xl` (CTA hero) · `icon` · `icon-sm`;
  full width = `className="w-full"`.
- **Estados**: hover/pressed/focus/disabled integrados; **`loading`** (prop)
  muestra spinner + `aria-busy` + deshabilita.
- **FAB**: `Button size="icon"` + `rounded-full shadow-floating` (referencia:
  `QrFab`). Efecto glow: reservado a `premium`; ripple: no se usa (el
  feedback táctil es `active:scale-[0.98]`).
- **No usar**: dos `premium`/`default` compitiendo; `destructive` sin
  `ConfirmDialog`.

### DeleteButton / ConfirmDialog
Acciones destructivas con confirmación. Siempre que algo se elimina o
revierte.

---

## 3 · Formularios

| Pieza | Import | Notas |
| --- | --- | --- |
| `Input` | `ui/input` | base de search/currency/phone (composición) |
| `Textarea` | `ui/textarea` | |
| `Select` | `ui/select` | >5 opciones o espacio reducido |
| `PasswordInput` | `ui/password-input` | toggle de visibilidad accesible |
| `Label` | `ui/label` | labels SIEMPRE visibles (no placeholder-as-label) |
| `Switch` | `ui/switch` | on/off inmediato |
| OTP | `input-otp` (lib) | códigos de verificación |
| Date | `react-day-picker` | fechas |
| Search | patrón `AppIcon(Search)` + `Input pl-9` en `Form` de next/form | |
| `SegmentedControl` | `ui/segmented-control` | 2–5 opciones exclusivas visibles (formatos, períodos) |

Validación: `aria-invalid` activa el ring destructivo automáticamente; el
error se muestra en `Text variant="caption"` + `text-destructive` bajo el
campo. Éxito silencioso (no se decora el campo válido).

---

## 4 · Datos y utilidades

### Price — `@membego/ui/ui/price`
EL formato de dinero. `value`, `original` (tachado para ofertas),
`gratisSiCero`, `size sm|md|lg|xl`. Exporta `formatearRD()` para strings.
**No usar** `toLocaleString` suelto en vistas nuevas.

### DateText — `@membego/ui/ui/date-text`
EL formato de fechas: es-DO, zona Santo Domingo, `<time>` semántico.
`formato: corto|hora|largo|largoHora|soloHora`.

### StatusChip — `@membego/ui/ui/status-chip`
Estados de negocio con punto de color: `tone success|warning|danger|info|neutral`,
`pulso` para estados vivos (caja abierta). **Distinción clave**:
- `StatusChip` → estado del sistema (Activa, Pendiente, Pagada…)
- `Badge` → etiqueta genérica/conteos
- `PromoBadge` → marketing (vende)

### AnimatedNumber — `@membego/ui/ui/animated-number`
Contador rAF con easing out-expo, `prefix/suffix/decimales`, respeta
reduced-motion. Para KPIs y puntos. (El `AnimatedCounter` de
`src/components/system` migrará a esta pieza en Fase 2.)

### RatingStars — `@membego/ui/ui/rating-stars`
Calificación de solo lectura (media estrella incluida) + total de reseñas.
`role="img"` con label completo.

### Avatar / AvatarStack — `@membego/ui/ui/avatar`
Personas y logos: imagen o iniciales deterministas. Stack con solape y "+N"
para prueba social. `size xs|sm|md|lg|xl`.

### Countdown — `@membego/ui/ui/countdown` (+ `useCountdown` en hooks)
Urgencia: `variant segmentos` (landings) o `inline` (tarjetas). Sin errores
de hidratación (placeholder `--` hasta el primer tick), `onFinish`.
**No usar** para duraciones sin fecha real de fin.

### Progress / Pagination / DataTable / StatCard
Ya en el kit: barras de progreso, paginación, tablas con `@tanstack/react-table`
y tarjeta KPI (esta última compone `AnimatedNumber`).

---

## 5 · Tarjetas

Base: `Card` (`ui/card`) — `rounded-2xl`, sombra 1, `.card-interactive`
para hover. Especializadas:

| Card | Dónde vive | Cuándo |
| --- | --- | --- |
| `GlassCard` | kit | overlays sobre imagen/gradiente — nunca fondo plano |
| `StatCard` | kit | KPIs de dashboards |
| `EmptyState` | kit | vacíos y errores con CTA |
| `WalletCard` / `WalletStack` | `src/components/wallet` | la membresía como objeto |
| `PromoAd` (Promotion Card) | `src/components/cliente` | promos estilo Temu |
| `BusinessCard` (Company) | `src/components/marketplace` | empresas |
| QR Card (`QRDisplay`/`QRShareCard`) | `src/components/qr` | el pase digital |
| Notification Card | centro de notificaciones | filas de aviso |
| Hero Card | composición: `PromoBanner size="hero"` | protagonista del home |

Horizontal/vertical/animated no son componentes distintos: son `Card` +
layout + `.animate-fade-up`.

---

## 6 · Banners y promociones

### PromoBanner — `@membego/ui/ui/promo-banner`
Banner de marketing server-safe con slots (`eyebrow`, `titulo`,
`descripcion`, `media`, children = CTAs).
- **Tonos** (fijos, no cambian con el tema): `brand` (beneficios,
  bienvenida, invita y gana) · `hot` (flash sale, oferta limitada) ·
  `premium` (VIP) · `navy` (informativo) · `celebracion` (felicidades).
- **Tamaños**: `base` (listas) · `hero` (protagonista) · `slim` (franja).
- **Cuenta regresiva**: pasar `<Countdown hasta={…} variant="inline" />`
  como `media`.
- Carousel/slider de promos: `embla-carousel-react` con `PromoAd`/banners
  dentro (patrón `Carrusel` en engagement). Popup/fullscreen: `Dialog` +
  contenido de banner (`PopupInteligente`). Sticky/floating: posicionar el
  `slim` con `sticky`/`fixed` en el layout.

### PromoBadge — `@membego/ui/ui/promo-badge`
Etiquetas que venden: `nuevo` (Nuevo/Hoy) · `hot` (Hot/Oferta/Más vendido) ·
`premium` (Premium/VIP/Exclusivo) · `urgencia` (Expira hoy/Limitado) ·
`gratis` · `recomendado` · `neutro`. Máx. 2 por tarjeta.

---

## 7 · Navegación

| Pieza | Dónde | Notas |
| --- | --- | --- |
| Sidebar + grupos | `src/components/layout` (`nav-config.ts`) | por rol |
| Top bar (AppHeader) | layout | |
| Bottom navigation móvil | layout | app del cliente |
| `Tabs` | kit | navegar contenido |
| `SegmentedControl` | kit | filtro exclusivo compacto |
| Command palette | kit (`ui/command`, cmdk) | búsqueda global/quick actions |
| Breadcrumb | `PageHeader` cubre el título de página; breadcrumbs solo en superadmin si hace falta | |

---

## 8 · Feedback

| Pieza | Import | Cuándo |
| --- | --- | --- |
| Toast | `ui/sonner` (`toast.*`) | confirmaciones y errores puntuales |
| `Alert` / `StatusBanner` | kit | avisos persistentes en página |
| `Dialog` / `AlertDialog` / `ConfirmDialog` | kit | modales y confirmaciones |
| `Sheet` | kit | bottom sheet móvil / drawer desktop (vaul/radix) |
| `Skeleton` + `.skeleton-shimmer` | kit | carga de PANTALLA (calca el layout) |
| `Spinner` / `LoadingBlock` | kit (nuevo) | carga PUNTUAL (botón, sección) |
| `Progress` | kit | avance determinado |
| `EmptyState` | kit | vacío / error / offline con CTA |
| Celebración (confeti) | `CelebracionOverlay` (`src/components/invitaciones`) | premios, activaciones, hitos |
| Success screen | composición: `EmptyState` tono success + `PromoBanner celebracion` | |

Jerarquía de carga: pantalla → Skeleton · sección → LoadingBlock · acción →
`Button loading`.

---

## 9 · Layouts

Ya resueltos por route groups + layouts de Next:
`(public)` landing/marketplace (tema azul) · `(cliente)` app del cliente ·
`(admin)` panel de empresa · `(empleado)` portal operativo · superadmin ·
auth. Todos consumen el mismo sidebar/header del kit de layout. No se crean
layouts nuevos por página: se usa el route group correcto.

---

## 10 · QR y dominio

Composiciones de negocio construidas con el kit (viven en `src/components`):
`QRDisplay` (preview + estados válido/expirado/cargando), `QRShareCard`,
scanner (`html5-qrcode` + `.scanner-line`), `UsageMeter` (usos de
membresía), `OpcionesPago`, `FacturaSheet`/`FacturaPrintDialog` (formatos
58/80/Carta/A4), `RuletaWheel`, widgets de referidos/campañas. Regla: si un
trozo de una composición es reutilizable y genérico, se extrae al kit.

---

## 11 · Animaciones del kit

Tokens de motion (MDS §11) + utilidades CSS listas: `.animate-fade-up/-in`,
`.animate-scale-in`, `.animate-slide-up`, `.delay-*` (stagger),
`.card-interactive`, `.skeleton-shimmer`, `.animate-pulse-soft`,
`.animate-float`, `.scanner-line`, `.shadow-glow` (premium shine).
Componentes animados: `AnimatedNumber`, `Countdown`, `CelebracionOverlay`
(canvas), `Reveal` (kit — entrada al hacer scroll).
Regla: CSS primero; canvas para confeti; Motion/Lottie/Rive quedan para
fases futuras si un caso lo exige. TODO respeta `prefers-reduced-motion`.

---

## 12 · Checklist para añadir un componente al kit

- [ ] ¿No existe ya una pieza o variante que lo cubra?
- [ ] ¿Es genérico? (si sabe de negocio → `src/components/<dominio>`)
- [ ] Solo tokens MDS (cero hex/sombras/tamaños manuales)
- [ ] Server Component salvo que necesite estado/efectos
- [ ] Props tipadas + variantes con `cva` + `data-slot`
- [ ] Estados: hover/focus/disabled/loading según aplique
- [ ] A11y: roles/aria, foco visible, target ≥44 px, reduced-motion
- [ ] Probado en claro/oscuro (y landing si es público)
- [ ] Documentado en este archivo (descripción, props, cuándo sí/no)
