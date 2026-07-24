# Capacidades por empresa (Plataforma modular · E1)

> Fundaciones de la plataforma modular (docs/ESTRATEGIA-PLATAFORMA.md):
> cada empresa tiene una **categoría** (Car Wash…) que le da un **paquete
> base** de capacidades, y **overrides** para encender/apagar puntualmente.
> Fuente de verdad del catálogo: `src/modules/capacidades/catalogo.ts`.

## Cómo funciona

1. **Categoría**: `Company.type` legacy ("carwash"…) → categoría del catálogo
   (`CAR_WASH`), o un override explícito en el JSON. Solo CAR_WASH está
   operativa; BARBERIA/RESTAURANTE/GYM son valores reservados (E6+).
2. **Paquete base**: `CAPACIDADES_BASE[categoria]` — para CAR_WASH incluye
   TODO lo activo hoy en producción (regla D4: nada desaparece).
3. **Overrides**: `companies.capacidades` JSON
   `{ categoria?, overrides?: { CAPACIDAD: boolean } }` (migración
   `20260758_capacidades`, idempotente). `null` = paquete base.
4. **Resolutor** (`resolver.ts`): cacheado 5 min con tag `CAPACIDADES_TAG`
   (el panel E4 debe `revalidateTag` al guardar). **Fail-open total**: BD
   caída, columna sin migrar o empresa sin config = todo lo actual permitido.
5. **Barrera real**: `requireSection` (guards.ts) ahora exige rol **Y**
   capacidad. Solo gatea las secciones mapeadas en `SECCIONES_POR_CAPACIDAD`
   (citas, seguimiento, gamificación) — el núcleo (clientes, membresías,
   pagos…) no está mapeado y **no puede apagarse por error**. El superadmin
   nunca se gatea.

## Catálogo v1

| Capacidad | Controla | CAR_WASH base |
|---|---|---|
| `NAVEGACION_V2` | Oculta los módulos operativos del menú MembeGo (viven solo en la app; interruptor D7, E2) | ❌ apagada |
| `CITAS` | Sección citas | ✅ |
| `SEGUIMIENTO` | Sección seguimiento | ✅ |
| `RULETA` | Sección gamificación | ✅ |
| `GIFT_CARDS` | (flujo regalos — cableado fino en E4) | ✅ |
| `CITA_ANTES_DEL_QR` | (flujo del QR — cableado fino en E4) | ✅ |
| `POS_CAJA` | (caja del empleado — cableado fino en E4) | ✅ |
| `INVENTARIO` | Módulo futuro (P2 · E5) | ❌ |
| `COLA_VEHICULOS` | Módulo futuro (P2 · E5) | ❌ |
| `EVIDENCIA_FOTOS` | Módulo futuro (P2 · E5) | ❌ |

## API para el equipo

- `getCapacidadesEmpresa(companyId)` → `{ categoria, activas, navegacionV2 }`.
- `tieneCapacidad(companyId, 'CITAS')` → boolean (fail-open).
- `seccionPermitidaPorCapacidades(companyId, seccion)` — la usa
  `requireSection`; P1 la puede usar para filtrar menús (E2).
- `navegacionV2` es la bandera del interruptor para P1-T3.
- E4 (P2): al guardar el panel, `revalidateTag(CAPACIDADES_TAG)`.

## E2 entregada: launchpad + shell

- **Launchpad** `/admin/aplicaciones` (entrada "Aplicaciones" en el menú):
  tarjetas de las apps de la categoría de la empresa.
- **Shell Car Wash** `/admin/app/carwash`: cabecera con identidad del negocio
  (color/logo) + "← Volver a MembeGo" + menú de módulos operativos que
  ENLAZAN a las pantallas actuales (D5: ninguna URL se movió). Los módulos
  futuros (cola, inventario, evidencia) aparecen "próximamente" hasta
  encender su capacidad.
- **Interruptor D7**: con `NAVEGACION_V2` encendida (override
  `{"overrides":{"NAVEGACION_V2":true}}` en `companies.capacidades`), los
  módulos operativos salen del menú de MembeGo (capa `hiddenNav` del
  AppShell). Apagada = menú idéntico al de siempre. Encender/apagar NO
  requiere deploy (esperar el caché de 5 min o `revalidateTag`).

## Migración (Supabase SQL Editor, idempotente)

```sql
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "capacidades" JSONB;
```

El módulo funciona sin correrla (fail-open); solo guardar overrides (E4) la
necesita.

## Prueba manual de E1 (documentada)

1. **Sin config** (estado actual de CARTOWN): todas las secciones abren igual
   que antes. ✔ (paquete base CAR_WASH cubre todo lo mapeado)
2. **Con categoría**: empresa `type='restaurante'` → mismo comportamiento
   (paquete base equivalente en v1).
3. **Con override**: `{"overrides":{"CITAS":false}}` en una empresa de prueba
   → /admin/citas queda bloqueada (server action devuelve no autorizado) y
   al quitar el override vuelve a funcionar (esperar el caché de 5 min o
   revalidar).
