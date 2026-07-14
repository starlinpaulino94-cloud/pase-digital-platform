# CAPÍTULO 11 — SEGURIDAD Y FRAUDE

*Auditoría Maestra de MembeGo · Volumen 11*

---

## 11.1 Estado general

La plataforma ya pasó una ronda de endurecimiento (server actions protegidas, endpoints bootstrap cerrados, open redirect corregido, CSP/headers, rate limit en login/registro — tareas 1.x/4.4 del historial) y existe `docs/SECURITY_ANALYSIS.md`. La base es mejor que el promedio. Los riesgos restantes son los estructurales, no los obvios.

## 11.2 Roles, permisos y autorización

**Cómo funciona hoy:** rol en `user.metadata` (Supabase) → `proxy.ts` protege prefijos de ruta (`ROUTE_PROTECTION`) → cada server action llama `requireRole(...)` → contexto de empresa vía `resolveCompanyId`/`companyFilter`.

**Fortalezas:** doble capa (middleware + action); roles centralizados en `src/types`; secciones admin con permisos (`canAccessAdminSection`).

**Debilidades:**
1. **Autorización por objeto no sistemática (IDOR, el riesgo #1).** El patrón seguro existe en muchos lugares (verificar `cliente.companyId === campana.companyId`, etc.), pero depende de disciplina manual en cada una de las ~100+ actions/queries. Basta UNA action que reciba un `id` y haga `update` sin verificar tenencia para tener fuga o manipulación cross-tenant. **Recomendación central: helpers de acceso que exijan `companyId`/`clienteId` en la firma (imposible olvidarlo) + test automatizado de IDOR por módulo (llamar cada action con ids de otro tenant y esperar rechazo).**
2. **RLS no habilitado como red de seguridad.** Prisma se conecta como rol privilegiado; toda la seguridad vive en la app. Con Supabase ya pagado, activar RLS básico por `companyId` en las tablas sensibles da defensa en profundidad casi gratis.
3. **Roles en metadata del JWT:** un cambio de rol no se refleja hasta refrescar el token. Documentar TTL y forzar re-login al degradar privilegios.

## 11.3 QR y canje (la joya a proteger)

**Bien:** QrToken de un solo uso, máquina de estados con transiciones auditadas, validación del lado del escáner con roles.

**Vectores a cerrar:**
| Vector | Riesgo | Mitigación |
|---|---|---|
| Captura de pantalla del QR compartida | Canje por un tercero | Nombre del cliente visible junto al QR (Cap. 5) + token rotativo (QR que se regenera cada 60s, estilo boarding pass) en fase 2 |
| Fuerza bruta de tokens | Adivinar un token válido | Verificar entropía (≥128 bits aleatorios) + rate limit del endpoint de validación por dispositivo/empleado |
| Empleado deshonesto (canjes falsos/no registrados) | Fraude interno | Métricas de canje por empleado + anomalías (canjes fuera de horario, ráfagas) en el panel del admin |
| Replay entre empresas | Canjear QR de empresa A en empresa B | Confirmar que la validación exige `companyId` del empleado == del producto (auditar explícitamente, es un IDOR clásico) |

## 11.4 Referidos y promociones (fraude económico)

**Bien:** huella IP hasheada, visitor cookie, ventanas temporales (7/30 días), flag `sospechoso` auditable que no bloquea el vínculo pero congela recompensas, comparación por persona (`supabaseId`) y no por fila de cliente — diseño anti-fraude serio.

**Brechas:**
1. **El rate limiting es teatro en serverless** (in-memory por instancia, ya reconocido como P2-6 en el propio código). Los límites de eventos de campaña, shares y login son burlables escalando concurrencia. **Migrar a límite compartido: tabla Postgres con upsert atómico (suficiente al volumen actual) o Upstash Redis.** Es un cambio de ~1 día con el diseño actual de `createRateLimiter`.
2. **Emails alias:** `usuario+1@gmail.com` crea cuentas "distintas". Normalizar email (quitar `+tag`, puntos en gmail) en el registro para el chequeo de duplicidad.
3. **Stock de premios:** el guard atómico de `maxPremios` en campañas está bien; replicar el mismo patrón en stock de promociones (verificar que la compra de promoción decrementa stock con guard, no con read-then-write).
4. **Verificación de teléfono:** hoy el teléfono es texto libre. OTP (Cap. 6) es también la mejor arma anti-granjas de cuentas — un número real cuesta dinero, un email no.

## 11.5 Validaciones y superficie de ataque

- **Inputs:** parseo manual de FormData sin schema (Cap. 2, A-5) = validación inconsistente. Zod en cada action es también una medida de seguridad (tipos, longitudes, formatos).
- **Subida de archivos (comprobantes, imágenes):** verificar límites de tamaño y tipo MIME del lado servidor y que los buckets de Storage tengan políticas correctas (`migrations_manual` sugiere que se configuran a mano — incluirlas en migraciones versionadas).
- **API routes abiertas:** `api/health`, `api/stats`, `api/cron/automatizaciones`, `api/admin-reset-password`, `api/bootstrap-superadmin`. Confirmar: cron protegido por secreto de header; bootstrap inerte tras el primer uso (el guard existe — testearlo); `admin-reset-password` con auditoría y rate limit.
- **Secretos:** `.env.example` está mantenido; verificar que ningún `NEXT_PUBLIC_` exponga algo sensible (revisión rápida no encontró problemas).

## 11.6 Priorización de seguridad

| # | Acción | Riesgo que cierra | Esfuerzo |
|---|---|---|---|
| S-1 | Test suite de IDOR (cada action con ids ajenos) | Fuga/manipulación cross-tenant | 1-2 sem |
| S-2 | Rate limiting compartido (Postgres/Redis) | Fraude de métricas, brute force | 2-3 días |
| S-3 | Validación de QR: confirmar company-match + rate limit + entropía | Fraude de canje | 2-3 días |
| S-4 | RLS básico por companyId en tablas sensibles | Defensa en profundidad | 1 sem |
| S-5 | Normalización de email + OTP de teléfono | Granjas de cuentas | con A2 del Cap. 6 |
| S-6 | Panel de anomalías de canje por empleado | Fraude interno | 1 sem (fase 2) |

---

*Continúa en el Volumen 12: Branding.*
