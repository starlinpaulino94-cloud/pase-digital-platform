/**
 * Fase E7 · Motor de captura para lectores físicos HID (universal).
 *
 * Un lector de QR / código de barras USB o Bluetooth se comporta como un
 * TECLADO (HID Keyboard): "teclea" el contenido del código muy rápido y suele
 * terminar con Enter. Este módulo detecta esas ráfagas de forma agnóstica al
 * fabricante — cualquier lector HID estándar funciona.
 *
 * Es LÓGICA PURA (sin DOM ni timers): recibe pulsaciones con su timestamp y
 * decide cuándo se completó un código y si vino de un lector físico (por la
 * cadencia entre teclas) o de tecleo humano. Así se puede probar de forma
 * determinista y reutilizar en cualquier entorno.
 */

// ── Arquitectura de fuentes de escaneo (extensible: cámara/HID/NFC/RFID) ──────

/**
 * Tipos de dispositivo de captura. La lógica principal (Rule/Validation/
 * Transaction/Action/Receipt Engine) NUNCA depende del origen: toda fuente
 * entrega un `token: string` que sigue exactamente el mismo flujo. Añadir NFC
 * o RFID en el futuro = una nueva fuente que emite el token, sin tocar el flujo.
 */
export type ScanSourceKind = 'camera' | 'hid' | 'nfc' | 'rfid'

export interface ScanResult {
  token: string
  source: ScanSourceKind
  /** Solo HID: true si la cadencia delata un lector físico (no tecleo humano). */
  fromReader?: boolean
}

// ── Detector de ráfagas HID ───────────────────────────────────────────────────

export interface HidBufferOptions {
  /** Longitud mínima del código para aceptarlo (evita teclas sueltas). */
  minLength?: number
  /** Cadencia máx. (ms) entre teclas para considerarlo un LECTOR físico. */
  maxInterKeyMs?: number
  /** Si pasa más de este tiempo sin teclas, la secualencia previa se descarta. */
  resetAfterMs?: number
}

const DEFAULTS: Required<HidBufferOptions> = {
  minLength: 3,
  // Los lectores HID envían teclas en ~2–30 ms; un humano rara vez baja de 60 ms.
  maxInterKeyMs: 45,
  // Si el operador teclea a mano y hace una pausa, se reinicia la secuencia.
  resetAfterMs: 500,
}

/** ¿La tecla es un carácter imprimible que forma parte del código? */
export function esCaracterImprimible(key: string): boolean {
  // Los eventos de teclado dan `key` = el carácter para imprimibles, o un
  // nombre ("Enter", "Shift", "Tab"…) para teclas especiales.
  return key.length === 1 && key !== '\n' && key !== '\r'
}

/**
 * Acumulador de una secuencia de teclas. `push` devuelve el código cuando
 * llega Enter (o el terminador) con una secuencia válida; si no, `null`.
 * Nunca lanza. No usa relojes internos: el llamador pasa `now`.
 */
export class HidScanBuffer {
  private chars: string[] = []
  private times: number[] = []
  private readonly opts: Required<HidBufferOptions>

  constructor(options: HidBufferOptions = {}) {
    this.opts = { ...DEFAULTS, ...options }
  }

  /** Longitud actual de la secuencia en curso (para UI de "recibiendo…"). */
  get length(): number {
    return this.chars.length
  }

  reset(): void {
    this.chars = []
    this.times = []
  }

  /**
   * Procesa una pulsación. Devuelve el resultado solo cuando la secuencia se
   * cierra con Enter/Tab y cumple la longitud mínima.
   */
  push(key: string, now: number): { code: string; fromReader: boolean } | null {
    // Terminadores típicos de un lector: Enter (por defecto) o Tab (algunos).
    if (key === 'Enter' || key === 'Tab') {
      return this.flush(now)
    }
    if (!esCaracterImprimible(key)) return null // Shift, Alt, flechas… se ignoran

    // Pausa larga desde la última tecla → era otra secuencia (o ruido): reinicia.
    const last = this.times[this.times.length - 1]
    if (last !== undefined && now - last > this.opts.resetAfterMs) {
      this.reset()
    }
    this.chars.push(key)
    this.times.push(now)
    return null
  }

  /** Cierra la secuencia actual y evalúa si es un código válido. */
  private flush(now: number): { code: string; fromReader: boolean } | null {
    const code = this.chars.join('')
    const intervals = this.intervals()
    this.reset()
    if (code.length < this.opts.minLength) return null
    return { code, fromReader: this.pareceLector(intervals, now) }
  }

  private intervals(): number[] {
    const out: number[] = []
    for (let i = 1; i < this.times.length; i++) out.push(this.times[i] - this.times[i - 1])
    return out
  }

  /**
   * Heurística de "lector físico vs tecleo humano": si la MEDIANA de los
   * intervalos entre teclas es muy baja, fue una ráfaga de un lector. Con 0–1
   * caracteres no hay intervalos → se asume tecleo (no reader) por prudencia.
   */
  private pareceLector(intervals: number[], _now: number): boolean {
    if (intervals.length === 0) return false
    const orden = [...intervals].sort((a, b) => a - b)
    const mid = Math.floor(orden.length / 2)
    const mediana = orden.length % 2 ? orden[mid] : (orden[mid - 1] + orden[mid]) / 2
    return mediana <= this.opts.maxInterKeyMs
  }
}
