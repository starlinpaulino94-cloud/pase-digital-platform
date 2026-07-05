# FASE D: MIGRACIÓN DE DATOS

## 📋 Resumen Ejecutivo

Migración segura de datos históricos de arquitectura single-membership a multi-membership, con validaciones en cada paso y rollback completo.

### Cambios Principales
- Agrega `companyId` a Membership (FK a Company)
- Agrega `membresiaId` a QrToken (FK a Membership)  
- Agrega `membresiaId` a Visit (para trazabilidad histórica)
- Implementa unique constraint (clienteId, companyId)

### Características
- ✅ **Completamente Reversible**: Backup antes de cada paso crítico
- ✅ **Zero Downtime**: Con backup y rollback rápido
- ✅ **Validación en Cada Paso**: Queries de verificación incluidas
- ✅ **Preserva 100% Datos**: Ninguna visita o membership se pierde

---

## 📊 Pasos de Migración

### PASO 1: Pre-Migración (Backup)
**Duración**: 5 min | **Reversible**: ✅ Sí

```sql
-- Crear backups de tablas críticas
CREATE TABLE "memberships_backup_20260705" AS SELECT * FROM "memberships";
CREATE TABLE "qr_tokens_backup_20260705" AS SELECT * FROM "qr_tokens";
CREATE TABLE "visits_backup_20260705" AS SELECT * FROM "visits";

-- Verificar integridad pre-migración
SELECT COUNT(*) FROM "memberships";
SELECT COUNT(*) FROM "qr_tokens";
SELECT COUNT(*) FROM "visits";
```

### PASO 2: Agregar Columnas (Nullable)
**Duración**: 2 min | **Reversible**: ✅ Sí

```sql
ALTER TABLE "memberships" ADD COLUMN "companyId" TEXT DEFAULT NULL;
ALTER TABLE "qr_tokens" ADD COLUMN "membresiaId" TEXT DEFAULT NULL;
ALTER TABLE "visits" ADD COLUMN "membresiaId" TEXT DEFAULT NULL;
```

### PASO 3: Poblar companyId en Memberships
**Duración**: 1-5 min | **Reversible**: ✅ Sí

```sql
-- Mapear companyId desde cliente
UPDATE "memberships" m
SET "companyId" = c."companyId"
FROM "clientes" c
WHERE m."clienteId" = c."id" 
  AND m."companyId" IS NULL;

-- Validar: debe retornar 0
SELECT COUNT(*) FROM "memberships" WHERE "companyId" IS NULL;
```

### PASO 4: Poblar membresiaId en QR Tokens
**Duración**: 1-5 min | **Reversible**: ✅ Sí

```sql
-- Asignar QR a latest membership por cliente
UPDATE "qr_tokens" q
SET "membresiaId" = (
  SELECT m."id"
  FROM "memberships" m
  WHERE m."clienteId" = q."clienteId"
  ORDER BY m."createdAt" DESC
  LIMIT 1
)
WHERE "membresiaId" IS NULL;

-- Validar: debe retornar 0
SELECT COUNT(*) FROM "qr_tokens" WHERE "membresiaId" IS NULL;
```

### PASO 5: Poblar membresiaId en Visits (Histórico)
**Duración**: 1-5 min | **Reversible**: ✅ Sí

```sql
-- Asignar membresía que existía al momento de la visita
UPDATE "visits" v
SET "membresiaId" = (
  SELECT m."id"
  FROM "memberships" m
  WHERE m."clienteId" = v."clienteId"
    AND m."createdAt" <= v."fechaVisita"
  ORDER BY m."createdAt" DESC
  LIMIT 1
)
WHERE "membresiaId" IS NULL;

-- OK si quedan NULL (datos históricos incompletos es aceptable)
SELECT COUNT(*) FROM "visits" WHERE "membresiaId" IS NULL;
```

### PASO 6: Hacer Columnas NOT NULL
**Duración**: 1 min | **Reversible**: ❌ No (requiere backup)

⚠️ **CRÍTICO**: Verificar antes que NO hay NULL en pasos anteriores

```sql
-- Validar pre-requisitos
SELECT COUNT(*) FROM "memberships" WHERE "companyId" IS NULL;  -- Debe ser 0
SELECT COUNT(*) FROM "qr_tokens" WHERE "membresiaId" IS NULL;   -- Debe ser 0

-- Hacer NOT NULL
ALTER TABLE "memberships" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "qr_tokens" ALTER COLUMN "membresiaId" SET NOT NULL;
```

### PASO 7: Agregar Constraints e Índices
**Duración**: 1-2 min | **Reversible**: ✅ Sí

