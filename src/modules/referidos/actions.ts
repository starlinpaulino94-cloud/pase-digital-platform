/**
 * Módulo interno de servidor (sin 'use server'). `procesarReferidoCompletado`
 * otorga recompensas de referido y solo debe llamarse server-to-server desde un
 * flujo ya autorizado (activación de membresía). `getClienteReferidos` se invoca
 * desde un Server Component. Ninguna de las dos debe ser un endpoint público.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logReferralEvent, TIPOS_EMPRESA, TIPOS_GLOBAL } from '@/lib/referidos'

/**
 * Se llama cuando un cliente activa su primera membresía. Si fue referido,
 * marca el referido como completado y evalúa las reglas de recompensa
 * configuradas por el admin (sin lógica de negocio fija en código: todo
 * sale de ReglaRecompensa).
 */
export async function procesarReferidoCompletado(
  clienteId: string,
  companyId: string
) {
  // Centro global MembeGo: si este cliente llegó referido desde OTRA empresa,
  // el referente gana los puntos globales de membresía (una sola vez).
  await procesarMembresiaGlobal(clienteId).catch(() => {})

  try {
    const referido = await prisma.referido.findUnique({
      where: { referidoClienteId: clienteId },
    })
    if (!referido || referido.estado !== 'PENDIENTE') return

    await prisma.referido.update({
      where: { id: referido.id },
      data: { estado: 'COMPLETADO', completadoEn: new Date() },
    })

    // Evento del embudo (+puntos) para el referente.
    await logReferralEvent({
      clienteId: referido.referenteClienteId,
      companyId,
      tipo: 'MEMBRESIA',
      meta: { referidoClienteId: clienteId },
    })

    await prisma.auditLog.create({
      data: {
        companyId,
        accion: 'REFERIDO_COMPLETADO',
        entidadTipo: 'Referido',
        entidadId: referido.id,
        payload: { referenteClienteId: referido.referenteClienteId, referidoClienteId: clienteId },
      },
    })

    await evaluarRecompensas(referido.referenteClienteId, companyId)
  } catch (e) {
    console.error('[referidos] procesarReferidoCompletado error:', e)
  }
}

/**
 * Otorga el evento MEMBRESIA_GLOBAL al referente global (si existe una
 * atribución REGISTRO_GLOBAL para este cliente y aún no se contó su membresía).
 */
async function procesarMembresiaGlobal(referidoClienteId: string) {
  const registroGlobal = await prisma.referralEvent.findFirst({
    where: {
      tipo: 'REGISTRO_GLOBAL',
      meta: { path: ['referidoClienteId'], equals: referidoClienteId },
    },
    orderBy: { createdAt: 'asc' },
  })
  if (!registroGlobal) return

  const yaContada = await prisma.referralEvent.findFirst({
    where: {
      tipo: 'MEMBRESIA_GLOBAL',
      meta: { path: ['referidoClienteId'], equals: referidoClienteId },
    },
    select: { id: true },
  })
  if (yaContada) return

  const meta = (registroGlobal.meta ?? {}) as Record<string, unknown>
  await logReferralEvent({
    clienteId: registroGlobal.clienteId,
    companyId: registroGlobal.companyId,
    tipo: 'MEMBRESIA_GLOBAL',
    meta: {
      global: true,
      referidoClienteId,
      ...(typeof meta.targetCompanyId === 'string'
        ? { targetCompanyId: meta.targetCompanyId }
        : {}),
    },
    // Si el registro fue marcado sospechoso, la membresía tampoco puntúa.
    ...(meta.sospechoso ? { puntos: 0 } : {}),
  })
}

