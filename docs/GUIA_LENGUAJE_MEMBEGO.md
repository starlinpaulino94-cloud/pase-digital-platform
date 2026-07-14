# Guía de Lenguaje y Reglas de Negocio de MembeGo — v1

> Documento interno. Fuente de verdad para el vocabulario, los estados, los
> colores y el copy de TODA la plataforma. Toda funcionalidad nueva debe
> respetarlo. Nace de una auditoría completa del código (feb 2026).

Estado: **BORRADOR PARA APROBACIÓN**. No se aplican cambios de código hasta que
este documento sea aprobado. Las 3 decisiones abiertas están marcadas con 🟠.

---

## 0. Resumen ejecutivo

La auditoría revisó todos los módulos (landing, marketplace, empresas, clientes,
membresías, promociones, campañas, invita y gana, beneficios, QR, validaciones,
dashboard, historial, perfil, notificaciones, pagos, admin y superadmin).

**Hallazgo central sobre el QR (la contradicción que motivó esto):**
NO hay contradicción en la *lógica*. La regla real es:
- **El código QR (token) es de un solo uso**: se invalida en cada canje.
- **El beneficio puede tener varios usos** (`usosIncluidos`).
- Tras un canje, **si quedan usos se genera un QR nuevo**; cuando llega a 0, el
  beneficio queda **consumido** y **no** se regenera (promociones:
  `canjeActions.ts:114-142`).

El problema es de **lenguaje, no de lógica**: la frase "Válido para un solo uso"
(`QRShareCard.tsx:135`) describe el *token* pero se lee como si el *beneficio*
se agotara en un uso. Eso, más una acumulación de inconsistencias de vocabulario,
estados y color, es lo que hay que unificar.

**Los 5 problemas transversales:**
1. Un mismo concepto se nombra de 6 formas (regalo/premio/beneficio/recompensa/promoción/oferta).
2. La persona se nombra de 9 formas (cliente/miembro/usuario/invitado/referido/referente/embajador/persona/participante).
3. Un mismo estado tiene etiquetas y colores distintos según el módulo (p. ej. `ACTIVA` = "Activa"/"Activo"/"Activas"; verde en un lado, azul en otro).
4. Hay 3 modelos distintos llamados "campaña".
5. Hay 7+ mapas `estado→UI` paralelos sin fuente única.

---

## 1. Glosario oficial (LA fuente de verdad)

### 1.1 La persona (el actor)

| Concepto | Término oficial | Cuándo | Prohibido |
|---|---|---|---|
| La persona que usa la app | **cliente** (en panel admin/negocio) · **tú/tus** (hablándole a ella) | Admin: "tus clientes". Cliente: "Mis membresías", "Tus beneficios" | "usuario", "suscriptor" en la UI |
| Pertenecer al programa de una empresa | **miembro** (de esa empresa) | Marketplace/perfil: "500 miembros", "beneficios para miembros" | usar "miembro" para el equipo (usar "empleado") |
| Persona referida por otra | **invitado** | Invita y Gana, landing de invitación | mezclar con "referido" en textos de cara al usuario |
| Persona que refiere | **quien invita** (cliente) / "referente" solo en admin técnico | "Premio para quien invita" | "embajador" en cliente |

**Regla:** al cliente logueado **se le tutea sin sustantivo** ("Tus membresías"),
no "Hola usuario". "cliente" es para hablar *del* cliente en el panel del negocio.
"embajador"/"participante"/"persona" quedan **deprecados** como sinónimos del actor.

### 1.2 Lo que el cliente recibe / tiene (jerarquía)

**Beneficio** = término paraguas para cualquier ventaja canjeable. Debajo, tipos
con reglas distintas (sección 2). Elige el término por lo que **es**, no por gusto.

