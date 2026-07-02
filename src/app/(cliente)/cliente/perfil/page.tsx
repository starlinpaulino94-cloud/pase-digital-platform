import { requireRole } from '@/lib/auth/guards'
import { getClienteFull } from '@/modules/cliente/queries'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/cliente/ProfileForm'
import { VehiculoForm } from '@/components/cliente/VehiculoForm'
import { DeleteVehiculoButton } from '@/components/cliente/DeleteVehiculoButton'
import { WhatsAppButton } from '@/components/cliente/WhatsAppButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const user = await requireRole('CLIENTE')
  const cliente = user.metadata.clienteId
    ? await getClienteFull(user.metadata.clienteId)
    : null

  if (!cliente) return <p className="text-muted-foreground">No se encontró tu información.</p>

  const isCarwash = cliente.company.type === 'carwash'
  const whatsapp = await prisma.whatsAppConfig.findUnique({
    where: { companyId: cliente.companyId },
  })

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Mi perfil</h1>
          <p className="text-sm text-muted-foreground">{cliente.company.name}</p>
        </div>
        {whatsapp?.activo && (
          <WhatsAppButton
            codigoPais={whatsapp.codigoPais}
            numero={whatsapp.numero}
            mensaje={whatsapp.mensajePlantilla}
          />
        )}
      </div>

      {/* Personal info */}
      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-muted-foreground" />
            Información personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            clienteId={cliente.id}
            nombre={cliente.nombre}
            email={cliente.email}
            telefono={cliente.telefono ?? null}
            avatarUrl={cliente.avatarUrl ?? null}
          />
        </CardContent>
      </Card>

      {/* Vehicles (carwash only) */}
      {isCarwash && (
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4 text-muted-foreground" />
              Mis vehículos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {cliente.vehiculos.length > 0 && (
              <ul className="divide-y divide-border/60">
                {cliente.vehiculos.map((v) => {
                  const label = `${v.marca} ${v.modelo} (${v.anio})${v.placa ? ` · ${v.placa}` : ''}`
                  return (
                    <li key={v.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2">
                          <Car className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{v.marca} {v.modelo} ({v.anio})</p>
                          <p className="text-xs text-muted-foreground">
                            {v.color}{v.placa ? ` · ${v.placa}` : ''}
                          </p>
                        </div>
                      </div>
                      <DeleteVehiculoButton vehiculoId={v.id} label={label} />
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="rounded-xl border border-dashed border-border p-5">
              <p className="mb-4 text-sm font-medium text-foreground">Agregar vehículo</p>
              <VehiculoForm />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