/** Revisa las reglas activas de la empresa y otorga la recompensa si el referente alcanzó la condición. */
async function evaluarRecompensas(referenteClienteId: string, companyId: string) {
  const completados = await prisma.referido.count({
    where: { companyId, referenteClienteId, estado: 'COMPLETADO' },
  })

  const reglas = await prisma.reglaRecompensa.findMany({
    where: {
      companyId,
      activo: true,
      condicion: 'N_REFERIDOS_COMPLETADOS',
      valorCondicion: completados,
    },
  })
  if (reglas.length === 0) return

  const referente = await prisma.cliente.findUnique({
    where: { id: referenteClienteId },
  })
  if (!referente) return

  const referenteUser = await prisma.user.findUnique({
    where: { supabaseId: referente.supabaseId },
    select: { id: true },
  })

  const notificacionesACrear = []

  for (const regla of reglas) {
    let mensaje = ''

    // Validate Number conversion to ensure it's finite
    const valor = Number(regla.valorRecompensa)
    if (!Number.isFinite(valor)) {
      console.error('[referidos] Invalid valorRecompensa:', regla.valorRecompensa)
      continue
    }

    if (regla.tipoRecompensa === 'LAVADOS_GRATIS') {
      // Find active membership in THIS COMPANY for the referrer
      const activa = await prisma.membership.findUnique({
        where: {
          clienteId_companyId: {
            clienteId: referenteClienteId,
            companyId,
          },
        },
      })
      if (activa && activa.estado === 'ACTIVA') {
        await prisma.membership.update({
          where: { id: activa.id },
          data: { lavadosRestantes: { increment: valor } },
        })
        mensaje = `¡Ganaste ${valor} usos gratis por tus referidos! Ya se aplicaron a tu membresía.`
      } else {
        mensaje = `¡Ganaste ${valor} usos gratis por tus referidos! Se aplicarán cuando actives tu próxima membresía en esta empresa.`
      }
    } else if (regla.tipoRecompensa === 'DESCUENTO_PORCENTAJE') {
      mensaje = `¡Ganaste un ${valor}% de descuento por tus referidos! Contacta al negocio para aplicarlo.`
    } else {
      mensaje = `¡Ganaste RD$${valor} de descuento por tus referidos! Contacta al negocio para aplicarlo.`
    }

    await prisma.auditLog.create({
      data: {
        companyId,
        accion: 'RECOMPENSA_OTORGADA',
        entidadTipo: 'ReglaRecompensa',
        entidadId: regla.id,
        payload: { referenteClienteId, reglaId: regla.id, completados },
      },
    })

    if (referenteUser) {
      notificacionesACrear.push({
        userId: referenteUser.id,
        tipo: 'RECOMPENSA_REFERIDO' as const,
        titulo: '¡Recompensa por referidos!',
        mensaje,
        href: '/cliente/referidos',
      })
    }
  }

  if (notificacionesACrear.length > 0) {
    await prisma.notificacion.createMany({
      data: notificacionesACrear,
    }).catch((e) => {
      console.error('[referidos-notifications]', e)
    })
  }

  await prisma.referido.updateMany({
    where: { companyId, referenteClienteId, estado: 'COMPLETADO', recompensaAplicada: false },
    data: { recompensaAplicada: true },
  })
}

