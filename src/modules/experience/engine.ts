import type { Momento } from '@/modules/engagement/momentos'
import type { BeneficioDisponible } from '@/modules/cliente/queries'

/**
 * MEE · Membego Experience Engine — motor de priorización de experiencias.
 *
 * Decide QUÉ experiencia protagoniza la pantalla y con CUÁNTA energía visual,
 * según el estado real del cliente. Es LÓGICA PURA (sin BD ni efectos): recibe
 * datos que las pantallas ya cargan y devuelve una decisión tipada — así se
 * prueba de forma determinista y la comparten el Home, el popup inteligente y
 * cualquier superficie futura.
 *
 * Escalera de prioridad (CJO §5 — nunca aleatoria):
 *   1. Beneficio POR VENCER  → urgencia ALTA  (que no lo pierda)
 *   2. Beneficio LISTO       → urgencia MEDIA (que lo use hoy)
 *   3. Pago PENDIENTE        → urgencia MEDIA (desbloquear su membresía)
 *   4. Referidos NUEVOS      → urgencia BAJA  (celebrar y re-compartir)
 *   5. null                  → la pantalla sigue con campañas/carruseles
 *
 * Mapa urgencia → pieza visual (MMS): ALTA = FlashPromotion (countdown +
 * barra de tiempo + glow) · MEDIA = PromoBanner hero + Shine · BAJA = tarjeta.
 */

export type Urgencia = 'alta' | 'media' | 'baja'

export interface ExperienciaHero {
  /** Tipo de experiencia elegida (para analíticas y para no repetir). */
  tipo: 'BENEFICIO_VENCE' | 'BENEFICIO_LISTO' | 'PAGO_PENDIENTE' | 'REFERIDOS'
  urgencia: Urgencia
  eyebrow: string
  titulo: string
  descripcion: string
  ctaTexto: string
  ctaHref: string
  /** Deadline ISO: alimenta countdown + barra de tiempo (solo urgencia alta). */
  hasta?: string
  /** Tono del gradiente (tonos de PromoBanner/FlashPromotion). */
  tono: 'hot' | 'brand' | 'premium' | 'celebracion'
}

export interface EntradaExperiencia {
  momentos: Momento[]
  beneficio?: BeneficioDisponible | null
  /** Membresía que necesita acción de pago (PENDIENTE/RECHAZADA), si existe. */
  pagoPendiente?: { membresiaId: string; planNombre: string } | null
}

/** Elige la experiencia protagonista (o null si no hay nada accionable). */
export function elegirExperienciaHero({
  momentos,
  beneficio,
  pagoPendiente,
}: EntradaExperiencia): ExperienciaHero | null {
  // 1 · Por vencer: la única urgencia visual ALTA de la pantalla.
  const vence = momentos.find(
    (m): m is Extract<Momento, { tipo: 'VENCE' }> => m.tipo === 'VENCE'
  )
  if (vence) {
    return {
      tipo: 'BENEFICIO_VENCE',
      urgencia: 'alta',
      eyebrow: '⏰ Por vencer',
      titulo: vence.titulo,
      descripcion: 'Tu beneficio está por expirar. Úsalo antes de que se acabe el tiempo.',
      ctaTexto: 'Usarlo ahora',
      ctaHref: `/cliente/mis-promociones/${vence.compraId}`,
      hasta: vence.expiraEn,
      tono: 'hot',
    }
  }

  // 2 · Listo para usar (dato ya cargado por el Home).
  if (beneficio) {
    const usos =
      beneficio.usosRestantes === beneficio.usosIncluidos
        ? 'listo para estrenar'
        : `te quedan ${beneficio.usosRestantes} uso${beneficio.usosRestantes !== 1 ? 's' : ''}`
    return {
      tipo: 'BENEFICIO_LISTO',
      urgencia: 'media',
      eyebrow: '🎁 Beneficio disponible',
      titulo: beneficio.titulo,
      descripcion: `${beneficio.empresa} · ${usos}`,
      ctaTexto: 'Usar ahora',
      ctaHref: `/cliente/mis-promociones/${beneficio.id}`,
      tono: 'brand',
    }
  }

  // 3 · Pago pendiente: desbloquear su membresía es la acción de mayor valor.
  if (pagoPendiente) {
    return {
      tipo: 'PAGO_PENDIENTE',
      urgencia: 'media',
      eyebrow: '💳 Un paso para activar',
      titulo: `Tu plan ${pagoPendiente.planNombre} te espera`,
      descripcion: 'Completa el pago (transferencia o en sucursal) y actívalo hoy mismo.',
      ctaTexto: 'Completar pago',
      ctaHref: `/membresia/${pagoPendiente.membresiaId}`,
      tono: 'premium',
    }
  }

  // 4 · Referidos nuevos: celebrar y volver a compartir.
  const invita = momentos.find(
    (m): m is Extract<Momento, { tipo: 'INVITA' }> => m.tipo === 'INVITA'
  )
  if (invita && invita.registrados > 0) {
    return {
      tipo: 'REFERIDOS',
      urgencia: 'baja',
      eyebrow: '🎉 ¡Está funcionando!',
      titulo: `${invita.registrados} amigo${invita.registrados !== 1 ? 's' : ''} ya se registró con tu enlace`,
      descripcion: 'Sigue compartiendo y acumula más recompensas.',
      ctaTexto: 'Ver mis recompensas',
      ctaHref: '/cliente/invita-y-gana',
      tono: 'celebracion',
    }
  }

  return null
}
