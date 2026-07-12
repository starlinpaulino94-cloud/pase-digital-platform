-- CreateEnum
CREATE TYPE "BeneficioTipo" AS ENUM ('PROMOTION', 'MEMBERSHIP', 'COUPON', 'VOUCHER', 'GIFT', 'EVENT');

-- AlterTable
ALTER TABLE "promociones" ADD COLUMN     "beneficioTipo" "BeneficioTipo" NOT NULL DEFAULT 'PROMOTION';
