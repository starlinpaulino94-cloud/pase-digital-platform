-- O-13: cupón/beneficio de bienvenida por empresa (la empresa financia su
-- propio beneficio; opt-in, apagado por defecto). Se aplica una sola vez, en
-- la primera activación de membresía del cliente en esa empresa.
ALTER TABLE "companies" ADD COLUMN "bienvenidaActiva" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "companies" ADD COLUMN "bienvenidaTipo" TEXT NOT NULL DEFAULT 'PORCENTAJE';
ALTER TABLE "companies" ADD COLUMN "bienvenidaValor" DECIMAL(10,2);

-- Descuento congelado al momento de solicitar el plan (auditable).
ALTER TABLE "memberships" ADD COLUMN "descuentoBienvenida" DECIMAL(10,2);
