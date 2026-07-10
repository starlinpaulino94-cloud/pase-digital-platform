-- FASE 2 (Lenguaje universal del Rule Engine): árbol booleano de condiciones.
-- Solo AÑADE: enum RuleLogicalOperator, tabla rule_condition_groups (auto-anidable
-- para árboles AND/OR/NOT/XOR de profundidad ilimitada) y columnas nuevas en
-- rule_conditions (groupId, conditionType, dataType), todas con DEFAULT y por
-- tanto seguras sobre filas existentes. No altera semántica previa: una condición
-- con groupId NULL sigue colgando de la raíz de la regla (modo plano de Fase 1).
-- Ningún flujo de la app consume estas tablas todavía.

-- CreateEnum
CREATE TYPE "RuleLogicalOperator" AS ENUM ('AND', 'OR', 'NOT', 'XOR');

-- AlterTable
ALTER TABLE "rule_conditions" ADD COLUMN     "conditionType" TEXT NOT NULL DEFAULT 'field',
ADD COLUMN     "dataType" TEXT NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "rule_condition_groups" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "parentId" TEXT,
    "operator" "RuleLogicalOperator" NOT NULL DEFAULT 'AND',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_condition_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rule_condition_groups_ruleId_idx" ON "rule_condition_groups"("ruleId");

-- CreateIndex
CREATE INDEX "rule_condition_groups_parentId_idx" ON "rule_condition_groups"("parentId");

-- CreateIndex
CREATE INDEX "rule_conditions_groupId_idx" ON "rule_conditions"("groupId");

-- AddForeignKey
ALTER TABLE "rule_conditions" ADD CONSTRAINT "rule_conditions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "rule_condition_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_condition_groups" ADD CONSTRAINT "rule_condition_groups_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_condition_groups" ADD CONSTRAINT "rule_condition_groups_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "rule_condition_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