| Término oficial | Qué es | No confundir con |
|---|---|---|
| **Beneficio** | Paraguas: cualquier ventaja canjeable con QR | — |
| **Promoción** | Beneficio que el cliente **adquiere** (gratis o pagando). 1 o N usos | "oferta", "descuento" |
| **Cupón** | Promoción de **varios usos** (ej: 3 cafés) | — |
| **Membresía** | Plan de pago con **usos por ciclo** que se renueva | "suscripción" |
| **Premio** | Beneficio que se **gana** sin comprar (ruleta, meta de referidos) | "recompensa" |
| **Regalo de bienvenida** | Beneficio que se **otorga** al registrarse por una campaña | "promoción" |
| **Oferta** | Solo lenguaje de marketing público ("ofertas del momento"). NUNCA como estado ni tipo de dato | tipo de beneficio |
| **Descuento** | Solo un *valor* de una promoción (−20%), no un sustantivo de UI | "promoción" |

**Términos deprecados como sinónimo de "beneficio":** "recompensa" (usar "premio"),
"regalo" salvo en el contexto explícito de bienvenida/celebración.

### 1.3 El código de canje

| Concepto | Término oficial | Prohibido |
|---|---|---|
| El código que presenta el cliente | **tu código para canjear** (o "tu código QR") | "Código QR de membresía" (técnico) |
| La acción de usarlo en el negocio | **canjear** | mezclar "usar/canjear/registrar" para lo mismo |
| Usos que le quedan al beneficio | **usos disponibles** | "Usos" a secas, "lavados restantes" (salvo carwash) |

### 1.4 Campañas (desambiguación de los 3 modelos)

| Modelo (schema) | Nombre oficial de cara al negocio | Ruta |
|---|---|---|
| `CampanaInvitacion` | **Invita y Gana** (cliente) / **Campañas de invitación** (admin) | `/admin/invitaciones` |
| `MarketingCampaign` | **Banners / Campañas vivas** | `/admin/marketing` |
| `Campana` | **Agrupador de campaña** (interno) | `/admin/campanas` |

Nunca decir solo "Campaña" sin apellido en la UI cuando pueda confundirse.

---

## 2. Reglas oficiales por tipo de beneficio

### 2.1 Promoción (1 uso)
- Se **adquiere** una vez (gratis o con pago).
- Genera **un QR único**. Al canjearlo, el QR se consume y el beneficio queda
  **Usado**. **No se regenera** otro QR. ✅ (código real: `canjeActions.ts:114-125`)

### 2.2 Cupón (N usos)
- Es una promoción con `usosPorCompra > 1` (ej: 3 cafés).
- Cada canje **consume el QR y genera uno nuevo** hasta agotar los usos.
- Al gastar el último uso, queda **Usado** (no se regenera). ✅ (`canjeActions.ts:126-142`)

### 2.3 Membresía (usos por ciclo)
- Plan de pago con `lavadosIncluidos` usos por período (`vigenciaDias`).
- Cada uso: se **consume el QR y se genera uno nuevo**, baja "usos disponibles".
- **Al renovar** (nuevo período): los usos vuelven a estar disponibles. ✅
- ⚠️ **Deuda técnica detectada:** la membresía **regenera el QR incluso al llegar
  a 0 usos** (`visitas/actions.ts:532-541`), a diferencia de la promoción. No hay
  estado "consumida/agotada" para membresías; el próximo escaneo simplemente
  falla con "No quedan usos". → *Regla oficial:* al agotar los usos del ciclo, la
  membresía debe mostrar **"Sin usos disponibles"** y **no** regenerar QR hasta
  la renovación (alinear con la promoción). [Plan: prioridad Media]

### 2.4 Campañas de invitación (Invita y Gana)
- Una campaña ACTIVA y vigente define `beneficioInvitado` y `beneficioInvitante`.
- **Invitado:** recibe el `beneficioInvitado` **al registrarse** por la campaña
  (con o sin código de amigo). Idempotente. (`beneficios.ts:197-220`)
- **Quien invita:** recibe el `beneficioInvitante` **automáticamente** al alcanzar
  `metaRegistros`, si queda stock (`maxPremios`). (`motorProgreso.ts:61`)
- La entrega es **automática**: no existe botón "Reclamar".

