/**
 * Biblioteca de plantillas de PROMOCIÓN para CAR WASH (Fase B, Industria 1).
 *
 * Las 36 estrategias (CAR-001..036) en sus 12 categorías, como DATOS. Un Car
 * Wash instancia las que necesite sobre el Promotion Framework (F4). El motor no
 * contiene nada de Car Wash: toda la especificidad vive aquí.
 */

import { RESTRICTION_TYPES } from '../domain/restrictions'
import type { PromotionTemplate } from './template-types'
import {
  BENEFIT_TYPES as B,
  PROMOTION_OBJECTIVES as O,
  PROMOTION_SEGMENTS as S,
  TRIGGER_TYPES as T,
} from './taxonomy'

function t(p: Omit<PromotionTemplate, 'key' | 'industry'>): PromotionTemplate {
  return { ...p, industry: 'carwash', key: `carwash.${p.code}` }
}

export const CARWASH_PROMOTION_TEMPLATES: readonly PromotionTemplate[] = [
  // ── 1. Captación ──
  t({ code: 'CAR-001', name: 'Primera visita especial', objective: O.CAPTURE, category: 'Captación', description: '20% de descuento en la primera visita de un cliente nuevo.', segment: S.NEW, trigger: { type: T.ON_FIRST_VISIT }, conditions: 'cliente.visitas == 0', benefit: { type: B.PERCENTAGE, value: 20 }, restrictions: [{ type: RESTRICTION_TYPES.PER_CLIENT, value: 1 }] }),
  t({ code: 'CAR-002', name: 'Bienvenida MembeGo', objective: O.CAPTURE, category: 'Captación', description: 'Beneficio inicial al crear cuenta (ej. aroma gratis).', segment: S.NEW, trigger: { type: T.ON_SIGNUP }, benefit: { type: B.FREE_SERVICE, service: 'aroma' }, restrictions: [{ type: RESTRICTION_TYPES.PER_CLIENT, value: 1 }] }),
  t({ code: 'CAR-003', name: 'Primer lavado premium', objective: O.FIRST_PURCHASE, category: 'Captación', description: 'Lavado premium al precio básico para incentivar el ticket futuro.', segment: S.NEW, trigger: { type: T.ON_FIRST_VISIT }, benefit: { type: B.UPGRADE, service: 'lavado_premium' }, restrictions: [{ type: RESTRICTION_TYPES.PER_CLIENT, value: 1 }] }),

  // ── 2. Frecuencia ──
  t({ code: 'CAR-004', name: 'Lavado frecuente', objective: O.FREQUENCY, category: 'Frecuencia', description: 'Upgrade gratis tras 4 visitas.', segment: S.FREQUENT, trigger: { type: T.ON_VISIT_COUNT, params: { count: 4 } }, conditions: 'cliente.visitas >= 4', benefit: { type: B.UPGRADE, service: 'lavado_premium' } }),
  t({ code: 'CAR-005', name: 'Cliente semanal', objective: O.FREQUENCY, category: 'Frecuencia', description: 'Recompensa por visitas semanales durante un mes.', segment: S.FREQUENT, trigger: { type: T.ON_BEHAVIOR }, benefit: { type: B.POINTS, value: 100 } }),
  t({ code: 'CAR-006', name: 'Día lento', objective: O.FREQUENCY, category: 'Frecuencia', description: '20% los martes y miércoles para mover tráfico.', segment: S.ALL, trigger: { type: T.ON_DAY_OF_WEEK, params: { days: [2, 3] } }, conditions: 'sistema.diaSemana IN [2, 3]', benefit: { type: B.PERCENTAGE, value: 20 } }),

  // ── 3. Recuperación ──
  t({ code: 'CAR-007', name: 'Te extrañamos', objective: O.RECOVERY, category: 'Recuperación', description: 'Cupón para clientes sin visitar en 30 días.', segment: S.INACTIVE, trigger: { type: T.ON_INACTIVITY, params: { days: 30 } }, conditions: 'cliente.diasSinVisita >= 30', benefit: { type: B.PERCENTAGE, value: 25 }, restrictions: [{ type: RESTRICTION_TYPES.PER_CLIENT, value: 1 }] }),
  t({ code: 'CAR-008', name: 'Recuperación VIP', objective: O.RECOVERY, category: 'Recuperación', description: 'Mayor beneficio para clientes de alto valor que desaparecieron.', segment: S.HIGH_VALUE, trigger: { type: T.ON_INACTIVITY, params: { days: 30 } }, conditions: 'cliente.diasSinVisita >= 30 AND cliente.ltv >= 10000', benefit: { type: B.FREE_SERVICE, service: 'lavado_premium' } }),
  t({ code: 'CAR-009', name: 'Última oportunidad', objective: O.RECOVERY, category: 'Recuperación', description: 'Segunda campaña para quien no volvió tras la primera oferta.', segment: S.INACTIVE, trigger: { type: T.ON_INACTIVITY, params: { days: 60 } }, conditions: 'cliente.diasSinVisita >= 60', benefit: { type: B.PERCENTAGE, value: 30 } }),

  // ── 4. Ticket promedio ──
  t({ code: 'CAR-010', name: 'Upgrade automático', objective: O.TICKET, category: 'Ticket promedio', description: 'Ofrecer pasar de básico a premium en el momento de la compra.', segment: S.ALL, trigger: { type: T.ON_BEHAVIOR }, conditions: 'compra.servicio == "basico"', benefit: { type: B.UPGRADE, service: 'lavado_premium' } }),
  t({ code: 'CAR-011', name: 'Combo inteligente', objective: O.TICKET, category: 'Ticket promedio', description: 'Descuento al combinar lavado + interior.', segment: S.ALL, trigger: { type: T.ON_BEHAVIOR }, benefit: { type: B.PERCENTAGE, value: 15 } }),
  t({ code: 'CAR-012', name: 'Agrega protección', objective: O.TICKET, category: 'Ticket promedio', description: 'Oferta de cera / protección UV tras el lavado.', segment: S.ALL, trigger: { type: T.ON_BEHAVIOR }, benefit: { type: B.FIXED, value: 200 } }),

  // ── 5. Servicios premium ──
  t({ code: 'CAR-013', name: 'Prueba premium', objective: O.PREMIUM, category: 'Servicios premium', description: 'Primera experiencia premium para un cliente básico.', segment: S.ALL, trigger: { type: T.MANUAL }, benefit: { type: B.UPGRADE, service: 'lavado_premium' } }),
  t({ code: 'CAR-014', name: 'Temporada de detailing', objective: O.PREMIUM, category: 'Servicios premium', description: 'Campaña de detailing con descuento.', segment: S.ALL, trigger: { type: T.ON_DATE_RANGE }, benefit: { type: B.PERCENTAGE, value: 20, service: 'detailing' } }),
  t({ code: 'CAR-015', name: 'Protección del vehículo', objective: O.PREMIUM, category: 'Servicios premium', description: 'Ofrecer cerámica, pulido y protección.', segment: S.ALL, trigger: { type: T.MANUAL }, benefit: { type: B.FIXED, value: 500, service: 'proteccion_ceramica' } }),

  // ── 6. Membresías ──
  t({ code: 'CAR-016', name: 'Primera membresía', objective: O.MEMBERSHIP, category: 'Membresías', description: 'Descuento del primer mes al hacerse miembro.', segment: S.NEW, trigger: { type: T.ON_MEMBERSHIP_EVENT, params: { event: 'first_subscription' } }, benefit: { type: B.PERCENTAGE, value: 50 } }),
  t({ code: 'CAR-017', name: 'Upgrade de membresía', objective: O.MEMBERSHIP, category: 'Membresías', description: 'Incentivo para pasar de Silver a Gold.', segment: S.MEMBER, trigger: { type: T.ON_MEMBERSHIP_EVENT, params: { event: 'upgrade' } }, benefit: { type: B.UPGRADE, service: 'membresia_gold' } }),
  t({ code: 'CAR-018', name: 'Renovación premiada', objective: O.MEMBERSHIP, category: 'Membresías', description: 'Recompensa al renovar la membresía.', segment: S.MEMBER, trigger: { type: T.ON_MEMBERSHIP_EVENT, params: { event: 'renewal' } }, benefit: { type: B.POINTS, value: 200 } }),

  // ── 7. Comportamiento ──
  t({ code: 'CAR-019', name: 'Cliente frecuente', objective: O.RETENTION, category: 'Comportamiento', description: 'Beneficio exclusivo por muchas visitas.', segment: S.FREQUENT, trigger: { type: T.ON_BEHAVIOR }, conditions: 'cliente.visitas >= 10', benefit: { type: B.FREE_SERVICE, service: 'lavado_exterior' } }),
  t({ code: 'CAR-020', name: 'Cliente de alto valor', objective: O.RETENTION, category: 'Comportamiento', description: 'Beneficio según LTV.', segment: S.HIGH_VALUE, trigger: { type: T.ON_BEHAVIOR }, conditions: 'cliente.ltv >= 15000', benefit: { type: B.POINTS, value: 500 } }),
  t({ code: 'CAR-021', name: 'Cliente nuevo convertido', objective: O.CONVERSION, category: 'Comportamiento', description: 'Oferta especial tras la segunda visita.', segment: S.CONVERTED, trigger: { type: T.ON_VISIT_COUNT, params: { count: 2 } }, conditions: 'cliente.visitas == 2', benefit: { type: B.PERCENTAGE, value: 15 } }),

  // ── 8. Por vehículo ──
  t({ code: 'CAR-022', name: 'Vehículo nuevo', objective: O.PREMIUM, category: 'Por vehículo', description: 'Protección especial para vehículos nuevos.', segment: S.ALL, trigger: { type: T.ON_BEHAVIOR }, conditions: 'vehiculo.anio >= sistema.mes', benefit: { type: B.FREE_SERVICE, service: 'proteccion' } }),
  t({ code: 'CAR-023', name: 'Vehículo familiar', objective: O.TICKET, category: 'Por vehículo', description: 'Interior profundo para vehículos familiares.', segment: S.ALL, trigger: { type: T.ON_BEHAVIOR }, conditions: 'vehiculo.tipo == "familiar"', benefit: { type: B.PERCENTAGE, value: 10, service: 'interior_profundo' } }),
  t({ code: 'CAR-024', name: 'Vehículo premium', objective: O.PREMIUM, category: 'Por vehículo', description: 'Servicios exclusivos para vehículos de lujo.', segment: S.VIP, trigger: { type: T.ON_BEHAVIOR }, conditions: 'vehiculo.tipo == "lujo"', benefit: { type: B.UPGRADE, service: 'detailing' } }),

  // ── 9. Sociales / referidos ──
  t({ code: 'CAR-025', name: 'Trae un amigo', objective: O.REFERRAL, category: 'Sociales', description: 'Crédito por recomendar a un amigo.', segment: S.ALL, trigger: { type: T.ON_BEHAVIOR, params: { event: 'referral' } }, benefit: { type: B.CREDIT, value: 500 } }),
  t({ code: 'CAR-026', name: 'Cliente embajador', objective: O.REFERRAL, category: 'Sociales', description: 'Recompensas acumulativas por referir.', segment: S.ALL, trigger: { type: T.ON_BEHAVIOR, params: { event: 'referral' } }, benefit: { type: B.POINTS, value: 1000 } }),

  // ── 10. Temporales ──
  t({ code: 'CAR-027', name: 'Fin de semana', objective: O.SEASONAL, category: 'Temporales', description: 'Oferta limitada de fin de semana.', segment: S.ALL, trigger: { type: T.ON_DAY_OF_WEEK, params: { days: [6, 0] } }, conditions: 'sistema.diaSemana IN [6, 0]', benefit: { type: B.PERCENTAGE, value: 15 } }),
  t({ code: 'CAR-028', name: 'Mes aniversario', objective: O.SEASONAL, category: 'Temporales', description: 'Campaña especial del mes aniversario.', segment: S.ALL, trigger: { type: T.ON_DATE_RANGE }, benefit: { type: B.PERCENTAGE, value: 25 } }),
  t({ code: 'CAR-029', name: 'Black Friday', objective: O.SEASONAL, category: 'Temporales', description: 'Oferta limitada de Black Friday.', segment: S.ALL, trigger: { type: T.ON_DATE_RANGE }, durationDays: 3, benefit: { type: B.PERCENTAGE, value: 40 } }),
  t({ code: 'CAR-030', name: 'Navidad', objective: O.SEASONAL, category: 'Temporales', description: 'Paquetes especiales de Navidad.', segment: S.ALL, trigger: { type: T.ON_DATE_RANGE }, benefit: { type: B.FREE_SERVICE, service: 'aroma_navideno' } }),

  // ── 11. Climáticas ──
  t({ code: 'CAR-031', name: 'Después de lluvia', objective: O.SEASONAL, category: 'Climáticas', description: 'Activación automática tras lluvia.', segment: S.ALL, trigger: { type: T.ON_WEATHER, params: { condition: 'rain' } }, benefit: { type: B.PERCENTAGE, value: 15 } }),
  t({ code: 'CAR-032', name: 'Protección solar', objective: O.PREMIUM, category: 'Climáticas', description: 'Protección en temporada caliente.', segment: S.ALL, trigger: { type: T.ON_WEATHER, params: { condition: 'hot' } }, benefit: { type: B.FIXED, value: 300, service: 'proteccion_uv' } }),
  t({ code: 'CAR-033', name: 'Recuperación post viaje', objective: O.RECOVERY, category: 'Climáticas', description: 'Oferta tras temporada de vacaciones.', segment: S.ALL, trigger: { type: T.ON_DATE_RANGE }, benefit: { type: B.PERCENTAGE, value: 20 } }),

  // ── 12. Avanzadas (IA) ──
  t({ code: 'CAR-034', name: 'Oferta personalizada IA', objective: O.COMPETITIVE, category: 'Avanzadas', description: 'El sistema recomienda la promoción óptima.', segment: S.ALL, trigger: { type: T.AI_RECOMMENDED }, benefit: { type: B.PERCENTAGE, value: 15 } }),
  t({ code: 'CAR-035', name: 'Próxima mejor acción', objective: O.COMPETITIVE, category: 'Avanzadas', description: 'Acción sugerida según el comportamiento del cliente.', segment: S.ALL, trigger: { type: T.AI_RECOMMENDED }, benefit: { type: B.UPGRADE, service: 'lavado_premium' } }),
  t({ code: 'CAR-036', name: 'Segmentación automática', objective: O.COMPETITIVE, category: 'Avanzadas', description: 'El sistema crea grupos y ofertas por segmento.', segment: S.ALL, trigger: { type: T.AI_RECOMMENDED }, benefit: { type: B.PERCENTAGE, value: 10 } }),
]

const BY_KEY = new Map(CARWASH_PROMOTION_TEMPLATES.map((t) => [t.key, t]))
const BY_CODE = new Map(CARWASH_PROMOTION_TEMPLATES.map((t) => [t.code, t]))

export function getCarwashPromo(keyOrCode: string): PromotionTemplate | undefined {
  return BY_KEY.get(keyOrCode) ?? BY_CODE.get(keyOrCode)
}
