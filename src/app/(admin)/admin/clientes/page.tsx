import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { ClientesTable, type ClienteRow } from '@/components/admin/ClientesTable'

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)

  let clientes: ClienteRow[] = []
  try {
    const data = await prisma.cliente.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    clientes = data as ClienteRow[]
  } catch (e) {
    console.error('[admin-clientes]', e)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description={`${clientes.length} registros`} />

      <ClientesTable data={clientes} />
    </div>
  )
}
