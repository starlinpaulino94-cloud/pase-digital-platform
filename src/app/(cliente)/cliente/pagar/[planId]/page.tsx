import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { PagoForm } from '@/components/pagos/PagoForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function PagarPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>
}) {
  const user = await requireRole('CLIENTE')
  const { planId } = await params

  const plan = await prisma.plan.findUnique({
    where: { id: planId, activo: true },
    include: { company: true },
  })

  if (!plan) notFound()

  // Verificar que el cliente pertenece a la misma empresa
  if (!user.metadata.clienteId) return notFound()
  const cliente = await prisma.cliente.findUnique({
    where: { id: user.metadata.clienteId },
  })
  if (!cliente || cliente.companyId !== plan.companyId) {
    return notFound()
  }

  // Verificar que no tiene membresía activa
  const active = await prisma.membership.findFirst({
    where: { clienteId: cliente.id, estado: 'ACTIVA' },
  })
  if (active) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-8 text-center">
            <p className="font-semibold text-green-900">
              Ya tienes una membresía activa
            </p>
            <Link
              href="/cliente/dashboard"
              className="mt-4 inline-block text-sky-600 hover:underline"
            >
              Ver mi Pase Digital
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Obtener cuentas bancarias activas de la empresa
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { companyId: plan.companyId, activa: true },
    select: {
      id: true,
      banco: true,
      titular: true,
      numero: true,
      tipoCuenta: true,
      instrucciones: true,
    },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/cliente/planes"
        className="inline-flex items-center text-sm text-sky-600 hover:underline"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a oportunidades
      </Link>

      {/* Resumen del plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{plan.nombre}</span>
            <span className="text-2xl font-bold text-sky-600">
              RD$ {new Intl.NumberFormat('es-DO').format(Number(plan.precio))}
              <span className="text-sm font-normal text-slate-400">/mes</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {plan.descripcion && (
            <p className="mb-3 text-slate-600">{plan.descripcion}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span>
              {plan.esIlimitado
                ? 'Usos ilimitados'
                : `${plan.lavadosIncluidos} usos incluidos`}
            </span>
            <span>Vigencia: 30 días</span>
            <span>{plan.company.name}</span>
          </div>
          {plan.beneficios.length > 0 && (
            <ul className="mt-3 space-y-1">
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
        </CardContent>
      </Card>

      {/* Formulario de pago */}
      <PagoForm
        planId={plan.id}
        planNombre={plan.nombre}
        planPrecio={Number(plan.precio)}
        bankAccounts={bankAccounts}
      />
    </div>
  )
}
