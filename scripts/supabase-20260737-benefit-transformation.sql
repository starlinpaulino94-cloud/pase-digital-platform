-- ═══════════════════════════════════════════════════════════════════════════
-- FASE E1.7 · Benefit Transformation Engine — versión IDEMPOTENTE
-- Segura de ejecutar aunque una corrida anterior haya creado parte de los
-- objetos ("type already exists", etc.): solo crea lo que falte.
-- Al final imprime una verificación del estado.
-- ═══════════════════════════════════════════════════════════════════════════

-- Enums (CREATE TYPE no soporta IF NOT EXISTS: se captura duplicate_object)
DO $$ BEGIN
  CREATE TYPE "TransformationType" AS ENUM
    ('UPGRADE', 'DOWNGRADE', 'EXCHANGE', 'REPLACEMENT', 'CUSTOMIZATION', 'SPLIT', 'MERGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TransformationStatus" AS ENUM
    ('REQUESTED', 'RESOLVING', 'RESOLVED', 'PENDING_APPROVAL', 'APPROVED',
     'PENDING_PAYMENT', 'EXECUTING', 'COMPLETED', 'REJECTED', 'CANCELLED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tablas
CREATE TABLE IF NOT EXISTS "benefit_transformations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "subscriberKind" TEXT NOT NULL DEFAULT 'CLIENT',
    "type" "TransformationType" NOT NULL,
    "status" "TransformationStatus" NOT NULL DEFAULT 'REQUESTED',
    "sourceBenefitId" TEXT NOT NULL,
    "sourceGrantId" TEXT,
    "targetBenefitId" TEXT,
    "targetGrantId" TEXT,
    "sourceValue" DECIMAL(10,2),
    "targetValue" DECIMAL(10,2),
    "differenceAmount" DECIMAL(10,2),
    "resolvedAmount" DECIMAL(10,2),
    "resolution" JSONB NOT NULL DEFAULT '{}',
    "policyId" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "sucursalId" TEXT,
    "requestedById" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "benefit_transformations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "transformation_policies" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TransformationType" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transformation_policies_pkey" PRIMARY KEY ("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "benefit_transformations_companyId_status_idx"
  ON "benefit_transformations"("companyId", "status");
CREATE INDEX IF NOT EXISTS "benefit_transformations_companyId_type_idx"
  ON "benefit_transformations"("companyId", "type");
CREATE INDEX IF NOT EXISTS "benefit_transformations_subscriberId_idx"
  ON "benefit_transformations"("subscriberId");
CREATE INDEX IF NOT EXISTS "benefit_transformations_sourceBenefitId_idx"
  ON "benefit_transformations"("sourceBenefitId");
CREATE INDEX IF NOT EXISTS "benefit_transformations_targetBenefitId_idx"
  ON "benefit_transformations"("targetBenefitId");
CREATE INDEX IF NOT EXISTS "transformation_policies_companyId_tipo_activa_idx"
  ON "transformation_policies"("companyId", "tipo", "activa");

-- Foreign keys (ADD CONSTRAINT no soporta IF NOT EXISTS: se captura el duplicado)
DO $$ BEGIN
  ALTER TABLE "benefit_transformations"
    ADD CONSTRAINT "benefit_transformations_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "benefit_transformations"
    ADD CONSTRAINT "benefit_transformations_sourceBenefitId_fkey"
    FOREIGN KEY ("sourceBenefitId") REFERENCES "benefits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "benefit_transformations"
    ADD CONSTRAINT "benefit_transformations_targetBenefitId_fkey"
    FOREIGN KEY ("targetBenefitId") REFERENCES "benefits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "transformation_policies"
    ADD CONSTRAINT "transformation_policies_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verificación: debe devolver 4 filas OK (2 enums + 2 tablas) y 4 FKs.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 'enum ' || typname AS objeto, 'OK' AS estado
  FROM pg_type WHERE typname IN ('TransformationType', 'TransformationStatus')
UNION ALL
SELECT 'tabla ' || tablename, 'OK'
  FROM pg_tables
 WHERE schemaname = 'public'
   AND tablename IN ('benefit_transformations', 'transformation_policies')
UNION ALL
SELECT 'fk ' || conname, 'OK'
  FROM pg_constraint
 WHERE conname LIKE 'benefit_transformations_%_fkey'
    OR conname LIKE 'transformation_policies_%_fkey'
ORDER BY 1;
