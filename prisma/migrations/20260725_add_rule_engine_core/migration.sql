-- FASE 1 (Rediseño del núcleo): Motor Universal de Reglas.
-- Infraestructura genérica, multi-tenant y desacoplada del negocio. Solo AÑADE
-- enums y tablas nuevas (rule_groups, rules, rule_conditions, rule_actions,
-- rule_execution_logs); no altera ninguna tabla existente. Ningún flujo actual
-- lee estas tablas todavía, por lo que el comportamiento del sistema no cambia.

-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RuleMatchType" AS ENUM ('ALL', 'ANY');

-- CreateTable
CREATE TABLE "rule_groups" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rule_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "groupId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "status" "RuleStatus" NOT NULL DEFAULT 'DRAFT',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "matchType" "RuleMatchType" NOT NULL DEFAULT 'ALL',
    "validoDesde" TIMESTAMP(3),
    "validoHasta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_conditions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "valor" JSONB NOT NULL DEFAULT 'null',
    "tipoValor" TEXT NOT NULL DEFAULT 'STRING',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_actions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "params" JSONB NOT NULL DEFAULT '{}',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_execution_logs" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "companyId" TEXT NOT NULL,
    "matched" BOOLEAN NOT NULL,
    "resultado" JSONB NOT NULL DEFAULT '{}',
    "contexto" JSONB NOT NULL DEFAULT '{}',
    "duracionMs" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rule_groups_companyId_activo_idx" ON "rule_groups"("companyId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "rule_groups_companyId_key_key" ON "rule_groups"("companyId", "key");

-- CreateIndex
CREATE INDEX "rules_companyId_status_activo_idx" ON "rules"("companyId", "status", "activo");

-- CreateIndex
CREATE INDEX "rules_groupId_idx" ON "rules"("groupId");

-- CreateIndex
CREATE INDEX "rules_companyId_prioridad_idx" ON "rules"("companyId", "prioridad");

-- CreateIndex
CREATE INDEX "rule_conditions_ruleId_orden_idx" ON "rule_conditions"("ruleId", "orden");

-- CreateIndex
CREATE INDEX "rule_actions_ruleId_orden_idx" ON "rule_actions"("ruleId", "orden");

-- CreateIndex
CREATE INDEX "rule_execution_logs_companyId_createdAt_idx" ON "rule_execution_logs"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "rule_execution_logs_ruleId_idx" ON "rule_execution_logs"("ruleId");

-- AddForeignKey
ALTER TABLE "rule_groups" ADD CONSTRAINT "rule_groups_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "rule_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_conditions" ADD CONSTRAINT "rule_conditions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_actions" ADD CONSTRAINT "rule_actions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_execution_logs" ADD CONSTRAINT "rule_execution_logs_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_execution_logs" ADD CONSTRAINT "rule_execution_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

