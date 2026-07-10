/**
 * Catálogo ESTÁNDAR de variables (Fase 6).
 *
 * Variables globales definidas en código (companyId null): la base oficial que
 * mapea rutas del Modelo Universal de Contexto (Fase 5) a definiciones tipadas.
 * Incluye ejemplos de variables CALCULADAS (solo el descriptor; sin cálculo).
 * Las variables custom/por-empresa se persisten en BD y se fusionan en runtime.
 */

import { DICTIONARY_CATEGORIES } from './taxonomy'
import type { DataDefinition } from './types'

/** Helper: completa una definición estándar con valores por defecto. */
function std(partial: Partial<DataDefinition> & Pick<DataDefinition,
  'key' | 'displayName' | 'semanticType' | 'category'>): DataDefinition {
  return {
    id: `std:${partial.key}`,
    description: null,
    subcategory: null,
    ownerModule: 'core',
    source: 'CONTEXT',
    contextPath: partial.key, // por convención la clave ES la ruta del contexto
    format: null,
    unit: null,
    aliases: [],
    status: 'ACTIVE',
    version: 1,
    companyId: null,
    validation: {},
    i18n: {},
    calculated: null,
    metadata: {},
    ...partial,
  }
}

export const STANDARD_CATALOG: readonly DataDefinition[] = [
  // ── Sistema (variables dinámicas del Context Model) ──
  std({ key: 'sistema.hora', displayName: 'Hora del día', semanticType: 'INTEGER', category: DICTIONARY_CATEGORIES.HORA, unit: 'h', aliases: ['system.hour'] }),
  std({ key: 'sistema.diaSemana', displayName: 'Día de la semana', semanticType: 'INTEGER', category: DICTIONARY_CATEGORIES.FECHA, aliases: ['system.weekday'] }),
  std({ key: 'sistema.mes', displayName: 'Mes', semanticType: 'INTEGER', category: DICTIONARY_CATEGORIES.FECHA }),
  std({ key: 'sistema.temporada', displayName: 'Temporada', semanticType: 'TEXT', category: DICTIONARY_CATEGORIES.FECHA }),
  std({ key: 'sistema.moneda', displayName: 'Moneda', semanticType: 'TEXT', category: DICTIONARY_CATEGORIES.SISTEMA }),
  std({ key: 'sistema.canal', displayName: 'Canal', semanticType: 'TEXT', category: DICTIONARY_CATEGORIES.SISTEMA, aliases: ['channel'] }),
  std({ key: 'sistema.timestamp', displayName: 'Fecha y hora actual', semanticType: 'DATETIME', category: DICTIONARY_CATEGORIES.SISTEMA }),

  // ── Cliente ──
  std({ key: 'cliente.nombre', displayName: 'Nombre del cliente', semanticType: 'TEXT', category: DICTIONARY_CATEGORIES.CLIENTE, aliases: ['customer.name', 'nombreCliente'] }),
  std({ key: 'cliente.email', displayName: 'Email del cliente', semanticType: 'TEXT', category: DICTIONARY_CATEGORIES.CLIENTE, aliases: ['customer.email'] }),
  std({ key: 'cliente.fechaNacimiento', displayName: 'Fecha de nacimiento', semanticType: 'DATE', category: DICTIONARY_CATEGORIES.CLIENTE, aliases: ['customer.birthdate'] }),
  std({ key: 'cliente.ciudad', displayName: 'Ciudad del cliente', semanticType: 'TEXT', category: DICTIONARY_CATEGORIES.CLIENTE }),
  std({ key: 'cliente.puntos', displayName: 'Puntos del cliente', semanticType: 'INTEGER', category: DICTIONARY_CATEGORIES.PUNTOS, aliases: ['customer.points'], validation: { min: 0 } }),

  // ── Empresa ──
  std({ key: 'empresa.categoria', displayName: 'Categoría de la empresa', semanticType: 'TEXT', category: DICTIONARY_CATEGORIES.EMPRESA, aliases: ['company.category'] }),
  std({ key: 'empresa.moneda', displayName: 'Moneda de la empresa', semanticType: 'TEXT', category: DICTIONARY_CATEGORIES.EMPRESA }),

  // ── Membresía ──
  std({ key: 'membresia.estado', displayName: 'Estado de la membresía', semanticType: 'ENUM', category: DICTIONARY_CATEGORIES.MEMBRESIA, validation: { allowedValues: ['ACTIVA', 'VENCIDA', 'CANCELADA', 'PENDIENTE'] } }),
  std({ key: 'membresia.visitasDisponibles', displayName: 'Visitas disponibles', semanticType: 'INTEGER', category: DICTIONARY_CATEGORIES.MEMBRESIA, validation: { min: 0 } }),
  std({ key: 'membresia.fechaVencimiento', displayName: 'Fecha de vencimiento', semanticType: 'DATE', category: DICTIONARY_CATEGORIES.MEMBRESIA }),

  // ── Compra ──
  std({ key: 'compra.total', displayName: 'Total de la compra', semanticType: 'MONEY', category: DICTIONARY_CATEGORIES.COMPRA, unit: 'currency', aliases: ['purchase.total'], validation: { min: 0 } }),

  // ── Variables calculadas (solo descriptor; sin cálculo todavía) ──
  std({ key: 'cliente.edad', displayName: 'Edad del cliente', semanticType: 'INTEGER', category: DICTIONARY_CATEGORIES.CALCULADAS, source: 'CALCULATED', contextPath: null, unit: 'años', calculated: { kind: 'age', inputs: ['cliente.fechaNacimiento'] } }),
  std({ key: 'cliente.visitasUltimoMes', displayName: 'Visitas del último mes', semanticType: 'INTEGER', category: DICTIONARY_CATEGORIES.CALCULADAS, source: 'CALCULATED', contextPath: null, calculated: { kind: 'visits_last_month' } }),
  std({ key: 'membresia.diasRestantes', displayName: 'Días restantes de membresía', semanticType: 'INTEGER', category: DICTIONARY_CATEGORIES.CALCULADAS, source: 'CALCULATED', contextPath: null, unit: 'días', calculated: { kind: 'days_remaining', inputs: ['membresia.fechaVencimiento'] } }),
  std({ key: 'membresia.antiguedadDias', displayName: 'Antigüedad de la membresía', semanticType: 'INTEGER', category: DICTIONARY_CATEGORIES.CALCULADAS, source: 'CALCULATED', contextPath: null, unit: 'días', calculated: { kind: 'membership_age_days' } }),
]
