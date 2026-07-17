import type { Momento } from '@/modules/engagement/momentos'
import type { BeneficioDisponible } from '@/modules/cliente/queries'
import type { CampanaViva } from '@/modules/engagement/campanas'

/**
 * MEE · Membego Experience Engine — motor de priorización de experiencias.
 *
 * Decide QUÉ experiencia protagoniza la pantalla y con CUÁNTA energía visual,
 * según el estado real del cliente. Es LÓGICA PURA (sin BD ni efectos): recibe
 * datos que las pantallas ya cargan y devuelve una lista ordenada — así se
 * prueba de forma determinista y la comparten el Home, el popup inteligente y
 * cualquier superficie futura. El Home usa el primer candidato como héroe y
 * el segundo (si existe) como aviso del popup, así nunca se duplican.
 *
 * Escalera de prioridad (CJO §5 — nunca aleatoria):
 *   1. Beneficio POR VENCER  → urgencia ALTA  (que no lo pierda)
 *   2. Beneficio LISTO       → urgencia MEDIA (que lo use hoy)
 *   3. Pago PENDIENTE        → urgencia MEDIA (desbloquear su membresía)
 *   4. Campaña DESTACADA     → urgencia MEDIA (lo prioriza el negocio)
 *   5. Referidos NUEVOS      → urgencia BAJA  (celebrar y re-compartir)
 *
 * Mapa urgencia → pieza visual (MMS): ALTA = FlashPromotion (countdown +
 * barra de tiempo + glow) · MEDIA = PromoBanner hero + Shine · BAJA = tarjeta.
 */

export type Urgencia = 'alta' | 'media' | 'baja'

export interface ExperienciaHero {
  /** Tipo de experiencia elegida (para analíticas y para no repetir). */
  tipo: 'BENEFICIO_VENCE' | 'BENEFICIO_LISTO' | 'PAGO_PENDIENTE' | 'CAMPANA' | 'REFERIDOS'
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
  /**
   * Branding propio de una campaña (solo cuando tipo === 'CAMPANA'): una
   * campaña de marketing conserva sus colores/imagen configurados por el
   * admin en vez de usar los tonos fijos del sistema.
   */
  campana?: {
    colorPrimario: string | null
    colorSecundario: string | null
    imagenUrl: string | null
    bannerUrl: string | null
    cuposRestantes: number | null
    reclamados: number
  }
}

export interface EntradaExperiencia {
  momentos: Momento[]
  beneficio?: BeneficioDisponible | null
  /** Membresía que necesita acción de pago (PENDIENTE/RECHAZADA), si existe. */
  pagoPendiente?: { membresiaId: string; planNombre: string } | null
  /** Campañas de marketing vivas de la empresa (solo participan las destacadas). */
  campanas?: CampanaViva[]
}

/** 1 · Por vencer: la única urgencia visual ALTA de la pantalla. */
function candidatoVence(momentos: Momento[]): ExperienciaHero | null {
  const vence = momentos.find(
    (m): m is Extract<Momento, { tipo: 'VENCE' }> => m.tipo === 'VENCE'
  )
  if (!vence) return null
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

/** 2 · Listo para usar (dato ya cargado por el Home). */
function candidatoListo(beneficio?: BeneficioDisponible | null): ExperienciaHero | null {
  if (!beneficio) return null
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

/** 3 · Pago pendiente: desbloquear su membresía es la acción de mayor valor. */
function candidatoPagoPendiente(
  pagoPendiente?: { membresiaId: string; planNombre: string } | null
): ExperienciaHero | null {
  if (!pagoPendiente) return null
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

/** 4 · Campaña destacada: la prioriza el negocio, pero nunca sobre lo personal. */
function candidatoCampana(campanas: CampanaViva[]): ExperienciaHero | null {
  const camp = campanas.find((c) => c.destacada)
  if (!camp) return null
  return {
    tipo: 'CAMPANA',
    urgencia: 'media',
    eyebrow: '🔥 Solo por tiempo limitado',
    titulo: camp.titulo,
    descripcion: camp.descripcion,
    ctaTexto: camp.ctaTexto || 'Aprovecha ahora',
    ctaHref: camp.ctaHref || '/cliente/promociones',
    hasta: camp.terminaEn,
    tono: 'hot',
    campana: {
      colorPrimario: camp.colorPrimario,
      colorSecundario: camp.colorSecundario,
      imagenUrl: camp.imagenUrl,
      bannerUrl: camp.bannerUrl,
      cuposRestantes: camp.cuposRestantes,
      reclamados: camp.reclamados,
    },
  }
}

/** 5 · Referidos nuevos: celebrar y volver a compartir. */
function candidatoReferidos(momentos: Momento[]): ExperienciaHero | null {
  const invita = momentos.find(
    (m): m is Extract<Momento, { tipo: 'INVITA' }> => m.tipo === 'INVITA'
  )
  if (!invita || invita.registrados === 0) return null
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

/**
 * Lista completa de experiencias candidatas, en orden de prioridad. El Home
 * usa `lista[0]` como héroe de la pantalla y `lista[1]` (si existe) como
 * aviso del popup inteligente — así ambas superficies comparten UNA sola
 * decisión y nunca muestran lo mismo dos veces.
 */
export function elegirExperiencias({
  momentos,
  beneficio,
  pagoPendiente,
  campanas = [],
}: EntradaExperiencia): ExperienciaHero[] {
  return [
    candidatoVence(momentos),
    candidatoListo(beneficio),
    candidatoPagoPendiente(pagoPendiente),
    candidatoCampana(campanas),
    candidatoReferidos(momentos),
  ].filter((c): c is ExperienciaHero => c !== null)
}

/** Elige la experiencia protagonista (o null si no hay nada accionable). */
export function elegirExperienciaHero(entrada: EntradaExperiencia): ExperienciaHero | null {
  return elegirExperiencias(entrada)[0] ?? null
}
