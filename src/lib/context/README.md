# Modelo Universal de Contexto — Fase 5

El **lenguaje de datos** común a todas las reglas del sistema. Construye el
`RuleContext` (el que consume el Rule Engine) combinando **Context Providers**,
de modo que el Rule Engine **nunca** consulta la base de datos ni conoce
entidades del negocio: siempre trabaja sobre un contexto ya construido.

> **Alcance:** SOLO el modelo de contexto. Sin expresiones complejas, sin
> variables universales, sin plantillas. Es un módulo **100% de código** (no toca
> la base de datos), así que nada del sistema existente cambia. Ningún flujo de la
> app lo invoca aún.

---

## 1. Idea

```
   Petición (ids + entorno)                         Rule Engine (Fases 1-2)
        │                                                    ▲
        ▼                                                    │ consume
  ┌───────────────┐   ejecuta   ┌───────────────┐   produce  │
  │ ContextBuilder │──────────▶ │  Providers    │──────────▶ RuleContext
  └───────────────┘             │ (1 x namespace)│           (data por namespace)
                                └───────────────┘
```

Cada proveedor aporta **un namespace** (`cliente.*`, `empresa.*`, `sistema.*`…).
El builder los combina en un `RuleContext.data`. El Rule Engine resuelve
`cliente.nombre` sin saber de dónde salió.

---

## 2. Arquitectura

```
src/lib/context/
├── index.ts                     # API pública + createContextBuilder()
├── domain/
│   ├── namespaces.ts            # NAMESPACES + splitPath
│   ├── objects.ts               # ClienteContext, EmpresaContext, SistemaContext… (NO ORM)
│   ├── provider.ts              # ContextProvider + ContextRequest + ProviderInput
│   ├── registry.ts              # ContextProviderRegistry
│   ├── security.ts              # ContextAccessPolicy (+ AllowAll / Allowlist)
│   └── resolution.ts            # resolvePath (reutiliza resolveField del Rule Engine)
├── providers/
│   ├── system-provider.ts       # SystemContextProvider (variables dinámicas) — implementado
│   └── static-provider.ts       # StaticContextProvider + createLoaderProvider (patrón DB)
└── application/
    ├── context-builder.ts       # ContextBuilder (eager/parcial) + LazyContext (memoizado)
    └── ports.ts                 # ContextCache (Noop por defecto)
```

Los componentes que pidió la spec:

- **Context Registry** → `domain/registry.ts`.
- **Context Builder** → `application/context-builder.ts`.
- **Context Providers** → `providers/*` + el contrato en `domain/provider.ts`.
- **Context Objects** → `domain/objects.ts`.
- **Namespaces** → `domain/namespaces.ts`.
- **Resolución de variables** → `domain/resolution.ts`.

---

## 3. Flujo de construcción del contexto

```
builder.build(request, { namespaces?, consumer? })
        │
        ├─ targets = namespaces pedidos (o todos los registrados)   ← carga parcial
        │
        └─ por cada target permitido por la política de seguridad:
              resolve(namespace):
                 · ¿ya resuelto? → devuelve memoizado
                 · resuelve primero sus dependsOn (orden correcto)
                 · provider.provide({ request, resolve }) → objeto del namespace
                 · memoiza el resultado
        │
        ▼
   RuleContext { companyId, timestamp, channel, data: { cliente, empresa, sistema… }, meta }
        │
        ▼
   engine.run(...) / evaluator.evaluateToResult(rule, context)   (Rule Engine)
```

**Lazy**: `builder.createLazyContext(request)` no resuelve nada hasta que se pide
un namespace (`await lazy.get('cliente')`), memoiza, y `lazy.materialize([...])`
produce un `RuleContext` concreto para el Rule Engine.

---

## 4. Namespaces y objetos

`cliente`, `empresa`, `sucursal`, `empleado`, `usuario`, `compra`, `factura`,
`producto`, `servicio`, `vehiculo`, `mascota`, `reserva`, `mesa`, `habitacion`,
`pedido`, `qr`, `membresia`, `beneficios`, `sistema` (constantes en `NAMESPACES`;
se pueden registrar otros libremente).

Cada objeto (`ClienteContext`, `EmpresaContext`, …) es una forma plana y parcial,
**desacoplada del ORM**: campos opcionales + índice abierto para que cada
industria aporte lo que tenga.

## 5. Variables dinámicas (`sistema.*`)

`SystemContextProvider` calcula sin tocar la BD: `timestamp`, `hora`, `horaActual`
(min desde medianoche), `diaSemana`, `nombreDia`, `mes`, `anio`, `temporada`,
`zonaHoraria`, `idioma`, `moneda`, `pais`, `ciudad`, `ip`, `dispositivo`, `canal`.
Añadir más = ampliar el proveedor (o registrar otro), sin tocar el núcleo.

## 6. Resolución de variables

`resolvePath(context, 'cliente.fechaNacimiento')` resuelve dot-paths reutilizando
`resolveField` del Rule Engine (misma semántica, sin duplicar). Sin expresiones
complejas todavía: solo acceso por ruta.

## 7. Seguridad

`ContextAccessPolicy.canAccess(namespace, consumer)` decide qué namespaces puede
cargar cada consumidor. `AllowAllPolicy` (defecto) y `NamespaceAllowlistPolicy`
(ej. `{ scanner: ['cliente','sistema'] }`) dejan lista la aplicación de permisos
por contexto en fases futuras.

## 8. Rendimiento (arquitectura preparada)

- **Memoización**: cada construcción resuelve un namespace una sola vez.
- **Carga parcial**: `build(request, { namespaces })` resuelve solo lo pedido.
- **Lazy loading**: `createLazyContext` resuelve bajo demanda y memoiza.
- **Caché**: puerto `ContextCache` (`NoopContextCache` por defecto) para cachear
  contextos completos entre evaluaciones (implementación real: futura).

---

## 9. Cómo añadir un módulo sin tocar el Rule Engine

Basta **registrar un proveedor**:

```ts
import { createContextBuilder, createLoaderProvider, NAMESPACES } from '@/lib/context'

// El loader vive FUERA del núcleo y puede usar Prisma:
async function cargarVehiculo({ request }) {
  const id = request.refs?.vehiculoId as string | undefined
  if (!id) return undefined
  const v = await prisma.vehiculo.findUnique({ where: { id } })
  return v ? { id: v.id, tipo: 'auto', marca: v.marca, modelo: v.modelo } : undefined
}

const builder = createContextBuilder({
  providers: [createLoaderProvider(NAMESPACES.VEHICULO, cargarVehiculo)],
})
```

Ahora las reglas pueden usar `vehiculo.tipo`, `vehiculo.marca`, etc. **Ni el Rule
Engine ni el Context Builder cambian.** Los proveedores con `dependsOn` pueden
derivar de otros namespaces (ej. `membresia` a partir de `cliente`).

---

## 10. Confirmación de no-regresión

Módulo **100% nuevo** en `src/lib/context/`, **sin cambios de base de datos** ni de
ningún archivo existente. Ningún flujo de la app lo invoca. El Rule Engine sigue
recibiendo un `RuleContext` idéntico en forma (ahora construido por proveedores).
Verificado con `tsc --noEmit` (0 errores), `eslint` del módulo (0 warnings) y un
smoke test de 20 aserciones (providers, registry, builder eager/parcial/lazy,
dependencias, memoización, seguridad, resolución de rutas, variables dinámicas y
la integración real: contexto construido → regla evaluada por el Rule Engine).