### 2.5 Beneficio de registro / bienvenida
- **Nace:** en el momento del registro por una campaña.
- **Vigencia:** 30 días por defecto (`beneficios.ts:80`). *Regla oficial:* la
  vigencia debe mostrarse siempre al cliente ("vence en X días").
- **Se consume:** como cualquier beneficio (QR de un solo uso en el negocio).

---

## 3. Contradicciones encontradas (con regla oficial)

> Formato: **problema** → por qué confunde → **regla oficial** → texto actual → texto recomendado.

### C1 · "Válido para un solo uso" en un beneficio multiuso
- **Dónde:** `QRShareCard.tsx:135` (imagen compartida), `:168` (WhatsApp).
- **Confunde:** describe el *token*, pero junto a "3 usos restantes" (`:129`) parece decir que el beneficio se agota en un uso.
- **Regla:** en material compartido NO afirmar "un solo uso". El carácter de un solo uso del token es un detalle de seguridad, no un mensaje de valor.
- Actual: `Válido para un solo uso · MembeGo`
- **Recomendado:** `Preséntalo en el negocio para canjear` (y en pantalla, el detalle: `Por seguridad, tu código se renueva después de cada canje`).

### C2 · Mismo estado, etiqueta distinta — `ACTIVA`
- **Dónde:** "Activa" (`EstadoBadge.tsx:6`, `compra-estado.ts:84`), "Activo" (`cliente/pagos/page.tsx:49`), "Activas" (`admin/membresias/page.tsx:13`).
- **Confunde:** el cliente ve dos palabras para el mismo estado en la **misma pantalla** de pagos (badge "Activa" + texto "Activo").
- **Regla:** el estado se dice **"Activa"** siempre (concuerda con "membresía/promoción", femenino). Los filtros admin pueden pluralizar ("Activas") solo como *nombre de filtro*, no como estado de un ítem.
- Recomendado: unificar todos a **"Activa"**.

### C3 · Mismo estado, 5 etiquetas — `PENDIENTE_PAGO`
- **Dónde:** "Pago enviado" (`EstadoBadge.tsx:8`), "Comprobante enviado" (`cliente/pagos:47`), "Esperando pago" (`membresia/[id]:27`), "Pago por revisar" (`superadmin/membresias:16`), "En validación" (`compra-estado.ts:68` para compras).
- **Confunde:** cinco nombres para "el cliente ya envió el comprobante y el negocio lo está revisando".
- **Regla:** término oficial **"En validación"** para "pago enviado, en revisión". "Pendiente de pago" se reserva para "aún no ha enviado nada".
- Recomendado: `PENDIENTE` → "Pendiente de pago" · `PENDIENTE_PAGO` / `EN_VALIDACION` → **"En validación"**.

### C4 · Mismo estado, color distinto — `ACTIVA` (verde vs azul)
- **Dónde:** verde/success en membresías, compras y playbooks; **azul/default** en campañas (`invitaciones/page.tsx:24`, `marketing/page.tsx:25`).
- **Confunde:** rompe el aprendizaje visual (verde = activo/en marcha).
- **Regla:** **ACTIVA = verde (success)** en todo el producto.

### C5 · "FINALIZADA" pintada de rojo (color de error)
- **Dónde:** campañas — FINALIZADA → `destructive` (rojo) en `invitaciones/page.tsx:26`, `marketing/page.tsx:27`.
- **Confunde:** un fin normal de campaña se ve como un error/problema.
- **Regla:** **rojo = solo errores y rechazos**. FINALIZADA/Usada/Cancelada = **gris (neutral)**.

### C6 · `CONSUMIDA` = "Completada" vs "consumida por completo"
- **Dónde:** "Completada" (`compra-estado.ts:100`) vs "Promoción consumida por completo" (`mis-promociones/[id]:255`) vs "ya fue consumida" (`compra.ts:114`).
- **Regla:** término oficial de cara al cliente: **"Usada"** (o "Ya usada"). "Consumida" es término técnico interno, no se muestra.

### C7 · `RECHAZADA` = "Pago rechazado" vs "Rechazada"
- **Regla:** **"Rechazada"** como estado; "Pago rechazado" solo en el título de la notificación de pago.

