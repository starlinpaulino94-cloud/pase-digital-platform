# CAPÍTULO 5 — UI: NUEVO DESIGN SYSTEM ("MEMBEGO PULSE")

*Auditoría Maestra de MembeGo · Volumen 5*

---

## 5.1 Crítica del sistema actual

Existe un design system documentado (`docs/DESIGN_SYSTEM.md`, tokens, Radix + Tailwind, componentes base) y se aplicó una pasada de rediseño (tareas UX.1–UX.10). El resultado es **correcto pero anónimo**: shadcn-por-defecto. Nada en la interfaz dice "esto es MembeGo": mismos radios, mismas sombras, misma paleta índigo/esmeralda que mil dashboards. Además conviven acentos inconsistentes (emerald hardcodeado en módulos de cliente, `#6366f1` como default de campañas, `primary` del tema en el resto).

Para el salto "parece hecho por una empresa internacional" no basta pulir: hay que definir un sistema con **firma visual propia**. Propuesta: **MembeGo Pulse**.

## 5.2 Conceptos de la firma visual

1. **El Pulso:** la marca gira alrededor del momento de canje (el "beep"). Un motivo visual de anillo/onda concéntrica (como la onda de un pago contactless) se usa en: éxito de canje, botón de escanear, badge de beneficio activo, splash. Es dueño de un gesto, no de un color.
2. **La Tarjeta-Beneficio como objeto físico:** los beneficios se renderizan como *tarjetas de billetera* (esquinas 20px, relieve suave, borde superior con el color de la empresa emisora) — no como cards genéricas de dashboard. La wallet debe *sentirse* wallet.
3. **Dos pieles, un sistema:** B2C (cliente/marketplace) = expresivo, cálido, con color de acento vibrante. B2B (empresa/superadmin) = sobrio, denso, neutro con el acento solo en datos y CTAs. Mismos tokens, distinta intensidad.

## 5.3 Tokens

### Color (modo claro / oscuro)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#FAFAF8` (hueso cálido, no gris azulado) | `#0E1113` | fondo app |
| `--surface` | `#FFFFFF` | `#16191C` | tarjetas |
| `--ink` | `#141619` | `#F2F3F1` | texto principal |
| `--ink-2` | `#5A6068` | `#9BA1A8` | texto secundario |
| `--brand` | `#0FBF8F` (verde-jade MembeGo, propietario: ni esmeralda tailwind ni teal genérico) | `#17D6A3` | CTAs, pulso |
| `--brand-ink` | `#064434` | `#0A231C` | texto sobre brand |
| `--accent` | `#FFB020` (ámbar premio) | igual | premios, celebración, VIP |
| `--danger / --warn / --ok / --info` | sistema estándar accesible AA | | estados |
| `--company` | dinámico por empresa | | borde de tarjeta-beneficio, landing de campañas |

Regla dura: **el color de empresa solo colorea objetos de esa empresa** (su tarjeta, su landing); la interfaz de MembeGo siempre es jade+ámbar. Hoy los colores de campaña tiñen pantallas enteras → la marca desaparece.

### Tipografía

- Display/UI: **una sola familia variable** (p. ej. "General Sans" o "Inter Tight") con dos voces: Display (títulos, tracking -2%, peso 650) y Text (peso 400/500).
- Números de dinero y contadores: tabular (`font-variant-numeric: tabular-nums`) SIEMPRE.
- Escala (rem): 12 · 13.5 · 15 (base) · 17 · 20 · 24 · 30 · 38 · 48. Interlineado 1.45 texto, 1.15 display.

### Espaciado, grid, forma

- Espaciado base 4px; ritmo de página 24/32; secciones separadas por espacio, no por líneas.
- Grid: 12 columnas máx 1200px (B2B), 4 columnas máx 480px "mobile-first real" (B2C, el cliente ES móvil).
- Radios: 8 (inputs/botones) · 12 (cards) · 20 (tarjeta-beneficio, modales) · full (chips, avatares).
- Sombras: 2 niveles únicamente — `e1: 0 1px 2px rgb(0 0 0 / .06)` (reposo) y `e2: 0 8px 24px rgb(0 0 0 / .10)` (flotante/hover). Prohibidas sombras coloreadas salvo el "pulso" de éxito.
- Bordes: `1px solid color-mix(in oklab, var(--ink) 8%, transparent)`.

### Movimiento

