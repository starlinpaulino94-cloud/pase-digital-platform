import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAppUrl } from '@/lib/site'
import { logReferralEvent } from '@/lib/referidos'
import { createRateLimiter, getClientIdentifier } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Anti-abuso: máximo de clics contabilizados por IP para un mismo código.
// Los clics por encima del límite siguen redirigiendo, solo no suman puntos.
const clickLimiter = createRateLimiter({
  interval: 60 * 60 * 1000, // 1 hora
  maxRequests: 5,
})

/**
 * GET /r/[code] — enlace inteligente de referidos.
 * Registra el clic (canal, dispositivo) y redirige al registro de la empresa
 * del referente con su código largo (?ref=), que es el que valida el registro.
 * Acepta tanto el código corto (/r/8HJ2KL) como el largo.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const base = getAppUrl()
  const clean = code.trim()

  const cliente = await prisma.cliente
    .findFirst({
      where: {
        OR: [{ codigoCorto: clean.toUpperCase() }, { codigoReferido: clean }],
      },
      select: {
        id: true,
        codigoReferido: true,
        companyId: true,
        company: { select: { slug: true, isActive: true } },
      },
    })
    .catch(() => null)

  // Código inválido o empresa inactiva: al marketplace, sin tracking.
  if (!cliente || !cliente.company.isActive) {
    return NextResponse.redirect(`${base}/empresas`)
  }

  const ip = getClientIdentifier(req)
  if (clickLimiter(`refclick:${ip}:${cliente.id}`)) {
    const ua = req.headers.get('user-agent') ?? ''
    const canal = req.nextUrl.searchParams.get('c')
    const campana = req.nextUrl.searchParams.get('utm_campaign')
    await logReferralEvent({
      clienteId: cliente.id,
      companyId: cliente.companyId,
      tipo: 'CLICK',
      canal,
      meta: {
        dispositivo: /mobile|android|iphone|ipad/i.test(ua) ? 'móvil' : 'escritorio',
        ...(campana ? { campana } : {}),
      },
    })
  }

  return NextResponse.redirect(
    `${base}/registro/${cliente.company.slug}?ref=${cliente.codigoReferido}`
  )
}
