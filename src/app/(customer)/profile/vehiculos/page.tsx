export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCustomerByUserId } from '@/modules/clientes/queries'
import { getVehiclesByCustomer } from '@/modules/vehiculos/queries'
import { VehicleList } from '@/components/vehicles/VehicleList'
import { AddVehicleForm } from '@/components/vehicles/AddVehicleForm'

export default async function VehiculosPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'CLIENTE') redirect('/dashboard')

  const customer = session.dbUserId ? await getCustomerByUserId(session.dbUserId) : null
  if (!customer) redirect('/profile')

  const vehicles = await getVehiclesByCustomer(customer.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Mis Vehículos</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Administra los vehículos asociados a tu cuenta
        </p>
      </div>

      <VehicleList vehicles={vehicles} />

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Agregar vehículo</h2>
        <AddVehicleForm />
      </div>
    </div>
  )
}
