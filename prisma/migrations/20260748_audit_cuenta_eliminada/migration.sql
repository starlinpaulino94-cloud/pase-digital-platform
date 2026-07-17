-- Auditoría de eliminación de cuentas (clientes y usuarios) por el superadmin.
-- La purga conserva las transacciones (facturas) con el cliente en NULL; este
-- valor deja el rastro de quién eliminó qué y cuándo.
ALTER TYPE "AuditAccion" ADD VALUE IF NOT EXISTS 'CUENTA_ELIMINADA';
