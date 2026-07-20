# Auditoría del Panel de Administrador — MembeGo

> Análisis profundo de los ~30 módulos del panel de empresa (`/admin/*`).
> Objetivo: que el funcionamiento sea **más claro, más fácil de usar y más
> fácil de implementar/mantener**. Cada hallazgo trae evidencia del código y
> una recomendación concreta.

Fecha: 2026-07-20 · Alcance: `src/app/(admin)/admin/**`, `nav-config.ts`,
`permissions.ts`, `layout.tsx`.

---

## 1. Resumen ejecutivo

El panel **funciona y tiene mucha profundidad** (dashboard ejecutivo con BI,
CRM de clientes, POS/caja, citas, motor de fidelización, etc.). El problema
no es de funcionalidad: es de **claridad y consistencia**. Los 5 hallazgos:

| # | Hallazgo | Impacto | Prioridad |
|---|----------|---------|-----------|
| **H1** | **Sobrecarga y solapamiento de la navegación**: 30 módulos siempre visibles en 8 grupos, con ~9 módulos que hacen "cosas parecidas" (ofrecer/comunicar). El dueño no sabe dónde crear una oferta. | Alto — confunde y frena el uso | **P0** |
| **H2** | **3 patrones de encabezado distintos** conviviendo + solo 3/40 rutas con `loading.tsx` y 0 con `error.tsx`. | Medio — se ve inconsistente y "parpadea" | **P1** |
| **H3** | **El admin no oculta módulos vacíos** (`hiddenNav` existe para el cliente pero no se aplica al admin). Un negocio nuevo ve 30 módulos casi todos vacíos. | Alto — abruma al onboarding | **P1** |
| **H4** | **Fuga del estado "superadmin sin empresa"**: 15 módulos repiten mensajes tipo "Selecciona una empresa" en su propio copy. | Bajo — ruido y duplicación | **P2** |
| **H5** | **Detalles de pulido**: íconos duplicados en el menú, `whatsapp` sigue en el registro de secciones siendo solo un redirect. | Bajo | **P2** |

**La recomendación central (H1)**: reagrupar los 30 módulos en **6–7 áreas
claras** y **fusionar los módulos que se solapan**, en vez de seguir sumando
entradas al menú.

---

## 2. Inventario actual (30 módulos en 8 grupos)

Fuente: `src/components/layout/nav-config.ts`.

| Grupo | Módulos | # |
|-------|---------|---|
| **Inicio** | Resumen (dashboard) | 1 |
| **Clientes** | Clientes · Membresías | 2 |
| **Fidelización** | Planes · Promociones · Regalos VIP · Referidos · Invitaciones · Ruleta de premios · Crecimiento | 7 |
| **Marketing** | Banners · Campañas · Publicaciones · Notificaciones · Automatizaciones | 5 |
| **Operaciones** | Escanear QR · Citas · Pagos · Facturas · Sucursales | 5 |
| **Análisis** | Reportes · Audiencia | 2 |
| **Soporte** | Comunicación · Tickets | 2 |
| **Empresa** | Perfil público · Personalización · Métodos de pago · Empleados | 4 |

El grupo **Fidelización (7)** es el más cargado y mezcla herramientas de
naturaleza muy distinta (un plan de membresía no es lo mismo que una ruleta).

---

## 3. H1 · Sobrecarga y solapamiento de la navegación (P0)

Este es el hallazgo más importante. Hay **9 módulos que un dueño de negocio
percibe como "lo mismo": una forma de ofrecer/comunicar algo**. Evidencia de
sus propias descripciones:

- **Promociones** — descuentos/ofertas publicadas.
- **Regalos VIP** (`/ofertas`) — "regalos gratis para una lista privada de clientes".
- **Banners** (`/marketing`) — *"Ofertas relámpago, Happy Hour y promociones que aparecen vivas en el inicio"*. → **se solapa con Promociones**.
- **Campañas** — *"agrupar promos/publicaciones + métricas"* (meta-módulo encima de los otros).
- **Publicaciones** — eventos/noticias/beneficios.
- **Referidos** — *"programa de referidos y reglas de recompensa"*.
- **Invitaciones** — *"campañas de invita y gana"*. → **se solapa con Referidos** (ambos son "invita y gana").
- **Ruleta de premios** (`/gamificacion`).
- **Crecimiento** (`/crecimiento` = "Growth Engine").

**Pregunta que un dueño no puede responder hoy:** *"Quiero dar 2×1 los martes.
¿Lo creo en Promociones, en Banners, en Campañas o en Regalos VIP?"*. Esa duda
es el síntoma.

### Recomendación H1 — Consolidar, no sumar

**a) Fusionar "Referidos" + "Invitaciones"** en un solo módulo **"Invita y
Gana"** (el cliente ya los ve unificados así; el admin no). Hoy son dos
entradas para el mismo concepto.

