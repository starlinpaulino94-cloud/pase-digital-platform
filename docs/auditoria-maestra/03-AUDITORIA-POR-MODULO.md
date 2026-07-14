# CAPÍTULO 3 — AUDITORÍA POR MÓDULO

*Auditoría Maestra de MembeGo · Volumen 3*

Formato por módulo: ✅ qué está bien · ❌ qué está mal · 🗑 qué eliminar · ➕ qué agregar · 🔀 qué reorganizar · 💡 qué haría completamente diferente.

---

## 3.1 Marketplace público

✅ Landing con stats reales, categorías, perfiles de empresa tipo mini-web (beneficios/eventos/noticias con anclas), ratings, OG images dinámicas, sitemap/robots. Base sólida.
❌ `marketplace/queries.ts` de 806 LOC concentra todo; búsqueda es filtrado básico (sin búsqueda por texto real ni geolocalización — fatal para "negocios cerca de mí", que es EL caso de uso de un marketplace local); páginas dinámicas sin caching (cada visita anónima golpea la BD).
🗑 Secciones del perfil de empresa que dupliquen lo que ya muestra el feed.
➕ Búsqueda geolocalizada ("cerca de mí") con `Sucursal` (ya existe el modelo); filtros por beneficio ("con membresía", "con promo activa hoy"); ISR/caching agresivo para todo lo anónimo.
🔀 Separar queries por caso de uso (home, directorio, perfil).
💡 El marketplace debería ordenarse por *valor disponible ahora* ("3 beneficios activos hoy a 500m de ti"), no por orden alfabético/fecha. Es la diferencia entre un directorio y un producto de deseo.

## 3.2 Empresas (perfil público)

✅ Perfil autoadministrable, planes con color/orden, posts (evento/noticia/beneficio), seguir empresa.
❌ El perfil no responde la pregunta del visitante: "¿qué gano yo si me registro AQUÍ y AHORA?" — el CTA de valor (beneficio de bienvenida) no es el héroe de la página.
➕ Bloque hero: "Hazte cliente hoy y recibe X" conectado al motor de campañas; horario/mapa/WhatsApp visibles (datos de contacto son el 80% de las visitas a un perfil local).
💡 Tratar cada perfil como landing de conversión con un solo objetivo (registro atribuido), medido con el mismo embudo del Growth Engine.

## 3.3 Promociones

✅ Promociones 2.0 con tipos, horarios, stock y visibilidad; guardado por el cliente; feed inteligente (sigo/destacadas/nuevas/expiran).
❌ Doble sistema (`Promocion` viva + `Promotion` universal con dual-write sin lectores) — riesgo y confusión puros; el ciclo de compra de promoción vive en `visitas/actions.ts` (777 LOC) mezclado con visitas.
🗑 Dual-write al framework universal (congelar hasta que exista un consumidor).
➕ Plantillas de promoción EN el flujo de creación del admin (las 36 de car wash existen en código y no llegan a la UI de creación con un clic).
🔀 Extraer "compra de promoción" a su propio módulo (`modules/compras`).
💡 La promoción debería declarar su *objetivo* (captar/reactivar/frecuencia) al crearse y reportar contra ese objetivo. Hoy se crean promociones; deberían crearse *apuestas medibles*.

## 3.4 Membresías

✅ QR real por membresía, estados, flujo de cambio de plan con comprobante y aprobación, "Mis membresías" robusto.
❌ Renovación es manual (solicitud + comprobante + admin aprueba): no hay cobro recurrente → la palabra "membresía" promete algo que el sistema no cumple solo; doble sistema (Membership vivo + MembershipInstance motor).
➕ Pasarela con cobro recurrente (tokenización); recordatorios de vencimiento automáticos (el modelo de automatizaciones ya lo insinúa); *pausar* membresía (retención: quien pausa no cancela).
💡 Membresía con **uso visible**: "este mes usaste 3 de 4 lavados; llevas RD$680 ahorrados". El valor percibido de una membresía es la razón #1 de renovación, y los datos ya existen (Visit/canjes).

