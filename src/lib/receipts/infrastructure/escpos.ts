/**
 * Encoder ESC/POS (Receipt Engine, Fase E4). ReceiptDoc → bytes estándar
 * ESC/POS, sin comandos propietarios de ningún fabricante: funciona con
 * cualquier térmica compatible (58/80 mm), p. ej. 2Connect POS80-01 V8.
 * El transporte (USB/Ethernet/BT/Serial/WiFi) es un puerto aparte.
 */

import { PAPER_COLS, type ReceiptDoc, type ReceiptLine } from '../domain/types'

const ESC = 0x1b
const GS = 0x1d

function bytes(...xs: number[]): number[] {
  return xs
}

/** Texto → CP-437-ish seguro (ASCII + reemplazo de acentos comunes). */
function encodeText(text: string): number[] {
  const map: Record<string, string> = {
    á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n', ü: 'u',
    Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ñ: 'N', Ü: 'U',
    '•': '*', '—': '-', '·': '-', '«': '"', '»': '"',
  }
  const ascii = text.replace(/[^\x20-\x7E]/g, (ch) => map[ch] ?? '?')
  return Array.from(ascii, (c) => c.charCodeAt(0))
}

function padPair(label: string, value: string, cols: number): string {
  const l = `${label}:`
  const space = Math.max(1, cols - l.length - value.length)
  return l + ' '.repeat(space) + value
}

const ALIGN = { left: 0, center: 1, right: 2 } as const

/**
 * Codifica el documento a comandos ESC/POS estándar:
 * ESC @ (init) · ESC a (align) · ESC E (bold) · GS ! (size) ·
 * GS ( k (QR nativo) · GS V (corte parcial).
 */
export function encodeEscpos(doc: ReceiptDoc): Uint8Array {
  const cols = PAPER_COLS[doc.paperWidthMm]
  const out: number[] = [ESC, 0x40] // init

  const align = (a: keyof typeof ALIGN) => out.push(ESC, 0x61, ALIGN[a])
  const bold = (on: boolean) => out.push(ESC, 0x45, on ? 1 : 0)
  const size = (double: boolean) => out.push(GS, 0x21, double ? 0x11 : 0x00)
  const newline = () => out.push(0x0a)

  const emit = (line: ReceiptLine) => {
    switch (line.kind) {
      case 'text': {
        align(line.align ?? 'left')
        bold(line.bold ?? false)
        size(line.size === 'double')
        out.push(...encodeText(line.text))
        newline()
        size(false)
        bold(false)
        break
      }
      case 'pair': {
        align('left')
        bold(line.boldValue ?? false)
        out.push(...encodeText(padPair(line.label, line.value, cols)))
        newline()
        bold(false)
        break
      }
      case 'separator': {
        align('left')
        out.push(...encodeText((line.char ?? '-').repeat(cols)))
        newline()
        break
      }
      case 'qr': {
        // QR nativo ESC/POS (modelo 2, tamaño de módulo, corrección M).
        const data = encodeText(line.data)
        const len = data.length + 3
        const pL = len % 256
        const pH = Math.floor(len / 256)
        align('center')
        out.push(GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0x00) // modelo 2
        out.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, doc.paperWidthMm === 58 ? 5 : 7) // módulo
        out.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, 0x31) // corrección M
        out.push(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...data) // datos
        out.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30) // imprimir
        newline()
        if (line.caption) {
          out.push(...encodeText(line.caption))
          newline()
        }
        align('left')
        break
      }
      case 'logo':
        // Impresión de logo raster (GS v 0) requiere rasterizar la imagen en
        // el cliente del driver; el encoder base lo omite (queda en pantalla
        // y PDF). Los drivers pueden pre-procesarlo.
        break
      case 'feed':
        for (let i = 0; i < (line.lines ?? 1); i++) newline()
        break
    }
  }

  for (const line of doc.lines) emit(line)

  out.push(...bytes(GS, 0x56, 0x42, 0x03)) // corte parcial con feed
  return Uint8Array.from(out)
}
