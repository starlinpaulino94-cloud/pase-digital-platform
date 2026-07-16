# Auditoría Enterprise de Membego (2026-07-16)

Diagnóstico de preparación para producción y escala, con datos medidos del
código: 79 modelos Prisma, **160 índices**, 17 unique, 91 rutas
`force-dynamic`, 35 usos de `$transaction`, endpoints reales de
`/api/health` y `/api/cron`, `createMany` para lotes de notificaciones.

## Veredicto ejecutivo

**¿Lanzar hoy para miles de usuarios? Sí — beta controlada, con 5
correcciones previas.** No lanzar marketing masivo (>100k usuarios) sin
caché de datos, rate limiting distribuido y colas. La arquitectura NO
necesita reescritura: necesita infraestructura de escala alrededor.

### Los 5 problemas pre-lanzamiento

1. **Rate limiting en memoria por instancia** (lru-cache): en serverless el
   límite real = límite × nº de lambdas y se reinicia en cold starts.
   → Upstash Redis distribuido. **(CORREGIDO en esta iteración: ver §Punto 1)**
2. **Cero caché de datos**: 91 páginas dinámicas, ~10 usos de caché; cada
   vista golpea Postgres. → ISR/`unstable_cache` en público/marketplace/
   feeds (TTL 60–300 s) ≈ −90% de carga de BD.
3. **Multi-tenant sin defensa en profundidad**: el aislamiento por
   `companyId` está bien aplicado (verificado en caja/facturas/scanner),
   pero depende de disciplina por query. → RLS en Supabase o wrapper
   `prismaForTenant`.
4. **Sin colas**: automatizaciones/envíos corren síncronos; a escala,
   timeouts. → cola ligera (QStash/Inngest).
5. **Observabilidad incompleta**: Sentry ✅, health ✅; faltan métricas,
   alertas, verificación de PITR/backups y load test del camino
   escaneo→canje→cobro.

## Calificaciones

| Área | Nota | Clave |
| --- | --- | --- |
| Arquitectura | 8/10 | monolito modular; motores puros con ports (DDD pragmático) |
| Backend | 7.5/10 | guards 100%, atomicidad sólida; sin colas, validación manual |
| Frontend | 9/10 | MDS/MUK/MMS, RSC, bundle liviano |
| Base de datos | 8.5/10 | 160 índices, Decimal, pgbouncer; falta cursor pagination |
| Seguridad | 8/10 | JWT httpOnly, roles/secciones, CSP, auditoría; falta RLS |
| Escalabilidad | 6.5/10 | serverless escala; la BD sin caché es el cuello |
| UX/UI | 9/10 | journey + experience engine |
| Mantenibilidad | 8/10 | convenciones + 11 docs de sistema |
| Performance | 7.5/10 | render/bundle excelentes; TTFB atado a BD; CWV sin medir |
| Producción | 7.5/10 | lista para beta; puntos 1–3 antes de abrir el grifo |
| **General** | **8/10** | los huecos son de infraestructura, no de diseño |

## Hallazgos por dimensión (resumen)

- **Concurrencia (fortaleza real)**: ticket por upsert atómico, QR de un
  solo uso con transición guardada, cierre de caja con `updateMany`
  condicionado — sin dobles cobros bajo carga.
- **Multi-tenant**: ninguna query peligrosa encontrada en módulos de
  dinero; riesgo = queries futuras (mitigar con RLS/wrapper).
- **API**: server actions correctas para la app; **no hay API pública
  versionada** — necesaria recién para la app móvil (barata de añadir:
  acciones delgadas sobre motores puros).
- **Escalones de carga**: 100–10.000 usuarios OK hoy; 100.000 requiere
  puntos 1–4; 1M añade réplicas de lectura + colas maduras + revisar
  límites de conexiones del pooler.
- **Evolución futura**: móvil (tokens ya en `@membego/ui/tokens`),
  integraciones y API pública: viables sin reescritura. Microservicios:
  innecesarios por años. Multi-región: limitada por Postgres único.

## Riesgos principales

| Riesgo | Impacto | Prob. | Mitigación |
| --- | --- | --- | --- |
| Saturación de conexiones/CPU de Postgres en pico | Alto | Media | caché (§2) + pooler transaccional + réplicas después |
| Abuso de endpoints públicos (registro/contadores) | Medio | Media | rate limit distribuido (§1, hecho) |
| Query futura sin filtro de tenant | Alto | Baja | RLS / wrapper (§3) |
| Timeout del cron de automatizaciones al crecer | Medio | Media | cola + troceo por empresa (§4) |
| Pérdida de datos sin PITR verificado | Alto | Baja | activar/verificar PITR + restore drill (§5) |

## Plan de acción priorizado

1. **Rate limiting distribuido** — **HECHO** (esta iteración).
2. Caché público/marketplace/feeds (ISR + `unstable_cache`).
3. PITR + alertas + load test del camino crítico.
4. RLS o `prismaForTenant`.
5. Cola para automatizaciones/envíos.
6. Zod en actions críticas + paginación cursor en tablas admin.
7. Deuda P2 de consistencia (MATURITY.md).
8. API pública versionada (cuando llegue móvil).

## Punto 1 — implementado: rate limiting distribuido

`src/lib/rate-limit.ts` ahora es **async** y usa **Upstash Redis por REST**
(sin dependencias nuevas: `fetch` + pipeline `INCR`+`PEXPIRE NX`, ventana
fija) cuando existen `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.

- **Sin esas variables** (dev/preview): cae al limitador local LRU de
  siempre — todo sigue funcionando igual.
- **Si Redis falla** en runtime: *fail-open* al limitador local y `console
  .warn` (disponibilidad > exactitud del límite; el freno por instancia
  sigue activo).
- Todos los call sites (~20) actualizados a `await`; `checkBootstrapAccess`
  pasó a async con sus 2 rutas.

**Operativa (Vercel)**: crear una BD Redis gratuita en upstash.com →
copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` → añadirlas en
Vercel → redeploy. Nada más.
