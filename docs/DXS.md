# Fase 4 — Membego Desktop Experience (DXS)

Arquitectura de la experiencia de escritorio: **el hermano mayor de la app
móvil**, no una ampliación. Mismo MDS/MUK/MMS, mismo lenguaje; el espacio
extra se gasta en **contexto, productividad y menos clics** — nunca en más
tarjetas ni más botones.

## 1 · Arquitectura del workspace

```
┌──────────┬──────────────────────────────────────────────┐
│ Sidebar  │ Top bar: buscador (Ctrl+K) · notifs · perfil │
│ fija     ├──────────────────────────────────────────────┤
│ (riel    │ Área principal (bloques en grid)             │
│ colapsa- │   + Panel contextual derecho (por módulo,    │
│ ble)     │     fases DXS.2+)                            │
└──────────┴──────────────────────────────────────────────┘
```

- **Sidebar** (VIVA + riel nuevo): navy de marca, grupos colapsables con
  memoria, indicador activo. **Nuevo**: colapsa a **riel de 68 px** (solo
  iconos + tooltips nativos), recuerda el estado (`localStorage`), anima el
  ancho (200 ms `ease-out`) y el contenido gana el espacio. Toggle en la
  cabecera (PanelLeftClose/Open).
- **Top bar** (VIVA): buscador global (abre la paleta), campana de
  notificaciones con badge, cambio de empresa, tema, menú móvil. No duplica
  la sidebar.
- **Command Palette** (VIVA): `Ctrl/Cmd+K`, navegación agrupada por
  secciones, teclado completo (↑↓/Enter/Esc — lo aporta cmdk). **Fase
  DXS.3**: resultados de datos (empresas/promociones/beneficios por nombre)
  además de navegación.
- **Panel contextual derecho** (PLAN): patrón `Sheet` del kit anclado a la
  derecha para ver detalle sin navegar (membresías, promociones, facturas).

## 2 · Mapa de navegación Desktop

El mismo mapa que móvil (una sola plataforma): sidebar = todas las
secciones; top bar = transversales (buscar/notifs/tema/empresa); paleta =
salto directo. El dock QR es exclusivo de móvil — en desktop el QR vive en
Mis membresías (el gesto de "mostrar el teléfono" no existe en desktop).

## 3 · Sistema de grids

Contenedores: `container max-w-5xl` (lectura) → `xl:max-w-6xl` (composición
holgada) → `max-w-7xl` (paneles densos admin). Patrones de bloque:

| Patrón | Uso |
| --- | --- |
| `grid gap-4 lg:grid-cols-2` | pares de contexto (wallet + invita) |
| `grid gap-3 sm:grid-cols-2 lg:grid-cols-4` | accesos rápidos / KPIs |
| `sm:grid-cols-3` | stats compactas |
| `lg:grid-cols-[1fr_340px]` | contenido + rail contextual (plan) |
| carrusel `no-scrollbar` | listas horizontales (igual que móvil) |

Regla: los bloques cambian de **composición**, nunca de componente — la
misma tarjeta de móvil se recompone en columnas.

## 4 · Layout por módulo (auditoría + plan)

| Módulo | Hoy en desktop | Decisión |
| --- | --- | --- |
| **Inicio** | columna única | **HECHO**: wallet + Invita y Gana lado a lado en `lg`; contenedor `xl:max-w-6xl`; accesos en 4 col; carruseles ganan ancho |
| **Mis membresías** | wallet stack centrado | **DXS.2**: panel lateral derecho con detalle (estado/usos/QR/historial) al seleccionar tarjeta — sin cambiar de página |
| **Promociones** | grid de PromoAds | **DXS.3**: marketplace con filtros laterales (categoría/orden/vista), vistas grid·lista·compacta |
| **Empresas (detalle)** | mini-web anclas | ya aprovecha desktop; añadir "empresas similares" (CJO §8) |
| **Pagos** | panel + historial | ya en bloques; **DXS.4**: enlazar facturas/descargas cuando exista exportación |
| **Invita y Gana** | secciones apiladas | **DXS.4**: campaña + progreso + registrados + recompensas en grid 2×2 simultáneo |
| **Perfil** | centro de identidad | resumen 3-col ya aprovecha; OK |
| **Beneficios** | centro de recompensas | resumen 3-col OK; lista gana columnas en `lg` (cola 2.x) |
| **Escáner / Caja / Admin** | paneles densos max-w-7xl | ya nativos de desktop (Fase E7/POS/F4) |

Preguntas obligatorias aplicadas: cada "Decisión" responde qué contexto
extra se muestra y qué clics se ahorran (el panel lateral de membresías
elimina 2 navegaciones; los filtros de promos eliminan el scroll ciego).

## 5 · Reglas responsive (1024 → ultrawide)

- 1024–1279: sidebar expandida, contenido 1 col ancha, pares en 2 col.
- 1280–1599: composición completa (`lg:` pares, 4-col accesos).
- ≥1600: el contenedor NO crece más (`max-w-6xl/7xl`); crece el aire
  lateral — nunca líneas de texto kilométricas ni tarjetas gigantes.
- Ultrawide: idéntico a 1920 centrado. La composición nunca se rompe:
  los grids colapsan por `sm/lg/xl` del MDS.

## 6 · Consistencia móvil ↔ desktop

Compartido al 100%: tokens (colores/tipos/radios/sombras), componentes MUK,
animaciones MMS, textos e iconografía. Cambia solo la **composición**:
móvil apila y prioriza el pulgar (bottom nav + dock QR); desktop compone en
columnas y prioriza teclado + cursor (sidebar + paleta + hover states). Un
usuario que salta de uno a otro reconoce cada pieza al instante.

## 7 · Atajos y accesibilidad

`Ctrl/Cmd+K` paleta · `Esc` cierra overlays (Radix) · `Enter` acepta ·
`↑↓` navegan la paleta · `Tab` recorre todo (focus ring global) ·
`Alt+C/L` modos del escáner. Riel: cada icono con `title` + `aria-label`;
toggle con `aria-label`. Contraste AA y reduce-motion heredados del MDS/MMS.

## 8 · Rendimiento

Server Components por defecto, skeletons por ruta, imágenes optimizadas,
grids CSS (sin JS de layout), transición del riel por `width` en el aside
fijo (sin reflow del contenido animado por JS). Virtualización: adoptar en
listas >100 filas (facturas/clientes admin) cuando crezcan — hoy `take`
acota las consultas.

## 9 · Checklist de validación Desktop

- [ ] ¿La pantalla muestra MÁS contexto (no más botones) que en móvil?
- [ ] ¿Algún flujo perdió clics respecto a móvil?
- [ ] ¿Los bloques usan los patrones de grid del §3?
- [ ] ¿Nada se rompe en 1024 / 1440 / 1920 / ultrawide?
- [ ] ¿Sidebar riel + expandida funcionan y recuerdan estado?
- [ ] ¿Todo alcanzable por teclado (paleta incluida)?
- [ ] ¿Mismos componentes MUK que móvil (cero variantes desktop-only)?
- [ ] ¿Hover con propósito (card-lift/acciones), nunca decorativo puro?

## 10 · Implementado en esta fase vs. plan

**HECHO (este PR)**: sidebar colapsable a riel con memoria/tooltips/
animación; Inicio en composición de columnas (`lg` pares + `xl:max-w-6xl`);
este documento (entregables 1–11).
**PLAN**: DXS.2 panel lateral de membresías · DXS.3 marketplace de
promociones con filtros + búsqueda con datos en la paleta · DXS.4 IyG en
grid simultáneo + exportaciones de pagos.