## 3.5 Invita y Gana (Growth Engine)

✅ El módulo más completo: campañas con landing pública en 2 pasos, OG para compartir, embudo de 9 eventos, entrega automática del premio vía wallet E8, guard atómico de stock, rate limit de eventos, personalización "Juan quiere regalarte…".
❌ Es el 4º sistema de referidos (ver Cap. 2.3); el rate limit de eventos es por instancia (inflable en serverless); los eventos `MEMBRESIA_ADQUIRIDA`, `PRIMER_CANJE`, `CONVERSION_FINAL` existen como tipos pero sus hooks de emisión hay que auditarlos end-to-end con datos reales.
➕ Dashboard de campaña para el admin con el embudo completo y costo por adquisición (premios entregados vs registros); A/B de título/beneficio en landing.
🔀 Consolidar sobre el dominio único de referidos (A-3).
💡 "Invita y Gana" debería ser un *programa permanente* con campañas como boosts temporales encima — no sistemas separados. Un solo saldo, una sola historia para el usuario.

## 3.6 QR y Escáner

✅ El mejor flujo de la plataforma: QrToken de un solo uso, `ProductoCompra` con máquina de estados y transiciones auditadas, scanner con soporte de lector físico HID (con tests!), roles de escáner.
❌ `ScannerClient.tsx` (532 LOC) mezcla cámara, HID, validación y UI; sin modo offline (un negocio con internet caído no puede canjear — caso real en LATAM).
➕ Cola offline con reintento (canjes pendientes de sincronizar); sonido/vibración de éxito (feedback de mostrador); métricas de canje por empleado (ya hay datos para esto).
💡 Convertir el momento de canje en el "sello" de la marca: pantalla de éxito grande, con nombre del cliente y valor canjeado — es el único momento donde cliente, empleado y marca están juntos frente a una pantalla.

## 3.7 Clientes (CRM del admin)

✅ Ficha con notas internas, acciones rápidas, segmentación para notificaciones.
❌ Lista de clientes sin señales de negocio accionables (¿quién está por perderse? ¿quién es VIP?); las automatizaciones (cumpleaños, inactivos, por vencer) existen como módulo pero su ejecución depende de un cron (`api/cron/automatizaciones`) cuya operación real (quién lo invoca, con qué frecuencia, monitoreo) no está documentada — riesgo de "feature que parece viva y está muerta".
➕ Segmentos calculados visibles (Nuevo / Activo / En riesgo / Perdido / VIP) como columna y filtro; verificación observable del cron (última ejecución, resultados) en el panel.
💡 El CRM debería ser una *bandeja de acciones*, no una tabla: "estos 12 clientes no vienen hace 30 días → tócalos con esta promo" (1 clic). La tabla es el medio, no el producto.

## 3.8 Dashboard de empresa

✅ Métricas + accesos rápidos + BI con recomendaciones (F4.8).
❌ Muestra actividad, no *retorno*: no responde "¿cuánto dinero me generó MembeGo este mes?" — la única pregunta que garantiza la renovación del negocio.
➕ KPI héroe: ingresos atribuidos (membresías cobradas + canjes con monto) vs mes anterior; embudo único: visitas → registros → primer canje → recurrente.
💡 Rediseñarlo como "estado de resultados de fidelización" (ver Cap. 7).

## 3.9 Administrador (panel empresa, transversal)

✅ Amplitud enorme: perfil, promociones, planes, clientes, campañas, publicaciones, notificaciones, automatizaciones, estrategias, referidos, invitaciones, pagos, reportes, estadísticas…
❌ ESA amplitud es el problema: ~30 secciones al mismo nivel en el sidebar; conceptos que se solapan (Campañas vs Invitaciones vs Estrategias vs Automatizaciones vs Publicaciones — un dueño de car wash no distingue esas cinco palabras).
🗑 "Estrategias" como sección separada (fusionar como plantillas dentro de Promociones/Automatizaciones).
🔀 Reagrupar el sidebar en 5 dominios mentales: **Inicio · Clientes · Ofertas (promos+planes+campañas) · Crecimiento (invitaciones+publicaciones+notificaciones) · Operación (pagos+reportes+config)**.
💡 Modo "simple/avanzado": una PYME empieza con 6 secciones; el resto aparece cuando lo necesita.

