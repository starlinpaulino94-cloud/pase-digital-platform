/**
 * Biblioteca de plantillas de BENEFICIO para CAR WASH (Fase C, Industria 1).
 *
 * Los 50 beneficios (CAR-001..050) en sus 10 categorías, como DATOS. Un Car
 * Wash instancia los que necesite sobre el Benefit Engine; el motor no contiene
 * nada de Car Wash. Los valores percibido/costo son sugerencias en RD$ (DOP)
 * que la empresa puede editar. `modules` indica dónde puede usarse el beneficio.
 */

import { BENEFIT_CATEGORIES as C, BENEFIT_MODULES as M } from '../domain/taxonomy'
import type { BenefitTemplate } from './types'

const ALL_MODULES = Object.values(M)

function b(
  p: Omit<BenefitTemplate, 'key' | 'industry'>,
): BenefitTemplate {
  return { ...p, industry: 'carwash', key: `carwash.${p.code}` }
}

export const CARWASH_BENEFIT_TEMPLATES: readonly BenefitTemplate[] = [
  // ── CATEGORÍA 1 · Servicios gratuitos ──
  b({ code: 'CAR-001', name: 'Lavado gratis', description: 'Un lavado sin costo. Uso en referidos, puntos, cumpleaños o membresías.', category: C.SERVICE, type: 'SERVICE_FREE', perceivedValue: 800, realCost: 150, config: { service: 'lavado_exterior', quantity: 1, modules: ALL_MODULES } }),
  b({ code: 'CAR-002', name: 'Lavado Premium gratis', description: 'Lavado premium sin costo. Ideal para clientes VIP y embajadores.', category: C.SERVICE, type: 'SERVICE_FREE', perceivedValue: 1500, realCost: 350, config: { service: 'lavado_premium', quantity: 1, modules: ALL_MODULES } }),
  b({ code: 'CAR-003', name: 'Aspirado gratis', description: 'Aspirado sin costo. Beneficio económico de alta percepción.', category: C.SERVICE, type: 'SERVICE_FREE', perceivedValue: 300, realCost: 60, config: { service: 'aspirado', quantity: 1, modules: ALL_MODULES } }),
  b({ code: 'CAR-004', name: 'Aroma premium gratis', description: 'Aromatización premium. Costo bajo, excelente recompensa frecuente.', category: C.SERVICE, type: 'SERVICE_FREE', perceivedValue: 250, realCost: 40, config: { service: 'aroma', quantity: 1, modules: ALL_MODULES } }),
  b({ code: 'CAR-005', name: 'Limpieza interior gratis', description: 'Limpieza interior sin costo. Beneficio de alto valor.', category: C.SERVICE, type: 'SERVICE_FREE', perceivedValue: 900, realCost: 200, config: { service: 'interior', quantity: 1, modules: ALL_MODULES } }),
  b({ code: 'CAR-006', name: 'Cera gratis', description: 'Aplicación de cera sin costo. Ideal para clientes frecuentes.', category: C.SERVICE, type: 'SERVICE_FREE', perceivedValue: 600, realCost: 120, config: { service: 'cera', quantity: 1, modules: ALL_MODULES } }),
  b({ code: 'CAR-007', name: 'Protección UV gratis', description: 'Tratamiento de protección UV sin costo. Beneficio premium.', category: C.SERVICE, type: 'SERVICE_FREE', perceivedValue: 1200, realCost: 280, config: { service: 'proteccion_uv', quantity: 1, modules: ALL_MODULES } }),
  b({ code: 'CAR-008', name: 'Descontaminado gratis', description: 'Descontaminación de pintura sin costo. Para campañas especiales.', category: C.SERVICE, type: 'SERVICE_FREE', perceivedValue: 1800, realCost: 400, config: { service: 'descontaminado', quantity: 1, modules: [M.PROMOTION, M.CAMPAIGN, M.MEMBERSHIP] } }),
  b({ code: 'CAR-009', name: 'Detailing parcial gratis', description: 'Detailing parcial sin costo. Para clientes de alto valor.', category: C.SERVICE, type: 'SERVICE_FREE', perceivedValue: 2500, realCost: 700, config: { service: 'detailing_parcial', quantity: 1, modules: [M.MEMBERSHIP, M.REFERRAL, M.CAMPAIGN] } }),
  b({ code: 'CAR-010', name: 'Inspección estética gratuita', description: 'Inspección estética del vehículo. Para vender servicios premium.', category: C.SERVICE, type: 'SERVICE_FREE', perceivedValue: 500, realCost: 50, config: { service: 'inspeccion', quantity: 1, modules: ALL_MODULES } }),

  // ── CATEGORÍA 2 · Descuentos ──
  b({ code: 'CAR-011', name: 'Porcentaje de descuento', description: 'Descuento porcentual configurable (10%, 20%, 50%).', category: C.DISCOUNT, type: 'DISCOUNT', perceivedValue: 200, realCost: 200, config: { discountKind: 'PERCENT', value: 20, modules: ALL_MODULES } }),
  b({ code: 'CAR-012', name: 'Descuento fijo', description: 'Descuento de monto fijo (ej. RD$200 menos).', category: C.DISCOUNT, type: 'DISCOUNT', perceivedValue: 200, realCost: 200, config: { discountKind: 'FIXED', value: 200, modules: ALL_MODULES } }),
  b({ code: 'CAR-013', name: 'Descuento exclusivo miembro', description: 'Descuento solo para miembros con membresía activa.', category: C.DISCOUNT, type: 'DISCOUNT', perceivedValue: 150, realCost: 150, config: { discountKind: 'PERCENT', value: 15, restrictions: { requiresTier: 'miembro' }, modules: [M.MEMBERSHIP, M.PROMOTION] } }),
  b({ code: 'CAR-014', name: 'Descuento cumpleaños', description: 'Descuento anual por cumpleaños del cliente.', category: C.DISCOUNT, type: 'DISCOUNT', perceivedValue: 300, realCost: 300, config: { discountKind: 'PERCENT', value: 30, restrictions: { maxRedemptions: 1, perPeriod: 'YEAR' }, modules: [M.AUTOMATION, M.CAMPAIGN] } }),
  b({ code: 'CAR-015', name: 'Descuento recuperación', description: 'Descuento fuerte para reactivar clientes inactivos.', category: C.DISCOUNT, type: 'DISCOUNT', perceivedValue: 400, realCost: 400, config: { discountKind: 'PERCENT', value: 40, restrictions: { segments: ['inactivo', 'en_riesgo'] }, modules: [M.AUTOMATION, M.CAMPAIGN, M.PROMOTION] } }),

  // ── CATEGORÍA 3 · Upgrades ──
  b({ code: 'CAR-016', name: 'Upgrade de lavado', description: 'El cliente paga básico y recibe premium.', category: C.UPGRADE, type: 'UPGRADE', perceivedValue: 700, realCost: 200, config: { fromService: 'lavado_basico', service: 'lavado_premium', modules: ALL_MODULES } }),
  b({ code: 'CAR-017', name: 'Upgrade interior', description: 'Mejora del servicio interior contratado.', category: C.UPGRADE, type: 'UPGRADE', perceivedValue: 500, realCost: 150, config: { fromService: 'interior_basico', service: 'interior_premium', modules: ALL_MODULES } }),
  b({ code: 'CAR-018', name: 'Upgrade protección', description: 'Mejora a protección premium (cera → UV).', category: C.UPGRADE, type: 'UPGRADE', perceivedValue: 800, realCost: 250, config: { fromService: 'cera', service: 'proteccion_uv', modules: ALL_MODULES } }),
  b({ code: 'CAR-019', name: 'Upgrade servicio completo', description: 'Mejora al paquete de servicio completo.', category: C.UPGRADE, type: 'UPGRADE', perceivedValue: 1500, realCost: 450, config: { fromService: 'lavado_premium', service: 'servicio_completo', modules: [M.MEMBERSHIP, M.PROMOTION, M.CAMPAIGN] } }),

  // ── CATEGORÍA 4 · Económicos internos ──
  b({ code: 'CAR-020', name: 'Crédito interno', description: 'Saldo interno utilizable en lavados, servicios o productos (ej. RD$500).', category: C.ECONOMIC, type: 'CREDIT', perceivedValue: 500, realCost: 500, config: { value: 500, modules: ALL_MODULES } }),
  b({ code: 'CAR-021', name: 'Saldo promocional', description: 'Saldo tipo wallet acreditado por una campaña.', category: C.ECONOMIC, type: 'CREDIT', perceivedValue: 300, realCost: 300, config: { value: 300, restrictions: { validDays: 30 }, modules: [M.CAMPAIGN, M.PROMOTION, M.GAMIFICATION] } }),
  b({ code: 'CAR-022', name: 'Cashback', description: 'Devuelve un porcentaje del consumo para la próxima visita.', category: C.ECONOMIC, type: 'CREDIT', perceivedValue: 100, realCost: 100, config: { value: 10, discountKind: 'PERCENT', restrictions: { validDays: 30 }, modules: [M.PROMOTION, M.AUTOMATION, M.MEMBERSHIP] } }),

  // ── CATEGORÍA 5 · Puntos ──
  b({ code: 'CAR-023', name: 'Puntos extra', description: 'Puntos adicionales de lealtad (ej. doble puntos).', category: C.POINTS, type: 'POINTS', perceivedValue: 0, realCost: 0, config: { value: 100, multiplier: 2, modules: ALL_MODULES } }),
  b({ code: 'CAR-024', name: 'Multiplicador temporal', description: 'Triple puntos durante una campaña.', category: C.POINTS, type: 'POINTS', perceivedValue: 0, realCost: 0, config: { multiplier: 3, restrictions: { validDays: 15 }, modules: [M.CAMPAIGN, M.GAMIFICATION, M.PROMOTION] } }),
  b({ code: 'CAR-025', name: 'Bonus inicial', description: 'Puntos de bienvenida para un usuario nuevo.', category: C.POINTS, type: 'POINTS', perceivedValue: 0, realCost: 0, config: { value: 50, restrictions: { maxRedemptions: 1, perPeriod: 'EVER' }, modules: [M.REFERRAL, M.GAMIFICATION, M.AUTOMATION] } }),

  // ── CATEGORÍA 6 · Membresía ──
  b({ code: 'CAR-026', name: 'Visita adicional', description: 'Suma una visita/lavado extra al plan de membresía.', category: C.MEMBERSHIP, type: 'TIME', perceivedValue: 800, realCost: 150, config: { timeUnit: 'EXTRA_VISIT', quantity: 1, modules: [M.MEMBERSHIP, M.REFERRAL, M.AUTOMATION] } }),
  b({ code: 'CAR-027', name: 'Mes gratis', description: 'Un mes de membresía sin costo (renovación).', category: C.MEMBERSHIP, type: 'TIME', perceivedValue: 1500, realCost: 300, config: { timeUnit: 'FREE_MONTH', quantity: 1, modules: [M.MEMBERSHIP, M.AUTOMATION] } }),
  b({ code: 'CAR-028', name: 'Precio congelado', description: 'El cliente mantiene su precio antiguo al renovar.', category: C.MEMBERSHIP, type: 'TIME', perceivedValue: 500, realCost: 200, config: { timeUnit: 'FROZEN_PRICE', modules: [M.MEMBERSHIP, M.AUTOMATION] } }),
  b({ code: 'CAR-029', name: 'Acceso anticipado', description: 'Acceso anticipado a nuevas ofertas.', category: C.MEMBERSHIP, type: 'ACCESS', perceivedValue: 200, realCost: 0, config: { service: 'ofertas_anticipadas', modules: [M.MEMBERSHIP, M.CAMPAIGN] } }),
  b({ code: 'CAR-030', name: 'Atención prioritaria', description: 'Prioridad de atención para miembros.', category: C.MEMBERSHIP, type: 'ACCESS', perceivedValue: 300, realCost: 0, config: { service: 'prioridad', modules: [M.MEMBERSHIP] } }),

  // ── CATEGORÍA 7 · VIP ──
  b({ code: 'CAR-031', name: 'Línea rápida', description: 'El cliente VIP tiene prioridad en fila.', category: C.VIP, type: 'ACCESS', perceivedValue: 400, realCost: 0, config: { service: 'linea_rapida', restrictions: { requiresTier: 'vip' }, modules: [M.MEMBERSHIP] } }),
  b({ code: 'CAR-032', name: 'Área exclusiva', description: 'Acceso a un área de espera exclusiva.', category: C.VIP, type: 'ACCESS', perceivedValue: 500, realCost: 100, config: { service: 'area_vip', restrictions: { requiresTier: 'vip' }, modules: [M.MEMBERSHIP] } }),
  b({ code: 'CAR-033', name: 'Servicio personalizado', description: 'Atención y servicio personalizados.', category: C.VIP, type: 'EXPERIENCE', perceivedValue: 1000, realCost: 300, config: { service: 'personalizado', restrictions: { requiresTier: 'vip' }, modules: [M.MEMBERSHIP, M.CAMPAIGN] } }),
  b({ code: 'CAR-034', name: 'Regalos sorpresa', description: 'Regalos sorpresa para clientes VIP.', category: C.VIP, type: 'PRODUCT', perceivedValue: 600, realCost: 200, config: { product: 'regalo_sorpresa', restrictions: { requiresTier: 'vip' }, modules: [M.GAMIFICATION, M.CAMPAIGN, M.AUTOMATION] } }),
  b({ code: 'CAR-035', name: 'Eventos privados', description: 'Invitación a eventos privados de la marca.', category: C.VIP, type: 'EXPERIENCE', perceivedValue: 1500, realCost: 500, config: { service: 'evento_privado', restrictions: { requiresTier: 'vip' }, modules: [M.CAMPAIGN] } }),

  // ── CATEGORÍA 8 · Comportamiento ──
  b({ code: 'CAR-036', name: 'Cliente frecuente', description: 'Premio por número de visitas acumuladas.', category: C.BEHAVIOR, type: 'SERVICE_FREE', perceivedValue: 800, realCost: 150, config: { service: 'lavado_exterior', restrictions: { customRules: ['cliente.visitas >= 10'] }, modules: [M.AUTOMATION, M.GAMIFICATION] } }),
  b({ code: 'CAR-037', name: 'Cliente aniversario', description: 'Beneficio por tiempo como cliente (aniversario).', category: C.BEHAVIOR, type: 'SERVICE_FREE', perceivedValue: 1500, realCost: 350, config: { service: 'lavado_premium', restrictions: { maxRedemptions: 1, perPeriod: 'YEAR' }, modules: [M.AUTOMATION, M.CAMPAIGN] } }),
  b({ code: 'CAR-038', name: 'Cliente recuperado', description: 'Premio por regresar tras inactividad.', category: C.BEHAVIOR, type: 'DISCOUNT', perceivedValue: 300, realCost: 300, config: { discountKind: 'PERCENT', value: 30, restrictions: { segments: ['inactivo'] }, modules: [M.AUTOMATION, M.CAMPAIGN] } }),
  b({ code: 'CAR-039', name: 'Embajador', description: 'Beneficio por ayudar al negocio (referidos/reseñas).', category: C.BEHAVIOR, type: 'CREDIT', perceivedValue: 500, realCost: 500, config: { value: 500, restrictions: { segments: ['embajador'] }, modules: [M.REFERRAL, M.GAMIFICATION] } }),
  b({ code: 'CAR-040', name: 'Racha activa', description: 'Premio por constancia (racha de visitas).', category: C.BEHAVIOR, type: 'POINTS', perceivedValue: 0, realCost: 0, config: { value: 200, restrictions: { customRules: ['cliente.racha >= 4'] }, modules: [M.GAMIFICATION, M.AUTOMATION] } }),

  // ── CATEGORÍA 9 · Referidos ──
  b({ code: 'CAR-041', name: 'Bono por referido nuevo', description: 'Recompensa por cada referido que se registra.', category: C.REFERRAL, type: 'SERVICE_FREE', perceivedValue: 300, realCost: 60, config: { service: 'aroma', modules: [M.REFERRAL] } }),
  b({ code: 'CAR-042', name: 'Bono escalonado', description: 'Recompensa creciente: 1 referido aroma, 5 lavado, 10 membresía.', category: C.REFERRAL, type: 'CUSTOM', perceivedValue: 0, realCost: 0, config: { modules: [M.REFERRAL, M.GAMIFICATION], tiers: [{ count: 1, benefit: 'CAR-004' }, { count: 5, benefit: 'CAR-001' }, { count: 10, benefit: 'CAR-027' }] } }),
  b({ code: 'CAR-043', name: 'Beneficio compartido', description: 'Referente y referido reciben recompensa.', category: C.REFERRAL, type: 'SERVICE_FREE', perceivedValue: 800, realCost: 150, config: { service: 'lavado_exterior', shared: true, modules: [M.REFERRAL] } }),
  b({ code: 'CAR-044', name: 'Beneficio exclusivo comunidad', description: 'Beneficio reservado a la comunidad de referidores.', category: C.REFERRAL, type: 'ACCESS', perceivedValue: 400, realCost: 50, config: { service: 'comunidad', restrictions: { segments: ['embajador'] }, modules: [M.REFERRAL, M.CAMPAIGN] } }),

  // ── CATEGORÍA 10 · Avanzados ──
  b({ code: 'CAR-045', name: 'Oferta personalizada IA', description: 'El sistema recomienda el beneficio óptimo por comportamiento.', category: C.ADVANCED, type: 'CUSTOM', perceivedValue: 0, realCost: 0, config: { strategy: 'ai_recommended', modules: [M.AUTOMATION, M.CAMPAIGN] } }),
  b({ code: 'CAR-046', name: 'Beneficio sorpresa', description: 'Beneficio aleatorio para gamificación.', category: C.ADVANCED, type: 'CUSTOM', perceivedValue: 0, realCost: 0, config: { strategy: 'surprise', modules: [M.GAMIFICATION] } }),
  b({ code: 'CAR-047', name: 'Recompensa secreta', description: 'Recompensa oculta para clientes especiales.', category: C.ADVANCED, type: 'CUSTOM', perceivedValue: 0, realCost: 0, config: { strategy: 'secret', restrictions: { segments: ['vip', 'alto_valor'] }, modules: [M.GAMIFICATION, M.CAMPAIGN] } }),
  b({ code: 'CAR-048', name: 'Beneficio por predicción', description: 'Se entrega a clientes con riesgo de abandonar (predicción).', category: C.ADVANCED, type: 'DISCOUNT', perceivedValue: 400, realCost: 400, config: { discountKind: 'PERCENT', value: 35, strategy: 'churn_prevention', restrictions: { segments: ['en_riesgo'] }, modules: [M.AUTOMATION] } }),
  b({ code: 'CAR-049', name: 'Beneficio por oportunidad', description: 'Se ofrece cuando el cliente nunca compra un servicio (ej. detailing).', category: C.ADVANCED, type: 'UPGRADE', perceivedValue: 1000, realCost: 300, config: { service: 'detailing_parcial', strategy: 'cross_sell', modules: [M.AUTOMATION, M.PROMOTION] } }),
  b({ code: 'CAR-050', name: 'Beneficio personalizado', description: 'Plantilla base para que la empresa cree cualquier beneficio.', category: C.ADVANCED, type: 'CUSTOM', perceivedValue: 0, realCost: 0, config: { modules: ALL_MODULES } }),
]

/** Busca una plantilla de beneficio Car Wash por su código o key. */
export function getCarwashBenefit(codeOrKey: string): BenefitTemplate | undefined {
  return CARWASH_BENEFIT_TEMPLATES.find(
    (t) => t.code === codeOrKey || t.key === codeOrKey,
  )
}
