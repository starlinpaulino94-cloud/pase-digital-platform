import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { CrearOfertaForm } from '@/components/ofertas/CrearOfertaForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Crear regalo VIP' }

export default async function NuevaOfertaPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user) ?? user.metadata.companyId ?? null

  if (!companyId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Crear regalo VIP</h1>
        <p className="text-muted-foreground">Selecciona una empresa activa.</p>
      </div>
    )
  }

  const clientes = await prisma.cliente.findMany({
    where: { companyId },
    select: { id: true, nombre: true, email: true, telefono: true },
    orderBy: { nombre: 'asc' },
    take: 1000,
  })

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/ofertas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Regalos VIP
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Crear regalo VIP</h1>
        <p className="text-muted-foreground">
          Define el regalo, su regla de usos y la lista cerrada de clientes.
          Al crearlo obtendrás el link privado para compartir.
        </p>
      </div>

      <CrearOfertaForm clientes={clientes} />
    </div>
  )
}
