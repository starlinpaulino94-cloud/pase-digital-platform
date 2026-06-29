import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { EstadoBadge } from '@/components/EstadoBadge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { MembershipEstado } from '@/types'

export const dynamic = 'force-dynamic'

const ESTADOS: MembershipEstado[] = [
  'ACTIVA',
  'PENDIENTE',
  'VENCIDA',
  'CANCELADA',
]

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
}

export default async function MembresiasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const user = await requireRole(['ADMIN_EMPRESA', 'SUPERADMIN'])
  const { estado } = await searchParams
  const companyId = companyFilter(user)

  const estadoFilter =
    estado && ESTADOS.includes(estado as MembershipEstado)
      ? (estado as MembershipEstado)
      : undefined

  const fetchMemberships = () =>
    prisma.membership.findMany({
      where: {
        ...(companyId ? { cliente: { companyId } } : {}),
        ...(estadoFilter ? { estado: estadoFilter } : {}),
      },
      include: { plan: true, cliente: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

  let memberships: Awaited<ReturnType<typeof fetchMemberships>> = []
  try {
    memberships = await fetchMemberships()
  } catch (e) {
    console.error('[admin-membresias]', e)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Membresías</h1>
        <p className="text-slate-500">{memberships.length} resultados</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterLink label="Todas" href="/admin/membresias" active={!estadoFilter} />
        {ESTADOS.map((e) => (
          <FilterLink
            key={e}
            label={MAP_LABEL[e]}
            href={`/admin/membresias?estado=${e}`}
            active={estadoFilter === e}
          />
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Usos rest.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link
                      href={`/admin/clientes/${m.clienteId}`}
                      className="font-medium text-sky-600 hover:underline"
                    >
                      {m.cliente.nombre}
                    </Link>
                  </TableCell>
                  <TableCell>{m.plan.nombre}</TableCell>
                  <TableCell>
                    <EstadoBadge estado={m.estado as MembershipEstado} />
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {fmtDate(m.fechaInicio)}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {fmtDate(m.fechaVencimiento)}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {m.plan.esIlimitado ? 'Ilimitado' : m.lavadosRestantes}
                  </TableCell>
                </TableRow>
              ))}
              {memberships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    No se encontraron membresías.
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

const MAP_LABEL: Record<MembershipEstado, string> = {
  ACTIVA: 'Activas',
  PENDIENTE: 'Pendientes',
  VENCIDA: 'Vencidas',
  CANCELADA: 'Canceladas',
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string
  href: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'rounded-full bg-sky-500 px-4 py-1.5 text-sm font-medium text-white'
          : 'rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50'
      }
    >
      {label}
    </Link>
  )
}
