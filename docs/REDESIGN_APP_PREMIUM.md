# MembeGo · Rediseño Premium App-First

Referencias: mockup Google Studio (adjunto del 2026-07-15) + Uber, Airbnb,
Temu, Revolut, Duolingo, Notion Mobile, Stripe Dashboard, Apple Wallet.
Norte: **una app móvil que también funciona en escritorio**, no una web
adaptada. Cada pantalla transmite simplicidad, confianza, elegancia,
dinamismo y calidad.

---

## 1 · Auditoría de pantallas (estado actual)

| Pantalla | Estado | Veredicto |
|---|---|---|
| Home cliente (/mis-membresias) | Wallet Stack ✔, hero rotativo con contador ✔, carruseles ✔, gamificación ✔ | **Reordenar** al patrón app (saludo→hero→acciones→contenido) + saludo con avatar |
| Bottom Navigation | Existe (5 destinos) ✔ | Mantener; añadir **FAB "Mi QR"** flotante (mockup) |
| Explorar (/cliente/explorar) | Lista funcional tipo directorio | **Rehacer** al patrón mockup: buscador grande + chips + cards con precio y CTA gigante |
| Promociones cliente | Cards correctas pero neutras | **Rehacer** como publicidad profesional (Temu): gradiente, badge, contador, CTA enorme |
| Detalle membresía | WalletCard + QR + timeline ✔ (rediseño W.3) | Alineado |
| Planes | Rediseño Stripe/Apple ✔ (P.1–P.3) | Alineado |
| Mis pagos | Extracto Revolut + drawer ✔ | Alineado |
| Perfil empresa pública | Mini-web con hero/anclas ✔ (F3.3c) | Alineado (pulir en fase 3) |
| Invita y Gana | Confeti + QR + progreso ✔ (RF.4) | Alineado (pulir en fase 3) |
| Panel admin | Dashboard ejecutivo + BI ✔ (F4.8/UX.6) | Fase 4 (KPIs animados) |

## 2 · Design System (delta sobre UX.1)

Ya existen: tokens de color/tipografía/sombras, keyframes (fade/slide/scale/
shimmer/pulse), skeletons, glass, elevaciones, Badge/Button/Card/Dialog/
Sheet/Dropdown/Tabs, BottomNav, confeti (CelebracionOverlay), Reveal.

**Se AÑADEN** (nuevos, no parches):
- `EmptyState` — estados vacíos ilustrados (icono grande decorado + halo de
  gradiente + título + CTA), único para toda la app.
- `AnimatedCounter` — contadores que suben animados al entrar al viewport.
- `QrFab` — botón flotante "Mi QR" (mockup), siempre a un toque del QR.
- `PromoAd` — tarjeta de promoción tipo anuncio (gradiente, imagen, badge
  patrocinada/exclusiva/por vencer, contador regresivo, CTA gigante).
- `BusinessCard` — tarjeta de negocio del Explorar (logo con color, precio
  "desde $X/mes", CTA "Adquirir membresía" full-width).

**Se ELIMINAN/reemplazan**: `MembershipCard` (→ WalletCard, hecho), filas
tipo tabla del historial (→ LedgerRow, hecho), cards neutras del Explorar
(→ BusinessCard), cards neutras de promociones (→ PromoAd).

## 3 · Arquitectura visual (patrón de pantalla)

1. **Header limpio**: saludo + avatar + notificaciones (+ empresa).
2. **Banner principal**: campaña/promoción viva, auto-rotativo (CampanasVivas).
3. **Acciones rápidas**: 4 tiles máximo.
4. **Contenido principal**: 1 idea por bloque, mucho aire, sin divisores.
5. **Bottom Navigation** + FAB QR.

Reglas: tarjetas grandes · tipografía generosa · pocas acciones por
pantalla · nada aparece de golpe (Reveal/fade-up escalonado) · gradientes
solo con propósito (marca del negocio, promo, recomendado).

## 4 · Fases

- **Fase 1 (esta entrega)**: FAB QR global, Home reordenado con saludo-avatar,
  Explorar premium (BusinessCard), Promociones tipo Temu (PromoAd),
  EmptyState + AnimatedCounter en el design system.
- **Fase 2**: transiciones entre páginas (View Transitions), loading premium
  por ruta, estados vacíos ilustrados en todas las pantallas.
- **Fase 3**: perfil de empresa (galería + reseñas), Invita y Gana campaña
  total (metas visuales + confeti en hitos).
- **Fase 4**: panel admin con KPIs animados, gráficas y menos tablas.


---

## 5 · Arquitectura de color por módulo (regla vigente)

| Módulo | Familia de color | Uso |
|---|---|---|
| Marca / Membresías / Explorar / QR | **Esmeralda → teal** (primario) | CTAs, gradientes de marca, FAB, recomendado |
| Promociones / Ofertas | **Rosa → naranja** | Badges de descuento, CTA "Aprovechar ahora", fallback de imagen |
| Pagos | **Neutro + semánticos** | Extracto sobrio; verde/rojo solo para aprobado/rechazado |
| Perfil de empresa / Wallet | **Color de la empresa** (dato) | Tarjetas y hero heredan `colorPrimario` del negocio; fallback esmeralda profundo |
| Novedades (feed) | Por tipo: promo=naranja, beneficio=esmeralda, evento=violeta, noticia=gris | Distinción de categoría |
| Estados | success/warning/info/destructive (tokens) | Nunca decorativos |

Regla: NINGÚN azul/índigo decorativo suelto — el azul quedó reservado al
token semántico `info`. Todo gradiente de marca es esmeralda→teal.
