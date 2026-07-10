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
    // Un segundo registro desde la MISMA huella de red en 7 días ya es
    // sospechoso: es el patrón típico de autoreferido (el mismo dispositivo
    // creando varias cuentas con el propio enlace).
    return repetidos >= 1
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
 *
 * `permitirCookie: false` para afiliaciones de usuarios EXISTENTES: la cookie
 * silenciosa (30 días) solo debe atribuir cuentas realmente nuevas; una cuenta
 * vieja uniéndose a otra empresa solo cuenta si llegó con ?ref explícito.
 */
export async function vincularReferido(
  refCode: string,
  companyId: string,
  referidoClienteId: string,
  ipAddress: string | null,
  opts?: { permitirCookie?: boolean }
) {
  try {
    let code = refCode
    let viaCookie = false
    if (!code && (opts?.permitirCookie ?? true)) {
      const cookieStore = await cookies()
      code = cookieStore.get(REF_COOKIE)?.value ?? ''
      viaCookie = !!code
    }
    if (!code) return

    const referente = await prisma.cliente.findUnique({
      where: { codigoReferido: code },
    })
    if (!referente) return

    // Anti-abuso: nadie puede referirse a sí mismo. La comparación es por
    // PERSONA (supabaseId), no por fila de Cliente: la ficha es por empresa y
    // comparar ids dejaba pasar el autoreferido hacia otra empresa o con la
    // cookie puesta al probar el propio enlace.
    if (referente.id === referidoClienteId) return
    const referidoCliente = await prisma.cliente.findUnique({
      where: { id: referidoClienteId },
      select: { supabaseId: true },
    })
    if (!referidoCliente) return
    if (referidoCliente.supabaseId === referente.supabaseId) return

    const huella = hashIp(ipAddress)

    if (referente.companyId === companyId) {
      // Programa de la empresa.
      const sospechoso = await esRegistroSospechoso(referente.id, huella, 'REGISTRO')
      await prisma.referido.create({
        data: {
          companyId,
          referenteClienteId: referente.id,
          referidoClienteId,
          // El vínculo se guarda para auditoría, pero marcado: no cuenta en el
          // embudo ni otorga puntos si la huella es sospechosa.
          sospechoso,
        },
      })
      await logReferralEvent({
        clienteId: referente.id,
        companyId,
        tipo: 'REGISTRO',
        meta: {
          referidoClienteId,
          ipHash: huella,
          ...(viaCookie ? { viaCookie: true } : {}),
          ...(sospechoso ? { sospechoso: true } : {}),
        },
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
        ...(viaCookie ? { viaCookie: true } : {}),
        ...(sospechoso ? { sospechoso: true } : {}),
      },
      ...(sospechoso ? { puntos: 0 } : {}),
    })
  } catch (e) {
    console.error('[referidos] vincularReferido error:', e)
  }
}
