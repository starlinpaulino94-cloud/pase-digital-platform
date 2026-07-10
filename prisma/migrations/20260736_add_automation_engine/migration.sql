-- FASE E1 (Automation Engine). Solo AÑADE: enum AutomationRunStatus y tablas
-- automations, automation_runs, automation_events. Motor universal que reutiliza
-- Rule Engine + Action Engine. Ningún flujo de la app lo consume aún.

-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('RUNNING', 'WAITING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "objetivo" TEXT,
    "templateKey" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerEvent" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_runs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'RUNNING',
    "subjectId" TEXT,
    "subjectKind" TEXT,
    "triggeredBy" TEXT,
    "rulesEvaluated" JSONB NOT NULL DEFAULT '[]',
    "actionsRun" JSONB NOT NULL DEFAULT '[]',
    "result" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "durationMs" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subjectId" TEXT,
    "subjectKind" TEXT DEFAULT 'CLIENT',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "source" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automations_companyId_status_idx" ON "automations"("companyId", "status");

-- CreateIndex
CREATE INDEX "automations_companyId_triggerType_idx" ON "automations"("companyId", "triggerType");

-- CreateIndex
CREATE INDEX "automations_companyId_triggerEvent_idx" ON "automations"("companyId", "triggerEvent");

-- CreateIndex
CREATE INDEX "automation_runs_companyId_automationId_status_idx" ON "automation_runs"("companyId", "automationId", "status");

-- CreateIndex
CREATE INDEX "automation_runs_companyId_startedAt_idx" ON "automation_runs"("companyId", "startedAt");

-- CreateIndex
CREATE INDEX "automation_runs_subjectId_idx" ON "automation_runs"("subjectId");

-- CreateIndex
CREATE INDEX "automation_events_companyId_type_processed_idx" ON "automation_events"("companyId", "type", "processed");

-- CreateIndex
CREATE INDEX "automation_events_companyId_occurredAt_idx" ON "automation_events"("companyId", "occurredAt");

-- CreateIndex
CREATE INDEX "automation_events_subjectId_idx" ON "automation_events"("subjectId");

-- AddForeignKey
ALTER TABLE "automations" ADD CONSTRAINT "automations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
