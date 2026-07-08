import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { logReferralEvent, hashIp, REF_COOKIE } from '@/lib/referidos'

/**
 * Atribución de referidos al momento del registro (por contraseña u OAuth).
 * Extraído a un módulo compartido para que el registro clásico y el alta por
 * Google usen exactamente la misma lógica anti-fraude y de puntos.
 */

/**
 * Anti-fraude: ¿esta huella de IP ya generó registros para este referente en
 * los últimos 7 días? Si sí, el evento se marca sospechoso y no suma puntos
 * (el vínculo se crea igual para que el admin pueda auditarlo).
 */
async function esRegistroSospechoso(
  referenteClienteId: string,
  ipHashValor: string | null,
  tipo: 'REGISTRO' | 'REGISTRO_GLOBAL'
): Promise<boolean> {
  if (!ipHashValor) return false
  try {
    const hace7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const repetidos = await prisma.referralEvent.count({
      where: {
        clienteId: referenteClienteId,
        tipo,
        createdAt: { gte: hace7d },
        meta: { path: ['ipHash'], equals: ipHashValor },
      },
    })
    return repetidos >= 2
  } catch {
    return false
  }
}

/**
 * Atribuye el registro a un referente. El código puede venir del formulario
 * (?ref= de la empresa) o de la cookie del Centro global MembeGo (/r/CODE).
 * - Misma empresa: crea el Referido + evento REGISTRO.
 * - Otra empresa de la plataforma: evento REGISTRO_GLOBAL (puntos MembeGo).
 * Nunca lanza: la atribución jamás rompe el registro.
 */
export async function vincularReferido(
  refCode: string,
  companyId: string,
  referidoClienteId: string,
  ipAddress: string | null
) {
  try {
    let code = refCode
    if (!code) {
      const cookieStore = await cookies()
      code = cookieStore.get(REF_COOKIE)?.value ?? ''
    }
    if (!code) return

    const referente = await prisma.cliente.findUnique({
      where: { codigoReferido: code },
    })
    if (!referente) return
    // Anti-abuso: nadie puede referirse a sí mismo.
    if (referente.id === referidoClienteId) return

    const huella = hashIp(ipAddress)

    if (referente.companyId === companyId) {
      // Programa de la empresa.
      const sospechoso = await esRegistroSospechoso(referente.id, huella, 'REGISTRO')
      await prisma.referido.create({
        data: {
          companyId,
          referenteClienteId: referente.id,
          referidoClienteId,
        },
      })
      await logReferralEvent({
        clienteId: referente.id,
        companyId,
        tipo: 'REGISTRO',
        meta: { referidoClienteId, ipHash: huella, ...(sospechoso ? { sospechoso: true } : {}) },
        ...(sospechoso ? { puntos: 0 } : {}),
      })
      return
    }

    // Centro global MembeGo: el referido se unió a OTRA empresa.
    const sospechoso = await esRegistroSospechoso(referente.id, huella, 'REGISTRO_GLOBAL')
    await logReferralEvent({
      clienteId: referente.id,
      companyId: referente.companyId,
      tipo: 'REGISTRO_GLOBAL',
      meta: {
        global: true,
        targetCompanyId: companyId,
        referidoClienteId,
        ipHash: huella,
        ...(sospechoso ? { sospechoso: true } : {}),
      },
      ...(sospechoso ? { puntos: 0 } : {}),
    })
  } catch (e) {
    console.error('[referidos] vincularReferido error:', e)
  }
}
