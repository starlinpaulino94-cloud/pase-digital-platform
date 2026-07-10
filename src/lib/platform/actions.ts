/**
 * CATÁLOGO ÚNICO DE ACCIONES de la plataforma (Fase E2 — consolidación).
 *
 * La fuente de verdad es y sigue siendo el Action Engine
 * (`@/lib/rule-engine/domain/action-catalog.ts`): la revisión E2 verificó que
 * NINGÚN otro motor define acciones propias — Benefit, Referral, Automation,
 * Decision y los 180 playbooks referencian estas constantes. Este módulo lo
 * formaliza como catálogo de plataforma.
 *
 * Regla arquitectónica: una acción nueva se añade AQUÍ (en el Action Engine),
 * nunca como constante local de otro motor. La ejecución en vivo la hace el
 * `LiveActionSink` (`src/modules/estrategias/actionSink.ts`); las acciones sin
 * handler quedan como intención auditada, sin romper flujos.
 */

export { ACTION_TYPES, ACTION_CATALOG } from '@/lib/rule-engine'
export type { ActionTypeKey } from '@/lib/rule-engine'
