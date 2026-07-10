# MembeGo Design System

Contrato visual del rediseño premium. **Toda pantalla nueva o rediseñada debe
salir de aquí** — nada de estilos inventados por página. Referencias de nivel:
Stripe, Linear, Notion, Airbnb, Revolut, Apple Wallet.

## Principios

1. **Minimalismo con aire.** Mucho espacio en blanco; nada apretado. Si una
   pantalla se siente llena, sobran elementos, no falta espacio.
2. **Una pregunta por pantalla.** Antes de tocar una pantalla, responder:
   *"¿Qué necesita hacer el usuario aquí?"* Todo lo que no aporte a eso se
   elimina o se simplifica.
3. **Jerarquía tipográfica, no cajas.** Preferir tipografía y espaciado a
   bordes y contenedores. Menos líneas, menos cajas anidadas.
4. **Mobile-first.** Diseñar primero el móvil; escritorio es la expansión.
5. **Consistencia absoluta.** Mismos botones, mismas cards, mismas tablas en
   todos los módulos. Un solo origen: `src/components/ui`.

## Tokens (definidos en `src/app/globals.css`)

### Color
- Marca: `--primary` (azul eléctrico), `--accent` (cian). Gradiente de marca:
  `from-blue-600 to-sky-500` (usar con moderación: hero, CTA principal, QR).
- Superficies: `--background`, `--card`, `--muted`, `--border`.
- **Estados semánticos** (usar SIEMPRE estos, nunca `text-green-600` suelto):
  - Éxito: `text-success`, `bg-success/10`
  - Alerta: `text-warning`, `bg-warning/10`
  - Peligro: `text-destructive`, `bg-destructive/10`
  - Info: `text-info`, `bg-info/10`
- Dark mode: automático vía variables (`.dark`). No hardcodear blancos/negros.

### Tipografía (clases del sistema)
| Clase | Uso |
|---|---|
| `.text-display` | Héroes / landing |
| `.text-h1` | Título de página (uno por pantalla) |
| `.text-h2` | Título de sección |
| `.text-h3` | Título de tarjeta |
| `.text-h4` | Subtítulo / grupo |
| `.text-body` | Texto normal |
| `.text-small` | Secundario |
| `.text-caption` | Metadatos |
| `.text-overline` | Etiqueta de sección en mayúsculas |

Fuente: Geist Sans (`--font-geist-sans`). No introducir otras fuentes.

### Espaciado
Escala 4/8: `1, 2, 3, 4, 5, 6, 8, 10, 12, 16` de Tailwind (4–64 px).
- Entre secciones de página: `space-y-8` (32px) mínimo.
- Padding de card: `p-5` o `p-6`.
- Padding de página: `px-4 sm:px-6 lg:px-8`.

### Radios
- Cards y contenedores: `rounded-2xl` (~20px) / héroe y modales `rounded-3xl`.
- Botones e inputs: `rounded-xl` (~14px).
- Pills/badges/avatares: `rounded-full` / `rounded-lg`.

### Elevación (sombras)
| Clase | Uso |
|---|---|
| `.elevation-1` (= `.shadow-card`) | Reposo |
| `.elevation-2` (= `.shadow-premium`) | Hover, dropdowns |
| `.elevation-3` (= `.shadow-premium-lg`) | Modales, elementos flotantes |
| `.shadow-glow` / `.shadow-glow-strong` | Solo CTA de marca |

Nunca usar `shadow-md/lg/xl` de Tailwind directamente.

### Glass y texturas
- `.glass` / `.glass-strong`: navbar flotante, chips sobre imágenes. Sutil.
- `.bg-grid` / `.bg-grid-light` / `.bg-dots` + `.mask-fade`: fondos de hero.

## Componentes (en `src/components/ui`)

- **Button**: variantes `default | secondary | outline | ghost | destructive |
  link | brand`; tamaños `sm | default | lg | xl | icon | icon-sm`. Siempre
  `active:scale-[0.98]`. CTA de marca lleva `shadow-glow`.
- **Input**: `rounded-xl`, focus con ring de marca. Errores con
  `aria-invalid` (nunca solo color).
- **Card**: `rounded-2xl border-border/60`. Si es clicable: `.card-interactive`
  (única forma de hover permitida: elevar 2px + elevation-2).
- **Badge**: `default | secondary | outline | destructive | success | warning |
  info | brand | brand-solid`. Estados de negocio → variante semántica.
- **Skeleton / SkeletonCard / SkeletonRow**: shimmer, no spinners. Un spinner
  solo dentro de un botón en submit.
- **EmptyState**: icono con halo + título + descripción + **acción
  recomendada**. Prohibido "No hay datos" sin siguiente paso.
- **StatCard**: KPIs. No inventar tarjetas de métricas nuevas.

## Animación

- Duración 150–300ms, easing `ease` o `cubic-bezier(0.16, 1, 0.3, 1)`.
- Entradas: `.animate-fade-up`, `.animate-slide-up`, `.animate-scale-in`
  (+ `.delay-*` para stagger).
- Flotación decorativa (`.animate-float*`) solo en héroes.
- Respetar `prefers-reduced-motion` (ya cubierto en las utilidades).

## Estados obligatorios por módulo

Cada pantalla con datos remotos cubre: **loading** (skeleton), **error**
(mensaje + reintentar), **vacío** (EmptyState con acción), **éxito** (toast
sonner). Nada de pantallas en blanco.

## Accesibilidad

- Focus visible siempre (`focus-visible:ring-2`).
- Botones-icono con `aria-label`.
- Contraste AA: texto secundario mínimo `text-muted-foreground` sobre card.
- Targets táctiles ≥ 40px en móvil.

## Proceso por fases (estado)

1. ✅ Design System (este documento + tokens + componentes base)
2. ⬜ Layout global (sidebar + header)
3. ⬜ Componentes compartidos (cards, tablas, forms)
4. ⬜ Marketplace público
5. ⬜ Portal del Cliente (estilo app bancaria)
6. ⬜ Panel de Empresa (CRM moderno)
7. ⬜ Panel SuperAdmin (centro de control)
8. ⬜ Portal del Empleado (scanner)
9. ⬜ Microinteracciones + skeletons + estados
10. ⬜ Auditoría visual de consistencia
