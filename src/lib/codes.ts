/**
 * Generador de códigos cortos legibles, compartido por growth links,
 * referencias de pago presencial y códigos de referido.
 */

// Alfabeto sin caracteres confundibles (0/O, 1/I/L).
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Código corto aleatorio, legible y sin ambigüedades. */
export function generarCodigo(len = 6): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += ALFABETO[Math.floor(Math.random() * ALFABETO.length)]
  }
  return out
}
