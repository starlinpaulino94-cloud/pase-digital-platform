# Fase 3 — Client Experience 2.0: auditoría UX y reconstrucción

Auditoría completa del módulo del cliente y decisiones de reconstrucción,
sobre [MDS](./MDS.md) + [MUK](./MUK.md) + [MMS](./MMS.md) +
[Mobile First](./MOBILE_FIRST.md). **Cero cambios de lógica de negocio.**

## Estructura unificada (contrato de toda pantalla)

1. Header limpio (título + 1 línea de contexto)
2. Acción principal (una sola, en zona del pulgar)
3. Banner si aplica (promoción/urgencia)
4. Contenido principal (tarjetas, nunca tablas)
5. Acciones secundarias
6. Actividad reciente (cuando aporta)

## Mapa de navegación

```
BottomNav: Inicio · Explorar · [MI QR] · Ofertas · Perfil
├── Inicio ─ beneficio hoy → campaña → resumen → wallet → empresas que sigo
│            → invita y gana → accesos → carruseles → actividad
├── Explorar ─ marketplace → empresa (mini-web: promos/planes/beneficios)
├── MI QR ─ membresía activa con QR (dock central, 1 tap desde cualquier lado)
├── Ofertas ─ tienda de oportunidades (feed) + Mis beneficios (recompensas)
└── Perfil ─ identidad (resumen) → accesos → configuración por categorías
             → pagos / historial / ayuda
```

## Auditoría módulo por módulo

Formato: problema que resuelve · veredicto · justificación.

### 1 · Inicio — RECONSTRUIDO (Fase 2 + esta fase)
"¿Qué tengo disponible hoy?". Ya tenía la jerarquía de beneficio (Fase 2);
**faltaba "Empresas que sigo"** → añadido carrusel horizontal (logos +
número de promos activas, favoritas primero) entre la wallet e Invita y
Gana. Sin estadísticas sin contexto: el "vistazo rápido" existe solo si hay
membresías. Nada más que quitar: cada bloque responde a una pregunta real.

### 2 · Membresías — CONSERVAR (ya es el objetivo)
Wallet stack estilo Apple Wallet con tarjetas premium, estado, usos,
vencimiento, QR e historial; sin tablas. Cumple el spec tal cual (fase W).

### 3 · Promociones — CONSERVAR + criterio de origen
Tienda de oportunidades con hero, carruseles por intención (sigo /
destacadas / nuevas / expiran pronto / recomendadas) y PromoAd estilo Temu.
**Origen**: cada concepto vive en su módulo (promoción ≠ beneficio adquirido
≠ campaña ≠ invitación) — no se mezclan listas; los banners de campaña usan
sus propios componentes (CampanasVivas, CampanaLanding). Flash deals /
historias: la primitiva `FlashPromotion` (MMS) queda lista; se conectará al
sistema de prioridad cuando el motor de decisión (MMS §prioridad) exista.

### 4 · Beneficios — RECONSTRUIDO como centro de recompensas
Antes: 3 listas planas. Ahora: **resumen de recompensas** (listos para usar
/ usos disponibles / en proceso) + secciones renombradas por intención
("Listos para usar", "Por reclamar · en proceso", "Ya utilizados y
vencidos"). "Próximos a vencer" queda pendiente de datos de expiración por
compra (hoy no se persiste una fecha de vencimiento del beneficio).

### 5 · Invita y Gana — YA CUMPLE
Auditoría: la pantalla del cliente **no tiene ninguna configuración
editable** (solo ver campaña, progreso, compartir, registrados y
recompensas; las reglas viven en el panel admin). Experiencia emocional ya
integrada: contadores animados, confeti en hitos, texto de urgencia al
compartir.

### 6 · Empresas — CONSERVAR
Explorar = marketplace (grid premium); detalle = mini-web con portada,
logo, descripción, categoría, promociones, planes, beneficios, reseñas,
seguir, compartir y anclas. Cumple.

### 7 · Pagos — YA CUMPLE
Panel estilo Stripe Billing: estado (punto vivo), plan + monto (una sola
vez), ciclo, método, próximo cobro, comprobante, motivo de rechazo, cambio
de plan pendiente e historial tipo extracto con visor de comprobantes.
Exactamente "solo lo importante" — rediseñarlo sería churn.

### 8 · Perfil — RECONSTRUIDO como centro de identidad
Antes: dos formularios y vehículos. Ahora: **hero de identidad** (banda de
gradiente de marca, avatar/iniciales, nombre, empresa) + **resumen en
números navegable** (membresías activas · empresas seguidas · beneficios
activos) + **accesos rápidos** (pagos, historial, mis empresas, ayuda) +
**configuración por categorías**: Cuenta (perfil + notificaciones),
Seguridad (contraseña), Vehículos (solo carwash). Formularios reutilizados
sin tocar lógica.

### 9 · Configuración — FUSIONADA en Perfil (decisión)
No existe (ni hace falta) una pantalla aparte: la configuración del cliente
cabe en 3 categorías dentro de Perfil — una pantalla menos que mantener y
un tap menos para el usuario. Idioma/privacidad/legal: cuando existan esas
opciones reales, se añaden como categorías al mismo patrón.

## Revisión funcional — hallazgos y acción

| Hallazgo | Acción |
| --- | --- |
| FAB del QR tapaba contenido | resuelto en Fase 2 (dock central) |
| Perfil sin identidad ni resumen | reconstruido (esta fase) |
| Beneficios sin jerarquía de recompensa | reconstruido (esta fase) |
| Home sin empresas seguidas | añadido carrusel (esta fase) |
| "Referidos" duplicaba Invita y Gana | ya fusionado (redirect) |
| Dashboard/membresia duplicaban wallet | ya redirects |
| Estadísticas sin contexto en Home | condicionadas a tener membresías |
| Dinero/fechas/estados con formatos ad-hoc | cola 2.x: `Price`/`DateText`/`StatusChip` |
| "Próximos a vencer" en beneficios | pendiente de datos de expiración |

## Checklist de consistencia visual (aplicado a lo reconstruido)

- [x] Header `text-h1` + 1 línea `text-small text-muted-foreground`
- [x] Tarjetas `rounded-2xl/3xl` + `shadow-card` + `card-lift`/press en tocables
- [x] Entradas `animate-fade-up` con delays de la escala
- [x] Colores/espaciados/radios solo del MDS (cero hex nuevos)
- [x] Iconos Lucide line en tamaños estándar
- [x] Números `tabular-nums`; textos en español claro
- [x] Estados vacíos con ilustración + CTA
- [x] Mobile first (probado en anchos 320–430) y dark mode

## Mejoras implementadas vs. diseño anterior (resumen)

1. Perfil: de "formulario suelto" a centro de identidad con resumen
   navegable y configuración por categorías.
2. Beneficios: de lista plana a centro de recompensas con resumen.
3. Home: carrusel "Empresas que sigo" (favoritas primero, nº de promos).
4. Una pantalla menos (Configuración fusionada en Perfil por diseño).
5. Coherencia total con la estructura unificada en las pantallas tocadas.
