/**
 * Biblioteca de plantillas de PROMOCIÓN para CAR WASH (Fase B, Industria 1).
 *
 * 54 plantillas (CAR-001..054) como DATOS. Un Car Wash instancia las que
 * necesite sobre el Promotion Framework (F4). El motor no contiene nada de Car
 * Wash: toda la especificidad vive aquí. Las estrategias por objetivo comercial
 * (Fase F1.2) las agrupan en `carwash-strategies.ts`.
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

  // ── 13. Captación (variante social/QR) ──
  t({ code: 'CAR-037', name: 'Cupón de bienvenida', objective: O.CAPTURE, category: 'Captación', description: 'Cupón de descuento para nuevos captados por redes o QR.', segment: S.NEW, trigger: { type: T.ON_SIGNUP }, benefit: { type: B.PERCENTAGE, value: 20 }, channels: ['qr', 'push'], restrictions: [{ type: RESTRICTION_TYPES.PER_CLIENT, value: 1 }] }),

  // ── 14. Activación (registro → primera visita) ──
  t({ code: 'CAR-038', name: 'Activa tu registro', objective: O.CONVERSION, category: 'Activación', description: 'Beneficio para convertir un registro en primera visita dentro de 15 días.', segment: S.NEW, trigger: { type: T.ON_SIGNUP }, conditions: 'cliente.visitas == 0', durationDays: 15, benefit: { type: B.FREE_SERVICE, service: 'aspirado' }, channels: ['push', 'email'], restrictions: [{ type: RESTRICTION_TYPES.PER_CLIENT, value: 1 }] }),
  t({ code: 'CAR-039', name: 'Vuelve por tu segunda', objective: O.CONVERSION, category: 'Activación', description: 'Puntos dobles en la segunda visita para consolidar el hábito.', segment: S.CONVERTED, trigger: { type: T.ON_VISIT_COUNT, params: { count: 1 } }, conditions: 'cliente.visitas == 1', benefit: { type: B.POINTS, value: 150 }, channels: ['push'] }),

  // ── 15. Horarios de baja demanda (Happy Hour) ──
  t({ code: 'CAR-040', name: 'Happy Hour Básico', objective: O.FREQUENCY, category: 'Horarios de baja demanda', description: '25% en lavado básico en horas valle entre semana.', segment: S.ALL, trigger: { type: T.ON_DAY_OF_WEEK, params: { days: [1, 2, 3, 4], hours: [9, 12] } }, conditions: 'sistema.diaSemana IN [1, 2, 3, 4] AND sistema.hora >= 9 AND sistema.hora <= 12', benefit: { type: B.PERCENTAGE, value: 25, service: 'lavado_exterior' } }),
  t({ code: 'CAR-041', name: 'Happy Hour Premium', objective: O.FREQUENCY, category: 'Horarios de baja demanda', description: '20% en lavado premium en horas valle.', segment: S.ALL, trigger: { type: T.ON_DAY_OF_WEEK, params: { days: [1, 2, 3, 4], hours: [9, 12] } }, conditions: 'sistema.hora >= 9 AND sistema.hora <= 12', benefit: { type: B.PERCENTAGE, value: 20, service: 'lavado_premium' } }),
  t({ code: 'CAR-042', name: 'Happy Hour Detailing', objective: O.FREQUENCY, category: 'Horarios de baja demanda', description: '15% en detailing en horas de baja demanda.', segment: S.ALL, trigger: { type: T.ON_DAY_OF_WEEK, params: { days: [1, 2, 3], hours: [9, 12] } }, benefit: { type: B.PERCENTAGE, value: 15, service: 'detailing' } }),
  t({ code: 'CAR-043', name: 'Happy Hour Aspirado', objective: O.FREQUENCY, category: 'Horarios de baja demanda', description: 'Aspirado gratis al lavar en horas valle.', segment: S.ALL, trigger: { type: T.ON_DAY_OF_WEEK, params: { days: [1, 2, 3, 4], hours: [9, 12] } }, benefit: { type: B.FREE_SERVICE, service: 'aspirado' } }),

  // ── 16. Upselling ──
  t({ code: 'CAR-044', name: 'Upgrade con descuento', objective: O.PREMIUM, category: 'Upselling', description: 'Sube de básico a premium pagando la diferencia con descuento.', segment: S.ALL, trigger: { type: T.ON_BEHAVIOR }, conditions: 'compra.servicio == "basico"', benefit: { type: B.UPGRADE, service: 'lavado_premium' } }),
  t({ code: 'CAR-045', name: 'Sube a detailing', objective: O.PREMIUM, category: 'Upselling', description: 'Pasa de premium a detailing con precio preferencial.', segment: S.FREQUENT, trigger: { type: T.ON_BEHAVIOR }, conditions: 'compra.servicio == "lavado_premium"', benefit: { type: B.UPGRADE, service: 'detailing' } }),

  // ── 17. Cross Selling ──
  t({ code: 'CAR-046', name: 'Agrega aspirado', objective: O.TICKET, category: 'Cross Selling', description: 'Aspirado con 50% al comprar cualquier lavado.', segment: S.ALL, trigger: { type: T.ON_BEHAVIOR }, benefit: { type: B.PERCENTAGE, value: 50, service: 'aspirado' } }),
  t({ code: 'CAR-047', name: 'Suma protección UV', objective: O.TICKET, category: 'Cross Selling', description: 'Complementa el lavado con protección UV a precio especial.', segment: S.ALL, trigger: { type: T.ON_BEHAVIOR }, benefit: { type: B.FIXED, value: 200, service: 'proteccion_uv' } }),

  // ── 18. Eventos ──
  t({ code: 'CAR-048', name: 'Evento local', objective: O.SEASONAL, category: 'Eventos', description: 'Promoción ligada a un evento local (concierto, feria, deportivo).', segment: S.ALL, trigger: { type: T.ON_DATE_RANGE }, durationDays: 2, benefit: { type: B.PERCENTAGE, value: 20 }, channels: ['push', 'whatsapp'] }),
  t({ code: 'CAR-049', name: 'Expo/Feria comercial', objective: O.SEASONAL, category: 'Eventos', description: 'Activación durante ferias o expos con beneficio de cortesía.', segment: S.ALL, trigger: { type: T.ON_DATE_RANGE }, benefit: { type: B.FREE_SERVICE, service: 'aroma' } }),

  // ── 19. Fidelización ──
  t({ code: 'CAR-050', name: 'Club VIP beneficio', objective: O.RETENTION, category: 'Fidelización', description: 'Beneficio exclusivo mensual para clientes VIP.', segment: S.VIP, trigger: { type: T.ON_BEHAVIOR }, conditions: 'cliente.esVip == true', benefit: { type: B.FREE_SERVICE, service: 'lavado_premium' }, channels: ['push'] }),
  t({ code: 'CAR-051', name: 'Puntos dobles frecuentes', objective: O.RETENTION, category: 'Fidelización', description: 'Puntos dobles permanentes para clientes de alta frecuencia.', segment: S.FREQUENT, trigger: { type: T.ON_BEHAVIOR }, conditions: 'cliente.visitas >= 8', benefit: { type: B.POINTS, value: 200 } }),

  // ── 20. Celebraciones ──
  t({ code: 'CAR-052', name: 'Cumpleaños feliz', objective: O.RETENTION, category: 'Celebraciones', description: 'Lavado premium de regalo en el mes de cumpleaños del cliente.', segment: S.ALL, trigger: { type: T.ON_DATE_RANGE, params: { event: 'birthday' } }, conditions: 'cliente.esCumpleanos == true', benefit: { type: B.FREE_SERVICE, service: 'lavado_premium' }, channels: ['push', 'email'], restrictions: [{ type: RESTRICTION_TYPES.PER_CLIENT, value: 1 }] }),
  t({ code: 'CAR-053', name: 'Aniversario de cliente', objective: O.RETENTION, category: 'Celebraciones', description: 'Puntos de regalo al cumplir un año como cliente.', segment: S.FREQUENT, trigger: { type: T.ON_DATE_RANGE, params: { event: 'anniversary' } }, benefit: { type: B.POINTS, value: 300 } }),
  t({ code: 'CAR-054', name: 'Hito de visitas', objective: O.RETENTION, category: 'Celebraciones', description: 'Recompensa al alcanzar un hito de visitas (ej. 25, 50, 100).', segment: S.FREQUENT, trigger: { type: T.ON_VISIT_COUNT, params: { count: 25 } }, conditions: 'cliente.visitas == 25', benefit: { type: B.FREE_SERVICE, service: 'detailing' } }),
]

const BY_KEY = new Map(CARWASH_PROMOTION_TEMPLATES.map((t) => [t.key, t]))
const BY_CODE = new Map(CARWASH_PROMOTION_TEMPLATES.map((t) => [t.code, t]))

export function getCarwashPromo(keyOrCode: string): PromotionTemplate | undefined {
  return BY_KEY.get(keyOrCode) ?? BY_CODE.get(keyOrCode)
}
