-- FASE 6 (Business Data Dictionary). Solo AÑADE: enum DictionaryVariableStatus y
-- tablas data_dictionary_variables + data_dictionary_variable_versions, que
-- persisten variables custom/por-empresa (el catálogo estándar vive en código).
-- No altera ninguna tabla existente. Ningún flujo de la app las consume todavía.

-- CreateEnum
CREATE TYPE "DictionaryVariableStatus" AS ENUM ('ACTIVE', 'DEPRECATED', 'DISABLED');

-- CreateTable
CREATE TABLE "data_dictionary_variables" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "semanticType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "ownerModule" TEXT,
    "source" TEXT NOT NULL DEFAULT 'CONTEXT',
    "contextPath" TEXT,
    "format" TEXT,
    "unit" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "DictionaryVariableStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "validation" JSONB NOT NULL DEFAULT '{}',
    "i18n" JSONB NOT NULL DEFAULT '{}',
    "calculated" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_dictionary_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_dictionary_variable_versions" (
    "id" TEXT NOT NULL,
    "variableId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_dictionary_variable_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_dictionary_variables_companyId_category_idx" ON "data_dictionary_variables"("companyId", "category");

-- CreateIndex
CREATE INDEX "data_dictionary_variables_category_idx" ON "data_dictionary_variables"("category");

-- CreateIndex
CREATE INDEX "data_dictionary_variables_status_idx" ON "data_dictionary_variables"("status");

-- CreateIndex
CREATE UNIQUE INDEX "data_dictionary_variables_companyId_key_key" ON "data_dictionary_variables"("companyId", "key");

-- CreateIndex
CREATE INDEX "data_dictionary_variable_versions_variableId_idx" ON "data_dictionary_variable_versions"("variableId");

-- CreateIndex
CREATE UNIQUE INDEX "data_dictionary_variable_versions_variableId_version_key" ON "data_dictionary_variable_versions"("variableId", "version");

-- AddForeignKey
ALTER TABLE "data_dictionary_variables" ADD CONSTRAINT "data_dictionary_variables_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_dictionary_variable_versions" ADD CONSTRAINT "data_dictionary_variable_versions_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "data_dictionary_variables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

