import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { MetodoPagoForm } from '@/components/admin/MetodoPagoForm'

export default async function EditarMetodoPagoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole(['ADMIN_EMPRESA', 'SUPERADMIN'])
  const { id } = await params

  const method = await prisma.metodoPago.findUnique({ where: { id } })
  if (!method) return notFound()

  const companyId = companyFilter(user)
  if (companyId && method.companyId !== companyId) return notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar método de pago</h1>
        <p className="text-slate-500">{method.nombre}</p>
      </div>
      <MetodoPagoForm
        existing={{
          id: method.id,
          tipo: method.tipo,
          nombre: method.nombre,
          titular: method.titular,
          numeroCuenta: method.numeroCuenta,
          tipoCuenta: method.tipoCuenta,
          instrucciones: method.instrucciones,
          activo: method.activo,
        }}
      />
    </div>
  )
}
