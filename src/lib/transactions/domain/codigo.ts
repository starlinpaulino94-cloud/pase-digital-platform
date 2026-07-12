/**
 * Formato del Transaction ID (Fase E4): TX-YYYYMMDD-NNNNNN.
 * Secuencial por día (contador atómico en BD), nunca se reutiliza.
 */

const TX_RE = /^TX-(\d{8})-(\d{6,})$/

/** "20260711" para la fecha dada en una zona horaria IANA. */
export function fechaScope(date: Date, timeZone = 'America/Santo_Domingo'): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  return parts.replaceAll('-', '')
}

export function formatTransactionCodigo(fecha: string, seq: number): string {
  return `TX-${fecha}-${String(seq).padStart(6, '0')}`
}

export function isTransactionCodigo(value: string): boolean {
  return TX_RE.test(value.trim().toUpperCase())
}

export function normalizeTransactionCodigo(value: string): string {
  return value.trim().toUpperCase()
}

/** Número de ticket legible por empresa: TCK-000123. */
export function formatTicketNumero(seq: number): string {
  return `TCK-${String(seq).padStart(6, '0')}`
}
