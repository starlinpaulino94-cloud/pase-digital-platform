/**
 * Automation Engine universal (Fase E1) — API pública y composition root.
 *
 * Motor de automatizaciones que puede automatizar prácticamente cualquier
 * estrategia comercial usando piezas reutilizables: trigger + condiciones (Rule
 * Engine) + acciones (Action Engine) + esperas + variables + eventos. Ninguna
 * automatización contiene lógica fija; todo es configurable por empresa y
 * reutilizable por cualquier industria (Car Wash es la primera).
 *
 * @example
 *   import { createAutomationEngine, UNIVERSAL_AUTOMATION_TEMPLATES, instantiateAutomationTemplate } from '@/lib/automation'
 *   const { service, engine, dispatcher } = createAutomationEngine()
 *   const tpl = UNIVERSAL_AUTOMATION_TEMPLATES.find(t => t.key === 'universal.bienvenida')!
 *   const a = await service.createAutomation(instantiateAutomationTemplate(tpl, companyId))
 *   await service.publishAutomation(a.id)
 *   // Al registrarse un cliente, se despacha el evento y corre la automatización:
 *   await dispatcher.dispatch({ companyId, type: 'cliente.registrado', subjectId: clienteId })
 */

import { prisma } from '@/lib/prisma'
import { createExpressionService } from '@/lib/bel'
import { AutomationEngine } from './application/automation-engine'
import { AutomationService } from './application/automation-service'
import { EventDispatcher, type EventDispatcherOptions } from './application/event-dispatcher'
import {
  ActionEngineDispatcher,
  BelConditionEvaluator,
  RecordingActionSink,
  TriggerVariableResolver,
  type ActionSink,
} from './application/adapters'
import type {
  ActionDispatcher,
  AutomationRepository,
  ConditionEvaluator,
  EventStore,
  VariableResolver,
} from './application/ports'
import { PrismaAutomationRepository } from './infrastructure/prisma-automation-repository'
import { PrismaEventStore } from './infrastructure/prisma-event-store'

export interface CreateAutomationEngineOptions {
  repository?: AutomationRepository
  conditions?: ConditionEvaluator
  actions?: ActionDispatcher
  /** Sink del Action Engine (si no se pasa `actions`). Por defecto: registro. */
  actionSink?: ActionSink
  variables?: VariableResolver
  events?: EventStore
  dispatcher?: EventDispatcherOptions
}

export interface AutomationEngineBundle {
  readonly service: AutomationService
  readonly engine: AutomationEngine
  readonly dispatcher: EventDispatcher
  readonly repository: AutomationRepository
}

/** Composition root: cablea Rule/BEL (condiciones) y Action Engine (acciones). */
export function createAutomationEngine(
  options: CreateAutomationEngineOptions = {},
): AutomationEngineBundle {
  const repository = options.repository ?? new PrismaAutomationRepository(prisma)
  const conditions =
    options.conditions ?? new BelConditionEvaluator(createExpressionService())
  const actions =
    options.actions ??
    new ActionEngineDispatcher(options.actionSink ?? new RecordingActionSink())
  const variables = options.variables ?? new TriggerVariableResolver()
  const events = options.events ?? new PrismaEventStore(prisma)

  const engine = new AutomationEngine({ repo: repository, conditions, actions, variables, events })
  const service = new AutomationService(repository)
  const dispatcher = new EventDispatcher(repository, engine, options.dispatcher)
  return { service, engine, dispatcher, repository }
}

// ── Re-exports públicos ─────────────────────────────────────────────────────
export type {
  Automation, AutomationConfig, AutomationStep, AutomationTrigger, AutomationActionSpec,
  AutomationWait, AutomationLimits, AutomationSchedule, AutomationStatus,
  AutomationRun, AutomationRunStatus, AutomationEvent, EvaluatedRule, ExecutedAction,
  AutomationTriggerType,
} from './domain/types'

export { AUTOMATION_TRIGGERS, automationTrigger } from './domain/triggers'
export type { AutomationTriggerDef } from './domain/triggers'
export { AUTOMATION_EVENTS, AUTOMATION_EVENT_CATALOG } from './domain/events'
export type { AutomationEventType, AutomationEventDef } from './domain/events'
export {
  AUTOMATION_VARIABLE_CATALOG, resolveVariable, interpolate, interpolateParams,
} from './domain/variables'
export type { AutomationVariableDef, VariableContext } from './domain/variables'
export {
  withinWindow, withinLimits, limitWindowStart,
} from './domain/schedule'
export {
  AUTOMATION_METRICS, AUTOMATION_METRIC_CATALOG, DEFAULT_AUTOMATION_METRICS, automationRoi,
} from './domain/metrics'
export type { AutomationMetricKey, AutomationMetricDef, AutomationRoiResult } from './domain/metrics'

export { AutomationEngine } from './application/automation-engine'
export type { AutomationEngineDeps, RunInput, RunOutcome } from './application/automation-engine'
export { AutomationService } from './application/automation-service'
export { EventDispatcher } from './application/event-dispatcher'
export type { DispatchEventInput, EventDispatcherOptions } from './application/event-dispatcher'
export {
  BelConditionEvaluator, ActionEngineDispatcher, RecordingActionSink, TriggerVariableResolver,
} from './application/adapters'
export type { ActionSink } from './application/adapters'
export type {
  AutomationRepository, CreateAutomationData, UpdateAutomationData,
  ConditionEvaluator, ActionDispatcher, VariableResolver, EventStore,
} from './application/ports'

export { instantiateAutomationTemplate } from './templates/types'
export type { AutomationTemplate, InstantiateAutomationOverrides } from './templates/types'
export { UNIVERSAL_AUTOMATION_TEMPLATES, getUniversalAutomation } from './templates/universal'

export { PrismaAutomationRepository } from './infrastructure/prisma-automation-repository'
export { PrismaEventStore } from './infrastructure/prisma-event-store'
export { mapAutomation, mapRun, mapEvent } from './infrastructure/mappers'
