import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
}

export default async function EmpleadosPage() {
  const user = await requireRole(['ADMIN_EMPRESA', 'SUPERADMIN'])
  const companyId = companyFilter(user)

  const fetchEmpleados = () =>
    prisma.user.findMany({
      where: {
        role: 'EMPLEADO',
        ...(companyId ? { companyId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

  let empleados: Awaited<ReturnType<typeof fetchEmpleados>> = []
  try {
    empleados = await fetchEmpleados()
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Fecha de creación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empleados.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Link
                      href={`/admin/empleados/${e.id}`}
                      className="font-medium text-sky-600 hover:underline"
                    >
                      {e.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600">{e.email}</TableCell>
                  <TableCell className="text-slate-600">
                    {fmtDate(e.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
              {empleados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-500">
                    No hay empleados registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
