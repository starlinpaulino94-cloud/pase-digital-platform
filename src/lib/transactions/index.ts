/**
 * Transaction Engine (Fase E4) — API pública.
 *
 * Registro oficial de toda operación de MembeGo: ID único TX-YYYYMMDD-NNNNNN,
 * ticket secuencial por empresa, máquina de estados con historial, auditoría
 * técnica, snapshot congelado y soporte de reimpresión auditada. Universal:
 * sin lógica de industria; reutiliza el flujo validador (Rule Engine) y los
 * efectos del Action Engine — nunca los duplica.
 */

export type {
  TransactionTipo,
  TransactionEstado,
  TransactionRecord,
  TransactionSnapshot,
  TransactionAuditoria,
  TransactionTransicionRecord,
} from './domain/types'
export {
  TRANSACTION_TRANSITIONS,
  canTransition,
  validateTransition,
  isTerminal,
  HAPPY_PATH,
} from './domain/lifecycle'
export {
  fechaScope,
  formatTransactionCodigo,
  formatTicketNumero,
  isTransactionCodigo,
  normalizeTransactionCodigo,
} from './domain/codigo'
export {
  nextCounter,
  crearTransaccionAplicada,
  crearTransaccionError,
  transicionar,
  getByCodigo,
  getById,
  getByQrUsado,
  getByVisitId,
  listByCliente,
  listByCompany,
  registrarImpresionRecibo,
} from './application/transaction-service'
export type {
  Db,
  CrearTransaccionInput,
  TransactionDetalle,
  TransitionInput,
} from './application/transaction-service'
export { getTransactionAnalytics } from './application/analytics'
export type { TransactionAnalytics } from './application/analytics'
