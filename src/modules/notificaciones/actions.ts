'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import type { NotifTipo } from '@prisma/client'

// ── Internal helper (not exported as server action) ──────────────────────────

export async function crearNotificacion(data: {
  userId: string
  tipo: NotifTipo
  titulo: string
  mensaje: string
  href?: string
}) {
  try {
    await prisma.notificacion.create({ data })
  } catch (e) {
    console.error('[notificacion] create error', e)
  }
}

/** Notify all ADMIN_EMPRESA users of a company. */
export async function notificarAdmins(
  companyId: string,
  payload: { tipo: NotifTipo; titulo: string; mensaje: string; href?: string }
) {
  try {
    const admins = await prisma.user.findMany({
      where: { companyId, role: 'ADMIN_EMPRESA' },
      select: { id: true },
    })
    if (admins.length === 0) return
    await prisma.notificacion.createMany({
      data: admins.map((a) => ({ userId: a.id, ...payload })),
    })
  } catch (e) {
    console.error('[notificacion] notificarAdmins error', e)
  }
}

// ── Server actions ────────────────────────────────────────────────────────────

export async function getNotificaciones() {
  const user = await getUser()
  if (!user?.metadata.dbUserId) return []

  return prisma.notificacion.findMany({
    where: { userId: user.metadata.dbUserId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function getUnreadCount(): Promise<number> {
  const user = await getUser()
  if (!user?.metadata.dbUserId) return 0

  return prisma.notificacion.count({
    where: { userId: user.metadata.dbUserId, leida: false },
  })
}

export async function marcarTodasLeidas() {
  const user = await getUser()
  if (!user?.metadata.dbUserId) return

  await prisma.notificacion.updateMany({
    where: { userId: user.metadata.dbUserId, leida: false },
    data: { leida: true },
  })
  revalidatePath('/', 'layout')
}

export async function marcarLeida(id: string) {
  const user = await getUser()
  if (!user?.metadata.dbUserId) return

  await prisma.notificacion.updateMany({
    where: { id, userId: user.metadata.dbUserId },
    data: { leida: true },
  })
}
