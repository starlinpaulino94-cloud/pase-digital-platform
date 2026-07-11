/**
 * Receipt Engine (Fase E4) — API pública.
 *
 * Construye comprobantes como DOCUMENTOS por bloques a partir de la
 * transacción + la plantilla de la empresa (personalizable sin código), y los
 * entrega a cualquier salida: pantalla/window.print hoy, ESC/POS 58/80 mm vía
 * transports (USB/Serial/BT/Ethernet/WiFi), y PDF/email/WhatsApp en el futuro.
 */

export {
  PAPER_COLS,
  DEFAULT_BLOCK_ORDER,
} from './domain/types'
export type {
  ReceiptDoc,
  ReceiptLine,
  ReceiptAlign,
  ReceiptBlockId,
  ReceiptTemplateConfig,
  ReceiptEmpresaInfo,
  ReceiptTransaccionInfo,
  BuildReceiptInput,
} from './domain/types'
export { buildReceiptDoc, DEFAULT_RECEIPT_TEMPLATE } from './domain/builder'
export { encodeEscpos } from './infrastructure/escpos'
export {
  registerTransport,
  getTransport,
  listTransports,
  createWebUsbTransport,
} from './infrastructure/transport'
export type { PrinterTransport, TransportKind } from './infrastructure/transport'
