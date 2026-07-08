import { prisma } from '@/lib/prisma'

// F4.8: métricas del dashboard ejecutivo de la empresa. Módulo interno.

export interface DashboardEjecutivo {
  clientesTotal: number
  clientesNuevos30d: number
  membresiasActivas: number
  porVencer7d: number
  pagosPendientes: number
  seguidores: number
  nuevosSeguidores30d: number
  referidosCompletados: number
  promosActivas: number
  ingresosEstimadosMes: number
  visitasHoy: number
  visitasMes: number
  clientesEnRiesgo: number
  /** Visitas por día, últimos 14 días (viejo → nuevo). */
  visitasPorDia: { fecha: string; total: number }[]
  /** Top 3 promociones por vistas. */
  topPromos: { id: string; titulo: string; vistas: number; guardadas: number }[]
  /** Actividad reciente (auditoría). */
  actividad: { id: string; accion: string; entidadTipo: string; fecha: Date; autor: string | null }[]
  /** Recomendaciones automáticas basadas en los datos. */
  recomendaciones: { texto: string; href: string; cta: string }[]
}

export async function getDashboardEjecutivo(
  companyId: string
): Promise<DashboardEjecutivo> {
  const now = new Date()
  const hace30dias = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const hace14dias = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const en7dias = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const inicioHoy = new Date(now)
  inicioHoy.setHours(0, 0, 0, 0)
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)

  // Dos lotes de ≤8 queries (antes 16 en un solo Promise.all, que exigía
  // 16 conexiones simultáneas del pool por cada carga del dashboard).
  const [
    clientesTotal,
    clientesNuevos30d,
    membresiasActivas,
    porVencer7d,
    pagosPendientes,
    seguidores,
    nuevosSeguidores30d,
    referidosCompletados,
  ] = await Promise.all([
    prisma.cliente.count({ where: { companyId } }),
    prisma.cliente.count({ where: { companyId, createdAt: { gte: hace30dias } } }),
    prisma.membership.count({ where: { companyId, estado: 'ACTIVA' } }),
    prisma.membership.count({
      where: {
        companyId,
        estado: 'ACTIVA',
        fechaVencimiento: { gte: now, lte: en7dias },
      },
    }),
    prisma.membership.count({
      where: { companyId, estado: { in: ['PENDIENTE', 'PENDIENTE_PAGO'] } },
    }),
    prisma.companyFollow.count({ where: { companyId } }),
    prisma.companyFollow.count({
      where: { companyId, createdAt: { gte: hace30dias } },
    }),
    prisma.referido.count({ where: { companyId, estado: 'COMPLETADO' } }),
  ])

  const [
    promosActivas,
    activasPorPlanGrupos,
    visitasHoy,
    visitasMes,
    clientesEnRiesgo,
    visitasPorDiaRaw,
    topPromosRaw,
    actividadRaw,
  ] = await Promise.all([
    prisma.promocion.count({
      where: { companyId, activo: true, archivada: false },
    }),
    // Agregado en BD: antes se cargaban TODAS las membresías activas (con
    // su plan) solo para sumar precios en memoria.
    prisma.membership.groupBy({
      by: ['planId'],
      where: { companyId, estado: 'ACTIVA' },
      _count: { _all: true },
    }),
    prisma.visit.count({
      where: { cliente: { companyId }, fechaVisita: { gte: inicioHoy } },
    }),
    prisma.visit.count({
      where: { cliente: { companyId }, fechaVisita: { gte: inicioMes } },
    }),
    prisma.cliente.count({
      where: {
        companyId,
        memberships: { some: { estado: 'ACTIVA' } },
        visits: { none: { fechaVisita: { gte: hace30dias } } },
      },
    }),
    // Agrupación por día en la BD: antes se traían todas las visitas de 14
    // días (filas crudas, sin límite) para agruparlas en JS.
    prisma.$queryRaw<{ dia: Date; total: number }[]>`
      SELECT date_trunc('day', v."fechaVisita") AS dia, COUNT(*)::int AS total
      FROM "visits" v
      JOIN "clientes" c ON c."id" = v."clienteId"
      WHERE c."companyId" = ${companyId} AND v."fechaVisita" >= ${hace14dias}
      GROUP BY 1
    `.catch(() => [] as { dia: Date; total: number }[]),
    prisma.promocion.findMany({
      where: { companyId, archivada: false },
      select: {
        id: true,
        titulo: true,
        viewCount: true,
        _count: { select: { guardadaPor: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: 3,
    }),
    prisma.auditLog.findMany({
      where: { companyId },
      select: {
        id: true,
        accion: true,
        entidadTipo: true,
        createdAt: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  // Ingresos estimados = Σ (membresías activas por plan × precio del plan).
  let ingresosEstimadosMes = 0
  if (activasPorPlanGrupos.length > 0) {
    const precios = await prisma.plan.findMany({
      where: { id: { in: activasPorPlanGrupos.map((g) => g.planId) } },
      select: { id: true, precio: true },
    })
    const precioDe = new Map(precios.map((p) => [p.id, Number(p.precio)]))
    ingresosEstimadosMes = activasPorPlanGrupos.reduce(
      (s, g) => s + g._count._all * (precioDe.get(g.planId) ?? 0),
      0
    )
  }

  // Visitas agrupadas por día (14 días), rellenando días sin visitas.
  const porDia = new Map<string, number>()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    porDia.set(d.toISOString().slice(0, 10), 0)
  }
  for (const row of visitasPorDiaRaw) {
    const key = new Date(row.dia).toISOString().slice(0, 10)
    if (porDia.has(key)) porDia.set(key, (porDia.get(key) ?? 0) + row.total)
  }
  const visitasPorDia = [...porDia.entries()].map(([fecha, total]) => ({
    fecha,
    total,
  }))

  const topPromos = topPromosRaw
    .filter((p) => p.viewCount > 0)
    .map((p) => ({
      id: p.id,
      titulo: p.titulo,
      vistas: p.viewCount,
      guardadas: p._count.guardadaPor,
    }))

  const actividad = actividadRaw.map((a) => ({
    id: a.id,
    accion: a.accion,
    entidadTipo: a.entidadTipo,
    fecha: a.createdAt,
    autor: a.user?.name ?? null,
  }))

  // ── Recomendaciones automáticas (BI simple, basado en reglas) ─────────────
  const recomendaciones: DashboardEjecutivo['recomendaciones'] = []
  if (pagosPendientes > 0) {
    recomendaciones.push({
      texto: `Tienes ${pagosPendientes} pago(s) esperando validación — cada hora de espera es un cliente frenado.`,
      href: '/admin/pagos',
      cta: 'Validar pagos',
    })
  }
  if (porVencer7d > 0) {
    recomendaciones.push({
      texto: `${porVencer7d} membresía(s) vencen esta semana. Ejecuta las automatizaciones para recordarles renovar.`,
      href: '/admin/automatizaciones',
      cta: 'Automatizaciones',
    })
  }
  if (clientesEnRiesgo > 0) {
    recomendaciones.push({
      texto: `${clientesEnRiesgo} cliente(s) con membresía activa llevan 30 días sin visitarte. Envíales un incentivo segmentado.`,
      href: '/admin/notificaciones',
      cta: 'Notificar inactivos',
    })
  }
  if (topPromos.length > 0) {
    recomendaciones.push({
      texto: `"${topPromos[0].titulo}" es tu promoción más vista (${topPromos[0].vistas} vistas). Considera duplicarla o extender su vigencia.`,
      href: '/admin/promociones',
      cta: 'Ver promociones',
    })
  }
  if (promosActivas === 0) {
    recomendaciones.push({
      texto: 'No tienes promociones activas: tus seguidores no reciben novedades. Publica una para reactivar el interés.',
      href: '/admin/promociones/nuevo',
      cta: 'Crear promoción',
    })
  }
  if (nuevosSeguidores30d === 0 && seguidores > 0) {
    recomendaciones.push({
      texto: 'Sin seguidores nuevos este mes. Comparte tu página pública o crea una campaña para atraer audiencia.',
      href: '/admin/perfil',
      cta: 'Mi perfil público',
    })
  }

  return {
    clientesTotal,
    clientesNuevos30d,
    membresiasActivas,
    porVencer7d,
    pagosPendientes,
    seguidores,
    nuevosSeguidores30d,
    referidosCompletados,
    promosActivas,
    ingresosEstimadosMes,
    visitasHoy,
    visitasMes,
    clientesEnRiesgo,
    visitasPorDia,
    topPromos,
    actividad,
    recomendaciones,
  }
}
