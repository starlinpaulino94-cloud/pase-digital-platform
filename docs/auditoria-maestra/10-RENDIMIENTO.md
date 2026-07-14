# CAPÍTULO 10 — RENDIMIENTO

*Auditoría Maestra de MembeGo · Volumen 10*

---

## 10.1 "A veces carga rápido, a veces falla": las causas probables, ordenadas

El patrón descrito (velocidad inconsistente + errores aleatorios por módulos) es consistente con lo que el código muestra. Diagnóstico por probabilidad:

### Causa 1 — Todo es dinámico, nada se cachea (medido: 82/107 páginas con `force-dynamic`; solo 9 archivos usan algún mecanismo de caché)

Cada visita —incluida la de un anónimo al marketplace— ejecuta render en servidor + N queries a Postgres. La latencia percibida queda atada a: cold start de la lambda + RTT a la base + la query más lenta de la página. Cuando todo está caliente: rápido. Tras minutos de inactividad o en picos: lento. **Esa es exactamente la inconsistencia descrita.**

**Arreglo:**
- Marketplace y perfiles públicos → ISR (`revalidate: 300` o etiquetas con `revalidateTag` al editar el perfil). El contenido público cambia poco; hoy se paga como si cambiara por segundo.
- Páginas autenticadas → dinámicas sí, pero con `Suspense` por sección (el shell pinta ya; los datos llegan en streaming) y `unstable_cache`/`cache()` para lecturas repetidas (categorías, config de empresa).
- Auditar dónde `force-dynamic` se puso "por si acaso" (patrón visible: está en casi todo, incluidas páginas que solo leen datos casi estáticos).

### Causa 2 — Cascadas de queries en páginas pesadas

Páginas como el dashboard admin y los perfiles ejecutan series de `await` secuenciales (varias queries una tras otra) en lugar de `Promise.all`, y queries anchas (`findUnique` sin `select` trae el registro entero, visto en varios módulos). Con 20-40ms por query, ocho queries secuenciales son 300ms+ solo de BD.

**Arreglo:** paralelizar con `Promise.all` en cada page server component; `select` explícito en queries calientes; revisar N+1 en listas (mapear ids y traer relaciones en 1 query).

### Causa 3 — Errores "aleatorios" que no son aleatorios

Fuentes concretas identificadas:
1. **Casts `as` sobre campos Json** (`beneficioInvitante as {...}`): un registro viejo con forma distinta revienta solo cuando ESE registro se lee → error "aleatorio" por módulo. Arreglo: parseo zod con fallback (A-5 del Cap. 2).
2. **Flujos multi-escritura sin transacción:** si el paso 3 de 5 falla, el estado queda intermedio y la SIGUIENTE visita del usuario ve datos inconsistentes (el error aparece lejos de su causa). Arreglo: `$transaction` en pasos atómicos (A-4/A-3).
3. **Rate limit de Supabase Auth bajo carga:** ya ocurrió (el comentario en `proxy.ts` lo documenta: "bajo carga agotaba el rate limit de Auth"). La mitigación actual (saltar Supabase para anónimos) es buena; sesiones concurrentes altas pueden volver a tocar el límite en rutas autenticadas.
4. **Cron de automatizaciones:** si nadie lo invoca con la frecuencia esperada (no hay evidencia de scheduling en el repo), las features que dependen de él fallan "a veces" — cuando en realidad no corren nunca o corren tarde.

### Causa 4 — Memoria y cold starts

- El rate limiter LRU (10k entradas) y cualquier estado a nivel de módulo viven por instancia: no son leaks clásicos, pero engordan el warm-up y hacen el comportamiento no determinista entre instancias.
- `next build` webpack con 84K LOC + 616 módulos: bundles servidor grandes → cold start más largo. La limpieza de motores (A-2) reduce esto directamente.

## 10.2 Hydration y renders innecesarios

- Riesgo de hydration mismatch localizado: componentes que usan `Date.now()`/aleatoriedad en render (el countdown de campañas renderiza tiempo en servidor y cliente; el confetti ya se corrigió). Regla: todo lo que dependa del reloj se monta con `useEffect` o se marca client-only.
- 134 componentes cliente: auditar los que son cliente solo por un estado trivial; cada uno arrastra su JS al bundle.
- Sin `React.memo`/`useMemo` en listas largas del admin (tablas de clientes): aceptable hoy, medible con React Profiler antes de optimizar.

## 10.3 Plan de performance (orden de ejecución)

| # | Acción | Efecto esperado | Esfuerzo |
|---|---|---|---|
| P-1 | ISR/tags en todo lo público (marketplace, perfiles, landings) | TTFB público de ~600ms → <100ms consistente; -70% carga de BD | 1 sem |
| P-2 | `Promise.all` + `select` en las 15 páginas más usadas | -30-50% latencia autenticada | 1 sem |
| P-3 | Suspense + streaming por sección (con UX-4) | Percepción de velocidad inmediata | 1-2 sem |
| P-4 | Zod en Json + transacciones en flujos multi-escritura | Elimina la clase principal de "errores aleatorios" | 2 sem |
| P-5 | Observabilidad: log de queries lentas (Prisma `$on('query')` > 200ms), métricas de ruta, alertas de cron | Deja de adivinar; mide | 3 días |
| P-6 | Extraer motores del build (A-2) | Cold start y build más rápidos | (ya en Cap. 2) |

## 10.4 Presupuestos de rendimiento (adoptar como política)

- Público (marketplace/landing): **TTFB < 200ms (cacheado), LCP < 2.0s en 4G.**
- Autenticado: **shell < 500ms, datos en streaming < 1.5s.**
- Escáner: **validación de QR < 800ms p95** (es el momento con el cliente esperando frente al mostrador — el SLA más importante de la plataforma).
- Toda PR que empeore un presupuesto en >10% requiere justificación explícita.

---

*Continúa en el Volumen 11: Seguridad.*