### C8 · Estado inexistente `SOSPECHOSO`
- **Dónde:** `admin/referidos/page.tsx:147` pinta un badge para `SOSPECHOSO`, que **no existe** en `enum ReferidoEstado` (solo PENDIENTE/COMPLETADO). Lo "sospechoso" es un `Boolean` aparte (`schema.prisma:612`).
- **Regla:** el estado es PENDIENTE/COMPLETADO ("Convertido"). "Sospechoso" es una **marca** (chip ⚠ aparte), no un estado.

### C9 · `COMPLETADO` = "Convertido" vs "Cliente activo"
- **Dónde:** admin "Convertido" (`referidos:146`), cliente "Cliente activo" (`invita-y-gana:202`).
- **Regla:** admin: **"Convertido"**. Cliente: **"Ya se registró"** (más humano).

### C10 · Verbo de "conseguir un plan" disperso
- **Dónde:** "Adquirir plan" (`plan/[id]:93`), "Seleccionar plan" (`PlanSelector:103`), "Quiero este plan" (`PlanesGrid:439`).
- **Regla:** verbo oficial **"Elegir este plan"** (nuevo) y **"Cambiar de plan"** (cambio). "Adquirir" se reserva a promociones/cupones.

### C11 · Navegación con términos que compiten
- "Mis promociones" (nav) vs "Mis beneficios" (dashboard, `mis-membresias:362`) para la misma ruta → unificar a **"Mis beneficios"**.
- "Invita y Gana" (cliente) vs "Referidos" + "Invitaciones" (admin) → el dominio es **"Invita y Gana"**; en admin, **"Campañas de invitación"**. Consolidar el legacy "Referidos".
- "Escáner QR" (admin) vs "Escanear QR" (empleado) → **"Escanear QR"** (acción) en ambos.
- "Campañas vivas" vs "Campañas" en Marketing → renombrar a **"Banners"** y **"Campañas"**.

### C12 · Tono y puntuación de mensajes
- **Dónde:** "Canje confirmado correctamente." (técnico) vs "¡Promoción activada! Tu QR está listo." (humano); "Campaña activada" (sin punto) vs "Campaña activada." (con punto).
- **Regla:** ver sección 6 (estructura de mensajes). Toasts breves, humanos, **con punto final**, sin "correctamente".

### C13 · Patrón de estados vacíos mixto
- **Dónde:** "Aún no has…" / "No hay…" / "No se encontró…" a veces en la misma vista (`promociones/page.tsx:107-108`).
- **Regla:** **"Aún no…"** para "el cliente todavía no tiene X"; **"No se encontró…"** solo para resultados de búsqueda/filtro con criterio.

---

## 4. Estados: tabla canónica (label + color oficiales)

Regla de color: **verde**=activo/listo · **azul**=en proceso/info · **ámbar**=requiere
acción/atención · **gris**=terminado/neutro · **rojo**=SOLO error/rechazo.

🟠 **Decisión abierta 1:** el usuario propuso "Azul=Activa, Verde=Disponible". Yo
recomiendo **Verde=Activa** (convención universal y ya dominante en el código).
Pendiente de tu visto bueno.

🟠 **Decisión abierta 2:** "Vencida" — el usuario propuso rojo. Yo recomiendo
**gris** (no es un error; el rojo debe significar problema). "Por vencer" sí va en
**ámbar** (urgencia accionable).

### Beneficios / compras (`CompraEstado`)
| Estado (dato) | Label oficial | Color |
|---|---|---|
| SOLICITADA | Solicitada | gris |
| PENDIENTE_PAGO | Pendiente de pago | ámbar |
| EN_VALIDACION | En validación | azul |
| APROBADA | Aprobada | azul |
| ACTIVA | Activa *(hint: "Lista para canjear")* | verde |
| RECHAZADA | Rechazada | rojo |
| CONSUMIDA | Usada | gris |
| EXPIRADA | Vencida | gris 🟠 |
| CANCELADA | Cancelada | gris |
| (parcial) | Parcialmente usada | azul |

