import Link from 'next/link'
import { Check, Sparkles, Crown, Star } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { activeMembership } from '@/modules/cliente/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EstadoBadge } from '@/components/EstadoBadge'
import type { MembershipEstado } from '@/types'

export const dynamic = 'force-dynamic'

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-DO').format(n)
}

export default async function PlanesPage() {
  const user = await requireRole('CLIENTE')

  // Obtener el cliente con su empresa
  const cliente = user.metadata.clienteId
    ? await prisma.cliente.findUnique({
        where: { id: user.metadata.clienteId },
        include: {
          company: true,
          memberships: {
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })
    : null

  if (!cliente) {
    return <p className="text-slate-600">No se encontró tu información.</p>
  }

  // Obtener planes activos de la empresa del cliente
  const planes = await prisma.plan.findMany({
    where: { companyId: cliente.company.id, activo: true },
    orderBy: { precio: 'asc' },
  })

  const active = activeMembership(cliente.memberships)
  const latestMembership = cliente.memberships[0]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Oportunidades disponibles
        </h1>
        <p className="mt-1 text-slate-500">
          Elige el plan que mejor se adapte a ti en {cliente.company.name}
        </p>
      </div>

      {/* Estado actual */}
      {active && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-green-700">Ya tienes una membresía activa</p>
              <p className="text-lg font-semibold text-green-900">
                {active.plan.nombre} ·{' '}
                {active.plan.esIlimitado
                  ? 'Ilimitado'
                  : `${active.lavadosRestantes} usos restantes`}
              </p>
            </div>
            <Link href="/cliente/dashboard">
              <Button variant="outline">Ver mi Pase</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!active && latestMembership && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-amber-700">
                Tienes una membresía pendiente de pago
              </p>
              <p className="text-lg font-semibold text-amber-900">
                {latestMembership.plan.nombre}
              </p>
            </div>
            <EstadoBadge estado={latestMembership.estado as MembershipEstado} />
          </CardContent>
        </Card>
      )}

      {/* Grid de planes */}
      {planes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No hay planes disponibles en este momento.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {planes.map((plan, idx) => {
            const isFeatured = idx === 1 // el del medio como destacado
            return (
              <Card
                key={plan.id}
                className={
                  isFeatured
                    ? 'relative border-sky-300 shadow-lg ring-1 ring-sky-200'
                    : 'relative'
                }
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-sky-500 text-white hover:bg-sky-500">
                      <Star className="mr-1 h-3 w-3" />
                      Más popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {plan.esIlimitado ? (
                        <Crown className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-sky-500" />
                      )}
                      {plan.nombre}
                    </CardTitle>
                    {plan.esIlimitado && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Ilimitado
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-extrabold text-slate-900">
                      RD${formatPrice(Number(plan.precio))}
                      <span className="text-base font-normal text-slate-400">
                        /mes
                      </span>
                    </p>
                    {plan.descripcion && (
                      <p className="mt-2 text-sm text-slate-500">
                        {plan.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-700">
                      {plan.esIlimitado
                        ? 'Usos ilimitados'
                        : `${plan.lavadosIncluidos} usos incluidos`}
                    </p>
                    <p className="text-xs text-slate-500">Vigencia: 30 días</p>
                  </div>

                  {plan.beneficios.length > 0 && (
                    <ul className="space-y-2">
                      {plan.beneficios.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}

                  {active ? (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full"
                    >
                      Ya tienes plan activo
                    </Button>
                  ) : (
                    <Link href={`/cliente/pagar/${plan.id}`} className="block">
                      <Button
                        className={
                          isFeatured
                            ? 'w-full bg-sky-500 hover:bg-sky-400'
                            : 'w-full'
                        }
                      >
                        Quiero este plan
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Info adicional */}
      <Card className="bg-slate-50">
        <CardContent className="py-6 text-center text-sm text-slate-500">
          <p>
            ¿Tienes preguntas sobre los planes?{' '}
            <Link
              href="/cliente/perfil"
              className="font-medium text-sky-600 hover:underline"
            >
              Contáctanos
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