export async function getClienteReferidos(clienteId: string) {
  return prisma.referido.findMany({
    where: { referenteClienteId: clienteId },
    include: { referidoCliente: { select: { nombre: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
}

export interface ReferidosDashboard {
  stats: {
    compartidos: number
    clicks: number
    registros: number
    membresias: number
    conversionPct: number // membresías / clics
    recompensas: number
    puntos: number
  }
  historial: {
    id: string
    nombre: string
    fecha: Date
    estado: 'REGISTRADO' | 'MEMBRESIA_ACTIVA' | 'RECOMPENSA_ENTREGADA'
  }[]
  ranking: { posicion: number; nombre: string; puntos: number; esYo: boolean }[]
  miPosicion: number | null
  /** Retos activos de la empresa (reglas de recompensa) con progreso. */
  retos: {
    id: string
    nombre: string
    meta: number
    progreso: number
    recompensa: string
  }[]
  /** Centro global MembeGo (suma de todas tus cuentas). */
  global: { puntos: number; registros: number; membresias: number }
}

const RECOMPENSA_LABEL: Record<string, string> = {
  LAVADOS_GRATIS: 'usos gratis',
  DESCUENTO_PORCENTAJE: '% de descuento',
  DESCUENTO_MONTO: 'RD$ de descuento',
}

/**
 * Panel completo de referidos del cliente: embudo (compartidos → clics →
 * registros → membresías), puntos, historial con estados y ranking de la
 * empresa (aislado por companyId). Server-only.
 */
export async function getReferidosDashboard(
  clienteId: string,
  companyId: string,
  supabaseId: string
): Promise<ReferidosDashboard> {
  const [eventos, referidos, topRaw, reglas, misClientes] = await Promise.all([
    prisma.referralEvent.groupBy({
      by: ['tipo'],
      where: { clienteId, companyId, tipo: { in: TIPOS_EMPRESA } },
      _count: { _all: true },
      _sum: { puntos: true },
    }),
    prisma.referido.findMany({
      where: { referenteClienteId: clienteId, companyId },
      include: { referidoCliente: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.referralEvent.groupBy({
      by: ['clienteId'],
      where: { companyId, tipo: { in: TIPOS_EMPRESA } },
      _sum: { puntos: true },
      orderBy: { _sum: { puntos: 'desc' } },
      take: 50,
    }),
    prisma.reglaRecompensa.findMany({
      where: { companyId, activo: true },
      orderBy: { valorCondicion: 'asc' },
    }),
    prisma.cliente.findMany({
      where: { supabaseId },
      select: { id: true },
    }),
  ])

  // Centro global MembeGo: eventos globales de TODAS tus cuentas.
  const globalAgg = await prisma.referralEvent.groupBy({
    by: ['tipo'],
    where: {
      clienteId: { in: misClientes.map((c) => c.id) },
      tipo: { in: TIPOS_GLOBAL },
    },
    _count: { _all: true },
    _sum: { puntos: true },
  })

  const byTipo = new Map(eventos.map((e) => [e.tipo, e]))
  const compartidos = byTipo.get('SHARE')?._count._all ?? 0
  const clicks = byTipo.get('CLICK')?._count._all ?? 0
  // Registros/membresías: la fuente autoritativa son las filas de Referido, pero
  // SOLO las legítimas. Las sospechosas (autoreferido / huella repetida) se
  // conservan para auditoría pero no inflan el embudo ni la conversión.
  const legitimos = referidos.filter((r) => !r.sospechoso)
  const registros = legitimos.length
  const membresias = legitimos.filter((r) => r.estado === 'COMPLETADO').length
  const recompensas = legitimos.filter((r) => r.recompensaAplicada).length
  const puntos = eventos.reduce((acc, e) => acc + (e._sum.puntos ?? 0), 0)
  const conversionPct = clicks > 0 ? Math.round((membresias / clicks) * 100) : 0

  // Ranking de la empresa (top 5 + posición propia), con nombres.
  const top5 = topRaw.slice(0, 5)
  const nombres = await prisma.cliente.findMany({
    where: { id: { in: top5.map((t) => t.clienteId) } },
    select: { id: true, nombre: true },
  })
  const nombreDe = new Map(nombres.map((n) => [n.id, n.nombre]))
  const ranking = top5.map((t, i) => ({
    posicion: i + 1,
    nombre: nombreDe.get(t.clienteId) ?? 'Cliente',
    puntos: t._sum.puntos ?? 0,
    esYo: t.clienteId === clienteId,
  }))
  const idx = topRaw.findIndex((t) => t.clienteId === clienteId)
  const miPosicion = idx >= 0 ? idx + 1 : null

  const globalPorTipo = new Map(globalAgg.map((g) => [g.tipo, g]))

  return {
    stats: { compartidos, clicks, registros, membresias, conversionPct, recompensas, puntos },
    historial: legitimos.map((r) => ({
      id: r.id,
      nombre: r.referidoCliente.nombre,
      fecha: r.createdAt,
      estado: r.recompensaAplicada
        ? 'RECOMPENSA_ENTREGADA'
        : r.estado === 'COMPLETADO'
          ? 'MEMBRESIA_ACTIVA'
          : 'REGISTRADO',
    })),
    ranking,
    miPosicion,
    retos: reglas.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      meta: r.valorCondicion,
      progreso: Math.min(membresias, r.valorCondicion),
      recompensa: `${Number(r.valorRecompensa)} ${RECOMPENSA_LABEL[r.tipoRecompensa] ?? ''}`.trim(),
    })),
    global: {
      puntos: globalAgg.reduce((acc, g) => acc + (g._sum.puntos ?? 0), 0),
      registros: globalPorTipo.get('REGISTRO_GLOBAL')?._count._all ?? 0,
      membresias: globalPorTipo.get('MEMBRESIA_GLOBAL')?._count._all ?? 0,
    },
  }
}

// ---------------------------------------------------------------------------
// Dashboard ROI del programa de referidos para la empresa (/admin/referidos).
// ---------------------------------------------------------------------------

export interface EmpresaReferidosDashboard {
  kpis: {
    compartidos: number
    clicks: number
    registros: number
    membresias: number
    conversionPct: number
    recompensasEntregadas: number
    ingresosReferidos: number
    sospechosos: number
    embajadoresActivos: number
    embajadoresInactivos: number
  }
  porCanal: { canal: string; clicks: number; compartidos: number }[]
  porCampana: { campana: string; clicks: number }[]
  registrosDiarios: { dia: string; registros: number }[]
  evolucionMensual: { mes: string; registros: number; membresias: number }[]
  topEmbajadores: { nombre: string; puntos: number; registros: number; membresias: number }[]
  topConversion: { nombre: string; clicks: number; membresias: number; pct: number }[]
}

/**
 * Métricas del programa de referidos de la empresa. `companyId` null =
 * superadmin (toda la plataforma). Server-only.
 */
export async function getEmpresaReferidosDashboard(
  companyId: string | null
): Promise<EmpresaReferidosDashboard> {
  const whereRef = companyId ? { companyId } : {}
  const companySql = companyId
    ? Prisma.sql`"companyId" = ${companyId}`
    : Prisma.sql`TRUE`

  const hace30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const hace6m = new Date()
  hace6m.setMonth(hace6m.getMonth() - 5)
  hace6m.setDate(1)

  // Ronda 1: agregaciones independientes. Antes esta función ejecutaba ~9
  // rondas secuenciales, con `distinct` resuelto en memoria (traía todas las
  // filas) y listas de IDs materializadas para contar.
  const [
    eventosTipo,
    referidosTotal,
    membresias,
    recompensadas,
    canalRows,
    topPuntos,
    porClienteTipo,
    activosCountRows,
  ] = await Promise.all([
    prisma.referralEvent.groupBy({
      by: ['tipo'],
      where: { ...whereRef, tipo: { in: TIPOS_EMPRESA } },
      _count: { _all: true },
    }),
    // Solo referidos legítimos cuentan en el embudo (los sospechosos van aparte).
    prisma.referido.count({ where: { ...whereRef, sospechoso: false } }),
    prisma.referido.count({ where: { ...whereRef, estado: 'COMPLETADO', sospechoso: false } }),
    prisma.referido.count({ where: { ...whereRef, recompensaAplicada: true } }),
    prisma.referralEvent.groupBy({
      by: ['tipo', 'canal'],
      where: { ...whereRef, tipo: { in: ['SHARE', 'CLICK'] } },
      _count: { _all: true },
    }),
    prisma.referralEvent.groupBy({
      by: ['clienteId'],
      where: { ...whereRef, tipo: { in: TIPOS_EMPRESA } },
      _sum: { puntos: true },
      orderBy: { _sum: { puntos: 'desc' } },
      take: 5,
    }),
    prisma.referralEvent.groupBy({
      by: ['clienteId', 'tipo'],
      where: { ...whereRef, tipo: { in: ['CLICK', 'MEMBRESIA'] } },
      _count: { _all: true },
    }),
    // COUNT(DISTINCT) en la BD; antes se traían todas las filas para contar.
    prisma.$queryRaw<{ n: bigint }[]>(
      Prisma.sql`SELECT count(DISTINCT "clienteId")::bigint AS n
        FROM "referral_events"
        WHERE ${companySql} AND "createdAt" >= ${hace30d}`
    ),
  ])

  const countTipo = (t: string) =>
    eventosTipo.find((e) => e.tipo === t)?._count._all ?? 0
  const clicks = countTipo('CLICK')

  // Ronda 2: agregados y series (independientes entre sí; antes secuenciales).
  const [ingresosAgg, sospechosos, campanaRows, diariosRows, mensualRows, historicosCountRows] =
    await Promise.all([
      // Ingresos atribuibles: membresías pagadas de clientes que llegaron
      // referidos. Filtro por relación (sin materializar la lista de IDs).
      prisma.membership.aggregate({
        where: {
          pagoConfirmado: true,
          cliente: {
            referidoComo: {
              some: { estado: 'COMPLETADO', ...(companyId ? { companyId } : {}) },
            },
          },
        },
        _sum: { montoPagado: true },
      }),
      // Registros marcados sospechosos por el anti-fraude (huella repetida).
      prisma.referido.count({ where: { ...whereRef, sospechoso: true } }),
      // Clics por campaña (utm_campaign capturado en /r/[code]).
      prisma.$queryRaw<{ campana: string; n: bigint }[]>(
        Prisma.sql`SELECT meta->>'campana' AS campana, count(*)::bigint AS n
          FROM "referral_events"
          WHERE ${companySql} AND tipo = 'CLICK' AND meta->>'campana' IS NOT NULL
          GROUP BY 1 ORDER BY 2 DESC LIMIT 10`
      ),
      // Registros por día (últimos 30 días).
      prisma.$queryRaw<{ dia: Date; n: bigint }[]>(
        Prisma.sql`SELECT date_trunc('day', "createdAt") AS dia, count(*)::bigint AS n
          FROM "referidos" WHERE ${companySql} AND "sospechoso" = false AND "createdAt" >= ${hace30d}
          GROUP BY 1 ORDER BY 1`
      ),
      // Evolución mensual (últimos 6 meses).
      prisma.$queryRaw<{ mes: Date; registros: bigint; membresias: bigint }[]>(
        Prisma.sql`SELECT date_trunc('month', "createdAt") AS mes,
            count(*)::bigint AS registros,
            count(*) FILTER (WHERE estado = 'COMPLETADO')::bigint AS membresias
          FROM "referidos" WHERE ${companySql} AND "sospechoso" = false AND "createdAt" >= ${hace6m}
          GROUP BY 1 ORDER BY 1`
      ),
      prisma.$queryRaw<{ n: bigint }[]>(
        Prisma.sql`SELECT count(DISTINCT "clienteId")::bigint AS n
          FROM "referral_events" WHERE ${companySql}`
      ),
    ])

  const ingresosReferidos = Number(ingresosAgg._sum.montoPagado ?? 0)

  // Nombres + registros/membresías de los tops.
  const clicksPor = new Map<string, number>()
  const membresiasPor = new Map<string, number>()
  for (const r of porClienteTipo) {
    if (r.tipo === 'CLICK') clicksPor.set(r.clienteId, r._count._all)
    if (r.tipo === 'MEMBRESIA') membresiasPor.set(r.clienteId, r._count._all)
  }
  const conversionCandidatos = [...clicksPor.entries()]
    .filter(([, c]) => c >= 5)
    .map(([id, c]) => ({ id, clicks: c, membresias: membresiasPor.get(id) ?? 0 }))
    .map((x) => ({ ...x, pct: Math.round((x.membresias / x.clicks) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)

  const idsNecesarios = [
    ...new Set([...topPuntos.map((t) => t.clienteId), ...conversionCandidatos.map((c) => c.id)]),
  ]

  // Ronda 3: dependen de los tops de la ronda 1.
  const [nombres, referidosPorReferente, completadosPorReferente] = await Promise.all([
    prisma.cliente.findMany({
      where: { id: { in: idsNecesarios } },
      select: { id: true, nombre: true },
    }),
    prisma.referido.groupBy({
      by: ['referenteClienteId'],
      where: { ...whereRef, referenteClienteId: { in: topPuntos.map((t) => t.clienteId) } },
      _count: { _all: true },
    }),
    prisma.referido.groupBy({
      by: ['referenteClienteId'],
      where: {
        ...whereRef,
        estado: 'COMPLETADO',
        referenteClienteId: { in: topPuntos.map((t) => t.clienteId) },
      },
      _count: { _all: true },
    }),
  ])
  const nombreDe = new Map(nombres.map((n) => [n.id, n.nombre]))
  const regDe = new Map(referidosPorReferente.map((r) => [r.referenteClienteId, r._count._all]))
  const memDe = new Map(completadosPorReferente.map((r) => [r.referenteClienteId, r._count._all]))

  // Embajadores: con actividad histórica vs con actividad en los últimos 30 días.
  const embajadoresActivos = Number(activosCountRows[0]?.n ?? 0)
  const embajadoresInactivos = Math.max(
    0,
    Number(historicosCountRows[0]?.n ?? 0) - embajadoresActivos
  )

  const fmtMes = new Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo', month: 'short', year: '2-digit' })
  const fmtDia = new Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo', day: '2-digit', month: 'short' })

  return {
    kpis: {
      compartidos: countTipo('SHARE'),
      clicks,
      registros: referidosTotal,
      membresias,
      conversionPct: clicks > 0 ? Math.round((membresias / clicks) * 100) : 0,
      recompensasEntregadas: recompensadas,
      ingresosReferidos,
      sospechosos,
      embajadoresActivos,
      embajadoresInactivos,
    },
    porCanal: (() => {
      const mapa = new Map<string, { clicks: number; compartidos: number }>()
      for (const r of canalRows) {
        const canal = r.canal ?? 'directo'
        const item = mapa.get(canal) ?? { clicks: 0, compartidos: 0 }
        if (r.tipo === 'CLICK') item.clicks += r._count._all
        else item.compartidos += r._count._all
        mapa.set(canal, item)
      }
      return [...mapa.entries()]
        .map(([canal, v]) => ({ canal, ...v }))
        .sort((a, b) => b.clicks + b.compartidos - (a.clicks + a.compartidos))
    })(),
    porCampana: campanaRows.map((c) => ({ campana: c.campana, clicks: Number(c.n) })),
    registrosDiarios: diariosRows.map((d) => ({ dia: fmtDia.format(d.dia), registros: Number(d.n) })),
    evolucionMensual: mensualRows.map((m) => ({
      mes: fmtMes.format(m.mes),
      registros: Number(m.registros),
      membresias: Number(m.membresias),
    })),
    topEmbajadores: topPuntos.map((t) => ({
      nombre: nombreDe.get(t.clienteId) ?? 'Cliente',
      puntos: t._sum.puntos ?? 0,
      registros: regDe.get(t.clienteId) ?? 0,
      membresias: memDe.get(t.clienteId) ?? 0,
    })),
    topConversion: conversionCandidatos.map((c) => ({
      nombre: nombreDe.get(c.id) ?? 'Cliente',
      clicks: c.clicks,
      membresias: c.membresias,
      pct: c.pct,
    })),
  }
}
