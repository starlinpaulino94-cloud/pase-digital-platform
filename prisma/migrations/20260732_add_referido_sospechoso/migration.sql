-- Anti-fraude de referidos: marca a nivel de fila los registros atribuidos con
-- huella repetida (autoreferido / misma red del referente). Solo AÑADE una
-- columna y su índice; no cambia datos existentes (default false).

-- AlterTable
ALTER TABLE "referidos" ADD COLUMN     "sospechoso" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "referidos_companyId_sospechoso_idx" ON "referidos"("companyId", "sospechoso");
