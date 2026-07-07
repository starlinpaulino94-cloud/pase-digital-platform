-- Centro global MembeGo (idempotente, para el SQL Editor de Supabase):
-- nuevos tipos de evento para referidos entre empresas de la plataforma.
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'REGISTRO_GLOBAL';
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'MEMBRESIA_GLOBAL';
