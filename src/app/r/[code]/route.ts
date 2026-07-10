import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { getAppUrl } from '@/lib/site'
import { logReferralEvent, hashIp, REF_COOKIE, REF_COOKIE_DIAS } from '@/lib/referidos'
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
  const ua = req.headers.get('user-agent') ?? ''
  // Los bots de vista previa (WhatsApp, Telegram, Facebook, etc.) visitan el
  // enlace al generar el preview e inflaban el conteo de clics. Se les
  // redirige igual, pero no cuentan.
  const esBot =
    /whatsapp|facebookexternalhit|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|skypeuripreview|viber|pinterest|googlebot|bingbot|applebot|yandex|ahrefs|semrush|bot\b|crawler|spider|preview|fetch|monitor|curl|wget|python|node-fetch|axios|okhttp|java\/|headless/i.test(
      ua
    )

  // Autoclic: el propio referente abriendo su enlace (para probarlo o copiarlo)
  // NO debe contar como clic ni inflar el embudo. Solo consultamos la sesión si
  // hay cookie de auth, para no penalizar al visitante referido (anónimo).
  let esDuenno = false
  const tieneSesion = req.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))
  if (tieneSesion) {
    const sessionUser = await getUser().catch(() => null)
    esDuenno = sessionUser?.metadata.clienteId === cliente.id
  }

  if (!esBot && !esDuenno && clickLimiter(`refclick:${ip}:${cliente.id}`)) {
    const canal = req.nextUrl.searchParams.get('c')
    const campana = req.nextUrl.searchParams.get('utm_campaign')
    await logReferralEvent({
      clienteId: cliente.id,
      companyId: cliente.companyId,
      tipo: 'CLICK',
      canal,
      meta: {
        dispositivo: /mobile|android|iphone|ipad/i.test(ua) ? 'móvil' : 'escritorio',
        ipHash: hashIp(ip),
        ...(campana ? { campana } : {}),
      },
    })
  }

  const res = NextResponse.redirect(
    `${base}/registro/${cliente.company.slug}?ref=${cliente.codigoReferido}`
  )
  // Atribución del Centro global MembeGo: si la persona termina registrándose
  // en OTRA empresa de la plataforma, el referente igual gana puntos globales.
  // No se coloca para el propio dueño del enlace (evita autoatribución).
  if (!esDuenno) {
    res.cookies.set(REF_COOKIE, cliente.codigoReferido, {
      maxAge: REF_COOKIE_DIAS * 24 * 60 * 60,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  }
  return res
}
