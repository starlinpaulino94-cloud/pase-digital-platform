-- Módulo de Citas: agenda por empresa con límite por turno (hora) y por día.

-- Estados de la cita.
CREATE TYPE "CitaEstado" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO');

-- Notificaciones del módulo.
ALTER TYPE "NotifTipo" ADD VALUE IF NOT EXISTS 'CITA_NUEVA';
ALTER TYPE "NotifTipo" ADD VALUE IF NOT EXISTS 'CITA_CONFIRMADA';
ALTER TYPE "NotifTipo" ADD VALUE IF NOT EXISTS 'CITA_CANCELADA';

-- Configuración de la agenda (una por empresa).
CREATE TABLE "agenda_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT false,
    "duracionMin" INTEGER NOT NULL DEFAULT 30,
    "maxPorSlot" INTEGER NOT NULL DEFAULT 1,
    "maxPorDia" INTEGER NOT NULL DEFAULT 0,
    "anticipacionHoras" INTEGER NOT NULL DEFAULT 1,
    "ventanaDias" INTEGER NOT NULL DEFAULT 14,
    "autoConfirmar" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "horarios" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agenda_configs_companyId_key" ON "agenda_configs"("companyId");

ALTER TABLE "agenda_configs" ADD CONSTRAINT "agenda_configs_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Citas.
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "sucursalId" TEXT,
    "vehiculoId" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "duracionMin" INTEGER NOT NULL,
    "servicio" TEXT,
    "notaCliente" TEXT,
    "notaInterna" TEXT,
    "estado" "CitaEstado" NOT NULL DEFAULT 'CONFIRMADA',
    "canceladaPor" TEXT,
    "motivoCancelacion" TEXT,
    "atendidaPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "citas_companyId_inicio_idx" ON "citas"("companyId", "inicio");
CREATE INDEX "citas_clienteId_inicio_idx" ON "citas"("clienteId", "inicio");

ALTER TABLE "citas" ADD CONSTRAINT "citas_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "citas" ADD CONSTRAINT "citas_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "citas" ADD CONSTRAINT "citas_sucursalId_fkey"
    FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "citas" ADD CONSTRAINT "citas_vehiculoId_fkey"
    FOREIGN KEY ("vehiculoId") REFERENCES "vehiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "citas" ADD CONSTRAINT "citas_atendidaPorId_fkey"
    FOREIGN KEY ("atendidaPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
