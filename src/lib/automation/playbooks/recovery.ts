/**
 * Biblioteca de Automation Playbooks de RECUPERACIÓN (Fase E1.5). Detectan
 * tempranamente la caída de actividad, previenen el abandono y recuperan
 * clientes inactivos con estrategias escalonadas y 100% configurables. No se
 * basan solo en "30 días sin visitar": trabajan con NIVELES DE RIESGO derivados
 * del comportamiento real (frecuencia, gasto, historial, segmento, nivel,
 * membresía) evaluados por el Rule Engine. Estrategias probadas de retención y
 * win-back (Netflix/Spotify/retail/SaaS/CRM) convertidas en playbooks
 * UNIVERSALES instalables sobre el Automation Engine (E1). Reutilizan Rule
 * Engine (condiciones), Action Engine (acciones) y referencian Benefit/
 * Promotion/Membership/Reward/Campaign/Analytics por código. Car Wash es solo la
 * primera industria que las usa.
 *
 * Cada Playbook es una automatización real (`config`) + su documentación
 * completa (24 apartados). Nada hardcodeado por industria: beneficios/promos por
 * código y textos con variables `{{...}}`. La IA se integra vía `INVOKE_MODULE`
 * sin alterar la lógica existente.
 */

import { ACTION_TYPES } from '@/lib/rule-engine'
import { AUTOMATION_EVENTS as EV } from '../domain/events'
import { INDUSTRIES as I } from './types'
import type { AutomationPlaybook } from './types'

const U = I.UNIVERSAL

/**
 * Framework de recuperación: estados universales por los que transita un
 * cliente. Las REGLAS para pasar de un estado a otro son configurables por la
 * empresa vía Rule Engine (umbrales de inactividad/frecuencia/gasto); aquí solo
 * se define el vocabulario reutilizable, no la lógica fija.
 */
export const RECOVERY_STATES = [
  'activo',
  'riesgo_bajo',
  'riesgo_medio',
  'riesgo_alto',
  'inactivo',
  'recuperado',
] as const

export type RecoveryState = (typeof RECOVERY_STATES)[number]

// Configuración editable mínima (Documento Maestro): común a todos.
const EDITABLE = [
  'nombre', 'descripcion', 'triggers', 'reglas', 'nivelesRiesgo', 'tiempoInactividad',
  'segmentos', 'beneficios', 'promociones', 'prioridad', 'variables', 'limites',
  'horarios', 'canales', 'idioma', 'sucursales',
] as const

// KPIs típicos de recuperación / churn.
const REC_KPIS = [
  'tasa_churn', 'tasa_reactivacion', 'clientes_recuperados', 'ingresos_recuperados',
  'renovaciones', 'ltv_recuperado', 'tiempo_a_recuperacion', 'efectividad_por_nivel',
  'tasa_apertura', 'tasa_clic',
] as const

/** Helper: completa los apartados comunes de un playbook de recuperación. */
function pb(
  p: Omit<AutomationPlaybook, 'category' | 'editable' | 'kpis' | 'engines'> &
    Partial<Pick<AutomationPlaybook, 'engines' | 'kpis' | 'editable'>>,
): AutomationPlaybook {
  return {
    category: 'recuperacion',
    editable: p.editable ?? EDITABLE,
    kpis: p.kpis ?? REC_KPIS,
    engines: p.engines ?? ['rule', 'action', 'analytics'],
    ...p,
  }
}

