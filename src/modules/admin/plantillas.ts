/**
 * Fase E3 — Adaptador de plantillas para el panel de empresa.
 *
 * Compone las tarjetas de la sección "Plantillas" de cada módulo (Promociones,
 * Planes) y traduce una plantilla de la Business Strategy Library a un PREFILL
 * del formulario del módulo. La empresa nunca ve estrategias: solo plantillas
 * listas para usar. Al usar una plantilla se COPIA su configuración al
 * formulario (nuevo recurso propio, editable); la plantilla original nunca
 * cambia.
 *
 * La herencia plantilla→estrategia (strategyId/version) vive en el Business
 * Strategy Core (`TemplateMetadata`) y es de uso interno del sistema.
 */

import {
  CARWASH_PROMOTION_TEMPLATES,
  type PromotionTemplate,
  type BenefitSpec,
} from '@/lib/promotions'
import { CARWASH_PROMOTION_STRATEGIES } from '@/lib/promotions/templates/carwash-strategies'
import {
  CARWASH_MEMBERSHIP_TEMPLATES,
  type MembershipTemplate,
  type MembershipPeriodicity,
} from '@/lib/membership'
import { CARWASH_MEMBERSHIP_STRATEGIES } from '@/lib/membership/templates/carwash-strategies'
import type { PromoTipo } from '@/lib/promociones'

// ── Etiquetas legibles ────────────────────────────────────────────────────────

const SEGMENT_LABEL: Record<string, string> = {
  nuevo: 'Clientes nuevos',
  frecuente: 'Clientes frecuentes',
  vip: 'Clientes VIP',
  inactivo: 'Clientes inactivos',
  miembro: 'Miembros',
  alto_valor: 'Clientes de alto valor',
  convertido: 'Clientes recién convertidos',
  todos: 'Todos los clientes',
}

const AUDIENCE_LABEL: Record<string, string> = {
  individual: 'Individuales',
  familias: 'Familias',
  empresas: 'Empresas',
  flotas: 'Flotas',
  frecuentes: 'Clientes frecuentes',
  vip: 'Clientes VIP',
  nuevos: 'Clientes nuevos',
}

const PERIODICITY_LABEL: Record<MembershipPeriodicity, string> = {
  NONE: 'Sin periodicidad',
  ONE_TIME: 'Pago único',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  SEASONAL: 'Por temporada',
}