**b) Unificar la creación de ofertas** bajo un módulo **"Ofertas"** con un
selector de *tipo* al crear:
- Pública (lo que hoy es Promociones)
- Relámpago / Happy Hour (lo que hoy es Banners)
- Privada / VIP (lo que hoy es Regalos VIP)

Internamente pueden seguir siendo tablas distintas; lo que se unifica es el
**punto de entrada** y el lenguaje.

**c) Degradar "Campañas" y "Crecimiento"** a vistas dentro de Análisis o de
Marketing (son agregadores/reportes, no cosas que se "crean" a diario).

### Recomendación H1 — Nueva arquitectura de información (6 áreas)

```
Inicio            → Resumen (dashboard)
Clientes          → Clientes · Membresías · Citas
Ingresos          → Pagos · Facturas · Métodos de pago
Marketing         → Ofertas (pública/relámpago/VIP) · Publicaciones ·
                    Invita y Gana · Ruleta · Notificaciones · Automatizaciones ·
                    Campañas (métricas)
Operación         → Escanear QR · Sucursales
Análisis          → Reportes · Audiencia · Crecimiento
Configuración     → Perfil público · Personalización · Empleados ·
                    Comunicación y Soporte · Tickets · Planes
```

Pasa de **8 grupos / 30 entradas planas** a **7 grupos** con submódulos
agrupados por intención. Reduce la carga cognitiva sin quitar nada.

---

## 4. H2 · Inconsistencia de patrones (P1)

### 4.1 Tres estilos de encabezado conviviendo

| Patrón | Módulos | Ejemplo |
|--------|---------|---------|
| `<PageHeader>` (componente) | ~19 | audiencia, referidos, pagos, notificaciones, reportes, facturas… |
| `<h1 className="text-2xl font-bold">` (crudo) | ~30 | promociones, ofertas, clientes, planes, campañas, publicaciones, sucursales… |
| Tokens `text-h1` / `text-overline` (MDS) | 2 | dashboard, automatizaciones/plantillas |

Ya existe un design system (`docs/MDS.md`) y un componente `PageHeader`.
**Recomendación:** estandarizar TODOS los encabezados en `<PageHeader>` (que a
su vez use los tokens del MDS). Es un cambio mecánico, de bajo riesgo y alto
impacto visual.

### 4.2 Faltan estados de carga y error

- **`loading.tsx`: solo 3 de ~40 rutas** (clientes, membresias, pagos). El
  resto muestra pantalla en blanco mientras cargan las queries `force-dynamic`.
- **`error.tsx`: 0 rutas.** Si una query falla, cae la pantalla de error
  genérica de Next en vez de un estado amable con botón "reintentar".

**Recomendación:** un `loading.tsx` con skeleton y un `error.tsx` con reintento
por grupo de módulos (o compartidos vía un layout intermedio). El cliente ya
tiene este patrón; replicarlo en admin.

---

## 5. H3 · El admin no oculta módulos vacíos (P1)

`AppShell` ya soporta `hiddenNav` y el layout del **cliente** lo usa
(`getNavOcultoCliente`) para ocultar módulos sin contenido. El **layout del
admin (`src/app/(admin)/layout.tsx`) no pasa `hiddenNav`** → el admin siempre
ve las 30 entradas, aunque el negocio no tenga ni una promoción, publicación,
sucursal o cita.

**Recomendación:** aplicar la misma estrategia "content-aware" al admin, pero
**progresiva** (no ocultar del todo, sino ordenar por relevancia o marcar como
"por configurar"). Para un negocio recién creado, mostrar primero lo esencial
(Clientes, Escanear, Promociones, Perfil) y revelar el resto a medida que se
usan. Esto conecta con el `OnboardingChecklist` que ya existe en el dashboard.

---

## 6. H4 · Fuga del estado "superadmin sin empresa" (P2)

**15 módulos** repiten en su propio código mensajes como *"Inicia sesión con
una cuenta de empresa"*, *"Selecciona una empresa activa"*, *"Crea o selecciona
una empresa"*. Es lógica de un caso de borde (superadmin sin empresa activa)
duplicada 15 veces con copy ligeramente distinto.

**Recomendación:** centralizar en un solo guard/estado (p. ej. un
`<RequiereEmpresa>` en el layout o un helper que devuelva un `EmptyState`
uniforme). Así el mensaje es consistente y no se re-escribe en cada módulo.

---

## 7. H5 · Detalles de pulido (P2)

- **Íconos duplicados en el menú** (`nav-config.ts`):
  - `Regalos VIP` y `Referidos` usan ambos `Gift`.
  - `Banners` y `Personalización` usan ambos `Sparkles`.
  - Confunde visualmente en la barra lateral. Asignar íconos únicos
    (p. ej. `Gift` para Regalos, `Share2`/`UserPlus` para Referidos;
    `ImageIcon` para Banners).
- **`whatsapp`** es solo un `redirect('/admin/comunicacion')` (correcto), pero
  sigue listado en `ADMIN_SECTIONS` (`permissions.ts`). Es ruido en el modelo
  de permisos. Quitarlo del array.