## 3.10 Superadmin

✅ Control de empresas, planes, usuarios, operaciones, reportes; alta de empresa con su admin.
❌ Sin herramientas de soporte operativas (impersonar empresa para debug, ver salud por tenant); "operaciones" mezcla aprobaciones de pagos con gestión.
➕ Vista de salud por empresa (clientes activos, canjes/semana, última actividad) para detectar churn de empresas — el superadmin es el CSM de la plataforma.

## 3.11 Empleado

✅ Portal enfocado (scanner), roles correctos.
❌ Es solo el escáner: el empleado no puede registrar un cliente nuevo en mostrador ni consultar una membresía por teléfono/nombre cuando el cliente no trae el QR (caso diario real).
➕ Búsqueda de cliente + canje manual con auditoría; registro rápido de cliente en mostrador (el mostrador es EL canal de adquisición de un negocio físico).

## 3.12 Configuraciones

✅ Perfil de empresa, métodos de pago, WhatsApp config (modelo).
❌ Dispersas; `WhatsAppConfig` sin funcionalidad real detrás.
➕ Onboarding checklist permanente ("te falta: logo, método de pago, primera promo") — ya existe para el alta, debería vivir en configuración hasta completarse.

## 3.13 Notificaciones

✅ In-app con tipos, segmentación por empresa, notificaciones solo a seguidores.
❌ Solo in-app: sin email transaccional consistente ni WhatsApp/push reales — una notificación in-app solo la ve quien ya abrió la app: no *recupera* a nadie.
➕ Canal email (Resend/SES) para: beneficio recibido, por vencer, membresía por renovar; WhatsApp después (es el canal LATAM).
💡 Preferencias por canal del usuario desde el día 1 (anti-spam = confianza).

## 3.14 Beneficios / Historial / Pagos / Reportes

- **Beneficios (wallet):** ✅ E8 impecable en diseño. ➕ valor monetario acumulado visible ("has ahorrado RD$X") — dato barato, impacto enorme en retención.
- **Historial:** ✅ transiciones auditadas. ➕ exponer al cliente su propio historial de canjes (confianza) — hoy es principalmente interno.
- **Pagos:** ❌ el hueco más grande del producto — solo comprobante manual. El puerto `lib/payments` está bien diseñado (intents, providers); falta el primer provider real (Azul/CardNET para RD, Stripe para internacional). Sin esto no hay SaaS.
- **Reportes:** 🟡 existen por sección; falta el reporte que importa: retorno por empresa (Cap. 7) y export CSV.

---

### Tabla resumen de prioridades por módulo

| Módulo | Salud | Acción #1 |
|---|---|---|
| QR/Escáner | 🟢 | Modo offline + momento de canje memorable |
| Invita y Gana | 🟢 | Dashboard de embudo para admin |
| Wallet/Beneficios | 🟢 | Valor acumulado visible |
| Marketplace | 🟡 | Geolocalización + caching |
| Membresías | 🟡 | Cobro recurrente + uso visible |
| Promociones | 🟡 | Congelar dual-write; plantillas en la UI |
| CRM Clientes | 🟡 | Segmentos accionables |
| Dashboard empresa | 🟡 | KPI de retorno |
| Panel admin (IA) | 🟠 | Reagrupar sidebar (5 dominios) |
| Notificaciones | 🟠 | Canal email real |
| Pagos | 🔴 | Primer provider de pasarela |
| Superadmin | 🟡 | Salud por tenant |
| Empleado | 🟡 | Búsqueda + registro en mostrador |

---

*Continúa en el Volumen 4: UX.*