- Curva única `cubic-bezier(.2,.8,.2,1)`; duraciones 120ms (micro) / 200ms (elementos) / 320ms (páginas/overlays).
- Firma: **pulse-ring** (onda concéntrica 600ms) reservada para éxito de canje, beneficio recibido y meta lograda.
- Respeto a `prefers-reduced-motion` en todo.

## 5.4 Componentes clave (especificación)

- **Botones:** 3 variantes (primary jade / secondary outline / ghost) × 3 tamaños (32/40/48). Altura 48 obligatoria en B2C móvil. Loading = spinner reemplaza label (ancho fijo, sin brincos).
- **Inputs:** label siempre visible (nunca placeholder-como-label), 44px alto, error debajo en 13.5px con icono; prefijos para RD$ y teléfono.
- **Tarjeta-Beneficio (nuevo, componente estrella):**

```
┌────────────────────────────────┐
│▍(borde superior color empresa) │
│ LOGO  Lavado Premium Gratis    │
│       AutoSpa Naco             │
│                                │
│ RD$ 450   ⏳ vence en 12 días  │
│ ┌────────────────────────────┐ │
│ │      ▓▓ USAR AHORA ▓▓      │ │  → abre QR fullscreen
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

- **QR fullscreen:** fondo blanco puro, brillo forzado, QR 70% del ancho, nombre del cliente visible (anti-préstamo), un solo botón "Listo".
- **Tablas B2B:** densidad 44px por fila, primera columna fija, columnas secundarias colapsan a "..." en <1024px, orden y filtros persistentes.
- **Badges/Chips:** semánticos por estado del dominio (ACTIVO jade / POR VENCER ámbar / USADO neutro / VENCIDO tachado) — un solo mapa de estados para TODO el producto (hoy cada módulo inventa el suyo).
- **Sidebar B2B:** 5 dominios (Cap. 4), iconos + label, colapsable a 64px, sección activa con barra de 3px jade.
- **Header:** buscador global (clientes/promos/páginas) — hoy no existe y en un panel de 30 secciones es oxígeno puro.
- **Dashboard tiles:** KPI hero (número 38px tabular + delta con flecha y color) / tile de acción recomendada (icono + verbo + botón) / gráfico (línea/barras, un solo estilo).

## 5.5 Wireframes de referencia

**Home del cliente (móvil):**

```
┌──────────────────────────┐
│ Hola, María      🔔 (2)  │
│                          │
│ TU WALLET                │
│ RD$ 1,450 en beneficios  │
│ ┌────────┐ ┌────────┐   │
│ │Tarjeta │ │Tarjeta │ → │  (carrusel tarjetas-beneficio)
│ └────────┘ └────────┘   │
│                          │
│ ⏳ Por vencer esta semana │
│ ▸ 2x1 Café Roma — 3 días │
│                          │
│ 📍 Cerca de ti           │
│ ▸ AutoSpa (500m) 2 promos│
│                          │
│ 🎯 Tu reto: 2/5 amigos   │
│ ▓▓▓▓░░░░░░  [Invitar]   │
├──────────────────────────┤
│  Inicio  Wallet  QR  Yo  │  (tab bar fija, QR al centro)
└──────────────────────────┘
```

**Inicio de empresa (desktop):**

```
┌────────┬──────────────────────────────────────────────┐
│ ◉ Inicio│  Julio te generó                             │
│ Clientes│  RD$ 84,300  ▲ 12% vs junio                  │
│ Ofertas │  [128 clientes activos][46 canjes][9 nuevos] │
│ Crecim. │                                              │
│ Operac. │  RECOMENDADO PARA TI                         │
│         │  ⚡ 12 clientes sin venir hace 30 días        │
│  modo   │     [Enviarles "te extrañamos" →]            │
│  simple │  ⚡ Tu promo 2x1 vence mañana [Renovar →]     │
└────────┴──────────────────────────────────────────────┘
```

## 5.6 Plan de adopción

1. Tokens Pulse en `globals.css` + tema (1 semana, sin romper nada: mismos nombres de variables shadcn).
2. Componente Tarjeta-Beneficio + QR fullscreen + mapa único de estados (2 semanas).
3. Home cliente y Home empresa nuevos (2-3 semanas).
4. Migración por módulo con el resto del roadmap (nunca "big-bang" de UI).

---

*Continúa en el Volumen 6: Experiencia del cliente.*