/** "lavado_premium" → "Lavado premium". */
function pretty(text: string): string {
  const s = text.replace(/_/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function benefitLabel(b: BenefitSpec): string {
  switch (b.type) {
    case 'porcentaje':
      return `${b.value ?? 0}% de descuento${b.service ? ` en ${pretty(b.service)}` : ''}`
    case 'valor_fijo':
      return `RD$${b.value ?? 0} de descuento${b.service ? ` en ${pretty(b.service)}` : ''}`
    case 'servicio_gratis':
      return `Gratis: ${pretty(b.service ?? 'servicio')}`
    case 'upgrade':
      return `Upgrade a ${pretty(b.service ?? 'servicio superior')}`
    case 'puntos':
      return `${b.value ?? 0} puntos de recompensa`
    case 'credito':
      return `RD$${b.value ?? 0} de crédito`
  }
}

// ── Promociones ───────────────────────────────────────────────────────────────

/** Tarjeta de plantilla de promoción para la galería del panel. */
export interface PromoPlantillaCard {
  readonly key: string
  readonly code: string
  readonly nombre: string
  readonly descripcion: string
  readonly categoria: string
  readonly industria: string
  readonly dificultad: 'baja' | 'media' | 'alta'
  readonly objetivo: string
  readonly resultadoEsperado: string
  readonly beneficio: string
  readonly recomendadoPara: string
  readonly duracionRecomendada: string | null
  readonly motores: readonly string[]
  readonly automatizaciones: readonly string[]
  readonly kpis: readonly string[]
}

function strategyForPromoTemplate(key: string) {
  return CARWASH_PROMOTION_STRATEGIES.find((s) => s.variantKeys.includes(key)) ?? null
}

function toPromoCard(t: PromotionTemplate): PromoPlantillaCard {
  const strategy = strategyForPromoTemplate(t.key)
  return {
    key: t.key,
    code: t.code,
    nombre: t.name,
    descripcion: t.description,
    categoria: t.category,
    industria: t.industry,
    dificultad: strategy?.complexity ?? 'media',
    objetivo: strategy?.objective ?? pretty(t.objective),
    resultadoEsperado: strategy?.expectedResult ?? '',
    beneficio: benefitLabel(t.benefit),
    recomendadoPara: SEGMENT_LABEL[t.segment] ?? pretty(t.segment),
    duracionRecomendada: strategy?.recommendedDuration ?? null,
    motores: strategy?.enginesUsed ?? [],
    automatizaciones: strategy?.automationPlaybooks ?? [],
    kpis: strategy?.kpis.slice(0, 4) ?? [],
  }
}

/** Todas las plantillas de promoción como tarjetas, opcionalmente por categoría. */
export function listPromoPlantillas(categoria?: string): readonly PromoPlantillaCard[] {
  const cards = CARWASH_PROMOTION_TEMPLATES.map(toPromoCard)
  return categoria ? cards.filter((c) => c.categoria === categoria) : cards
}

/** Categorías disponibles (en orden de aparición en la biblioteca). */
export function promoPlantillaCategorias(): readonly string[] {
  return Array.from(new Set(CARWASH_PROMOTION_TEMPLATES.map((t) => t.category)))
}

/** Prefill del formulario de promoción del panel (copia editable de la plantilla). */
export interface PromocionPrefill {
  readonly plantillaKey: string
  readonly plantillaNombre: string
  readonly titulo: string
  readonly descripcion: string
  readonly tipo: PromoTipo
  readonly descuento: number | null
  readonly vigenciaHasta: Date | null
}

/** Deriva el tipo del catálogo del marketplace a partir del beneficio/categoría. */
function promoTipoFromTemplate(t: PromotionTemplate): PromoTipo {
  if (t.benefit.type === 'porcentaje') {
    if (t.category === 'Horarios de baja demanda') return 'happy_hour'
    if (t.category === 'Temporales' || t.category === 'Climáticas') return 'temporada'
    return 'descuento'
  }
  switch (t.benefit.type) {
    case 'valor_fijo':
      return 'monto_fijo'
    case 'servicio_gratis':
      return 'servicio_gratis'
    case 'upgrade':
      return 'upgrade'
    case 'puntos':
    case 'credito':
      return 'regalo'
  }
}

/**
 * Copia la configuración de una plantilla como valores iniciales del formulario
 * de promoción. El recurso resultante es independiente: editarlo nunca modifica
 * la plantilla original.
 */
export function promocionPrefill(plantillaKey: string): PromocionPrefill | null {
  const t = CARWASH_PROMOTION_TEMPLATES.find((x) => x.key === plantillaKey)
  if (!t) return null

  const conPorcentaje = t.benefit.type === 'porcentaje' || t.benefit.type === 'valor_fijo'
  const vigenciaHasta = t.durationDays
    ? new Date(Date.now() + t.durationDays * 24 * 60 * 60 * 1000)
    : null

  return {
    plantillaKey: t.key,
    plantillaNombre: t.name,
    titulo: t.name,
    descripcion: t.description,
    tipo: promoTipoFromTemplate(t),
    descuento: conPorcentaje ? (t.benefit.value ?? null) : null,
    vigenciaHasta,
  }
}

// ── Planes (membresías) ───────────────────────────────────────────────────────

/** Tarjeta de plantilla de plan de membresía. */
export interface PlanPlantillaCard {
  readonly key: string
  readonly nombre: string
  readonly descripcion: string
  readonly modelo: string
  readonly industria: string
  readonly dificultad: 'baja' | 'media' | 'alta'
  readonly precioSugerido: number
  readonly moneda: string
  readonly periodicidad: string
  readonly beneficios: readonly string[]
  readonly recomendadoPara: string
  readonly problemaQueResuelve: string
  readonly motores: readonly string[]
  readonly kpis: readonly string[]
}

function strategyForPlanTemplate(key: string) {
  return CARWASH_MEMBERSHIP_STRATEGIES.find((s) => s.variantKeys.includes(key)) ?? null
}

function planBeneficios(t: MembershipTemplate): string[] {
  const lines: string[] = []
  for (const s of t.config.includedServices ?? []) lines.push(pretty(s))
  const extras = (t.config as { benefits?: readonly string[] }).benefits ?? []
  for (const b of extras) lines.push(pretty(b))
  if (t.unlimited) lines.push('Usos ilimitados')
  else if (t.credits) lines.push(`${t.credits} usos incluidos`)
  return lines
}

function planCondiciones(t: MembershipTemplate): string {
  const parts: string[] = []
  const limits = t.config.limits
  if (limits?.maxPerPeriod) {
    const periodo =
      limits.maxPerPeriod.period === 'DAY'
        ? 'día'
        : limits.maxPerPeriod.period === 'WEEK'
          ? 'semana'
          : 'mes'
    parts.push(`Máximo ${limits.maxPerPeriod.count} uso(s) por ${periodo}.`)
  }
  if (limits?.minIntervalMinutes) {
    parts.push(`Mínimo ${Math.round(limits.minIntervalMinutes / 60)} h entre usos.`)
  }
  if (limits?.maxCreditsRollover != null) {
    parts.push(
      limits.maxCreditsRollover > 0
        ? `Acumula hasta ${limits.maxCreditsRollover} uso(s) al renovar.`
        : 'Los usos no acumulan al renovar.',
    )
  }
  return parts.join(' ')
}

function periodicidadDias(p: MembershipPeriodicity, durationDays?: number | null): number {
  if (durationDays) return durationDays
  switch (p) {
    case 'WEEKLY':
      return 7
    case 'QUARTERLY':
      return 90
    case 'SEMIANNUAL':
      return 180
    case 'ANNUAL':
      return 365
    default:
      return 30
  }
}

function toPlanCard(t: MembershipTemplate): PlanPlantillaCard {
  const strategy = strategyForPlanTemplate(t.key)
  return {
    key: t.key,
    nombre: t.name,
    descripcion: t.description,
    modelo: strategy?.name ?? pretty(t.type.toLowerCase()),
    industria: t.industry,
    dificultad: strategy?.complexity ?? 'media',
    precioSugerido: t.suggestedPrice,
    moneda: t.currency,
    periodicidad: PERIODICITY_LABEL[t.periodicity],
    beneficios: planBeneficios(t),
    recomendadoPara: (strategy?.audience ?? [])
      .map((a) => AUDIENCE_LABEL[a] ?? pretty(a))
      .join(', '),
    problemaQueResuelve: strategy?.problemSolved ?? '',
    motores: strategy?.enginesUsed ?? [],
    kpis: strategy?.kpis.slice(0, 4) ?? [],
  }
}

/** Todas las plantillas de plan como tarjetas, opcionalmente por modelo. */
export function listPlanPlantillas(modelo?: string): readonly PlanPlantillaCard[] {
  const cards = CARWASH_MEMBERSHIP_TEMPLATES.map(toPlanCard)
  return modelo ? cards.filter((c) => c.modelo === modelo) : cards
}

/** Modelos comerciales disponibles (para el filtro de la galería). */
export function planPlantillaModelos(): readonly string[] {
  return Array.from(new Set(CARWASH_MEMBERSHIP_TEMPLATES.map(toPlanCard).map((c) => c.modelo)))
}

/** Prefill del formulario de plan del panel. */
export interface PlanPrefill {
  readonly plantillaKey: string
  readonly plantillaNombre: string
  readonly nombre: string
  readonly descripcion: string
  readonly precio: number
  readonly vigenciaDias: number
  readonly lavados: number
  readonly esIlimitado: boolean
  readonly beneficios: string
  readonly condiciones: string
}

/**
 * Copia la configuración de una plantilla de membresía como valores iniciales
 * del formulario de plan. Recurso independiente; la plantilla nunca cambia.
 */
export function planPrefill(plantillaKey: string): PlanPrefill | null {
  const t = CARWASH_MEMBERSHIP_TEMPLATES.find((x) => x.key === plantillaKey)
  if (!t) return null

  return {
    plantillaKey: t.key,
    plantillaNombre: t.name,
    nombre: t.name,
    descripcion: t.description,
    precio: t.suggestedPrice,
    vigenciaDias: periodicidadDias(t.periodicity, t.durationDays),
    lavados: t.credits ?? 0,
    esIlimitado: t.unlimited ?? false,
    beneficios: planBeneficios(t).join('\n'),
    condiciones: planCondiciones(t),
  }
}
