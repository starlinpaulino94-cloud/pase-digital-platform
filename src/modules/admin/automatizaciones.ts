import { prisma } from '@/lib/prisma'

// F4.7: motor de automatizaciones. Reglas basadas en tiempo que generan
// notificaciones a clientes. Sin tablas nuevas: la deduplicación usa un
// marcador único en `href` (si ya existe una notificación con ese href para
// el usuario, la regla no se repite).
// Módulo interno sin 'use server' — se invoca desde una action guarded y
// desde el endpoint de cron protegido.

export interface ResultadoAutomatizaciones {
  cumpleanos: number
  porVencer: number
  inactivos: number
}

/** userIds por supabaseId de clientes (solo los que tienen cuenta). */
async function mapaUserIds(supabaseIds: string[]): Promise<Map<string, string>> {
  if (supabaseIds.length === 0) return new Map()
  const users = await prisma.user.findMany({
    where: { supabaseId: { in: [...new Set(supabaseIds)] } },
    select: { id: true, supabaseId: true },
  })
  return new Map(users.map((u) => [u.supabaseId, u.id]))
}

interface NotifPendiente {
  userId: string
  tipo: 'SISTEMA' | 'MEMBRESIA_POR_VENCER'
  titulo: string
  mensaje: string
  href: string
}

/**
 * Crea en lote las notificaciones cuyo par (userId, href) no exista aún.
 * 2 queries por lote (antes: findFirst + create POR USUARIO, es decir,
 * 2×clientes round-trips que retenían conexiones durante todo el cron).
 */
async function notificarLote(items: NotifPendiente[]): Promise<number> {
  if (items.length === 0) return 0
  const existentes = await prisma.notificacion.findMany({
    where: {
      userId: { in: [...new Set(items.map((i) => i.userId))] },
      href: { in: [...new Set(items.map((i) => i.href))] },
    },
    select: { userId: true, href: true },
  })
  const ya = new Set(existentes.map((e) => `${e.userId}|${e.href}`))
  const nuevos = items.filter((i) => !ya.has(`${i.userId}|${i.href}`))
  if (nuevos.length === 0) return 0
  const res = await prisma.notificacion.createMany({ data: nuevos })
  return res.count
}

/**
 * Ejecuta las 3 reglas de automatización para una empresa. Idempotente:
 * puede correrse cuantas veces se quiera sin duplicar avisos.
 */
export async function ejecutarAutomatizacionesEmpresa(
  companyId: string
): Promise<ResultadoAutomatizaciones> {
  const now = new Date()
  const hoyMes = now.getMonth()
  const hoyDia = now.getDate()
  const anio = now.getFullYear()
  const en7dias = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const hace30dias = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  })
  if (!company) return { cumpleanos: 0, porVencer: 0, inactivos: 0 }

  let cumpleanos = 0
  let porVencer = 0
  let inactivos = 0

  // ── Regla 1: cumpleaños hoy → felicitación (una vez por año) ──────────────
  const conNacimiento = await prisma.cliente.findMany({
    where: { companyId, fechaNacimiento: { not: null } },
    select: { supabaseId: true, fechaNacimiento: true },
  })
  const cumpleaneros = conNacimiento.filter((c) => {
    const f = new Date(c.fechaNacimiento!)
    return f.getMonth() === hoyMes && f.getDate() === hoyDia
  })
  if (cumpleaneros.length > 0) {
    const usuarios = await mapaUserIds(cumpleaneros.map((c) => c.supabaseId))
    cumpleanos = await notificarLote(
      cumpleaneros.flatMap((c) => {
        const userId = usuarios.get(c.supabaseId)
        if (!userId) return []
        return [{
          userId,
          tipo: 'SISTEMA' as const,
          titulo: `¡Feliz cumpleaños! 🎉`,
          mensaje: `${company.name} te desea un excelente día. Revisa tus promociones: puede haber un detalle para ti.`,
          // companyId en el marcador: un cliente con cuenta en varias empresas
          // debe recibir la felicitación de CADA una (el dedupe es por userId+href).
          href: `/cliente/promociones?auto=cumple-${anio}-${companyId}`,
        }]
      })
    )
  }

  // ── Regla 2: membresía por vencer (7 días) → recordatorio ─────────────────
  const proximasAVencer = await prisma.membership.findMany({
    where: {
      companyId,
      estado: 'ACTIVA',
      fechaVencimiento: { gte: now, lte: en7dias },
    },
    select: {
      id: true,
      fechaVencimiento: true,
      cliente: { select: { supabaseId: true } },
    },
  })
  if (proximasAVencer.length > 0) {
    const usuarios = await mapaUserIds(proximasAVencer.map((m) => m.cliente.supabaseId))
    porVencer = await notificarLote(
      proximasAVencer.flatMap((m) => {
        const userId = usuarios.get(m.cliente.supabaseId)
        if (!userId || !m.fechaVencimiento) return []
        const fechaStr = new Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo', dateStyle: 'long' }).format(
          m.fechaVencimiento
        )
        const marca = m.fechaVencimiento.toISOString().slice(0, 10)
        return [{
          userId,
          tipo: 'MEMBRESIA_POR_VENCER' as const,
          titulo: 'Tu membresía está por vencer',
          mensaje: `Tu membresía en ${company.name} vence el ${fechaStr}. Renuévala para no perder tus beneficios.`,
          href: `/cliente/pagos?auto=vence-${m.id}-${marca}`,
        }]
      })
    )
  }

  // ── Regla 3: sin visitas en 30 días → incentivo (una vez al mes) ──────────
  const inactivosRows = await prisma.cliente.findMany({
    where: {
      companyId,
      memberships: { some: { estado: 'ACTIVA' } },
      visits: { none: { fechaVisita: { gte: hace30dias } } },
    },
    select: { supabaseId: true },
  })
  if (inactivosRows.length > 0) {
    const usuarios = await mapaUserIds(inactivosRows.map((c) => c.supabaseId))
    const mes = String(now.getMonth() + 1).padStart(2, '0')
    inactivos = await notificarLote(
      inactivosRows.flatMap((c) => {
        const userId = usuarios.get(c.supabaseId)
        if (!userId) return []
        return [{
          userId,
          tipo: 'SISTEMA' as const,
          titulo: 'Te extrañamos 👋',
          mensaje: `Hace más de 30 días que no visitas ${company.name}. Tu membresía sigue activa: pásate y aprovecha tus beneficios.`,
          // companyId en el marcador: el incentivo mensual es por empresa.
          href: `/cliente/promociones?auto=inactivo-${anio}-${mes}-${companyId}`,
        }]
      })
    )
  }

  return { cumpleanos, porVencer, inactivos }
}

/** Ejecuta las automatizaciones para todas las empresas activas (cron). */
export async function ejecutarAutomatizacionesGlobal(): Promise<
  { companyId: string; resultado: ResultadoAutomatizaciones }[]
> {
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    select: { id: true },
  })
  const resultados = []
  for (const c of companies) {
    try {
      resultados.push({
        companyId: c.id,
        resultado: await ejecutarAutomatizacionesEmpresa(c.id),
      })
    } catch (e) {
      console.error('[automatizaciones] empresa', c.id, e)
    }
  }
  return resultados
}
