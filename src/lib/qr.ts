import QRCode from 'qrcode'

/** Colores de marca para todos los QR de la plataforma. */
const QR_COLOR = { dark: '#0f172a', light: '#ffffff' } as const

/**
 * Data URL de un QR con el estilo de marca (fondo blanco, módulos oscuros)
 * a 2x para nitidez en pantallas retina.
 */
export function toQrDataUrl(token: string, size: number): Promise<string> {
  return QRCode.toDataURL(token, {
    width: size * 2,
    margin: 1,
    color: QR_COLOR,
  })
}
