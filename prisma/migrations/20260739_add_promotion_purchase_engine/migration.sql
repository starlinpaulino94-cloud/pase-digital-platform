-- CreateEnum
CREATE TYPE "ProductoComercialTipo" AS ENUM ('PROMOCION', 'MEMBRESIA');

-- CreateEnum
CREATE TYPE "CompraEstado" AS ENUM ('SOLICITADA', 'PENDIENTE_PAGO', 'EN_VALIDACION', 'APROBADA', 'ACTIVA', 'RECHAZADA', 'CONSUMIDA', 'EXPIRADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "promociones" ADD COLUMN     "beneficioVigenciaDias" INTEGER,
ADD COLUMN     "beneficioVigenciaHasta" TIMESTAMP(3),
ADD COLUMN     "diasPermitidos" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "esComprable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "horaDesde" TEXT,
ADD COLUMN     "horaHasta" TEXT,
ADD COLUMN     "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "precio" DECIMAL(10,2),
ADD COLUMN     "usosPorCompra" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "qr_tokens" ADD COLUMN     "compraId" TEXT,
ALTER COLUMN "membresiaId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "producto_compras" (
    "id" TEXT NOT NULL,
    "tipo" "ProductoComercialTipo" NOT NULL DEFAULT 'PROMOCION',
    "estado" "CompraEstado" NOT NULL DEFAULT 'SOLICITADA',
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "promocionId" TEXT,
    "metodoPagoId" TEXT,
    "precioCongelado" DECIMAL(10,2),
    "montoPagado" DECIMAL(10,2),
    "pagoConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "comprobanteUrl" TEXT,
    "comprobanteNota" TEXT,
    "transferenciaFecha" TIMESTAMP(3),
    "rechazadoReason" TEXT,
    "adminNota" TEXT,
    "aprobadaPorId" TEXT,
    "usosIncluidos" INTEGER NOT NULL DEFAULT 1,
    "usosRestantes" INTEGER NOT NULL DEFAULT 0,
    "fechaActivacion" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "consumidaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producto_compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_compra_transiciones" (
    "id" TEXT NOT NULL,
    "compraId" TEXT NOT NULL,
    "desde" "CompraEstado",
    "hacia" "CompraEstado" NOT NULL,
    "motivo" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_compra_transiciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "producto_compras_companyId_estado_idx" ON "producto_compras"("companyId", "estado");

-- CreateIndex
CREATE INDEX "producto_compras_clienteId_estado_idx" ON "producto_compras"("clienteId", "estado");

-- CreateIndex
CREATE INDEX "producto_compras_promocionId_estado_idx" ON "producto_compras"("promocionId", "estado");

-- CreateIndex
CREATE INDEX "producto_compras_companyId_createdAt_idx" ON "producto_compras"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "producto_compra_transiciones_compraId_createdAt_idx" ON "producto_compra_transiciones"("compraId", "createdAt");

-- CreateIndex
CREATE INDEX "qr_tokens_compraId_idx" ON "qr_tokens"("compraId");

-- AddForeignKey
ALTER TABLE "producto_compras" ADD CONSTRAINT "producto_compras_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_compras" ADD CONSTRAINT "producto_compras_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_compras" ADD CONSTRAINT "producto_compras_promocionId_fkey" FOREIGN KEY ("promocionId") REFERENCES "promociones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_compras" ADD CONSTRAINT "producto_compras_metodoPagoId_fkey" FOREIGN KEY ("metodoPagoId") REFERENCES "metodos_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_compras" ADD CONSTRAINT "producto_compras_aprobadaPorId_fkey" FOREIGN KEY ("aprobadaPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_compra_transiciones" ADD CONSTRAINT "producto_compra_transiciones_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "producto_compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_compra_transiciones" ADD CONSTRAINT "producto_compra_transiciones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "producto_compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