```sql
-- Foreign key: memberships.companyId → companies.id
ALTER TABLE "memberships" 
ADD CONSTRAINT "memberships_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;

-- Unique constraint: (clienteId, companyId)
-- Validar antes: no hay duplicados
SELECT "clienteId", "companyId", COUNT(*)
FROM "memberships"
GROUP BY "clienteId", "companyId"
HAVING COUNT(*) > 1;

ALTER TABLE "memberships" 
ADD CONSTRAINT "memberships_clienteId_companyId_key" 
UNIQUE("clienteId", "companyId");

-- Foreign key: qr_tokens.membresiaId → memberships.id
ALTER TABLE "qr_tokens" 
ADD CONSTRAINT "qr_tokens_membresiaId_fkey"
FOREIGN KEY ("membresiaId") REFERENCES "memberships"("id") ON DELETE CASCADE;

-- Foreign key: visits.membresiaId → memberships.id (opcional)
ALTER TABLE "visits" 
ADD CONSTRAINT "visits_membresiaId_fkey"
FOREIGN KEY ("membresiaId") REFERENCES "memberships"("id") ON DELETE SET NULL;

-- Crear índices
CREATE INDEX "memberships_companyId_idx" ON "memberships"("companyId");
CREATE INDEX "qr_tokens_membresiaId_idx" ON "qr_tokens"("membresiaId");
CREATE INDEX "visits_membresiaId_idx" ON "visits"("membresiaId");
```

### PASO 8: Post-Migración (Validación Completa)
**Duración**: 5-10 min | **Reversible**: ✅ Solo lectura

```sql
-- Validar integridad
SELECT COUNT(*) as qr_orfanados FROM "qr_tokens" q
WHERE NOT EXISTS (SELECT 1 FROM "memberships" m WHERE m."id" = q."membresiaId");

SELECT COUNT(*) as visits_orfanadas FROM "visits" v
WHERE "membresiaId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "memberships" m WHERE m."id" = v."membresiaId");

-- Reporte estadístico
SELECT 
  (SELECT COUNT(DISTINCT "clienteId") FROM "memberships") as clientes,
  (SELECT COUNT(DISTINCT "companyId") FROM "memberships") as empresas,
  (SELECT COUNT(*) FROM "memberships") as memberships,
  (SELECT COUNT(*) FROM "qr_tokens") as qr_tokens,
  (SELECT COUNT(*) FROM "visits") as visits;
```

---

## ✅ Checklist de Ejecución

- [ ] Backup creado y verificado
- [ ] Columnas agregadas
- [ ] companyId poblado (COUNT NULL = 0)
- [ ] membresiaId en QR poblado (COUNT NULL = 0)
- [ ] membresiaId en Visits poblado
- [ ] Columnas hechas NOT NULL
- [ ] Constraints agregados (sin violaciones)
- [ ] Índices creados
- [ ] Post-validación pasó (cero orfanados)
- [ ] Sistema funcionando: scanner, dashboard, visits

---

## 🔄 Rollback

Si algo falla **después de PASO 6**, usar backup:

```sql
-- Restaurar tablas completas
DROP TABLE "memberships";
CREATE TABLE "memberships" AS SELECT * FROM "memberships_backup_20260705";

DROP TABLE "qr_tokens";
CREATE TABLE "qr_tokens" AS SELECT * FROM "qr_tokens_backup_20260705";

DROP TABLE "visits";
CREATE TABLE "visits" AS SELECT * FROM "visits_backup_20260705";
```

Si falla **antes de PASO 6**, es más simple revertir el paso específico (ver FASE_D_MIGRACION.md en scratchpad para rollback granular).

---

## 📈 Timeline Estimado

| Actividad | Duración |
|-----------|----------|
| Pre-migración | 5 min |
| Agregar columnas | 2 min |
| Poblar datos | 5-15 min |
| NOT NULL | 1 min |
| Constraints | 1-2 min |
| Validación | 5-10 min |
| **TOTAL** | **20-40 min** |

**Ventana recomendada**: Off-peak, con ~1 hora disponible para rollback si es necesario.

---

## 📝 Notas

### Por qué este orden?
1. Backup primero → rollback completo en cualquier punto
2. Columnas nullable → no rompe constraints
3. Poblar datos → rellena con valores válidos
4. NOT NULL → fuerza integridad después
5. Constraints → previene corrupción futura

### membresiaId en Visits es OPCIONAL
- OK si quedan NULL (no todas las visitas tienen membership asociada)
- Trazabilidad histórica es best-effort
- No rompe funcionalidad si algunos quedan NULL

### QR Tokens: Latest Membership
- QR activo pertenece a membership vigente
- Latest membership = más reciente creada
- Preserva integridad histórica

---

## 🚀 Próxima Fase

**Fase E: Testing** - Validar flujos con 1, 2, 10 memberships por usuario
