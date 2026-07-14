# Engagement Engine — Roadmap por fases

MembeGo no debe sentirse como un panel administrativo, sino como una app que el
usuario quiere abrir todos los días. La estrategia (inspirada en Temu/TikTok pero
orientada a **fidelización**, no a vender productos) es construir un **Engagement
Engine**: una capa central que alimenta campañas, banners, urgencia, celebraciones,
gamificación y personalización — reutilizada por todos los módulos.

**Principio rector:** ninguna pantalla "muerta"; siempre algo que se mueve, cambia,
genera curiosidad o recompensa. **Regla dura:** siempre datos REALES, nunca inventados.

---

## Fase 1 — Home vivo + kit de animaciones reutilizable  ✅ (en curso)
Sin cambios de base de datos. Todo con datos que ya existen.
- Kit reutilizable: `Countdown`, `Confetti`, glow/pulse/bounce/shine/float.
- "Momentos vivos" en el Home (`/mis-membresias`): saludo personalizado + tarjetas
  con datos reales — beneficio pendiente por reclamar (CTA que palpita), beneficio
  que vence pronto (contador), progreso de Invita y Gana.
- Resolver central `modules/engagement/momentos.ts` que arma el feed desde la BD.

## Fase 2 — Motor de Campañas  ✅
Modelo `MarketingCampaign` (`marketing_campaigns`) con tipo, fechas, ventana horaria
(Happy Hour) y días de la semana, prioridad, `destacada`, banner/imagen, colores,
CTA y cupos (`maxReclamos`/`reclamosCount`). Tipos: Flash Sale, Oferta del día, Fin de
semana, Happy Hour, Primera compra, Bienvenida, Regreso, Cumpleaños, Por vencer,
Personalizada.
- Resolver `modules/engagement/campanas.ts` — `getCampanasVivas(companyId)` filtra por
  estado ACTIVA + ventana de fechas + día de la semana + ventana horaria (hora local
  de RD, UTC-4) + stock, y calcula `terminaEn` para el contador.
- Home (`/mis-membresias`): banner vivo `CampanasVivas` con contador y urgencia
  ("¡Solo quedan X cupos!"), arriba de Momentos vivos.
- Admin `/admin/marketing`: CRUD con vista previa en vivo, activar/pausar y eliminar.
  Server actions con `requireSection('marketing')` + `resolveCompanyId`.
- Migración `20260713_marketing_campaigns` (validada contra Postgres efímera).

## Fase 3 — Carruseles tipo Netflix
Filas horizontales reutilizando datos: 🔥 Ofertas · ❤️ Empresas que sigues ·
🎁 Beneficios · ⭐ Recomendaciones · 👑 Exclusivas de miembro · 🏆 Destacadas.

## Fase 4 — Urgencia y prueba social (datos reales)  ✅
"Quedan X cupones", "245 personas ya reclamaron", "Juan R. reclamó hace 2 min".
Todo desde hechos reales (nunca inventado). Genera FOMO.
- Resolver `modules/engagement/pruebaSocial.ts` — `getPruebaSocial(companyId)`:
  miembros totales, registros de la última semana, beneficios reclamados
  (ProductoCompra ACTIVA/CONSUMIDA) y actividad reciente ("Juan R. · hace 2 min",
  solo nombre + inicial). Devuelve null si falla (realce, no núcleo).
- `components/engagement/PruebaSocial.tsx` — franja en el Home con estadísticas
  reales + ticker "En vivo" que rota la actividad reciente (respeta
  prefers-reduced-motion). Solo se muestra con masa suficiente (≥3 miembros).
- Urgencia por cupos ya existía en `CampanasVivas`; se añade "✅ X ya reclamaron"
  (reclamosCount real) a cada banner de campaña.

## Fase 5 — Banners dinámicos rotativos  ✅
Varios banners por empresa que rotan con animación; prioridad configurable.
Reutiliza el modelo `MarketingCampaign` de la Fase 2 (ya tiene bannerUrl,
prioridad, destacada, colores, CTA), así que NO requiere esquema nuevo.
- `CampanasVivas` pasa de banners apilados a un **carrusel** que rota cada 6s
  con animación, en el orden de prioridad del resolver (destacada → prioridad →
  cierre). Con una sola campaña se muestra fija.
- Controles: flechas, indicadores (dots), swipe táctil; pausa al pasar el ratón.
- Respeta prefers-reduced-motion (sin auto-rotación ni animación de entrada).

## Fase 6 — Gamificación (schema)
Niveles, logros, insignias, retos, puntos, ranking, rachas, ruleta, rasca y gana,
misiones, calendario de recompensas. Todo sobre el mismo motor.

## Fase 7 — Personalización por empresa (schema)
Tema, colores, animaciones, tipos de campaña, prioridad, banners por empresa.

## Fase 8 — Popups inteligentes + Sistema de eventos + Recomendaciones
Popups importantes (no molestos) disparados por eventos del motor
(registro → bienvenida → regalo → invita → confeti). Recomendaciones por
comportamiento del usuario.

---

## Arquitectura
- `modules/engagement/` — resolvers server-side que arman feeds desde datos reales.
- `components/engagement/` — kit visual reutilizable (contadores, celebraciones,
  tarjetas vivas, animaciones). Respeta `prefers-reduced-motion`.
- Cada nueva función (referidos, cupones, puntos, alianzas) reutiliza esta capa en
  lugar de construir un módulo aislado.
