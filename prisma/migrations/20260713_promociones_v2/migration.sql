-- F4.2: Promociones 2.0 — visibilidad, stock de canjes, prioridad y archivo.
ALTER TABLE "promociones" ADD COLUMN "visibilidad" TEXT NOT NULL DEFAULT 'publica';
ALTER TABLE "promociones" ADD COLUMN "maxCanjes" INTEGER;
ALTER TABLE "promociones" ADD COLUMN "canjes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "promociones" ADD COLUMN "prioridad" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "promociones" ADD COLUMN "archivada" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "promociones_visibilidad_archivada_idx" ON "promociones"("visibilidad", "archivada");