- **`AdminCompanySwitcher`** se renderiza en el layout en cada página; con 0–1
  empresas no se muestra (bien), pero conviene confirmar que en modo marca
  única nunca aparezca.

---

## 8. Veredicto módulo por módulo

Leyenda: 🟢 sólido · 🟡 revisar/pulir · 🔵 candidato a fusión

| Módulo | Estado | Nota |
|--------|--------|------|
| Dashboard | 🟢 | Ejecutivo, con BI, alertas y acciones rápidas. Referencia de calidad. |
| Clientes / ficha | 🟢 | CRM con notas internas y acciones. Tiene `loading.tsx`. |
| Membresías | 🟢 | Tiene `loading.tsx`. |
| Pagos | 🟢 | El más grande (514 ln), con `loading.tsx`. |
| Facturas | 🟢 | Impresión 58/80/Carta/A4. |
| Citas | 🟢 | Módulo reciente y completo. |
| Scanner | 🟢 | Delega en `ScannerScreen`; correcto. |
| Promociones | 🟡🔵 | Sólido, pero **unificar entrada con Banners/Regalos VIP**. Encabezado crudo. |
| Regalos VIP (ofertas) | 🟡🔵 | Reciente. Candidato a fusión bajo "Ofertas". |
| Banners (marketing) | 🟡🔵 | Se solapa con Promociones ("ofertas relámpago"). |
| Campañas | 🟡🔵 | Agregador; moverlo a Análisis/Marketing como métricas. |
| Publicaciones | 🟡 | OK; encabezado crudo, sin `loading.tsx`. |
| Referidos | 🟡🔵 | **Fusionar con Invitaciones** → "Invita y Gana". |
| Invitaciones | 🟡🔵 | Igual concepto que Referidos. |
| Ruleta (gamificacion) | 🟢 | Delega en `RuletaAdmin`; correcto. |
| Crecimiento | 🟡 | "Growth Engine"; degradar a Análisis. |
| Notificaciones | 🟢 | Usa `PageHeader`. |
| Automatizaciones | 🟢 | Usa `PageHeader`; idempotentes. |
| Comunicación | 🟢 | Reemplazó a WhatsApp. |
| Tickets | 🟢 | Soporte con adjuntos. |
| Reportes / Audiencia | 🟢 | Usan `PageHeader`. |
| Planes | 🟡 | Mover a Configuración; encabezado crudo. |
| Perfil público | 🟡 | Encabezado crudo, sin `loading.tsx`. |
| Personalización | 🟡 | Ícono duplicado con Banners. |
| Métodos de pago | 🟡 | Mover a "Ingresos". |
| Sucursales | 🟡 | Mover a "Operación". |
| Empleados | 🟢 | Usa `PageHeader`. |
| WhatsApp | 🟡 | Solo redirect; quitar de `ADMIN_SECTIONS`. |

Ningún módulo está "roto"; la mejora es de **organización y consistencia**, no
de reconstrucción.

---

## 9. Plan por fases (priorizado y de bajo riesgo)

**Fase A — Claridad de navegación (P0, alto impacto / bajo riesgo)**
1. Reagrupar `ADMIN_NAV` a las 6–7 áreas de la sección 3.
2. Fusionar Referidos + Invitaciones → "Invita y Gana" (una entrada).
3. Arreglar íconos duplicados; quitar `whatsapp` de `ADMIN_SECTIONS`.
   *(Solo tocan `nav-config.ts` y `permissions.ts`; sin cambios de datos.)*

**Fase B — Consistencia visual (P1)**
4. Migrar todos los encabezados a `<PageHeader>` + tokens MDS.
5. Añadir `loading.tsx` (skeleton) y `error.tsx` (reintento) a los módulos que
   faltan.

**Fase C — Onboarding y estado vacío (P1)**
6. Aplicar `hiddenNav`/priorización progresiva al layout del admin.
7. Centralizar el estado "superadmin sin empresa" en un guard único.

**Fase D — Fusión de ofertas (P0 de producto, más esfuerzo)**
8. Unificar la creación de ofertas (pública/relámpago/VIP) bajo un solo
   módulo con selector de tipo.

Recomendación: **empezar por la Fase A**. Es la que más aclara el panel, no
toca base de datos y es reversible.

---

## 10. Cómo se conecta con lo que ya existe

- El **design system** (`docs/MDS.md`, `docs/MUK.md`) ya tiene los tokens y el
  `PageHeader`: la Fase B es *aplicar* lo que ya está construido.
- El **`hiddenNav`** ya está implementado para el cliente: la Fase C es
  *reutilizar* ese mecanismo en el admin.
- El **`OnboardingChecklist`** del dashboard ya guía a publicar: la
  priorización progresiva (Fase C) es su extensión natural al menú.

Es decir: gran parte de la mejora es **conectar piezas que ya existen**, no
construir de cero.
