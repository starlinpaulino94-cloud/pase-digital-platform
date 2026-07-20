-- Ofertas VIP: regalos privados por lista cerrada de clientes.

CREATE TYPE "OfertaPeriodo" AS ENUM ('SEMANAL', 'MENSUAL', 'TOTAL');
CREATE TYPE "OfertaPrivadaEstado" AS ENUM ('ACTIVA', 'PAUSADA', 'FINALIZADA');

CREATE TABLE "ofertas_privadas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "usosPorPeriodo" INTEGER NOT NULL DEFAULT 1,
    "periodo" "OfertaPeriodo" NOT NULL DEFAULT 'MENSUAL',
    "vigenciaHasta" TIMESTAMP(3),
    "estado" "OfertaPrivadaEstado" NOT NULL DEFAULT 'ACTIVA',
    "creadaPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ofertas_privadas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ofertas_privadas_codigo_key" ON "ofertas_privadas"("codigo");
CREATE INDEX "ofertas_privadas_companyId_estado_idx" ON "ofertas_privadas"("companyId", "estado");
ALTER TABLE "ofertas_privadas" ADD CONSTRAINT "ofertas_privadas_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ofertas_privadas" ADD CONSTRAINT "ofertas_privadas_creadaPorId_fkey"
    FOREIGN KEY ("creadaPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "oferta_invitados" (
    "id" TEXT NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "reclamadaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "oferta_invitados_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "oferta_invitados_ofertaId_clienteId_key" ON "oferta_invitados"("ofertaId", "clienteId");
CREATE INDEX "oferta_invitados_clienteId_idx" ON "oferta_invitados"("clienteId");
ALTER TABLE "oferta_invitados" ADD CONSTRAINT "oferta_invitados_ofertaId_fkey"
    FOREIGN KEY ("ofertaId") REFERENCES "ofertas_privadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "oferta_invitados" ADD CONSTRAINT "oferta_invitados_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "oferta_usos" (
    "id" TEXT NOT NULL,
    "invitadoId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "registradoPorId" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "oferta_usos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "oferta_usos_invitadoId_createdAt_idx" ON "oferta_usos"("invitadoId", "createdAt");
CREATE INDEX "oferta_usos_companyId_createdAt_idx" ON "oferta_usos"("companyId", "createdAt");
ALTER TABLE "oferta_usos" ADD CONSTRAINT "oferta_usos_invitadoId_fkey"
    FOREIGN KEY ("invitadoId") REFERENCES "oferta_invitados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "oferta_usos" ADD CONSTRAINT "oferta_usos_registradoPorId_fkey"
    FOREIGN KEY ("registradoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