### Membresías (`MembershipEstado`)
| Estado | Label oficial | Color |
|---|---|---|
| PENDIENTE | Pendiente de pago | ámbar |
| PENDIENTE_PAGO | En validación | azul |
| ACTIVA | Activa | verde |
| VENCIDA | Vencida | gris 🟠 |
| RECHAZADA | Rechazada | rojo |
| CANCELADA | Cancelada | gris |

### Campañas (`CampanaInvitacion` / `MarketingCampaign`)
| Estado | Label oficial | Color |
|---|---|---|
| BORRADOR | Borrador | gris (outline) |
| ACTIVA | Activa | **verde** (hoy azul) |
| PAUSADA | Pausada | ámbar |
| FINALIZADA | Finalizada | **gris** (hoy rojo) |

### Referidos (`ReferidoEstado`)
| Estado | Label admin | Label cliente | Color |
|---|---|---|---|
| PENDIENTE | Pendiente | Invitación enviada | ámbar |
| COMPLETADO | Convertido | Ya se registró | verde |
| (flag sospechoso) | ⚠ Sospechoso (chip aparte) | — | ámbar |

---

## 5. Botones: verbo oficial por acción

| Acción | Verbo oficial | Prohibido para esto |
|---|---|---|
| Conseguir una promoción/cupón | **Adquirir** | "Comprar", "Solicitar", "Obtener" |
| Confirmar (gratis) | **Activar ahora** | — |
| Confirmar (pago) | **Continuar al pago** | — |
| Elegir un plan | **Elegir este plan** | "Seleccionar", "Quiero este plan" |
| Cambiar de plan | **Cambiar de plan** | — |
| Renovar membresía | **Renovar** | — |
| Usar un beneficio en el negocio (empleado) | **Confirmar canje** | "Confirmar uso", "Registrar" |
| Ir a usar (cliente, CTA) | **Usar ahora** | — |
| Compartir un enlace | **Compartir** | — |
| Invitar amigos | **Invitar amigos** | — |
| Reclamar un premio ganado | **Ver mi premio** (hoy es automático) | "Reclamar" hasta que exista claim manual |
| Pausar/activar (admin) | **Pausar** / **Activar** | — |

---

## 6. Estructura de mensajes (copy)

### Tono
Cercano, claro y humano. **Tuteo** siempre ("tú"), nunca "usted". Emojis solo en
momentos de recompensa/celebración (registro, premio, felicitación), **nunca** en
estados, pagos, errores o navegación.

### Éxito (toast)
- Corto, en pasado, **con punto final**, sin "correctamente".
- ✅ "Promoción adquirida. Tu código ya está listo."
- ❌ "Canje confirmado correctamente."

### Error (toast/alert)
- Di qué pasó + qué hacer. Sin jerga.
- ✅ "Este código ya fue canjeado. Pídele al cliente su código actualizado."
- ❌ "QR_YA_USADO"

### Confirmación (diálogo)
- Título = la acción ("Adquirir promoción"). Botón primario = el verbo oficial.
- Botón secundario siempre "Cancelar".

### Vacío
- **"Aún no…"** + una acción sugerida.
- ✅ "Aún no has adquirido beneficios." → botón "Ver promociones".
- Búsqueda sin resultados: **"No se encontró…"**.

### Notificación
- Título humano (≤ 6 palabras) + una línea de detalle + destino claro.
- ✅ "Tu membresía está activa" / "Tu pago fue confirmado. Ya puedes usar tu código."

### Títulos de pantalla
- Cliente: en primera persona ("Mis membresías", "Mis pagos", "Mi perfil").
- Admin: el objeto en plural ("Clientes", "Promociones", "Campañas").

---

## 7. Guía de UX Writing (referencia rápida)

**Voz de marca:** MembeGo es un club de beneficios digital: cercano, entusiasta,
premium, sin fricción. Escribimos "MembeGo" (la "Go" resaltada).

**Vocabulario oficial:** beneficio · promoción · cupón · membresía · plan · premio ·
regalo de bienvenida · canjear · usos disponibles · tu código para canjear · cliente ·
miembro (de una empresa) · invitado.

