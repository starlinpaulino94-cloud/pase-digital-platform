# Fase E6 — Auditoría del módulo de Referidos (diagnóstico previo)

Auditoría forense completa realizada ANTES de tocar código, según lo exigido
por la fase. Cada hallazgo tiene evidencia en `path:línea`.

## Veredicto general

El módulo NO inventa datos (no hay números simulados ni hardcodeados en los
dashboards), pero sus métricas son **estructuralmente inconsistentes**: mezcla
universos de datos no comparables, aplica el antifraude a medias y depende de
un único disparador manual para las conversiones. Además coexisten DOS
sistemas (legacy vivo + motor universal Fase D 100 % latente) sin puente.

## Causas raíz (por qué "los datos no reflejan la actividad real")

1. **Embudo con fuentes mezcladas.** Compartidos/Clics se cuentan de EVENTOS
   (`referral_events`), Registros/Membresías de FILAS (`referidos`), y la
   "conversión" divide filas entre eventos (`src/modules/referidos/actions.ts:296-306`,
   `:555`). Los clics son hits totales (hasta 5/IP/h), no visitantes únicos —
   el % resultante no es auditable a nivel de fila.

2. **`sospechoso` aplicado a medias.** El flag antifraude se excluye del
   embudo (registros/membresías) pero se IGNORA en:
   - la completación de membresía (`actions.ts:30` no revisa `sospechoso` →
     un sospechoso completa, suma 200 puntos y empuja recompensas),
   - `evaluarRecompensas` (`actions.ts:103-105` cuenta COMPLETADOS sin filtro),
   - "Recompensas entregadas" (`actions.ts:419`),
   - "Ingresos por referidos" (`actions.ts:454-463`),
   - el KPI de superadmin (`src/modules/empresas/queries.ts:271`).
   Resultado: pantallas distintas muestran cifras distintas para lo mismo.

3. **Antifraude "de fachada".** La lógica rica (emails/teléfonos duplicados,
   maxPerIp, compra real requerida) vive en código MUERTO
   (`src/lib/referral/domain/fraud.ts`, nunca invocado). Lo único vivo es el
   hash de IP en 7 días (`src/lib/referidos-attribution.ts:17-40`).

4. **Eventos intermedios inexistentes.** No se registra la visita a la
   landing ni el "registro iniciado": el embudo salta de clic (hit anónimo) a
   cuenta creada, sin medir abandono. No hay eventos de verificación, compra,
   recompensa ni fraude en `ReferralEventTipo`.

5. **Conversión con un único disparador frágil.** `procesarReferidoCompletado`
   solo se llama desde la aprobación manual del admin
   (`src/modules/admin/actions.ts:84`). Cualquier otra vía de activación
   (compras de promociones E5, pasarelas futuras) NO completa referidos ni
   entrega recompensas.

6. **Recompensas parcialmente simbólicas y con umbral frágil.**
   - Solo `LAVADOS_GRATIS` entrega algo tangible; `DESCUENTO_%/MONTO` solo
     generan un mensaje (`actions.ts:139-162`).
   - La regla exige igualdad EXACTA `valorCondicion == completados`
     (`actions.ts:113`): si el conteo salta el umbral, la recompensa se
     pierde en silencio. No existe estado "pendiente" real (solo el booleano
     `recompensaAplicada`, que además se marca en TODOS los completados
     `actions.ts:193-196`).

7. **Puntos/ranking gamificables.** Puntos hardcodeados
   (`src/lib/referidos.ts:13-21`) y ranking por suma de puntos de eventos
   (incluye shares/clics propios) — se puede liderar sin referir a nadie real
   (`actions.ts:267-273`). El dueño en incógnito genera CLICK propio.

8. **Fugas de atribución.** Registros cuentan sin verificación de correo
   (`registro/actions.ts:252` corre antes de enviar la verificación); la
   atribución global depende de una cookie de 30 días que se descarta para
   usuarios existentes vía Google (`googleOnboarding.ts:149`) y muere entre
   dispositivos; `MEMBRESIA_GLOBAL` depende de que exista el
   `REGISTRO_GLOBAL` previo.

9. **Doble sistema sin puente.** El motor universal Fase D
   (`referral_programs/participants/referrals`, `src/lib/referral/**`) está
   completo pero con CERO filas y CERO llamadores en runtime; 20 playbooks y
   11 eventos de automatización de referidos definidos sin emisor (solo
   `referido.invitado_registrado` se emite). El tipo `REFERRAL` del
   Transaction Engine nunca se usa. Campañas solo como texto `utm_campaign`.

10. **Rendimiento.** Filtros por JSON `meta` sin índice (antifraude, métricas
    por campaña); ranking con `groupBy` sobre toda la tabla de eventos por
    empresa en cada carga; 2 round-trips seriales evitables en el dashboard
    del cliente.

## Decisión de reconstrucción

Se reconstruye SOBRE el sistema vivo (`referral_events` ya es un event store)
elevándolo a atribución real por eventos — no se cablea el motor latente
(riesgo alto, cero datos) ni se parchea la lógica actual:

- **Attribution Tracking**: identificador único de visitante (`visitorId`)
  sembrado en el clic y propagado hasta el registro; eventos enlazados al
  referido (`referidoClienteId`) → recorrido completo auditable por persona.
- **Eventos nuevos**: LINK (generación), REGISTRO_INICIADO (landing de
  registro con atribución), VERIFICADO (correo confirmado), COMPRA (primera
  compra confirmada: membresía O promoción E5), RECOMPENSA, FRAUDE.
- **Una sola fuente por etapa del embudo** + tasas entre etapas adyacentes.
- **`sospechoso` aplicado en TODAS las rutas** (completación, recompensas,
  ingresos, KPIs) + evento FRAUDE auditable.
- **Recompensas con registro real** (`referral_recompensas`): estados
  PENDIENTE/ENTREGADA, umbral `>=` sin pérdidas, entregas auditadas y
  transacción oficial (Transaction Engine tipo REFERRAL).
- **Conversión multi-vía**: el punto de activación de membresías Y el de
  compras E5 procesan la conversión (no solo el botón del admin).
- Ranking por conversiones reales; puntos solo como gamificación secundaria.

Los hallazgos completos de ambos peritajes (flujo legacy y motor universal)
están íntegros en el historial de esta fase; este documento resume las causas
raíz que la reconstrucción elimina.