export const RECOVERY_PLAYBOOKS: readonly AutomationPlaybook[] = [
  pb({
    id: 'REC-001',
    name: 'Alerta de riesgo de abandono (preventivo)',
    objective: 'Detectar la caída de frecuencia habitual y arrancar la prevención.',
    problem: 'El abandono se detecta tarde, cuando ya es irreversible.',
    whenToUse: 'Cuando el comportamiento cruza el primer umbral de riesgo.',
    complexity: 'advanced',
    industries: [U],
    triggers: ['Evento: riesgo de abandono'],
    conditions: ['Frecuencia/gasto por debajo del umbral de riesgo bajo'],
    variables: ['cliente.nombre', 'cliente.nivelRiesgo', 'cliente.diasSinActividad'],
    engines: ['rule', 'action', 'benefit', 'campaign', 'analytics'],
    flow: ['Se detecta riesgo', 'Se genera alerta y se marca el nivel', 'Se inicia estrategia preventiva suave', 'Al volver, se emite recuperado'],
    actions: [ACTION_TYPES.RECORD_EVENT, ACTION_TYPES.SEND_PUSH],
    esperas: ['Reevaluación a los N días (editable)'],
    events: [EV.CLIENT_RISK_LEVEL_CHANGED, EV.CLIENT_RECOVERED],
    exceptions: ['Cliente nuevo sin patrón', 'Umbrales no configurados'],
    compatibleBenefits: ['CAR-011'],
    compatiblePromotions: ['REACTIVATION'],
    compatibleCampaigns: ['retencion'],
    dependencies: ['Analytics con scoring de riesgo', 'Reglas de nivel en Rule Engine'],
    compatibleTemplates: [],
    examples: ['Baja la frecuencia habitual → recordatorio amable antes de escalar'],
    notes: 'Primer eslabón del framework de recuperación; no entrega incentivos caros aún.',
    config: {
      trigger: { type: 'EVENT', event: EV.CLIENT_CHURN_RISK },
      variables: ['cliente.nombre', 'cliente.diasSinActividad'],
      channels: ['push', 'email'],
      steps: [
        {
          label: 'Marcar riesgo y avisar',
          actions: [
            { type: ACTION_TYPES.RECORD_EVENT, params: { event: 'riesgo.bajo' } },
            { type: ACTION_TYPES.SEND_PUSH, params: { title: 'Te extrañamos, {{cliente.nombre}}', body: 'Vuelve cuando quieras, te esperamos.' } },
          ],
          chain: { event: EV.CLIENT_RISK_LEVEL_CHANGED },
        },
      ],
    },
  }),

  pb({
    id: 'REC-002',
    name: 'Cliente inactivo (selección de estrategia)',
    objective: 'Detectar inactividad y elegir automáticamente la estrategia de recuperación.',
    problem: 'Aplicar la misma táctica a todos los inactivos convierte poco.',
    whenToUse: 'Cuando el cliente supera el período de inactividad configurado.',
    complexity: 'advanced',
    industries: [U],
    triggers: ['Segmento: inactivo'],
    conditions: ['Sin compras/visitas > tiempo de inactividad'],
    variables: ['cliente.nombre', 'cliente.segmento', 'cliente.ltv'],
    engines: ['rule', 'action', 'benefit', 'promotion', 'campaign', 'analytics'],
    flow: ['Se detecta inactividad', 'Se selecciona la mejor estrategia por perfil', 'Se ejecuta la recuperación', 'Se mide el resultado'],
    actions: [ACTION_TYPES.INVOKE_MODULE, ACTION_TYPES.SEND_WHATSAPP],
    esperas: ['Ventana de recuperación configurable'],
    events: [EV.CLIENT_INACTIVE, EV.CLIENT_RECOVERED],
    exceptions: ['Cliente bloqueado', 'Sin canal de contacto'],
    compatibleBenefits: ['CAR-004', 'CAR-011'],
    compatiblePromotions: ['WINBACK'],
    compatibleCampaigns: ['recuperacion'],
    dependencies: ['Analytics con selector de estrategia', 'Segmentación de inactivos'],
    compatibleTemplates: [],
    examples: ['Inactivo premium → contacto prioritario; inactivo estándar → promo'],
    notes: 'La selección de estrategia se delega a Analytics; el playbook orquesta.',
    config: {
      trigger: { type: 'SEGMENT_ENTER', params: { segment: 'inactivo' } },
      variables: ['cliente.nombre', 'cliente.segmento'],
      channels: ['whatsapp', 'email', 'push'],
      limits: { maxPerSubject: 2, perPeriod: 'MONTH' },
      steps: [
        {
          label: 'Seleccionar y ejecutar estrategia',
          actions: [
            { type: ACTION_TYPES.INVOKE_MODULE, params: { module: 'analytics', action: 'select_recovery_strategy' } },
            { type: ACTION_TYPES.SEND_WHATSAPP, params: { body: '{{cliente.nombre}}, preparamos algo especial para que vuelvas.' } },
          ],
          chain: { event: EV.CLIENT_INACTIVE },
        },
      ],
    },
  }),

  pb({
    id: 'REC-003',
    name: 'Recuperación escalonada por nivel de riesgo',
    objective: 'Aplicar incentivos crecientes según el nivel de riesgo del cliente.',
    problem: 'Regalar de más a quien volvería igual desperdicia margen.',
    whenToUse: 'A lo largo del framework: bajo → medio → alto → inactivo.',
    complexity: 'advanced',
    industries: [U],
    triggers: ['Evento: cambio de nivel de riesgo'],
    conditions: ['Nivel de riesgo actual del cliente'],
    variables: ['cliente.nombre', 'cliente.nivelRiesgo'],
    engines: ['rule', 'action', 'benefit', 'promotion', 'campaign', 'analytics'],
    flow: ['Riesgo bajo: recordatorio', 'Riesgo medio: beneficio', 'Riesgo alto: promoción', 'Inactivo: campaña + contacto prioritario'],
    actions: [ACTION_TYPES.SEND_PUSH, ACTION_TYPES.APPLY_BENEFIT, ACTION_TYPES.APPLY_DISCOUNT_PERCENT],
    esperas: ['Entre escalones, según reevaluación (editable)'],
    events: [EV.CLIENT_RISK_LEVEL_CHANGED, EV.CLIENT_RECOVERED],
    exceptions: ['Nivel no definido'],
    compatibleBenefits: ['CAR-011', 'CAR-004', 'CAR-001'],
    compatiblePromotions: ['REACTIVATION', 'WINBACK'],
    compatibleCampaigns: ['recuperacion'],
    dependencies: ['Rule Engine con niveles de riesgo', 'Benefit/Promotion Engine'],
    compatibleTemplates: [],
    examples: ['Escalera clásica: recordatorio → beneficio → promo → campaña'],
    notes: 'Cada escalón es editable (incentivo, texto, canal); el orden respeta el framework.',
    config: {
      trigger: { type: 'EVENT', event: EV.CLIENT_RISK_LEVEL_CHANGED },
      variables: ['cliente.nombre', 'cliente.nivelRiesgo'],
      channels: ['push', 'email', 'whatsapp'],
      steps: [
        {
          label: 'Riesgo bajo — recordatorio',
          condition: 'cliente.nivelRiesgo == "riesgo_bajo"',
          actions: [{ type: ACTION_TYPES.SEND_PUSH, params: { title: '¿Todo bien, {{cliente.nombre}}?', body: 'Te esperamos pronto.' } }],
        },
        {
          label: 'Riesgo medio — beneficio',
          condition: 'cliente.nivelRiesgo == "riesgo_medio"',
          actions: [{ type: ACTION_TYPES.APPLY_BENEFIT, params: { benefitCode: 'CAR-011' } }],
        },
        {
          label: 'Riesgo alto — promoción',
          condition: 'cliente.nivelRiesgo == "riesgo_alto"',
          actions: [{ type: ACTION_TYPES.APPLY_DISCOUNT_PERCENT, params: { percent: 25 } }],
          chain: { event: EV.CLIENT_RECOVERED },
        },
      ],
    },
  }),

  pb({
    id: 'REC-004',
    name: 'Cliente de alto valor en riesgo (VIP win-back)',
    objective: 'Proteger el ingreso recuperando a clientes de alto LTV en riesgo.',
    problem: 'Perder un cliente de alto valor cuesta mucho más que retenerlo.',
    whenToUse: 'Cuando un cliente de alto LTV comienza a disminuir su actividad.',
    complexity: 'advanced',
    industries: [U],
    triggers: ['Evento: riesgo de abandono', 'Segmento: alto valor en riesgo'],
    conditions: ['LTV alto', 'Actividad en descenso'],
    variables: ['cliente.nombre', 'cliente.ltv'],
    engines: ['rule', 'action', 'benefit', 'membership', 'campaign', 'analytics'],
    flow: ['Se detecta VIP en riesgo', 'Contacto prioritario/personalizado', 'Beneficio diferenciado', 'Seguimiento humano opcional'],
    actions: [ACTION_TYPES.SEND_WHATSAPP, ACTION_TYPES.APPLY_BENEFIT, ACTION_TYPES.SEND_INTERNAL_NOTIFICATION],
    esperas: ['Seguimiento a 48h si no responde (editable)'],
    events: [EV.CLIENT_CHURN_RISK, EV.CLIENT_RECOVERED],
    exceptions: ['No es alto valor', 'Cliente en lista de no contactar'],
    compatibleBenefits: ['CAR-001', 'CAR-003'],
    compatiblePromotions: ['VIP', 'WINBACK'],
    compatibleCampaigns: ['vip', 'recuperacion'],
    dependencies: ['Analytics con LTV', 'Notificación interna al equipo'],
    compatibleTemplates: [],
    examples: ['Hotel: huésped frecuente que deja de reservar → oferta premium personalizada'],
    notes: 'Incluye alerta interna (SEND_INTERNAL_NOTIFICATION) para contacto humano prioritario.',
    config: {
      trigger: { type: 'EVENT', event: EV.CLIENT_CHURN_RISK },
      variables: ['cliente.nombre', 'cliente.ltv'],
      channels: ['whatsapp', 'email'],
      steps: [
        {
          label: 'Win-back VIP',
          condition: 'cliente.ltv >= 500',
          actions: [
            { type: ACTION_TYPES.SEND_INTERNAL_NOTIFICATION, params: { title: 'VIP en riesgo', body: 'Contactar a {{cliente.nombre}} (LTV {{cliente.ltv}}).' } },
            { type: ACTION_TYPES.APPLY_BENEFIT, params: { benefitCode: 'CAR-001' } },
            { type: ACTION_TYPES.SEND_WHATSAPP, params: { body: '{{cliente.nombre}}, valoramos tu preferencia. Tenemos algo especial para ti.' } },
          ],
          chain: { event: EV.CLIENT_RECOVERED },
        },
      ],
    },
  }),

  pb({
    id: 'REC-005',
    name: 'Membresía vencida (renovación)',
    objective: 'Recuperar ingresos recurrentes ofreciendo renovar la membresía.',
    problem: 'Las membresías vencidas no se renuevan sin un empujón oportuno.',
    whenToUse: 'Cuando expira una membresía/suscripción.',
    complexity: 'intermediate',
    industries: [U],
    triggers: ['Evento: membresía vencida'],
    conditions: ['Membresía expirada', 'Sin renovación aún'],
    variables: ['cliente.nombre', 'membresia.plan', 'membresia.diasVencida'],
    engines: ['rule', 'action', 'membership', 'benefit', 'promotion', 'analytics'],
    flow: ['Se detecta expiración', 'Se ofrece renovar con beneficio si corresponde', 'Recordatorio escalonado', 'Al renovar, se registra'],
    actions: [ACTION_TYPES.SEND_EMAIL, ACTION_TYPES.APPLY_DISCOUNT_PERCENT, ACTION_TYPES.RENEW_MEMBERSHIP],
    esperas: ['Recordatorios a 1, 7 y 15 días de vencida (editable)'],
    events: [EV.MEMBERSHIP_EXPIRED, EV.CLIENT_RENEWED],
    exceptions: ['Ya renovó', 'Cliente canceló voluntariamente'],
    compatibleBenefits: ['CAR-001'],
    compatiblePromotions: ['RENEWAL', 'WINBACK'],
    compatibleCampaigns: ['membresias', 'recuperacion'],
    dependencies: ['Membership Engine con estado de expiración'],
    compatibleTemplates: [],
    examples: ['Gimnasio: plan mensual vencido → oferta de renovación', 'Car Wash: plan ilimitado expirado'],
    notes: 'El beneficio de renovación es opcional y editable; escalona recordatorios.',
    config: {
      trigger: { type: 'EVENT', event: EV.MEMBERSHIP_EXPIRED },
      variables: ['cliente.nombre', 'membresia.plan'],
      channels: ['email', 'push', 'whatsapp'],
      steps: [
        {
          label: 'Ofrecer renovación',
          actions: [
            { type: ACTION_TYPES.SEND_EMAIL, params: { subject: 'Tu plan venció, {{cliente.nombre}}', body: 'Renueva tu {{membresia.plan}} y sigue disfrutando.' } },
          ],
          wait: { ms: 604_800_000 },
        },
        {
          label: 'Incentivo de renovación',
          actions: [
            { type: ACTION_TYPES.APPLY_DISCOUNT_PERCENT, params: { percent: 20 } },
            { type: ACTION_TYPES.SEND_WHATSAPP, params: { body: 'Vuelve a tu plan con un descuento especial, {{cliente.nombre}}.' } },
          ],
          chain: { event: EV.CLIENT_RENEWED },
        },
      ],
    },
  }),

  pb({
    id: 'REC-006',
    name: 'Beneficio por vencer sin usar (rescate)',
    objective: 'Rescatar el uso de un beneficio antes de que expire.',
    problem: 'Beneficios que caducan sin usarse no generan visita ni valor.',
    whenToUse: 'Cuando un beneficio del cliente está por vencer sin uso.',
    complexity: 'intermediate',
    industries: [U],
    triggers: ['Evento: beneficio por vencer'],
    conditions: ['Beneficio no usado', 'Próximo a expirar'],
    variables: ['cliente.nombre', 'beneficio.diasRestantes'],
    engines: ['rule', 'action', 'benefit', 'analytics'],
    flow: ['Se detecta beneficio por vencer', 'Recordatorio', 'Extensión configurable o alternativa', 'Al usar, se registra'],
    actions: [ACTION_TYPES.SEND_PUSH, ACTION_TYPES.UPDATE_BENEFIT],
    esperas: ['Recordatorio 48h y 24h antes de expirar (editable)'],
    events: [EV.BENEFIT_EXPIRING, EV.CLIENT_COUPON_USED],
    exceptions: ['Beneficio ya usado', 'Extensión no permitida'],
    compatibleBenefits: ['CAR-004', 'CAR-011'],
    compatiblePromotions: ['REMINDER'],
    compatibleCampaigns: ['recuperacion'],
    dependencies: ['Benefit Engine con expiración y extensión'],
    compatibleTemplates: [],
    examples: ['“Tu beneficio expira en 2 días” + extensión de 3 días si no lo usó'],
    notes: 'Ofrece extensión o alternativa según reglas; complementa FP-002 en fase de recuperación.',
    config: {
      trigger: { type: 'EVENT', event: EV.BENEFIT_EXPIRING },
      variables: ['cliente.nombre', 'beneficio.diasRestantes'],
      channels: ['push', 'whatsapp'],
      steps: [
        {
          label: 'Recordatorio de urgencia',
          actions: [{ type: ACTION_TYPES.SEND_PUSH, params: { title: 'Tu beneficio expira pronto', body: '{{cliente.nombre}}, te quedan {{beneficio.diasRestantes}} días.' } }],
          wait: { ms: 86_400_000 },
        },
        {
          label: 'Extensión o alternativa',
          actions: [
            { type: ACTION_TYPES.UPDATE_BENEFIT, params: { extendDays: 3 } },
            { type: ACTION_TYPES.SEND_PUSH, params: { title: 'Te damos más tiempo', body: 'Extendimos tu beneficio. No lo pierdas.' } },
          ],
          chain: { event: EV.CLIENT_COUPON_USED },
        },
      ],
    },
  }),

  pb({
    id: 'REC-007',
    name: 'Cliente que ignora campañas (cambio de estrategia)',
    objective: 'Cambiar de canal/mensaje cuando el cliente no interactúa.',
    problem: 'Insistir con lo mismo a quien no responde reduce la entregabilidad.',
    whenToUse: 'Cuando el cliente ignora varias campañas seguidas.',
    complexity: 'advanced',
    industries: [U],
    triggers: ['Evento: campaña ignorada'],
    conditions: ['N campañas sin interacción'],
    variables: ['cliente.nombre', 'cliente.campanasIgnoradas'],
    engines: ['rule', 'action', 'campaign', 'analytics'],
    flow: ['Se detecta desinterés', 'Se cambia canal/mensaje/incentivo', 'Se prueba una táctica distinta', 'Se mide la reacción'],
    actions: [ACTION_TYPES.SEND_WHATSAPP, ACTION_TYPES.RECORD_EVENT],
    esperas: ['Cambio tras N campañas ignoradas (editable)'],
    events: [EV.CLIENT_CAMPAIGN_IGNORED, EV.AUTOMATION_FINISHED],
    exceptions: ['Cliente sin campañas dirigidas'],
    compatibleBenefits: ['CAR-011'],
    compatiblePromotions: ['PERSONALIZED'],
    compatibleCampaigns: ['recuperacion', 'personalizacion'],
    dependencies: ['Analytics con tracking de interacción de campañas'],
    compatibleTemplates: [],
    examples: ['Ignora 3 emails → probar WhatsApp con otro ángulo'],
    notes: 'Evita fatiga de canal; cambia de estrategia en lugar de repetir.',
    config: {
      trigger: { type: 'EVENT', event: EV.CLIENT_CAMPAIGN_IGNORED },
      variables: ['cliente.nombre', 'cliente.campanasIgnoradas'],
      channels: ['whatsapp', 'sms'],
      steps: [
        {
          label: 'Cambiar de estrategia',
          condition: 'cliente.campanasIgnoradas >= 3',
          actions: [
            { type: ACTION_TYPES.SEND_WHATSAPP, params: { body: '{{cliente.nombre}}, probemos algo distinto. ¿Te interesa esto?' } },
            { type: ACTION_TYPES.RECORD_EVENT, params: { event: 'estrategia.cambiada' } },
          ],
        },
      ],
    },
  }),

  pb({
    id: 'REC-008',
    name: 'Recuperación basada en comportamiento (mejor táctica)',
    objective: 'Elegir la táctica con mayor probabilidad de éxito por perfil.',
    problem: 'La táctica óptima varía por frecuencia, gasto, nivel y preferencias.',
    whenToUse: 'Para inactivos/en riesgo con datos de comportamiento suficientes.',
    complexity: 'advanced',
    industries: [U],
    triggers: ['Segmento: en riesgo/inactivo con historial'],
    conditions: ['Datos de comportamiento disponibles'],
    variables: ['cliente.nombre', 'cliente.frecuenciaHabitual', 'cliente.gastoHabitual', 'cliente.nivel'],
    engines: ['rule', 'action', 'benefit', 'promotion', 'reward', 'analytics'],
    flow: ['Se analiza el comportamiento', 'Se elige la táctica (beneficio/promo/puntos)', 'Se ejecuta', 'Se mide y aprende'],
    actions: [ACTION_TYPES.INVOKE_MODULE, ACTION_TYPES.SEND_PUSH],
    esperas: ['Reevaluación de la táctica (editable)'],
    events: [EV.CLIENT_RECOVERED, EV.AUTOMATION_FINISHED],
    exceptions: ['Historial insuficiente'],
    compatibleBenefits: ['CAR-004', 'CAR-011', 'CAR-001'],
    compatiblePromotions: ['WINBACK', 'PERSONALIZED'],
    compatibleCampaigns: ['recuperacion'],
    dependencies: ['Analytics con selección de táctica por comportamiento'],
    compatibleTemplates: [],
    examples: ['Sensible a precio → promo; sensible a estatus → puntos/nivel'],
    notes: 'El "mejor incentivo" se calcula fuera del motor (Analytics/IA) y se aplica aquí.',
    config: {
      trigger: { type: 'SEGMENT_ENTER', params: { segment: 'recuperacion_conductual' } },
      variables: ['cliente.nombre', 'cliente.nivel'],
      channels: ['push', 'email', 'whatsapp'],
      steps: [
        {
          label: 'Elegir y ejecutar mejor táctica',
          actions: [
            { type: ACTION_TYPES.INVOKE_MODULE, params: { module: 'analytics', action: 'best_recovery_tactic' } },
            { type: ACTION_TYPES.SEND_PUSH, params: { title: 'Pensamos en ti, {{cliente.nombre}}', body: 'Tenemos justo lo que te gusta.' } },
          ],
          chain: { event: EV.CLIENT_RECOVERED },
        },
      ],
    },
  }),

  pb({
    id: 'REC-009',
    name: 'Recuperación mediante puntos/XP (impulso)',
    objective: 'Reactivar ofreciendo puntos extra, XP, multiplicadores o recompensas temporales.',
    problem: 'A veces basta un impulso de recompensa para provocar el regreso.',
    whenToUse: 'Para clientes sensibles a recompensas/gamificación en riesgo.',
    complexity: 'intermediate',
    industries: [U],
    triggers: ['Evento: riesgo de abandono', 'Segmento: inactivo gamificado'],
    conditions: ['Programa de puntos/XP activo'],
    variables: ['cliente.nombre', 'cliente.puntos'],
    engines: ['rule', 'action', 'reward', 'gamification', 'analytics'],
    flow: ['Se detecta riesgo', 'Se ofrece puntos/multiplicador temporal', 'Al volver, se acreditan', 'Se registra'],
    actions: [ACTION_TYPES.ADD_POINTS, ACTION_TYPES.SEND_PUSH],
    esperas: ['Vigencia del multiplicador configurable'],
    events: [EV.CLIENT_REWARD_OBTAINED, EV.CLIENT_RECOVERED],
    exceptions: ['Programa de puntos desactivado'],
    compatibleBenefits: ['CAR-001'],
    compatiblePromotions: ['POINTS_BOOST'],
    compatibleCampaigns: ['gamificacion', 'recuperacion'],
    dependencies: ['Reward/Gamification Engine con puntos/XP'],
    compatibleTemplates: [],
    examples: ['“Vuelve esta semana y gana puntos dobles”'],
    notes: 'XP ≠ puntos; el multiplicador y su vigencia son editables.',
    config: {
      trigger: { type: 'EVENT', event: EV.CLIENT_CHURN_RISK },
      variables: ['cliente.nombre', 'cliente.puntos'],
      channels: ['push', 'email'],
      steps: [
        {
          label: 'Impulso de puntos',
          actions: [
            { type: ACTION_TYPES.ADD_POINTS, params: { points: 100, temporary: true } },
            { type: ACTION_TYPES.SEND_PUSH, params: { title: 'Puntos de regalo, {{cliente.nombre}}', body: 'Vuelve esta semana y multiplica tus puntos.' } },
          ],
          chain: { event: EV.CLIENT_REWARD_OBTAINED },
        },
      ],
    },
  }),

  pb({
    id: 'REC-010',
    name: 'Recuperación estacional (cumpleaños/aniversario/temporada)',
    objective: 'Aprovechar fechas especiales para reconectar con inactivos.',
    problem: 'Las fechas emotivas son la mejor excusa para volver y no se usan.',
    whenToUse: 'En cumpleaños, aniversario, temporadas o eventos especiales.',
    complexity: 'intermediate',
    industries: [U],
    triggers: ['Fecha del cliente (cumpleaños/aniversario)'],
    conditions: ['Cliente en riesgo/inactivo', 'Fecha especial próxima'],
    variables: ['cliente.nombre', 'cliente.fechaEspecial'],
    engines: ['rule', 'action', 'benefit', 'campaign', 'analytics'],
    flow: ['Llega la fecha especial', 'Se envía felicitación + beneficio', 'Se invita a volver', 'Al volver, se registra'],
    actions: [ACTION_TYPES.SEND_PUSH, ACTION_TYPES.APPLY_BENEFIT],
    esperas: ['En la fecha o días previos (editable)'],
    events: [EV.CLIENT_REWARD_OBTAINED, EV.CLIENT_RECOVERED],
    exceptions: ['Sin fecha registrada', 'Cliente activo (usar otra campaña)'],
    compatibleBenefits: ['CAR-004', 'CAR-001'],
    compatiblePromotions: ['BIRTHDAY', 'SEASONAL'],
    compatibleCampaigns: ['estacional', 'recuperacion'],
    dependencies: ['Fecha del cliente', 'Benefit Engine'],
    compatibleTemplates: ['universal.cumpleanos'],
    examples: ['“¡Feliz cumpleaños! Un regalo para que vuelvas”'],
    notes: 'Usa trigger DATE; combinable con la plantilla universal de cumpleaños.',
    config: {
      trigger: { type: 'DATE', params: { field: 'fechaNacimiento' } },
      variables: ['cliente.nombre'],
      channels: ['push', 'email', 'whatsapp'],
      steps: [
        {
          label: 'Felicitar y regalar',
          actions: [
            { type: ACTION_TYPES.APPLY_BENEFIT, params: { benefitCode: 'CAR-004' } },
            { type: ACTION_TYPES.SEND_PUSH, params: { title: '¡Feliz día, {{cliente.nombre}}!', body: 'Tienes un regalo esperándote. Ven a disfrutarlo.' } },
          ],
          chain: { event: EV.CLIENT_REWARD_OBTAINED },
        },
      ],
    },
  }),

  pb({
    id: 'REC-011',
    name: 'Última oportunidad (win-back final)',
    objective: 'Hacer una oferta fuerte final antes de dar por perdido al cliente.',
    problem: 'Sin un último intento memorable, el churn se vuelve definitivo.',
    whenToUse: 'Cuando el cliente lleva mucho tiempo inactivo pese a intentos previos.',
    complexity: 'advanced',
    industries: [U],
    triggers: ['Segmento: inactivo profundo'],
    conditions: ['Inactividad prolongada', 'Estrategias previas sin éxito'],
    variables: ['cliente.nombre'],
    engines: ['rule', 'action', 'benefit', 'promotion', 'campaign', 'analytics'],
    flow: ['Se identifica al inactivo profundo', 'Se envía la mejor oferta final', 'Si no responde, se marca como perdido/dormido', 'Se mide'],
    actions: [ACTION_TYPES.APPLY_DISCOUNT_PERCENT, ACTION_TYPES.SEND_EMAIL, ACTION_TYPES.RECORD_EVENT],
    esperas: ['Cierre del intento tras N días sin respuesta (editable)'],
    events: [EV.CLIENT_RECOVERED, EV.AUTOMATION_FINISHED],
    exceptions: ['Cliente pidió no ser contactado'],
    compatibleBenefits: ['CAR-001', 'CAR-004'],
    compatiblePromotions: ['WINBACK', 'LASTCHANCE'],
    compatibleCampaigns: ['recuperacion'],
    dependencies: ['Segmentación de inactivos profundos'],
    compatibleTemplates: [],
    examples: ['“Te queremos de vuelta: 40% en tu próxima visita, solo esta semana”'],
    notes: 'Oferta más agresiva reservada al final del embudo; respeta límites y opt-out.',
    config: {
      trigger: { type: 'SEGMENT_ENTER', params: { segment: 'inactivo_profundo' } },
      variables: ['cliente.nombre'],
      channels: ['email', 'whatsapp'],
      limits: { maxPerSubject: 1, perPeriod: 'YEAR' },
      steps: [
        {
          label: 'Oferta final',
          actions: [
            { type: ACTION_TYPES.APPLY_DISCOUNT_PERCENT, params: { percent: 40 } },
            { type: ACTION_TYPES.SEND_EMAIL, params: { subject: 'Te queremos de vuelta, {{cliente.nombre}}', body: 'Una oferta especial, solo por esta semana.' } },
          ],
          wait: { ms: 604_800_000 },
        },
        {
          label: 'Cerrar intento',
          actions: [{ type: ACTION_TYPES.RECORD_EVENT, params: { event: 'recuperacion.cerrada' } }],
        },
      ],
    },
  }),

  pb({
    id: 'REC-012',
    name: 'Reingreso confirmado (celebrar recuperación)',
    objective: 'Reconocer al cliente recuperado y reengancharlo al journey activo.',
    problem: 'Recuperar y no reforzar hace que el cliente recaiga.',
    whenToUse: 'Cuando un cliente en riesgo/inactivo vuelve a comprar/visitar.',
    complexity: 'intermediate',
    industries: [U],
    triggers: ['Evento: cliente recuperado'],
    conditions: ['El cliente venía de riesgo/inactivo y volvió'],
    variables: ['cliente.nombre'],
    engines: ['rule', 'action', 'reward', 'campaign', 'analytics'],
    flow: ['Se confirma el reingreso', 'Se agradece y recompensa', 'Se restablece el estado a activo', 'Se reengancha al journey de frecuencia'],
    actions: [ACTION_TYPES.ADD_POINTS, ACTION_TYPES.SEND_PUSH, ACTION_TYPES.RECORD_EVENT],
    esperas: [],
    events: [EV.CLIENT_RECOVERED, EV.CLIENT_REWARD_OBTAINED],
    exceptions: ['No venía de riesgo/inactivo'],
    compatibleBenefits: ['CAR-001'],
    compatiblePromotions: [],
    compatibleCampaigns: ['fidelizacion'],
    dependencies: ['Estado de recuperación en el contexto'],
    compatibleTemplates: [],
    examples: ['“¡Qué bueno tenerte de vuelta! Aquí tienes una recompensa”'],
    notes: 'Cierra el ciclo del framework (estado → recuperado → activo) y evita recaídas.',
    config: {
      trigger: { type: 'EVENT', event: EV.CLIENT_RECOVERED },
      variables: ['cliente.nombre'],
      channels: ['push', 'email'],
      steps: [
        {
          label: 'Celebrar reingreso',
          actions: [
            { type: ACTION_TYPES.ADD_POINTS, params: { points: 50 } },
            { type: ACTION_TYPES.SEND_PUSH, params: { title: '¡Qué bueno tenerte de vuelta, {{cliente.nombre}}!', body: 'Aquí tienes una recompensa de bienvenida.' } },
            { type: ACTION_TYPES.RECORD_EVENT, params: { event: 'estado.activo' } },
          ],
          chain: { event: EV.CLIENT_REWARD_OBTAINED },
        },
      ],
    },
  }),

  pb({
    id: 'REC-013',
    name: 'Encuesta de motivo de abandono (aprender)',
    objective: 'Entender por qué el cliente se aleja para mejorar la recuperación.',
    problem: 'Sin conocer el motivo, las tácticas de recuperación son a ciegas.',
    whenToUse: 'Para inactivos/en riesgo antes o junto a una oferta.',
    complexity: 'basic',
    industries: [U],
    triggers: ['Segmento: en riesgo/inactivo'],
    conditions: ['Sin encuesta de abandono respondida'],
    variables: ['cliente.nombre'],
    engines: ['rule', 'action', 'analytics', 'campaign'],
    flow: ['Se invita a una encuesta breve', 'Se registra el motivo', 'Se ajusta la estrategia de recuperación'],
    actions: [ACTION_TYPES.SEND_EMAIL, ACTION_TYPES.RECORD_EVENT],
    esperas: ['Recordatorio único (editable)'],
    events: [EV.CLIENT_FEEDBACK_GIVEN],
    exceptions: ['Encuesta ya respondida', 'Opt-out de comunicaciones'],
    compatibleBenefits: ['CAR-011'],
    compatiblePromotions: [],
    compatibleCampaigns: ['recuperacion', 'satisfaccion'],
    dependencies: ['Módulo de encuestas'],
    compatibleTemplates: [],
    examples: ['“¿Qué podemos mejorar?” con incentivo por responder'],
    notes: 'El motivo alimenta el selector de estrategia (REC-002/REC-008).',
    config: {
      trigger: { type: 'SEGMENT_ENTER', params: { segment: 'en_riesgo' } },
      variables: ['cliente.nombre'],
      channels: ['email', 'push'],
      steps: [
        {
          label: 'Preguntar motivo',
          actions: [
            { type: ACTION_TYPES.SEND_EMAIL, params: { subject: '¿Cómo podemos mejorar, {{cliente.nombre}}?', body: 'Cuéntanos en 1 minuto y te lo agradecemos.' } },
            { type: ACTION_TYPES.RECORD_EVENT, params: { event: 'encuesta_abandono.enviada' } },
          ],
          chain: { event: EV.CLIENT_FEEDBACK_GIVEN },
        },
      ],
    },
  }),

  pb({
    id: 'REC-014',
    name: 'Recuperación de suscripción por fallo de pago (dunning)',
    objective: 'Recuperar suscripciones perdidas por pagos fallidos.',
    problem: 'El churn involuntario por pago fallido pierde ingresos evitables.',
    whenToUse: 'Cuando un cobro de membresía falla.',
    complexity: 'advanced',
    industries: [U],
    triggers: ['Evento: membresía vencida (por fallo de pago)'],
    conditions: ['Pago fallido', 'Suscripción activa antes del fallo'],
    variables: ['cliente.nombre', 'membresia.plan'],
    engines: ['rule', 'action', 'membership', 'analytics'],
    flow: ['Se detecta el fallo de pago', 'Reintentos y avisos escalonados', 'Se facilita actualizar el método de pago', 'Al pagar, se reactiva'],
    actions: [ACTION_TYPES.SEND_EMAIL, ACTION_TYPES.SEND_SMS, ACTION_TYPES.RENEW_MEMBERSHIP],
    esperas: ['Reintentos a 1, 3 y 7 días (editable)'],
    events: [EV.MEMBERSHIP_EXPIRED, EV.CLIENT_RENEWED],
    exceptions: ['Cliente canceló a propósito', 'Método de pago eliminado'],
    compatibleBenefits: [],
    compatiblePromotions: ['RENEWAL'],
    compatibleCampaigns: ['membresias', 'recuperacion'],
    dependencies: ['Integración de cobros/reintentos', 'Membership Engine'],
    compatibleTemplates: [],
    examples: ['SaaS/suscripción: tarjeta rechazada → secuencia de dunning'],
    notes: 'Churn involuntario: prioriza facilitar el pago, sin incentivos innecesarios.',
    config: {
      trigger: { type: 'EVENT', event: EV.MEMBERSHIP_EXPIRED },
      variables: ['cliente.nombre', 'membresia.plan'],
      channels: ['email', 'sms', 'push'],
      steps: [
        {
          label: 'Aviso de pago fallido',
          condition: 'membresia.motivoVencimiento == "pago_fallido"',
          actions: [{ type: ACTION_TYPES.SEND_EMAIL, params: { subject: 'No pudimos procesar tu pago, {{cliente.nombre}}', body: 'Actualiza tu método para no perder tu {{membresia.plan}}.' } }],
          wait: { ms: 259_200_000 },
        },
        {
          label: 'Reintento final',
          condition: 'membresia.motivoVencimiento == "pago_fallido"',
          actions: [{ type: ACTION_TYPES.SEND_SMS, params: { body: 'Último aviso: actualiza tu pago para conservar tu plan.' } }],
          chain: { event: EV.CLIENT_RENEWED },
        },
      ],
    },
  }),

  pb({
    id: 'REC-015',
    name: 'Recuperación predictiva con IA (priorización)',
    objective: 'Priorizar y personalizar la recuperación con modelos predictivos.',
    problem: 'Sin priorización, se gasta esfuerzo en quien no volvería igual.',
    whenToUse: 'Cuando la arquitectura de IA/predicción esté disponible.',
    complexity: 'advanced',
    industries: [U],
    triggers: ['Programado (scoring recurrente)'],
    conditions: ['Modelo disponible', 'Probabilidad de recuperación dentro del rango accionable'],
    variables: ['cliente.nombre', 'cliente.probAbandono', 'cliente.probRecuperacion'],
    engines: ['rule', 'action', 'analytics', 'benefit', 'campaign'],
    flow: ['Se calcula probabilidad de abandono y de recuperación', 'Se prioriza y elige el mejor incentivo', 'Se ejecuta según prioridad', 'Se mide'],
    actions: [ACTION_TYPES.INVOKE_MODULE, ACTION_TYPES.APPLY_BENEFIT, ACTION_TYPES.SEND_WHATSAPP],
    esperas: ['Scoring recurrente (editable)'],
    events: [EV.CLIENT_CHURN_RISK, EV.CLIENT_RECOVERED],
    exceptions: ['Modelo no disponible (se omite sin error)', 'Baja probabilidad de recuperación'],
    compatibleBenefits: ['CAR-004', 'CAR-001'],
    compatiblePromotions: ['PREDICTIVE', 'WINBACK'],
    compatibleCampaigns: ['ia', 'recuperacion'],
    dependencies: ['Motor de IA/predicción (integrable vía INVOKE_MODULE sin cambiar la lógica)'],
    compatibleTemplates: [],
    examples: ['Alta prob. de recuperación + alto LTV → prioridad e incentivo óptimo'],
    notes: 'Diseñado para conectar con la futura IA sin modificar el motor: scores e incentivos por INVOKE_MODULE.',
    config: {
      trigger: { type: 'SCHEDULE', schedule: '0 7 * * *' },
      variables: ['cliente.nombre', 'cliente.probRecuperacion'],
      channels: ['whatsapp', 'email'],
      steps: [
        {
          label: 'Priorizar y recuperar',
          condition: 'cliente.probRecuperacion >= 0.4',
          actions: [
            { type: ACTION_TYPES.INVOKE_MODULE, params: { module: 'ai', action: 'best_recovery_incentive' } },
            { type: ACTION_TYPES.APPLY_BENEFIT, params: { benefitCode: 'CAR-004' } },
            { type: ACTION_TYPES.SEND_WHATSAPP, params: { body: '{{cliente.nombre}}, tenemos justo lo que necesitas para volver.' } },
          ],
          chain: { event: EV.CLIENT_RECOVERED },
        },
      ],
    },
  }),

  pb({
    id: 'REC-016',
    name: 'Reactivación de exmiembros (downgrade a gratuito)',
    objective: 'Mantener el vínculo con quien canceló, ofreciendo un plan de entrada.',
    problem: 'Un exmiembro perdido por completo es más difícil de recuperar.',
    whenToUse: 'Cuando el cliente cancela su membresía.',
    complexity: 'intermediate',
    industries: [U],
    triggers: ['Evento: cliente canceló'],
    conditions: ['Membresía cancelada', 'Sin plan activo'],
    variables: ['cliente.nombre'],
    engines: ['rule', 'action', 'membership', 'benefit', 'campaign', 'analytics'],
    flow: ['Se detecta la cancelación', 'Se ofrece un plan de entrada/gratuito o pausa', 'Se mantiene contacto de valor', 'Al reactivar, se registra'],
    actions: [ACTION_TYPES.SEND_EMAIL, ACTION_TYPES.APPLY_BENEFIT],
    esperas: ['Seguimiento a 15 y 30 días (editable)'],
    events: [EV.CLIENT_CANCELLED, EV.CLIENT_RECOVERED],
    exceptions: ['Cliente pidió no ser contactado'],
    compatibleBenefits: ['CAR-011'],
    compatiblePromotions: ['DOWNGRADE', 'WINBACK'],
    compatibleCampaigns: ['membresias', 'recuperacion'],
    dependencies: ['Membership Engine con plan de entrada/pausa'],
    compatibleTemplates: [],
    examples: ['“¿No es el momento del plan completo? Prueba el plan básico”'],
    notes: 'Reduce la fricción: en vez de perder al cliente, baja de escalón para conservarlo.',
    config: {
      trigger: { type: 'EVENT', event: EV.CLIENT_CANCELLED },
      variables: ['cliente.nombre'],
      channels: ['email', 'push'],
      steps: [
        {
          label: 'Ofrecer plan de entrada',
          actions: [
            { type: ACTION_TYPES.SEND_EMAIL, params: { subject: 'Nos gustaría que te quedes, {{cliente.nombre}}', body: 'Si el plan completo no es para ahora, prueba una opción más ligera.' } },
            { type: ACTION_TYPES.APPLY_BENEFIT, params: { benefitCode: 'CAR-011' } },
          ],
          wait: { ms: 1_296_000_000 },
          chain: { event: EV.CLIENT_RECOVERED },
        },
      ],
    },
  }),
]

/** Lista mutable de los playbooks de recuperación (para composición). */
export function recoveryPlaybooks(): AutomationPlaybook[] {
  return [...RECOVERY_PLAYBOOKS]
}

/** Busca un playbook de recuperación por su ID (ej. "REC-001"). */
export function getRecoveryPlaybook(id: string): AutomationPlaybook | undefined {
  return RECOVERY_PLAYBOOKS.find((p) => p.id === id)
}
