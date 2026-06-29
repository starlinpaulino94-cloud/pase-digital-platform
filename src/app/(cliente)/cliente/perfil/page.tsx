import { requireRole } from '@/lib/auth/guards'
import { getClienteBasic } from '@/modules/cliente/queries'
import { PerfilForm } from '@/components/cliente/PerfilForm'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const user = await requireRole('CLIENTE')

  if (!user.metadata.clienteId) {
    return <p className="text-slate-600">No se encontró tu información.</p>
  }

  let cliente: Awaited<ReturnType<typeof getClienteBasic>> = null
  try {
    cliente = await getClienteBasic(user.metadata.clienteId)
  } catch (e) {
    console.error('[cliente-perfil]', e)
    return (
      <p className="text-slate-600">
        No pudimos cargar tu perfil en este momento. Intenta de nuevo más tarde.
      </p>
    )
  }

  if (!cliente) {
    return <p className="text-slate-600">No se encontró tu información.</p>
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
        <p className="text-slate-500">{cliente.company.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <PerfilForm
            nombre={cliente.nombre}
            telefono={cliente.telefono ?? ''}
            email={cliente.email}
          />
        </CardContent>
      </Card>
    </div>
  )
}
