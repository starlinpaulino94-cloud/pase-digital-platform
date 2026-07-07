-- Centro global MembeGo: eventos de referido hacia OTRAS empresas de la
-- plataforma. Aditivo e idempotente.
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'REGISTRO_GLOBAL';
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'MEMBRESIA_GLOBAL';
