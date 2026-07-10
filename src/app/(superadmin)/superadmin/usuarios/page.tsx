import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserCog, Users, Pencil } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ROL_LABEL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  GERENTE: 'Gerente',
  CAJERO: 'Cajero',
  RECEPCION: 'Recepción',
  MARKETING: 'Marketing',
  SUPERVISOR: 'Supervisor',
  EMPLEADO: 'Empleado',
  ADMIN_EMPRESA: 'Administrador (legacy)',
}

export default async function UsuariosStaffPage() {
  await requireRole('SUPERADMIN')

  let usuarios: {
    id: string
    name: string
    email: string
    role: string
    companyId: string | null
    company: { name: string } | null
    empresasAcceso: { company: { name: string } }[]
  }[] = []
  try {
    usuarios = await prisma.user.findMany({
      where: { role: { notIn: ['CLIENTE', 'SUPERADMIN'] } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        company: { select: { name: true } },
        empresasAcceso: { select: { company: { select: { name: true } } } },
      },
    })
  } catch (e) {
    console.error('[superadmin-usuarios]', e)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usuarios de staff</h1>
        <p className="text-slate-500">
          Administradores y equipo de las empresas. Edita su rol, sus datos y
          las empresas que puede gestionar cada uno.
        </p>
      </div>

      {usuarios.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">Sin usuarios de staff</p>
            <p className="text-sm">
              Crea una empresa con su administrador desde el panel de empresas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {usuarios.map((u) => {
            // Empresas visibles: la activa + los accesos extra (sin duplicar).
            const acceso = u.empresasAcceso.map((a) => a.company.name)
            const activa = u.company?.name
            const todas = [
              ...(activa ? [activa] : []),
              ...acceso.filter((n) => n !== activa),
            ]
            return (
              <Card key={u.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <UserCog className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {u.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <Link href={`/superadmin/usuarios/${u.id}`}>
                      <Button size="icon" variant="ghost" aria-label="Editar usuario">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {ROL_LABEL[u.role] ?? u.role}
                    </Badge>
                    {todas.length === 0 ? (
                      <span className="text-xs text-slate-400">Sin empresa asignada</span>
                    ) : (
                      todas.map((n) => (
                        <Badge
                          key={n}
                          variant="outline"
                          className={
                            n === activa
                              ? 'border-blue-200 bg-blue-50 text-xs text-blue-700'
                              : 'text-xs text-slate-600'
                          }
                        >
                          {n}
                          {n === activa && todas.length > 1 ? ' · activa' : ''}
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
