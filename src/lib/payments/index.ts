/**
 * Fase E5 · Puerto de pagos desacoplado.
 *
 * El flujo de compra (membresías y promociones) NO conoce el método de pago
 * concreto: pide un `PaymentProvider` y actúa según el `PaymentIntent` que
 * este devuelva. Agregar Stripe/Azul/CardNET/PayPal/Apple Pay/Google Pay =
 * registrar un provider nuevo; el flujo principal no cambia.
 *
 * Modos de intent:
 * - 'manual_comprobante': pago fuera de línea (transferencia). El cliente ve
 *   instrucciones/cuentas y sube un comprobante; un admin lo valida y el
 *   llamador activa el producto (activarCompraPromocion / activarMembresia).
 * - 'redirect': pasarela con checkout externo (futuro). El provider devuelve
 *   la URL y la activación llega por webhook → mismo punto de activación.
 */

export type PaymentProviderKind =
  | 'TRANSFERENCIA'
  | 'STRIPE'
  | 'AZUL'
  | 'CARDNET'
  | 'PAYPAL'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY'

export interface PaymentContext {
  companyId: string
  clienteId: string
  /** Referencia de la compra (ProductoCompra.id o Membership.id). */
  referenciaId: string
  monto: number
  descripcion: string
}

export type PaymentIntent =
  | {
      modo: 'manual_comprobante'
      /** Qué debe hacer el cliente (se muestran además las cuentas MetodoPago). */
      instrucciones: string
      requiereComprobante: true
    }
  | {
      modo: 'redirect'
      url: string
      requiereComprobante: false
    }

export interface PaymentProvider {
  readonly kind: PaymentProviderKind
  /** ¿Está disponible/configurado para esta empresa? */
  isAvailable(companyId: string): boolean | Promise<boolean>
  /** Inicia el pago y describe el siguiente paso del cliente. */
  iniciar(ctx: PaymentContext): PaymentIntent | Promise<PaymentIntent>
}

const registry = new Map<PaymentProviderKind, PaymentProvider>()

export function registerPaymentProvider(provider: PaymentProvider) {
  registry.set(provider.kind, provider)
}

export function getPaymentProvider(kind: PaymentProviderKind): PaymentProvider | null {
  return registry.get(kind) ?? null
}

export function listPaymentProviders(): PaymentProviderKind[] {
  return Array.from(registry.keys())
}

// ── Provider inicial: transferencia bancaria (manual) ────────────────────────

export const transferenciaProvider: PaymentProvider = {
  kind: 'TRANSFERENCIA',
  // Disponible siempre: las cuentas concretas (MetodoPago) las lista la UI.
  isAvailable() {
    return true
  },
  iniciar(ctx: PaymentContext): PaymentIntent {
    return {
      modo: 'manual_comprobante',
      requiereComprobante: true,
      instrucciones:
        `Transfiere ${ctx.monto > 0 ? `el monto de tu compra` : 'el monto indicado'} a una de las ` +
        'cuentas de la empresa y sube el comprobante con la fecha y hora de la transferencia. ' +
        'Un administrador validará tu pago para activar tu compra.',
    }
  },
}

registerPaymentProvider(transferenciaProvider)
