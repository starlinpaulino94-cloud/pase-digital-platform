import Link from 'next/link'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { MembresíasTable, type MembershipRow } from '@/components/admin/MembresíasTable'
import type { MembershipEstado } from '@/types'

export const dynamic = 'force-dynamic'

const ESTADOS: MembershipEstado[] = ['ACTIVA', 'PENDIENTE', 'VENCIDA', 'CANCELADA']

const MAP_LABEL: Record<MembershipEstado, string> = {
  ACTIVA: 'Activas',
  PENDIENTE: 'Pendientes',
  PENDIENTE_PAGO: 'Pend. pago',
  RECHAZADA: 'Rechazadas',
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

export default async function MembresiasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const user = await requireRole(ADMIN_ROLES)
  const { estado } = await searchParams
  const companyId = companyFilter(user)

  const estadoFilter =
    estado && ESTADOS.includes(estado as MembershipEstado)
      ? (estado as MembershipEstado)
      : undefined

  let memberships: MembershipRow[] = []
  try {
    const data = await prisma.membership.findMany({
      where: {
        ...(companyId ? { cliente: { companyId } } : {}),
        ...(estadoFilter ? { estado: estadoFilter } : {}),
      },
      include: { plan: true, cliente: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    memberships = data as unknown as MembershipRow[]
  } catch (e) {
    console.error('[admin-membresias]', e)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Membresías</h1>
        <p className="text-slate-500">{memberships.length} registros</p>
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

      <MembresíasTable data={memberships} />
    </div>
  )
}
