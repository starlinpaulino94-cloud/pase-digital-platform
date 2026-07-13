/**
 * Fase E7 · Pruebas del motor de captura HID (lector físico QR / código de
 * barras). Lógica pura, sin DOM: se simulan pulsaciones con su timestamp.
 * Ejecutar: npm test
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HidScanBuffer, esCaracterImprimible } from '../src/lib/scanner/hid'

/** Simula un lector físico: teclea cada carácter con cadencia `interval` ms y
 *  termina con Enter. Devuelve el resultado del último push (el de Enter). */
function escanear(buffer: HidScanBuffer, code: string, interval: number, t0 = 1000) {
  let t = t0
  for (const ch of code) {
    buffer.push(ch, t)
    t += interval
  }
  return buffer.push('Enter', t)
}

test('caracteres imprimibles vs teclas especiales', () => {
  assert.equal(esCaracterImprimible('A'), true)
  assert.equal(esCaracterImprimible('7'), true)
  assert.equal(esCaracterImprimible('-'), true)
  assert.equal(esCaracterImprimible('Enter'), false)
  assert.equal(esCaracterImprimible('Shift'), false)
  assert.equal(esCaracterImprimible('ArrowUp'), false)
})

test('ráfaga rápida (lector físico) → detecta código y fromReader=true', () => {
  const b = new HidScanBuffer()
  const res = escanear(b, 'MBGO-AB12CD34', 8) // 8ms entre teclas = lector
  assert.ok(res)
  assert.equal(res!.code, 'MBGO-AB12CD34')
  assert.equal(res!.fromReader, true)
})

test('código TX- de un ticket leído por lector', () => {
  const b = new HidScanBuffer()
  const res = escanear(b, 'TX-20260711-000123', 10)
  assert.equal(res!.code, 'TX-20260711-000123')
  assert.equal(res!.fromReader, true)
})

test('tecleo humano lento → código válido pero fromReader=false', () => {
  const b = new HidScanBuffer()
  const res = escanear(b, 'ABC123', 180) // 180ms entre teclas = humano
  assert.ok(res)
  assert.equal(res!.code, 'ABC123')
  assert.equal(res!.fromReader, false)
})

test('Enter sin caracteres suficientes → null (no dispara)', () => {
  const b = new HidScanBuffer()
  assert.equal(b.push('A', 1000), null)
  assert.equal(b.push('Enter', 1005), null) // 1 char < minLength 3
})

test('teclas especiales intermedias se ignoran, no rompen el código', () => {
  const b = new HidScanBuffer()
  let t = 1000
  for (const k of ['A', 'Shift', 'B', 'ArrowLeft', 'C', 'D']) {
    b.push(k, t); t += 8
  }
  const res = b.push('Enter', t)
  assert.equal(res!.code, 'ABCD') // Shift/ArrowLeft no entran al código
})

test('pausa larga reinicia la secuencia (dos escaneos distintos)', () => {
  const b = new HidScanBuffer()
  b.push('X', 1000)
  b.push('Y', 1008)
  // Pausa > resetAfterMs (500ms): lo anterior se descarta.
  const res = escanear(b, 'NUEVO99', 8, 5000)
  assert.equal(res!.code, 'NUEVO99') // sin 'XY' pegado delante
})

test('Tab también cierra la secuencia (algunos lectores lo usan)', () => {
  const b = new HidScanBuffer()
  let t = 1000
  for (const ch of 'CODE42') { b.push(ch, t); t += 6 }
  const res = b.push('Tab', t)
  assert.equal(res!.code, 'CODE42')
  assert.equal(res!.fromReader, true)
})

test('el buffer se vacía tras entregar un código (reutilizable)', () => {
  const b = new HidScanBuffer()
  escanear(b, 'PRIMERO', 8)
  assert.equal(b.length, 0)
  const res = escanear(b, 'SEGUNDO', 8, 9000)
  assert.equal(res!.code, 'SEGUNDO')
})

test('umbral de cadencia configurable', () => {
  const estricto = new HidScanBuffer({ maxInterKeyMs: 20 })
  // 30ms > 20ms → no se considera lector
  assert.equal(escanear(estricto, 'HELLO', 30)!.fromReader, false)
  // 10ms < 20ms → lector
  assert.equal(escanear(estricto, 'HELLO', 10)!.fromReader, true)
})
