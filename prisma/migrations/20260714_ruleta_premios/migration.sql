-- Engagement Engine · Fase 6B — Ruleta de premios (gasta puntos ganados).

-- CreateEnum
CREATE TYPE "RuletaPremioTipo" AS ENUM ('PROMOCION', 'NADA');

-- CreateTable
CREATE TABLE "ruleta_premios" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "RuletaPremioTipo" NOT NULL DEFAULT 'PROMOCION',
    "promocionId" TEXT,
    "probabilidad" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ruleta_premios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ruleta_jugadas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "costoPuntos" INTEGER NOT NULL,
    "premioId" TEXT,
    "premioNombre" TEXT NOT NULL,
    "gano" BOOLEAN NOT NULL DEFAULT false,
    "productoCompraId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ruleta_jugadas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ruleta_premios_companyId_activo_idx" ON "ruleta_premios"("companyId", "activo");
CREATE INDEX "ruleta_jugadas_companyId_clienteId_idx" ON "ruleta_jugadas"("companyId", "clienteId");
CREATE INDEX "ruleta_jugadas_clienteId_createdAt_idx" ON "ruleta_jugadas"("clienteId", "createdAt");

-- AddForeignKey
ALTER TABLE "ruleta_premios" ADD CONSTRAINT "ruleta_premios_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ruleta_premios" ADD CONSTRAINT "ruleta_premios_promocionId_fkey" FOREIGN KEY ("promocionId") REFERENCES "promociones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ruleta_jugadas" ADD CONSTRAINT "ruleta_jugadas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ruleta_jugadas" ADD CONSTRAINT "ruleta_jugadas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ruleta_jugadas" ADD CONSTRAINT "ruleta_jugadas_premioId_fkey" FOREIGN KEY ("premioId") REFERENCES "ruleta_premios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
