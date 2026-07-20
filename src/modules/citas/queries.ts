import { prisma } from '@/lib/prisma'
import {
  normalizarHorarios,
  slotsDelDia,
  utcDesdeLocal,
  sumarDias,
  diaSemanaDeYmd,
  ymdEnTz,
  type HorarioSemanal,
} from '@/modules/citas/disponibilidad'

/**
 * Módulo de Citas · consultas. Multi-tenant: todo se filtra por companyId.
 */

/** Estados que OCUPAN cupo (cuentan contra los límites por turno y por día). */
export const ESTADOS_ACTIVOS = ['PENDIENTE', 'CONFIRMADA'] as const

export interface AgendaConfigData {
  id: string
  activa: boolean
  duracionMin: number
  maxPorSlot: number
  maxPorDia: number
  anticipacionHoras: number
  ventanaDias: number
  autoConfirmar: boolean
  notas: string | null
  horarios: HorarioSemanal
}

export async function getAgendaConfig(companyId: string): Promise<AgendaConfigData | null> {
  const cfg = await prisma.agendaConfig.findUnique({ where: { companyId } })
  if (!cfg) return null
  return {
    id: cfg.id,
    activa: cfg.activa,
    duracionMin: cfg.duracionMin,
    maxPorSlot: cfg.maxPorSlot,
    maxPorDia: cfg.maxPorDia,
    anticipacionHoras: cfg.anticipacionHoras,
    ventanaDias: cfg.ventanaDias,
    autoConfirmar: cfg.autoConfirmar,
    notas: cfg.notas,
    horarios: normalizarHorarios(cfg.horarios),
  }
}

export interface SlotDisponible {
  hm: string
  inicioIso: string
  /** Cupos libres en el turno (0 = lleno). */
  libres: number
  /** true si el turno ya no admite reserva (pasado/anticipación). */
  vencido: boolean
}

export interface DisponibilidadDia {
  ymd: string
  cerrado: boolean
  limiteDiaAlcanzado: boolean
  slots: SlotDisponible[]
}

/**
 * Disponibilidad de un día: turnos del horario con sus cupos reales.
 * Los límites: `maxPorSlot` por turno y `maxPorDia` por día (0 = sin límite).
 */
export async function getDisponibilidadDia(
  companyId: string,
  cfg: AgendaConfigData,
  ymd: string,
  timeZone: string
): Promise<DisponibilidadDia> {
  const slots = slotsDelDia(cfg.horarios, ymd, cfg.duracionMin, timeZone)
  if (slots.length === 0) {
    return { ymd, cerrado: true, limiteDiaAlcanzado: false, slots: [] }
  }

  const inicioDia = utcDesdeLocal(ymd, '00:00', timeZone)
  const finDia = utcDesdeLocal(sumarDias(ymd, 1), '00:00', timeZone)
  const citas = await prisma.cita.findMany({
    where: {
      companyId,
      estado: { in: [...ESTADOS_ACTIVOS] },
      inicio: { gte: inicioDia, lt: finDia },
    },
    select: { inicio: true },
  })

  const porSlot = new Map<number, number>()
  for (const c of citas) {
    const k = c.inicio.getTime()
    porSlot.set(k, (porSlot.get(k) ?? 0) + 1)
  }
  const limiteDiaAlcanzado = cfg.maxPorDia > 0 && citas.length >= cfg.maxPorDia
  const corte = Date.now() + cfg.anticipacionHoras * 3600_000

  return {
    ymd,
    cerrado: false,
    limiteDiaAlcanzado,
    slots: slots.map((s) => ({
      hm: s.hm,
      inicioIso: s.inicio.toISOString(),
      libres: Math.max(0, cfg.maxPorSlot - (porSlot.get(s.inicio.getTime()) ?? 0)),
      vencido: s.inicio.getTime() < corte,
    })),
  }
}

export interface DiaAgenda {
  ymd: string
  etiquetaCerrado: boolean
}

/** Días reservables de la ventana (hoy → ventanaDias), marcando los cerrados. */
export function diasDeVentana(cfg: AgendaConfigData, timeZone: string): DiaAgenda[] {
  const hoy = ymdEnTz(new Date(), timeZone)
  const out: DiaAgenda[] = []
  for (let i = 0; i < Math.max(1, cfg.ventanaDias); i++) {
    const ymd = sumarDias(hoy, i)
    const abierto = (cfg.horarios[String(diaSemanaDeYmd(ymd, timeZone))] ?? []).length > 0
    out.push({ ymd, etiquetaCerrado: !abierto })
  }
  return out
}

/** Citas del cliente (próximas primero, luego historial reciente). */
export async function getCitasCliente(clienteId: string) {
  return prisma.cita.findMany({
    where: { clienteId },
    include: {
      vehiculo: { select: { marca: true, modelo: true } },
      sucursal: { select: { nombre: true } },
    },
    orderBy: { inicio: 'desc' },
    take: 30,
  })
}

/** Agenda del día para el panel (todas las citas, orden cronológico). */
export async function getCitasDia(companyId: string, ymd: string, timeZone: string) {
  const inicioDia = utcDesdeLocal(ymd, '00:00', timeZone)
  const finDia = utcDesdeLocal(sumarDias(ymd, 1), '00:00', timeZone)
  return prisma.cita.findMany({
    where: { companyId, inicio: { gte: inicioDia, lt: finDia } },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true } },
      vehiculo: { select: { marca: true, modelo: true, color: true } },
      sucursal: { select: { nombre: true } },
      atendidaPor: { select: { name: true } },
    },
    orderBy: { inicio: 'asc' },
  })
}
