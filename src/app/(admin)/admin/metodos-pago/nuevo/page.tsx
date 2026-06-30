import { requireRole } from '@/lib/auth/guards'
import { MetodoPagoForm } from '@/components/admin/MetodoPagoForm'

export default async function NuevoMetodoPagoPage() {
  await requireRole(['ADMIN_EMPRESA', 'SUPERADMIN'])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo método de pago</h1>
        <p className="text-slate-500">
          Configura las instrucciones que verán los clientes al pagar.
        </p>
      </div>
      <MetodoPagoForm />
    </div>
  )
}
