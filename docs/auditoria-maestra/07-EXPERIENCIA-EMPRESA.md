# CAPÍTULO 7 — EXPERIENCIA DE LA EMPRESA (B2B)

*Auditoría Maestra de MembeGo · Volumen 7*

---

## 7.1 La pregunta que decide todo

> **¿Qué falta para que una empresa quiera PAGAR por MembeGo?**

Una PYME latinoamericana paga por software cuando puede completar esta frase sin pensar: *"Pago X al mes y me devuelve Y"*. Hoy MembeGo le da a la empresa muchas *herramientas* (promos, planes, campañas, CRM, publicaciones, automatizaciones) pero no le da la *frase*. Ese es el vacío central de la experiencia B2B.

**Lo que falta, en orden:**

1. **El número de retorno.** Ingresos atribuidos a MembeGo (membresías cobradas + valor de canjes + clientes nuevos por referido) en la home del panel, mes contra mes. Los datos existen dispersos (Transaction, ProductoCompra, Referido, Visit); falta la agregación y el lugar de honor.
2. **Cobros automáticos.** Mientras la empresa tenga que perseguir transferencias y aprobar comprobantes, MembeGo le *añade* trabajo administrativo en lugar de quitárselo.
3. **Tiempo-a-valor < 1 día.** El onboarding self-service existe (F5.1, con checklist). Falta que termine en un *resultado*, no en una configuración: "publica tu primera promo con esta plantilla y compártela por WhatsApp" debe ser el paso final del alta.
4. **Menos decisiones, más defaults.** El dueño de un car wash no quiere configurar automatizaciones: quiere activar "recuperar clientes inactivos [ON]". Las plantillas de estrategia ya escritas (86+ en código) deben presentarse como interruptores, no como biblioteca.

## 7.2 Auditoría de las capacidades actuales

| Capacidad | Estado | Brecha principal |
|---|---|---|
| Crear promociones | 🟢 Completo (tipos, horario, stock, visibilidad) | Sin plantillas a 1 clic en la UI; formulario intimidante |
| Campañas | 🟡 | Solapa con Invitaciones y Estrategias; consolidar vocabulario |
| Estadísticas | 🟡 | Miden actividad (vistas, seguidores), no dinero |
| Clientes (CRM) | 🟡 | Tabla sin segmentos accionables ni bandeja de acciones |
| Beneficios/planes | 🟢 | Falta uso visible por cliente (renovación) |
| Membresías | 🟠 | Sin cobro recurrente = membresía a medias |
| Seguimiento (retorno) | 🔴 | No existe el estado de resultados de fidelización |
| Dashboard | 🟡 | Rediseñar como P&L de fidelización (abajo) |
| Reportes | 🟡 | Sin export CSV, sin benchmark de vertical |
| Equipo | 🟡 | Roles empleado/escáner OK; sin permisos finos ni multi-sucursal operativo real |

## 7.3 El "estado de resultados de fidelización" (spec del nuevo dashboard)

```
┌──────────────────────────────────────────────────────────┐
│ JULIO 2026                                                │
│                                                           │
│ MembeGo te generó       RD$ 84,300   ▲ 12%               │
│ ├─ Membresías cobradas  RD$ 61,000   (32 activas)        │
│ ├─ Canjes con compra    RD$ 18,300   (46 canjes)         │
│ └─ Clientes nuevos       9 (5 por invitación)             │
│                                                           │
│ Tu embudo:  412 visitas → 31 registros → 22 con canje    │
│              → 14 recurrentes                             │
│                                                           │
│ ⚠ Atención: 12 clientes en riesgo (30+ días sin venir)   │
│   [Recuperarlos con 1 clic →]                            │
└──────────────────────────────────────────────────────────┘
```

Cada línea es un query sobre tablas existentes. Este dashboard ES el argumento de renovación del SaaS: se paga solo.

## 7.4 Monetización de la plataforma (modelo recomendado)

Hoy el producto no expresa qué paga la empresa a MembeGo. Recomendación:

| Plan | Precio ref. | Incluye | Palanca |
|---|---|---|---|
| Gratis | RD$0 | Perfil + 1 promo activa + escáner | Poblar el marketplace (efecto red) |
| Crecimiento | ~RD$2,900/mes | Promos ilimitadas, campañas, CRM, automatizaciones, email | El panel completo actual |
| Pro | ~RD$6,900/mes | Multi-sucursal, WhatsApp, benchmark de vertical, API | Diferenciadores futuros |
| + Fee de procesamiento | 2-3% | Sobre membresías cobradas por pasarela | Alinea ingreso MembeGo con éxito del negocio |

El fee sobre volumen procesado es la ruta de escala real (crece con el cliente sin vender más licencias) y exige la pasarela (P0 del roadmap).

## 7.5 ¿Pueden crecer con la plataforma?

Parcialmente. Techo actual: una empresa con 3 sucursales y 5,000 clientes se topa con (a) multi-sucursal débil (el modelo `Sucursal` existe; la operación por sucursal — promos, reportes, escáner por sede — no está desarrollada), (b) sin API ni webhooks para integrar su POS/contabilidad, (c) reportes sin export. Estas tres cosas definen el plan Pro y el horizonte "Escalar".

---

*Continúa en el Volumen 8: Gamificación.*