**Términos prohibidos en la UI:** usuario, suscriptor, "un solo uso" (en material
compartido), "Código QR de membresía", "correctamente", "Solicitar" (para adquirir),
"recompensa" (usar premio), estado "SOSPECHOSO" como estado, "Activo"/"Activas" para
el estado (usar "Activa"), colores sueltos por página (usar tokens del design system).

**Convenciones:**
- Un concepto = un término. Antes de crear un texto nuevo, revisa este glosario.
- Estados: usa `EstadoBadge` / `compra-estado.ts` como fuente única; nunca redefinas
  labels/colores inline.
- Verbos de botón: solo los de la sección 5.
- Números: "3 usos disponibles" (con sustantivo), no "Usos: 3".

---

## 8. Plan de implementación por prioridad

Nada de esto agrega funcionalidad; solo unifica. Se aplica **solo tras aprobación**.

### 🔴 Prioridad ALTA (confunde al cliente / se ve en pantalla) — ✅ HECHA
Decisiones aprobadas: **Activa = verde**, **Vencida = gris**, **rojo solo para
errores**. Fuente única creada en **`src/lib/estados.ts`**.
1. ✅ **Estados de membresía**: mapas inline migrados a la fuente única
   (`EstadoBadge`, `cliente/pagos`, `membresia/[id]`, `superadmin/membresias`).
   "Activa" (nunca "Activo"), "En validación" para pago en revisión, "Rechazada". C2, C3, C7.
2. ✅ **Color de ACTIVA y FINALIZADA en campañas**: verde/gris (los 3 mapas de
   campaña migrados a `campanaEstadoUi`). C4, C5.
3. ✅ **QR compartido**: quitado "Válido para un solo uso" absoluto (`QRShareCard.tsx`). C1.
4. ✅ **CONSUMIDA → "Usada"** (+ RECHAZADA→"Rechazada", EXPIRADA→"Vencida", gris) en `compra-estado.ts`. C6.
5. ✅ **Estado fantasma SOSPECHOSO** en referidos: eliminado del mapa (era código
   muerto); el chip de marca queda como follow-up (requiere llevar el boolean). C8.

### 🟡 Prioridad MEDIA (consistencia, menos visible) — ✅ HECHA
6. ✅ **Verbo de plan**: "Elegir este plan" (grid, público, PlanSelector→"Elegir plan"). C10.
7. ✅ **Navegación**: nav "Mis promociones"→"Mis beneficios" (+ título de página),
   "Escáner QR"→"Escanear QR", "Campañas vivas"→"Banners". (Consolidar el módulo
   Referidos↔Invita y Gana queda como tarea de producto aparte: son páginas
   distintas). C11.
8. ✅ **Membresía sin usos**: al agotar los usos del ciclo ya NO se regenera QR
   (`visitas/actions.ts`); el detalle muestra "Sin usos disponibles". §2.3.
9. ✅ **Toasts**: quitado "correctamente" de todos; puntuación uniforme; rechazos
   con "El cliente fue notificado". C12.
10. ✅ **Estados vacíos**: revisados — ya siguen el patrón "Aún no…" (no-items) /
    "No se encontró…" (búsqueda). Sin cambios necesarios. C13.

### 🟢 Prioridad BAJA (limpieza / deuda)
11. Unificar los 2 embudos de eventos (`InvitacionEventoTipo` vs `ReferralEventTipo`).
12. Documentar/renombrar los 3 modelos "campaña" para el equipo técnico.
13. `TransaccionRecord`: traducir los estados en inglés a los labels oficiales.
14. Extraer la vigencia por defecto (30 días) a una constante única.

---

## 9. Cómo se aplicará (propuesta de ejecución)

Una vez aprobado, se implementa por prioridad, en PRs pequeños y revisables, cada
uno cerrando un grupo de puntos. Empezaríamos por crear **un único mapa de estados**
(`src/lib/estados.ts`) como fuente de verdad de label+color por estado, y migrar los
mapas dispersos a él — así C2–C9 se resuelven de raíz y no vuelven a divergir.
