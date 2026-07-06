import Link from 'next/link'
import { ADMIN_ROLES } from '@/types'
import { Plus } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { EmpleadosTable, type EmpleadoRow } from '@/components/admin/EmpleadosTable'

export const dynamic = 'force-dynamic'

export default async function EmpleadosPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)

  let empleados: EmpleadoRow[] = []
  try {
    const data = await prisma.user.findMany({
      where: {
        role: 'EMPLEADO',
        ...(companyId ? { companyId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })
    empleados = data
  } catch (e) {
    console.error('[admin-empleados]', e)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empleados</h1>
          <p className="text-slate-500">{empleados.length} empleados</p>
        </div>
        <Button asChild>
          <Link href="/admin/empleados/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo empleado
          </Link>
        </Button>
      </div>

      <EmpleadosTable data={empleados} />
    </div>
  )
}
