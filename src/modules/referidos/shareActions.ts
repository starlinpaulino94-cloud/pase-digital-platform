'use server'

import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logReferralEvent } from '@/lib/referidos'
import { createRateLimiter } from '@/lib/rate-limit'

// Anti-abuso: compartir suma pocos puntos, pero igual se limita para que no se
// pueda "farmear" con clics repetidos al botón.
const shareLimiter = createRateLimiter({
  interval: 60 * 60 * 1000, // 1 hora
  maxRequests: 10,
})

/**
 * Registra que el cliente compartió su enlace (evento SHARE, +puntos).
 * `canal`: native | copy | whatsapp | telegram | facebook | x | email | sms | qr
 */
export async function registrarShare(canal: string): Promise<{ ok: boolean }> {
  try {
    const user = await getUser()
    if (!user || user.metadata.role !== 'CLIENTE' || !user.metadata.clienteId) {
      return { ok: false }
    }
    if (!shareLimiter(`share:${user.metadata.clienteId}`)) {
      return { ok: false }
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: user.metadata.clienteId },
      select: { id: true, companyId: true },
    })
    if (!cliente) return { ok: false }

    const canalLimpio = String(canal).slice(0, 30)
    await logReferralEvent({
      clienteId: cliente.id,
      companyId: cliente.companyId,
      tipo: 'SHARE',
      canal: canalLimpio,
    })
    return { ok: true }
  } catch (e) {
    console.error('[referidos] registrarShare error:', e)
    return { ok: false }
  }
}
